from rest_framework.serializers import ModelSerializer

from apps.doc.models import Tag


class TagInfoSerializer(ModelSerializer):
    """
    Tag Info
    """

    class Meta:
        model = Tag
        fields = ["id", "name"]
