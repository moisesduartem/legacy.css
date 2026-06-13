# legacy.css

`legacy.css` is a classless CSS framework for administrative and corporate interfaces. It is inspired by the visual language of classic business, public-sector, and back-office web systems from the 2000s.

The project is not trying to compete with Bootstrap, Tailwind CSS, or component libraries. Its goal is to provide a dependable default stylesheet for semantic HTML.

## Philosophy

- Semantic HTML first.
- As few CSS classes as possible.
- Native elements should look usable by default.
- Classes exist only for patterns that HTML does not represent naturally, such as `.panel`, `.alert`, and `.container`.

For example, a plain `<button>`, `<table>`, `<input>`, `<select>`, `<textarea>`, `<fieldset>`, `<legend>`, and `<details>` should already produce a consistent administrative interface.

## Why Not Bootstrap?

Bootstrap is a complete component framework with a large API, layout system, JavaScript behaviors, and many utility classes.

`legacy.css` has a narrower purpose: it styles ordinary HTML so internal tools, prototypes, CRUD screens, documentation pages, and small administrative systems can start with a consistent baseline without adopting a full design system.

## Installation

Install from npm:

```sh
npm install legacy.css
```

Or with pnpm:

```sh
pnpm add legacy.css
```

Import the built CSS:

```html
<link rel="stylesheet" href="./node_modules/legacy.css/dist/legacy.css">
```

Or import the source entry point in a bundler:

```css
@import "legacy.css/src/legacy.css";
```

For interactive components such as tabs, modal dialogs, multiselect controls, and drag/drop boards, include the optional browser script:

```html
<script src="./node_modules/legacy.css/dist/legacy.min.js" defer></script>
```

The script exposes `window.LegacyCss` and has no runtime dependency. If jQuery is already present on the page, it also registers small `modal`, `tabs`, `multiselect`, and `dragdrop` bridges.

## CDN

TODO: publish package and document CDN usage.

## Usage

Write semantic HTML and let the stylesheet provide the baseline:

```html
<main>
  <h1>Cadastro de fornecedor</h1>

  <form>
    <fieldset>
      <legend>Dados cadastrais</legend>

      <label for="name">Nome</label>
      <input id="name" name="name" type="text">

      <label for="status">Status</label>
      <select id="status" name="status">
        <option>Ativo</option>
        <option>Inativo</option>
      </select>
    </fieldset>

    <button type="submit">Salvar</button>
  </form>
</main>
```

## Project Structure

```text
src/
  legacy.css
  variables.css
  base.css
  typography.css
  forms.css
  multiselect.css
  buttons.css
  toolbars.css
  tables.css
  lists.css
  navigation.css
  pagination.css
  panels.css
  modal.css
  tabs.css
  dragdrop.css
  alerts.css
  badges.css
  utilities.css
  legacy.js
dist/
docs/
```

`src/legacy.css` is the main entry point and imports the other files in order.
`src/legacy.js` contains the optional browser behavior for tabs, modal dialogs, multiselect controls, drag/drop boards, and pagination.

## Scripts

```sh
pnpm run lint
pnpm run build
pnpm run build:min
pnpm run build:js
pnpm run build:all
pnpm run build:docs
pnpm run watch
```

The CSS build uses Lightning CSS to bundle `src/legacy.css` into `dist/legacy.css` and generate `dist/legacy.min.css`. The JavaScript build keeps a readable `dist/legacy.js` copy and uses Vite to generate `dist/legacy.min.js`.

## Roadmap

- Expand coverage for semantic elements such as `details`, `summary`, `dialog`, `progress`, and `meter`.
- Refine form layouts without requiring classes.
- Add print styles for administrative reports.
- Add accessibility-focused states for validation and interaction.
- Publish the package to npm.
- Document CDN usage after publication.
- Add visual regression pages.

## Contributing

Contributions are welcome. Keep the project focused on semantic HTML, conservative defaults, and small class APIs for patterns that HTML does not cover.

Before opening a pull request, run:

```sh
pnpm run lint
pnpm run build:all
```

## License

MIT
