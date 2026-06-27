
from django.contrib import admin

from app_core.models import Category, Account, Transaction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'icon', 'color')
    list_filter = ('type',)
    search_fields = ('name',)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'balance', 'color')
    list_filter = ('type',)
    search_fields = ('name',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('description', 'type', 'method', 'amount', 'date', 'account', 'user')
    list_filter = ('type', 'method', 'date')
    search_fields = ('description',)
    date_hierarchy = 'date'
    raw_id_fields = ('user', 'account', 'to_account', 'category')




