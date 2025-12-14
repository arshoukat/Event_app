#!/bin/bash

# Create placeholder assets for Expo app
cd "$(dirname "$0")/.."

mkdir -p assets

# Create a simple 1024x1024 icon (blue square with white E)
# Using sips to create from a solid color
echo "Creating placeholder assets..."

# Create icon.png (1024x1024)
if command -v convert &> /dev/null; then
    convert -size 1024x1024 xc:'#007AFF' -pointsize 400 -fill white -gravity center -annotate +0+0 'E' assets/icon.png
elif command -v sips &> /dev/null; then
    # Create a simple colored image using sips
    # First, try to use an existing icon and resize it
    if [ -f "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns" ]; then
        sips -z 1024 1024 -s format png /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns --out assets/icon.png 2>/dev/null || \
        sips -s format png /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns --out assets/icon.png 2>/dev/null
    fi
fi

# Copy icon to adaptive-icon if icon was created
if [ -f "assets/icon.png" ]; then
    cp assets/icon.png assets/adaptive-icon.png
    echo "✓ Created icon.png and adaptive-icon.png"
else
    echo "⚠ Could not create icon.png automatically"
    echo "Please create a 1024x1024 PNG file at assets/icon.png"
fi

# Create splash.png (2048x2048) - white background
if command -v convert &> /dev/null; then
    convert -size 2048x2048 xc:white -pointsize 200 -fill '#007AFF' -gravity center -annotate +0+0 'Event App' assets/splash.png
elif [ -f "assets/icon.png" ]; then
    sips -z 2048 2048 assets/icon.png --out assets/splash.png 2>/dev/null || \
    cp assets/icon.png assets/splash.png
    echo "✓ Created splash.png"
else
    echo "⚠ Could not create splash.png automatically"
    echo "Please create a 2048x2048 PNG file at assets/splash.png"
fi

# Create favicon.png (48x48)
if [ -f "assets/icon.png" ]; then
    sips -z 48 48 assets/icon.png --out assets/favicon.png 2>/dev/null || \
    cp assets/icon.png assets/favicon.png
    echo "✓ Created favicon.png"
else
    echo "⚠ Could not create favicon.png automatically"
    echo "Please create a 48x48 PNG file at assets/favicon.png"
fi

echo ""
echo "Asset creation complete!"
echo "You can replace these placeholder images with your own designs later."

