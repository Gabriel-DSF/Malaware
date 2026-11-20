/* =====================================================================
   MalAware · Simulation « Ransomware » (rançongiciel)
   ---------------------------------------------------------------------
   Scénario : vous choisissez d’abord votre type de sauvegarde, puis vous
   lisez vos courriels. Une fausse facture contient un document piégé.
   Si les macros sont activées, vos fichiers sont chiffrés un par un ;
   vous pouvez couper le réseau pour limiter les dégâts, puis choisir
   quoi faire face à la rançon.
   Tout est fictif : courriels, fichiers, montants, adresses.
   ===================================================================== */
(() => {
  /* ---------- Les fichiers de la victime ---------- */

  // [icône (voir ICO dans main.js), nom, emplacement]  pc = ordinateur · usb = disque branché · res = dossier réseau
  const FICHIERS = [
    ["doc", "CV_2026.pdf", "pc"],
    ["doc", "Memoire_BTS.docx", "pc"],
    ["image", "Vacances_01.jpg", "pc"],
    ["image", "Vacances_02.jpg", "pc"],
    ["tableur", "Budget_maison.xlsx", "pc"],
    ["image", "Photo_mamie.jpg", "pc"],
    ["doc", "Impots_2025.pdf", "pc"],
    ["audio", "Playlist.mp3", "pc"],
    ["archive", "Copie_Documents.zip", "usb"],
    ["archive", "Copie_Photos.zip", "usb"],
    ["image", "Photos_Noel.jpg", "res"],
    ["doc", "Recettes_famille.docx", "res"],
    ["doc", "Factures_energie.pdf", "res"],
    ["video", "Anniversaire.mp4", "res"],
  ];
  const SECTIONS = {
    pc: "Ce PC › Documents",
    usb: "Disque externe (E:) · sauvegarde toujours branchée",
    res: "Dossier partagé « Famille » (sur le réseau)",
  };

  // Indices des fichiers présents selon le type de sauvegarde
  const presents = (e) => FICHIERS.map((f, i) => i).filter((i) => FICHIERS[i][2] !== "usb" || e.sauvegarde === "branchee");

  // Une tuile de fichier. etat : "" (sain) · "x" (chiffré) · "ok" (récupéré) · "ab" (abîmé)
  const tuile = (i, etat = "", anim = false) => {
    const [type, nom] = FICHIERS[i];
    const icone = { x: "cadenas", ab: "attention" }[etat] || type;
    return `<div class="fic ${etat}${anim ? " anim" : ""}" data-f="${i}">${ico(icone)}${nom}${etat === "x" || etat === "ab" ? ".verrou" : ""}</div>`;
  };

  const majTuile = (sim, i, etat) => {
    sim.etat.etats[i] = etat;
    const t = sim.racine.querySelector(`[data-f="${i}"]`);
    if (t) t.outerHTML = tuile(i, etat, true);
  };

  const explorateur = (e, extra = "") => {
    const ids = presents(e);
    const sections = ["pc", "usb", "res"]
      .filter((s) => ids.some((i) => FICHIERS[i][2] === s))
      .map(
        (s) => `
        <div class="fx-sec" data-sec="${s}">
          <p class="fx-h"><span>${SECTIONS[s]}</span><span data-sec-st></span></p>
          <div class="fx-grid">${ids.filter((i) => FICHIERS[i][2] === s).map((i) => tuile(i, e.etats[i] || "")).join("")}</div>
        </div>`,
      )
      .join("");
    return uiFenetre("Explorateur de fichiers", sections + extra);
  };

  const nbPerdus = (e) => Object.values(e.etats).filter((s) => s === "x" || s === "ab").length;

  /* ---------- La boîte de réception ---------- */

  const MAILS = {
    ecole: {
      de: "Mme Lefèvre (Lycée)",
      adr: "c.lefevre@lycee-exemple.fr",
      heure: "08:40",
      objet: "Rappel : mémoire à rendre vendredi",
      corps: "<p>Bonjour à tous,</p><p>Le mémoire est à déposer vendredi avant 18 h sur l’espace numérique de travail. Bon courage !</p>",
    },
    facture: {
      de: "Service Comptabilité",
      adr: "relance@factures-paiement-en-ligne.xyz",
      heure: "09:12",
      objet: "RELANCE URGENTE : facture n°48213 impayée",
    },
    mamie: {
      de: "Mamie Jeanne",
      adr: "jeanne.durand@mail-exemple.fr",
      heure: "hier",
      objet: "Le repas de dimanche",
      corps: "<p>Coucou !</p><p>On mange à midi dimanche, n’oublie pas d’apporter le dessert. Bisous, Mamie</p>",
    },
  };

  const lecture = (id) => {
    const m = MAILS[id];
    if (id !== "facture")
      return `
        <p class="m-objet">${m.objet}</p>
        <p class="m-de"><b>${m.de}</b> <span>&lt;${m.adr}&gt;</span></p>
        <div class="m-corps">${m.corps}</div>`;
    return `
      <p class="m-objet">${m.objet}</p>
      <p class="m-de"><b>${m.de}</b> <span class="sus">&lt;${m.adr}&gt;</span></p>
      ${indice("L’adresse réelle de l’expéditeur ne correspond à aucune entreprise que vous connaissez.")}
      <div class="m-corps">
        <p>Cher client,</p>
        ${indice("« Cher client » : le message ne connaît même pas votre nom.")}
        <p>Sauf erreur de notre part, la facture n°48213 d’un montant de <b>389,90 €</b> reste impayée. <b>Sans règlement sous 24 heures</b>, votre dossier sera transmis à notre service contentieux.</p>
        ${indice("Urgence et menace : on veut vous faire agir sans réfléchir.")}
        ${indice("Une facture pour un achat que vous n’avez jamais fait.")}
        <p>Veuillez consulter la facture ci-jointe.</p>
      </div>
      <p class="pj sus">${ico("trombone")} Facture_48213.docm <small>48 Ko</small></p>
      ${indice("Extension <b>.docm</b> : un document qui contient des macros, c’est-à-dire du code.")}
      <div class="m-actions">
        <button class="ui-btn" type="button" data-go="doc">Ouvrir la pièce jointe</button>
        <button class="ui-btn" type="button" data-act="eviter" data-how="signale">Signaler comme hameçonnage</button>
        <button class="ui-btn" type="button" data-act="eviter" data-how="supprime">Supprimer</button>
      </div>`;
  };

  const boite = (e) => `
    <div class="ui">
      <div class="ui-bar"><span class="d"></span><span class="d"></span><span class="d"></span><span class="ui-titre">Messagerie · Boîte de réception (3)</span></div>
      <div class="m-list">${Object.entries(MAILS)
        .map(
          ([id, m]) => `
          <button class="m-item${e.lus.has(id) ? "" : " nl"}" type="button" data-act="lire" data-id="${id}">
            <span class="m-from">${m.de}</span><span class="m-h">${m.heure}</span>
            <span class="m-sub">${m.objet}</span>
          </button>`,
        )
        .join("")}</div>
      <div class="m-read" data-lecture><p class="m-vide">Sélectionnez un message pour le lire.</p></div>
    </div>`;

  /* ---------- Actions partagées ---------- */

  const eviter = (sim, b) => {
    sim.etat.evite = b.dataset.how;
    sim.aller("evite");
  };

  const restaurer = (sim) =>
    sim.aller({ aucune: "sans_sauvegarde", branchee: "sauvegarde_chiffree", horsligne: "restauration" }[sim.etat.sauvegarde]);

  const couper = (sim) => {
    const e = sim.etat,
      r = sim.racine;
    if (!e.reseau) return;
    e.reseau = false;
    const restants = FICHIERS.filter((f, i) => f[2] === "res" && e.etats[i] !== "x").length;
    e.sauvesReseau = restants;
    sim.flux("cut");
    sim.statut("eux", "Connexion coupée", "ok");
    sim.journal("[RÉSEAU] Wi-Fi coupé par l’utilisateur : plus d’accès à Internet ni au dossier partagé", "ok");
    const sec = r.querySelector('[data-sec="res"]');
    sec.classList.add("safe");
    sec.querySelector("[data-sec-st]").textContent = restants
      ? `hors d’atteinte : ${restants} fichier${restants > 1 ? "s" : ""} protégé${restants > 1 ? "s" : ""}`
      : "trop tard : déjà chiffré";
    r.querySelector("[data-wifi]").textContent = "coupé";
    r.querySelectorAll('[data-act="couper"]').forEach((x) => (x.disabled = true));
    const copie = r.querySelector("[data-copie]");
    if (copie) copie.textContent = "interrompue ✕";
    sim.choix([{ texte: "Réseau coupé ✓", style: "s", off: true }]);
  };

  /* ---------- Textes des bilans ---------- */

  const INDICES = [
    "L’adresse de l’expéditeur se terminait par <b>.xyz</b> et ne correspondait à aucune entreprise connue.",
    "« Cher client » : un message générique, qui ne connaît pas votre nom.",
    "L’urgence et la menace (« sous 24 heures », « contentieux ») pour vous faire agir vite.",
    "Une facture pour un achat que vous n’avez jamais fait.",
    "Une pièce jointe <b>.docm</b> qui demande d’« activer le contenu » : c’est lancer du code.",
  ];
  const PROTEGER = [
    "Faire des <b>sauvegardes régulières sur un support débranché</b> après chaque copie (ou un cloud qui garde l’historique des versions).",
    "Suivre la règle 3-2-1 : 3 copies, sur 2 supports différents, dont 1 hors de la maison ou du bureau.",
    "Ne jamais activer les macros d’un document reçu par courriel.",
    "Vérifier l’adresse réelle de l’expéditeur, pas seulement le nom affiché.",
    "Mettre à jour le système et les logiciels pour fermer les failles connues.",
  ];
  const REAGIR = [
    "Débrancher l’appareil d’Internet et du réseau, <b>sans payer</b> la rançon.",
    "Photographier le message de rançon et <b>porter plainte</b>.",
    "Se faire aider : <b>17cyber.gouv.fr</b> ou cybermalveillance.gouv.fr.",
    "Chercher un outil de déchiffrement gratuit sur <b>nomoreransom.org</b>.",
    "Faire nettoyer ou réinstaller l’appareil, <b>puis</b> restaurer la sauvegarde.",
  ];

  /* ---------- Les scènes ---------- */

  monterSimulation("ransomware", {
    titre: "Ransomware",
    etapes: ["Sauvegarde", "Courriel", "Chiffrement", "Rançon", "Bilan"],
    autres: '<a href="trojan.html#demo">Trojan</a> · <a href="keylogger.html#demo">Keylogger</a>',
    etatInitial: () => ({
      sauvegarde: "aucune",
      lus: new Set(),
      etats: {},
      chiffres: 0,
      reseau: true,
      sauvesReseau: 0,
      paye: false,
      restaure: false,
      evite: "",
    }),

    scenes: {
      intro: (e) => ({
        etape: 0,
        ton: "info",
        titre: "Vos fichiers sont-ils sauvegardés ?",
        texte:
          "<p>Sur votre ordinateur : votre CV, votre mémoire de BTS, vos photos de vacances… Avant de commencer la journée, choisissez comment ils sont sauvegardés. Ce choix comptera plus tard.</p>",
        consigne: "Choisissez une option, puis ouvrez votre messagerie.",
        choix: [{ texte: "Ouvrir ma messagerie", go: "boite", style: "" }],
        ecran: `
          <p class="ui-l">Comment vos fichiers sont-ils sauvegardés ?</p>
          ${[
            ["aucune", "Aucune sauvegarde", "Tout est uniquement sur l’ordinateur."],
            ["branchee", "Disque externe toujours branché", "Une copie automatique chaque soir. Le disque reste branché en permanence."],
            ["horsligne", "Sauvegarde hors ligne", "Une copie chaque semaine sur un disque que l’on débranche et range ensuite."],
          ]
            .map(
              ([v, t, d]) =>
                `<label class="opt"><input type="radio" name="sauvegarde" value="${v}" data-champ="sauvegarde"${e.sauvegarde === v ? " checked" : ""}><span><b>${t}</b>${d}</span></label>`,
            )
            .join("")}`,
        espion: terminal("Campagne de courriels piégés", [
          ["Courriels envoyés", "10 000"],
          ["Thème", "fausse relance de facture"],
          ["Pièces jointes ouvertes", "0"],
        ], "En attente qu’une victime morde à l’hameçon"),
        stMoi: ["Ordinateur sain", "ok"],
        stEux: ["Campagne en cours", ""],
      }),

      boite: (e) => ({
        etape: 1,
        ton: "info",
        titre: "Trois nouveaux messages",
        texte:
          "<p>Votre boîte de réception contient trois messages. L’un d’eux est piégé. Lisez-les comme vous le feriez d’habitude.</p>",
        consigne: "Cliquez sur un message pour l’ouvrir.",
        ecran: boite(e),
        espion: terminal("Campagne de courriels piégés", [
          ["Courriels envoyés", "10 000"],
          ["Pièces jointes ouvertes", "0"],
        ], "En attente qu’une victime ouvre la pièce jointe"),
        journal: [[`[MESSAGERIE] 3 messages reçus · sauvegarde choisie : ${{ aucune: "aucune", branchee: "disque toujours branché", horsligne: "hors ligne" }[e.sauvegarde]}`]],
        actions: {
          eviter,
          lire: (sim, b) => {
            const id = b.dataset.id,
              r = sim.racine;
            sim.etat.lus.add(id);
            r.querySelectorAll(".m-item").forEach((x) => {
              x.setAttribute("aria-current", x.dataset.id === id);
              if (sim.etat.lus.has(x.dataset.id)) x.classList.remove("nl");
            });
            r.querySelector("[data-lecture]").innerHTML = lecture(id);
            sim.majIndices();
            if (id === "facture") sim.journal("[MESSAGERIE] Ouverture du courriel de relance-facture (expéditeur en .xyz)", "am");
          },
        },
      }),

      doc: () => ({
        etape: 1,
        ton: "alerte",
        titre: "Le document vous demande d’« activer le contenu »",
        texte:
          "<p>La facture s’ouvre dans votre traitement de texte, mais son contenu est flou. Un bandeau jaune vous invite à cliquer sur « Activer le contenu » pour l’afficher.</p>",
        consigne: "Activez-vous le contenu ?",
        ecran: uiFenetre(
          "Facture_48213.docm — Traitement de texte",
          `
          <div class="macro"><b>${ico("attention")} Avertissement de sécurité</b><span>Les macros ont été désactivées.</span><button class="ui-btn" type="button" data-go="chiffrement">Activer le contenu</button></div>
          ${indice("Une macro est un petit programme : l’activer, c’est lancer un logiciel envoyé par un inconnu.")}
          <div class="doc-flou">
            <div class="flou" aria-hidden="true"><b>FACTURE N°48213</b><u></u><u></u><u style="width:70%"></u><u></u><u style="width:50%"></u></div>
            <p class="doc-msg">Ce document a été créé avec une version plus récente. Pour afficher la facture, cliquez sur <b>« Activer le contenu »</b> en haut.</p>
          </div>
          ${indice("Un vrai document s’affiche sans vous demander de baisser la sécurité.")}
          <p class="ctr"><button class="ui-btn" type="button" data-act="eviter" data-how="ferme">Fermer le document</button></p>`,
        ),
        espion: terminal("Campagne de courriels piégés", [["Pièces jointes ouvertes", '<span class="vole">1</span>']], "Une victime a ouvert le document… va-t-elle activer les macros ?"),
        stEux: ["Vous observe", "alerte"],
        journal: [["[FICHIER] Ouverture de Facture_48213.docm (macros présentes, bloquées par défaut)", "am"]],
        actions: { eviter },
      }),

      chiffrement: (e) => ({
        etape: 2,
        ton: "danger",
        titre: "Vos fichiers sont en train d’être chiffrés",
        texte:
          "<p>La macro a téléchargé puis lancé le rançongiciel. Il <b>chiffre</b> vos fichiers un par un : il les brouille avec une clé secrète que seul l’attaquant possède. Sans cette clé, ils sont illisibles.</p>",
        consigne: "Réagissez vite : couper le réseau protège ce qui peut encore l’être.",
        choix: [{ texte: "Couper Internet et le réseau", act: "couper", style: "" }],
        ecran: explorateur(
          e,
          `<div class="taskbar"><span>Fichiers chiffrés : <b data-nx>0</b> / ${presents(e).length}</span><span>${ico("wifi")} Wi-Fi : <b data-wifi>connecté</b> <button class="ui-btn" type="button" data-act="couper">Couper</button></span></div>`,
        ),
        espion: terminal("Rançongiciel actif · victime n°3 057", [
          ["Clé de déchiffrement", `${ico("cle")} gardée par l’attaquant`],
          ["Fichiers chiffrés", "<span data-nx2>0</span>"],
          ["Copie de vos fichiers", '<span data-copie>en cours d’envoi…</span>'],
        ], "Chiffrement en cours"),
        stMoi: ["Chiffrement en cours", "danger"],
        stEux: ["Rançongiciel actif", "danger"],
        flux: "on",
        journal: [
          ["[MACRO] Exécution du code caché dans Facture_48213.docm", "rd"],
          ["[MACRO] Téléchargement de « maj.exe » depuis 198.51.100.66 (adresse fictive)", "rd"],
          ["[RANÇONGICIEL] Suppression des points de restauration automatiques du système", "rd"],
          ["[RANÇONGICIEL] Clé de chiffrement créée et envoyée à l’attaquant", "rd"],
        ],
        actions: { couper },
        entree: (sim) => {
          const ordre = presents(e);
          const r = sim.racine;
          let k = 0;
          const id = sim.chaque(600, () => {
            // Le réseau est coupé ? Les fichiers du dossier partagé sont hors d’atteinte.
            while (k < ordre.length && FICHIERS[ordre[k]][2] === "res" && !e.reseau) k++;
            if (k >= ordre.length) {
              sim.stop(id);
              sim.statut("moi", `${e.chiffres} fichiers chiffrés`, "danger");
              sim.apres(1000, () => sim.aller("rancon", { scroll: false }));
              return;
            }
            const i = ordre[k++];
            majTuile(sim, i, "x");
            e.chiffres++;
            r.querySelector("[data-nx]").textContent = e.chiffres;
            r.querySelector("[data-nx2]").textContent = e.chiffres;
            sim.journal(`[CHIFFREMENT] ${FICHIERS[i][1]} → ${FICHIERS[i][1]}.verrou`, "rd");
          });
        },
      }),

      rancon: (e) => ({
        etape: 3,
        ton: "danger",
        titre: "La demande de rançon s’affiche",
        texte: `<p><b>${e.chiffres} fichiers</b> sont maintenant illisibles. Un message exige un paiement en cryptomonnaie, avec un compte à rebours pour vous mettre la pression.</p>`,
        consigne: "Que faites-vous ?",
        choix: [
          { texte: "Payer la rançon", go: "paye" },
          { texte: "Restaurer ma sauvegarde", act: "restaurer" },
          { texte: "Demander de l’aide", go: "aide" },
        ],
        ecran: `
          <div class="rn">
            <p class="rn-i" aria-hidden="true">${ico("cadenas")}</p>
            <p class="rn-t">Vos fichiers ont été chiffrés</p>
            <p>Documents, photos, sauvegardes : tout est verrouillé avec une clé que <b>nous seuls</b> possédons.</p>
            <p>Pour les récupérer, payez <b>1 000 €</b> en bitcoins (fictif).</p>
            <p class="cd" data-cd>71:59:59</p>
            ${indice("Le compte à rebours sert à vous empêcher de réfléchir et de demander conseil.")}
            <p class="rn-p">Passé ce délai, le prix double. Après 7 jours, vos fichiers seront supprimés.</p>
            ${indice("Rien ne garantit que l’attaquant tiendra parole : c’est un criminel.")}
            <button class="ui-btn" type="button" data-go="paye">Payer maintenant</button>
          </div>`,
        espion: terminal("Rançongiciel · victime n°3 057", [
          ["Montant demandé", "1 000 €"],
          ["Victimes ayant payé aujourd’hui", "3"],
          ["Clé de déchiffrement", `${ico("cle")} gardée par l’attaquant`],
        ], "En attente du paiement"),
        stMoi: [`${e.chiffres} fichiers chiffrés`, "danger"],
        stEux: ["Attend le paiement", "danger"],
        flux: e.reseau ? "" : "cut",
        journal: [["[RANÇONGICIEL] Message de rançon affiché en plein écran", "rd"]],
        actions: { restaurer },
        entree: (sim) => {
          let s = 72 * 3600 - 1;
          sim.chaque(1000, () => {
            s--;
            const h = String(Math.floor(s / 3600)).padStart(2, "0"),
              m = String(Math.floor((s % 3600) / 60)).padStart(2, "0"),
              ss = String(s % 60).padStart(2, "0");
            const z = sim.racine.querySelector("[data-cd]");
            if (z) z.textContent = `${h}:${m}:${ss}`;
          });
        },
      }),

      paye: (e) => ({
        etape: 3,
        ton: "danger",
        titre: "Vous avez payé 1 000 € (fictif)…",
        texte:
          "<p>L’attaquant envoie un outil de déchiffrement. Il ne marche qu’en partie : certains fichiers restent abîmés. Puis un nouveau message arrive : « Payez encore 500 €, sinon nous publions vos photos. »</p><p>En payant, vous avez aussi financé les prochaines attaques, et montré que vous payez quand on vous menace.</p>",
        choix: [{ texte: "Voir le bilan", go: "bilan", style: "" }],
        ecran: explorateur(e),
        espion: terminal("Rançongiciel · victime n°3 057", [
          ["Paiement reçu", '<span class="vole">1 000 €</span>'],
          ["Nouvelle demande", "500 € (menace de publier les photos)"],
        ], "Victime marquée comme « payeuse »"),
        stEux: ["A été payé", "danger"],
        journal: [["[PAIEMENT] 1 000 € envoyés (fictif) · outil de déchiffrement reçu", "rd"]],
        entree: (sim) => {
          e.paye = true;
          const touches = presents(e).filter((i) => e.etats[i] === "x");
          touches.forEach((i, k) =>
            sim.apres(250 * (k + 1), () => majTuile(sim, i, k % 2 ? "ab" : "ok")),
          );
          sim.apres(250 * (touches.length + 1), () => {
            sim.statut("moi", `${nbPerdus(e)} fichiers toujours abîmés`, "danger");
            sim.journal(`[DÉCHIFFREMENT] ${touches.length - nbPerdus(e)} fichiers récupérés, ${nbPerdus(e)} restent illisibles`, "am");
          });
        },
      }),

      sans_sauvegarde: (e) => ({
        etape: 3,
        ton: "danger",
        titre: "Aucune sauvegarde à restaurer",
        texte:
          "<p>Vous n’aviez fait aucune copie de vos fichiers : il n’y a rien à restaurer.</p><p>Dernier espoir : pour certains rançongiciels, des chercheurs publient des outils de déchiffrement gratuits (projet <b>No More Ransom</b>). Pour celui-ci, il n’en existe pas.</p>",
        consigne: "Que faites-vous maintenant ?",
        choix: [
          { texte: "Payer la rançon", go: "paye" },
          { texte: "Demander de l’aide", go: "aide" },
          { texte: "Accepter la perte et voir le bilan", go: "bilan" },
        ],
        ecran: explorateur(e),
        stMoi: [`${e.chiffres} fichiers chiffrés`, "danger"],
      }),

      sauvegarde_chiffree: (e) => ({
        etape: 3,
        ton: "danger",
        titre: "Mauvaise surprise : la sauvegarde est chiffrée aussi",
        texte:
          "<p>Votre disque externe était <b>branché en permanence</b>. Pour le rançongiciel, c’était un dossier comme un autre : il l’a chiffré avec le reste. Une sauvegarde qui reste branchée ne protège pas d’un rançongiciel.</p>",
        consigne: "Que faites-vous maintenant ?",
        choix: [
          { texte: "Payer la rançon", go: "paye" },
          { texte: "Demander de l’aide", go: "aide" },
          { texte: "Accepter la perte et voir le bilan", go: "bilan" },
        ],
        ecran: explorateur(e),
        stMoi: [`${e.chiffres} fichiers chiffrés`, "danger"],
        journal: [["[SAUVEGARDE] Disque E: illisible : ses fichiers ont été chiffrés pendant l’attaque", "rd"]],
      }),

      restauration: (e) => ({
        etape: 3,
        ton: "ok",
        titre: "Vous restaurez votre sauvegarde hors ligne",
        texte:
          "<p>Après avoir fait nettoyer l’ordinateur, vous rebranchez le disque de sauvegarde, resté débranché pendant l’attaque. Le rançongiciel n’a jamais pu l’atteindre : vos fichiers reviennent, tels qu’ils étaient lors de la dernière copie.</p>",
        choix: [{ texte: "Voir le bilan", go: "bilan", style: "" }],
        ecran: explorateur(e),
        espion: terminal("Rançongiciel · victime n°3 057", [["Paiement reçu", "0 €"]], "La victime ne paiera pas…"),
        stEux: ["Pas payé", "ok"],
        flux: "cut",
        journal: [["[SAUVEGARDE] Disque hors ligne rebranché après nettoyage du système", "ok"]],
        entree: (sim) => {
          e.restaure = true;
          const touches = presents(e).filter((i) => e.etats[i] === "x");
          touches.forEach((i, k) => sim.apres(200 * (k + 1), () => majTuile(sim, i, "ok")));
          sim.apres(200 * (touches.length + 1), () => {
            sim.statut("moi", "Fichiers restaurés", "ok");
            sim.journal(`[SAUVEGARDE] ${touches.length} fichiers restaurés`, "ok");
          });
        },
      }),

      aide: () => ({
        etape: 3,
        ton: "info",
        titre: "Vous demandez de l’aide",
        texte:
          "<p>Bonne idée : les services officiels (<b>17cyber.gouv.fr</b>, cybermalveillance.gouv.fr) accompagnent gratuitement les victimes. Voici la marche à suivre qu’ils recommandent.</p>",
        choix: [
          { texte: "Restaurer ma sauvegarde", act: "restaurer" },
          { texte: "Voir le bilan", go: "bilan", style: "" },
        ],
        ecran: `
          <div class="aide">
            <p class="aide-t">Rançongiciel : les bons réflexes</p>
            <ol>
              <li><b>Ne payez pas</b> : rien ne garantit de récupérer vos fichiers.</li>
              <li>Débranchez l’appareil d’Internet et du réseau.</li>
              <li>Photographiez le message de rançon et <b>portez plainte</b>.</li>
              <li>Cherchez un outil de déchiffrement gratuit sur nomoreransom.org.</li>
              <li>Faites nettoyer ou réinstaller l’appareil, puis restaurez vos sauvegardes.</li>
            </ol>
            <p class="aide-s">D’après les conseils de cybermalveillance.gouv.fr</p>
          </div>`,
        actions: { restaurer },
      }),

      /* --- Bilans --- */

      bilan: (e) => {
        const total = presents(e).length,
          perdus = nbPerdus(e),
          sauf = e.restaure;
        const passe = [
          "Un faux courriel de « relance de facture » contenait un document piégé.",
          "En cliquant « Activer le contenu », vous avez lancé la macro, qui a installé le rançongiciel.",
          `Il a chiffré <b>${e.chiffres} fichiers</b>${e.sauvegarde === "branchee" ? ", y compris le disque de sauvegarde resté branché" : ""}.`,
          e.reseau
            ? "Le réseau est resté connecté : le dossier partagé de la famille a été chiffré lui aussi."
            : e.sauvesReseau
              ? `Couper le réseau a mis <b>${e.sauvesReseau} fichiers</b> du dossier partagé hors d’atteinte.`
              : "Le réseau a été coupé, mais trop tard pour le dossier partagé.",
        ];
        const oubliee = !sauf && e.sauvegarde === "horsligne"; // sauvegarde intacte… mais pas utilisée
        if (e.paye) passe.push("Payer n’a permis de récupérer qu’une partie des fichiers, et l’attaquant en redemande.");
        if (sauf) passe.push("La sauvegarde hors ligne, hors d’atteinte, a permis de tout restaurer.");
        if (oubliee) passe.push("Votre sauvegarde hors ligne était intacte : il suffisait de la restaurer, après nettoyage de l’ordinateur.");
        else if (!sauf && !e.paye) passe.push("Sans sauvegarde utilisable, les fichiers chiffrés sont perdus.");

        return {
          etape: 4,
          ton: sauf ? "ok" : "danger",
          titre: sauf
            ? "Résultat : fichiers récupérés grâce à la sauvegarde hors ligne"
            : e.paye
              ? "Résultat : 1 000 € perdus, et des fichiers toujours abîmés"
              : `Résultat : ${perdus} fichiers perdus`,
          texte: sauf
            ? "<p>L’attaque a bien eu lieu, mais elle ne vous a presque rien coûté : une sauvegarde débranchée est la meilleure assurance contre un rançongiciel. Vous ne perdez que ce qui a changé depuis la dernière copie.</p>"
            : e.paye
              ? "<p>Payer semblait la solution la plus rapide. Mais l’outil fourni marche mal, l’argent est perdu, et l’attaquant sait désormais que vous payez.</p>"
              : oubliee
                ? "<p>Vous aviez pourtant une sauvegarde hors ligne, intacte. Rejouez et choisissez « Restaurer ma sauvegarde » pour voir la différence.</p>"
                : "<p>Sans copie hors d’atteinte, des fichiers chiffrés sont en général perdus pour de bon. Le CV et le mémoire de BTS seraient à refaire.</p>",
          bilan: {
            stats: [
              ["Fichiers chiffrés", `${e.chiffres} / ${total}`, "rd"],
              ["Fichiers perdus", perdus, perdus ? "rd" : "ok"],
              ["Argent perdu", e.paye ? "1 000 €" : "0 €", e.paye ? "rd" : "ok"],
              ["Réseau coupé à temps", e.reseau ? "non" : e.sauvesReseau ? `oui · ${e.sauvesReseau} sauvés` : "trop tard", e.reseau ? "rd" : e.sauvesReseau ? "ok" : "am"],
            ],
            passe,
            indices: INDICES,
            proteger: PROTEGER,
            reagir: REAGIR,
          },
        };
      },

      evite: (e) => ({
        etape: 4,
        ton: "ok",
        titre:
          e.evite === "ferme"
            ? "Résultat : macros refusées, attaque évitée"
            : e.evite === "signale"
              ? "Résultat : courriel piégé repéré et signalé"
              : "Résultat : courriel piégé repéré et supprimé",
        texte:
          e.evite === "ferme"
            ? "<p>Vous avez ouvert la pièce jointe, mais refusé d’« activer le contenu ». Sans macro, pas de rançongiciel : vos fichiers sont intacts.</p>"
            : e.evite === "signale"
              ? "<p>Vous avez repéré la fausse facture et l’avez signalée. Votre messagerie pourra bloquer les prochains envois du même escroc.</p>"
              : "<p>Vous avez repéré la fausse facture et l’avez supprimée sans l’ouvrir. La signaler aurait aussi protégé d’autres personnes.</p>",
        bilan: {
          stats: [
            ["Fichiers chiffrés", "0", "ok"],
            ["Argent perdu", "0 €", "ok"],
          ],
          passe: [
            "Une campagne de faux courriels a été envoyée à des milliers d’adresses.",
            e.evite === "ferme"
              ? "Vous avez ouvert le document, mais pas activé les macros : le code n’a pas pu s’exécuter."
              : "Vous n’avez pas ouvert la pièce jointe : le piège n’a jamais pu se déclencher.",
            "Vos fichiers et vos sauvegardes sont intacts.",
          ],
          titreIndices: "Les indices de la fausse facture",
          indices: INDICES,
          proteger: PROTEGER,
          reagir: [
            "Signaler le courriel avec le bouton de votre messagerie, ou sur <b>signal-spam.fr</b>.",
            "Supprimer la pièce jointe sans l’ouvrir.",
            "Si vous l’avez ouverte et activée : débrancher l’appareil du réseau et demander de l’aide sur <b>17cyber.gouv.fr</b>.",
          ],
        },
      }),
    },
  });
})();
