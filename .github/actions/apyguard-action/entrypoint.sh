#!/bin/bash
set -e

echo "🔧 Running migrations..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

sleep 2

echo "🚀 Starting ApyGuard scanner..."
exec python runscanner.py "$@"