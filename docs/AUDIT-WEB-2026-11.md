# Audit web Jokko Freight — 9 novembre 2026

Audit en lecture seule. Aucun déploiement, aucune donnée métier modifiée. La branche ajoute ce rapport et un correctif de langue limité à la console de ce dépôt.

Base Git auditée : `digital221/jokko-freight` @ `8bf2cf8` (Fleetbase 0.7.51). Les constats « déployé » ont été lus le 9 novembre 2026 sur les URL publiques, sans authentification et sans écriture.

## 1. Ce que contient ce dépôt

`digital221/jokko-freight` est le socle Fleetbase, pas le produit Jokko tel qu’il est servi.

| Élément | Dans ce dépôt | Servi en ligne |
|---|---|---|
| Console Ember (`console/`) | Oui, shell Fleetbase | `console.digitalfactory.sn` est ce shell **plus** le moteur `@jokko/bourse-engine`, absent de `console/package.json` |
| API Laravel (`api/`) | Squelette (config, pas les contrôleurs Fleetbase) | L’image Docker `fleetbase/fleetbase-api:latest` n’est pas construite depuis ce `api/` |
| Moteurs `packages/*` | Sous-modules vides (fleetops, core-api, iam, ledger…) | Compilés dans la console déployée |
| Site chargeur / transporteur | Non | `fret.digitalfactory.sn` (React, chunk `shipper-CXuHre0w.js`) |
| Vitrine | Non | `fleet.digitalfactory.sn` |
| Serveur métier `jokko-freight-serveur` | Non | Non résolu : l’API GitHub répond 404 |

`git log` de `main` ne contient que l’historique Fleetbase. Aucune occurrence de `bourse`, `jokko`, `TVA` ou `captcha` dans l’arbre avant ce rapport.

## 2. Où est le code réellement servi

Recherche le 9 novembre 2026, dépôts `digital221` visibles par cet audit :

- Seul dépôt au nom métier : **`digital221/jokko-freight`** (ce dépôt). Il ne contient pas `shipper-*.js`, ni `soffers`, ni `@jokko/bourse-engine`.
- `digital221/jokko-freight-serveur` : **introuvable** (404).
- `digital221/freight_management` : module Odoo de 2022, sans rapport avec ces fronts.
- Noms testés en 404 : `jokko-freight-web`, `jokko-freight-front`, `jokko-fret`, `jokko-freight-site`, `jokko-console`, `bourse-engine`, `jokko-bourse`.
- Les bundles déployés n’ont pas de `sourceMappingURL`.

**Conclusion : la source du front chargeur (`fret.digitalfactory.sn`, `assets/shipper-*.js`) et la source du moteur console `@jokko/bourse-engine` sont introuvables dans les dépôts accessibles.** Un dépôt privé hors de ce jeton resterait invisible (GitHub répond aussi 404). La console *shell* est bien ce dépôt ; la console *servie* en diverge.

## 3. Méthode

- **Prouvé** : fichier et ligne de ce dépôt, ou comportement lu dans un bundle / une réponse HTTP du 9 novembre 2026.
- **Supposé** : déduit d’un symptôme humain ou d’un contrat d’API, sans le code serveur ni une session console.

Les bundles cités : `fret.js` (`index-BWNpWqmx.js`), `shipper-CXuHre0w.js`, `carrier-DeTQxLZU.js`, `engines-dist/@jokko/bourse-engine/.../engine-beba492ec72b771fcf8726bd30a1d928.js`, `engines-dist/@fleetbase/fleetops-engine/.../engine-8af29feacc254059a8dd60c02ac3f4a5.js`.

## 4. Authentification, rôles, inscription, affiliation

### Console (ce dépôt)

- Connexion : `console/app/controllers/auth/login.js` (identité, mot de passe, `rememberMe`) et `console/app/templates/auth/login.hbs`. Aucun captcha.
- Mot de passe oublié : `auth/get-magic-reset-link` (`console/app/controllers/auth/forgot-password.js`).
- Réinitialisation : `auth/reset-password` (`console/app/controllers/auth/reset-password.js`).
- Vérification e-mail / SMS : `console/app/controllers/auth/verification.js` (`auth/verify-email`, `onboard/send-verification-sms`). Code à 6 caractères (`length > 5`).
- Inscription : bouton vers `onboard`, écran `<Onboarding::Yield>` dont le formulaire est dans `@fleetbase/ember-core` (sous-module vide). **Inscription non auditable dans l’arbre.**
- Rôles : `console/app/routes/console/admin.js` lignes 9-14 n’autorise que `currentUser.isAdmin`. Les rôles chargeur, transporteur, opérateur, chauffeur n’existent pas dans ce shell. L’isolation métier est **supposée** côté moteur bourse (`GET me` namespace `jokko/int/v1`, zones `ops` / `finance`, drapeau `supervisor`) — prouvé dans le bundle bourse, pas ici.
- Affiliation chauffeur : absente de ce dépôt. Le site déployé a des écrans flotte / équipe / invitation chauffeur (`carrier-DeTQxLZU.js`). Double rattachement et validation ne sont pas dans le web de ce dépôt.

