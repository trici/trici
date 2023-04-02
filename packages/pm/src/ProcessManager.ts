import ipc from "node-ipc"
import { config } from "@trici/config"
import LoggingService from "@trici/logger"

export interface IProcessManager {
  registerPrimaryProcess(processID: number): void;
  isPrimaryProcessRegistered(): boolean;
  killPrimaryProcess(): void;
}
/**
 *  class
 * @class ProcessManager
 * @implements {IProcessManager}
 * @description - The ProcessManager class is responsible for ensuring that only one instance of the primary process is running at any given time.
 * It also provides a mechanism for the primary process to communicate with the secondary processes using IPC.
 */
export class ProcessManager implements IProcessManager {
    private _registeredPrimaryProcessId: number;
    private _logger: any;

    constructor() {
        // ...
        this._registeredPrimaryProcessId = 0;
        this._logger = LoggingService.getLogger();
    }

    private _getIpcConfig(): any {
        // ...
        const appspace = config.builtFor === "dev" ? "trici-dev." : "trici.";
        return {
            id: "trici-pm",
            retry: 500,
            maxRetries: 10,
            appspace: appspace,
            socketRoot: "/tmp/",
            logger: this._logger.info.bind(this._logger),
        };
    }

    /**
     * Register the primary process
     * @param processID - The process ID of the primary process
     * @throws {Error} - If the primary process is already registered
     * @throws {Error} - If there is an error registering the primary process
     * @returns {void}
     * @memberof ProcessManager
     * @example
     * processManager.registerPrimaryProcess(process.pid);
     * // => void
    */
    registerPrimaryProcess(processID: number): void {
        // ...
        if (this.isPrimaryProcessRegistered()) {
            throw new Error("Primary process already registered");
        }
        ipc.config = this._getIpcConfig();
        try {
            ipc.serve(() => {
                ipc.server.on("connect", () => {
                    ipc.server.emit(ipc.config.id, "Primary process connected");
                });
                ipc.server.on("message", (data: any, socket: any) => {
                    ipc.log("got a message from ".concat(data.id));
                    ipc.server.emit(socket, "message", "hello");
                });
            });
            ipc.server.start();
            this._registeredPrimaryProcessId = processID;
        } catch(err) {
            console.log("Error registering primary process: " + err)
            console.log(err)
            this._registeredPrimaryProcessId = 0;
            // throw new Error("Error registering primary process");
        }

    }

    isPrimaryProcessRegistered(): boolean {
        // ...
        return this._registeredPrimaryProcessId > 0;
    }

    killPrimaryProcess(): void {
        // ...
        if (!this.isPrimaryProcessRegistered()) {
            throw new Error("Primary process not registered");
        }
        ipc.server.stop();
        this._registeredPrimaryProcessId = 0;
    }

}

