# Screenshot testing and automatic visual checks

PanelForge runs browser-based visual QA in GitHub Actions on pushes to `main`, pull requests, manual runs, and a weekly schedule.

## What it checks

- Desktop (1440px), tablet (768px), and mobile (390px) screenshots of the studio.
- The original graphic novel on mobile, tablet, and desktop.
- JavaScript exceptions, horizontal overflow, expected headings, navigation, four comic pages, SVG panel rendering, page counter updates, and Show All behaviour.
- JavaScript syntax for both HTML applications and the generation API.

## Where to find evidence

Open the repository's **Actions** tab, select **Build, Screenshot and Visual QA**, open the latest run, and download the `panelforge-visual-qa-...` artifact. It contains screenshots under `screenshots/` plus `visual-report.md` and `visual-report.json`. Artifacts are retained for 30 days.

## Run on a developer machine

```sh
npm install
npx playwright install chromium
python3 -m http.server 4173
```

In another terminal:

```sh
npm run test:visual
```

To test a deployed URL instead, set `PANELFORGE_BASE_URL` to the public site URL before running the test. Do not use secrets in that variable.

## Fix loop

1. Push a change or open a pull request.
2. Actions launches Chromium and saves reproducible screenshots and diagnostics.
3. A failing check blocks the visual-QA job and identifies the broken condition.
4. Download the artifact to inspect the exact viewport and page, fix the source, and push again.
5. Re-run until the report passes.

This is automated detection and evidence capture, not an autonomous code-writing agent. It does not silently edit source files based on screenshots. Actual visual review and fixes still need to be made from the screenshot/report or by an explicitly configured coding agent. This avoids unreviewed changes that could damage the comic or studio.
