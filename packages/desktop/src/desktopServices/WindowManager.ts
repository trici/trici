import { IConsoleLogger, Logger } from "@trici/logger";
import { BrowserWindow } from "electron";
import { IActionDispatcher } from "./ActionDispatcher";
import contextMenu from "electron-context-menu";
import { TriciAction } from "../typedefs/TriciAction";

export interface IWindowManager {
  registerActionHandlers(): void
  // getMainWindow(): BrowserWindow | null;
}

export class WindowManager implements IWindowManager {
  logger: Logger | IConsoleLogger;
  settingsWindow: BrowserWindow | null ;
  mainWindow: BrowserWindow | null ;
  actionHandlersRegistered: boolean = false;
  actionDispatcher: IActionDispatcher<TriciAction> ;

  constructor(logger: Logger | IConsoleLogger, actionDispatcher: IActionDispatcher<TriciAction> ) {
    this.logger = logger;
    this.settingsWindow = null;
    this.mainWindow = null;
    this.actionDispatcher = actionDispatcher;
  }

  registerActionHandlers(): void {
    if (!this.actionHandlersRegistered) {
      this.actionDispatcher.register((action: TriciAction) => {
        switch (action.type) {
          case "OPEN_SETTINGS_WINDOW":
            this._createAndShowSettingsWindow();
            break;
          default:
            break;
        }
      });
      this.actionHandlersRegistered = true;
    }
  }

  private _showMainWindow(): void {
    throw new Error("Method not implemented.");
  }

  private _hideMainWindow(): void {
    throw new Error("Method not implemented.");
  }

  private _createAndShowSettingsWindow(): void {
    if (this.settingsWindow) {
      this.settingsWindow.show();
      return;
    }
    this.settingsWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        preload: `${__dirname}/src/preload.js`,
        contextIsolation: true,
      },
    });
    this.settingsWindow.loadFile(`src/settings.html`);
    contextMenu({
      window: this.settingsWindow,
      showInspectElement: true,
    });
    // this.settingsWindow.webContents.openDevTools();
    this.settingsWindow.on("closed", () => {
      this.settingsWindow = null;
    });
  }
}
