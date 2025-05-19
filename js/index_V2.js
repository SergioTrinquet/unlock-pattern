/* Traits qui apparaissent lors du survol des points !!! */

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
3 - Faire en sorte que dessin shéma fonctionne pour mobile!
4 - Faire une animation (du genre anim 3D avec grille qui pivote sur son axe vertical) (sans remettre le select au centre!) quand on passe de grille de 9 points à grille de 16 points, et inversement
5 - Quand resize de la fenetre, il y a un delai pour le redimentionnement/repositionnement des elements qui constituent la grille (fond, points) => Voir ce que l'on peut faire!
*/

const selectNbPoints = document.querySelector("#select-nb-points");
const gridPoints = document.querySelector(".grid-points");
const linkDeleteSchema = document.querySelector("#deleteSchema");
const container = document.querySelector(".container");
const canvas = document.querySelector("#zone-canvas");
const ctx = canvas.getContext("2d");
const squareWrapper = document.querySelector(".squares-wrapper");
let squareRanges = null;
const CLASS_NAME_SQUARE_RANGE = "squares-range";

const msgClasses = { 
    default: 'msg', 
    options: ['valid', 'invalid'], 
    animation: 'anim-up'
};
const msg = document.querySelector(".msg"),
resteMsg = " schéma de dévérouillage",
msgCreation = "Créez votre",
msgDessin = "Dessinez le";

const idButtonInvalidationSchema = "btInvalidateSchema",
idButtonValidationSchema = "btValidateSchema";

const msgToPrintSchemaValide = "Schéma valide",
msgToPrintNbDotsMaxAuthorized = "Nombre de points max. atteint",
msgToPrintSchemaInvalide = "Schéma invalide",
msgToPrintSchemaPasAssezPoints = ": Pas assez de points !",
msgToPrintButtonsWhenCreationSchemaIsOK = `<button id="${idButtonInvalidationSchema}">Refaire un schéma</button>
<button id="${idButtonValidationSchema}">Valider ce schéma</button>`;
let lastMsg = "";
let TEST_FLAG = false;

const SVGiconCheckObj = document.getElementById("iconCheckObj");
let svgDoc = null,
    svgCheckIconCircle = null,
    svgCheckIconSmallLine = null,
    svgCheckIconBigLine = null;

let dotsCoord = [];
let captureDots = [];

const nbDotsPerLine = [
    { nbDotPerLC: 3, nbDotMin: 5, nbDotMax: 8 }, 
    { nbDotPerLC: 4, nbDotMin: 6, nbDotMax: 12 }
];
// Alimentation du select
nbDotsPerLine.map(n => {
    const nb = n.nbDotPerLC * n.nbDotPerLC;
    selectNbPoints.innerHTML += `<option value="${nb}">${nb} points (shéma entre ${n.nbDotMin} et ${n.nbDotMax} points)</option>`;
})

const root = document.documentElement;
const computedStyles = getComputedStyle(root);
const transitionTime = computedStyles.getPropertyValue("--transition-time");
const animationMsg = computedStyles.getPropertyValue("--animation-msg");

const colorStrokeDefault = computedStyles.getPropertyValue("--color-stroke");
const colorStrokeError = computedStyles.getPropertyValue("--color-stroke-error");
const colorStrokeValid = computedStyles.getPropertyValue("--color-stroke-valid");
let strokeStyle = colorStrokeDefault;
const lineWidth = computedStyles.getPropertyValue("--width-stroke");

const animationShrink = computedStyles.getPropertyValue("--animation-shrink");

let delayTransitionFlippingCard = computedStyles.getPropertyValue("--time-transition-flipping-card");


let coordStrokes = [];
let dots = null;
let nbDotsSelection = null;
let recordedSchema = false;
let currentSchemaNbDotsMinMax = {};

