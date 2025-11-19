// import { getComputedStyles } from "../core/utils.js";
import { STROKE } from "../constants.js";

const svgIconCheckObj = document.getElementById("iconCheckObj");
let svgDoc = null;
const svgCheck = {
        circle: null,
        smallLine: null,
        bigLine: null
    }

// Pour établir la couleur de l'icône SVG check
export function initSvg() {
    svgDoc = svgIconCheckObj.contentDocument;
    if(!svgDoc) return;

    svgCheck.circle = svgDoc.querySelector("#circleCheckIcon");
    svgCheck.smallLine = svgDoc.querySelector("#smallLineCheckIcon");
    svgCheck.bigLine = svgDoc.querySelector("#bigLineCheckIcon");

    for(const key in svgCheck) {
        if (svgCheck.hasOwnProperty(key)) { 
            svgCheck[key].setAttribute("stroke", STROKE.color.valid)
        }
    };
};

// Cloning pour réinitialiser à chaque fois l'anim
export function resetSvgAnimation() {
    const SVGanimateTags = [
        {svgTag: svgCheck.circle, svgTagAnimation: svgDoc.getElementById("animCircleCheckIcon")},  
        {svgTag: svgCheck.smallLine, svgTagAnimation: svgDoc.getElementById("animSmallLineCheckIcon")},
        {svgTag: svgCheck.bigLine, svgTagAnimation: svgDoc.querySelector("#bigLineCheckIcon > animate")}
    ];

    SVGanimateTags.forEach(i => {
        if(i.svgTagAnimation && typeof i.svgTagAnimation.beginElement === 'function') {
            const cloneTagAnimate = i.svgTagAnimation.cloneNode(false);
            i.svgTag.replaceChild(cloneTagAnimate, i.svgTagAnimation);
        }
    });
}

export function startSvgAnimation() {
    // const delayTransitionFlippingCard = getComputedStyles("--time-transition-flipping-card");
    // svgDoc.getElementById("animCircleCheckIcon")..beginElementAt(delayTransitionFlippingCard);
    svgDoc.getElementById("animCircleCheckIcon").beginElement();
};
