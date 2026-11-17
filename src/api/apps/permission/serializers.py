from rest_framework.serializers import ModelSerializer

from apps.permission.models import UserPermission


class UserPermissionListSerializer(ModelSerializer):
    """
    User Permission
    """

    class Meta:
        model = UserPermission
        fields = ["permission_item", "expired_at"]
