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

## TikTok / Wide clip versions

The clip editor shows **TikTok** and **Wide** buttons when a clip comes in both shapes. When the game only gives you one, FisterQoL adds the button for the other, in the editor and on the clip cards in the Clips list.

- The first time you pick the missing version, QoL plays the clip through once to make it, so it takes as long as the clip (about 30 seconds). A progress bar covers the preview while it works. Keep the tab open.
- After that it's saved on your device and opens straight away. Saved versions are cleared after 8 days (the game keeps clips for 7), or with **Forget made versions**.
- **TikTok from a wide clip:** crops the middle to fill the screen (default), or shows the whole screen with blurred bars. Change it under Settings → General → Clips → *TikTok version of wide clips*.
- **Wide from a tall clip:** cuts away the blurred bars, so you get the full screen back.
- Captions, voices, music, Download and Share all use the version you picked.
- Turn it off with *Add TikTok / Wide buttons in the clip editor* in the same place.

## The QoL tab in the clip editor

Open a clip in the clip editor and pick the **QoL** tab next to Cut / Text / Sound.

- **Thumbnail:** scrub to a frame and press *Use this frame*; it shows on the clip's card (on this device).
- **TikTok framing:** on the TikTok version of a wide clip, press *Edit framing* and drag the box left or right at different moments. The crop glides between the points so it follows the action.
- **Stickers:** emoji or your own picture (PNG, JPG, GIF, WebP). Drag to move, scroll to resize, set when it starts and ends.
- **QoL overlays:** with Settings → General → Clips → *QoL overlays are* set to **Editable in the clip editor** (the default), QoL records the input display, timer, FPS, crosshair and music player next to each clip instead of burning them into the video. In the editor you can drag, resize, hide or re-time them. They start where your QoL clip layout puts them. Clips the game posts to Discord by itself don't have them; Download or Share from the editor to include them. Needs Chrome or Edge.
- **Slow-mo, speed-up and instant replay:** mark the moments, then *Make a new clip with these*. Because the length changes, it's saved as a new clip (marked *QoL edit*) in your Clips list, on this device. Cuts, shape, framing, stickers and overlays carry over; add captions and sounds to the new clip.

Download, Share and the editor's export use the finished version with your stickers and overlays. The first time, QoL plays the clip through once to make it.

## Themes in the Clips window

Track Day, the three-colour gradient, and the Midnight and Neon Arcade templates in Theme Creator style the Clips list and the clip editor, including the game's newer window style. Themes you made from an unchanged Midnight, Neon Arcade or Track Day template are upgraded automatically; themes you've edited are left as they are.

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
