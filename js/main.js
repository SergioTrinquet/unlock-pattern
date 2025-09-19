/* Traits qui apparaissent lors du survol des points !!! */

import { state } from "./state.js";
import { STROKE } from "./constants.js";
import { getComputedStyles, debounce } from "./core/utils.js";
import { setComplementaryInfos } from "./features/message.js";
import { selectInit, goBackToStartStep } from "./features/select.js";
import { backgroundSquaresInit } from "./features/background.js";
import { setCookie, getCookie, getCookieValue, isCookiePresent, deleteCookie } from "./features/cookie.js";
import { initSVGcheckAnimation, svgSchemaInit } from "./features/svg_schema.js";

import "./features/linkDeleteSchema.js";

// Idées de découpage du code en module JS asynchrones
// Paquet 1: Quand choix ds liste déroulante de dessin shéma de vérouillage : Chargement partie création de la grille + évènements sur les urvols de points
// Paquet 2 (A VOIR): Au survol 1er point (peut-être génant si latence au survol du 1er point !!), gestion partie dessin et fin dessin avec message
// Paquet 3: Boutons et evenements qui vont avec qd schéma créé et valide
// Paquet 4: Partie jeu (pas encore fait)

/* 
Liste bugs:
1 - Lien "supprimer le shéma enregistré" reste apparant, même quand on change valeur dans le select
2 - Quand shéma de fait et que l'on resize la fenetre, les traits du shéma ne changent pas de taille 
3 - Quand on a fait un tracé sans valider, et que l'on passe à une grille avec un autre nbr de points, le tracé disparait 
    bien mais plus de tracé ensuite au survol des points, puis quand on clique, réapparait l'ancien tracé et 
    le nouveau! => Une des solutions peut-être de désactiver le select tant que l'utilisateur n'a pas cliqué sur 
    un des boutons 'refaire un schémà' ou 'validr ce schéma'

Liste notes:
1 - Ajouter une animation sur lien "supprimer le shéma enregistré"
3 - Signifier dans le select quand un shéma est déjà enregistré
3 - Faire en sorte que dessin shéma fonctionne pour mobile! => FAIT
4 - Faire une animation (du genre anim 3D avec grille qui pivote sur son axe vertical) (sans remettre le select au centre!) quand on passe de grille de 9 points à grille de 16 points, et inversement
5 - Quand resize de la fenetre, il y a un delai pour le redimentionnement/repositionnement des elements qui constituent la grille (fond, points) => Voir ce que l'on peut faire!
6 - Ajouter l'API mobile pour faire vibrer qd on survole un point
7 - Voir si on peut colorer interfcae du navigateur pour ressembler au fond de l'app
*/
const isTouchScreen = window.matchMedia("(pointer:coarse)").matches;


state.gridPoints = document.querySelector(".grid-points");

const container = document.querySelector(".container");
const canvas = document.querySelector("#zone-canvas");
const ctx = canvas.getContext("2d");

state.msg = document.querySelector(".msg");


const idButtonInvalidationSchema = "btInvalidateSchema",
idButtonValidationSchema = "btValidateSchema";

let dotsCoord = [];

state.animationMsg = getComputedStyles("--animation-msg");

STROKE.color.default = getComputedStyles("--color-stroke");
STROKE.color.error = getComputedStyles("--color-stroke-error");
STROKE.color.valid = getComputedStyles("--color-stroke-valid");
STROKE.width = getComputedStyles("--width-stroke");

const animationShrink = getComputedStyles("--animation-shrink");

let coordStrokes = [];

// let nbDotsSelection = null;
// let recordedSchema = false;


backgroundSquaresInit();
svgSchemaInit();
selectInit();


