# Virtual Nicki Night

OBS overlay and tools for the #NickiTV virtual club. Chat comes in through Social Stream Ninja.

Everything in `site/` is the live website (GitHub Pages deploys it on every push to `main`):

- `overlay.html` : the OBS browser source. Open it with `?session=YOURSESSIONID`.
- `control.html` : the iPad/iPhone control panel. Open it with the same `?session=...`.
- `index.html` : the Style Studio viewers use to build a `!look` command.
- `vnn/` : the avatar engine, motion data and art libraries.

`src/` holds the source files and build scripts (overlay build, avatar engine, library packer).
The session ID is never stored in this repo.
