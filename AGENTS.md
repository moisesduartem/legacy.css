# Repository Guidelines

## Project Structure & Module Organization
This repository is a small CSS framework. Source files live in `src/`, with `src/legacy.css` as the entry point that imports the rest in order: `variables.css`, `base.css`, `typography.css`, `lists.css`, `forms.css`, `buttons.css`, `tables.css`, `navigation.css`, `panels.css`, `alerts.css`, and `utilities.css`. Built artifacts are written to `dist/` and should not be edited by hand.

## Build, Test, and Development Commands
Use `pnpm` with the scripts defined in `package.json`:

```sh
pnpm run lint
pnpm run build
pnpm run build:min
pnpm run build:all
pnpm run build:docs
pnpm run watch
```

`lint` checks CSS with Stylelint. `build` bundles `src/legacy.css` into `dist/legacy.css`. `build:min` creates `dist/legacy.min.css`. `build:all` runs both builds, and `watch` rebuilds on file changes.

## Coding Style & Naming Conventions
Follow the existing CSS style: 2-space indentation, lowercase selectors, one rule per block, and property grouping by layout, box model, then typography or state. Keep class names semantic and narrow in scope, such as `.container`, `.panel`, and `.alert`. Prefer CSS custom properties from `src/variables.css` for shared values instead of hard-coded colors or spacing.

## Testing Guidelines
There is no dedicated automated test suite in this repository. Validate changes by running `pnpm run lint` and `pnpm run build:all`. For behavior changes, inspect the generated CSS in `dist/` and verify the affected semantic elements in a browser.

## Commit & Pull Request Guidelines
The Git history uses short, plain commit subjects such as `Initial commit`, `components, forms, tables, build tools, github pages`, and `i18n (en-US + pt-BR)`. Keep commit messages concise and descriptive. Pull requests should summarize the CSS areas touched, note any build or lint results, and include screenshots or before/after notes when visual styles change.

## Agent Instructions
Make changes in `src/` first, then regenerate `dist/` with the build scripts. Avoid unrelated refactors and keep the framework focused on semantic HTML and conservative defaults.
