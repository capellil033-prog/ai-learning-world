# AI Learning World

An interactive, data-driven 3D learning world for exploring how AI systems work.

Generated with **GPT 6.1 Sol — Extra High**.

The interface and learning content are in German.

## Download and run

1. [Download the project as a ZIP](https://github.com/capellil033-prog/ai-learning-world/archive/refs/heads/main.zip), or choose **Code → Download ZIP** on GitHub.
2. Extract the entire ZIP into a folder.
3. Open **index.html** in a modern browser.

Keep the files and folders together. No installation, build step, npm, backend, AI account, or internet connection is required after downloading. All libraries are included locally.

If opening the file directly does not work, open a terminal in the extracted folder and run `python -m http.server 4173 --bind 127.0.0.1`. Then visit **http://127.0.0.1:4173**. This serves the project files locally and requires Python.

The 3D view requires WebGL. Stations, demos, and knowledge checks remain accessible if 3D is unavailable.

## Learning levels

1. **LLM City:** seven stations from User to Verify, including step-by-step token generation.
2. **Token Pass:** a snowy mountain pass with a snowcat, text splitting, limited context cargo, and prefix caching.
3. **Tool River:** a boat journey showing validated tool calls and results returning to the model context.
4. **Agent Forest:** a jeep journey with observation-driven decisions, step limits, and human interruption.
5. **MCP Harbor:** a harbor boat, host/client/server connections, tools, resources, and prompts.
6. **Retrieval Desert:** an off-road vehicle, keyword/vector search, source selection, grounding, and RAG.
7. **Verification Lab:** a shuttle, evidence checks, tests, evaluation, validation, and human review.

Each level includes an introduction, learning stations, optional interactive demos, a summary, and three optional checkpoint questions. All seven levels are freely selectable from the start; visits and explicit completions are tracked independently.

## Controls and progress

- **AI planet:** drag to rotate the planet, use the mouse wheel to zoom, select any region, and click **Level erkunden**. A short animated transition prepares the level.
- **Stations:** opening a station records it as visited. **Karte ansehen** closes the explanation without opening another pop-up. After the final station, the level remains freely drivable for 15 seconds before returning to the planet automatically; the countdown stays hidden.
- **Demos:** every demo remains available for exploration, but no demo is required to continue or complete a level.
- **Tour:** drive to the selected station and stop automatically. Parking in a marked bay for 0.65 seconds opens its explanation. Moving vehicles create water, snow, sand, or dust trails that match the environment.
- **W / ↑:** accelerate. **S / ↓:** brake and reverse. **A/D / ←/→:** steer. **Space:** stop. **P:** toggle cruise control. Manual input takes control.
- **Touch:** hold the pedal and steering buttons. Drag to rotate the camera; use the mouse wheel or +/− to zoom. The map button toggles the overview.
- **Zusammenfassung:** open the summary and optional quiz, or mark the level as completed directly. **Weltkarte:** return to the planet.

Resetting the vehicle resets the drive while keeping your learning progress.

Progress is stored in your browser's localStorage under `ai-learning-world-v1`. Different browsers, server addresses, and direct file access have separate storage. Use the same browser and address to continue your journey. If storage is blocked, progress lasts only for the current session and the app displays a notice.

## Educational simulations

All model, token, weather, MCP, retrieval, and evaluation examples run locally. There is no live AI integration or outgoing API traffic. Token splitting, vectors, capacities, and external datasets are simplified teaching examples. References are listed in [docs/sources.md](docs/sources.md).

## Project structure

- `data/`: world and level data, learning content, demos, and checkpoints.
- `app.js`: shared navigation and learning flow.
- `lib/`: shared models, driving, scene logic, demos, and progress handling.
- `assets/`: visual styling and bundled libraries.
- `docs/`: references, development notes, and screenshots.

The project builds on the author's Token Transit project. Its buildings and base vehicle are reused in `lib/models.js`; mountain scenery, driving, and camera logic are adapted in `lib/expedition.js`. The interface extends the original styling in `assets/token-transit.css`. Vehicle variants and biomes use the same geometric foundations.

The original Token Transit files were left unchanged. Their SHA-256 hashes are recorded in `docs/template-hashes.json`. Bundled third-party license notices are included in `assets/vendor/` and must be retained.

## Adding a level

Add a file under `data/` that appends a level object to `AIWorld.levels`, then include it in `index.html` after `data/world.js`. Level content is kept outside `app.js`.

A level defines `id`, `number`, `title`, `topic`, `environment`, `vehicle`, map position, learning objectives, `stations`, `summary`, and `checkpoints`. The legacy `unlockedAfter` field documents the recommended learning order but does not restrict access. Stations include explanations, three processing steps, an example, a limitation, and an optional declarative `demo` configuration.

The progress model uses `visitedLevels`, `completedLevels`, `currentLevel`, and `unlockedLevels`. All level IDs are present in `unlockedLevels`; additional lists track visited stations, completed demos, and passed questions so learning can resume without making optional activities mandatory.

## Tests

With Node.js 18 or newer installed, run `node --test` in the project folder.

The 17 automated tests cover the data model, free level selection, storage, optional demos, and Cannon vehicle physics. Scene tests replace graphics output while using the bundled geometry and physics libraries. Browser checks and screenshots are documented in [docs/phases.md](docs/phases.md).

The complete seven-level journey, saved progress, driving, and desktop/mobile layouts were checked in the browser. Direct file startup could not be tested because the test browser only allows HTTP/HTTPS. Physical touch devices, other browser engines, and different graphics drivers have not been tested.

## Development

The app was developed in eight phases on `feature/world-map`, with a separate commit for each phase. Changes are reviewed through pull requests before being merged into `main`.
