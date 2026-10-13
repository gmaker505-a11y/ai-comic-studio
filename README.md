# PanelForge — AI Comic Studio

A mobile-friendly, script-first comic-production workspace. The app is tuned against **Strong Bros. Issue 1 — The Power Was Never Off** (22 comic pages, 115 panels).

## Current features

- Responsive mobile interface.
- Upload TXT, Markdown, or PDF scripts; PDF text is read with PDF.js.
- **Automatically builds the storyboard after file upload**, including comic page headings, numbered panel headings, and declared panel counts.
- Reports page/panel totals and flags declared/detected panel-count mismatches.
- Edit page titles and panel text; add, remove, reorder, and delete pages or panels; remove or replace attached artwork.
- Upload character reference images and keep a character-continuity brief with the project.
- Generate an image prompt for a panel or export a prompt pack for the full storyboard.
- Attach panel artwork images and display parsed speech, caption, and sound-effect lettering over the art.
- Print with one comic page per A4 sheet, panel grids, and overlaid lettering. Use the browser print dialog's **Save as PDF** option.
- Export an illustrated **CBZ** archive (PNG page images plus ComicInfo metadata) after every panel has artwork attached.
- Export the storyboard as JSON, download a full project backup, or import a previous backup.
- Automatically save/restore projects on the same browser/device using IndexedDB where supported.
- GitHub Actions checks JavaScript syntax, core features, and regression tests for the 22-page / 115-panel parsing case and dialogue lettering.

## Open the app

Live site: https://gmaker505-a11y.github.io/ai-comic-studio/

If the latest change does not appear, refresh the page or reopen the site after GitHub Pages finishes publishing the commit.

## Current limitations — important

- **Automatic AI illustration generation is not connected yet.** You can attach artwork created elsewhere and export prompts for all panels, but the site does not yet generate 115 images by itself. CBZ export requires artwork for every panel and currently blocks export when any panel is missing art.
- A secure image-generation service still needs to be connected. Keep provider API keys on a server-side service or secret store; never add private keys to this public repository or browser JavaScript.
- The app overlays dialogue, captions, and sound effects it can identify in the script. Review the lettering because unusual formatting, nested quotes, or long dialogue may need manual adjustment.
- PDF text extraction depends on the PDF.js CDN being reachable. Scanned/image-only PDFs need OCR; this version does not perform OCR.
- Browser print engines differ. Review the PDF before distribution, especially pages with unusually long dialogue or large images.
- The parser is tuned for numbered comic-production scripts. It reports count mismatches, but scripts with different heading conventions still need review. Keep the original PDF as the canonical source.

## GitHub validation

The workflow in `.github/workflows/validate.yml` checks the embedded JavaScript and runs `tests/parser.test.cjs` on pushes and pull requests to `main`.

## Privacy and project storage

Scripts, reference images, and attached artwork are handled in the browser. IndexedDB autosave is local to that browser/device and may be cleared by browser settings. Use **Download project backup** for a portable copy. Public GitHub Pages is not a private workspace; avoid publishing confidential scripts or reference material in the repository.
