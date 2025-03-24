# Spamgourmet Extension Icons

This directory contains the icon files for the Spamgourmet Email Generator browser extension.

## Icons Overview

The icons represent the concept of email protection with the Spamgourmet shield design, providing a consistent visual identity across all platforms and sizes.

## Available Icon Files

The following icon files are included:

- **favicon.ico**: Multi-size icon file for browser favorites
- **favicon-16x16.png**: 16×16 pixel favicon for browsers
- **favicon-32x32.png**: 32×32 pixel favicon for browsers
- **apple-touch-icon.png**: 180×180 pixel icon for iOS devices
- **android-chrome-192x192.png**: 192×192 pixel icon for Android Chrome
- **android-chrome-512x512.png**: 512×512 pixel icon for Android Chrome
- **site.webmanifest**: Web app manifest file referencing the icons

## Icons Used in Extension

For the Chrome extension, we use the following icon files (copied to the images directory):

- 16×16 pixels: Used for browser toolbar and context menus
- 32×32 pixels: Used for browser tabs and extension management page
- 192×192 pixels: Used for extension management page and installation
- 512×512 pixels: Used for Chrome Web Store and high-resolution displays

## Icon Usage in Extension

These icons are referenced in the `manifest.json` file:

```json
"icons": {
  "16": "images/icon16.png",
  "32": "images/icon32.png",
  "192": "images/icon192.png",
  "512": "images/icon512.png"
},
"action": {
  "default_icon": {
    "16": "images/icon16.png",
    "32": "images/icon32.png",
    "192": "images/icon192.png",
    "512": "images/icon512.png"
  }
}
```

## Credits

These icons were created by HairyDuck for the Spamgourmet Email Generator extension in 2024.