### Site fret (déployé, source introuvable)

- Routes prouvées : `/connexion`, `/inscription`, `/transporteur/inscription`, `/mot-de-passe-oublie`.
- Jeton `Bearer` dans `localStorage` clé `jf.shipper.token`. Rôle d’interface dans `jf.role` (`shipper` par défaut) : ce n’est pas une autorisation.
- API même origine `GET/POST /jokko/v1…`, `credentials: "omit"`.
- Aucune chaîne `captcha`, `turnstile`, `hcaptcha`, `recaptcha`, `2fa`.
- Le contrat public `GET /jokko/v1/reference-data` n’a aucun champ captcha ni 2FA. `features.driver_whatsapp_login` vaut `false`.

## 5. Sécurité : captcha, 2FA, session, anti-brute-force

| Contrôle | Console (ce dépôt) | Site fret (bundle) |
|---|---|---|
| Captcha inscription / connexion / reset / OTP | Absent des gabarits `auth/*` | Absent du bundle |
| 2FA | Présente, facultative | Absente |
| Obligatoire pour admin / opérateur | Non | Sans objet |
| Anti-brute-force | Compteur navigateur seulement | Le client sait afficher un HTTP 429 ; le quota réel est **supposé** |

Détail console, prouvé :

- `failedAttempts` (`login.js` vers les lignes 70 et 133) n’est pas envoyé au serveur. Après 3 échecs, `login.hbs` propose seulement « mot de passe oublié ». Recharger la page remet le compteur à zéro.
- 2FA : `console/app/utils/get-two-fa-methods.js` n’offre que SMS et e-mail. L’application d’authentification est commentée (lignes 4-8).
- Le forçage est un interrupteur global « Require Users to Set-Up 2FA » (`console/app/components/two-fa-settings.hbs` lignes 8-12), pas une règle par rôle. L’alerte `two-fa-enforcement-alert.js` ne bloque pas la navigation.
- Le renvoi du code est toujours cliquable (`console/app/templates/auth/two-fa.hbs` vers la ligne 42), sans délai côté client.
- Session Laravel : `api/config/session.php` durée 120 minutes (ligne 34), chiffrement désactivé (ligne 49), cookie `secure` selon l’environnement (ligne 171). `api/config/sanctum.php` ligne 47 : `expiration` à `null` (jeton d’API sans échéance **si** cette config est celle qui tourne — l’image Docker publiée ne rebuild pas `api/`).
- `api/app/Http/Kernel.php` lignes 42-44 : le groupe `api` n’a pas de `throttle`. Le seul quota du fichier `api/config/auth.php` (ligne 94) concerne le courtier de reset (60 secondes). Le quota réel de connexion est dans `core-api`, sous-module vide : **supposé absent de ce dépôt, non prouvé en production**.
- `docker-compose.yml` ligne 20 : `MYSQL_ALLOW_EMPTY_PASSWORD` et port 3306 publié. C’est le compose de développement documenté, pas la preuve du déploiement `digitalfactory.sn`.

Point d’intégration quand le serveur exposera un captcha gratuit configurable en base et une 2FA :

1. `GET` public (ou champ de `reference-data`) : fournisseur, clé de site, parcours concernés. Pas de clé secrète dans le navigateur.
2. Console : jeton captcha sur `login`, `forgot-password`, `reset-password`, `verification`, `two-fa` (vérifier et renvoyer), et sur l’onboarding ember-core.
3. Site : le même jeton dans la fonction `V()` de `fret.js` (seul client HTTP), sur connexion, inscription chargeur, inscription transporteur, mot de passe oublié, renvoi de code.
4. 2FA console : rendre le forçage non désactivable pour admin et opérateur ; ne plus se contenter du booléen global. Le serveur doit refuser la session si le second facteur manque. Le web ne fait qu’afficher l’étape.
5. La vérification du captcha et le compteur d’échecs restent serveur. Le `failedAttempts` local ne suffit pas.

