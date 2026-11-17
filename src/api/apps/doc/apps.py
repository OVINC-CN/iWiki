from django.apps import AppConfig
from django.utils.translation import gettext_lazy


class DocConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.doc"
    verbose_name = gettext_lazy("Doc")
