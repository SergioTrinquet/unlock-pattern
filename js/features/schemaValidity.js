import { state as s } from "../state.js";
import { COOKIE_NAME_PREFIX } from "../constants.js";
import { isCookiePresent, getCookieValue } from "./cookie.js";

// Renvoie un booleen pour savoir si le schéma est valide ou pas
export function checkSchemaValidity() {
    let validSchema = false;
    // Check si nb saisie points est bien entre nb min et nb max 
    if(!s.recordedSchema) {
        if(s.captureDots.length < s.currentSchemaNbDotsMinMax.nbDotMin || s.captureDots.length > s.currentSchemaNbDotsMinMax.nbDotMax) { validSchema = false }
        if(s.captureDots.length >= s.currentSchemaNbDotsMinMax.nbDotMin && s.captureDots.length <= s.currentSchemaNbDotsMinMax.nbDotMax) { validSchema = true }
    } 
    // Check si saisie points correspond à valeur cookie
    if(s.recordedSchema) {  
        if(isCookiePresent(s.selectedValueNbDots)) {
            validSchema = JSON.parse(getCookieValue(`${COOKIE_NAME_PREFIX}${s.selectedValueNbDots}`))?.combination.join(",") === s.captureDots.join(",") 
            ? true 
            : false;
        } else {
            console.warn(`Pas de cookie présent pour une grille de ${s.selectedValueNbDots} points !`);
        }
    }
    return validSchema;
}