## 6. Création de fret, géoloc, Publier, bourse, temps réel

### Site (déployé)

- Route `/frets/nouveau`, textes `sform.publish` = « Publier le fret », `sform.saveDraft` = « Enregistrer le brouillon ». **Prouvé** dans `fret.js`.
- Carte : chaînes `map.attribution` (OpenStreetMap), `map.noGeolocation`, `map.notFound` (« touchez la carte »). Pas de Leaflet ni de `navigator.geolocation` dans le bundle principal ; le détail du composant carte est dans le chunk chargeur, qui affiche l’offre mais le formulaire de publication n’a pas été réouvert ligne à ligne. **Présence d’une carte avec géolocalisation : prouvée par les textes. Branchement exact sur le bouton Publier : fortement étayé, pas retracé appel par appel.**
- Offres reçues : `shipper-CXuHre0w.js`, fonction `Ht`, `GET /shipper/freights/:id/offers`. Tant que le fret est `open`, rechargement toutes les **60 secondes** (`Mt = 6e4`). Pas de WebSocket ni d’`EventSource` dans `fret.js`. Les notifications générales sont aussi en poll 60 s (`vr = 6e4`).
- La liste d’offres est rendue dans l’ordre de l’API (`t.map`), **sans tri par prix**, sans filtre type chauffeur / compagnie, sans note minimale, sans filtre de profil. Aucun `1000` dans le bundle. La liste des frets du tableau de bord est plafonnée à **50** (`us = 50`).
- **Capacité « jusqu’à 1000 offres, tri meilleur prix, filtres » : manquante côté web. Prouvé.**

### Console

- Le bouton Fleetbase « Créer une commande » (permission `fleet-ops create order`, route `operations.orders.index.new`, icône avion en papier) est **annulé** par le moteur bourse. Preuve dans le bundle : `operations.orders.index.new` → `console.bourse.freights`, et `routeWillChange` fait `abort()` puis `replaceWith`. La cible est la **liste**, pas un formulaire. Cela correspond au clic observé vers `/bourse/freights`.
- Le moteur n’a pas de route `freights/new` ni de libellé « Publier ». La création chargeur n’est pas dans la console.
- Temps réel des offres en console : canal de notification nommé `realtime` dans un filtre, deux mentions de socketcluster (alias Ember). Pas de `.subscribe(` d’offres. **Mise à jour temps réel des offres : non prouvée ; le site, lui, poll à 60 s.**
- Lenteur observée (`/bourse` ~7,3 s puis 3,7–5,4 s) : **constat humain, non remesuré ici.** Le premier chargement tire le shell, Fleetops (~4,7 Mo) et la bourse (~865 ko). Cause précise non isolée. **Supposé : coût du premier chargement des moteurs, pas un défaut de ce dépôt seul.**

## 7. JK166, exceptions, codes anglais

### JK166 (constat console, 9 novembre)

Gabarit bourse, fiche fret : « Transporteur retenu » affiche `freight.carrier.name`, sinon « — ». **Prouvé.** Si l’attribution est tombée (paiement non reçu) et que `freight.carrier` est vidé, le tiret est le comportement du gabarit, même si le journal a encore « Offre acceptée · Chargeur » et qu’un séquestre existe.

Le statut d’offre en console passe par `labelOf` sur la liste `pending | accepted | rejected | withdrawn | expired | lapsed`. Il n’y a pas de statut `not_selected`. Une offre au statut `rejected` se traduit, si la clé existe, par un refus. Le site chargeur, lui, affiche tel quel `offer.status_label` dès que l’offre n’est plus `pending` (`shipper.js`, composant `qt`). Si l’API envoie « Refusée », l’écran affiche « Refusée ».

La caducité pour paiement non reçu n’a pas de bloc dédié sur la fiche. Le journal est un onglet (`sections` inclut `journal`) et les événements passent par `eventLabel` : clé `bourse.labels.event.<code>` si elle existe, sinon anglais humanisé (`exception_resolved` → « Exception resolved »). **Prouvé dans le bundle. Le contenu exact du journal de JK166 n’a pas été relu (pas de session).**

### Non-sélection et remerciement

