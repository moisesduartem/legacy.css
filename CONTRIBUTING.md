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
npm install
```

Run linting:

```sh
npm run lint
```

Build the distributable files:

```sh
npm run build:all
```

Use the files in `docs/` for manual visual checks and the future GitHub Pages site.

## Pull Requests

Please include:

- A short description of the change.
- The reason the change belongs in a classless CSS baseline.
- Any relevant screenshots for visual changes.
- Confirmation that linting and build pass.
