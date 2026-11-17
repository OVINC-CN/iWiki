from django.conf import settings
from django.contrib import admin
from django.utils.translation import gettext_lazy

from apps.cos.models import COSLog


@admin.register(COSLog)
class COSLogAdmin(admin.ModelAdmin):
    list_display = ["id", "full_path", "is_success", "owner", "uploaded_at"]

    @admin.display(description=gettext_lazy("Is Success"), boolean=True)
    def is_success(self, log: COSLog) -> bool:
        return isinstance(log.resp, dict) and ("credentials" in log.resp or "ETag" in log.resp)

    @admin.display(description=gettext_lazy("Full Path"))
    def full_path(self, log: COSLog) -> str:
        return f"{settings.QCLOUD_COS_URL}/{log.key}"
