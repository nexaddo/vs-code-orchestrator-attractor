import { describe, expect, it } from "vitest";

import { buildWebviewHtml } from "../../src/dashboard/webview-html";

describe("buildWebviewHtml", () => {
  const options = {
    scriptUri: "vscode-resource:/webview.js",
    cssUri: "vscode-resource:/webview.css",
    nonce: "abc123nonce",
    cspSource: "vscode-webview-resource:"
  };

  it("includes the root mount element", () => {
    const html = buildWebviewHtml(options);

    expect(html).toContain('<div id="root"></div>');
  });

  it("includes CSP meta tag with nonce and cspSource", () => {
    const html = buildWebviewHtml(options);

    expect(html).toContain(
      "default-src 'none'; style-src vscode-webview-resource:; script-src 'nonce-abc123nonce';"
    );
  });

  it("includes script tag with nonce and src", () => {
    const html = buildWebviewHtml(options);

    expect(html).toContain(
      '<script nonce="abc123nonce" src="vscode-resource:/webview.js"></script>'
    );
  });

  it("includes stylesheet link tag with href", () => {
    const html = buildWebviewHtml(options);

    expect(html).toContain(
      '<link rel="stylesheet" href="vscode-resource:/webview.css" />'
    );
  });
});
