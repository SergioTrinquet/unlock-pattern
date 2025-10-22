
import { state as s } from "../state.js";
import { STROKES_COLORATION_SEQUENCE, STROKE, SCHEMA_ELEMENTS_COLOR_CLASS } from "../constants.js";
import { /* getComputedStyles,  */setCustomProperties } from "../core/utils.js";
import { setComplementaryInfos } from "./message.js";
import { frozenContainerGrid } from "./grid.js";
import { vibrateOnTouch } from "./mobile.js";

const ctx = s.canvas.getContext("2d");
let coordStrokes = [];
let animationSuccessModule, schemaValidityModule = null;

setCustomProperties({
    '--color-stroke': STROKE.color.default,
    '--color-stroke-error': STROKE.color.error,
    '--color-stroke-valid': STROKE.color.valid,
    '--width-stroke': STROKE.width
});

// Gestion du survol des points pour tracer le schéma
// Au survol d'un point, on dessine un trait entre le dernier point et celui-ci
export function handleDotHover(e) {  
    document.getElementById("visualMsgTestMobile").innerHTML = `POINTER HOVER A DOT: ${e.target.id} | pointer.id: ${e.pointerId}`; //TEST
    // if(s.isTouchScreen) releasePointerCaptureOnTouchScreen(e);
    
    vibrateOnTouch(70);
    const idDot = e.target.getAttribute('data-num');
    if(!s.capturedDots.includes(idDot)) {
        // Gestion tracé : Il faut alimenter 'coordStrokes' avec des objets comportant point début et point fin
        const actualSegment = {
            start: { x: s.dotsCoord[idDot].left, y: s.dotsCoord[idDot].top },
            end: { x: null, y: null }
        }
        if(s.capturedDots.length > 0) {
            coordStrokes.pop();
            const previousIdDot = parseInt(s.capturedDots[s.capturedDots.length - 1]);     
            const previousSegment = {
                start: { x: s.dotsCoord[previousIdDot].left, y: s.dotsCoord[previousIdDot].top },
                end: { x: s.dotsCoord[idDot].left, y: s.dotsCoord[idDot].top }
            }
            coordStrokes = [...coordStrokes, previousSegment, actualSegment];
        } else {
            coordStrokes.push(actualSegment);
            s.container.addEventListener('pointermove', isDrawingSchema);
        }

        s.capturedDots.push(idDot);  console.log("s.capturedDots: ", s.capturedDots); //TEST


        // Si pas de schéma encore enregistré et que nb de points max atteint
        if(!s.recordedSchema) {
            if(s.capturedDots.length === s.currentSchemaNbDotsMinMax.nbDotMax) stopDrawingSchema();
            setComplementaryInfos();
        }
        // Si schéma enregistré...
        if(s.recordedSchema) {
            /* if(getCookie(s.selectedValueNbDots) !== s.capturedDots.join("")) { 
                // Faire apparaitre Icone Croix en svg animé !!
            } */
            if(s.capturedDots.length === s.selectedValueNbDots) stopDrawingSchema();
        } 

    }
}


export function isDrawingSchema(e) { 
    //console.log("isDrawing on POINTER MOVE", e); //TEST //console.warn("coordStrokes", coordStrokes); //TEST
    document.getElementById("visualMsgTestMobile").innerHTML = `isDrawing on POINTER MOVE: ${e.target.id} | (isPrimary): ${e.isPrimary}`; //TEST
    
    // if(!e.isPrimary) return; // Pour mobile : On ne garde que le 1er pointeur (le doigt ou la souris) qui a fait le pointerdown
    // if(s.isTouchScreen) releasePointerCaptureOnTouchScreen(e); // Juste pour mobile : Expliquer pourquoi c'est necessaire (n'ecoute que les évènements sur l'element qui a eu le pointerdown en 1er)

    const cursorPositionInCanvas = getCursorPositionOnCanvas(e);
    // Ajout cordonnées du curseur sur fin dernier segment du schema
    coordStrokes[coordStrokes.length - 1].end = { x: cursorPositionInCanvas.x, y: cursorPositionInCanvas.y };
    refreshCanvas();
    draw();
}


// const strokeController = {};
const strokeController = s.strokeController;

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
    }, ms);

    function onAbort() {
        clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onAbort);
        reject(new Error("Aborted"));
    }

    if (signal) {
        signal.addEventListener("abort", onAbort);
    }
  });
}

async function flashSchema(isSchemaValid, controller) {
    if(!(typeof isSchemaValid === "boolean")) return;

    const abortController = new AbortController();
    controller.abortController = abortController;

    const sequence = STROKES_COLORATION_SEQUENCE.map(p => ({
      ...p, // copie les propriétés
      color: (p.color === "custom" ? (isSchemaValid ? SCHEMA_ELEMENTS_COLOR_CLASS.valid : SCHEMA_ELEMENTS_COLOR_CLASS.error) : SCHEMA_ELEMENTS_COLOR_CLASS.default) // écrase la valeur
    }));

    try { 
        let i = 0;
        for (const step of sequence) {
            colorationSchema(STROKES_COLORATION_SEQUENCE[i].color === "custom", step.color);
            i++;
            
            await delay(step.duration, abortController.signal);
        }
    } catch (err) {
        if (err.message === "Aborted") {
            // Animation interrompue immédiatement
            console.log("%cAnimation annulée : coordStrokes => ", 'background-color: red; color: white;', coordStrokes, " | s.capturedDots => ", s.capturedDots);
            removeSchemaDrawing();
        } else {
            throw err;
        }
    }
}

