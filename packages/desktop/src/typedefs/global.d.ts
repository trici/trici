import { TriciApp } from "@trici/models";

declare global {
  var appDetails : string;
  var installationId: string;
  var triciApp: TriciApp;
  var userDataDirectoryCheckResult: userDataDirectoryCheckResult;
  var logger : Logger;
}

export {};

