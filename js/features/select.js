import { state as s, reactiveState as rs } from "../state.js";
import { DOTS_SCHEMA_CONFIGS, MSG_LABELS, SELECT_OPTIONS } from "../constants.js";
import { displaySquaresOnSelectChange } from "./background.js";
import { isCookiePresent } from "./cookie.js";
import { displayLinkDeleteRecordSchema } from "./linkDeleteSchema.js";
import { initGrid } from "./grid.js";
import { displayComplementaryInfos, removeComplementaryInfos } from "./message.js";

import { resetGrid } from "./grid.js";

const selectNbPoints = document.querySelector("#select-nb-points");

export function selectInit() {
    DOTS_SCHEMA_CONFIGS.map(n => {
        const nb = n.nbDotPerLC * n.nbDotPerLC;
        selectNbPoints.innerHTML += `<option value="${nb}">${SELECT_OPTIONS(nb, n.nbDotMin, n.nbDotMax)}</option>`;
    })
}


// Quand sélection liste déroulante...
selectNbPoints.addEventListener('change', () => {
    s.nbDotsSelection = parseInt(selectNbPoints.value);  
    displaySquaresOnSelectChange(s.nbDotsSelection); //Squares background qui disparaissent/reapparaissent
    resetGrid(); // Réinitialisation

    s.strokeController.abortController?.abort(); // Option avec interruption IMMEDIATE de l'animation sur le Flash de couleur sur le tracé du schéma s'il est présent

    /* TEST pour var. réactive: Fonctionne! */rs.isSelectOpen = Number.isInteger(s.nbDotsSelection) ? true : false; 

    if(Number.isInteger(s.nbDotsSelection)) {
        s.recordedSchema = isCookiePresent(s.nbDotsSelection); // Test présence cookie
        displayLinkDeleteRecordSchema(s.recordedSchema); // Pour faire aparaitre ou non le lien de suppression du schéma enregistré
        
        getCurrentGridConfig();
        // displayComplementaryInfos({text: `${s.recordedSchema ? MSG_LABELS.draw : MSG_LABELS.creation}`}); // Message sous le select
        initGrid();
    } else {
        displayLinkDeleteRecordSchema(false);
        //removeComplementaryInfos();
    }
});

// On revient à l'étape initiale: Liste déroulante positionnée par défaut au lieu de la page sans afficher quoi que ce soit d'autre
export function goBackToStartStep() {
    selectNbPoints.options[0].selected = true;
    selectNbPoints.dispatchEvent(new Event('change'));
}

function getCurrentGridConfig() {
    s.currentSchemaNbDotsMinMax = !s.recordedSchema ? DOTS_SCHEMA_CONFIGS.find(d => (d.nbDotPerLC * d.nbDotPerLC) === s.nbDotsSelection) : {};
}