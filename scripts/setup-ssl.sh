#!/bin/bash
# setup-ssl.sh

DOMAIN="$1"
EMAIL="$2"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 iranianlaw.tk admin@iranianlaw.tk"
    exit 1
fi

echo "🔒 Setting up SSL certificate for $DOMAIN..."

# Install SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# Setup auto-renewal
sudo crontab -l > /tmp/crontab_backup 2>/dev/null || true
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /tmp/crontab_backup
sudo crontab /tmp/crontab_backup

echo "✅ SSL certificate installed successfully!"
echo "🔄 Auto-renewal configured for certificates"