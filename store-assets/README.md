# Store assets

Source assets for the Google Play Store and Apple App Store listings,
generated to get ahead on submission prep (see `docs/RELEASE_GUIDE.md`).
These are **not** part of the PWA itself (not referenced by `manifest.json`
or cached by `sw.js`) — they're just inputs for the store listing pages.

## `ios-icon-1024.png`

1024x1024 master icon for App Store Connect, upscaled from
`icons/icon-512.png` (same artwork, no transparency, RGB). Apple adds
rounded corners automatically — do not round this image yourself.

## `screenshots/app-store-iphone-6.7/`

2796x1290 (landscape) screenshots sized for the iPhone 6.7" display class
required by App Store Connect:

1. `01-title.png` — title screen
2. `02-level-select.png` — level select grouped by world (Meadow, Desert, ...)
3. `03-gameplay-candy.png` — gameplay in the Candy world
4. `04-gameplay-spring.png` — spring bounce in action (Snow world)
5. `05-gameplay-moving.png` — moving platform near a level goal (Candy world)
6. `06-complete.png` — level complete screen with stars and confetti

## `screenshots/play-store-phone/`

Same six scenes captured at 1920x1080 (16:9), which fits Google Play's
screenshot requirement that the longer side be at most 2x the shorter side.

## Still needed before submission

- Feature graphic (1024x500 PNG) for the Play Store listing
- iPad screenshots, if supporting tablets on the App Store
- Real on-device screenshots are recommended in addition to/instead of these
  before final submission, but these are ready to use as-is if preferred
