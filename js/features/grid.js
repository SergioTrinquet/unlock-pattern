import { state as s, reactiveState as rs } from "../state.js";
import { getComputedStyles, debounce, createEl, setCustomProperties } from "../core/utils.js";
import { DOTS_SCHEMA_CONFIGS } from "../constants.js";
import { isDrawingSchema, stopDrawingSchema, resetSchema, handleDotHover } from "./drawing.js";
import { releasePointerCaptureOnTouchScreen } from "./mobile.js";

const transitionTime = getComputedStyles("--grid-fading-transition-time");
let resizeHandler = null;

function createDots() {
    for(var i = 0; i < s.selectedValueNbDots; i++) {
        let dot = createEl("div", {
            className: "dot",
            "data-num": i,
        });
        let wrapperPoint = createEl("div");
        wrapperPoint.append(dot);
        s.gridPoints.append(wrapperPoint);
        dot.addEventListener('pointerover', handleDotHover);
    }
}

function removeDots() {
    s.gridPoints.querySelectorAll(`div:has(.dot)`).forEach(p => {
        p.removeEventListener('pointerover', handleDotHover);
        p.remove();
    });
}

function getCanvasSizeAndDotsCoord() {
    // Get size to canvas in px according to ".container" element
    s.canvas.width = s.canvas.height = s.container.getBoundingClientRect().width;
    s.canvas.top = s.canvas.getBoundingClientRect().top;
    s.canvas.left = s.canvas.getBoundingClientRect().left;

    // Get dots coordonates based on canvas
    s.dotsCoord = [];
    s.dots = s.gridPoints.querySelectorAll(`.dot`);
    // Calcul centre d'un element du DOM ".dot'"
    const DotDistanceCenter = s.dots[0].getBoundingClientRect().width / 2;

    s.dots.forEach((dot, i) => {
        const boundingDot = dot.getBoundingClientRect();
        s.dotsCoord.push({
            "top": boundingDot.top - s.canvas.top + DotDistanceCenter,
            "left": boundingDot.left - s.canvas.left + DotDistanceCenter
        });
    })

    console.log("%c---getCanvasSizeAndDotsCoord()----", "background-color: yellow; color: black", s.canvas, s.dotsCoord);
}

export function frozenContainerGrid(isActive) {
    s.container.classList[isActive ? 'add' : 'remove']("no-events");
}

export function initGrid() {
    setCustomProperties({'--nb-points-par-lgn-col': Math.sqrt(s.selectedValueNbDots)}); // Affectation var CSS pour positionnement grille de points
    getCurrentGridConfig();
    createDots();
    frozenContainerGrid(true);
    setTimeout(() => {
        frozenContainerGrid(false);
        getCanvasSizeAndDotsCoord();
        /* if(s.isTouchScreen) {
            s.container.addEventListener('pointerdown', (e) => {
                document.getElementById("visualMsgTestMobile").innerHTML = `POINTER DOWN ON ${e.target.id} | pointer.id: ${e.pointerId}`; //TEST
                //if(!e.isPrimary) return; // Pour mobile : On ne garde que le 1er pointeur (le doigt ou la souris) qui a fait le pointerdown
                releasePointerCaptureOnTouchScreen(e);
            });
        } */
        // ou
        if(s.isTouchScreen) s.container.addEventListener('pointerdown', releasePointerCaptureOnTouchScreen);
    }, transitionTime);
}


export function resetGrid() {
    removeDots();
    resetSchema();
    s.strokeController.abortController?.abort(); // Interruption IMMEDIATE de l'animation sur le Flash de couleur sur le tracé du schéma s'il est présent

    s.container.removeEventListener('pointermove', isDrawingSchema); // Sert-il ?
    if(s.isTouchScreen) s.container.removeEventListener('pointerdown', releasePointerCaptureOnTouchScreen);
}

function getCurrentGridConfig() {
    s.currentSchemaNbDotsMinMax = !s.recordedSchema ? (DOTS_SCHEMA_CONFIGS.find(d => (d.nbDotPerLC * d.nbDotPerLC) === s.selectedValueNbDots) || {}) : {};
}



/* EN COURS DE TEST */
let val = null;
rs.watch("isSelectOpen", newVal => {
    if(val !== newVal) {
        console.log("isSelectOpen a changé :", newVal);
        if(newVal) {
            s.EVENT_RESIZE += 1; console.log("s.EVENT_RESIZE: ", s.EVENT_RESIZE); // A VIRER
            resizeHandler = debounce(() => getCanvasSizeAndDotsCoord(), 500);
            window.addEventListener("resize",  resizeHandler);

            s.container.addEventListener(s.isTouchScreen ? 'pointerup' : 'click', stopDrawingSchema);
        } else {
            s.EVENT_RESIZE -= 1; console.log("s.EVENT_RESIZE: ", s.EVENT_RESIZE); // A VIRER
            window.removeEventListener("resize",  resizeHandler);

            s.container.removeEventListener(s.isTouchScreen ? 'pointerup' : 'click', stopDrawingSchema);
        }
    } else {
        console.log("isSelectOpen n'a pas changé");
    }

    val = newVal;
});