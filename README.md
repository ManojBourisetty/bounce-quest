# Bounce Quest

A cute, offline-playable physics platformer built as an installable Progressive
Web App. Hop, bounce, and collect stars across 200 levels spanning 24 cozy
worlds — meadow, desert, forest, snowy peaks, sunset cliffs, a candy castle,
and beyond into autumn woods, beaches, carnivals, alpine peaks, and more.

## Features

- Squishy, hand-animated cartoon character with idle, run, jump, and landing poses
- Smooth platformer physics: variable jump height, coyote time, jump buffering
- 200 levels across 24 themed worlds with parallax backgrounds, spikes, and collectible stars — longer runs that suit both quick play and longer sessions
- Soft, pastel, child-friendly color palette
- Touch controls for mobile plus full keyboard support
- 100% offline after first load via a service worker — installable on iOS via Safari "Add to Home Screen"

## Play locally

Serve the folder with any static file server, e.g.:

```sh
npx http-server -p 8080
```

Then open `http://localhost:8080` in your browser.

## Install on iPhone

1. Open the game URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

The game will then launch full-screen and work without an internet connection.
