import { IBridgeAPIInterface } from "./preload";



declare global {
  interface Window {
    bridgeApi: IBridgeAPIInterface;
  }
}