setBackgroundSquaresHomePage();
// SVG
SVGiconCheckObj.addEventListener('load', () => { 
    setVarElementsOfSVGcheck(); // Initialisation des variables
    setColorToSVGcheck(); // Coloration elements SVG
}, false);

// Click suppression enregistrement schéma
linkDeleteSchema.addEventListener("click", deleteRecordSchema);

// Quand sélection liste déroulante...
selectNbPoints.addEventListener('change', () => {
    nbDotsSelection = parseInt(selectNbPoints.value);

    // Réinitialisation
    gridPoints.querySelectorAll("div:has(.point)").forEach(p => p.remove());

    //Squares background qui disparaissent/reapparaissent
    squareWrapper.classList.toggle("fade-in", !Number.isInteger(nbDotsSelection));
    squareRanges.forEach(el => el.classList.toggle("hidden", Number.isInteger(nbDotsSelection)));

    if(Number.isInteger(nbDotsSelection)) {
        // Affectation var CSS pour positionnement grille de points
        root.style.setProperty('--nb-points-par-lgn-col', Math.sqrt(nbDotsSelection));

        recordedSchema = isCookiePresent(nbDotsSelection); // Test présence cookie
        displayComplementaryInfos({text: `${recordedSchema ? msgDessin : msgCreation}${resteMsg}`}); // Message sous le select
        linkDeleteSchema.classList.toggle("display", recordedSchema); // Pour faire aparaitre ou non le lien de suppression du schéma enregistré
        currentSchemaNbDotsMinMax = !recordedSchema ? nbDotsPerLine.find(d => (d.nbDotPerLC * d.nbDotPerLC) === nbDotsSelection) : {};

        // Intégration nb de points sélectionné dans le DOM
        for(var i = 0; i < nbDotsSelection; i++) { createDot(i) };

        setTimeout(initGridForSchema, transitionTime);
    } else {
        console.log("removeGridForSchema !!", nbDotsSelection); // TEST
        removeGridForSchema();
    }
});


function createColumnSquares(classes) {
    const it =  10;
    const svgMaxNbImgs = it/2;
    const squareRange = document.createElement("div");
    let svgIdx = 0;

    squareRange.className = `${CLASS_NAME_SQUARE_RANGE} ${classes.direction} ${classes.speed}`;
    for(let i = 0; i < it; i++) {
        const square = document.createElement("div");
        svgIdx = (i >= svgMaxNbImgs) ? (i - svgMaxNbImgs + 1) : i + 1;
        square.className = `svg_${svgIdx}`;
        square.innerText = (i >= svgMaxNbImgs ? svgIdx + "_bis" : svgIdx); // A VIRER
        squareRange.append(square);
    }
    return squareRange;
}

function setBackgroundSquaresHomePage() {
    const columnSquares = [
        { direction: "up", speed: "" },   
        { direction: "down", speed: "" },
        { direction: "up", speed: "slow" },
        { direction: "down", speed: "slow" }
    ]
    
    // Création des carrés de fond
    columnSquares.forEach((el, i) => {
        const cs = createColumnSquares(el);
        if (cs == null) return; // Utile ??
        
        //square.style.setProperty("--square-size", `${(i + 1) * 10}rem`);
        squareWrapper.append(cs);
    });

    squareRanges = squareWrapper.querySelectorAll(`.${CLASS_NAME_SQUARE_RANGE}`);
}

// Création point
function createDot(i) {
    let dot = document.createElement("div");
    dot.id = `point_${i}`;
    dot.className = "point";
    dot.setAttribute("data-num", i);
    let wrapperPoint = document.createElement("div");
    wrapperPoint.append(dot);
    gridPoints.append(wrapperPoint);
    return dot;
}


