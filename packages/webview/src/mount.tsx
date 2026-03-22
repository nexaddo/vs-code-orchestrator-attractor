/**
 * Mounts the Preact root component into the given DOM element.
 * Separated from client.ts to keep the entry point as pure TS.
 */
import { render } from "preact";

import { App } from "./app/App";
import type { AppStore } from "./app/store";

export function mountApp(store: AppStore, root: HTMLElement): void {
  render(<App store={store} />, root);
}
