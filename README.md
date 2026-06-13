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

For interactive components such as tabs, popovers, modal dialogs, toast notifications, multiselect controls, and drag/drop boards, include the optional browser script:

```html
<script src="./node_modules/legacy.css/dist/legacy.min.js" defer></script>
```

The script exposes `window.LegacyCss` and has no runtime dependency. If jQuery is already present on the page, it also registers small `modal`, `toast`, `tabs`, `popover`, `multiselect`, and `dragdrop` bridges.

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
  popover.css
  tabs.css
  dragdrop.css
  progress.css
  alerts.css
  toast.css
  badges.css
  utilities.css
  legacy.js
dist/
docs/
```

`src/legacy.css` is the main entry point and imports the other files in order.
`src/legacy.js` contains the optional browser behavior for tabs, popovers, modal dialogs, toast notifications, multiselect controls, drag/drop boards, and pagination.

## Scripts

```sh
pnpm run lint
pnpm run build
pnpm run build:min
pnpm run build:js
pnpm run build:all
pnpm run build:docs
pnpm run watch
pnpm run mcp
```

The CSS build uses Lightning CSS to bundle `src/legacy.css` into `dist/legacy.css` and generate `dist/legacy.min.css`. The JavaScript build keeps a readable `dist/legacy.js` copy and uses Vite to generate `dist/legacy.min.js`.

## MCP Server

This package includes a small stdio MCP server for agents that need project-aware access to `legacy.css` source files, built CSS, design tokens, and semantic HTML examples.

Run it from the repository:

```sh
pnpm run mcp
```

Or, after installing the package, use the executable:

```sh
legacy-css-mcp
```

The server exposes resources for the README, source CSS entry point, bundled CSS, and every CSS module under `src/`. It also exposes tools to list modules, read a module, inspect design tokens, search CSS source, and return small usage snippets.

### Configure an MCP Client

Point your MCP client at the server command. From a local checkout, use:

```json
{
  "mcpServers": {
    "legacy-css": {
      "command": "pnpm",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/legacy.css"
    }
  }
}
```

After installing the package globally or inside a project, use the binary instead:

```json
{
  "mcpServers": {
    "legacy-css": {
      "command": "legacy-css-mcp"
    }
  }
}
```

Use the first form while developing this repository. Use the binary form when another project wants to consume the published package.

### Build Pages Quickly With MCP

Once the server is connected, ask your agent to use the `legacy-css` MCP server before writing markup. Good prompts are specific about the page type, data fields, and components:

```text
Use the legacy-css MCP server to build a supplier registration page.
Include a toolbar, two fieldsets, status badges, a table of recent suppliers,
and an alert area for validation messages.
```

```text
Use legacy-css resources and snippets to scaffold an admin dashboard page.
Keep the HTML semantic, prefer native forms and tables, and include the
legacy.css stylesheet and optional legacy.min.js script.
```

The MCP server helps agents inspect the available CSS modules, find selectors and custom properties, and reuse semantic snippets for forms, tables, panels, alerts, badges, toasts, popovers, and tabs. For interactive tabs, popovers, modals, toasts, multiselect controls, drag/drop boards, and pagination, include:

```html
<link rel="stylesheet" href="./node_modules/legacy.css/dist/legacy.css">
<script src="./node_modules/legacy.css/dist/legacy.min.js" defer></script>
```

When reviewing generated pages, keep the project philosophy in mind: start with semantic HTML, rely on native elements first, and use classes only for patterns such as `.container`, `.panel`, `.alert`, `.toast`, `.popover`, `.badge`, `.toolbar`, `.tabs`, `.modal`, `.multiselect`, `.dragdrop`, `.pagination`, and `.progress`.

## Roadmap

- Expand coverage for semantic elements such as `details`, `summary`, `dialog`, and `meter`.
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
