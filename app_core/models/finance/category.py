import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    TYPE_CHOICES = [
        ('INCOME', 'Receita'),
        ('EXPENSE', 'Despesa'),
        ('BOTH', 'Ambos'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='categories', null=True, blank=True
    )
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='pricetag-outline')
    color = models.CharField(max_length=7, default='#22c55e')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name
