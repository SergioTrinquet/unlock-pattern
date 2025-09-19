// Ici sont présent les variables constantes de paramétrage (ouvert à modification si besoin) + celles utilisées dans différents fichiers .js
export const DOTS_SCHEMA_CONFIGS = [
    { nbDotPerLC: 3, nbDotMin: 5, nbDotMax: 8 }, 
    { nbDotPerLC: 4, nbDotMin: 6, nbDotMax: 12 }
];
export const SELECT_OPTIONS = (nb, nbMin, nbMax) => `${nb} points (schéma entre ${nbMin} et ${nbMax} points)`;
export const DEFAULT_DEBOUNCE_DELAY = 300;
export const SQUARE_RANGE_CLASS_NAME = "squares-range";
export const SQUARE_COLUMNS = [
        { direction: "up", speed: "" },   
        { direction: "down", speed: "" },
        { direction: "up", speed: "slow" },
        { direction: "down", speed: "slow" }
    ];
export const MSG_LABELS = {
    creation: "Créez votre schéma de déverrouillage",
    draw: "Dessinez le schéma de déverrouillage",
    valid: "Schéma valide",
    invalid: "Schéma invalide",
    notEnoughPoints: ": Pas assez de points !",
    maxPointsReached: "Nombre de points max. atteint"
};
export const MSG_CSS_CLASS = { 
    default: 'msg', 
    options: ['valid', 'invalid'], 
    animation: 'anim-up'
};
export const ID_BUTTON_DRAW_SCHEMA = {
    invalidate: "btInvalidateSchema",
    validate: "btValidateSchema"
}
export const DOT_CSS_CLASS_NAME = "point";
export const STROKES_COLORATION_SEQUENCE = [
    { color: "custom",  duration: 500 },
    { color: "default", duration: 300 },
    { color: "custom",  duration: 2000 }
]; 
export const STROKE = {
    color:{
        default: "rgb(255, 217, 217)",
        /* error: "rgb(255, 145, 145)", */ error: "rgba(255, 94, 94, 1)",
        /* valid: "rgb(145, 255, 151)" */valid: "#4dfd4dff"
    },
    width: 6,
};
