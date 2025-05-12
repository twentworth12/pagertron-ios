# Music Setup Instructions

To add music to your game, you need to place two music files in this directory.

## Setup Instructions

1. Ensure both music files are placed in this directory (`/public/music/`):
   - `Race.mp3` - For the intro/menu screen
   - `Fatality.mp3` - For the gameplay

2. Make sure the filenames match exactly (including capitalization)

3. Restart your development server to ensure the music loads properly

## How the Music Works

- "Race.mp3" plays when you're on the start screen before beginning the game
- When you press spacebar to start, the music transitions to "Fatality.mp3"
- If you get a game over and return to the start screen, "Race.mp3" will play again
- The music button at the top of the screen lets you toggle all game audio on/off

## Troubleshooting

If the music doesn't play:

1. Check that the files are named exactly as specified (case-sensitive)
2. Make sure the files are placed directly in this directory
3. Try a different browser (some browsers have stricter autoplay policies)
4. Click somewhere on the game screen to enable audio (some browsers require user interaction)
5. Use the music toggle button in the game to turn the music on/off