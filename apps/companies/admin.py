from django.contrib import admin
from .models import Company, CompanyWorkingHours


class CompanyWorkingHoursInline(admin.TabularInline):
    model = CompanyWorkingHours
    extra = 0


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "country",
        "city",
        "address_line1",
        "phone",
        "email",
        "is_active",
    )
    list_filter = ("is_active", "country", "city")
    search_fields = ("name", "address_line1", "city", "country")
    inlines = [CompanyWorkingHoursInline]


@admin.register(CompanyWorkingHours)
class CompanyWorkingHoursAdmin(admin.ModelAdmin):
    list_display = ("company", "weekday", "opens_at", "closes_at", "is_closed")
    list_filter = ("company", "weekday", "is_closed")
