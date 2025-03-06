#!/bin/bash

SRC_DIR="./src"
BUILD_DIR="./build"
BUILD_DIR_ABSOLUTE=$(realpath "$BUILD_DIR")
MANIFEST_FILE="$SRC_DIR/manifest.json"
CURRENT_VERSION=$(jq -r '.version' "$MANIFEST_FILE")
VERSION="${1:-$CURRENT_VERSION}"

if ! mkdir -p "$BUILD_DIR"; then
    echo "Failed to create build directory: $BUILD_DIR"
    exit 1
fi

echo "Build directory confirmed: $BUILD_DIR"

if [ "$#" -eq 1 ]; then
    if ! jq --indent 4 "(.version |= \"$VERSION\")" "$MANIFEST_FILE" > "$MANIFEST_FILE.tmp"; then
        echo "Failed to update version in $MANIFEST_FILE"
        exit 1
    fi
    mv "$MANIFEST_FILE.tmp" "$MANIFEST_FILE"
    echo "Updated $MANIFEST_FILE version to: $VERSION"
fi

TMP_DIR=$(mktemp -d)
TMP_ZIP_DIR="$TMP_DIR/zip"
TMP_XPI_DIR="$TMP_DIR/xpi"

if ! mkdir -p "$TMP_ZIP_DIR" "$TMP_XPI_DIR"; then
    echo "Failed to create temporary build directories"
    exit 1
fi

echo "Created temporary directories: $TMP_ZIP_DIR, $TMP_XPI_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

cp -r "$SRC_DIR"/* "$TMP_ZIP_DIR" || { echo "Failed to copy source files to zip directory"; exit 1; }
cp -r "$SRC_DIR"/* "$TMP_XPI_DIR" || { echo "Failed to copy source files to xpi directory"; exit 1; }

echo "Copied $SRC_DIR to [$TMP_ZIP_DIR, $TMP_XPI_DIR]"

find . -name "LICENSE"* -exec cp {} "$TMP_ZIP_DIR" \; || { echo "Failed to copy LICENSE files to zip directory"; exit 1; }
find . -name "LICENSE"* -exec cp {} "$TMP_XPI_DIR" \; || { echo "Failed to copy LICENSE files to xpi directory"; exit 1; }

echo "Copied LICENSE to [$TMP_ZIP_DIR, $TMP_XPI_DIR]"


# Firefox (xpi) manifest modifications
if ! jq --indent 4 '. + {browser_specific_settings: {gecko: {id: "xdebug-helper@JetBrains"}}}' "$TMP_XPI_DIR/manifest.json" > "$TMP_XPI_DIR/manifest.json.tmp"; then
    echo "Failed to add browser-specific settings to Firefox manifest"
    exit 1
fi
mv "$TMP_XPI_DIR/manifest.json.tmp" "$TMP_XPI_DIR/manifest.json"
echo "Added browser-specific settings to Firefox manifest"

# Modify for Firefox background script compatibility:
if ! jq --indent 4 'del(.background.service_worker) + {background: {scripts: ["service_worker.js"]}}' "$TMP_XPI_DIR/manifest.json" > "$TMP_XPI_DIR/manifest.json.tmp"; then
    echo "Failed to update Firefox background script in manifest"
    exit 1
fi

mv "$TMP_XPI_DIR/manifest.json.tmp" "$TMP_XPI_DIR/manifest.json"
echo "Updated Firefox background script in manifest"

( cd "$TMP_ZIP_DIR" && zip -T -u -r "$BUILD_DIR_ABSOLUTE/xdebug-helper@$VERSION.zip" * ) || { echo "Failed to create zip archive"; exit 1; }
( cd "$TMP_XPI_DIR" && zip -T -u -r "$BUILD_DIR_ABSOLUTE/xdebug-helper@$VERSION.xpi" * ) || { echo "Failed to create xpi archive"; exit 1; }

echo "Build $VERSION complete: [$BUILD_DIR/xdebug-helper@$VERSION.xpi, $BUILD_DIR/xdebug-helper@$VERSION.zip]"
