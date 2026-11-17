from dataclasses import asdict

from django.conf import settings
from ovinc_client.core.viewsets import MainViewSet
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.cos.client import STSClient
from apps.cos.exceptions import QCloudInitUnfinished
from apps.cos.models import COSLog
from apps.cos.permissions import UploadFilePermission
from apps.cos.serializers import GenerateTempSecretSerializer


class COSViewSet(MainViewSet):
    """
    COS
    """

    queryset = COSLog.objects.all()
    permission_classes = [UploadFilePermission]

    @action(methods=["POST"], detail=False)
    def temp_secret(self, request: Request, *args, **kwargs):
        """
        Generate New Temp Secret for COS
        """

        # check init
        if not settings.QCLOUD_SECRET_ID or not settings.QCLOUD_SECRET_KEY:
            raise QCloudInitUnfinished()

        # validate
        serializer = GenerateTempSecretSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_data = serializer.validated_data

        # generate
        data = STSClient.generate_cos_upload_credential(user=request.user, filename=request_data["filename"])
        return Response(asdict(data))
