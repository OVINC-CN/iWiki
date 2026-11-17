from rest_framework.routers import DefaultRouter

from apps.doc.views import DocViewSet, TagViewSet

router = DefaultRouter()
router.register("docs", DocViewSet)
router.register("tags", TagViewSet)

urlpatterns = router.urls
