from django.utils.translation import gettext_lazy
from rest_framework import status
from rest_framework.exceptions import APIException


class TempKeyGenerateFailed(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = gettext_lazy("Temp Key Generate Failed")


class UploadFailed(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = gettext_lazy("Upload Failed")


class QCloudInitUnfinished(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = gettext_lazy("QCloud Init Unfinished")
