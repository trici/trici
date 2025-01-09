/**
 * Inspired by the Flux dispacther, this class is used to dispatch actions to services.
 */

import { invariant } from '@trici/utils';
export type DispatchToken = string;
import type { TriciAction } from '../typedefs/TriciAction';
import config from '@trici/config';

export interface IActionDispatcher<TriciAction> {
  register(callback: (payload: TriciAction) => void): DispatchToken;
  unregister(dispatchToken: DispatchToken): void;
  dispatch(payload: TriciAction): void;
  // waitFor(dispatchTokens: DispatchToken[]): void;
  // isDispatching(): boolean;
}

class ActionDispatcher implements IActionDispatcher<TriciAction> {
  _callbacks: { [key: string]: (payload: TriciAction) => void };
  _isDispatching: boolean;
  _isHandled: { [key: string]: boolean };
  _isPending: { [key: string]: boolean };
  _lastID: number;
  _pendingPayload: any;
  _dispatchQueue: any[];

  constructor() {
    this._callbacks = {};
    this._isDispatching = false;
    this._isHandled = {};
    this._isPending = {};
    this._lastID = 1;
    this._dispatchQueue = [];
  }

  register(callback: (payload: TriciAction) => void): DispatchToken {
    const id = 'ID_' + this._lastID++;
    this._callbacks[id] = callback;
    return id;
  }

  unregister(dispatchToken: DispatchToken): void {
    invariant(
      this._callbacks[dispatchToken] === undefined,
      `Dispatcher.unregister(...): ${dispatchToken} does not map to a registered callback.`,
    );
    delete this._callbacks[dispatchToken];
  }

  dispatch(payload: TriciAction): void {
    // invariant(!this._isDispatching, 'Dispatcher.dispatch(...): Cannot dispatch in the middle of a dispatch.');
    this._dispatchQueue.push(payload);
    console.log(`dispatchQueue length: ${this._dispatchQueue.length}`);
    if (!this._isDispatching) {
      setTimeout(this._processQueue.bind(this), 0);
    }
    console.log(`Finished execution of dispatch method`);
  }

  _processQueue(): void {
    this._isDispatching = true;
    while (this._dispatchQueue.length > 0) {
      const action = this._dispatchQueue.shift();
      for (const id in this._callbacks) {
        // console.log(`processing action ${JSON.stringify(action.type)}`);
        this._callbacks[id](action);
      }
    }
    this._isDispatching = false;
  }

  //   try {
  //     this._startDispatching(payload);
  //     for (const id in this._callbacks) {
  //       if (this._isPending[id]) {
  //         continue;
  //       }
  //       this._invokeCallback(id);
  //     }
  //   } finally {
  //     this._stopDispatching();
  //   }
  // }

  waitFor(dispatchTokens: DispatchToken[]): void {
    invariant(!this._isDispatching, 'Dispatcher.waitFor(...): Must be invoked while dispatching.');
    for (let ii = 0; ii < dispatchTokens.length; ii++) {
      const id = dispatchTokens[ii];
      if (this._isPending[id]) {
        invariant(this._isHandled[id], `Dispatcher.waitFor(...): Circular dependency detected while waiting for ${id}`);
        continue;
      }
      invariant(
        this._callbacks[id] === undefined,
        `Dispatcher.waitFor(...): ${id} does not map to a registered callback.`,
      );
      this._invokeCallback(id);
    }
  }

  isDispatching(): boolean {
    return this._isDispatching;
  }

  _invokeCallback(id: DispatchToken): void {
    this._isPending[id] = true;
    this._callbacks[id](this._pendingPayload);
    this._isHandled[id] = true;
  }

  _startDispatching(payload: TriciAction): void {
    for (const id in this._callbacks) {
      this._isPending[id] = false;
      this._isHandled[id] = false;
    }
    this._pendingPayload = payload;
    this._isDispatching = true;
  }

  _stopDispatching(): void {
    this._pendingPayload = null;
    this._isDispatching = false;
  }
}

const instance: IActionDispatcher<TriciAction> = new ActionDispatcher();

export default instance;

function dispatchWithLog(action: TriciAction): void {
  console.log(`dispatching action ${JSON.stringify(action.type)}`);
  // console.log(instance.isDispatching());
  instance.dispatch(action);
}

export const dispatch = config.builtFor === 'dev' ? dispatchWithLog : instance.dispatch.bind(instance);
