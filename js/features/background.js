import { SQUARE_RANGE_CLASS_NAME, SQUARE_COLUMNS } from "../constants.js";
import { createEl } from "../core/utils.js";

const pathGridFile = "../../svg/grid.svg";
const squareWrapper = document.querySelector(".squares-wrapper");
const it = 10;
const svgMaxNbImgs = it/2;
// Tracés (chaque entrée = un schéma différent)
const patterns = [
  "M40 40 L100 40 L100 100 L100 160 L160 160",
  "M160 100 L160 40 L100 100 L40 100 L40 160",
  "M100 160 L160 160 L160 100 L100 100 L100 40 L160 40",
  "M40 40 L40 100 L100 100 L160 100 L160 160",
  "M40 160 L100 100 L160 100 L160 40 L100 40",
  "M160 40 L160 100 L100 100 L100 160 L40 160",
  "M40 160 L100 160 L100 100 L100 40 L40 40",
  "M160 40 L160 100 L100 160 L40 100 L40 40",
  "M40 40 L100 100 L160 160 L100 160 L40 160",
  "M160 40 L100 100 L40 160 L100 160 L160 160"
];
let squareRanges = null;
let baseSvg = null;

function createColumnSquares(classes, idxColumn) {
    let svgIdx = 0;
    const squareRange = createEl("div", {className: `${SQUARE_RANGE_CLASS_NAME} ${classes.direction} ${classes.speed}`});
    for(let i = 0; i < it; i++) {
        svgIdx = i%svgMaxNbImgs;
        const square = createEl("div");
        // const square = createEl("div", { id: `svg_${svgIdx}`, innerText: (i >= svgMaxNbImgs ? svgIdx + "_bis" : svgIdx) }); // POUR PHASE DE DEV
        displayPattern(square, svgIdx, idxColumn);
        squareRange.append(square);
    }
    return squareRange;
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

export function displaySquaresOnSelectChange(nbDotsSelection) {
    squareWrapper.classList.toggle("fade-in", !Number.isInteger(nbDotsSelection));
    squareRanges.forEach(el => el.classList.toggle("hidden", Number.isInteger(nbDotsSelection)));
}

async function loadGridSvg(url) {
  const text = await fetch(url).then(r => r.text());
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  return doc.documentElement; // <svg>
}

async function displayPattern(square, idxSvg, idxColumn) {
    if(!baseSvg) return;
    // Alternance dans patterns 0-4 et 5-9
    if(!!(idxColumn % 2)) idxSvg += svgMaxNbImgs;
    
    const clone = baseSvg.cloneNode(true);

    // Ajout du tracé spécifique
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "seg");
    path.setAttribute("d", patterns[idxSvg]);
    clone.appendChild(path);

    square.appendChild(clone);
}