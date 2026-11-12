import json
from datetime import timedelta
from functools import wraps

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from . import services
from .models import (AIAssessment, AstronautProfile, GroundCall, MediaItem, OverrideLog)

ETP_AGENTS = ["Haloperidol 5mg", "Diazepam 10mg", "Midazolam 5mg"]
MAX_FAILED_ATTEMPTS = 3
LOCKOUT_MINUTES = 5


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------
def _profile(request):
    return getattr(request.user, "ares_profile", None)


def role_required(*roles):
    """Allow only logged-in users whose profile role is in `roles` (JSON API use)."""
    def deco(fn):
        @wraps(fn)
        @login_required
        def wrapper(request, *args, **kwargs):
            prof = _profile(request)
            if not prof or prof.role not in roles:
                return JsonResponse({"status": "error", "message": "Not permitted for your role."}, status=403)
            return fn(request, prof, *args, **kwargs)
        return wrapper
    return deco


def _body(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return {}


def _crew_qs():
    return AstronautProfile.objects.filter(role="astronaut").select_related("user")


def _profile_card(p):
    return {
        "id": p.pk, "name": p.full_name, "short_name": p.short_name, "callsign": p.callsign,
        "crew_id": p.crew_id, "specialty": p.specialty, "initials": p.initials,
        "picture": p.picture_url(), "color": p.theme_color,
    }


def _call_dict(c):
    return {
        "id": c.pk, "priority": c.priority, "priority_label": c.get_priority_display(),
        "reason": c.get_reason_display(), "message": c.message, "status": c.status,
        "status_label": c.get_status_display(), "ground_response": c.ground_response,
        "raised_by": c.raised_by.short_name,
        "subject": c.subject.short_name if c.subject else "",
        "created_at": c.created_at.isoformat(), "updated_at": c.updated_at.isoformat(),
    }


def _media_dict(m):
    return {"id": m.pk, "title": m.title, "kind": m.kind, "url": m.file.url,
            "source": m.source, "shared": m.owner_id is None}


# --------------------------------------------------------------------------
# pages
# --------------------------------------------------------------------------
def login_view(request):
    """Point 4 - authentication. Crew cards fill in the username for quick selection."""
    if request.user.is_authenticated:
        return redirect("dashboard")
    error = ""
    if request.method == "POST":
        user = authenticate(request, username=request.POST.get("username", "").strip(),
                            password=request.POST.get("password", ""))
        if user is not None and getattr(user, "ares_profile", None):
            login(request, user)
            return redirect("dashboard")
        error = "Invalid credentials or no ARES profile attached to this account."
    people = AstronautProfile.objects.select_related("user").all()
    return render(request, "core/login.html", {"people": people, "error": error})


def logout_view(request):
    logout(request)
    return redirect("login")


@login_required
def dashboard(request):
    prof = _profile(request)
    if prof is None:
        return HttpResponse(
            "This account has no ARES profile. Create one in /admin/ -> Astronaut profiles.", status=403)

    ctx = {"profile": prof, "role": prof.role}
    boot = {
        "role": prof.role,
        "me": _profile_card(prof),
        "alarmThreshold": services.ADI_ALARM_THRESHOLD,
        "etpAgents": ETP_AGENTS,
    }

    if prof.role == "astronaut":
        ctx["chat_messages"] = prof.messages.all().order_by("-created_at")[:50][::-1]
        ctx["media_items"] = (MediaItem.objects.filter(owner=prof) |
                              MediaItem.objects.filter(owner__isnull=True)).order_by("-created_at")
        ctx["bg_url"] = prof.background_url()
        boot["media"] = [_media_dict(m) for m in ctx["media_items"]]
        boot["me"]["background"] = prof.background_url()
    else:
        ctx["crew"] = _crew_qs()
        boot["crew"] = [_profile_card(p) for p in ctx["crew"]]
        if prof.role in ("cmo", "captain"):
            ctx["override_log"] = OverrideLog.objects.select_related("target", "operator")[:10]
    ctx["boot"] = boot
    return render(request, "core/index.html", ctx)


# --------------------------------------------------------------------------
# biometrics / crew status
# --------------------------------------------------------------------------
@role_required("astronaut")
@require_GET
def get_biometrics_api(request, prof):
    log = services.simulate_reading(prof)
    return JsonResponse(services.reading_dict(log))


@role_required("cmo", "captain", "ground")
@require_GET
def crew_status_api(request, prof):
    out = []
    for p in _crew_qs():
        log = services.simulate_reading(p)
        a = services.refresh_assessment(p)
        d = _profile_card(p)
        d["vitals"] = services.reading_dict(log)
        d["assessment"] = services.assessment_dict(a)
        out.append(d)
    out.sort(key=lambda x: x["vitals"]["adi_score"], reverse=True)
    top = out[0] if out else None
    alarm = None
    if top and top["vitals"]["adi_score"] >= services.ADI_ALARM_THRESHOLD:
        alarm = {"name": top["short_name"], "adi": top["vitals"]["adi_score"]}
    return JsonResponse({"crew": out, "alarm": alarm})


@role_required("cmo", "captain")
@require_POST
def review_assessment(request, prof, pk):
    try:
        a = AIAssessment.objects.get(pk=pk)
    except AIAssessment.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Not found"}, status=404)
    a.reviewed, a.reviewed_by = True, prof
    a.save(update_fields=["reviewed", "reviewed_by"])
    return JsonResponse({"status": "success"})


# --------------------------------------------------------------------------
# AI PFA chat
# --------------------------------------------------------------------------
@role_required("astronaut")
@require_POST
def send_message(request, prof):
    text = (_body(request).get("message") or "").strip()[:1000]
    if not text:
        return JsonResponse({"status": "error", "message": "Empty message"}, status=400)
    services.save_chat(prof, "crew", text)
    reply, actions = services.pfa_reply(text, prof)
    services.save_chat(prof, "ares", reply)
    if actions.get("alert_cmo"):
        services.refresh_assessment(prof, force=True)
    return JsonResponse({"status": "success", "response": reply, "actions": actions})


# --------------------------------------------------------------------------
# Emergency override protocol (Point 3) - codes are verified SERVER-SIDE
# --------------------------------------------------------------------------
def _locked_out(prof):
    since = timezone.now() - timedelta(minutes=LOCKOUT_MINUTES)
    fails = OverrideLog.objects.filter(operator=prof, success=False, stage="verify", created_at__gte=since).count()
    return fails >= MAX_FAILED_ATTEMPTS


def _check_dual_key(captain_code, cmo_code):
    cap_ok = any(p.check_override_code(captain_code) for p in AstronautProfile.objects.filter(role="captain"))
    cmo_ok = any(p.check_override_code(cmo_code) for p in AstronautProfile.objects.filter(role="cmo"))
    return cap_ok, cmo_ok


def _override_common(request, prof, stage):
    data = _body(request)
    try:
        target = AstronautProfile.objects.get(pk=data.get("target"), role="astronaut")
    except (AstronautProfile.DoesNotExist, ValueError, TypeError):
        return None, JsonResponse({"status": "error", "message": "Select a valid crew member."}, status=400)
    agent = data.get("agent", "")
    if agent not in ETP_AGENTS:
        return None, JsonResponse({"status": "error", "message": "Unknown agent."}, status=400)
    if not data.get("checklist_ok"):
        return None, JsonResponse({"status": "error", "message": "Complete the safety checklist first."}, status=400)
    if _locked_out(prof):
        return None, JsonResponse({
            "status": "locked",
            "message": f"Too many failed attempts. Locked for {LOCKOUT_MINUTES} minutes."}, status=429)
    cap_ok, cmo_ok = _check_dual_key(data.get("captain_code", ""), data.get("cmo_code", ""))
    ok = cap_ok and cmo_ok
    detail = "Dual-key matched" if ok else (
        "Captain key invalid" if not cap_ok and cmo_ok else
        "CMO key invalid" if cap_ok and not cmo_ok else "Both keys invalid")
    OverrideLog.objects.create(target=target, operator=prof, agent=agent, success=ok, stage=stage, detail=detail)
    if not ok:
        return None, JsonResponse({"authorized": False, "message": "Invalid key code(s)."}, status=403)
    return (target, agent), None


@role_required("cmo", "captain")
@require_POST
def verify_override_key(request, prof):
    res, err = _override_common(request, prof, "verify")
    if err:
        return err
    return JsonResponse({"authorized": True, "message": "Dual-key authorization accepted."})


@role_required("cmo", "captain")
@require_POST
def execute_etp(request, prof):
    res, err = _override_common(request, prof, "execute")
    if err:
        return err
    target, agent = res
    # This prototype only records the event. A real system would drive hardware here.
    services.save_chat(target, "ares",
                       "ARES notice: a medical override protocol has been authorised by the Flight "
                       "Commander and CMO. Please stay calm - the CMO is with you.")
    return JsonResponse({
        "status": "success",
        "message": f"ETP authorised and logged: {agent} for {target.short_name} (simulation).",
    })


# --------------------------------------------------------------------------
# Ground support (Points 1 & 7)
# --------------------------------------------------------------------------
@role_required("cmo", "captain")
@require_POST
def create_ground_call(request, prof):
    data = _body(request)
    subject = AstronautProfile.objects.filter(pk=data.get("subject"), role="astronaut").first()
    priority = data.get("priority") if data.get("priority") in dict(GroundCall.PRIORITY_CHOICES) else "urgent"
    reason = data.get("reason") if data.get("reason") in dict(GroundCall.REASON_CHOICES) else "cmo_unable"
    call = GroundCall.objects.create(
        raised_by=prof, subject=subject, priority=priority, reason=reason,
        message=(data.get("message") or "")[:1000])
    return JsonResponse({"status": "success", "call": _call_dict(call)})


@role_required("cmo", "captain", "ground")
@require_GET
def list_ground_calls(request, prof):
    return JsonResponse({"calls": [_call_dict(c) for c in GroundCall.objects.select_related("raised_by", "subject")[:25]]})


@role_required("ground")
@require_POST
def update_ground_call(request, prof, pk):
    data = _body(request)
    try:
        call = GroundCall.objects.get(pk=pk)
    except GroundCall.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Not found"}, status=404)
    if data.get("status") in dict(GroundCall.STATUS_CHOICES):
        call.status = data["status"]
    if "response" in data:
        call.ground_response = (data["response"] or "")[:2000]
    call.save()
    return JsonResponse({"status": "success", "call": _call_dict(call)})


# --------------------------------------------------------------------------
# Media (Point 6)
# --------------------------------------------------------------------------
@role_required("astronaut")
@require_POST
def upload_media(request, prof):
    f = request.FILES.get("file")
    if not f:
        return JsonResponse({"status": "error", "message": "No file."}, status=400)
    if f.size > settings.ARES_MAX_UPLOAD_MB * 1024 * 1024:
        return JsonResponse({"status": "error", "message": f"Max {settings.ARES_MAX_UPLOAD_MB} MB."}, status=400)
    ctype = (f.content_type or "").split("/")[0]
    if ctype not in ("audio", "video", "image"):
        return JsonResponse({"status": "error", "message": "Only audio, video or image files."}, status=400)
    source = "pfa" if request.POST.get("source") == "pfa" else "library"
    item = MediaItem.objects.create(
        owner=prof, title=(request.POST.get("title") or f.name)[:120], file=f, kind=ctype, source=source)
    return JsonResponse({"status": "success", "item": _media_dict(item)})


@role_required("astronaut")
@require_POST
def delete_media(request, prof, pk):
    deleted, _ = MediaItem.objects.filter(pk=pk, owner=prof).delete()   # own items only
    return JsonResponse({"status": "success" if deleted else "error"}, status=200 if deleted else 404)
