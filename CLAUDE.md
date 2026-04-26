# Rose Arcade — Project Instructions for Claude

## What this project is
A pure static HTML/CSS/JS retro arcade game hub called **Rose Arcade**. No framework, no build tools, no npm. Everything is vanilla JS files loaded via `<script>` tags.

## Live URL
Hosted on Netlify, connected to GitHub repo: `https://github.com/rosenthal1226/rose-arcade`

## Deploy workflow
Every change goes live via:
```bash
git add . ; git commit -m "update" ; git push
```
Netlify auto-deploys within ~30 seconds of every push. Never manually upload files.

## File structure
```
index.html          — main hub page (cabinet, game selector, all hub logic)
styles.css          — all shared styles for game pages
gamelib.js          — shared library: particles, shake, popups, pause menu,
                      game-over modal, coin economy, achievements, insertCoin,
                      attractMode, toast, playerChip, fitCanvasToBox
audio.js            — Web Audio API SFX (blip, coin, win, lose, explode, etc.)
themes.js           — 5 themes (rose/matrix/amber/ice/sunset), applied via CSS vars
avatars.js          — avatar roster, image uploads, shared avatars (Benny/Stevens)
components.js       — arcadeUI.toggle() sliding pill toggle component
games/              — 13 individual game HTML files
assets/avatars/     — benny.jpeg, stevens.jpeg (shared avatars, committed to repo)
.gitignore          — ignores OS/editor files only
```

## Visual design rules
- **Backgrounds:** pure black (`#000`) — no gradients, no color washes
- **ROSE ARCADE signage:** bright neon green `#39ff14` with flicker animation
- **◄ PREV button:** electric blue
- **► NEXT button:** bright green
- **▶ PRESS START button:** bright red (`#cc1100`) with pulsing glow
- **Cabinet top trim:** neon green bar
- **Joystick ball:** red
- **Marquee bulbs:** alternate green/white
- **Corner buttons (🎨 🏅 🏆):** green themed
- **Everything else:** dark grays, black backgrounds, colorful neon accents

## Key CSS variables (set by themes.js)
```
--neon-pink, --neon-cyan, --neon-yellow, --neon-green
--neon-orange, --neon-purple, --bg, --bg2
```
Default theme is `rose` (pink: #ff3068, bg: #0f0008).

## Shared game page pattern
Every game page:
- `<body class="crt game-shell-host">`
- Loads: `audio.js`, `themes.js`, `avatars.js`, `gamelib.js`
- Uses `.game-shell` flex column layout: top-bar / hud / play-area / bottom-bar
- Calls `gamelib.trackPlayed('game-id')`, `gamelib.addCoins(N, 'game-id')`, `gamelib.unlock('achievement-id')`
- Canvas games use `gamelib.fitCanvasToBox(canvas, containerEl)` for responsive sizing
- Grid games use `min(Npx, Nvmin)` CSS for fluid tile sizing

## Insert-coin ceremony
Triggered via `gamelib.insertCoin(onComplete)` — plays before navigating to a game.
- Phase 1 (0–850ms): coin drops into slot, "INSERT COIN" text fades in
- Phase 2 (850–1450ms): `.consume` class added — coin sinks, green scanline sweeps
- No white flashes anywhere — `ic-wipe` is a subtle green scanline only

## Games list (13 total)
snake, snake-duel, tictactoe, pong, memory, 2048, whackamole, rps,
minesweeper, tetris, breakout, invaders, flappy

## Coin / achievement economy
- Coins stored in localStorage via `gamelib.getCoins()` / `gamelib.addCoins()`
- Achievements in `gamelib.ACHIEVEMENTS` array, unlocked via `gamelib.unlock('id')`
- Idle drip: +1 coin every 2 minutes on hub page
- Each game awards coins on win/completion

## Avatar system
- 30 emoji characters in roster
- Shared image avatars: `assets/avatars/benny.jpeg`, `assets/avatars/stevens.jpeg`
- Users can upload custom avatars (stored as base64 in their own localStorage)
- `arcadeAvatars.renderInto(el, av)` handles both emoji and image avatars
- P1 default color: `--neon-pink`, P2 default color: `--neon-green`

## Theme system
- `themes.js` applies CSS vars globally
- Old `neon` theme key migrates automatically to `rose`
- Theme picker in hub via 🎨 button

## PowerShell note
Use semicolons to chain commands, not `&&`:
```bash
git add . ; git commit -m "update" ; git push
```
`&&` does not work in Windows PowerShell.

## Things that live in localStorage (per user/browser)
- Game high scores
- Coin balance
- Unlocked achievements
- Selected avatars (P1/P2)
- Active theme
- Custom uploaded avatar images (base64)
- Boot sequence flag (sessionStorage) — only shows once per session
