from django.utils.translation import gettext_lazy
from ovinc_client.core.models import TextChoices


class PermissionItem(TextChoices):
    CREATE_DOC = "create_doc", gettext_lazy("Create Doc")
    UPLOAD_FILE = "upload_file", gettext_lazy("Upload File")
