import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom';
import './index.css';
import { ThemeProvider } from '@material-ui/core/styles';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { theme } from './muiTheme.js';
import { SolanaWalletProvider } from './contexts/SolanaWalletContext';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
        <ThemeProvider theme={theme}>
          <SolanaWalletProvider>
              <App />
          </SolanaWalletProvider>
        </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
