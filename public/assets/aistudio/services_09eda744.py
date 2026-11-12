"""Business logic for ARES OS: simulated biometrics, ADI, AI screening, PFA replies.

IMPORTANT: everything here is a SIMULATION / decision-support prototype built
with transparent rules. It is not a validated medical device.
"""
import random
from datetime import timedelta

from django.utils import timezone

from .models import AIAssessment, BiometricLog, ChatMessage

ADI_ALARM_THRESHOLD = 0.70


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def compute_adi(hr, hrv, jitter, sleep_q):
    """Autonomic Distress Index 0..1 (higher = more distress)."""
    hr_s = clamp((hr - 60) / 60)
    hrv_s = clamp((70 - hrv) / 50)
    jit_s = clamp((jitter - 1.0) / 5.0)
    slp_s = clamp((100 - sleep_q) / 60)
    return round(0.30 * hr_s + 0.30 * hrv_s + 0.25 * jit_s + 0.15 * slp_s, 2)


def adi_level(adi):
    if adi >= ADI_ALARM_THRESHOLD:
        return "critical", "HIGH RISK"
    if adi >= 0.45:
        return "warning", "MODERATE"
    return "ok", "OPTIMAL"


def simulate_reading(profile):
    """Create the next simulated sensor reading, drifting from the last one."""
    last = profile.biometrics.first()
    if last:
        hr = last.heart_rate + random.randint(-3, 3)
        hrv = last.hrv + random.randint(-3, 3)
        jit = last.voice_jitter + random.uniform(-0.25, 0.25)
        slp = last.sleep_quality
        # gentle pull back to baseline so values don't run away
        hr += round((profile.baseline_hr - hr) * 0.15)
        hrv += round((profile.baseline_hrv - hrv) * 0.15)
        jit += (profile.baseline_jitter - jit) * 0.15
    else:
        hr, hrv, jit, slp = (profile.baseline_hr, profile.baseline_hrv,
                             profile.baseline_jitter, profile.baseline_sleep)
    hr = max(48, min(150, hr))
    hrv = max(10, min(100, hrv))
    jit = round(max(0.5, min(8.0, jit)), 1)
    spo2 = random.choice([97, 98, 98, 99])
    adi = compute_adi(hr, hrv, jit, slp)
    log = BiometricLog.objects.create(
        astronaut=profile, heart_rate=hr, hrv=hrv, spo2=spo2,
        voice_jitter=jit, sleep_quality=slp, adi_score=adi,
    )
    # keep the table small
    stale = profile.biometrics.values_list("pk", flat=True)[300:]
    if stale:
        BiometricLog.objects.filter(pk__in=list(stale)).delete()
    return log


def latest_reading(profile):
    return profile.biometrics.first() or simulate_reading(profile)


def reading_dict(log):
    level, label = adi_level(log.adi_score)
    return {
        "heart_rate": log.heart_rate, "hrv": log.hrv, "spo2": log.spo2,
        "voice_jitter": log.voice_jitter, "sleep_quality": log.sleep_quality,
        "adi_score": log.adi_score, "adi_level": level, "adi_label": label,
        "timestamp": log.timestamp.isoformat(),
    }


