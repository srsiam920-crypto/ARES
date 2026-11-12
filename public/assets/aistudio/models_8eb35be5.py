from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.db import models


class AstronautProfile(models.Model):
    """One profile per login account (Points 2, 4, 5).

    The profile picture and the background image are uploaded manually by an
    administrator from the Django admin panel (Point 5).
    """

    ROLE_CHOICES = [
        ("astronaut", "Astronaut"),
        ("cmo", "Crew Medical Officer"),
        ("captain", "Flight Commander"),
        ("ground", "Ground Station"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="ares_profile")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="astronaut")
    full_name = models.CharField(max_length=80)
    short_name = models.CharField(max_length=40, help_text="e.g. A. Vance")
    callsign = models.CharField(max_length=20, blank=True, help_text="e.g. ASTRO-03")
    crew_id = models.CharField(max_length=20, blank=True, help_text="e.g. #8842-AV")
    specialty = models.CharField(max_length=120, blank=True)

    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)
    background_image = models.ImageField(
        upload_to="backgrounds/", blank=True, null=True,
        help_text="Shown behind the POD UI when this astronaut is logged in.",
    )
    theme_color = models.CharField(
        max_length=7, default="#3186ff",
        help_text="Accent colour / fallback background tint (hex, e.g. #3186ff)",
    )

    # Baselines used by the simulated sensor feed
    baseline_hr = models.IntegerField(default=70)
    baseline_hrv = models.IntegerField(default=55)
    baseline_jitter = models.FloatField(default=2.0)
    baseline_sleep = models.IntegerField(default=88)

    # Hashed override code (captain + CMO only) - never stored in plain text
    override_code_hash = models.CharField(max_length=128, blank=True, editable=False)

    class Meta:
        ordering = ["callsign", "full_name"]

    def __str__(self):
        return f"{self.short_name} ({self.get_role_display()})"

    @property
    def is_crew(self):
        return self.role == "astronaut"

    @property
    def initials(self):
        parts = [p for p in self.full_name.replace(".", " ").split() if p]
        return "".join(p[0] for p in parts[:2]).upper() or "?"

    def set_override_code(self, raw):
        self.override_code_hash = make_password(raw)

    def check_override_code(self, raw):
        return bool(self.override_code_hash) and check_password(raw or "", self.override_code_hash)

    def picture_url(self):
        return self.profile_picture.url if self.profile_picture else ""

    def background_url(self):
        return self.background_image.url if self.background_image else ""


class BiometricLog(models.Model):
    astronaut = models.ForeignKey(
        AstronautProfile, on_delete=models.CASCADE, related_name="biometrics", null=True, blank=True
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    heart_rate = models.IntegerField(default=88)
    hrv = models.IntegerField(default=42)
    spo2 = models.IntegerField(default=98)
    voice_jitter = models.FloatField(default=3.2)
    sleep_quality = models.IntegerField(default=82)
    adi_score = models.FloatField(default=0.58)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Log at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')} - ADI: {self.adi_score}"


class ChatMessage(models.Model):
    SENDER_CHOICES = [
        ("crew", "Crew Member"),
        ("ares", "ARES-AI"),
    ]
    astronaut = models.ForeignKey(
        AstronautProfile, on_delete=models.CASCADE, related_name="messages", null=True, blank=True
    )
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender}: {self.message[:30]}"


class MediaItem(models.Model):
    """Point 6 - media library in the POD UI (audio / video / images)."""

    KIND_CHOICES = [("audio", "Audio"), ("video", "Video"), ("image", "Image"), ("other", "Other")]
    SOURCE_CHOICES = [("library", "Library"), ("pfa", "PFA attachment"), ("family", "Family message")]

    owner = models.ForeignKey(
        AstronautProfile, on_delete=models.CASCADE, related_name="media", null=True, blank=True,
        help_text="Leave empty to share this item with every astronaut.",
    )
    title = models.CharField(max_length=120)
    file = models.FileField(upload_to="media_library/")
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="other")
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default="library")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.kind == "other" and self.file:
            name = self.file.name.lower()
            if name.endswith((".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac")):
                self.kind = "audio"
            elif name.endswith((".mp4", ".webm", ".mov", ".m4v", ".ogv")):
                self.kind = "video"
            elif name.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
                self.kind = "image"
        super().save(*args, **kwargs)


class AIAssessment(models.Model):
    """Point 8 - AI-suggested condition screening shown in the CMO emergency section.

    This is decision SUPPORT only. A clinician (the CMO) must confirm.
    """

    SEVERITY_CHOICES = [("low", "Low"), ("moderate", "Moderate"), ("high", "High"), ("critical", "Critical")]

    astronaut = models.ForeignKey(AstronautProfile, on_delete=models.CASCADE, related_name="assessments")
    condition = models.CharField(max_length=120)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="low")
    confidence = models.FloatField(default=0.5)
    adi_score = models.FloatField(default=0.0)
    rationale = models.TextField(blank=True)
    recommendations = models.TextField(blank=True, help_text="One recommendation per line")
    reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        AstronautProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviews"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.astronaut.short_name}: {self.condition} ({self.severity})"

    def recommendation_list(self):
        return [r.strip() for r in self.recommendations.splitlines() if r.strip()]


class GroundCall(models.Model):
    """Point 7 - call to ground support from the CMO UI when the CMO cannot act."""

    PRIORITY_CHOICES = [("routine", "Routine"), ("urgent", "Urgent"), ("critical", "Critical")]
    STATUS_CHOICES = [
        ("requested", "Requested"),
        ("acknowledged", "Acknowledged"),
        ("in_progress", "Call in progress"),
        ("resolved", "Resolved"),
    ]
    REASON_CHOICES = [
        ("cmo_unable", "CMO unable to act / incapacitated"),
        ("beyond_scope", "Case beyond onboard medical scope"),
        ("second_opinion", "Need specialist second opinion"),
        ("equipment", "Medical equipment failure"),
        ("other", "Other"),
    ]

    raised_by = models.ForeignKey(AstronautProfile, on_delete=models.CASCADE, related_name="calls_raised")
    subject = models.ForeignKey(
        AstronautProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name="calls_about"
    )
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="urgent")
    reason = models.CharField(max_length=20, choices=REASON_CHOICES, default="cmo_unable")
    message = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="requested")
    ground_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Call #{self.pk} [{self.priority}] {self.status}"


class OverrideLog(models.Model):
    """Point 3 - audit trail of Flight Commander + CMO emergency override attempts."""

    target = models.ForeignKey(AstronautProfile, on_delete=models.CASCADE, related_name="override_logs")
    operator = models.ForeignKey(AstronautProfile, null=True, on_delete=models.SET_NULL, related_name="override_ops")
    agent = models.CharField(max_length=80)
    success = models.BooleanField(default=False)
    stage = models.CharField(max_length=12, default="verify")   # verify / execute
    detail = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.stage} {'OK' if self.success else 'FAIL'} -> {self.target.short_name}"
