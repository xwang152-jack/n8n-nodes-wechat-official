#!/bin/bash

# WeChat Official Account Plugin Installation Script for Docker n8n
# This script installs the n8n-nodes-wechat-official plugin in a Docker container

set -e

echo "=== WeChat Official Account Plugin Installation ==="
echo "Starting plugin installation..."

# Check if we're running inside a container
if [ ! -f /.dockerenv ]; then
    echo "Warning: This script is designed to run inside a Docker container"
fi

# Create custom extensions directory if it doesn't exist
echo "Creating custom extensions directory..."
mkdir -p /home/node/.n8n/custom

# Install the plugin from the tarball
echo "Installing plugin from tarball..."
cd /home/node/.n8n/custom

# Copy and extract the plugin
if [ -f "/tmp/n8n-nodes-wechat-official-1.0.0.tgz" ]; then
    echo "Found plugin tarball, extracting..."
    tar -xzf /tmp/n8n-nodes-wechat-official-1.0.0.tgz
    
    # Move extracted files to proper location
    if [ -d "package" ]; then
        mv package n8n-nodes-wechat-official
        echo "Plugin extracted successfully"
    else
        echo "Error: Package directory not found after extraction"
        exit 1
    fi
else
    echo "Error: Plugin tarball not found at /tmp/n8n-nodes-wechat-official-1.0.0.tgz"
    exit 1
fi

# Set proper permissions
echo "Setting permissions..."
chown -R node:node /home/node/.n8n/custom
chmod -R 755 /home/node/.n8n/custom

# Install plugin dependencies if package.json exists
if [ -f "/home/node/.n8n/custom/n8n-nodes-wechat-official/package.json" ]; then
    echo "Installing plugin dependencies..."
    cd /home/node/.n8n/custom/n8n-nodes-wechat-official
    npm install --production
fi

echo "Plugin installation completed successfully!"
echo "The WeChat Official Account plugin is now available in n8n."
echo "Please restart n8n to load the new plugin."