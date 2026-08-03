# Un event d'attache reste à décider (le rendu s'est réglé sans lui)

- **Origine** : 2026-08-02_20-45 — le ticket avait absorbé ce candidat comme
  *une des pistes* pour faire apparaître un élément attaché, en prévoyant qu'il
  reparte en candidat si le pipeline se réglait autrement. C'est le cas : le
  parcours élagué par frame suffit, aucun nouvel event n'a été nécessaire.
- **Constat** : le besoin d'origine, lui, est intact. La **libération** des
  emitters FX est automatique depuis `element.destroy` ; leur **liaison** reste à
  la charge de l'hôte (`FxBinder.bind`, explicite et idempotent). Et la raison
  historiquement invoquée dans le docblock — « émettre un event d'attache
  jetterait pour les éléments que le catalogue construit avant de les attacher » —
  a disparu : `Element.handle()` est silencieux sans application.
- **Coût du non-fait** : l'asymétrie se paiera dès qu'une entité apparaîtra en
  cours de partie **avec un effet déclaré** — un projectile qui laisse une traînée,
  une explosion. Elle sera montée (le pipeline le fait maintenant) mais son FX ne
  sera pas lié tant que quelqu'un n'aura pas rappelé `bind()`.
- **La décision** : ajouter `element.attach` et rendre la liaison automatique, ou
  assumer l'asymétrie en l'écrivant comme un choix.
