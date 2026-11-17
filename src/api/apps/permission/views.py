from ovinc_client.core.auth import SessionAuthenticate
from ovinc_client.core.viewsets import ListMixin, MainViewSet
from rest_framework.response import Response

from apps.permission.models import UserPermission
from apps.permission.serializers import UserPermissionListSerializer


class UserPermissionViewSet(ListMixin, MainViewSet):
    """
    User Permission
    """

    queryset = UserPermission.objects.all()
    authentication_classes = [SessionAuthenticate]

    def list(self, request, *args, **kwargs):
        """
        List Current User Permissions
        """

        queryset = UserPermission.load_permissions(request.user)
        return Response(UserPermissionListSerializer(queryset, many=True).data)
