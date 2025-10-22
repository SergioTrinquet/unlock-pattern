import { state as s } from "../state.js";
import { ID_BUTTON_DRAW_SCHEMA, STROKE } from "../constants.js";
import { getComputedStyles } from "../core/utils.js";
import { draw, removeSchemaDrawing, colorationSchema } from "./drawing.js";
import { setComplementaryInfos } from "./message.js";
import { setCookie } from "./cookie.js";
import { goBackToStartStep } from "./select.js";
import { vibrateOnTouch } from "./mobile.js";  // VOIR COMMENT L'IMPORTER EN DYNAMIC! TESTER D4ABORD SI C'EST UN TOUCHSCREEN !

const animationShrink = getComputedStyles("--animation-shrink");

// Création de schéma : Gestion de clics de boutons pour valider/refaire le schéma 
export function handleValidationButtonClick() {
    s.msg.addEventListener("click", (e) => {
        const targetId = e.target.id;

        // Bouton "Refaire le schéma"
        if(targetId === ID_BUTTON_DRAW_SCHEMA.invalidate) {
            vibrateOnTouch(100);
            s.container.classList.add("vibrate");
            // colorationSchema(true, STROKE.color.error);
            colorationSchema(true, "error");
            s.container.addEventListener("animationend", (e) => {
                if (e.animationName === "vibrate") {
                    s.container.classList.remove("vibrate");
                    removeSchemaDrawing();
                    setComplementaryInfos();
                }
            }, { once: true });
        }

        // Bouton "Valider le schéma"
        if(targetId === ID_BUTTON_DRAW_SCHEMA.validate) {
            vibrateOnTouch([100, 50, 100]);
            s.gridPoints.classList.add("pulse");
            s.gridPoints.addEventListener("animationend", () => {
                s.gridPoints.classList.remove("pulse");
                s.container.classList.add("shrink");
                setCookie(s.selectedValueNbDots, s.capturedDots); // Création cookie

                console.log("%cFIN DE L'ANIMATION et creation cookie", "background-color: purple; color: yellow; font-style: italic"); //TEST
                //s.gridPoints.removeEventListener("animationend", () => {});
            }, { once: true });
            s.container.addEventListener("animationend", (e) => {
                if (e.animationName === animationShrink) {
                    s.container.classList.remove("shrink");
                    goBackToStartStep();
                }
            }); // ATTENTION : Ici les évènements s'accumulent !! VOIR COMMENT FAIRE CORRIGER CELA
        }
        //Désactivation button APRES avoir cliqué dessus
        if(e.target.tagName === "BUTTON") {
            s.msg.querySelectorAll("button").forEach(b => b.disabled = true);
        }
    });
}