function handlePointHover(e) {  
    const idDot = e.target.getAttribute('data-num');
    if(!captureDots.includes(idDot)) {
        // Gestion Data pour le tracé
        // Il faut alimenter 'coordStrokes' avec des objets comportant point début et point fin
        //console.log("Dans 'handlePointHover' | debut: ", captureDots, "captureDots.length: ", captureDots.length);//TEST
        const actualSegment = {
            start: { x: dotsCoord[idDot].left, y: dotsCoord[idDot].top },
            end: { x: null, y: null }
        }
        if(captureDots.length > 0) {
            coordStrokes.pop();
            const previousIdDot = parseInt(captureDots[captureDots.length - 1]);     
            //console.error("previousIdDot", previousIdDot, "{ x: dotsCoord[previousIdDot].left, y: dotsCoord[previousIdDot].top }", { x: dotsCoord[previousIdDot].left, y: dotsCoord[previousIdDot].top }); //TEST
            const previousSegment = {
                start: { x: dotsCoord[previousIdDot].left, y: dotsCoord[previousIdDot].top },
                end: { x: dotsCoord[idDot].left, y: dotsCoord[idDot].top }
            }
            /* coordStrokes.push(previousSegment);
            coordStrokes.push(actualSegment); */
            coordStrokes = [...coordStrokes, previousSegment, actualSegment];
        } else {
            coordStrokes.push(actualSegment);
            container.addEventListener('mousemove', isDrawingSchema);
        }

        captureDots.push(idDot);


        ////// EN COURS ///////
        // Si pas de schéma encore enregistré et que nb de points max atteint
        if(!recordedSchema) {
            if(captureDots.length === currentSchemaNbDotsMinMax.nbDotMax) stopDrawingSchema();
            setComplementaryInfos();
        }
        
        // Si schéma enregistré mais ...
        // console.log("captureDots.length", captureDots.length, "| nbDotsSelection", nbDotsSelection); //TEST
        if(recordedSchema) {
            /* if(getCookie(nbDotsSelection) !== captureDots.join("")) { 
                // Faire apparaitre Icone Croix en svg animé !!
            } */
            if(captureDots.length === nbDotsSelection) { 
                // Faire apparaitre Icone Valide en svg animé !!
                stopDrawingSchema();
            }
        } 
        ////// FIN EN COURS ///////


    }
}

function setComplementaryInfos(calledFromClick) {  
    //console.log("Dans 'setComplementaryInfos > calledFromClick': ", calledFromClick); //TEST
    if(!recordedSchema) {   //console.log("Pas de schéma enregistré !!","captureDots.length: " , captureDots.length, "| currentSchemaNbDotsMinMax.nbDotMin: ", currentSchemaNbDotsMinMax.nbDotMin, " | currentSchemaNbDotsMinMax.nbDotMax: ", currentSchemaNbDotsMinMax.nbDotMax); //TEST
        if(!captureDots.length) displayComplementaryInfos({text: `${msgCreation}${resteMsg}`, anim: true});
        
        if(calledFromClick) {
            if(captureDots.length < currentSchemaNbDotsMinMax.nbDotMin) {
                displayComplementaryInfos({text: `${msgToPrintSchemaInvalide}${msgToPrintSchemaPasAssezPoints}`, className: 'invalid', anim: true});
                setTimeout(() => {
                    displayComplementaryInfos({text: `${msgCreation}${resteMsg}`, anim: true});
                }, 2000);
            }
            if(captureDots.length >= currentSchemaNbDotsMinMax.nbDotMin && captureDots.length <= currentSchemaNbDotsMinMax.nbDotMax) {
                displayComplementaryInfos({text: msgToPrintButtonsWhenCreationSchemaIsOK, anim: true});
                if(!TEST_FLAG) { handleValidationButtonEvents(); TEST_FLAG = true; } //TEST
            }
        }
        // Msgs 'Schéma valide'
        if(
            captureDots.length >= currentSchemaNbDotsMinMax.nbDotMin && 
            captureDots.length <= currentSchemaNbDotsMinMax.nbDotMax && 
            lastMsg !== msgToPrintSchemaValide
        ) {    
            displayComplementaryInfos({text: msgToPrintSchemaValide, className: 'valid', anim: true});
            lastMsg = msgToPrintSchemaValide;
        } 

        if(captureDots.length === currentSchemaNbDotsMinMax.nbDotMax) {
            displayComplementaryInfos({text: msgToPrintNbDotsMaxAuthorized, className: 'valid', anim: true});  
            setTimeout(() => {
                displayComplementaryInfos({text: msgToPrintButtonsWhenCreationSchemaIsOK, anim: true});
                if(!TEST_FLAG) { handleValidationButtonEvents(); TEST_FLAG = true; } //TEST
            }, 1500);
        }
    }
}


