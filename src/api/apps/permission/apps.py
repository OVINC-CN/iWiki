from django.apps import AppConfig
from django.utils.translation import gettext_lazy


class PermissionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.permission"
    verbose_name = gettext_lazy("Permission")
