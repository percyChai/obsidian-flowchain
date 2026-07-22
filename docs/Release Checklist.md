# FlowChain Release Checklist

## Required Files

- `manifest.json`
- `main.js`
- `styles.css`
- `versions.json`

## Build

```bash
npm run build
```

## Optional Quality Check

```bash
npm run lint
```

Lint warnings about Chinese UI sentence case can be reviewed case by case.

## Manual Smoke Test

- Generate graph.
- Refresh synchronized graph.
- Choose layout mode.
- Beautify graph.
- Switch between two Canvas files and confirm sessions do not cross.
- Confirm bidirectional relations declared in both Markdown files create only one Canvas edge.
