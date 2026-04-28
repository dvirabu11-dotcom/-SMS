import 'promise-polyfill/src/polyfill';
import 'whatwg-fetch';
import 'url-polyfill';
import 'resize-observer-polyfill';
import cssVars from 'css-vars-ponyfill';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize CSS variables polyfill for legacy browsers (Android 4.4)
cssVars({
  watch: true,
  onlyLegacy: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
