#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, "src");

const cssModules = [
  "variables.css",
  "base.css",
  "typography.css",
  "lists.css",
  "forms.css",
  "multiselect.css",
  "buttons.css",
  "toolbars.css",
  "tables.css",
  "navigation.css",
  "pagination.css",
  "panels.css",
  "modal.css",
  "tabs.css",
  "dragdrop.css",
  "progress.css",
  "alerts.css",
  "badges.css",
  "utilities.css",
];

const snippets = {
  form: {
    title: "Administrative form",
    html: `<main class="container">
  <h1>Fornecedor</h1>

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
    <button type="reset">Limpar</button>
  </form>
</main>`,
  },
  table: {
    title: "Data table",
    html: `<table>
  <caption>Pedidos recentes</caption>
  <thead>
    <tr>
      <th scope="col">Pedido</th>
      <th scope="col">Cliente</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1001</td>
      <td>Acme Ltda.</td>
      <td><span class="badge success">Aprovado</span></td>
    </tr>
  </tbody>
</table>`,
  },
  panel: {
    title: "Panel with alert",
    html: `<section class="panel">
  <header class="panel-header">
    <h2>Resumo</h2>
  </header>
  <div class="panel-body">
    <p class="alert info">A rotina foi executada com sucesso.</p>
  </div>
</section>`,
  },
  tabs: {
    title: "Tabs",
    html: `<div class="tabs" data-tabs>
  <div class="tab-list" role="tablist">
    <button type="button" role="tab" aria-selected="true">Geral</button>
    <button type="button" role="tab">Histórico</button>
  </div>
  <section class="tab-panel" role="tabpanel">
    <h2>Geral</h2>
    <p>Dados principais do registro.</p>
  </section>
  <section class="tab-panel" role="tabpanel" hidden>
    <h2>Histórico</h2>
    <p>Eventos recentes do registro.</p>
  </section>
</div>`,
  },
  progress: {
    title: "Progress and loading",
    html: `<label for="case-progress">Progresso</label>
<progress id="case-progress" value="62" max="100">62%</progress>
<small class="progress-label">62% concluído</small>

<div class="progress progress-loading" role="progressbar" aria-label="Carregando" aria-valuetext="Carregando">
  <span class="progress-bar"></span>
</div>`,
  },
};

const resourceMap = new Map([
  [
    "legacy://readme",
    {
      name: "legacy.css README",
      description: "Project overview, usage, scripts, and philosophy.",
      path: join(root, "README.md"),
      mimeType: "text/markdown",
    },
  ],
  [
    "legacy://css/entry",
    {
      name: "CSS entry point",
      description: "The source entry point that imports all CSS modules in order.",
      path: join(srcDir, "legacy.css"),
      mimeType: "text/css",
    },
  ],
  [
    "legacy://css/dist",
    {
      name: "Built CSS",
      description: "The bundled stylesheet generated from src/legacy.css.",
      path: join(root, "dist", "legacy.css"),
      mimeType: "text/css",
    },
  ],
]);

for (const moduleName of cssModules) {
  resourceMap.set(`legacy://css/module/${moduleName}`, {
    name: moduleName,
    description: `Source CSS module: ${moduleName}`,
    path: join(srcDir, moduleName),
    mimeType: "text/css",
  });
}

function writeMessage(message) {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
}

function result(id, value) {
  writeMessage({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message) {
  writeMessage({ jsonrpc: "2.0", id, error: { code, message } });
}

function textContent(text) {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

async function readProjectFile(path) {
  return readFile(path, "utf8");
}

async function getModule(moduleName) {
  if (!cssModules.includes(moduleName)) {
    throw new Error(
      `Unknown CSS module "${moduleName}". Use list_css_modules to inspect valid modules.`,
    );
  }

  return readProjectFile(join(srcDir, moduleName));
}

function extractTokens(css) {
  return Array.from(
    css.matchAll(/--legacy-[\w-]+:\s*([^;]+);/g),
    ([match, value]) => {
      const name = match.slice(0, match.indexOf(":"));
      return { name, value: value.trim() };
    },
  );
}

function extractSelectors(css) {
  return Array.from(css.matchAll(/(^|\n)([^@{}\n][^{}]+)\s*\{/g), ([, , raw]) =>
    raw
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean),
  ).flat();
}

async function searchCss(query) {
  const normalizedQuery = query.toLowerCase();
  const matches = [];

  for (const moduleName of cssModules) {
    const css = await getModule(moduleName);
    const lines = css.split("\n");

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(normalizedQuery)) {
        matches.push({
          module: moduleName,
          line: index + 1,
          text: line.trim(),
        });
      }
    });
  }

  return matches;
}

