# Deprecated Local API

This folder contains the old local Express API that was used before the app was converted to static GitHub Pages hosting.

It is kept only for historical reference. The maintained application no longer depends on this server:

- `apps/web` reads generated static data from `dataset.json`.
- GitHub Pages serves the built web app as static files.
- The wiki scraper updates `data/*.json`, and the web build packages that data for the browser.

If you find this while working on the project, do not build new features here. Shared data, team-code behavior, and game-domain logic should live in `packages/core` or other maintained packages instead.
