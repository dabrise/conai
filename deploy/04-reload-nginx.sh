#!/bin/bash
# ConAI Nginx Reload Script
# Run this after placing the nginx config

set -e

echo "Testing nginx configuration..."
sudo nginx -t

echo "Reloading nginx..."
sudo nginx -s reload

echo "Nginx reloaded successfully."