function listTools() {
  return [
    {
      name: "list_css_modules",
      description: "List source CSS modules in import order.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_css_module",
      description: "Read a source CSS module by filename, for example buttons.css.",
      inputSchema: {
        type: "object",
        properties: {
          module: {
            type: "string",
            description: "CSS module filename from list_css_modules.",
          },
        },
        required: ["module"],
      },
    },
    {
      name: "get_design_tokens",
      description: "Return CSS custom properties defined by legacy.css.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "search_css",
      description: "Search legacy.css source modules for selectors, properties, or token names.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Case-insensitive search query.",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "usage_snippet",
      description: "Return a semantic HTML snippet styled by legacy.css.",
      inputSchema: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            enum: Object.keys(snippets),
            description: "Snippet pattern to return.",
          },
        },
        required: ["pattern"],
      },
    },
  ];
}

async function callTool(name, args = {}) {
  switch (name) {
    case "list_css_modules":
      return textContent(cssModules.join("\n"));

    case "get_css_module": {
      const css = await getModule(args.module);
      return textContent(css);
    }

    case "get_design_tokens": {
      const css = await getModule("variables.css");
      return textContent(JSON.stringify(extractTokens(css), null, 2));
    }

    case "search_css": {
      if (!args.query) {
        throw new Error("search_css requires a query argument.");
      }

      const matches = await searchCss(args.query);
      return textContent(JSON.stringify(matches, null, 2));
    }

    case "usage_snippet": {
      const snippet = snippets[args.pattern];

      if (!snippet) {
        throw new Error(
          `Unknown snippet pattern "${args.pattern}". Expected one of: ${Object.keys(
            snippets,
          ).join(", ")}.`,
        );
      }

      return textContent(`${snippet.title}\n\n${snippet.html}`);
    }

    default:
      throw new Error(`Unknown tool "${name}".`);
  }
}

async function handleRequest(message) {
  const { id, method, params } = message;

  if (method === "initialize") {
    result(id, {
      protocolVersion: params?.protocolVersion ?? "2024-11-05",
      capabilities: {
        resources: {},
        tools: {},
      },
      serverInfo: {
        name: "legacy-css-mcp",
        version: "0.1.0",
      },
    });
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (method === "tools/list") {
    result(id, { tools: listTools() });
    return;
  }

  if (method === "tools/call") {
    const toolResult = await callTool(params?.name, params?.arguments ?? {});
    result(id, toolResult);
    return;
  }

  if (method === "resources/list") {
    result(id, {
      resources: Array.from(resourceMap, ([uri, resource]) => ({
        uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    });
    return;
  }

  if (method === "resources/read") {
    const resource = resourceMap.get(params?.uri);

    if (!resource) {
      throw new Error(`Unknown resource URI "${params?.uri}".`);
    }

    result(id, {
      contents: [
        {
          uri: params.uri,
          mimeType: resource.mimeType,
          text: await readProjectFile(resource.path),
        },
      ],
    });
    return;
  }

  if (method === "prompts/list") {
    result(id, { prompts: [] });
    return;
  }

  if (method === "ping") {
    result(id, {});
    return;
  }

  error(id, -32601, `Method not found: ${method}`);
}

function parseContentLengthMessages(buffer) {
  const messages = [];

  while (buffer.toString("utf8", 0, 15) === "Content-Length:") {
    const text = buffer.toString("utf8");
    const headerEnd = buffer.indexOf("\r\n\r\n");

    if (headerEnd === -1) {
      break;
    }

    const header = text.slice(0, headerEnd);
    const length = Number(header.match(/Content-Length:\s*(\d+)/i)?.[1]);
    const bodyStart = headerEnd + 4;

    if (!Number.isFinite(length) || buffer.length < bodyStart + length) {
      break;
    }

    const body = buffer.toString("utf8", bodyStart, bodyStart + length);
    messages.push(JSON.parse(body));
    buffer = buffer.slice(bodyStart + length);
  }

  return { messages, buffer };
}

async function dispatch(raw, framedMessage) {
  if (!framedMessage && !raw.trim()) {
    return;
  }

  try {
    await handleRequest(framedMessage ?? JSON.parse(raw));
  } catch (caught) {
    const parsed = framedMessage ?? JSON.parse(raw);
    error(parsed.id ?? null, -32000, caught.message);
  }
}

if (process.argv.includes("--self-test")) {
  const variables = await getModule("variables.css");
  const selectors = extractSelectors(await getModule("buttons.css"));

  process.stdout.write(
    JSON.stringify(
      {
        modules: cssModules.length,
        tokens: extractTokens(variables).length,
        buttonSelectors: selectors.length,
        root: relative(process.cwd(), root) || ".",
      },
      null,
      2,
    ),
  );
  process.stdout.write("\n");
} else {
  let buffer = Buffer.alloc(0);
  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    if (buffer.toString("utf8", 0, 15) === "Content-Length:") {
      const parsed = parseContentLengthMessages(buffer);
      buffer = parsed.buffer;

      for (const message of parsed.messages) {
        dispatch("", message);
      }

      return;
    }

    let newlineIndex = buffer.indexOf("\n");

    while (newlineIndex !== -1) {
      const raw = buffer.toString("utf8", 0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      dispatch(raw);
      newlineIndex = buffer.indexOf("\n");
    }
  });
}
