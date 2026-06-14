# Contributing

Thanks for considering a contribution to `legacy.css`.

## Principles

- Prefer semantic HTML selectors before adding classes.
- Add classes only for patterns that HTML cannot express naturally.
- Keep the visual style restrained, practical, and appropriate for administrative systems.
- Avoid runtime JavaScript dependencies.
- Keep build tooling simple.

## Development

Install dependencies:

```sh
pnpm install
```

Run linting:

```sh
pnpm run lint
```

Build the distributable files:

```sh
pnpm run build:all
```

Use the files in `docs/` for manual visual checks and the future GitHub Pages site.

## Branching and Releases

Use `develop` as the integration branch for day-to-day work. Create feature and fix branches from `develop`, then open pull requests back into `develop`.

When `develop` is ready to release, open a pull request from `develop` to `main`. Use a Conventional Commit title for that release merge, such as:

```text
feat: add pagination component
fix: correct table overflow on narrow screens
feat!: remove deprecated selector aliases
```

After changes land on `main`, Release Please opens or updates a release pull request. That release pull request updates `package.json`, `.release-please-manifest.json`, and `CHANGELOG.md`. Merging it creates the GitHub Release and tag.

Publishing to npm is intentionally manual and outside the repository automation for now.

## Pull Requests

Please include:

- A short description of the change.
- The reason the change belongs in a classless CSS baseline.
- Any relevant screenshots for visual changes.
- Confirmation that linting, type checking, unit tests, and build pass.
