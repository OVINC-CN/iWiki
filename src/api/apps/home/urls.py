from rest_framework.routers import DefaultRouter

from apps.home.views import FeatureView, HealthViewSet, HomeView, I18nViewSet

router = DefaultRouter()
router.register("", HomeView)
router.register("", HealthViewSet, basename="health")
router.register("i18n", I18nViewSet, basename="i18n")
router.register("features", FeatureView, basename="feature")

urlpatterns = router.urls
