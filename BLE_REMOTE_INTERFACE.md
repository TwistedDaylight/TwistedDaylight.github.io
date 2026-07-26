# Ballerwagen BLE remote — app build brief

You're building a single-page, installable/offline-capable PWA that acts as a Bluetooth LE remote control for a physical art installation. This document is self-contained — everything you need is below. You don't have access to the project's code repository, so don't assume any other files, docs, or context exist beyond what's written here.

## What is Ballerwagen?

Ballerwagen is a music-reactive LED system mounted on a small pull trolley (roughly 40×100 cm), built for Mera Luna festival — a dark wave / industrial / EBM / goth-rock festival (plus techno/bass interludes), running the night of 2026-08-06. It has 4 vertical LED light towers (~75 cm tall), one at each corner of the trolley, each a clear plastic tube with an addressable LED strip inside. An ESP32 microcontroller runs everything: a microphone listens to a separate boombox playing music, and the LEDs react to the beat/volume in one of several "modes" (light patterns).

The goal: make the trolley visually magnetic enough at night that festival-goers want to follow it, forming a walking dance train behind it as it's pulled through the crowd, across 3 nighttime sessions (~4 h each).

Hard constraints that shape this app:
- The light system is **fully self-contained and battery-powered** — it works without a phone at all (there's a physical button on the controller box that cycles modes as a fallback). This phone app is a **convenience layer only**, never required for the system to function. Don't build anything that assumes the app must stay connected for the lights to keep working.
- It's used **outdoors at night, in a crowd, with no reliable internet**. The app must be installable to the phone home screen and fully usable offline — it only ever needs Bluetooth, never an internet connection, to do its job.
- The operator is one person glancing at their phone in the dark while walking. UI must be big, high-contrast, and tappable/readable without careful aim or reading small text.

## The 6 modes

You don't need to implement any light patterns — that's all in the device firmware already. You just need one clearly labeled button per mode. For context (so button icons/labels make sense):

1. **Ambient Idle** — slow, dim colour cycle through blues/purples. Used between tracks or during setup; signals "we're here" without competing with the music.
2. **VU Climb** — A bar fills bottom-up with volume, colour shifting cool (blue) to hot (red) as it climbs. A "warm-up" mode.
3. **Marquee Forward** — a bright comet moves up each tower in the trolley's direction of travel, inviting people to walk with it.
4. **Chase Pair** — two opposing-colour comets pass each other on each tower. Busy/dense — good for EBM/industrial tracks.
5. **Beat Flash** — the flagship mode: all towers go dark, then flash on every kick drum with a fading rainbow afterglow. Tight beat-lock is the whole point of this one.
6. **Debug** *(placeholder)* — a slow rainbow sweep, not a real performance mode. This slot is reserved for a **future "Bass Slam" mode** (a sub-bass strobe effect) that doesn't exist in the firmware yet. Label this button visibly distinct from the other 5 (e.g. dimmer or outlined, with a small "reserved" caption) so the operator doesn't mistake it for a real performance mode — but it must still be a fully working, tappable button, not disabled.

## Device / connection

- BLE peripheral name: `Ballerwagen`
- Advertised custom service UUID — filter `navigator.bluetooth.requestDevice()` on this, not on name: `aa5b666d-b1e2-469a-803a-7c0526633021`
- One peripheral, one connection at a time (single operator's phone). No pairing/bonding required.
- **Nothing persists on the device.** Every value below resets to its firmware default every time the ESP32 reboots or loses power. Always read live state from the device right after connecting; never assume a previous session's settings still apply.

## GATT contract

Service UUID: `aa5b666d-b1e2-469a-803a-7c0526633021`

All multi-byte numeric types are **little-endian raw bytes** (e.g. `DataView.setFloat32(0, v, /*littleEndian=*/true)`). Every characteristic is Read + Write unless noted. Writing an out-of-range value gets clamped device-side, and the clamped value is what a subsequent read returns — don't assume a read always echoes exactly what you last wrote.

| Control | Characteristic UUID | Type | R/W/N | Range | Notes |
|---|---|---|---|---|---|
| Mode | `dd3b5387-9745-4deb-84e9-5c0fdb5712c8` | `uint8` | R/W/**Notify** | 0-5 | Index into the 6-slot mode grid above. Subscribe to notify — a physical button on the device (or another client) can change this without you writing it. |
| Brightness | `b55e5501-737c-4bdd-90f5-7a20d809023e` | `uint8` | R/W | 0-255 | UI shows 0-100%; convert `Math.round(pct * 255 / 100)`. |
| Hue shift | `05161b8c-de23-424e-b466-71b3df5498c6` | `int16` | R/W | -180..180 | Degrees. A global colour-wheel rotation applied on top of every mode's normal colours — think of it as a single "retint everything" knob, not a per-mode setting. Full range is intentional, including values that shift things toward red — don't add a restricted range or a warning for that. |
| VU ceiling min | `0cc0238f-402e-4663-ae0c-f183284186f9` | `float32` | R/W | 0-200000 | Advanced/field-tuning value, default 75000. |
| VU ceiling decay | `9275cd4f-3aa7-4c5f-84e4-ef4ec726d76c` | `float32` | R/W | 0.0-1.0 | Advanced/field-tuning value, default 0.01. |
| VU ceiling headroom | `e0a401c7-9841-474e-89ae-ccaeba79c72d` | `float32` | R/W | 0.0-1.0 | Advanced/field-tuning value, default 0.8. |
| VU floor max | `5265c037-4a0a-4813-81f8-be08ce0bf8e3` | `float32` | R/W | 0-200000 | Advanced/field-tuning value, default 3000. |
| VU floor recovery | `eda42e0a-fcf3-4d3f-9078-81b456b285ae` | `float32` | R/W | 0.0-1.0 | Advanced/field-tuning value, default 0.01. |
| Beat baseline alpha | `01044ad9-4df0-4220-9809-eb628cd1d669` | `float32` | R/W | 0.0-1.0 | Advanced/field-tuning value, default 0.02. |
| Beat onset factor | `01405f8d-2bc9-404b-a708-2d59be5ebf09` | `float32` | R/W | 1.0-10.0 | Advanced/field-tuning value, default 1.5. |
| Beat abs floor | `ff40d383-a891-4ffb-9168-27fa2ca70bcf` | `float32` | R/W | 0-200000 | Advanced/field-tuning value, default 20000. |
| Beat silence floor | `b6348c88-6548-4a9f-8b98-06e4507b95aa` | `float32` | R/W | 0-200000 | Advanced/field-tuning value, default 6000. |
| Beat silence ms | `3492147d-9ec4-4e9b-ac99-0b38e80c0c61` | `uint32` | R/W | 100-60000 | Advanced/field-tuning value, default 3000. |
| Beat timeout ms | `0ee3fc7a-cd43-4bf4-91cf-4dbea4120860` | `uint32` | R/W | 100-60000 | Advanced/field-tuning value, default 2500. |

The 11 "Advanced/field-tuning" values are internal light-show calibration numbers (how sensitive the beat detector is, how the volume bar auto-ranges, etc.). You don't need to understand what each one does physically — just expose them as labeled numeric fields grouped as described below, with their defaults shown as placeholder/help text. There is deliberately no separate "flash rate" or "epilepsy safety" control among them — that safety limit is fixed in the device firmware and isn't user-adjustable; don't add a control for it.

## Screen layout

- **Header**: "Ballerwagen" title, a Connect/Disconnect button, and a status dot (grey = disconnected, green = connected).
- **Mode grid**: 6 large tappable buttons, one per mode above, active one visually highlighted (border/fill — must read clearly in a dark venue at a glance, not require reading text). Button 6 ("Debug") visually distinct/secondary per the note above.
- **Brightness slider**: 0-100%, single row, large touch target.
- **Hue slider**: -180° to +180°, centered at 0, large touch target.
- **Advanced / field tuning section**: collapsed by default (e.g. an expandable/accordion section), two labeled subgroups:
  - **VU climb**: ceiling min, ceiling decay, ceiling headroom, floor max, floor recovery.
  - **Beat detector**: baseline alpha, onset factor, abs floor, silence floor, silence ms, timeout ms.
  
  One labeled numeric input per value (not necessarily a slider — these get typed in once during an on-site calibration session, so precision matters more than touch-friendliness here). Show each value's default as placeholder/help text.

## Visual style

Dark theme. Suggested accent palette (drawn from the physical rig's own light colours):
- Primary/hot accent: `#ff6600` (amber) — use for the active mode button, primary actions, connection-good states, etc.
- Secondary accents: cyan and magenta, for supporting UI elements.
- Background: near-black.

Beyond that, use your own judgement for a clean, modern, high-contrast dark UI — there's no existing design system to match.

## Interaction / sync behavior

- **On connect**: read all 14 characteristic values first to seed every control with the device's actual live state (not hardcoded UI defaults), *then* subscribe to the Mode characteristic's notifications.
- **Mode tap**: optimistic UI update (highlight immediately) + write the index. A Mode notification will arrive shortly after regardless of source — if it reports a different value than what you just tapped (e.g. the physical button won a race), let the notification win.
- **Slider/field changes**: write on release/blur/Enter, not on every intermediate input event — don't flood the connection with a write per pixel of drag.
- **On disconnect** (`gattserverdisconnected` event): status dot → grey, last-known values stay visible on screen (dim them, don't clear/reset the UI). A single "Reconnect" action should call `device.gatt.connect()` again on the already-permitted `BluetoothDevice` object — it should not need to re-invoke `requestDevice()` or show a new pairing prompt within the same page session.

## PWA / offline requirement

Must be installable to the phone home screen, and must be able to open and attempt a Bluetooth reconnect with **no internet connectivity** — this is a field tool used outdoors at a festival, not near reliable data. This is a hard requirement, not a nice-to-have.
