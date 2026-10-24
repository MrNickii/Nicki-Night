# Virtual Nicki Night

OBS overlay and tools for the #NickiTV virtual club. Chat comes in through Social Stream Ninja.

Everything in `site/` is the live website (GitHub Pages deploys it on every push to `main`):

- `overlay.html` : the OBS browser source. Open it with `?session=YOURSESSIONID`.
- `control.html` : the iPad/iPhone control panel. Open it with the same `?session=...`.
- `index.html` : the Style Studio viewers use to build a `!look` command.
- `play.html` : the viewer guide. `mods.html` : the staff guide (no technical detail). `producer.html` : the technical guide for the producer only.
- `vnn/` : the avatar engine, motion data, art libraries and speaker/UI art.

`src/` holds the source files and build scripts (overlay build, avatar engine, library packer).
The session ID is never stored in this repo.
