import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeDensityPreference } from './utils/densityPreferences';
import { initializeFontSizePreference } from './utils/fontPreferences';
import { initializeSidebarPreference } from './utils/sidebarPreferences';
import { initializeAnalytics, trackWebVital } from './utils/analytics';
import { enableQaMode } from './qa/browser/enableQaMode';

initializeDensityPreference();
initializeFontSizePreference();
initializeSidebarPreference();
initializeAnalytics();
enableQaMode();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(trackWebVital);
