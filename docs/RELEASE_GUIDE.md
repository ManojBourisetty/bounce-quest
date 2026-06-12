# Releasing Bounce Quest to the App Stores

Bounce Quest is a static, 100% offline Progressive Web App (PWA). To publish
it on the Google Play Store and Apple App Store, it needs to be wrapped in a
small native shell. This guide covers the whole journey: prerequisites,
wrapping the PWA, store listing requirements, security/privacy practices, and
what to do for every future update.

The good news: because the game already works fully offline and stores
nothing on a server, the security/privacy story is very simple, and the
wrapping step is mostly mechanical.

---

## 1. Recommended approach: PWABuilder

[PWABuilder](https://www.pwabuilder.com) (free, made by Microsoft, open
source) can generate ready-to-build packages for both Android and iOS
directly from your hosted PWA URL (`https://bounce-quest-beta.vercel.app`).

- **Android** → generates a [Trusted Web Activity (TWA)](https://developer.chrome.com/docs/android/trusted-web-activity/)
  project — a thin Android wrapper that's an officially supported, first-class
  way for Google to list PWAs.
- **iOS** → generates a [Capacitor](https://capacitorjs.com/) Xcode project
  that bundles your web assets into a native WKWebView shell (Apple has no
  TWA equivalent, so the assets are bundled locally rather than loaded over
  the network — this works great for an offline game).

Alternative: do the same thing manually with
[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (Android) and
[Capacitor CLI](https://capacitorjs.com/docs/getting-started) (iOS/Android) if
you want more control. PWABuilder uses these tools under the hood.

---

## 2. Pre-flight checklist (do this first)

1. **Run a PWA audit.** Open the live site in Chrome → DevTools → Lighthouse
   → run the "PWA" category. Fix anything it flags (the manifest, service
   worker, icons, and HTTPS are already in good shape).
2. **Confirm the live URL is stable.** Store listings link back to this URL
   (and Android's TWA verifies ownership of it), so decide on the final
   production domain before generating packages. `https://bounce-quest-beta.vercel.app`
   works, but consider a custom domain (e.g. `bouncequest.app`) for a more
   professional listing — you can update it later, but Android's Digital
   Asset Links file will need to match whatever domain you ship with.
3. **Privacy policy is live.** Already added at `privacy.html` (e.g.
   `https://bounce-quest-beta.vercel.app/privacy.html`) and linked from the
   title screen — both stores require a reachable privacy policy URL even for
   apps that collect no data.
4. **Bump `sw.js` `CACHE_NAME`** any time you ship new assets (already done:
   `bounce-quest-v3`). This forces installed clients to pick up the update.

---

## 3. Android / Google Play Store

### 3.1 Accounts & cost
- [Google Play Console](https://play.google.com/console) account — **$25
  one-time** registration fee.

### 3.2 Generate the package
1. Go to PWABuilder → enter your URL → "Package for stores" → **Android**.
2. PWABuilder generates a signed/unsigned **AAB (Android App Bundle)** plus a
   `assetlinks.json` file.
3. Host `assetlinks.json` at `https://<your-domain>/.well-known/assetlinks.json`
   on the same domain as the PWA (this is the file that proves your Android
   app and website are the same thing, so the TWA can run full-screen with no
   browser address bar). Add it to the repo and to `sw.js`'s `ASSETS` list so
   it's available offline too, the same way other static files are.
4. If you let PWABuilder/Bubblewrap generate a signing key, **back it up
   securely** (a lost Android signing key can mean you can never update the
   app again under the same listing — Google's "Play App Signing" feature
   removes this risk by letting Google manage the upload key).

### 3.3 Play Console setup
1. Create a new app → set name, default language, category (Games → Arcade
   or Platformer), and declare it as **Free**.
2. **Store listing**: short description (80 chars), full description (4000
   chars), app icon (512×512 PNG — you already have `icons/icon-512.png`),
   feature graphic (1024×500 PNG — needs to be created), and at least 2
   screenshots per supported form factor (phone, optionally tablet).
3. **Content rating questionnaire**: answer honestly — no violence beyond
   cartoon spikes, no user-generated content, no ads, no data collection.
   This should land Bounce Quest in "Everyone" / "PEGI 3".
4. **Data safety form**: declare "No data collected" (true here — only
   `localStorage` on-device, nothing sent to a server). Link the privacy
   policy URL.
5. **Target audience / Families policy**: you can mark the app as suitable
   for a broad age range. Avoid opting into the "Designed for Families"
   program unless you're ready for its stricter requirements (no third-party
   analytics/ads SDKs at all, COPPA-specific review) — since the game already
   has zero tracking, this is achievable later if desired, but isn't required
   to publish.
6. Upload the AAB to the **Internal testing** track first, install it on a
   real device, smoke-test, then promote to **Production**.

---

## 4. iOS / Apple App Store

### 4.1 Accounts & cost
- [Apple Developer Program](https://developer.apple.com/programs/) — **$99/year**.
- A Mac running Xcode is required to build, sign, and upload the app (or use
  a cloud Mac CI like [Codemagic](https://codemagic.io/) or
  [Fastlane](https://fastlane.tools/) + GitHub Actions macOS runners if you
  don't own one).

### 4.2 Generate the package
1. PWABuilder → "Package for stores" → **iOS** → downloads a Capacitor-based
   Xcode project with your PWA's assets bundled locally.
2. Open the project in Xcode, set your Team (from the Developer account),
   bundle identifier (e.g. `com.yourname.bouncequest`), and app icons (need a
   **1024×1024** master icon — generate from `icons/icon-512.png` upscaled or
   re-exported at higher resolution).
3. Build & run on a simulator/device to confirm the game loads, plays, and
   stays responsive — Capacitor serves the bundled files locally so it should
   work with the device in airplane mode.

### 4.3 App Store Connect setup
1. Create the app record in [App Store Connect](https://appstoreconnect.apple.com/)
   with the same bundle ID.
2. **App Privacy ("nutrition label")**: declare "Data Not Collected" — accurate
   since there's no networking or analytics. Link the privacy policy URL.
3. **Age rating questionnaire**: answer honestly (no objectionable content) →
   should result in "4+".
4. **Screenshots**: required for each supported device size class — at
   minimum a 6.5"/6.7" iPhone set and a 12.9" iPad set if you support iPad.
   Use the simulator to capture these from actual gameplay.
5. **App description, keywords, support URL, marketing URL**.
6. Use **TestFlight** to install a beta build on your own devices and invite
   a few testers before public release — this is the easiest way to catch any
   wrapper-specific issues (status bar, safe areas, orientation lock).
7. Submit for review.

### 4.4 Avoiding rejection (Guideline 4.2 "Minimum Functionality")
Apple sometimes rejects apps that look like "a website in a wrapper". Bounce
Quest is in good shape here because it:
- Works **fully offline** (no network calls at all once installed).
- Has a **custom UI** (not a browser chrome) — Capacitor hides the WebView's
  browser UI by default.
- Has **native-feeling interactions** (touch controls, animations, sound).

To further reduce risk, consider (optional, not required to ship):
- Adding haptic feedback on jump/landing via Capacitor's `Haptics` plugin.
- Locking orientation to landscape at the native level (matches
  `manifest.json`'s `"orientation": "landscape"`).
- Adding a native splash screen via Capacitor's config (uses your existing
  icon).

---

## 5. Asset checklist

| Asset | Where it's used | Status |
|---|---|---|
| 512×512 icon | Android, manifest | ✅ `icons/icon-512.png` |
| Maskable 512×512 icon | Android adaptive icon | ✅ `icons/maskable-512.png` |
| 1024×1024 icon | iOS App Store | ❌ needs creating |
| Feature graphic 1024×500 | Play Store listing | ❌ needs creating |
| Phone screenshots (multiple) | Both stores | ❌ capture from build |
| Tablet/iPad screenshots | If supporting tablets | ❌ optional |
| Privacy policy page | Both stores | ✅ `privacy.html` |
| `assetlinks.json` | Android TWA verification | ❌ generated by PWABuilder during packaging |

---

## 6. Security & privacy practices

Because Bounce Quest has **no backend, no network calls after first load, no
accounts, no ads, and no analytics**, most "app store security" requirements
are trivially satisfied. Still worth doing:

- **HTTPS everywhere** — already true via Vercel.
- **Minimal permissions** — neither wrapper should request camera,
  microphone, location, contacts, etc. Double-check the generated
  `Info.plist` (iOS) / `AndroidManifest.xml` (Android) don't have extra
  permissions added by default templates, and strip any that aren't needed.
- **Signing key management** — for Android, prefer **Play App Signing** so
  Google holds the upload key and you can't permanently lock yourself out. For
  iOS, let Xcode manage certificates/provisioning profiles automatically.
- **Keep `CACHE_NAME` bumped** on every release that changes assets, so
  players always get the latest version rather than a stale cached one.
- **Dependency hygiene** — the game has zero npm dependencies at runtime,
  which removes an entire class of supply-chain risk. If you add build
  tooling (Capacitor, Bubblewrap, etc.), keep those dev dependencies updated
  and run `npm audit` periodically.
- **Content Security Policy (optional hardening)** — since everything is
  same-origin static assets, you could add a `<meta http-equiv="Content-Security-Policy">`
  tag restricting `default-src 'self'` for extra defense-in-depth, though the
  risk is already low given there's no dynamic script loading or user input.

---

## 7. Future update checklist

Every time you ship a new version of the game:

1. Bump `CACHE_NAME` in `sw.js`.
2. Bump the version number in:
   - `android/app/build.gradle` → `versionCode` (integer, always increase) and
     `versionName` (e.g. `1.1.0`).
   - iOS `Info.plist` → `CFBundleVersion` (build number) and
     `CFBundleShortVersionString` (e.g. `1.1.0`).
3. Re-test offline (airplane mode) on both platforms.
4. Re-submit: Play Console → new release on the Production track; App Store
   Connect → new build via Xcode/TestFlight → submit for review.

---

## 8. Cost summary

| Item | Cost |
|---|---|
| Google Play Console | $25 one-time |
| Apple Developer Program | $99/year |
| PWABuilder / Bubblewrap / Capacitor | Free, open source |
| Hosting (Vercel) | Already in place |
