import { getComputedStyles } from "../core/utils.js";

const themeColor = getComputedStyles("--background-screen-to");

// Coloration de l'entete du browser pour le mobile uniquement
function changeThemeColor(color) {
  let metaTag = document.querySelector('meta[name="theme-color"]');
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTag);
  }
  metaTag.setAttribute('content', color);
}
changeThemeColor(themeColor);


export function vibrateOnTouch(periodInMs = 100) {
    if ('vibrate' in navigator) navigator.vibrate(periodInMs);
}

// Fonction dédiée à la gestion des evenements propre au touch
export function releasePointerCaptureOnTouchScreen(e) {
    e.target.releasePointerCapture(e.pointerId);
}