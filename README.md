# 🐍 Snake
A polished, responsive take on the classic Snake game. Play in your browser on desktop or mobile, with no install or frameworks needed.

**▶️ [Play now][(https://aqilahothmannn.github.io/Snake-Game/)]**

## Features
- 20 × 20 canvas game board with a glowing snake and food
- Score increases by 10 for every snack; the snake speeds up every five snacks
- Easy, Normal, and Hard difficulty settings
- High score saved in your browser with `localStorage`
- Difficulty preference and personal game statistics saved between visits
- Optional sound effects, off by default, with a mute toggle
- Keyboard, swipe, and on-screen touch controls
- Pause, resume, and quick restart
- Responsive, high-DPI canvas rendering

## How to play
Eat the coral-colored dots to grow your snake and earn points. Avoid the walls and your own tail. The game ends if you hit either one.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Move | Arrow keys or **W**, **A**, **S**, **D** | Swipe on the board or tap the arrow buttons |
| Pause / resume | Space bar | Pause button |
| Restart | Enter | Play again button |

## Run locally
1. Download or clone this repository:

```powershell
   git clone https://github.com/aqilahothmannn/YOUR-REPOSITORY.git
```

2. Open `index.html` in any modern web browser.

The game is fully static and works offline. If you prefer a local web server, run this from the project folder:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Tech used
- HTML5 Canvas
- CSS
- JavaScript (no frameworks)

## Deployment
Hosted on GitHub Pages from the `main` branch.
No dependencies or build tools are required.
