#!/bin/bash

# Build script for HRM Auto Extension

# Get version from manifest.json
VERSION=$(grep -Po '"version":\s*"\K[^"]*' manifest.json)

echo "Building HRM Auto Extension v$VERSION..."

# Create temporary directory
BUILD_DIR="extension-build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Copy extension files
echo "Copying extension files..."
cp manifest.json $BUILD_DIR/
cp background.js $BUILD_DIR/
cp content.js $BUILD_DIR/
cp popup.html $BUILD_DIR/
cp popup.css $BUILD_DIR/
cp popup.js $BUILD_DIR/
cp -r icons $BUILD_DIR/

# Create zip file
OUTPUT_FILE="hrm-auto-extension-v${VERSION}.zip"
echo "Creating $OUTPUT_FILE..."
cd $BUILD_DIR
zip -r ../$OUTPUT_FILE . -q
cd ..

# Cleanup
rm -rf $BUILD_DIR

echo "✓ Build complete: $OUTPUT_FILE"
echo ""
echo "To install:"
echo "1. Extract the zip file"
echo "2. Open chrome://extensions/"
echo "3. Enable Developer mode"
echo "4. Click 'Load unpacked' and select the extracted folder"
