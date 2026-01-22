# HUM Desktop App

Native desktop application built with Tauri 2.0.

## Development

```bash
npm install
npm run tauri:dev
```

## Building

```bash
npm run tauri:build
```

This creates optimized installers in `src-tauri/target/release/bundle/`

## Memory Usage

- **Before (Browser)**: ~800-1200MB
- **After (Tauri)**: ~80-150MB (85% reduction!)

## Features

- ✅ Native performance
- ✅ System tray integration
- ✅ Auto-updates ready
- ✅ Tiny bundle size (~5-10MB)
- ✅ Cross-platform (Windows, macOS, Linux)
