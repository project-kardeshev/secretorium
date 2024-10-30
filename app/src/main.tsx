import { AOWalletKit } from '@project-kardeshev/ao-wallet-kit';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@utils/network';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AOWalletKit>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AOWalletKit>
  </React.StrictMode>,
);