# --------------------------------------------------------------------------
# AI screening (Point 8)
# --------------------------------------------------------------------------
KEYWORD_RULES = [
    # (keywords, condition, severity, weight, recommendations)
    (("hurt myself", "kill myself", "end it", "want to die", "suicid", "no point living"),
     "Possible suicidal ideation (self-harm risk)", "critical", 1.0,
     ["Immediate in-person check-in by the CMO - do not leave the crew member alone",
      "Remove access to hazardous items and medications as per safety protocol",
      "Notify Flight Commander and open a CRITICAL ground-support call",
      "Use supportive, non-judgemental listening; avoid debate or minimising"]),
    (("hear voices", "voices", "watching me", "they are following", "not real", "someone is in the pod"),
     "Possible psychotic-spectrum symptoms (perceptual disturbance)", "high", 0.85,
     ["CMO clinical interview as soon as possible; keep the environment calm and low-stimulus",
      "Rule out organic causes first: hypoxia/CO2, sleep deprivation, infection, medication effects",
      "Open an URGENT ground-support call for psychiatric consultation",
      "Maintain continuous observation; do not argue with the experience"]),
    (("panic", "can't breathe", "cannot breathe", "chest tight", "heart racing", "breathing"),
     "Acute anxiety / panic episode", "moderate", 0.75,
     ["Guide paced breathing (4-7-8) and grounding (5-4-3-2-1 senses)",
      "Check SpO2 and cabin CO2 to rule out an environmental cause",
      "Activate Deep-Pressure Seat and 4 Hz delta acoustic tone in the Therapeutic Matrix",
      "Follow up with the CMO within 30 minutes"]),
    (("claustrophob", "walls closing", "trapped", "tight space", "confined"),
     "Confinement stress / claustrophobic reaction", "moderate", 0.7,
     ["Open the Earth-view / ocean soundscape; raise cabin lighting to a neutral level",
      "Encourage a change of module or task for 15-20 minutes if mission rules allow",
      "Brief grounding exercise with the AI PFA protocol"]),
    (("can't sleep", "cannot sleep", "insomnia", "no sleep", "awake all night", "exhausted"),
     "Sleep disturbance / circadian misalignment", "moderate", 0.65,
     ["Apply 1800K amber phototherapy 2 h before the sleep window; 6500K at wake time",
      "Review the work/rest schedule with the Flight Commander",
      "Use 4 Hz delta binaural tone and vibro-acoustic bed at bedtime"]),
    (("alone", "lonely", "hopeless", "empty", "no one cares", "miss home", "worthless", "homesick"),
     "Low mood / isolation distress", "moderate", 0.6,
     ["Schedule a private supportive talk with the CMO",
      "Prioritise family media / message delivery from Earth",
      "Encourage a structured peer activity with another crew member",
      "Monitor for worsening; escalate to ground psychiatric support if it persists > 48 h"]),
    (("angry", "furious", "can't take it", "snap", "hate everyone", "irritable"),
     "Irritability / interpersonal strain", "low", 0.5,
     ["Offer a time-out and a brief mediated check-in", "Review workload and crew-cohesion factors"]),
]

SEV_ORDER = {"low": 0, "moderate": 1, "high": 2, "critical": 3}


def _recent_crew_text(profile, minutes=720):
    since = timezone.now() - timedelta(minutes=minutes)
    qs = profile.messages.filter(sender="crew", created_at__gte=since).values_list("message", flat=True)
    return " ".join(qs).lower()


def run_assessment(profile):
    """Return (condition, severity, confidence, adi, rationale, recommendations[])."""
    log = latest_reading(profile)
    adi = log.adi_score
    window = list(profile.biometrics.all()[:10])
    avg_adi = sum(l.adi_score for l in window) / len(window) if window else adi
    text = _recent_crew_text(profile)

    findings = []
    for keys, cond, sev, weight, recs in KEYWORD_RULES:
        hit = [k for k in keys if k in text]
        if hit:
            findings.append((SEV_ORDER[sev], weight, cond, sev, recs,
                             f"Crew messages mention: {', '.join(hit[:3])}."))

    # Physiological patterns
    if log.heart_rate >= 95 and log.hrv <= 35 and log.voice_jitter >= 3.5:
        findings.append((1, 0.7, "Acute stress reaction (autonomic arousal)", "moderate",
                         ["Start the PFA grounding sequence and paced breathing",
                          "Reduce stimulation: dim lights to 15%, theta (6 Hz) acoustic tone",
                          "CMO check-in within 30 minutes"],
                         f"HR {log.heart_rate} bpm, HRV {log.hrv} ms and voice jitter {log.voice_jitter}% "
                         "together indicate sustained sympathetic arousal."))
    if log.sleep_quality <= 65:
        findings.append((1, 0.65, "Sleep deprivation / fatigue risk", "moderate",
                         ["Protect a full sleep period; apply circadian phototherapy",
                          "Reduce safety-critical tasks until recovered"],
                         f"Sleep quality score is {log.sleep_quality}%."))
    if log.spo2 <= 94:
        findings.append((2, 0.8, "Possible hypoxia / cabin air issue", "high",
                         ["Verify SpO2 sensor placement, then check cabin O2 / CO2 immediately",
                          "Notify Flight Commander of a possible environmental fault"],
                         f"SpO2 is {log.spo2}%."))
    if avg_adi >= ADI_ALARM_THRESHOLD:
        findings.append((2, 0.8, "Sustained high distress (ADI above alarm threshold)", "high",
                         ["CMO in-person assessment now",
                          "Open an URGENT ground-support call if the CMO needs backup"],
                         f"Average ADI over the last {len(window)} readings is {avg_adi:.2f}."))

    if not findings:
        if adi >= 0.45:
            return ("Elevated stress - monitoring", "low", 0.55, adi,
                    f"ADI {adi:.2f} is above the optimal band but no specific pattern was detected.",
                    ["Continue passive monitoring", "Offer the AI PFA protocol", "Re-assess in 30 minutes"])
        return ("No concerning pattern", "low", 0.9, adi,
                f"Vitals and recent messages are within the expected range (ADI {adi:.2f}).",
                ["Routine monitoring only"])

    findings.sort(key=lambda f: (f[0], f[1]), reverse=True)
    top = findings[0]
    # merge rationale/recs of the top 2 findings
    rationale = " ".join(f[5] for f in findings[:2])
    recs = []
    for f in findings[:2]:
        for r in f[4]:
            if r not in recs:
                recs.append(r)
    recs.append("This is an AI suggestion for decision support - the CMO must confirm clinically; "
                "any medication decision rests with the CMO and ground medical support.")
    return (top[2], top[3], round(top[1], 2), adi, rationale, recs)