// Gestion du survol des points pour tracer le schéma
// Au survol d'un point, on dessine un trait entre le dernier point et celui-ci
// function handlePointHover(e) {  
export function handlePointHover(e) {  
    console.log("POINTER HOVER A DOT", e); //TEST
    document.getElementById("visualMsgTestMobile").innerHTML = `POINTER HOVER A DOT: ${e.target.id} | pointer.id: ${e.pointerId}`; //TEST
    // if(isTouchScreen) releasePointerCaptureOnTouchScreen(e);
    
    const idDot = e.target.getAttribute('data-num');
    if(!state.captureDots.includes(idDot)) {
        // Gestion Data pour le tracé
        // Il faut alimenter 'coordStrokes' avec des objets comportant point début et point fin
        const actualSegment = {
            start: { x: dotsCoord[idDot].left, y: dotsCoord[idDot].top },
            end: { x: null, y: null }
        }
        if(state.captureDots.length > 0) {
            coordStrokes.pop();
            const previousIdDot = parseInt(state.captureDots[state.captureDots.length - 1]);     
            const previousSegment = {
                start: { x: dotsCoord[previousIdDot].left, y: dotsCoord[previousIdDot].top },
                end: { x: dotsCoord[idDot].left, y: dotsCoord[idDot].top }
            }
            coordStrokes = [...coordStrokes, previousSegment, actualSegment];
        } else {
            coordStrokes.push(actualSegment);
            container.addEventListener('pointermove', isDrawingSchema);
        }

        state.captureDots.push(idDot);


        ////// EN COURS ///////
        // Si pas de schéma encore enregistré et que nb de points max atteint
        if(!state.recordedSchema) {
            if(state.captureDots.length === state.currentSchemaNbDotsMinMax.nbDotMax) stopDrawingSchema();
            setComplementaryInfos();
        }
        
        // Si schéma enregistré mais ...
        // console.log("state.captureDots.length", state.captureDots.length, "| state.nbDotsSelection", state.nbDotsSelection); //TEST
        if(state.recordedSchema) {
            /* if(getCookie(state.nbDotsSelection) !== state.captureDots.join("")) { 
                // Faire apparaitre Icone Croix en svg animé !!
            } */
            if(state.captureDots.length === state.nbDotsSelection) { 
                // Faire apparaitre Icone Valide en svg animé !!
                stopDrawingSchema();
            }
        } 
        ////// FIN EN COURS ///////


    }
}


// function isDrawingSchema(e) { 
export function isDrawingSchema(e) { 
    console.log("isDrawing on POINTER MOVE", e); //TEST //console.warn("coordStrokes", coordStrokes); //TEST
    document.getElementById("visualMsgTestMobile").innerHTML = `isDrawing on POINTER MOVE: ${e.target.id} | (isPrimary): ${e.isPrimary}`; //TEST
    // if(!e.isPrimary) return; // Pour mobile : On ne garde que le 1er pointeur (le doigt ou la souris) qui a fait le pointerdown
    if(isTouchScreen) releasePointerCaptureOnTouchScreen(e); // Juste pour mobile : Expliquer pourquoi c'est necessaire (n'ecoute que les évènements sur l'element qui a eu le pointerdown en 1er)

    const cursorPosinCanvas = getCursorPositionOnCanvas(e); //console.log(">> cursorPosinCanvas", cursorPosinCanvas, dotCoord); //TEST
    // Ajout cordonnées du curseur sur fin dernier segment du schema
    coordStrokes[coordStrokes.length - 1].end = { x: cursorPosinCanvas.x, y: cursorPosinCanvas.y };
    refreshCanvas();
    draw();
}

// async function stopDrawingSchema(e) {  
export async function stopDrawingSchema(e) {  
    //console.log("event >>>>", e?.type); //TEST
    console.log("%cO - Passage dans 'stopDrawingSchema' => DEBUT", 'color: red; font-size: larger'); //TEST
    if(state.captureDots.length) { // Si tracé existe
        // Suppression evenement sinon continue à dessiner quand souris bouge
        container.removeEventListener('pointermove', isDrawingSchema);
    
        // Mise à jour tracé
        coordStrokes.pop(); // Retrait dernier trait
        refreshCanvas(); // Suppression dernier dessin en cours
        draw(); // Nouveau dessin sans le dernier segment

        // Mise à jour infos à afficher
        setComplementaryInfos(e?.type);

        // Désactivation du click sur container qui arrete le dessin pendant l'anim du tracé
        container.removeEventListener(isTouchScreen ? 'pointerup' : 'click', stopDrawingSchema); 
        //console.warn("%cO - Passage dans 'stopDrawingSchema' => removeEventListener('click', stopDrawingSchema)", 'color: red; font-size: 10px'); //TEST
        activationDotsEvents(state.dots, false);

        // Check si schéma bon ou pas pour coloration tracé ensuite
        const isSchemaValid = checkSchemaValidity();
        await coloredSignalOnSchemaAnimation(isSchemaValid); 
        //console.log(">>> Après la methode de coloration du trait <<<", (isSchemaValid)); //TEST : Fonctionne
        
        // Si phase de création de schéma et schéma tracé est valide, alors 
        // traits et coloration restent, sinon ils disparaissent
        console.log("state.recordedSchema : ", state.recordedSchema, " | isSchemaValid : ", isSchemaValid, "(!(!state.recordedSchema && isSchemaValid))", (!(!state.recordedSchema && isSchemaValid))); //TEST
        if(!(!state.recordedSchema && isSchemaValid)) {
            console.log("!!!!!! Schema Enregistré ou Schema pas enr. ET pas valide !!!!!!"); //TEST
            await delayRemoveSchemaDrawing();
        }

        if(state.recordedSchema && isSchemaValid) {
            console.log("flip la card pour laisser apparaitre le SVG de la coche !"); //TEST
            flipGridCard();
        }
        console.log("%cO - Passage dans 'stopDrawingSchema' => FIN", 'color: red; font-size: larger'); //TEST
    }
}

