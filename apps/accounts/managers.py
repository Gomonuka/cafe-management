from django.contrib.auth.models import UserManager as DjangoUserManager
from django.db import models

class ActiveUserQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)

class UserManager(DjangoUserManager):
    def get_queryset(self):
        return ActiveUserQuerySet(self.model, using=self._db).alive()

    def all_with_deleted(self):
        return ActiveUserQuerySet(self.model, using=self._db)