function isDrawingSchema(e) {  //console.warn("coordStrokes", coordStrokes); //TEST
    const cursorPosinCanvas = getCursorPositionOnCanvas(e); //console.log(">> cursorPosinCanvas", cursorPosinCanvas, dotCoord); //TEST
    // Ajout cordonnées du curseur sur fin dernier segment du schema
    coordStrokes[coordStrokes.length - 1].end = { x: cursorPosinCanvas.x, y: cursorPosinCanvas.y };
    refreshCanvas();
    draw();
}

async function stopDrawingSchema(e) {  //console.log("event >>>>", e?.type); //TEST
    console.log("%cO - Passage dans 'stopDrawingSchema' => DEBUT", 'color: red; font-size: larger'); //TEST
    if(captureDots.length) { // Si tracé existe
        // Suppression evenement sinon continue à dessiner quand souris bouge
        container.removeEventListener('mousemove', isDrawingSchema);
    
        // Mise à jour tracé
        //console.log("Je suis dans 'stopDrawingCanvas'", coordStrokes); //TEST
        coordStrokes.pop(); // Retrait dernier trait
        refreshCanvas(); // Suppression dernier dessin en cours
        draw(); // Nouveau dessin sans le dernier segment

        // Mise à jour infos à afficher
        setComplementaryInfos(e?.type);

        // Désactivation du click sur container qui arrete le dessin pendant l'anim du tracé
        container.removeEventListener('click', stopDrawingSchema);  
        //console.warn("%cO - Passage dans 'stopDrawingSchema' => removeEventListener('click', stopDrawingSchema)", 'color: red; font-size: 10px'); //TEST
        dots?.forEach(d => d.removeEventListener('mouseover', handlePointHover));

        // Check si schéma bon ou pas pour coloration tracé ensuite
        const isSchemaValid = checkSchemaValidity();
        await coloredSignalOnSchemaAnimation(isSchemaValid); 
        //console.log(">>> Après la methode de coloration du trait <<<", (isSchemaValid)); //TEST : Fonctionne
        
        // Si phase de création de schéma et schéma tracé est valide, alors 
        // traits et coloration restent, sinon ils disparaissent
        console.log("recordedSchema : ", recordedSchema, " | isSchemaValid : ", isSchemaValid, "(!(!recordedSchema && isSchemaValid))", (!(!recordedSchema && isSchemaValid))); //TEST
        if(!(!recordedSchema && isSchemaValid)) {
            console.log("!!!!!! Schema Enregistré ou Schema pas enr. ET pas valide !!!!!!"); //TEST
            await delayRemoveSchemaDrawing();
        }

        if(recordedSchema && isSchemaValid) {
            console.log("flip la card pour laisser apparaitre le SVG de la coche !"); //TEST
            flipSchemaCard();
        }
        console.log("%cO - Passage dans 'stopDrawingSchema' => FIN", 'color: red; font-size: larger'); //TEST
    }
}

