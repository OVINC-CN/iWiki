from rest_framework.permissions import BasePermission

from apps.permission.constants import PermissionItem
from apps.permission.models import UserPermission


class UploadFilePermission(BasePermission):
    """
    Upload File Permission
    """

    def has_permission(self, request, view):
        return UserPermission.check_permission(user=request.user, permission_item=PermissionItem.UPLOAD_FILE)
