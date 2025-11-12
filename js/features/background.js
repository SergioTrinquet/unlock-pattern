import { SQUARE_RANGE_CLASS_NAME, SQUARE_COLUMNS, NB_SQUARES_PER_COLUMN, STRIKE_PATTERNS_PATH } from "../constants.js";
import { createEl } from "../core/utils.js";

const pathGridFile = "../../svg/grid.svg";
const squareWrapper = document.querySelector(".squares-wrapper");
const svgMaxNbImgs = NB_SQUARES_PER_COLUMN/2;

let squareRanges = null;
let baseSvg = null;

export function displaySquaresOnSelectChange(nbDotsSelection) {
    squareWrapper.classList.toggle("fade-in", !Number.isInteger(nbDotsSelection));
    squareRanges.forEach(el => el.classList.toggle("hidden", Number.isInteger(nbDotsSelection)));
}

export async function backgroundSquaresInit() {
    baseSvg = await loadGridSvg(pathGridFile);

    // Création des carrés de fond
    SQUARE_COLUMNS.forEach((el, i) => {
        const cs = createColumnSquares(el, i);
        if (cs == null) return; // Utile ??
        //square.style.setProperty("--square-size", `${(i + 1) * 10}rem`);
        squareWrapper.append(cs);
    });

    squareRanges = squareWrapper.querySelectorAll(`.${SQUARE_RANGE_CLASS_NAME}`);
}

async function loadGridSvg(url) {
  const text = await fetch(url).then(r => r.text());
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  return doc.documentElement; // <svg>
}

function createColumnSquares(classes, idxColumn) {
    let svgIdx = 0;
    const squareRange = createEl("div", {className: `${SQUARE_RANGE_CLASS_NAME} ${classes.direction} ${classes.speed}`});
    for(let i = 0; i < NB_SQUARES_PER_COLUMN; i++) {
        svgIdx = i%svgMaxNbImgs;
        const square = createEl("div");
        // const square = createEl("div", { id: `svg_${svgIdx}`, innerText: (i >= svgMaxNbImgs ? svgIdx + "_bis" : svgIdx) }); // POUR PHASE DE DEV
        displayPattern(square, svgIdx, idxColumn);
        squareRange.append(square);
    }
    return squareRange;
}

async function displayPattern(square, idxSvg, idxColumn) {
    if(!baseSvg) return;
    // Alternance dans patterns 0-4 et 5-9
    if(!!(idxColumn % 2)) idxSvg += svgMaxNbImgs;
    
    const clone = baseSvg.cloneNode(true);

    // Ajout du tracé spécifique
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "seg");
    path.setAttribute("d", STRIKE_PATTERNS_PATH[idxSvg]);
    clone.appendChild(path);

    square.appendChild(clone);
}