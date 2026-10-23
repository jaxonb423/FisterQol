# FisterQoL

A quality-of-life mod for [Fister](https://fister.fun): HUD, crosshair, camera, audio, performance, clips, music, outfits, pets, custom themes, the **Track Day** built-in theme, a **desktop buddy** (Bisty by default, or your own image) and **Bad Translator**. Everything lives in the game's Settings under the **QoL** tab.

## Install (browser)

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open **[FisterQoL.user.js](https://raw.githubusercontent.com/jaxonb423/fisterqol/main/FisterQoL.user.js)** and click Install.
3. Disable any older FisterQoL scripts so only this one is enabled.
4. Open fister.fun. The first launch downloads the QoL runtime once (about 1.2 MB); later launches use the saved copy.

Tampermonkey checks this repo for updates automatically.

## Bad Translator

QoL → Fun → **Bad Translator** sends every piece of text in the game through Google Translate in random languages (up to 1000), then back to English. Translations are saved on your device, so each text only makes the trip once. **Ctrl+Shift+F10** turns it on or off from anywhere.

- The first time you turn it on, Tampermonkey asks to let FisterQoL connect to `translate.googleapis.com`. Choose **Always allow** (or **Always allow domain**).
- At 1000 languages a screen's first pass takes several minutes, because each batch of text needs one request per language. Google sometimes asks it to slow down; it waits and carries on by itself.
- Timers and other constantly changing text are left alone, and so is anything you type.
- Browser only: the Steam app doesn't allow requests to Google Translate.

## How it's split

| File | What it is |
|---|---|
| `FisterQoL.user.js` | The small userscript (~38 KB). Small on purpose, so it loads before the game starts. |
| `dist/fisterqol-bundle-<version>-<fingerprint>.json` | The QoL runtime, code parser and Bisty. Downloaded once, checked against the SHA-256 fingerprint built into the userscript, then cached. |

If the runtime can't be downloaded or doesn't match, that launch runs without QoL and shows a notice; it tries again next time.

## Publishing an update

Upload the new `dist/` file first, then the new `FisterQoL.user.js` (with a higher `@version`). Old `dist/` files can be removed once players have updated.

## Licenses

Third-party code included in the runtime is listed in [`licenses/`](licenses/).
