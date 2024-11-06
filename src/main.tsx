import '@fontsource/cinzel-decorative';
import {
  AOWalletKit,
  ArConnectStrategy,
  ArweaveWebWalletStrategy,
  ethereumStrategy,
} from '@project-kardeshev/ao-wallet-kit';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@utils/network';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AOWalletKit
      config={{
        permissions: [
          'SIGN_TRANSACTION',
          'ENCRYPT',
          'DECRYPT',
          'ACCESS_ADDRESS',
          'SIGNATURE',
          'ACCESS_PUBLIC_KEY',
        ],
      }}
      strategies={[
        new ArConnectStrategy(),
        new ArweaveWebWalletStrategy(),
        ethereumStrategy,
      ]}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AOWalletKit>
  </React.StrictMode>,
);
