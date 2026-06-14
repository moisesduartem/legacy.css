import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

const componentsUrl = "file://" + resolve("docs/components.html");

test("components documentation loads and representative JS components work", async ({ page }) => {
  const errors = [];

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.route("https://code.jquery.com/jquery-3.7.1.min.js", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `
        window.jQuery = window.$ = function () {
          return { each: function () { return this; } };
        };
        window.jQuery.fn = {};
      `,
    });
  });

  await page.goto(componentsUrl);
  await page.waitForFunction(() => window.LegacyCss);

  await page.locator("#tabs-code-tab").click();
  await expect(page.locator("#tabs-code")).toBeVisible();

  await page.locator("[data-popover-target='#request-actions-popover']").click();
  await expect(page.locator("#request-actions-popover")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator("#request-actions-popover")).toBeHidden();

  await page.locator("button", { hasText: "Show with LegacyCss.toast.show()" }).click();
  await expect(page.locator(".toast.toast-success")).toBeVisible();

  await page.locator("#reviewers-default").click();
  await expect(page.locator("#reviewers-output")).toContainText("ana, carla");

  await page.locator("#request-pagination [data-pagination-action='next']").click();
  await expect(page.locator("#request-pagination .pagination-summary")).toContainText("Page 2");

  await page.locator("button", { hasText: "Open with LegacyCss.modal.open()" }).click();
  await expect(page.locator("#login-form")).toBeVisible();

  expect(errors).toEqual([]);
});

