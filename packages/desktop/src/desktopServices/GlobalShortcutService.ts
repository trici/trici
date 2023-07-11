import { globalShortcut } from "electron";
import config from "@trici/config";
import { dispatch } from "./ActionDispatcher";

export interface IGlobalShortcutService {
  initService(): void;
}

export class GlobalShortcutService implements IGlobalShortcutService {
  private initialized: boolean = false;

  constructor() {
    this.initialized = false;
  }
  initService(): void {
    if (!this.initialized) {
      if (config.builtFor === "dev") {
      const ret = globalShortcut.register("CommandOrControl+shift+R", () => {
        dispatch({ type: "RELOAD_OPEN_WINDOWS" });

        console.log("Reload all open windows");
      });
    }
      this.initialized = true;
    }
  }
}