- Avant d’accepter, le dialogue chargeur dit « Les N autres offres en attente ne seront pas retenues » (`soffers.others.*`). C’est une phrase de confirmation, pas le statut affiché ensuite.
- Le filtre transporteur regroupe `rejected,not_selected` sous le libellé « Non retenues » (`offers.f.rejected`). La ligne, elle, utilise `status_label` (`feed.myOffer` = « Mon offre : {status} »).
- Aucune chaîne « remerciement », « merci » de non-sélection, ni événement `not_selected` dans les bundles console ou chargeur. **La notification de non-sélection avec remerciement tracée au journal : absente du web audité. Prouvé comme absence. L’envoi serveur : non vérifié.**

### Exceptions 19 contre 18

- Le tableau de bord affiche le nombre `board.today.exceptions` renvoyé par l’API (`bourse.kpis.today.exceptions`).
- La page charge `GET exceptions` pour la file, et `GET exceptions?view=resolved` à part. Vues : `open`, `mine`, `resolved`.
- **Prouvé : deux sources.** Le décalage d’une exception résolue le 7 novembre encore dans le KPI est **supposé** côté agrégat serveur : le web n’additionne pas lui-même les lignes.

### Codes anglais bruts

`paid_out`, `settled`, `accept_price`, `Exception resolved`, `test_mode` :

- `paid_out` et `settled` sont dans `FREIGHT_STATUSES` et devraient passer par `bourse.labels.freight-status.*`. Ces traductions **n’étaient pas** dans les bundles du 9 novembre.
- `accept_price` n’est pas dans `OFFER_KINDS` (`bid`, `accept`, `counter` seulement). `labelOf` renvoie alors la chaîne brute.
- `eventLabel` fabrique « Exception resolved » quand la traduction manque.
- `test_mode` est le libellé de secours du bandeau `bourse.notifications.test-mode` s’il n’est pas traduit, ou le code de canal affiché tel quel.

## 8. Profil avant choix, enchère, avis

Carte d’offre chargeur (`qt` dans `shipper-CXuHre0w.js`), avant acceptation, **sans lien vers une fiche** :

- nom ;
- badge « Vérifié » si `carrier.badge === "certified"`, sinon mention « en cours de vérification » ;
- moyenne et **nombre** d’avis, pas les textes ;
- nombre de missions réussies, pas l’historique ;
- le camion de l’offre (type, charge utile), pas la flotte.

Après livraison seulement : `POST /shipper/freights/:id/rating` (1 à 5 étoiles, commentaire facultatif, 500 caractères). Cela enregistre une note ; cela ne laisse pas lire les avis des autres avant de choisir.

Console : moyenne du **chargeur** (`shipper.rating_avg / 5` et le nombre). Aucune page d’avis, aucune action masquer / retirer. Les écrans `bourse.vehicles.review.*` jugent les photos et le profil des camions (KYC véhicule), pas les notes de service. **Modération des avis : absente. Prouvé.**

## 9. KYC, double validation, devis, factures, TVA

- Console bourse : file KYC, approbation, rejet, révocation, suspension (`bourse.kyc.dossier.approve` et voisins). **Une** action d’approbation. Pas de second valideur distinct dans les clés. Double validation : **non prouvée dans le web ; supposée encore seulement serveur.**
- Le site dit que les pièces restent privées à l’équipe de vérification (`kyc.private`).
- Factures et commissions : pages console `bourse.pages.invoices`, `payouts`, `pricing` (barème par km, minimum, route, camion). Exports TVA comptables (`exports/vat.csv`). Pas de champ « 18 % local / 0 % international » dans les clés.
- Contrat public `GET /jokko/v1/reference-data` (9 novembre) : `pricing.vat_pct = 18`, `pricing.commission_pct = 6`, `currency = XOF`, `default_locale = fr`. **Un seul taux.** Pas de taux international à 0 %. **Prouvé.**
- Ce dépôt, `console/app/formats.js` lignes 16-25 : devises EUR et USD seulement. `console/app/models/user.js` formate les dates avec date-fns sans locale (`PP`, `yyyy-MM-dd`). `application.js` démarrait en `en-US` (corrigé dans cette branche pour la console). `configure/services.js` ligne 22 : `googleMapsLocale = 'us'`.

## 10. Assets, CSP, PWA, langue

