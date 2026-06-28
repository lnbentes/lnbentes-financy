#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "==> Running database migrations..."
python manage.py migrate --noinput

if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "==> Checking and creating Django superuser..."
    python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print('Superuser created successfully.')
else:
    print('Superuser already exists.')
"
fi

echo "==> Collecting Django static files..."
python manage.py collectstatic --noinput

echo "==> Starting backend server..."
exec "$@"
