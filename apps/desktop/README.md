# BelSuite Desktop

The desktop app is an Electron shell around the existing BelSuite web frontend with a video-editing-first route.

## Default behavior
- In development, the desktop app opens `http://localhost:3000/video`
- You can override the route with `BELSUITE_DESKTOP_URL`

## Commands
- `npm install`
- `npm run dev`

## Focus
- Video editing and render monitoring
- Fast access to `/video` and `/video/[id]`
- Native shell hooks through the preload bridge