from django.conf import settings
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin
from ovinc_client.core.exceptions import exception_handler

from apps.home.exceptions import UserNotInWhitelist


class UserWhitelistMiddleware(MiddlewareMixin):
    """
    Only Open to User in Whitelist
    """

    # pylint: disable=R1710
    def process_request(self, request):
        # ignore account url
        if request.path.startswith("/account/") or request.path.startswith("/health/"):
            return

        # empty whitelist
        if not settings.USER_WHITELIST:
            return

        user = getattr(request, "user", None)

        # user unset
        if not user:
            return self.build_response()

        # username
        username = getattr(user, "username", None)
        if username not in settings.USER_WHITELIST:
            return self.build_response()

    def build_response(self) -> HttpResponse:
        return exception_handler(exc=UserNotInWhitelist(), context={})
