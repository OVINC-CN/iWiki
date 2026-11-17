from django.conf import settings
from django.conf.global_settings import LANGUAGE_COOKIE_NAME
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import connection
from ovinc_client.account.models import User
from ovinc_client.account.serializers import UserInfoSerializer
from ovinc_client.core.auth import SessionAuthenticate
from ovinc_client.core.logger import logger
from ovinc_client.core.viewsets import ListMixin, MainViewSet
from redis import ConnectionError as RedisConnectionError
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.home.serializers import I18nRequestSerializer

USER_MODEL: User = get_user_model()


class HomeView(MainViewSet):
    """
    Home View
    """

    queryset = USER_MODEL.get_queryset()
    authentication_classes = [SessionAuthenticate]

    def list(self, request, *args, **kwargs):
        msg = f"[{request.method}] Connect Success"
        return Response({"resp": msg, "user": UserInfoSerializer(instance=request.user).data})


class HealthViewSet(MainViewSet):
    """
    Health Check
    """

    authentication_classes = []
    enable_record_log = False

    @action(methods=["GET"], detail=False)
    def health(self, request, *args, **kwargs):
        # database ping
        try:
            connection.ensure_connection()
        except Exception as err:  # pylint: disable=broad-except
            logger.exception("[Healthy] database connection error: %s", err)
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR, data="database connection error")
        # redis ping
        try:
            result = cache.client.get_client().ping()
            if not result:
                raise RedisConnectionError("redis ping failed")
        except Exception as err:  # pylint: disable=broad-except
            logger.exception("[Healthy] redis connection error: %s", err)
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR, data="redis connection error")
        # success
        return Response()


class I18nViewSet(MainViewSet):
    """
    International
    """

    authentication_classes = [SessionAuthenticate]

    def create(self, request, *args, **kwargs):
        """
        Change Language
        """

        # Varify Request Data
        request_serializer = I18nRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        request_data = request_serializer.validated_data

        # Change Lang
        lang_code = request_data["language"]
        response = Response()
        response.set_cookie(
            LANGUAGE_COOKIE_NAME,
            lang_code,
            max_age=settings.SESSION_COOKIE_AGE,
            domain=settings.SESSION_COOKIE_DOMAIN,
            path=settings.SESSION_COOKIE_PATH,
            secure=settings.SESSION_COOKIE_SECURE or None,
            httponly=settings.SESSION_COOKIE_HTTPONLY or None,
            samesite=settings.SESSION_COOKIE_SAMESITE,
        )
        return response


class FeatureView(ListMixin, MainViewSet):
    """
    Feature Toggle
    """

    authentication_classes = [SessionAuthenticate]

    def list(self, request, *args, **kwargs):
        """
        List all features
        """

        return Response(
            data={
                # Encrypt disabled and search type configured
                "doc_fuzzy_search": bool(settings.DOC_SEARCH_TYPE)
            }
        )
