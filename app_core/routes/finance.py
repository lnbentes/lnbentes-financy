from rest_framework.routers import DefaultRouter

from app_core.views import CategoryViewSet, AccountViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = router.urls
