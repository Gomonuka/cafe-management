from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def company_logo_path(instance, filename: str) -> str:
    return f"companies/{instance.id}/{filename}"

def validate_image_file(file_obj):
    # Validē attēla failu (jpg/png) un izmēru (<=50MB)
    if file_obj.size > MAX_FILE_SIZE:
        raise ValidationError("Fails ir pārāk liels. Maksimālais izmērs ir 50MB.")
    ct = getattr(file_obj, "content_type", None)
    if ct and ct not in {"image/jpeg", "image/png"}:
        raise ValidationError("Atļauti tikai JPG un PNG attēli.")

class Company(models.Model):
    # Uzņēmuma pamatdati
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=50)
    country = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    address_line1 = models.CharField(max_length=255)
    description = models.TextField(max_length=1000)

    # Logotips ir obligāts (COMP_004)
    logo = models.ImageField(upload_to=company_logo_path, validators=[validate_image_file], null=True, blank=True)

    # Statusi:
    # is_active = aktīvs/neaktīvs (COMP_011)
    # is_blocked = bloķēts (COMP_010)
    # deleted_at = soft-delete (COMP_006/COMP_007)
    is_active = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def soft_delete(self):
        # Soft-delete: atzīmē kā dzēstu un iestata neaktīvu
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["deleted_at", "is_active"])

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def is_open_now(self) -> bool:
        # Nosaka, vai uzņēmums šobrīd ir "atvērts" balstoties uz darba laikiem
        # Ja konkrētajai dienai ir 00:00-00:00, uzņēmums ir slēgts.
        now = timezone.localtime()
        weekday = (now.weekday())  # 0=Mon..6=Sun
        wh = self.working_hours.filter(weekday=weekday).first()
        if not wh:
            return False

        if wh.from_time == wh.to_time == timezone.datetime.strptime("00:00", "%H:%M").time():
            return False

        t = now.time()
        return wh.from_time <= t <= wh.to_time

    def __str__(self):
        return self.name


class CompanyWorkingHour(models.Model):
    class Weekday(models.IntegerChoices):
        MON = 0, "Mon"
        TUE = 1, "Tue"
        WED = 2, "Wed"
        THU = 3, "Thu"
        FRI = 4, "Fri"
        SAT = 5, "Sat"
        SUN = 6, "Sun"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="working_hours")
    weekday = models.IntegerField(choices=Weekday.choices)
    from_time = models.TimeField()
    to_time = models.TimeField()

    class Meta:
        unique_together = ("company", "weekday")
        ordering = ["weekday"]

    def clean(self):
        # Validācija: "No" <= "Līdz"
        # COMP_004 prasa "No" < "Līdz", bet atļauj 00:00-00:00 slēgtai dienai.
        if self.from_time == self.to_time:
            return  # pieļaujam slēgtu dienu (00:00-00:00)
        if self.from_time > self.to_time:
            raise ValidationError("Darba laiks nav korekts: 'No' nedrīkst būt lielāks par 'Līdz'.")

    def __str__(self):
        return f"{self.company_id} {self.weekday} {self.from_time}-{self.to_time}"
