from django.utils.translation import gettext_lazy
from rest_framework.exceptions import APIException


class DocSearchTypeInvalid(APIException):
    status_code = 500
    default_detail = gettext_lazy("Doc Search Type Invalid")
