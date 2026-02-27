# TypeForge — Typing Arcade

TypeForge is a modern typing practice arcade built with **React 18** and **Vite 5**.  
It focuses on clear feedback, minimal noise, and multiple game modes that each train a different skill.

## Tech stack

- **Frontend**: React 18, functional components and hooks
- **Bundler / Dev server**: Vite
- **Styling**: Single `src/styles.css` with a dark theme and responsive layout

## Project structure

- `index.html` – Vite entry HTML, links fonts and `favicon.svg`, mounts React to `#root`.
- `src/main.jsx` – Bootstraps React and imports global styles.
- `src/App.jsx` – Top-level app shell and navigation:
  - Manages `screen` (`home | game | results`), `gameId`, `options`, `result`.
  - Persists navigation state for this tab only in `sessionStorage` under `tf_session` so a page refresh while in a game re-opens that game with fresh state.
- `src/screens/`
  - `HomeScreen.jsx` – Landing page, game cards grid, history drawer, sound toggle.
  - `GameScreen.jsx` – Wraps individual games, options bar, back navigation.
  - `ResultsScreen.jsx` – Summary after each run, WPM, stats, chart, “play again”.
- `src/games/`
  - `ClassicGame.jsx` – Timed WPM test (15–120s).
  - `ZenGame.jsx` – Untimed free-typing with WPM and accuracy.
  - `SurvivorGame.jsx` – 3 lives; finishing a word with errors costs a life.
  - `GhostGame.jsx` – Race against a ghost cursor at your Classic PB speed.
  - `WordRushGame.jsx` – One word at a time with a shrinking ring; score by words cleared.
  - `CarRaceGame.jsx` – Your typing speed powers a car; AI speeds scale from your PB.
- `src/components/`
  - `TypingText.jsx` – Renders the character stream with auto-scrolling and cursor.
- `src/hooks/`
  - `useTypingSession.js` – Shared typing logic (typed buffer, cursor, stats, WPM).
- `src/lib/`
  - `textData.js` – Word pools and generators for different modes.
  - `audio.js` – Sound effects and global sound toggle.
- `src/styles.css` – Global layout, typography, game UIs, responsive rules.
- `favicon.svg` – Scalable favicon used via `<link rel="icon" type="image/svg+xml" href="/favicon.svg" sizes="any" />`.

## Available scripts

From the project root:

- `npm install` – Install dependencies.
- `npm run dev` – Start Vite dev server (default: `http://localhost:5173`).
- `npm run build` – Production build to the `dist/` folder.
- `npm run preview` – Preview the production build locally.

## Game modes (overview)

- **Classic** – Standard timed typing test with rich stats and consistency graph.
- **Zen** – No timer; finish when you’re ready, great for accuracy practice.
- **Survivor** – Lose a heart when you finish a word that still has errors; survive the full duration.
- **Ghost Race** – The ghost runs at your saved Classic PB; beat it to push your PB higher next time.
- **Word Rush** – Complete as many words as possible while the per-word time limit shrinks.
- **Car Race** – Your WPM drives your car along a track; AI cars are tuned to your PB and difficulty.

## Notes on persistence

- **Session (per tab)**: Current `screen`, `gameId`, and `options` are saved to `sessionStorage` under `tf_session` while playing; a refresh re-opens the same game mode with a clean state.
- **Long-term (per browser)**: Personal bests and history are stored in `localStorage`:
  - Personal best keys like `tf_pb_classic_30` etc.
  - Recent runs under `tf_history`.

## Development tips

- The app assumes a modern browser with emoji and SVG support.
- When tweaking styles, keep the existing CSS scale system and media queries to maintain responsiveness.
- If you change game IDs or add new modes, update:
  - `GAMES` in `HomeScreen.jsx`.
  - `GAME_NAMES` and `GameComponent` mapping in `GameScreen.jsx`.

