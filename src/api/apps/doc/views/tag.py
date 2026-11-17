from ovinc_client.core.auth import SessionAuthenticate
from ovinc_client.core.viewsets import ListMixin, MainViewSet
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.doc.models import DocTag, Tag
from apps.doc.serializers.tag import TagInfoSerializer


class TagViewSet(ListMixin, MainViewSet):
    """
    Tag
    """

    queryset = Tag.objects.all()
    authentication_classes = [SessionAuthenticate]

    def list(self, request: Request, *args, **kwargs):
        """
        Tag List
        """

        tags = Tag.objects.all().order_by("name")
        serializer = TagInfoSerializer(instance=tags, many=True)
        return Response(data=serializer.data)

    @action(methods=["GET"], detail=False)
    def bound(self, request: Request, *args, **kwargs):
        """
        Bound Tags
        """

        tags = Tag.objects.filter(id__in=DocTag.objects.all().values("tag_id")).order_by("name")
        serializer = TagInfoSerializer(instance=tags, many=True)
        return Response(data=serializer.data)
