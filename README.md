# Snake

A polished, responsive take on the classic Snake game. Play in your browser on desktop or mobile—no install, frameworks, or internet connection required.

## Features

- 20 × 20 canvas game board with a glowing snake and food
- Score increases by 10 for every snack; the snake speeds up every five snacks
- Easy, Normal, and Hard difficulty settings
- Difficulty preference and personal game statistics saved in your browser
- Optional sound effects, off by default, with a mute toggle
- High score saved in your browser with `localStorage`
- Keyboard, swipe, and on-screen touch controls
- Pause, resume, and quick restart
- Responsive, high-DPI canvas rendering

## How to play

Eat the coral-colored dots to grow your snake and earn points. Avoid the walls and your own tail. The game ends if you collide with either.

### Controls

- **Move:** Arrow keys or **W**, **A**, **S**, **D**
- **Mobile:** Swipe on the board or use the on-screen arrow buttons
- **Pause / resume:** Space bar or the Pause button
- **Restart:** Enter or Play again after a game ends

## Play online

After deploying with GitHub Pages, replace this placeholder with your game's public URL:

[Play online](https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/)

## Run locally

1. Download or clone this project.
2. Open `index.html` in a modern web browser.

The game is static and can be played offline. Alternatively, start a local web server from the project folder:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Publish on GitHub Pages

1. Create a **new, empty repository** on GitHub. Do not initialize it with a README, license, or `.gitignore`.
2. Open PowerShell in this project folder and run the following commands, replacing the placeholders with your GitHub username and repository name:

   ```powershell
   git init
   git add index.html style.css script.js README.md
   git commit -m "Build browser Snake game"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

3. On GitHub, open the repository and go to **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose the `main` branch and the `/(root)` folder, then select **Save**.
6. Once the deployment finishes, open `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`. It may take a few minutes to become available.

## Tech used

- HTML5
- CSS
- Plain JavaScript
- HTML5 Canvas API
- Browser `localStorage`

No dependencies or build tools are required.
