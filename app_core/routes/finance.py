from rest_framework.routers import DefaultRouter

from app_core.views import (
    CategoryViewSet, AccountViewSet, TransactionViewSet,
    BudgetViewSet, RecurringTransactionViewSet, PeerTransferViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'recurring', RecurringTransactionViewSet, basename='recurring')
router.register(r'peer-transfers', PeerTransferViewSet, basename='peer-transfer')

urlpatterns = router.urls