export function colorationSchema(toggleClass, color) {
    if(color === SCHEMA_ELEMENTS_COLOR_CLASS.valid || color === SCHEMA_ELEMENTS_COLOR_CLASS.error || color === SCHEMA_ELEMENTS_COLOR_CLASS.default) {
        // Coloration points
        s.capturedDots.forEach(cd => {
            let dotsClassList = s.dots[cd].classList;
            dotsClassList.remove(SCHEMA_ELEMENTS_COLOR_CLASS.valid, SCHEMA_ELEMENTS_COLOR_CLASS.error);
            if(toggleClass) dotsClassList.add(color);
        });
        // Coloration traits
        s.strokeCurrentColor = STROKE.color[color];

        draw();
    } else {
        console.warn("Fonction colorationSchema: Mauvaise couleur demandée !!")
    }
}

// A VIRER : JUSTE POUR TEST : Pour interrompre à tout moment
document.querySelector("#controllerStroke").addEventListener("click", () => {
    strokeController.abortController.abort(); // Interruption IMMEDIATE
});

 

export async function stopDrawingSchema(e) {  
    //console.log("event >>>>", e?.type); //TEST
    console.log("%cO - Passage dans 'stopDrawingSchema' => DEBUT", 'color: red; font-size: larger'); //TEST
    if(s.capturedDots.length) { // Si tracé existe
        s.container.removeEventListener('pointermove', isDrawingSchema); // Suppression evenement sinon continue à dessiner quand souris bouge
    
        // Mise à jour tracé : Dessin sans le dernier segment
        coordStrokes.pop();
        refreshCanvas();
        draw();

        setComplementaryInfos(e?.type); // Update infos à afficher

        // Désactivation du click sur container qui arrete le dessin pendant l'anim du tracé + event sur survol de points pour créer le tracé
        frozenContainerGrid(true);

        // Check si schéma bon ou pas pour coloration tracé ensuite
        if(!schemaValidityModule) schemaValidityModule = await import("./schemaValidity.js");
        const isSchemaValid = schemaValidityModule.checkSchemaValidity();

        await flashSchema(isSchemaValid, strokeController);
        
        // Si phase de création de schéma + schéma tracé est valide, alors traits et coloration restent, sinon ils disparaissent
        if(!(!s.recordedSchema && isSchemaValid)) { // Tous les cas de figure sauf schema pas enregistré et valide !!
            console.log("%c!!!!!! Schema Enregistré (valide ou pas valide) + Schema pas enr. ET pas valide !!!!!!", 'background-color: lightgreen; color: blue;'); //TEST
            removeSchemaDrawing();
        }
        if(s.recordedSchema && isSchemaValid) { 
            if (!animationSuccessModule) animationSuccessModule = await import("./animationSuccess.js");
            animationSuccessModule.runSequenceSchemaValid();
        } 
        
        console.log("%cO - Passage dans 'stopDrawingSchema' => FIN", 'color: red; font-size: larger'); //TEST
    }
}


// Pour effacer de la grille le dessin du schéma
export function removeSchemaDrawing() {
    // Réinitialisation couleur points et tracé
    s.capturedDots.forEach(cd => s.dots[cd].classList.remove(SCHEMA_ELEMENTS_COLOR_CLASS.valid, SCHEMA_ELEMENTS_COLOR_CLASS.error));
    resetSchema();
    // Réactivation events sur container pour dessiner
    frozenContainerGrid(false);
}


// Reset schema (drawing and data)
export function resetSchema() {
    refreshCanvas();
    coordStrokes = []; // Réinitialisation coord.
    s.capturedDots = []; // Réinitialisation data points survolés
    s.strokeCurrentColor = STROKE.color.default; // Trait schéma avec couleur par défaut
}


function getCursorPositionOnCanvas(e) {
    const {clientX, clientY} = e;
    // Return position from the origin of canvas
    return { 
        x: clientX - s.canvas.left, 
        y: clientY - s.canvas.top 
    }
}

// Pour repartir avec un canvas vierge de tout trait
export function refreshCanvas() {
    ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
}

export function draw() {
    // Boucle sur nb de traits
    for(const stroke of coordStrokes) {
        ctx.beginPath();
        ctx.moveTo(stroke.start.x, stroke.start.y); 
        ctx.lineTo(stroke.end.x, stroke.end.y);
        ctx.strokeStyle = s.strokeCurrentColor;
        ctx.lineWidth = STROKE.width;
        ctx.stroke();
    }
}