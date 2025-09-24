import { createEl } from "../core/utils.js";
import { goBackToStartStep } from "./select.js";
import { svgSchemaInit, initSVGcheckAnimation, startSVGcheckAnimation } from "./checkIcon.js";

const flipCard = document.querySelector(".flip-card");
const flipCardBackChild = document.querySelector(".flip-card-back > div");

/* VERSION ORIGINALE : Fonctionne !!! */ const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/* V2 TEST */
/* function wait(ms) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
        s.strokeController.abortController.signal?.removeEventListener("abort", onAbort);
        resolve();
    }, ms);

    function onAbort() {
        clearTimeout(timeoutId);
        s.strokeController.abortController.signal?.removeEventListener("abort", onAbort);
        reject(new Error("Aborted"));
    }

    if (s.strokeController.abortController.signal) {
        s.strokeController.abortController.signal.addEventListener("abort", onAbort);
    }
  });
} */
/* FIN V2 TEST */

export async function runSequenceSchemaValid() {
    const SEQUENCE = {
        stepCardFlip: 600,
        stepAnimSVG: 1300,
        stepDisplayMsgSuccess: 1000,
        stepDelayBeforeMsgSuccessClose: 4000
    };

   svgSchemaInit();
   
    // Étape 1
    flipCard.classList.toggle("flip-over", true);
    initSVGcheckAnimation();
    await wait(SEQUENCE.stepCardFlip);

    // Étape 2
    startSVGcheckAnimation();
    await wait(SEQUENCE.stepAnimSVG);

    // Étape 3
    flipCardBackChild.classList.toggle("grow-after-flip-over", true);
    const msgSuccessClassName = "msg-success";
    if(document.querySelector(`.${msgSuccessClassName}`)) document.querySelector(`.${msgSuccessClassName}`).remove();
    let messageSuccess = createEl("div", { 
            className: msgSuccessClassName, 
            innerHTML: "<div>Accès authorisé!</div>" 
    });
    document.body.appendChild(messageSuccess);
    await wait(SEQUENCE.stepDisplayMsgSuccess);

    // Étape 4
    goBackToStartStep();
    flipCard.classList.toggle("flip-over", false);
    flipCardBackChild.classList.toggle("grow-after-flip-over", false);

    messageSuccess.addEventListener("click", () => { 
        messageSuccess.classList.add("up");
    }, { once: true });

     await wait(SEQUENCE.stepDelayBeforeMsgSuccessClose);

     messageSuccess.classList.add("up");
}