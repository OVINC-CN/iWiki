from django.db import models
from django.db.models import Q, QuerySet
from django.utils import timezone
from django.utils.translation import gettext_lazy
from ovinc_client.account.models import User
from ovinc_client.core.constants import SHORT_CHAR_LENGTH
from ovinc_client.core.models import BaseModel, ForeignKey, UniqIDField

from apps.permission.constants import PermissionItem


class UserPermission(BaseModel):
    """
    User Permission
    """

    id = UniqIDField(gettext_lazy("ID"))
    user = ForeignKey(gettext_lazy("User"), to="account.User", on_delete=models.CASCADE)
    permission_item = models.CharField(
        gettext_lazy("Permission Item"), max_length=SHORT_CHAR_LENGTH, choices=PermissionItem.choices
    )
    expired_at = models.DateTimeField(gettext_lazy("Expired Time"), null=True, blank=True)
    authed_at = models.DateTimeField(gettext_lazy("Authorized Time"), auto_now_add=True)

    class Meta:
        verbose_name = gettext_lazy("User Permission")
        verbose_name_plural = verbose_name
        ordering = ["-authed_at"]
        unique_together = [["user", "permission_item"]]
        indexes = [
            models.Index(fields=["user", "permission_item", "expired_at"]),
            models.Index(fields=["user", "expired_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user}:{self.permission_item}"

    @classmethod
    def check_permission(cls, user: User, permission_item: PermissionItem) -> bool:
        return cls.objects.filter(
            Q(
                Q(user=user, permission_item=permission_item, expired_at__gt=timezone.now())
                | Q(user=user, permission_item=permission_item, expired_at__isnull=True)
            )
        ).exists()

    @classmethod
    def load_permissions(cls, user: User) -> QuerySet:
        return cls.objects.filter(
            Q(Q(user=user, expired_at__gt=timezone.now()) | Q(user=user, expired_at__isnull=True))
        )