// Renvoie un booleen pour savoir si le schéma est valide ou pas
function checkSchemaValidity() {
    let validSchema = false;
    // Check si nb saisie points est bien entre nb min et nb max 
    if(!recordedSchema) {
        if(captureDots.length < currentSchemaNbDotsMinMax.nbDotMin || captureDots.length > currentSchemaNbDotsMinMax.nbDotMax) { validSchema = false }
        if(captureDots.length >= currentSchemaNbDotsMinMax.nbDotMin && captureDots.length <= currentSchemaNbDotsMinMax.nbDotMax) { validSchema = true }
    } 
    // Check si saisie points correspond à valeur cookie
    if(recordedSchema) {
        if(isCookiePresent(nbDotsSelection)) {
            validSchema = JSON.parse(getCookieValue(`cookieShema${nbDotsSelection}`))?.combination.join(",") === captureDots.join(",") 
            ? true 
            : false;
        } else {
            console.warn(`Pas de cookie présent pour une grille de ${nbDotsSelection} points !`);
        }
    }
    return validSchema;
}

// Flash sur tracé et points pour signaler si schéma est bon ou mauvais
function coloredSignalOnSchemaAnimation(isValid) { 
    console.log("1 - Passage dans 'coloredSignalOnSchemaAnimation' => DEBUT"); //TEST
    // Coloration points
    if(typeof isValid !== 'undefined') { // Faire code plus moderne
        captureDots.forEach(cd => dots[cd].classList.add(isValid ? "valid" : "error")); // Coloration points
    }
    // Coloration traits
    const colorStroke = isValid ? colorStrokeValid : (isValid === false ? colorStrokeError : colorStrokeDefault);
    strokeStyle = colorStroke; // Coloration traits
    draw();
    //coloredSignalOnSchema(isValid); // NEW
    console.log("%cPromise: Etape 0", "background-color: yellow"); //TEST
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            strokeStyle = colorStrokeDefault;
            refreshCanvas(); draw();
            console.log("%cPromise: Etape 1", "background-color: yellow", strokeStyle); //TEST
            resolve(true);
        }, 2000); // 200 
    })
    .then((value) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                strokeStyle = colorStroke;
                refreshCanvas(); draw(); 
                console.log("%cPromise: Etape 2", "background-color: yellow", strokeStyle); //TEST
                console.log("1 - Passage dans 'coloredSignalOnSchemaAnimation' => FIN"); //TEST
                resolve(true);
            }, 1000); // 100
        })
    });

    /* V2 : Async/await */
    /* let promise = new Promise(function(resolve, reject) {
        setTimeout(() => {
            strokeStyle = "yellow";
            refreshCanvas(); draw();
            resolve(true)
        }, 2000);
    });
    await promise.then(); */
}

function coloredSignalOnSchema(isValid) {
    // Coloration points
    if(typeof isValid !== 'undefined') { // Faire code plus moderne
        captureDots.forEach(cd => dots[cd].classList.add(isValid ? "valid" : "error")); 
    }
    // Coloration traits
    const colorStroke = isValid ? colorStrokeValid : (isValid === false ? colorStrokeError : colorStrokeDefault);
    strokeStyle = colorStroke; 
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
    captureDots.forEach(cd => dots[cd].classList.remove("valid", "error"));
    strokeStyle = colorStrokeDefault;  
    
    // Réactivation click sur container qui permet d'arreter le dessin + hover sur points
    container.addEventListener('click', stopDrawingSchema);     console.warn("Dans 'removeSchemaDrawing()' => 'addEventListener('click', stopDrawingSchema)'"); console.trace();//TEST
    dots?.forEach(d => d.addEventListener('mouseover', handlePointHover));

    // Réinitialisation data points survolés
    captureDots = []; coordStrokes = [];
}

function flipSchemaCard() {
    const flipCard = document.querySelector(".flip-card");
    flipCard.classList.toggle("action-flip", true);
    animateSVGcheck();
    setTimeout(() => {
        flipCard.classList.toggle("action-flip", false);
        //setTimeout(() => goBackToStartStep(), 2000);
    }, 3000);
}

