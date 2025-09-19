import { state as s, reactiveState as rs } from "../state.js";
import { DOT_CSS_CLASS_NAME } from "../constants.js";
import { getComputedStyles, debounce, createEl } from "../core/utils.js";
import { initSVGcheckAnimation, startSVGcheckAnimation } from "./svg_schema.js";
import { isDrawingSchema, stopDrawingSchema, resetSchema, handlePointHover } from "./drawing.js";
import { goBackToStartStep } from "./select.js";

import { releasePointerCaptureOnTouchScreen } from "../main.js"; // EN COURS

const transitionTime = getComputedStyles("--transition-time");
const flipCard = document.querySelector(".flip-card");
const flipCardBackChild = document.querySelector(".flip-card-back > div");

function createDots() {
    for(var i = 0; i < s.nbDotsSelection; i++) {
        let dot = createEl("div", { 
            id: `${DOT_CSS_CLASS_NAME}_${i}`, 
            className: DOT_CSS_CLASS_NAME,
            "data-num": i,
        });
        let wrapperPoint = createEl("div");
        wrapperPoint.append(dot);
        s.gridPoints.append(wrapperPoint);
        dot.addEventListener('pointerover', handlePointHover);
    }
}

function removeDots() {
    s.gridPoints.querySelectorAll(`div:has(.${DOT_CSS_CLASS_NAME})`).forEach(p => {
        p.removeEventListener('pointerover', handlePointHover);
        p.remove();
    });
}

function getCanvasSizeAndDotsCoord() {  console.log("%c---getCanvasSizeAndDotsCoord()----", "background-color: yellow; color: black");
    // Get size to canvas in px according to ".container" element
    s.canvas.width = s.canvas.height = s.container.getBoundingClientRect().width;
    s.boundingCanvas = s.canvas.getBoundingClientRect();

    // Get dots coordonates based on canvas
    s.dotsCoord = [];
    s.dots = s.gridPoints.querySelectorAll(`.${DOT_CSS_CLASS_NAME}`);
    // Calcul centre d'un element du DOM ".point'"
    const DotDistanceCenter = s.dots[0].getBoundingClientRect().width / 2;

    s.dots.forEach((dot, i) => {
        const boundingDot = dot.getBoundingClientRect();
        s.dotsCoord.push({
            "top": boundingDot.top - s.boundingCanvas.top + DotDistanceCenter,
            "left": boundingDot.left - s.boundingCanvas.left + DotDistanceCenter
        });
    })
    //console.log("s.dotsCoord: ", s.dotsCoord); //TEST
}

export function frozenContainerGrid(isActive) {
    s.container.classList[isActive ? 'add' : 'remove']("no-events");
}

export function initGrid() {
    s.root.style.setProperty('--nb-points-par-lgn-col', Math.sqrt(s.nbDotsSelection)); // Affectation var CSS pour positionnement grille de points
    createDots(); // Intégration points (selon l'option choisie ds le select)
    frozenContainerGrid(true);
    setTimeout(() => {
        frozenContainerGrid(false);
        activationGrid();
    }, transitionTime);
}

function activationGrid() { console.log("%cactivationGrid()", "background-color: green; color: white"); //TEST
    getCanvasSizeAndDotsCoord();
    
    /* ICI PROBLEME CAR CET Event reste ! */
    s.EVENT_RESIZE += 1; console.log("s.EVENT_RESIZE: ", s.EVENT_RESIZE); // A VIRER
    window.addEventListener(
      "resize",
      debounce(() => getCanvasSizeAndDotsCoord(), 500)
    );

    /* if(s.isTouchScreen) {
        s.container.addEventListener('pointerdown', (e) => {
            document.getElementById("visualMsgTestMobile").innerHTML = `POINTER DOWN ON ${e.target.id} | pointer.id: ${e.pointerId}`; //TEST
            //if(!e.isPrimary) return; // Pour mobile : On ne garde que le 1er pointeur (le doigt ou la souris) qui a fait le pointerdown
            releasePointerCaptureOnTouchScreen(e);
        });
    } */
    // ou
    if(s.isTouchScreen) s.container.addEventListener('pointerdown', releasePointerCaptureOnTouchScreen);
}


export function resetGrid() {
    /* ICI PROBLEME CAR CET Event reste ! */
    s.EVENT_RESIZE -= 1; console.log("s.EVENT_RESIZE: ", s.EVENT_RESIZE); // A VIRER
    window.removeEventListener(
        "resize",
        debounce(() => getCanvasSizeAndDotsCoord(), 500)
    );

    removeDots();
    resetSchema();

    s.container.removeEventListener('pointermove', isDrawingSchema); // Sert-il ?
    if(s.isTouchScreen) s.container.removeEventListener('pointerdown', releasePointerCaptureOnTouchScreen);
}


/// Sans doute mettre cette fonction ailleurs !
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





/* EN TEST */
let val = null;
rs.watch("isSelectOpen", newVal => {
    if(val !== newVal) {
        console.log("isSelectOpen a changé :", newVal);
        if(newVal) {
            /* s.EVENT_RESIZE += 1; console.log("s.EVENT_RESIZE: ", s.EVENT_RESIZE); // A VIRER
            window.addEventListener("resize",  debounce(() => getCanvasSizeAndDotsCoord(), 500)); */

            s.container.addEventListener(s.isTouchScreen ? 'pointerup' : 'click', stopDrawingSchema);
        } else {
            /* s.EVENT_RESIZE -= 1; console.log("s.EVENT_RESIZE: ", s.EVENT_RESIZE); // A VIRER
            window.removeEventListener("resize",  debounce(() => getCanvasSizeAndDotsCoord(), 500)); */

            s.container.removeEventListener(s.isTouchScreen ? 'pointerup' : 'click', stopDrawingSchema);
        }
    } else {
        console.log("isSelectOpen n'a pas changé");
    }

    val = newVal;
});