import log from 'loglevel';

export const LogUtils = {
  enableFileLoggingForRendererConsole() {
    const originalFactory = log.methodFactory;
    log.methodFactory = function (methodName, logLevel, loggerName) {
      const rawMethod = originalFactory(methodName, logLevel, loggerName);

      return function (message, arg1, arg2, arg3, arg4) {
        const msg = { msg: message };
        if (arg4) {
          rawMethod(message, arg1, arg2, arg3, arg4);
          msg.obj1 = arg1;
          msg.obj2 = arg2;
          msg.obj3 = arg3;
          msg.obj4 = arg4;
        } else if (arg3) {
          rawMethod(message, arg1, arg2, arg3);
          msg.obj1 = arg1;
          msg.obj2 = arg2;
          msg.obj3 = arg3;
        } else if (arg2) {
          rawMethod(message, arg1, arg2);
          msg.obj1 = arg1;
          msg.obj2 = arg2;
        } else if (arg1) {
          rawMethod(message, arg1);
          msg.obj1 = arg1;
        } else {
          rawMethod(message);
        }
        const rendererLogMessage = { method: methodName, level: logLevel, message };
        window.bridgeApi.sendMessage({ handler: 'rendererLog', args: rendererLogMessage });
      };
    };
    log.setLevel('warn');
  },
  updateLogLevel(updatedLevel) {
    log.warn(`Updating RendererProcessLogLevel: ${updatedLevel}`);
    log.setLevel(updatedLevel);
  },
};
