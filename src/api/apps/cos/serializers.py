from django.utils.translation import gettext, gettext_lazy
from rest_framework import serializers


class GenerateTempSecretSerializer(serializers.Serializer):
    """
    Temp Secret
    """

    filename = serializers.CharField(label=gettext_lazy("File Name"))

    def validate_filename(self, filename: str) -> str:
        if filename.find("/") != -1:
            raise serializers.ValidationError(gettext("File Name Invalid"))
        return filename
