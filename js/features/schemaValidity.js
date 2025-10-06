import { state as s } from "../state.js";
import { COOKIE_NAME_PREFIX } from "../constants.js";
import { getCookieValue } from "./cookie.js";

export function checkSchemaValidity() {
    let validSchema = false;
    if(!s.recordedSchema) {
        // Check si nb saisie points est bien entre nb min et nb max 
        if(s.capturedDots.length < s.currentSchemaNbDotsMinMax.nbDotMin || s.capturedDots.length > s.currentSchemaNbDotsMinMax.nbDotMax) { validSchema = false }
        if(s.capturedDots.length >= s.currentSchemaNbDotsMinMax.nbDotMin && s.capturedDots.length <= s.currentSchemaNbDotsMinMax.nbDotMax) { validSchema = true }
    } else { 
        // Check si saisie points correspond à valeur cookie
        validSchema = JSON.parse(getCookieValue(`${COOKIE_NAME_PREFIX}${s.selectedValueNbDots}`))?.combination.join(",") === s.capturedDots.join(",") 
        ? true 
        : false;
    }
    return validSchema;
}