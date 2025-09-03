#!/bin/bash
# dns-setup.sh
echo "=== DNS Configuration Helper ==="

read -p "Enter your domain name (e.g., iranianlaw.tk): " DOMAIN
read -p "Enter your server IP address: " SERVER_IP

echo ""
echo "Configure these DNS records in your domain provider:"
echo "Type    | Name | Value"
echo "--------|------|------"
echo "A       | @    | $SERVER_IP"
echo "A       | www  | $SERVER_IP"
echo "CNAME   | api  | $DOMAIN"
echo ""
echo "After DNS propagation (5-30 minutes), your site will be available at:"
echo "https://$DOMAIN"