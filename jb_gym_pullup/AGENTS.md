# AGENTS.md

## Project identity

This directory is the independent GYM Pull-up Trainer project:

```text
/Users/kevinwei/Dropbox/0DownLoad/codex_on_GYM_project/jb_gym_pullup
```

For every Pull-up Trainer request, read the parent `../AGENTS.md` and this file before discussing, running commands, or editing files.

## Strict project boundary

1. Keep all Pull-up Trainer source, assets, build output, documentation, and tests inside this directory.
2. Run Pull-up shell commands with this directory as `workdir` and verify it with `pwd` when starting or resuming.
3. Do not read, edit, build, publish, or copy code from the parent GYM Bicycle app, `codex_on_FASCIA_project`, or `codex_on_BIKE_Project` unless the user explicitly requests cross-project work.
4. Do not reuse Bicycle, Fascia, or BIKE version numbers. Pull-up Trainer has its own version sequence beginning at `V01`.
5. Use relative, cross-platform paths in source code.

## Title and release rule

- Use `GYM Pull-up Trainer Vnn YYYY.MM.DD HH:mm`.
- For a meaningful Pull-up release, increment `Vnn` and refresh the timestamp.
- Keep the document `<title>` and visible top-line title identical.
- Keep `Created by Kevin` on the visible top line.

## Build and preview

- Build locally with `python3 build.py` from this directory.
- Local preview file: `index.html`.
- Published URL: `https://greenmoon.github.io/GYM/jb_gym_pullup/`.
- For `li` or `gi`, read the actual Pull-up `index.html` title and use the required `LI>` or `GI>` completion format.

## iPhone requirements

- Optimize for iPhone landscape orientation and long-distance readability.
- Keep the 180×180 Apple touch icon declaration and the standalone web-app manifest working.
- Keep the Pull-up Home Screen name distinct from Bicycle and Fascia.

## Pull-up UKK record

Use `doc/UKK_GYM_PULLUP_PROGRESS_TC.html` for future Pull-up-only Unknown → Known records. Create it automatically when the first Pull-up-only entry is required. Do not add future Pull-up implementation records to the Bicycle, Fascia, or BIKE progress files.
