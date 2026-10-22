// C · CYBER — Proxy de protection : contrôle d'accès par rôle + journal d'audit.
// Rôles du cahier des charges QueenBee (section 3.2) et principe du moindre privilège (8.2).

export const PERMISSIONS = {
  apiculteur:   ['lister'],
  coordinateur: ['lister', 'acquitter'],
  gestionnaire: ['lister', 'acquitter'],
  admin:        ['lister', 'acquitter', 'modifierSeuil', 'supprimer'],
};

// Service métier existant (NON modifiable) : il ne connaît rien des rôles
export function creerServiceAlertes() {
  const alertes = new Map([['ALR-1', { id: 'ALR-1', siteId: 'SN-CASA', statut: 'LEVÉE' }]]);
  const seuils = { 'SN-CASA': 0.5 };
  return {
    nom: 'service-alertes',
    lister: siteId => [...alertes.values()].filter(a => a.siteId === siteId),
    acquitter: id => { alertes.get(id).statut = 'PRISE_EN_CHARGE'; return alertes.get(id); },
    modifierSeuil: (siteId, kg) => { seuils[siteId] = kg; return seuils[siteId]; },
    supprimer: id => alertes.delete(id),
  };
}

// Proxy : même interface que le service, accès filtré et tracé — À VOUS
// TODO C-Cyber : renvoyer new Proxy(service, { get(cible, action) { ... } }) qui :
//   1. laisse passer les propriétés qui ne sont pas des fonctions (ex. « nom ») ;
//   2. pour une méthode, renvoie une fonction qui vérifie PERMISSIONS[utilisateur.role] ;
//   3. si l'action est interdite : ajoute { qui, role, action, at, resultat: 'REFUSÉ' } au journal
//      puis lève une Error dont le message contient « Accès refusé » ;
//   4. sinon : journalise 'AUTORISÉ' et appelle la vraie méthode ;
//   5. un rôle inconnu n'a aucun droit (moindre privilège).
export function avecControleAcces(service, utilisateur, journal = []) {
  throw new Error('TODO C-Cyber');
}
