# WARDOGS Mortar Calculator

Unofficial L81 mortar fire-direction tool for [WARDOGS](https://wardogs.game/). Type gun and target map coordinates, read **range**, in-game **azimuth** (`227SW`), and **elevation MILs**.

Public URL: `https://wardogsmortarcalculator.vercel.app`

Not affiliated with Bulkhead Interactive or Team17.

## Use it

1. Enter firing position X/Y.
2. Lock it so you don’t fat-finger the gun.
3. Enter target X/Y. Solution updates as you type.
4. After the ranging shell, walk fire with N/S/E/W at 10 m or 50 m.

Grid: **1.00 = 100 m**, Y is north, 0° is north.

## Elevation MILs

Range and azimuth are plain trigonometry and should match the HUD.

Elevation MILs come from the community firing table in [apollyon-sys/wardogs-calculator](https://github.com/apollyon-sys/wardogs-calculator) (MIT). Interpolation of that table is tight (~2 MIL). Whether the table matches the live build is unconfirmed — L81 max range is disputed in the community. Treat MIL as a first-round estimate and range the shell.

Playable envelope used here: **132–684 m**.

## PWA

Android Chrome: menu → Add to Home screen.  
iPhone Safari: Share → Add to Home Screen. Works offline after the first visit.

## Dev

```bash
npm install
npm test
npm run dev
```
