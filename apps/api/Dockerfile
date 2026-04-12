# Minimal API image (php artisan serve). Use Octane + a process manager in real production.
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

FROM php:8.3-cli-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends curl libpq-dev sqlite3 libsqlite3-dev \
    && docker-php-ext-install pdo_pgsql pdo_sqlite pcntl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY . .
ENV APP_ENV=production
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
