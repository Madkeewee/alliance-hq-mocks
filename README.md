# Alliance HQ: 8 design directions (mockups)

[Open the interactive showcase](https://madkeewee.github.io/alliance-hq-mocks/) · [Original gallery](https://semisi-game-mocks.wattz.dev/)

Static HTML/CSS/JS mockups of 8 design directions for the DGF and GIR alliance sites (Dark War: Survival).
There is no build step and there are no dependencies. Fonts load from Google Fonts.

- `index.html` is the gallery of all 8 directions. `view.html?m=<folder>&s=home|calc|planner&a=DGF|GIR` shows a
  screen on desktop and phone side by side.
- `d1-journal/` … `d8-timetable/` each have `home.html`, `calc.html` and `planner.html`. Add `?a=GIR` for the GIR skin.
- `shared/hq.js` holds all the data and logic: alliances, season, events, the calculators (same formulas as the
  current sites) and the Black Gold Battlefield pairing. Edit data here once and every direction picks it up.
- `assets/DGF` and `assets/GIR` hold the alliance art from the current sites.
- Event times, the season week and member counts are sample data. The bottom-left "Mock · Alliance" pill is a
  mock-only control.

## Deploy to GitHub Pages
All paths are relative, so it works from a repo root or a subfolder (for example `username.github.io/repo/`).
Commit this folder's contents to a repo, enable Pages (Settings → Pages → deploy from branch, root), and open
`index.html`. `robots.txt` is not included. Every page has a noindex meta tag; remove it if you want search engines to
list the mocks.