def refresh_assessment(profile, force=False):
    """Compute and persist an assessment (re-using the last one if nothing changed)."""
    condition, severity, conf, adi, rationale, recs = run_assessment(profile)
    last = profile.assessments.first()
    recent = last and (timezone.now() - last.created_at) < timedelta(minutes=5)
    if last and recent and not force and last.condition == condition and last.severity == severity:
        last.adi_score = adi
        last.save(update_fields=["adi_score"])
        return last
    return AIAssessment.objects.create(
        astronaut=profile, condition=condition, severity=severity, confidence=conf,
        adi_score=adi, rationale=rationale, recommendations="\n".join(recs),
    )


def assessment_dict(a):
    return {
        "id": a.pk, "condition": a.condition, "severity": a.severity,
        "confidence": a.confidence, "adi_score": a.adi_score,
        "rationale": a.rationale, "recommendations": a.recommendation_list(),
        "reviewed": a.reviewed, "created_at": a.created_at.isoformat(),
    }


# --------------------------------------------------------------------------
# PFA chat replies (Psychological First Aid)
# --------------------------------------------------------------------------
def pfa_reply(text, profile):
    """Return (reply, actions) - actions are Therapeutic Matrix settings the UI applies."""
    t = text.lower()
    name = profile.short_name
    if any(k in t for k in ("kill myself", "hurt myself", "want to die", "suicid", "end it")):
        return (f"{name}, thank you for telling me. I'm taking this seriously and I'm alerting the Crew "
                "Medical Officer right now. You are not alone - please stay where you are and keep talking to me. "
                "Try one slow breath with me: in for 4, out for 6.",
                {"binaural": 4, "seat_pressure": 14, "soundscape": "ocean", "alert_cmo": True})
    if "claustrophob" in t:
        return ("Understood. Elevating seat pressure to 16 kPa (deep-touch grounding) and switching the soundscape to "
                "Pacific Ocean Surf. Look at the furthest point you can see and name three things you notice.",
                {"seat_pressure": 16, "soundscape": "ocean"})
    if "breathing" in t or "panic" in t or "can't breathe" in t:
        return ("Pacing a 4-7-8 rhythm: inhale 4 seconds, hold 7, exhale 8. I'm pulsing the cyan light with the "
                "inhale and lowering the binaural tone to 4 Hz delta.",
                {"binaural": 4, "photo": "sleep", "brightness": 20})
    if any(k in t for k in ("sleep", "tired", "insomnia", "awake")):
        return ("Sleep is a priority. I'm switching to 1800K amber light at low intensity and a 4 Hz delta tone, "
                "and enabling the vibro-acoustic bed at 40 Hz. Would you like me to narrate a short wind-down?",
                {"photo": "sleep", "brightness": 10, "binaural": 4, "vibro": 40, "soundscape": "rainforest"})
    if any(k in t for k in ("alone", "lonely", "miss", "home", "family")):
        return ("Missing home is a very human response to this kind of distance. There is a family message "
                "waiting in your Media Library - would you like to open it? I can also play the rain soundscape.",
                {"soundscape": "rainforest"})
    return ("Acknowledged. I'm adjusting the Therapeutic Matrix and keeping ADI monitoring active. "
            "Tell me more about how you feel right now - and tell me if you'd like me to alert the CMO.",
            {})


def save_chat(profile, sender, text):
    return ChatMessage.objects.create(astronaut=profile, sender=sender, message=text)
