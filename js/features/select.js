import { state as s, reactiveState as rs } from "../state.js";
import { DOTS_SCHEMA_CONFIGS, MSG_LABELS, SELECT_OPTIONS } from "../constants.js";
import { displaySquaresOnSelectChange } from "./background.js";
// import { displayComplementaryInfos, removeComplementaryInfos } from "./message.js";


const selectNbDots = document.querySelector("#select-nb-points");
let linkDeleteSchemaModule, gridModule, cookieModule = null;

export function selectInit() {
    DOTS_SCHEMA_CONFIGS.map(n => {
        const nb = n.nbDotPerLC * n.nbDotPerLC;
        selectNbDots.innerHTML += `<option value="${nb}">${SELECT_OPTIONS(nb, n.nbDotMin, n.nbDotMax)}</option>`;
    })
}

// Quand sélection liste déroulante...
selectNbDots.addEventListener('change', onChangeSelectNbDots);

async function onChangeSelectNbDots() {
    // Import dynamique des modules : Ne sont chargés que quand une 1ere selection est faite
    if(!cookieModule) cookieModule = await import("./cookie.js");
    if(!gridModule) gridModule = await import("./grid.js");
    if(!linkDeleteSchemaModule) linkDeleteSchemaModule = await import("./linkDeleteSchema.js");

    s.selectedValueNbDots = parseInt(selectNbDots.value);  
    displaySquaresOnSelectChange(s.selectedValueNbDots); //Squares background qui disparaissent/reapparaissent
    gridModule.resetGrid(); // Réinitialisation

    s.strokeController.abortController?.abort(); // Option avec interruption IMMEDIATE de l'animation sur le Flash de couleur sur le tracé du schéma s'il est présent

    /* TEST pour var. réactive: Fonctionne! */rs.isSelectOpen = Number.isInteger(s.selectedValueNbDots) ? true : false; 

    if(Number.isInteger(s.selectedValueNbDots)) {
        s.recordedSchema = cookieModule.isCookiePresent(s.selectedValueNbDots); // Test présence cookie
        linkDeleteSchemaModule.displayLink(s.recordedSchema); // Pour faire aparaitre ou non le lien de suppression du schéma enregistré
        
        getCurrentGridConfig();
        // displayComplementaryInfos({text: `${s.recordedSchema ? MSG_LABELS.draw : MSG_LABELS.creation}`}); // Message sous le select
        gridModule.initGrid();
    } else {
        linkDeleteSchemaModule.displayLink(false);
        //removeComplementaryInfos();
    }
}

// Retour à l'étape initiale: Liste déroulante positionnée par défaut
export function goBackToStartStep() {
    selectNbDots.options[0].selected = true;
    selectNbDots.dispatchEvent(new Event('change'));
}

function getCurrentGridConfig() {
    s.currentSchemaNbDotsMinMax = !s.recordedSchema ? DOTS_SCHEMA_CONFIGS.find(d => (d.nbDotPerLC * d.nbDotPerLC) === s.selectedValueNbDots) : {};
}