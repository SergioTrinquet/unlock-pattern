import { COOKIE_NAME_PREFIX } from "../constants.js";

// Set cookie pour savoir si schema déjà fait ou pas
export function setCookie(gridSize, combination) {  
    console.log("%cDans 'setCookie' => gridSize: ","background-color: green; color: white", gridSize, " | combination: ", combination); //TEST
    
    const data = { gridSize, combination };
    const durationCookieInSec = 60*60*24*30;
    const cookie = `${COOKIE_NAME_PREFIX}${gridSize}=${JSON.stringify(data)}; max-age=${durationCookieInSec}; path=/`; // Voir aussi avec les parametres 'sameSite', 'lax', 'strict', 'secure',...
    document.cookie = cookie;
}

export function getCookie(selectedGridNbDots) {
    console.log(document.cookie); //TEST
    //return 
}  // DOit-on garder cette fonction ?

export function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

export function isCookiePresent(nbDots) {
    if(!document.cookie) {
        return !!document.cookie;
    } else {
        let data = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${COOKIE_NAME_PREFIX}${nbDots}=`))
            ?.split("=")[1];
        return !!data ? (JSON.parse(data).gridSize == nbDots) : !!data;
    }
}
export function deleteCookie(nbDots) {
    document.cookie = `${COOKIE_NAME_PREFIX}${nbDots}=;max-age=0; path=/`;
}