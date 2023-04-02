import { ProcessManager } from "./ProcessManager";

class ProcessManagerSingleton {
  private static instance: ProcessManager;

  private constructor() {
  }

  public static getInstance(): ProcessManager {
    if (!ProcessManagerSingleton.instance) {
      console.log("Starting Process Manager ");
      ProcessManagerSingleton.instance = new ProcessManager();
    }

    return ProcessManagerSingleton.instance;
  }

}

const instance = ProcessManagerSingleton.getInstance();
export default instance;