function setVarElementsOfSVGcheck() {
    svgDoc = SVGiconCheckObj.contentDocument;
    svgCheckIconCircle = svgDoc.querySelector("#circleCheckIcon");
    svgCheckIconSmallLine = svgDoc.querySelector("#smallLineCheckIcon");
    svgCheckIconBigLine = svgDoc.querySelector("#bigLineCheckIcon");
}

function animateSVGcheck() {
    // Clone pour réinitialiser à chaque fois l'anim
    if (svgDoc) {
       cloneAndBeginSVGAnimation(svgCheckIconCircle, svgDoc.getElementById("animCircleCheckIcon"), true);
       cloneAndBeginSVGAnimation(svgCheckIconSmallLine, svgDoc.getElementById("animSmallLineCheckIcon"));
       cloneAndBeginSVGAnimation(svgCheckIconBigLine, svgDoc.querySelector("#bigLineCheckIcon > animate"));
    }
}
function cloneAndBeginSVGAnimation(svgTag, svgTagAnimation, beginElem = false) {
    if (svgTagAnimation && typeof svgTagAnimation.beginElement === 'function') {
        const cloneTagAnimate = svgTagAnimation.cloneNode(false);
        svgTag.replaceChild(cloneTagAnimate, svgTagAnimation);
        //delayTransitionFlippingCard = parseInt(delayTransitionFlippingCard) - 0.1;
        if(beginElem) cloneTagAnimate.beginElementAt(delayTransitionFlippingCard);
    }
}

// Pour établir la couleur de l'icône SVG check
function setColorToSVGcheck() {
    if (svgDoc) {
        [svgCheckIconCircle, svgCheckIconSmallLine, svgCheckIconBigLine].forEach(el => 
            el.setAttribute("stroke", colorStrokeValid)
        );
    }
};


// Phase Création de schéma : Gestion des clics de boutons pour valider/refaire le schéma 
function handleValidationButtonEvents() {
    msg.addEventListener("click", (e) => {
        const targetId = e.target.id;
        // Bouton "Refaire le schéma"
        if(targetId === idButtonInvalidationSchema) {
            container.classList.add("vibrate");
            strokeStyle = "red"; // Coloration traits
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
            gridPoints.classList.add("pulse");
            gridPoints.addEventListener("animationend", () => {
                gridPoints.classList.remove("pulse");
                container.classList.add("shrink");
                setCookie(nbDotsSelection, captureDots); // Création cookie

                console.log("%cFIN DE L'ANIMATION et creation cookie", "background-color: purple; color: yellow; font-style: italic"); //TEST
                //gridPoints.removeEventListener("animationend", () => {});
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
            msg.querySelectorAll("button").forEach(b => b.disabled = true);
        }
    });
}

// On revient à l'étape initiale: Liste déroulante positionnée par défaut au lieu de la page sans afficher quoi que ce soit d'autre
function goBackToStartStep() {
    selectNbPoints.options[0].selected = true;
    selectNbPoints.dispatchEvent(new Event('change'));
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
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}


function deleteRecordSchema() {
    deleteCookie(nbDotsSelection);
    goBackToStartStep();
    linkDeleteSchema.classList.remove("display"); // Lien "Supprimer le schéma enregistré" qui disparait
}

// NOTE : Faire une class cookie qui regroupe ttes les méthodes
// Set cookie pour savoir si schema déjà fait ou pas
function setCookie(gridSize, combination) {  
    console.log("%cDans 'setCookie' => gridSize: ","background-color: green; color: white", gridSize, " | combination: ", combination); //TEST
    const data = { gridSize, combination };
    const durationCookieInSec = 60*60*24*30;
    const cookie = `cookieShema${gridSize}=${JSON.stringify(data)}; max-age=${durationCookieInSec}; path=/`; // Voir aussi avec les parametres 'sameSite', 'lax', 'strict', 'secure',...
    document.cookie = cookie;
}
function getCookie(selectedGridNbDots) {
    console.log(document.cookie); //TEST
    //return 
}  // DOit-on garder cette fonction ?
function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}
function isCookiePresent(nbDots) {
    //console.log(document.cookie); //TEST
    if(!document.cookie) {
        return !!document.cookie;
    } else {
        let data = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`cookieShema${nbDots}=`))
            ?.split("=")[1];
        return !!data ? (JSON.parse(data).gridSize == nbDots) : !!data;
    }
}
function deleteCookie(nbDots) {
    document.cookie = `cookieShema${nbDots}=;max-age=0; path=/`;
}

