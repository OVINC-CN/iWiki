import uuid
from dataclasses import dataclass

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy
from ovinc_client.core.constants import MAX_CHAR_LENGTH
from ovinc_client.core.models import BaseModel, ForeignKey, UniqIDField
from ovinc_client.core.utils import uniq_id_without_time


class COSLog(BaseModel):
    """
    COS Log
    """

    id = UniqIDField(gettext_lazy("ID"), primary_key=True)
    filename = models.CharField(gettext_lazy("File Name"), max_length=MAX_CHAR_LENGTH)
    key = models.CharField(gettext_lazy("File Path"), max_length=MAX_CHAR_LENGTH, unique=True)
    resp = models.JSONField(gettext_lazy("Response"), null=True, blank=True)
    owner = ForeignKey(gettext_lazy("Owner"), to="account.User", on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(gettext_lazy("Uploaded Time"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = gettext_lazy("COS Log")
        verbose_name_plural = verbose_name
        ordering = ["-uploaded_at"]

    @classmethod
    def build_key(cls, filename: str) -> str:
        # replace filename to uuid
        parts = filename.split(".")
        if len(parts) > 1:
            filename = f"{uuid.uuid4().hex}.{parts[-1]}"
        else:
            filename = uuid.uuid4().hex
        return (
            f"upload/"
            f"{timezone.now().astimezone(timezone.get_default_timezone()).strftime('%Y%m/%d')}/"
            f"{uniq_id_without_time().upper()[:10]}/{filename}"
        )


# pylint: disable=R0902
@dataclass
class COSCredential:
    """
    COS Credential
    """

    cos_url: str
    cos_bucket: str
    cos_region: str
    key: str
    secret_id: str
    secret_key: str
    token: str
    start_time: int
    expired_time: int
    cdn_sign: str
    cdn_sign_param: str = settings.QCLOUD_CDN_SIGN_KEY_URL_PARAM
    image_format: str = ""
