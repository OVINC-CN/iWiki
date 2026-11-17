from django.contrib import admin
from django.utils.translation import gettext_lazy

from apps.permission.models import UserPermission


@admin.register(UserPermission)
class UserPermissionAdmin(admin.ModelAdmin):
    list_display = ["id", "user__nick_name", "permission_item", "expired_at", "authed_at"]
    list_filter = ["permission_item"]

    @admin.display(description=gettext_lazy("Nick Name"))
    def user__nick_name(self, instance: UserPermission) -> str:
        return instance.user.nick_name
