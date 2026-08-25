import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Transforme un libelle en cle d'URL : « Planifie » -> « planifie »,
 * « En cours » -> « en-cours ». Les accents sont retires pour que l'adresse
 * reste lisible et copiable.
 */
export const cleOnglet = (libelle) =>
  String(libelle)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "-");

/**
 * Onglet actif porte par l'URL (?tab=...).
 *
 * Le module RH inaugurait ce principe : la barre laterale pointe directement
 * sur un volet, et le lien obtenu reste partageable et rechargeable. Le hook
 * generalise ce comportement a tous les modules.
 *
 * Une cle inconnue — lien errone, onglet reserve a un autre profil — retombe
 * sur le premier onglet plutot que d'afficher une page vide.
 *
 * @param {Array<{key: string}>|Array<string>} onglets onglets disponibles
 * @param {string} [defaut] cle par defaut, sinon le premier onglet
 * @returns {[string, (cle: string) => void]}
 */
export const useOngletUrl = (onglets, defaut) => {
  const [parametres, setParametres] = useSearchParams();

  const cles = onglets.map((o) => (typeof o === "string" ? o : o.key));
  const demande = parametres.get("tab");
  const actif = cles.includes(demande) ? demande : defaut || cles[0];

  const choisir = useCallback(
    (cle) => {
      // replace : la navigation entre onglets n'encombre pas l'historique,
      // le bouton « precedent » ramene au module precedent.
      setParametres({ tab: cle }, { replace: true });
    },
    [setParametres],
  );

  return [actif, choisir];
};

export default useOngletUrl;
