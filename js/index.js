/* Traits qui apparaissent quand click sur la zone 'container' */

let listePoints = [];
let capturePoints = [];

const nbPointsPerLign = [
    { nbptsperLC: 3, nbptmin: 5, nbptmax: 8 }, 
    { nbptsperLC: 4, nbptmin: 6, nbptmax: 12 }
];
const selectNbPoints = document.querySelector("#select-nb-points");
//const container = document.querySelector(".container");
const gridPoints = document.querySelector(".grid-points");

const msg = document.querySelector(".msg"),
    resteMsg = " votre shéma de dévérouillage",
    msgCreation = "Créez",
    msgDessin = "Déssinez";

let nbptmin = null;
let nbptmax = null;
// Alimentation du select
nbPointsPerLign.map(n => {
    const nb = n.nbptsperLC * n.nbptsperLC;
    nbptmin = n.nbptmin;
    nbptmax = n.nbptmax;
    selectNbPoints.innerHTML += `<option value="${nb}">${nb} points (shéma entre ${nbptmin} et ${nbptmax} points)</option>`;
})

const root = document.documentElement;
const computedStyles = getComputedStyle(root);
const transitionTime = computedStyles.getPropertyValue("--transition-time");


// Quand sélection liste déroulante...
selectNbPoints.addEventListener('change', () => {
    const nbPointsSelection = parseInt(selectNbPoints.value);

    // Réinitialisation
    gridPoints.querySelectorAll("div:has(.point)").forEach(p => p.remove());

    if(typeof nbPointsSelection === "number") {

        // Affectation var CSS pour positionnement grille de points
        root.style.setProperty('--nb-points-par-lgn-col', Math.sqrt(nbPointsSelection));

        // Message sous le select
        msg.innerText = `${msgCreation}${resteMsg}`;
        //msg.classList.remove("hidden");

        // Intégration nb de points sélectionné dans le DOM
        for(var i = 0; i < nbPointsSelection; i++) {
            const dot = createDot(i);
            // Gestion hover sur point
            dot.addEventListener('mouseover', handlePointHover);
        }

        //initSchema
        setTimeout(initSchema, transitionTime); // Added

    } else {
        removeInitSchema(); // Added
    }
});

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

let drawingStarted = false;
function handlePointHover(e) {
    //onsole.log("drawingStarted AVANT", drawingStarted.toString()); //TEST
    drawingStarted = !drawingStarted;
    //console.log("drawingStarted APRES", drawingStarted.toString()); //TEST
    // Identification du point est survolé
    const idPoint = e.target.getAttribute('data-num');
    if(drawingStarted) {
        // On commence le dession du trait
        drawLine(e);
    } else {
        // On arrete le dessin du trait
    }

    if(!capturePoints.includes(idPoint)) {
        capturePoints.push(idPoint);
        // 2. Récupération des coordonnées du point
        //console.log("Coordonnées du point: ", e.pageX, e.pageY); //TEST 
    }
    console.log("Coordonnées du point: ", e.pageX, e.pageY); //TEST
}





///// Partie originelle Canvas /////
const container = document.querySelector(".container");
const canvas = document.querySelector("#zone-canvas");
const ctx = canvas.getContext("2d");

let nbClick = 0;

let boundingCanvas,
    initialCursorPosinCanvas = null;

let strokeStarted = false; //
    
container.addEventListener('click', (e) => {
    nbClick++;
    if(nbClick == 1) {
        const cursorPosinCanvas = getCursorPositionOnCanvas(e);
        initialCursorPosinCanvas = {
            x: cursorPosinCanvas.x, 
            y: cursorPosinCanvas.y 
        };
        container.addEventListener('mousemove', drawLine);
    }
    if(nbClick == 2) {
        container.removeEventListener('mousemove', drawLine);
        nbClick = 0;
    }
})


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

function drawLine(e) {
    const cursorPosinCanvas = getCursorPositionOnCanvas(e);

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Pour repartir avec un canvas vierge de tout trait
    ctx.beginPath();
    ctx.moveTo(initialCursorPosinCanvas.x, initialCursorPosinCanvas.y); 
    ctx.lineTo(cursorPosinCanvas.x, cursorPosinCanvas.y);
    ctx.strokeStyle = computedStyles.getPropertyValue("--color-stroke");
    ctx.lineWidth = computedStyles.getPropertyValue("--width-stroke");
    ctx.stroke();
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
    console.log("container.getBoundingClientRect()", container.getBoundingClientRect()); //TEST
    canvas.width = canvas.height = container.getBoundingClientRect().width;

    boundingCanvas = canvas.getBoundingClientRect();
    console.warn("boundingCanvas => ", boundingCanvas); //TEST
}

function getDotsCoord() {
    let dotsCoord = [];
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

function initSchema() {
    init();
    window.addEventListener(
      "resize",
      debounce(() => init(), 500)
    );
}
function removeInitSchema() {
    window.removeEventListener(
        "resize",
        debounce(() => init(), 500)
      );
}
  
//}