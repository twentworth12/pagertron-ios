# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pagertron is a web-based game built with React and Vite. The game involves controlling a player (🔥) that moves around the screen to avoid pagers (📟) while shooting at them. The game has levels, scoring mechanics, and a Konami code easter egg. It uses Tailwind CSS for styling along with custom CSS.

## Commands

### Development

- **Start development server:** `npm run dev`
- **Build for production:** `npm run build`
- **Run linting:** `npm run lint`
- **Preview production build:** `npm run preview`

## Architecture

The project has a simple structure:

1. **Main Entry Point**: `main.jsx` renders the `App` component into the DOM
2. **App Component**: `App.jsx` is a simple wrapper that renders the main game component
3. **Game Logic**: `Pagertron.jsx` contains all game mechanics and rendering:
   - Game state management with React hooks
   - Game loop using `useEffect`
   - Player and pager movement
   - Collision detection
   - Level progression
   - Konami code easter egg
   - Mobile device detection

4. **Styling**:
   - Tailwind CSS for utility classes
   - Custom CSS in `Pagertron.css` for animations
   - Inline styles for most game elements

5. **Supabase Integration**: The project uses Supabase for storing high scores:
   - `supabaseClient.js` handles the Supabase connection
   - `highScoreService.js` provides functions for saving and retrieving scores
   - `HighScoreModal.jsx` renders the high score UI
   - Requires Supabase setup as documented in `SUPABASE_SETUP.md`

## Notes

- The game requires keyboard controls (arrow keys for movement, spacebar for shooting)
- There's a special Konami code activation (⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️)
- The game is not playable on mobile devices (shows a "Coming soon" message)
- The game has a "finale" effect that triggers when the player loses