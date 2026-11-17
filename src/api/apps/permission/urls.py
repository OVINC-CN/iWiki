from rest_framework.routers import DefaultRouter

from apps.permission.views import UserPermissionViewSet

router = DefaultRouter()
router.register("permissions", UserPermissionViewSet)

urlpatterns = router.urls
