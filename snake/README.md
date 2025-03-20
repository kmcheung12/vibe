# Snake

A mobile-friendly WebGL snake game built with Three.js, featuring AI-controlled bots and offline support.

## Features

- WebGL-powered 3D graphics using Three.js
- Touch-optimized controls for mobile devices
- AI-controlled bot snakes with different behaviors
- Offline support via PWA capabilities
- Local high score system
- Responsive design for all devices
- Boundary-bouncing mechanics for forgiving gameplay

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Controls

- Touch and drag anywhere on the screen to control snake direction
- Snake follows touch position
- Collect glowing orbs to grow
- Avoid collisions with other snakes
- Bounce off boundaries instead of dying

## Technical Stack

- Three.js for 3D rendering
- Vanilla JavaScript (ES6+)
- Vite for bundling and development
- Service Workers for offline support
- LocalStorage for game data persistence

## Browser Support

Optimized for modern mobile browsers:
- Chrome for Android
- Safari for iOS
- Firefox for Android

## Performance

- Targets 60 FPS on mid-range mobile devices
- Optimized WebGL rendering
- Efficient collision detection
- Responsive touch controls
