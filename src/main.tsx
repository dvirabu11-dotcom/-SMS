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

// Debugging invalid URL construction
const originalURL = window.URL;
(window as any).URL = function(url: string | URL, base?: string | undefined) {
  try {
    return new originalURL(url, base);
  } catch (e) {
    console.error('Invalid URL attempt:', url, base);
    throw e;
  }
};
Object.assign((window as any).URL, originalURL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
