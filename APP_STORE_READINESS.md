# ReconAI Mobile App Store Readiness

This repo is still a web/PWA codebase. The current mobile shell is intended to be the app surface that can be shipped inside a native wrapper, most likely Capacitor, once the bundle identifiers and store accounts are confirmed.

## Current Baseline

- PWA metadata is present in `manifest.json`.
- iOS standalone metadata is present in `index.html`.
- The app shell supports safe areas, keyboard-aware bottom UI, pull-to-refresh, primary-tab swipe gestures, bottom sheets, and touch-friendly controls.
- Existing 192px and 512px icons are present under `icons/`.

## Native Store Work Remaining

- Pick final bundle identifiers, for example `com.dynastyhq.scout` or another owner-approved id.
- Add native wrappers with Capacitor or equivalent:
  - iOS target for App Store submission.
  - Android target for Play Store submission.
  - Splash screen and adaptive icon assets generated from final brand files.
- Complete store compliance items:
  - Apple privacy nutrition labels.
  - Google Play Data safety form.
  - Terms of service and privacy policy URLs.
  - Age rating, support URL, marketing URL, and screenshots.
- Device QA before submission:
  - iPhone SE width, current iPhone standard, iPhone Pro Max, small Android, large Android.
  - Standalone/installed PWA mode and native-wrapper mode.
  - OAuth sign-in, keyboard, pull-to-refresh, swipe navigation, bottom sheets, offline cache, and push/update behavior.

## UX Bar

- Interactive targets should stay at least 44px on iOS-sized layouts and 48px for primary controls where space allows.
- Swipe gestures must never be the only way to complete a task.
- The chat bar, bottom nav, and sheets must respect safe-area insets and virtual keyboard changes.
