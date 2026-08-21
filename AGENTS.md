# AGENTS.md

## Project instruction

This file gives Codex project-level guidance.  
For every user request, the first step is to read and follow this `AGENTS.md` file before discussing, analyzing, running commands, editing files, or generating code.

## Working-directory alignment

This repository is the active GYM project:

```text
/Users/kevinwei/Dropbox/0DownLoad/codex_on_GYM_project
```

For every GYM-project shell command:

1. Set the command `workdir` to `/Users/kevinwei/Dropbox/0DownLoad/codex_on_GYM_project` when the tool supports it.
2. Verify the working directory with `pwd` when starting or resuming work.
3. If a shell ignores its requested `workdir`, begin the command with `cd /Users/kevinwei/Dropbox/0DownLoad/codex_on_GYM_project`.
4. Keep source-code paths relative to the repository after the shell is aligned.
5. Do not read, edit, generate, or test files in other projects unless the user explicitly requests it.
6. If the Codex task's inherited default `pwd` points elsewhere, treat it as untrusted and realign each command explicitly.

## Temporary Dropbox sync alert rule

The active GYM project is stored inside Dropbox. Alert the user when temporarily pausing or resuming Dropbox sync is appropriate.

1. Before CCS imports, creates, migrates, cleans, or repeatedly builds a project inside this repository, tell the user to temporarily pause Dropbox sync.
2. Do not request a pause for read-only discussion, CCS installation under `/Applications`, SDK installation outside Dropbox, or simple low-frequency text edits.
3. Treat pausing and resuming Dropbox as physical man-in-loop actions. Do not claim they happened unless the user confirms them or a verified tool reports the state.
4. After CCS debugging has stopped, all project files are saved, and CCS is closed or no longer writing the project, remind the user to resume Dropbox sync.
5. Before resuming, recommend excluding generated folders such as `Debug/` and `Release/` from version control or routine synchronization where practical.
6. After resuming, ask the user to confirm that Dropbox completed without conflicted copies before declaring the workflow complete.
7. Display every Dropbox sync reminder as a visually isolated alert with a blank line before and after it, using exactly the prefix `ALERT> `.

Pause example:

```text
ALERT> Please temporarily pause Dropbox sync before CCS starts writing or repeatedly building the GYM project. Confirm after sync is paused.
```

Resume example:

```text
ALERT> CCS has stopped writing project files. Please resume Dropbox sync and confirm that synchronization finishes without conflicted copies.
```

## Title Naming rule

if the titie as eg 'title_example V07 2026.06.24 17:32'
the version number should be added by one as 'V08'
the date should be changed as the today eg '2026.mm.dd hh:mm'    

### LI/GI title alignment

For `li` and `gi` completion messages:

1. Read the full title from the actual current local or published `index.html`; do not reuse an old or example title.
2. The project name in the title must match the active repository project name (`GYM` for this repository).
3. The version and time tag must exactly match the current `index.html` title.
4. Use `LI> [full current index title] completed` for local previews.
5. Use `GI> [full current index title] completed` for published global previews.

## Bicycle heart-rate display rule

For the GYM bicycle exercise index:

1. Optimize the display for an iPhone in landscape orientation.
2. Make the target heart-rate number the dominant element, occupying approximately 60% of the usable display.
3. Use a 90–110 BPM target range (beats per minute).
4. During each five-minute cycle, use three linear display steps: 90→110 BPM at `00:00–03:00`, 110→90 BPM at `03:00–04:00`, then a 59→0 seconds countdown at `04:00–05:00`.
5. Provide C1, C2, and C3 controls to select one, two, or three maximum cycles; default to C2 (10 minutes).
6. After the selected final cycle, stop automatically and alert the user with `DONE`.
7. Color the large heart-rate value in rainbow order by BPM: increasing values move from red toward violet, while decreasing values reverse from violet toward red.
8. Show the full current index title, version, time tag, and `Created by Kevin` together on the top line of the display.
9. When a workout is running, change the START control to a contrasting active color so its active state is obvious.

## Auto UKK progress record rule

Use `doc/UKK_GYM_PROGRESS_TC.html` as the project's Unknown -> Known progress record.
If the `doc/` directory or UKK HTML file does not exist when a UKK entry is required, create it automatically.

After completing a meaningful investigation, implementation, test, or engineering decision:

