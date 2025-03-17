#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p icons

# Convert SVG to different PNG sizes
for size in 16 32 72 96 128 144 152 167 180 192 384 512; do
    convert -background none -size ${size}x${size} icons/icon.svg icons/icon-${size}.png
done

# Create favicon.ico (16x16 and 32x32)
convert icons/icon-16.png icons/icon-32.png icons/favicon.ico

# Rename specific sizes for favicon
cp icons/icon-16.png icons/favicon-16x16.png
cp icons/icon-32.png icons/favicon-32x32.png

echo "Icons generated successfully!"
