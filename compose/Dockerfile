FROM nginx:alpine

RUN apk add --no-cache \
    php83 php83-fpm php83-cli php83-mbstring php83-intl \
    php83-opcache php83-pdo php83-pdo_mysql php83-pdo_sqlite \
    php83-json php83-tokenizer php83-xml php83-xmlwriter php83-ctype \
    php83-session php83-simplexml php83-dom php83-phar php83-curl php83-fileinfo \
    php83-gd php83-zip php83-bcmath php83-exif php83-iconv php83-sodium \
    php83-pecl-redis php83-openssl \
    nodejs npm git curl bash unzip tzdata && \
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer


COPY nginx.conf /etc/nginx/nginx.conf


COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/bin/sh", "-c", "/entrypoint.sh"]