// Renvoie un booleen pour savoir si le schéma est valide ou pas
function checkSchemaValidity() {
    let validSchema = false;
    // Check si nb saisie points est bien entre nb min et nb max 
    if(!state.recordedSchema) {
        if(state.captureDots.length < state.currentSchemaNbDotsMinMax.nbDotMin || state.captureDots.length > state.currentSchemaNbDotsMinMax.nbDotMax) { validSchema = false }
        if(state.captureDots.length >= state.currentSchemaNbDotsMinMax.nbDotMin && state.captureDots.length <= state.currentSchemaNbDotsMinMax.nbDotMax) { validSchema = true }
    } 
    // Check si saisie points correspond à valeur cookie
    if(state.recordedSchema) {
        if(isCookiePresent(state.nbDotsSelection)) {
            validSchema = JSON.parse(getCookieValue(`cookieShema${state.nbDotsSelection}`))?.combination.join(",") === state.captureDots.join(",") 
            ? true 
            : false;
        } else {
            console.warn(`Pas de cookie présent pour une grille de ${state.nbDotsSelection} points !`);
        }
    }
    return validSchema;
}

// Flash sur tracé et points pour signaler si schéma est bon ou mauvais
function coloredSignalOnSchemaAnimation(isValid) { 
    console.log("1 - Passage dans 'coloredSignalOnSchemaAnimation' => DEBUT"); //TEST
    // Coloration points
    if(typeof isValid !== 'undefined') { // Faire code plus moderne
        state.captureDots.forEach(cd => state.dots[cd].classList.add(isValid ? "valid" : "error")); // Coloration points
    }
    // Coloration traits
    // const colorStroke = isValid ? colorStrokeValid : (isValid === false ? colorStrokeError : colorStrokeDefault);
    const colorStroke = isValid ? STROKE.color.valid : (isValid === false ? STROKE.color.error : STROKE.color.default);
    state.strokeCurrentColor = colorStroke; // Coloration traits
    draw();
    //coloredSignalOnSchema(isValid); // NEW
    console.log("%cPromise: Etape 0", "background-color: yellow"); //TEST
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            state.strokeCurrentColor = STROKE.color.default;
            refreshCanvas(); draw();
            console.log("%cPromise: Etape 1", "background-color: yellow", state.strokeCurrentColor); //TEST
            resolve(true);
        }, 2000); // 200 
    })
    .then((value) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                state.strokeCurrentColor = colorStroke;
                refreshCanvas(); draw(); 
                console.log("%cPromise: Etape 2", "background-color: yellow", state.strokeCurrentColor); //TEST
                console.log("1 - Passage dans 'coloredSignalOnSchemaAnimation' => FIN"); //TEST
                resolve(true);
            }, 1000); // 100
        })
    });

    /* V2 : Async/await */
    /* let promise = new Promise(function(resolve, reject) {
        setTimeout(() => {
            state.strokeCurrentColor = "yellow";
            refreshCanvas(); draw();
            resolve(true)
        }, 2000);
    });
    await promise.then(); */
}

