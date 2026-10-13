# PanelForge — AI Comic Studio

A mobile-friendly comic-production workspace built as a standalone web app. Designed for script-first workflows such as **Strong Bros. Issue 1 — The Power Was Never Off**.

## Current MVP

- Responsive phone-friendly interface.
- Load a script from TXT, Markdown, or PDF (PDF text extraction uses PDF.js from a CDN).
- Upload and preview multiple character reference images.
- Configure art-direction and character-continuity notes.
- Split scripts into editable pages and panels using PAGE/PANEL headings, then review and edit each panel.
- Add/remove pages and panels.
- Export a JSON storyboard or full project backup including reference images.
- Print the storyboard and use the browser's **Save as PDF** option.

## Open it

The app is a static site. Open [index.html](./index.html) locally in a browser, or deploy the repository with GitHub Pages:

1. Open repository **Settings → Pages**.
2. Under Build and deployment, select **Deploy from a branch**.
3. Select branch **main**, folder **/(root)**, and save.
4. Wait for GitHub Pages to publish the site; the URL appears in the Pages settings.

## Important limitations

This is the first starter milestone. It **does not generate AI artwork yet**. The image-generation connection and secure server-side API handling are planned next. Do not place secret API keys in browser code or commit them to GitHub. Some PDF/browser features depend on loading PDF.js from its CDN.

The current storyboard splitter is heuristic: inspect the generated pages/panels and correct the split before export. It does not guarantee perfect parsing of every screenplay or comic-production script. Keep the original source file as the canonical script.

## Roadmap

1. Script parsing tuned for panel-based comic scripts and source dialogue preservation.
2. Character bible and reference-image management.
3. Secure server-side image generation provider adapter, progress tracking, retries, and cost controls.
4. Generated panel review, continuity checks, and deterministic speech-bubble lettering.
5. Full-page composition and high-resolution PDF/CBZ export.

## Privacy

Reference images and scripts are processed in the browser by this starter app and included in a project backup only when you choose to download it. Avoid using public hosting for sensitive materials. Once a server-side AI provider is added, its own data handling and retention rules will apply.
