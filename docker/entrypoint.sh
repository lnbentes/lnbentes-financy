#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Collecting Django static files..."
python manage.py collectstatic --noinput

echo "==> Starting backend server..."
exec "$@"