function coloredSignalOnSchema(isValid) {
    // Coloration points
    if(typeof isValid !== 'undefined') { // Faire code plus moderne
        state.captureDots.forEach(cd => state.dots[cd].classList.add(isValid ? "valid" : "error")); 
    }
    // Coloration traits
    // const colorStroke = isValid ? colorStrokeValid : (isValid === false ? colorStrokeError : colorStrokeDefault);
    const colorStroke = isValid ? STROKE.color.valid : (isValid === false ? STROKE.color.error : STROKE.color.default);
    state.strokeCurrentColor = colorStroke; 
    refreshCanvas(); //? Utile ?
    draw();
}

// Pour appeler la fonction de suppression
// du dessin du schéma après un certain délai
function delayRemoveSchemaDrawing() { 
    console.log("2 - Passage dans 'delayRemoveSchemaDrawing' => DEBUT"); //TEST
    return new Promise((resolve, reject) => {
        setTimeout(() => {     
            removeSchemaDrawing();
            resolve(true);
            console.log("2 - Passage dans 'delayRemoveSchemaDrawing' => FIN"); //TEST
        }, 4000); // 200
    })
}

// Pour effacer de la grille le dessin du schéma
function removeSchemaDrawing() {
    refreshCanvas(); // Disparition tracé
    // Réinitialisation couleur points et tracé
    state.captureDots.forEach(cd => state.dots[cd].classList.remove("valid", "error"));
    state.strokeCurrentColor = STROKE.color.default;  

    // Réactivation click sur container qui permet d'arreter le dessin + hover sur points
    container.addEventListener(isTouchScreen ? 'pointerup' : 'click', stopDrawingSchema);    console.warn("Dans 'removeSchemaDrawing()' => 'addEventListener('click', stopDrawingSchema)'"); console.trace();//TEST
    activationDotsEvents(state.dots, true);

    // Réinitialisation data points survolés
    state.captureDots = []; 
    coordStrokes = [];
}

function flipGridCard() {
    const flipCard = document.querySelector(".flip-card");
    flipCard.classList.toggle("flip-over", true);
    initSVGcheckAnimation();
    setTimeout(() => {
        flipCard.classList.toggle("flip-over", false);
        //setTimeout(() => goBackToStartStep(), 2000);
    }, 3000);
}


// Phase Création de schéma : Gestion des clics de boutons pour valider/refaire le schéma 
export function handleValidationButtonEvents() {
    state.msg.addEventListener("click", (e) => {
        const targetId = e.target.id;
        // Bouton "Refaire le schéma"
        if(targetId === idButtonInvalidationSchema) {
            container.classList.add("vibrate");
            state.strokeCurrentColor = "red"; // Coloration traits
            draw();
 
            container.addEventListener("animationend", (e) => {
                if (e.animationName === "vibrate") {
                    container.classList.remove("vibrate");
                    removeSchemaDrawing();  console.log("%c====================", "background-color: red; color: white"); //TEST
                    setComplementaryInfos();
                }
            });
            
        }
        // Bouton "Valider le schéma"
        if(targetId === idButtonValidationSchema) {
            state.gridPoints.classList.add("pulse");
            state.gridPoints.addEventListener("animationend", () => {
                state.gridPoints.classList.remove("pulse");
                container.classList.add("shrink");
                setCookie(state.nbDotsSelection, state.captureDots); // Création cookie

                console.log("%cFIN DE L'ANIMATION et creation cookie", "background-color: purple; color: yellow; font-style: italic"); //TEST
                //state.gridPoints.removeEventListener("animationend", () => {});
            }, { once: true });
            container.addEventListener("animationend", (e) => {
                if (e.animationName === animationShrink) {
                    container.classList.remove("shrink");
                    goBackToStartStep();
                }
            });
        }
        //Désactivation button APRES avoir cliqué dessus
        if(e.target.tagName === "BUTTON") {
            state.msg.querySelectorAll("button").forEach(b => b.disabled = true);
        }
    });
}


// Pour repartir avec un canvas vierge de tout trait
function refreshCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    // Boucle sur nb de traits
    for(const stroke of coordStrokes) {
        ctx.beginPath();
        ctx.moveTo(stroke.start.x, stroke.start.y); 
        ctx.lineTo(stroke.end.x, stroke.end.y);
        ctx.strokeStyle = state.strokeCurrentColor;
        ctx.lineWidth = STROKE.width;
        ctx.stroke();
    }
}




