export interface BuildWebviewHtmlOptions {
  scriptUri: string;
  cssUri: string;
  nonce: string;
  cspSource: string;
}

export function buildWebviewHtml(options: BuildWebviewHtmlOptions): string {
  const { scriptUri, cssUri, nonce, cspSource } = options;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}';"
    />
    <link rel="stylesheet" href="${cssUri}" />
    <title>Attractor Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}
