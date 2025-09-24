import { state as s } from "../state.js";
import { deleteCookie } from "./cookie.js";
import { goBackToStartStep } from "./select.js";

export const linkDeleteSchema = document.querySelector("#deleteSchema");

// Click suppression enregistrement schéma
linkDeleteSchema.addEventListener("click", deleteRecordSchema);

function deleteRecordSchema() {
    deleteCookie(s.nbDotsSelection);
    goBackToStartStep();
    displayLink(false);
}

export function displayLink(val) {
  linkDeleteSchema.classList.toggle("display", val);
}

/* import { reactiveState } from "../state.js";
// console.log("reactiveState >>>>>>>>>", reactiveState); //TEST
reactiveState.watch("isSelectOpen", newVal => {
  console.log("isSelectOpen a changé :", newVal, s.recordedSchema); // TEST
  linkDeleteSchema.classList.toggle("display", s.recordedSchema && newVal); // Pour faire aparaitre ou non le lien de suppression du schéma enregistré
}); */


