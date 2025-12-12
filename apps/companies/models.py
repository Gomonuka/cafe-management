from django.db import models
from django.utils import timezone


class Company(models.Model):
    """
    Entitātes Uzņēmums (Company) atribūti:
    1) Nosaukums - name
    2) Apraksts - description
    3) Logotips - logo 
    4) Adrese - country, city, address_line1 (address property)
    5) Tālrunis - phone
    6) E-pasts - email
    7) Vai ir aktīvs - is_active
    """

    name = models.CharField(max_length=255)  # Nosaukums
    description = models.TextField(blank=True)  # Apraksts
    country = models.CharField(max_length=100)         # Valsts
    city = models.CharField(max_length=100)            # Pilsēta
    address_line1 = models.CharField(max_length=255)   # Adreses pirmā līnija
    logo = models.ImageField(upload_to="company_logos/", null=True, blank=True)  # Logotips
    phone = models.CharField(max_length=50, blank=True)  # Tālrunis
    email = models.EmailField(blank=True)  # E-pasts
    is_active = models.BooleanField(default=True)  # Vai ir aktīvs

    @property
    def address(self):
        """Adrese kā viens atribūts"""
        return f"{self.address_line1}, {self.city}, {self.country}"
    
    @property
    def is_open_now(self) -> bool:
        """
        Atgriež True, ja uzņēmums šobrīd ir atvērts
        (pēc uzņēmuma darba laika).
        """
        # Берём локальное время (учитывая TIME_ZONE в settings.py)
        now = timezone.localtime()
        weekday = now.weekday()  # 0 = Pirmdiena ... 6 = Svētdiena
        weekday_db = weekday + 1 

        wh = self.working_hours.filter(weekday=weekday_db).first()
        if not wh or wh.is_closed:
            return False

        current_time = now.time()

        return wh.opens_at <= current_time <= wh.closes_at

    def __str__(self):
        return self.name


class CompanyWorkingHours(models.Model):
    """
    Entitātes Uzņēmuma darba laiks (CompanyWorkingHours) atribūti:
    - Nedēļas diena - weekday
    - Uzņēmums - company (FK to Company)
    - Atvēršanas laiks - opens_at
    - Slēgšanas laiks - closes_at
    - Vai ir slēgts - is_closed
    """

    class Weekday(models.IntegerChoices):
        MONDAY = 1, "Pirmdiena"
        TUESDAY = 2, "Otrdiena"
        WEDNESDAY = 3, "Trešdiena"
        THURSDAY = 4, "Ceturtdiena"
        FRIDAY = 5, "Piektdiena"
        SATURDAY = 6, "Sestdiena"
        SUNDAY = 7, "Svētdiena"

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="working_hours",
    )  # Uzņēmums
    weekday = models.IntegerField(choices=Weekday.choices)  # Nedēļas diena
    opens_at = models.TimeField(null=True, blank=True)  # Atvēršanas laiks
    closes_at = models.TimeField(null=True, blank=True)  # Slēgšanas laiks
    is_closed = models.BooleanField(default=False)  # Vai ir slēgts

    class Meta:
        unique_together = ("company", "weekday")

    def __str__(self):
        return f"{self.company} - {self.get_weekday_display()}"
