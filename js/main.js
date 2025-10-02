import { selectInit } from "./features/select.js";
import { backgroundSquaresInit } from "./features/background.js";

/* 
Liste bugs:
1 - Quand shéma de fait et que l'on resize la fenetre, les traits du shéma ne changent pas de taille 

Liste notes:
1 - Ajouter une animation sur lien "supprimer le schéma enregistré"
2 - Signifier dans le select quand un schéma est déjà enregistré
3 - Faire une animation (du genre anim 3D avec grille qui pivote sur son axe vertical) (sans remettre le select au centre!) quand on passe de grille de 9 points à grille de 16 points, et inversement
4 - Quand resize de la fenetre, il y a un delai pour le redimentionnement/repositionnement des elements qui constituent la grille (fond, points) => Voir ce que l'on peut faire!
5 - Voir si on peut colorer interface du navigateur pour ressembler au fond de l'app
*/

backgroundSquaresInit();
selectInit();



// ======= NE FONCTIONNE PAS ! ======//
// Juste pour mobile : Pour forcer le full screen et empecher la rotation de l'écran
const requestFullScreen = async () => {
let element = await document.documentElement;
let requestMethod =
    element.requestFullScreen ||
    element.webkitRequestFullScreen ||
    element.mozRequestFullScreen ||
    element.msRequestFullScreen;
    if (requestMethod) {
        requestMethod.call(element);
        return true;
    } else if (typeof window.ActiveXObject !== "undefined") {
        let wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
        wscript.SendKeys("{F11}");
        return true;
        }
    }
}
const lock = async () => {
    var myScreenOrientation = window.screen.orientation;
    myScreenOrientation.lock(myScreenOrientation.type);
    return true;
}
requestFullScreen();
lock();