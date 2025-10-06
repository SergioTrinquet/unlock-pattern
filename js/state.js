import { STROKE } from "./constants.js";

export const state = {
    root: document.documentElement,
    container: document.querySelector(".container"),
    canvas: document.querySelector("canvas"),
    boundingCanvas: null,

    dots: null,
    captureDots: [],
    dotsCoord: [],
    /* dots: {
        dom: null,
        coord: [],
        idxCaptured: []
    }, */

    isTouchScreen: window.matchMedia("(pointer:coarse)").matches,

    msg: document.querySelector(".msg"),

    gridPoints: document.querySelector(".grid-points"),
    currentSchemaNbDotsMinMax: {},
    selectedValueNbDots: null,
    recordedSchema: false,

    strokeCurrentColor: STROKE.color.default,

    strokeController: {},

    // TEST : A VIRER
    EVENT_RESIZE: 0,
    // FIN TEST
}



// TEST //
import { reactive } from "./core/utils.js";
export let reactiveState = reactive(
    { 
        isSelectOpen: false,
        count: 0, 
        name: "Serge" 
    }
);


