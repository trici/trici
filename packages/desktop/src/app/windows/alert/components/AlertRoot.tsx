import { MantineProvider } from '@mantine/core';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import log from 'loglevel';
import { HiddenTitleBar } from '../../shared/components/HiddenTitleBar';
import { AlertContainer } from './AlertContainer';
import { IMessageFromMain } from '../../../../typedefs/preload';
import { AlertWindowMessageType } from '@trici/models';

function AlertRoot() {
  const initValues = window.bridgeApi.getInitValues();
  let messageType = AlertWindowMessageType.SCREEN_RECORDING_PERMISSION_REVOKED;
  if (initValues) {
    const alertTypeMessage = initValues.find((value: IMessageFromMain) => value.handler === 'showAlertType');
    if (alertTypeMessage) {
      messageType = alertTypeMessage.data.alertType;
    }
  }
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <HiddenTitleBar />
      <AlertContainer alertType={messageType} />
    </MantineProvider>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<AlertRoot />);
} else {
  log.error('rootElement is null');
}