function displayComplementaryInfos(pm) {     //console.log(pm, pm.className, "!!pm.className => ", !!pm.className, pm.anim); //TEST
    const flagAnimation = !!pm.anim;  
    if(flagAnimation) {
        msg.setAttribute("class", msgClasses.default); // Réinitialisation classes
        msg.classList.toggle(msgClasses.animation, true);
        setTimeout(() => { msg.innerHTML = pm.text }, animationMsg / 2);
        if(!!pm.className) msg.classList.toggle(pm.className, true);
        setTimeout(() => { msg.classList.toggle(msgClasses.animation, false) }, animationMsg);
    } else {
        msg.innerHTML = pm.text; 
    }
}

///// Partie originelle Canvas /////
let boundingCanvas = null;
    
function getCursorPositionOnCanvas(e) {
    // Get position cursor
    const {clientX, clientY} = e;

    //console.log("clientX: ", clientX, "clientY: ", clientY, "cursorPosinCanvas.x:", clientX - boundingCanvas.left, "cursorPosinCanvas.y: ", clientY - boundingCanvas.top); //TEST

    // Get position from the origin of canvas
    return cursorPosinCanvas = { 
        x: clientX - boundingCanvas.left, 
        y: clientY - boundingCanvas.top 
    }
}

// debounce function
function debounce(func, delay = 300) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Set size to canvas in px according to ".container" element
function canvasSizeCalculation() {
    //console.log("container.getBoundingClientRect()", container.getBoundingClientRect()); //TEST
    canvas.width = canvas.height = container.getBoundingClientRect().width;

    boundingCanvas = canvas.getBoundingClientRect();
    //console.warn("boundingCanvas => ", boundingCanvas); //TEST
}

function getDotsCoord() {
    dotsCoord = [];
    const dots = document.querySelectorAll("[id^='point_']");
    // Calcul centre d'un element du DOM ".point'"
    const DotDistanceCenter = dots[0].getBoundingClientRect().width / 2;

    dots.forEach((dot, i) => {
        const boundingDot = dot.getBoundingClientRect();
        dotsCoord.push({
            "top": boundingDot.top - boundingCanvas.top + DotDistanceCenter,
            "left": boundingDot.left - boundingCanvas.left + DotDistanceCenter
        });
    })
    console.log("dotsCoord: ", dotsCoord); //TEST
}

/* const isTouchSreen = window.matchMedia("(pointer:coarse)").matches;
if (!isTouchSreen) { */
function init() {
    canvasSizeCalculation();
    getDotsCoord();
}

function initGridForSchema() {
    init();
    window.addEventListener(
      "resize",
      debounce(() => init(), 500)
    );

    dots = gridPoints.querySelectorAll(".point");
    dots.forEach(d => d.addEventListener('mouseover', handlePointHover));
    container.addEventListener('click', stopDrawingSchema); console.log("Appel 'stopDrawingSchema' dans 'initGridForSchema()'");//TEST
}


function removeGridForSchema() {
    refreshCanvas();

    // Suppression évènements
    dots?.forEach(d => d.removeEventListener('mouseover', handlePointHover));
    container.removeEventListener('mousemove', isDrawingSchema);

    container.removeEventListener('click', stopDrawingSchema); //TEST

    coordStrokes = [];
    captureDots = [];

    window.removeEventListener(
        "resize",
        debounce(() => init(), 500)
    );

    strokeStyle = colorStrokeDefault; // Trait shéma avec couleur par défaut
}
  
//}