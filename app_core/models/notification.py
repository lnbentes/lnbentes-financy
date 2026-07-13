from django.db import models
from django.contrib.auth.models import User
from .registration import RegistrationRequest

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    registration_request = models.ForeignKey(
        RegistrationRequest, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='notifications'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notificação para {self.user.username}: {self.title}"