- **CSS → HTML.** `console/nginx.conf` ligne 6 : `try_files $uri $uri/ /index.html`. `Caddyfile.console` ligne 16 : `try_files {path} /`. Le 9 novembre, `https://console.digitalfactory.sn/assets/@fleetbase/console.css` répond **200 `text/html`** (le `index`, 18 094 octets). Le fichier empreint `console-08e36c4b51b440fc2f0c35acd6c1eb61.css` répond bien `text/css`. Avec `X-Content-Type-Options: nosniff`, une feuille manquante est ignorée et le 404 est masqué.
- **CSP.** Absente de ce dépôt. En ligne : console en `Content-Security-Policy-Report-Only` avec `script-src 'unsafe-inline' 'unsafe-eval'` ; le site fret a une CSP **appliquée** sans `unsafe-inline`. Le report-only permissif ne bloque pas le XSS.
- **PWA fret.** `sw.js` est un désinstallateur (commentaire : le site n’est plus installable). Le JS appelle `navigator.serviceWorker.getRegistrations()` puis `unregister`. Pas de `manifest.json` (404). Il reste `<meta name="mobile-web-app-capable" content="yes">`, une icône Apple et `theme-color`. La console a `console/public/favicon/site.webmanifest` avec `"display": "standalone"` (nom Fleetbase dans le dépôt ; « JOKKO FREIGHT » en ligne).
- **Langue.** Le site déployé ignore le navigateur : `localStorage` `jf.lang`, défaut `fr`, sélecteur dans la barre (composant minifié `dr`). La console de ce dépôt forçait `en-US` via `currentUser.getOption('locale', 'en-US')` et `fallbackLocale: 'en-US'` (`console/config/ember-intl.js` ligne 17).

## 11. Correctif de cette branche (langue)

Fait **dans la console de ce dépôt** :

- Défaut `fr-fr`, y compris avant la session, **sans** lire `navigator.language`.
- Sélecteur Français / English fixé en haut à droite, donc visible sur la connexion. Choix dans `localStorage` clé `jokko.locale`.
- Clés `bourse.labels.*` et `bourse.notifications.test-mode` pour que le moteur, au prochain build qui l’embarque, trouve « Versé », « Réglé », « Non retenue », « Exception résolue », « Mode test ».
- Réécriture des nœuds de texte dont **toute** la valeur est un code non ambigu (`paid_out`, `accept_price`, `test_mode`, `not_selected`, « Exception resolved », etc.). « Refusée » n’est pas renommée : un refus explicite et une offre non retenue ne sont pas le même statut.

**Bloqué**, source hors de ce dépôt :

- Libellés du site `fret.digitalfactory.sn` (déjà en français par défaut dans le bundle servi ; toute correction de copie ou de `status_label` l’est aussi).
- Le moteur bourse qui renvoie `accept_price` sans passer par intl : la réécriture de texte ne couvre que la console une fois **ce** shell redéployé. Elle ne change pas le bundle déjà en ligne.
- Remplacer « Refusée » par « Non retenue » exigerait que l’API distingue `not_selected` de `rejected`, puis que le site et le moteur affichent ce statut. Le site imprime `status_label` tel quel.

Vérification locale : `node console/tests/node/locale-and-labels.test.mjs`. La console Ember n’a pas été construite ni ouverte dans un navigateur (pas de déploiement, dépendances Fleetbase non installées).

## 12. Tableau

