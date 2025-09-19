import  { state as s } from "../state.js";
import { MSG_LABELS, MSG_CSS_CLASS, ID_BUTTON_DRAW_SCHEMA } from "../constants.js";
// import { handleValidationButtonEvents } from "../main.js"; // A CHANGER PLUS TARD !!!
import { handleValidationButtonEvents } from "./buttonsValidation.js";

const buttonsRecordSchema = `
<button id="${ID_BUTTON_DRAW_SCHEMA.invalidate}">Refaire un schéma</button>
<button id="${ID_BUTTON_DRAW_SCHEMA.validate}">Valider ce schéma</button>
`;
let lastMsg = "";
let TEST_FLAG = false;


import { reactiveState as rs } from "../state.js";
rs.watch("isSelectOpen", newVal => {
  console.log("message.js => isSelectOpen a changé :", newVal); // TEST
  if(newVal) {
    displayComplementaryInfos({text: `${s.recordedSchema ? MSG_LABELS.draw : MSG_LABELS.creation}`}); // Message sous le select
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
        setTimeout(() => { msg.innerHTML = pm.text }, s.animationMsg / 2);
        if(!!pm.className) msg.classList.toggle(pm.className, true);
        setTimeout(() => { msg.classList.toggle(MSG_CSS_CLASS.animation, false) }, s.animationMsg);
    } else {
        msg.innerHTML = pm.text; 
    }
}


export function setComplementaryInfos(calledFromClick) {  
    //console.log("Dans 'setComplementaryInfos > calledFromClick': ", calledFromClick); //TEST
    if(!s.recordedSchema) {   //console.log("Pas de schéma enregistré !!","s.captureDots.length: " , s.captureDots.length, "| currentSchemaNbDotsMinMax.nbDotMin: ", s.currentSchemaNbDotsMinMax.nbDotMin, " | currentSchemaNbDotsMinMax.nbDotMax: ", s.currentSchemaNbDotsMinMax.nbDotMax); //TEST
        const captureDotsLength = s.captureDots.length;
        const currentSchemaNbDots = s.currentSchemaNbDotsMinMax;

        if(!captureDotsLength) displayComplementaryInfos({text: MSG_LABELS.creation, anim: true});

        if(calledFromClick) {
            if(captureDotsLength < currentSchemaNbDots.nbDotMin) {
                displayComplementaryInfos({text: `${MSG_LABELS.invalid}${MSG_LABELS.notEnoughPoints}`, className: 'invalid', anim: true});
                setTimeout(() => {
                    displayComplementaryInfos({text: MSG_LABELS.creation, anim: true});
                }, 2000);
            }
            if(captureDotsLength >= currentSchemaNbDots.nbDotMin && captureDotsLength <= currentSchemaNbDots.nbDotMax) {
                displayComplementaryInfos({text: buttonsRecordSchema, anim: true});
                if(!TEST_FLAG) { handleValidationButtonEvents(); TEST_FLAG = true; } //TEST
            }
        }
        // Msgs 'Schéma valide'
        if(
            captureDotsLength >= currentSchemaNbDots.nbDotMin && 
            captureDotsLength <= currentSchemaNbDots.nbDotMax && 
            lastMsg !== MSG_LABELS.valid
        ) {    
            displayComplementaryInfos({text: MSG_LABELS.valid, className: 'valid', anim: true});
            lastMsg = MSG_LABELS.valid;
        } 

        if(captureDotsLength === currentSchemaNbDots.nbDotMax) {
            displayComplementaryInfos({text: MSG_LABELS.maxPointsReached, className: 'valid', anim: true});  
            setTimeout(() => {
                displayComplementaryInfos({text: buttonsRecordSchema, anim: true});
                if(!TEST_FLAG) { handleValidationButtonEvents(); TEST_FLAG = true; } //TEST
            }, 1500);
        }
    }
}