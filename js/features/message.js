import  { state as s } from "../state.js";
import { MSG_LABELS, MSG_CSS_CLASS, ID_BUTTON_DRAW_SCHEMA, DELAY_TO_DISPLAY } from "../constants.js";
import { getComputedStyles } from "../core/utils.js";

const buttonsRecordSchema = `
<button id="${ID_BUTTON_DRAW_SCHEMA.invalidate}">Refaire un schéma</button>
<button id="${ID_BUTTON_DRAW_SCHEMA.validate}">Valider ce schéma</button>
`;
let lastMsg = "";
let buttonsValidationModule = null;
const animationMsg = getComputedStyles("--animation-msg");


import { reactiveState as rs } from "../state.js";
let cookieModule = null; // FAIRE UNE SEULE VAR. GLOBALE DANS 'state.js' CAR EXISTE AUSSI DANS 'select.js'
rs.watch("isSelectOpen", async newVal => {
  console.log("message.js => isSelectOpen a changé :", newVal); // TEST
  if(newVal) {
    if(!cookieModule) cookieModule = await import("./cookie.js");
    s.recordedSchema = cookieModule.isCookiePresent(s.selectedValueNbDots);
    setComplementaryInfos();
  } else {
    removeComplementaryInfos();
  }
});



export function removeComplementaryInfos() {
    displayComplementaryInfos({text: ""});
}

export function displayComplementaryInfos(pm) {   // RETIRER LE EXPORT QUAND FINI   
    //console.log(pm, pm.className, "!!pm.className => ", !!pm.className, pm.anim); //TEST
    const flagAnimation = !!pm.anim;  
    let msg = s.msg;
    if(flagAnimation) {
        msg.setAttribute("class", MSG_CSS_CLASS.default); // Réinitialisation classes
        msg.classList.toggle(MSG_CSS_CLASS.animation, true);
        setTimeout(() => { msg.innerHTML = pm.text }, animationMsg / 2);
        if(!!pm.className) msg.classList.toggle(pm.className, true);
        setTimeout(() => { msg.classList.toggle(MSG_CSS_CLASS.animation, false) }, animationMsg);
    } else {
        msg.innerHTML = pm.text; 
    }
}

export function setComplementaryInfos(calledFromClick) {  
    console.log("Dans 'setComplementaryInfos > calledFromClick': ", calledFromClick); //TEST
    const capturedDotsLength = s.capturedDots.length;
    // Qd on vient de sélectionner une Grid et que donc pas de points capturés
    if(!capturedDotsLength) displayComplementaryInfos({text: `${s.recordedSchema ? MSG_LABELS.draw : MSG_LABELS.creation}`, anim: true});

    if(!s.recordedSchema) {   //console.log("Pas de schéma enregistré !!","s.capturedDots.length: " , s.capturedDots.length, "| currentSchemaNbDotsMinMax.nbDotMin: ", s.currentSchemaNbDotsMinMax.nbDotMin, " | currentSchemaNbDotsMinMax.nbDotMax: ", s.currentSchemaNbDotsMinMax.nbDotMax); //TEST
        const currentSchemaNbDots = s.currentSchemaNbDotsMinMax;
        if(calledFromClick) {
            if(capturedDotsLength < currentSchemaNbDots.nbDotMin) {
                displayComplementaryInfos({text: `${MSG_LABELS.invalid}${MSG_LABELS.notEnoughPoints}`, className: MSG_CSS_CLASS.invalid, anim: true});
                setTimeout(() => {
                    displayComplementaryInfos({text: MSG_LABELS.creation, anim: true});
                }, DELAY_TO_DISPLAY.labelAfterNotEnoughDots);
            }
            if(capturedDotsLength >= currentSchemaNbDots.nbDotMin && capturedDotsLength <= currentSchemaNbDots.nbDotMax) {
                displayComplementaryInfos({text: buttonsRecordSchema, anim: true});
                handleButtonsClick();
            }
        }
        // Msgs 'Schéma valide'
        if(
            capturedDotsLength >= currentSchemaNbDots.nbDotMin && 
            capturedDotsLength <= currentSchemaNbDots.nbDotMax && 
            lastMsg !== MSG_LABELS.valid
        ) {    
            displayComplementaryInfos({text: MSG_LABELS.valid, className: MSG_CSS_CLASS.valid, anim: true});
            lastMsg = MSG_LABELS.valid;
        } 

        if(capturedDotsLength === currentSchemaNbDots.nbDotMax) {
            displayComplementaryInfos({text: MSG_LABELS.maxPointsReached, className: MSG_CSS_CLASS.valid, anim: true});  
            setTimeout(() => {
                displayComplementaryInfos({text: buttonsRecordSchema, anim: true});
                handleButtonsClick();
            }, DELAY_TO_DISPLAY.buttonsAfterValidSchema);
        }
    }
}

async function handleButtonsClick() {
    if(!buttonsValidationModule) {
        buttonsValidationModule = await import("./buttonsValidation.js");
        buttonsValidationModule.handleValidationButtonClick();
    }
}