| ID | Gravité | Sujet | Corrigé / à faire | Dépendance |
|---|---|---|---|---|
| W01 | P1 | Pas de captcha sur inscription, connexion, reset, OTP (console et site) | À faire | Serveur : fournisseur gratuit configurable en base. Web : jeton sur chaque parcours, clé de site lue en base |
| W02 | P1 | 2FA console facultative, SMS/e-mail seulement, pas imposée aux admin/opérateurs | À faire | Serveur refuse la session ; console : forçage par rôle |
| W03 | P1 | Anti-brute-force console limité à un compteur d’affichage | À faire | Quota serveur sur login, reset, renvoi OTP. Le groupe `api` de ce dépôt n’a pas de `throttle` |
| W04 | P1 | Jeton site dans `localStorage` ; Sanctum `expiration: null` dans ce dépôt | À faire | Serveur : échéance, cookie. Image API peut différer de `api/config/sanctum.php` |
| W05 | P1 | « Créer une commande » ouvre la liste `/bourse/freights` sans formulaire | À faire | Source `@jokko/bourse-engine` introuvable. Alias prouvé dans le bundle servi |
| W06 | P1 | Enchères : pas de tri par prix, pas de filtres type/note/profil, pas de plafond 1000 ; liste frets à 50 ; poll 60 s | À faire | Source du site chargeur introuvable + API de liste |
| W07 | P1 | Après acceptation, les autres offres suivent `status_label` (peut être « Refusée ») ; pas de « Non retenue » garanti | À faire | API : statut `not_selected` et libellé. Site : ne plus imprimer le libellé brut. Moteur : ajouter le statut |
| W08 | P1 | Pas de trace web d’une notification de non-sélection avec remerciement dans le journal | À faire | Serveur (événement + texte) et journal bourse (`eventLabel`) |
| W09 | P1 | Profil offrant incomplet avant le choix (pas d’avis rédigés, pas d’historique, pas de flotte, pas de lien) | À faire | Source du site chargeur |
| W10 | P1 | Avis : saisie après livraison, aucune modération console | À faire | API de modération + écran bourse. `vehicles.review` est le KYC camion, pas les avis |
| W11 | P1 | JK166 : transporteur retenu « — » si `freight.carrier` est vide, alors que le journal peut encore dire l’offre acceptée | À faire | Règle serveur (garder l’attributaire ou expliquer la caducité sur la fiche, pas seulement au journal) |
| W12 | P1 | Codes anglais bruts (`paid_out`, `accept_price`, `Exception resolved`, `test_mode`) | Partiel | Console de **ce** dépôt : clés et réécriture au prochain build. Site et moteur déjà déployés : bloqué, source introuvable |
| W13 | P1 | TVA : un seul `vat_pct` 18 dans `reference-data` ; pas de 0 % international | À faire | Serveur (deux taux) puis barème / facture / site. La console de ce dépôt ne connaît qu’EUR et USD |
| W14 | P2 | Console forçait `en-US`, y compris sans choix utilisateur | Corrigé ici | Ce dépôt. Le site servi est déjà en français par défaut. Redéploiement console hors de cet audit |
| W15 | P2 | KPI exceptions (`board.today.exceptions`) ≠ file `GET exceptions` (19 vs 18, une résolue le 7/11) | À faire | Agrégat serveur. Le web affiche deux sources différentes |
| W16 | P2 | `/bourse` lent (7,3 s puis 3,7–5,4 s) | À faire, cause non isolée | Mesure au prochain build ; poids Fleetops + bourse |
| W17 | P2 | CSS console manquant renvoyé en HTML 200 | À faire | `console/nginx.conf` et `Caddyfile.console` de ce dépôt, au déploiement |
| W18 | P2 | CSP console report-only avec `unsafe-inline` / `unsafe-eval` | À faire | En-tête hors de ce dépôt. Ember classique en a besoin tant qu’il n’y a pas de nonces |
| W19 | P2 | Double validation KYC non visible (un seul `approve`) | À faire | Serveur + écran bourse, source du moteur introuvable |
| W20 | P2 | Affiliation / rattachement chauffeurs absents de ce dépôt | À faire | Site `carrier-*.js` (source introuvable) et serveur |
| W21 | P2 | Rôles métier non isolés dans le shell (seul `isAdmin`) | À faire | IAM Fleetbase (sous-module vide) et `me` bourse |
| W22 | P2 | Temps réel des offres = poll 60 s, pas de socket métier | À faire | Site + serveur. Socketcluster du compose est le bus Fleetbase |
| W23 | P2 | Résidu PWA sur fret (`mobile-web-app-capable=yes`, `sw.js` encore servi) | À faire | Source du site introuvable. Le JS actuel **désinscrit** le service worker : ne pas le réenregistrer |
| W24 | P3 | Badge KYC « Vérifié » seulement ; dossier non montré au chargeur | Accepté comme limite | Texte `kyc.private` : les pièces restent à l’équipe. Pas un affichage du dossier |
| W25 | P3 | Carte et bouton Publier : textes présents sur le site, source absente d’ici | Bloqué | Dépôt du front chargeur introuvable |
| W26 | P3 | Devis / factures / commissions : écrans bourse déployés, pas dans ce dépôt | À faire là-bas | Moteur bourse + taux de W13 |
| W27 | P3 | `googleMapsLocale = 'us'`, dates date-fns sans locale fr | À faire | Ce dépôt, hors du correctif de langue de cette branche |

## 13. Hors périmètre de déploiement

Rien n’a été publié ni déployé. Le correctif de langue ne prend effet qu’après un build de **cette** console. Il ne modifie pas `fret.digitalfactory.sn` ni le moteur bourse déjà compilé.
