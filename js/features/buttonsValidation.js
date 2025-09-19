import { state as s } from "../state.js";
import { ID_BUTTON_DRAW_SCHEMA } from "../constants.js";
import { getComputedStyles } from "../core/utils.js";
import { draw, removeSchemaDrawing } from "./drawing.js";
import { setComplementaryInfos } from "./message.js";
import { setCookie } from "./cookie.js";
import { goBackToStartStep } from "./select.js";

const animationShrink = getComputedStyles("--animation-shrink");

// Création de schéma : Gestion de clics de boutons pour valider/refaire le schéma 
export function handleValidationButtonEvents() {
    s.msg.addEventListener("click", (e) => {
        const targetId = e.target.id;
        // Bouton "Refaire le schéma"
        if(targetId === ID_BUTTON_DRAW_SCHEMA.invalidate) {
            s.container.classList.add("vibrate");
            s.strokeCurrentColor = "red"; // Coloration traits
            draw();
 
            s.container.addEventListener("animationend", (e) => {
                if (e.animationName === "vibrate") {
                    s.container.classList.remove("vibrate");
                    removeSchemaDrawing();  console.log("%c====================", "background-color: red; color: white"); //TEST
                    setComplementaryInfos();
                }
            });
            
        }
        // Bouton "Valider le schéma"
        if(targetId === ID_BUTTON_DRAW_SCHEMA.validate) {
            s.gridPoints.classList.add("pulse");
            s.gridPoints.addEventListener("animationend", () => {
                s.gridPoints.classList.remove("pulse");
                s.container.classList.add("shrink");
                setCookie(s.nbDotsSelection, s.captureDots); // Création cookie

                console.log("%cFIN DE L'ANIMATION et creation cookie", "background-color: purple; color: yellow; font-style: italic"); //TEST
                //s.gridPoints.removeEventListener("animationend", () => {});
            }, { once: true });
            s.container.addEventListener("animationend", (e) => {
                if (e.animationName === animationShrink) {
                    s.container.classList.remove("shrink");
                    goBackToStartStep();
                }
            });
        }
        //Désactivation button APRES avoir cliqué dessus
        if(e.target.tagName === "BUTTON") {
            s.msg.querySelectorAll("button").forEach(b => b.disabled = true);
        }
    });
}