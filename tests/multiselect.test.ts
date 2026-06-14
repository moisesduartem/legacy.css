// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dispatch, dom, html, nextFrame } from "./helpers/components";

describe("LegacyCss.multiselect", () => {
  it("creates a custom control and keeps it synchronized with the select", async () => {
    await createComponentDom(html`
      <label for="reviewers">Reviewers</label>
      <select id="reviewers" multiple data-placeholder="Choose reviewers">
        <option value="ana">Ana</option>
        <option value="bruno" selected>Bruno</option>
        <option value="carla" disabled>Carla</option>
      </select>
    `);
    const { document, LegacyCss } = dom.window;
    const select = document.getElementById("reviewers");
    const changes = vi.fn();
    select.addEventListener("change", changes);

    LegacyCss.multiselect.setup(select);
    const root = document.querySelector(".multiselect");
    const toggle = root.querySelector(".multiselect-toggle");
    const options = root.querySelectorAll(".multiselect-option");

    expect(select.classList.contains("multiselect-source")).toBe(true);
    expect(toggle.getAttribute("aria-label")).toBe("Reviewers");
    expect(root.querySelector(".multiselect-label").textContent).toBe("Bruno");

    LegacyCss.multiselect.open(root);
    expect(root.classList.contains("is-open")).toBe(true);

    options[0].click();
    expect(select.options[0].selected).toBe(true);
    expect(root.querySelector(".multiselect-label").textContent).toBe("Ana, Bruno");
    expect(changes).toHaveBeenCalledTimes(1);

    options[2].click();
    expect(select.options[2].selected).toBe(false);
  });

  it("supports keyboard open, movement, option toggle, and Escape close", async () => {
    await createComponentDom(html`
      <select id="reviewers" multiple>
        <option value="ana">Ana</option>
        <option value="bruno">Bruno</option>
      </select>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const select = document.getElementById("reviewers");

    LegacyCss.multiselect.setup(select);
    const root = document.querySelector(".multiselect");
    const toggle = root.querySelector(".multiselect-toggle");
    const options = root.querySelectorAll(".multiselect-option");

    toggle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(root.classList.contains("is-open")).toBe(true);
    expect(document.activeElement).toBe(options[0]);

    options[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(document.activeElement).toBe(options[1]);

    options[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(select.options[1].selected).toBe(true);

    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(root.classList.contains("is-open")).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it("handles empty selects, disabled state, form reset, and outside clicks", async () => {
    await createComponentDom(html`
      <button id="outside">Outside</button>
      <form id="form">
        <select id="empty" multiple></select>
        <select id="roles" name="roles" multiple>
          <option value="admin" selected>Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <select id="teams" multiple disabled>
          <option value="ops">Ops</option>
        </select>
      </form>
    `);
    const { document, LegacyCss } = dom.window;
    const empty = document.getElementById("empty");
    const roles = document.getElementById("roles");
    const teams = document.getElementById("teams");

    LegacyCss.multiselect.setup(empty);
    LegacyCss.multiselect.setup(roles);
    LegacyCss.multiselect.setup(teams);

    expect(empty.nextElementSibling.querySelector(".multiselect-empty").textContent).toBe("No options");
    expect(roles.nextElementSibling.querySelector(".multiselect-label").textContent).toBe("Admin");
    expect(roles.nextElementSibling.querySelector(".multiselect-toggle").id).toBe("roles-toggle");
    expect(teams.nextElementSibling.querySelector(".multiselect-toggle").disabled).toBe(true);

    roles.options[1].selected = true;
    roles.options[2].selected = true;
    roles.dispatchEvent(new Event("change", { bubbles: true }));
    expect(roles.nextElementSibling.querySelector(".multiselect-label").textContent).toBe("3 selected");

    LegacyCss.multiselect.open(roles);
    expect(roles.nextElementSibling.classList.contains("is-open")).toBe(true);
    document.getElementById("outside").click();
    expect(roles.nextElementSibling.classList.contains("is-open")).toBe(false);

    roles.options[1].selected = true;
    roles.options[2].selected = true;
    document.getElementById("form").reset();
    await nextFrame(dom.window);
    expect(roles.nextElementSibling.querySelector(".multiselect-label").textContent).toBe("Admin");

    LegacyCss.multiselect.open(teams);
    expect(teams.nextElementSibling.classList.contains("is-open")).toBe(false);
  });

  it("handles alternate resolution, labels, keyboard variants, and no-op targets", async () => {
    await createComponentDom(html`
      <button id="outside">Outside</button>
      <select id="labelled" multiple aria-label="Named">
        <option value="a">A</option>
        <option value="b" disabled>B</option>
        <option value="c">C</option>
      </select>
      <select name="generated" multiple>
        <option value="x">X</option>
      </select>
      <select id="single"><option>Single</option></select>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const labelled = document.getElementById("labelled");
    const generated = document.querySelector('[name="generated"]');
    const single = document.getElementById("single");

    expect(LegacyCss.multiselect.setup(null)).toBeNull();
    expect(LegacyCss.multiselect.setup({})).toBeNull();
    expect(LegacyCss.multiselect.setup(single)).toBeNull();
    expect(LegacyCss.multiselect.open(null)).toBeNull();
    expect(LegacyCss.multiselect.close(null)).toBeNull();
    expect(LegacyCss.multiselect.toggle(null)).toBeNull();

    LegacyCss.multiselect.setup({ 0: labelled, jquery: "test" });
    LegacyCss.multiselect.setup(generated);

    const root = labelled.nextElementSibling;
    const toggle = root.querySelector(".multiselect-toggle");
    const options = root.querySelectorAll(".multiselect-option");

    expect(toggle.getAttribute("aria-label")).toBe("Named");
    expect(generated.nextElementSibling.querySelector(".multiselect-toggle").id).toBe("generated-toggle");
    expect(LegacyCss.multiselect.setup(root)).toBe(labelled);
    expect(LegacyCss.multiselect.setup(options[0])).toBe(labelled);
    expect(LegacyCss.multiselect.open(document.getElementById("outside"))).toBeNull();
    expect(LegacyCss.multiselect.close(single)).toBeNull();

    toggle.click();
    expect(root.classList.contains("is-open")).toBe(true);
    toggle.click();
    expect(root.classList.contains("is-open")).toBe(false);

    toggle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(document.activeElement).toBe(options[0]);
    options[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    expect(document.activeElement).toBe(options[2]);
    options[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(document.activeElement).toBe(options[0]);
    options[0].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(document.activeElement).toBe(options[2]);
    options[2].dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(labelled.options[2].selected).toBe(true);

    options[1].click();
    dispatch(options[1], "click");
    expect(labelled.options[1].selected).toBe(false);

    labelled.disabled = true;
    labelled.dispatchEvent(new Event("change", { bubbles: true }));
    expect(toggle.disabled).toBe(true);
    options[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(labelled.options[0].selected).toBe(false);
  });

  it("falls back when multiselect label lookup fails", async () => {
    await createComponentDom("<select id=\"bad:id\" multiple><option>A</option></select>");
    const { document, LegacyCss } = dom.window;

    dom.window.CSS.escape = () => {
      throw new Error("escape failed");
    };

    LegacyCss.multiselect.setup("#bad\\:id");
    expect(document.querySelector(".multiselect-toggle").hasAttribute("aria-label")).toBe(false);
  });

  it("covers multiselect no-state and invalid event branches", async () => {
    await createComponentDom(html`
      <select id="plain" multiple><option>A</option></select>
      <select id="other" multiple><option>B</option></select>
      <div class="multiselect" id="broken"><button class="multiselect-toggle">Broken</button></div>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const plain = document.getElementById("plain");
    const other = document.getElementById("other");

    expect(LegacyCss.multiselect.close(plain)).toBe(plain);
    expect(LegacyCss.multiselect.toggle(plain)).toBe(plain);
    expect(LegacyCss.multiselect.open(document.getElementById("broken"))).toBe(other);

    LegacyCss.multiselect.setup(plain);
    LegacyCss.multiselect.setup(other);
    const root = plain.nextElementSibling;
    const toggle = root.querySelector(".multiselect-toggle");
    const option = root.querySelector(".multiselect-option");

    LegacyCss.multiselect.open(plain);
    LegacyCss.multiselect.open(other);
    expect(root.classList.contains("is-open")).toBe(false);

    plain.dispatchEvent(new Event("change", { bubbles: true }));
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    dispatch(root, "keydown", { target: document });
    toggle.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    option.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    document.dispatchEvent(new Event("click"));
  });
});