1. Automatically add one concise UKK entry without waiting for a separate user request.
2. Record the unknown question, the verified known conclusion, and the supporting detail or next verification step.
3. Assign a stable three-digit index. Start at `001` and increment by one; never renumber older entries.
4. Display each record timetag as `(NNN YYYY-MM-DD HH:mm)`, for example `(007 2026-07-16 14:53)`.
5. Keep records in latest-to-oldest display order so the highest index appears first.
6. Keep entry details collapsed by default for fast reading and reduced scrolling.
7. Update the UKK HTML title/footer by incrementing `Vnn` and applying the current timetag according to the Title Naming rule.
8. Do not create duplicate records for the same completed action. Do not mark assumptions or unverified hardware behavior as Known.

## User abbreviation rules

The user often uses short abbreviation commands. Interpret them as task modifiers.

| Abbrev | Meaning |
|---|---|
| `go` | Read `AGENTS.md` first, then perform the requested work using the current project rules and handoff flow. |
| `autorun` | Implement and run the already-discussed solution automatically. Run suitable project code, verify it, and open the completed HTML in Google Chrome. Continue autonomously except when a physical man-in-loop action is required. |
| `tc` | Reply in Traditional Chinese. |
| `en` | Reply in English. |
| `dd` | Deep Dive, Give detailed explanation |
| `di` | Discuss only. Analyze and recommend without implementing, running changes, or modifying files. |
| `kk` | Unknown -> Known record. Add a concise entry to `doc/UKK_GYM_PROGRESS_TC.html` containing the unknown question, verified known conclusion, and supporting evidence or next verification step. If the `doc/` directory or UKK HTML file does not exist, create it automatically. |
| `gg` | Generate Graphic, diagram, call tree, flow chart, or visual explanation when useful. |
| `nu` | NUmeric explain method in step by step present how the priciple explore|
| `ss` | Significant Summarize youtube, paper, source, screenshot, video, transcript, PDF, or provided text. |
| `ee` | Enhancement English. Before answering the request, show the user's command verbatim under `raw>`, an improved English version under `betterEng>`, and a Traditional Chinese version under `tc>`. Then answer the actual request. |
| `li` | Local Index HTML. Automatically run the complete local workflow: build Python -> local HTML -> open the local `index.html` for checking. After opening it, show `LI> ` followed by the full current index title and ` completed`. Example: `LI> GYM Bicycle Heart Rate V01 2026.07.25 13:51 completed`. |
| `gi` | Global Index URL Upload. Automatically run the complete workflow: build Python -> HTML -> push to the project repository -> publish the worldwide URL -> open the published repository `index.html` for checking. After opening it, show `GI> ` followed by the full current published index title and ` completed`. The project name, version, and time tag must exactly match that index title. Example: `GI> GYM Bicycle Heart Rate V01 2026.07.25 13:51 completed`. |

## Interpretation examples

- `in tc`  
  -> Reply in Traditional Chinese.

- `gg`  
  -> Provide a call tree or flow diagram in picture form.

## Coding style preference

Prefer practical, minimal, easy-to-modify code.

When editing existing code:

1. Do not rewrite the whole project unless requested.
2. Preserve existing function names and data flow when possible.
3. Prefer small patches with clear insertion locations.
4. Explain why the change fixes the issue.
5. Avoid breaking existing behavior.
6. Add debug prints only when useful and removable.
7. Keep compatibility with Windows and Linux paths when possible.
8. Prefer relative paths over hard-coded absolute paths.
9. Use the same in PC folder name and in Github repo project name otherwise given WARN message 

## Project path style

Use cross-platform path handling.

Prefer:

```python
from pathlib import Path

ROOT = Path(__file__).resolve().parent
csv_path = ROOT / "debug_inference" / "file.csv"
```

Avoid:

```python
csv_path = "C:\\Users\\..."
csv_path = "/home/user/..."
```

unless the user explicitly asks for physical absolute paths.

## Debug / analysis style

When checking bugs, report in this order:

1. Most likely root cause.
2. Evidence in code or log.
3. Minimal fix.
4. Safer long-term fix if needed.
5. Test method.

## Planning / status style

For development planning, present the plan as numbered steps and include a checklist/status table for user review.

Preferred format:

1. Define the data owner and input/output boundary.
2. Implement the smallest working producer path.
3. Verify locally.
4. Verify from another device.
5. Commit/push/open URL only after checks pass.

Checklist example:

| Step | Status | Check method |
|---:|---|---|
| 1 | Pending/In progress/Done | Specific command, URL, or visual check |
| 2 | Pending/In progress/Done | Specific command, URL, or visual check |

When working on UART/data/dashboard architecture, always state which process owns UART and which parts only read HTTP/MQTT data.
 
## Response style

Unless the user asks otherwise:

- Be direct.
- Prefer engineering explanation.
- Use tables for mappings.
- Use call trees for flow.
- Use concise comments in code.
- If user writes `tc`, answer in Traditional Chinese.
- If user writes `dd`, provide deeper detail.
