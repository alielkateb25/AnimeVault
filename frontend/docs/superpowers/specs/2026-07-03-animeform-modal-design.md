# AnimeForm Modal Design

## Overview

Convert the current inline AnimeForm into a modal-style overlay that replaces the content area (right of sidebar) with a fade-in/fade-out transition. Clean up the form UI: single-column layout, compact spacing, logical field ordering.

## Layout

- Form replaces the entire content area (right of sidebar), not a fixed overlay on top
- Fade-in/fade-out transition: 0.35s ease (cards fade out with translateY(-6px), form fades in with translateY(0))
- Max-width: 620px, centered in the content area
- Background: `var(--bg-main)`, border-radius: 12px, border: 1px solid `var(--border)`

## Structure

```
┌─────────────────────────────────────────┐
│ Header: "Add anime" / "Edit anime"   ×  │
├─────────────────────────────────────────┤
│  Name *                                 │
│  [────────────────────────────────────] │
│                                         │
│  Type                                   │
│  [ 📺 TV Series ]  [ 🎬 Movie ]         │
│                                         │
│  [📷]  Cover image                      │
│  130×185  [ Click to upload ─────────] │
│                                         │
│  Status          Streaming link          │
│  [────────────]  [────────────────────] │
│  ───────────────────────────────────    │
│  SEASONS                    + Add season │
│  ┌ Season 1              Remove ─┐     │
│  │ [Episodes] [Link ───────────] │     │
│  └────────────────────────────────┘     │
│                                         │
│  Current season   Episode *             │
│  [──────────────] [──────────────────]  │
│                                         │
│  Notes                                  │
│  [────────────────────────────────────] │
├─────────────────────────────────────────┤
│  [ Save ]          [ Cancel ]           │
└─────────────────────────────────────────┘
```

## Field Order (top to bottom)

1. **Name** — text input, required
2. **Type** — TV/Movie toggle pills, switches form sections
3. **Cover image** — dashed upload zone + 130×185 preview
4. **Status + Streaming link** — side-by-side in a 2-column grid
5. **Seasons (TV only)** — section with "SEASONS" uppercase label, "− Add season" link, per-season cards with episodes count and link inputs, Remove button per season
6. **Current season + Episode (TV only)** — side-by-side; season dropdown lists all defined seasons; episode number input, required
7. **Notes** — text input, optional

## Dimensions

| Element | Value |
|---------|-------|
| Card max-width | 620px |
| Header padding | 16px 20px 12px |
| Body padding | 18px 20px |
| Footer padding | 14px 20px 18px |
| Gap between fields | 16px |
| Standard field height | 38px |
| Type pill height | 34px |
| Season card padding | 12px |
| Season field height | 32px |
| Labels font size | 13px, 500 weight |
| Section labels (Seasons) | 11px, 600 weight, uppercase |
| Image preview | 130×185px |
| Footer buttons | 36px height |

## Animation

- **Open**: cards fade out (opacity 0, translateY(-6px), 0.35s ease), then form fades in (opacity 1, translateY(0), 0.35s ease)
- **Close**: form fades out (opacity 0, translateY(-6px), 0.35s ease), then cards fade in (opacity 1, translateY(0), 0.35s ease)
- Both use CSS transitions, not JS animation libraries

## States

- **Add mode**: header says "Add anime", save button says "Add to vault", no id in form data
- **Edit mode**: header says "Edit anime", save button says "Save changes", form pre-filled with anime data, image shows existing preview
- **Loading**: save button shows "Saving…" and is disabled during API call
- **Validation errors**: inline error messages below fields in red (`var(--red)`)
- **No seasons yet** (TV): blank state message with add button

## Movie Mode (type === 'movie')

- Seasons section hidden
- Current season + Episode hidden
- Info text: "A movie is tracked as a single entry. Set status to 'Completed' when you've watched it."
- Save sends: 1 season with 1 episode

## Components Affected

- `AnimeForm` component in `App.jsx`: restructure JSX, update styles
- `MainContent` in `App.jsx`: remove inline AnimeForm rendering, pass `showForm` up to App
- `App` in `App.jsx`: render AnimeForm in content area with conditional `showForm`, handle animation classes
- CSS (`index.css`): no changes needed (uses CSS variables)

## Cleanup

- Remove `.superpowers/` brainstorming artifacts from project root
- Remove `formStyle`/`smallInput`/`seasonStyle` local variables if replaced by new styles