///// Partie originelle Canvas /////
let boundingCanvas = null;
    
function getCursorPositionOnCanvas(e) {
    // Get position cursor
    const {clientX, clientY} = e;
    // Get position from the origin of canvas
    return { 
        x: clientX - boundingCanvas.left, 
        y: clientY - boundingCanvas.top 
    }
}

// Set size to canvas in px according to ".container" element
function canvasSizeCalculation() {
    canvas.width = canvas.height = container.getBoundingClientRect().width;
    boundingCanvas = canvas.getBoundingClientRect();
}

function getDotsCoord() {
    dotsCoord = [];
    // const dots = document.querySelectorAll("[id^='point_']");
    state.dots = document.querySelectorAll("[id^='point_']");
    // Calcul centre d'un element du DOM ".point'"
    const DotDistanceCenter = state.dots[0].getBoundingClientRect().width / 2;

    state.dots.forEach((dot, i) => {
        const boundingDot = dot.getBoundingClientRect();
        dotsCoord.push({
            "top": boundingDot.top - boundingCanvas.top + DotDistanceCenter,
            "left": boundingDot.left - boundingCanvas.left + DotDistanceCenter
        });
    })
    console.log("dotsCoord: ", dotsCoord); //TEST
}

function init() {
    canvasSizeCalculation();
    getDotsCoord();
}

//function activationGrid() {
export function activationGrid() {
    init();
    window.addEventListener(
      "resize",
      debounce(() => init(), 500)
    );

    //state.dots = state.gridPoints.querySelectorAll(".point");
    activationDotsEvents(state.dots, true);
    container.addEventListener(isTouchScreen ? 'pointerup' : 'click', stopDrawingSchema);

    // if(isTouchScreen) {
    //     container.addEventListener('pointerdown', (e) => {
    //         document.getElementById("visualMsgTestMobile").innerHTML = `POINTER DOWN ON ${e.target.id} | pointer.id: ${e.pointerId}`; //TEST
    //         //if(!e.isPrimary) return; // Pour mobile : On ne garde que le 1er pointeur (le doigt ou la souris) qui a fait le pointerdown
    //         releasePointerCaptureOnTouchScreen(e);
    //     });
    // }
    // ou
    if(isTouchScreen) container.addEventListener('pointerdown', releasePointerCaptureOnTouchScreen);
}

export function resetGrid() {
    refreshCanvas();

    // Suppression évènements
    activationDotsEvents(state.dots, false);
    container.removeEventListener('pointermove', isDrawingSchema);
    container.removeEventListener(isTouchScreen ? 'pointerup' : 'click', stopDrawingSchema); // TEST
    if(isTouchScreen) container.removeEventListener('pointerdown', releasePointerCaptureOnTouchScreen);

    coordStrokes = [];
    state.captureDots = [];

    window.removeEventListener(
        "resize",
        debounce(() => init(), 500)
    );

    state.strokeCurrentColor = STROKE.color.default; // Trait shéma avec couleur par défaut
}

// Fonction dédiée à la gestion des evenements propre au touch donc au mobile
export function releasePointerCaptureOnTouchScreen(e) {
    e.target.releasePointerCapture(e.pointerId);
}


function activationDotsEvents(dots, isActive) {
    if(isActive) {
        dots?.forEach(d => d.addEventListener('pointerover', handlePointHover));
    } else {
        dots?.forEach(d => d.removeEventListener('pointerover', handlePointHover));
    }
};




// ======= NE FONCTIONNE PAS ! ======//
// Juste pour mobile : Pour forcer le full screen et empecher la rotation de l'écran
const requestFullScreen = async () => {
let element = await document.documentElement;
let requestMethod =
    element.requestFullScreen ||
    element.webkitRequestFullScreen ||
    element.mozRequestFullScreen ||
    element.msRequestFullScreen;
    if (requestMethod) {
        requestMethod.call(element);
        return true;
    } else if (typeof window.ActiveXObject !== "undefined") {
        let wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
        wscript.SendKeys("{F11}");
        return true;
        }
    }
}
const lock = async () => {
    var myScreenOrientation = window.screen.orientation;
    myScreenOrientation.lock(myScreenOrientation.type);
    return true;
}
requestFullScreen();
lock();