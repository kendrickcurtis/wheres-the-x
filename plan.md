# Destination X-Inspired Daily Puzzle Game

## Overview
A single-page browser game in **TypeScript + React** with **Leaflet.js (OpenStreetMap)**.  
Each day (deterministically seeded by date), a route across Europe is generated:
- Start city → 4 stops → Final city.
- Each leg ≤ 6h drive equivalent (~500 km haversine).
- Players see the starting location pinned and receive clues for each stop.
- They drag pins for guesses on the map, revising as needed until locking in the final destination.
- Scoring is revealed only when the final guess is submitted, with more weight on the final destination.

### Clue System
- **Start:** 1 clue (final OR red herring).
- **Stops 1–4:** 3 clues each → one for this stop, one for the final, one red herring.
- **Final:** 1 clue (true or red herring).
- **Difficulty scaling:**  
  - Early stops: vague clues.  
  - Mid stops: medium specificity.  
  - Stop 4/final: strong clues.  

### Distribution
- **Static hosting** (GitHub Pages, Netlify, Vercel).  
- Built as a **PWA** so it can be “installed” on Android like an app.  
- No backend required: seed = date + secret key.  

---

## Todo List

### 1. Project Setup
- [ ] Init React + TypeScript + Vite project.  
- [ ] Add dependencies: `leaflet`, `react-leaflet`, `seedrandom`, `jest` (tests).  
- [ ] Configure PWA (manifest + service worker).  

### 2. Data
- [ ] Prepare city dataset (GeoJSON with: name, lat/lon, country, Wiki link).  
- [ ] Utility for seeded random selection.  
- [ ] Haversine distance + bearing helpers.  

### 3. Puzzle Engine
- [ ] `PuzzleEngine.ts` → generates start + stops + final from seed.  
- [ ] Ensure each leg ≤ 500 km.  
- [ ] Attach clues to each stop/final.  
- [ ] Difficulty scaling by stop index.  

### 4. Clue Generators (pluggable)
- [ ] `clues/DirectionClue.ts` → cardinal direction from prev stop.  
- [ ] `clues/AnagramClue.ts` → scrambled name + extra letters.  
- [ ] `clues/ImageClue.ts` → Wikimedia Commons image (blurred).  
- [ ] Framework for adding new clue types.  

### 5. Game UI
- [ ] `MapView.tsx` → Europe map with draggable pins.  
- [ ] Slots for Stop1–4 + Final.  
- [ ] Draw guessed route lines.  
- [ ] Route reveal after submission.  

- [ ] `CluePanel.tsx` → shows clues per stop.  
- [ ] `SubmitPanel.tsx` → “Lock in final destination” + scoring.  

### 6. Scoring & Reveal
- [ ] 1 pt for each correct stop, 5 pts for correct final.  
- [ ] Show route reveal animation + correct answers.  
- [ ] Display clue-to-answer mapping at the end.  

### 7. Tests
- [ ] **Puzzle consistency**: same seed → same result.  
- [ ] **Route validity**: ≤ 500 km per leg.  
- [ ] **Clue structure**: correct # per stop.  
- [ ] **Clue correctness**: direction buckets, valid anagram.  
- [ ] **E2E**: perfect playthrough = max score.  
- [ ] **PWA** install + offline test.  

---

## Stretch Goals
- [ ] Extra clue types (emoji rebus, Wikipedia fact blanks, climate).  
- [ ] Local leaderboard (using localStorage).  
- [ ] Difficulty modes (shorter vs. longer routes).  