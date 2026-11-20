/* =====================================================================
   MalAware · Simulation « Trojan » (cheval de Troie)
   ---------------------------------------------------------------------
   Scénario : vous devez ouvrir un PDF et cherchez un logiciel sur
   Internet. Trois chemins possibles :
     - le faux site (annonce)  → trojan installé → l’attaquant prend la main
     - le site officiel        → installation saine
     - le navigateur           → aucun logiciel à installer
   Tout est fictif : sites, fichiers, commandes. Les adresses IP
   utilisées (203.0.113.x) sont réservées à la documentation.
   ===================================================================== */
(() => {
  /* ---------- Contenus réutilisés ---------- */

  const PDF = `
    <div class="pdf">
      <h6>Dossier d’inscription 2026-2027</h6>
      <p>Nom : MARTIN · Prénom : Alice</p>
      <p>Née le : 14/03/2008</p>
      <p>Adresse : 12 rue des Lilas, 75000 Paris</p>
      <u></u><u></u><u style="width:70%"></u>
    </div>`;

  const RESULTATS = `
    <div class="srch"><span class="srch-logo">Cherchetout</span><span class="srch-q">lecteur pdf gratuit</span></div>
    <button class="res sus" type="button" data-go="piege">
      <small><span class="ad">Annonce</span>telecharger-pdf-gratuit.xyz</small>
      <strong>Lecteur PDF Express — Téléchargement GRATUIT · 100 % SANS VIRUS</strong>
      <span>★★★★★ Plus de 50 000 téléchargements aujourd’hui ! Installation en 1 clic.</span>
    </button>
    ${indice("« Annonce » : n’importe qui peut payer pour apparaître en premier, y compris un escroc.")}
    ${indice("L’adresse en <b>.xyz</b> n’est pas celle d’un éditeur de logiciel.")}
    ${indice("« 100 % sans virus » : une promesse typique des sites piégés.")}
    <button class="res" type="button" data-go="officiel">
      <small>lectpdf.fr › telecharger</small>
      <strong>LectPDF — Site officiel de l’éditeur</strong>
      <span>Téléchargez la dernière version de LectPDF, lecteur PDF gratuit. Version 12.4.</span>
    </button>
    <button class="res" type="button" data-go="navigateur">
      <small>forum-entraide.fr › informatique</small>
      <strong>[Résolu] Ouvrir un PDF sans rien installer ?</strong>
      <span>« Pas besoin de logiciel : votre navigateur web ouvre déjà les PDF. Clic droit sur le fichier → Ouvrir avec → navigateur. »</span>
    </button>`;

  /* ---------- Les ordres que l’attaquant peut envoyer ---------- */

  const COMMANDES = {
    fichiers: {
      label: "Fouiller vos documents",
      sortie: [
        '<span class="p">&gt; ls Documents</span>',
        "dossier_inscription.pdf",
        "CV_2026.pdf",
        '<span class="vole">Impots_2025.pdf</span>',
        "Photos/ (1 248 fichiers)",
        '<span class="p">&gt; download Impots_2025.pdf</span>',
        "✓ 412 Ko reçus",
      ],
      explication:
        "Il fouille vos dossiers et <b>copie votre avis d’impôt</b> : nom, adresse, revenus… de quoi usurper votre identité.",
      signe: null,
      journal: [
        ["[COMMANDE] Liste du dossier C:\\Users\\vous\\Documents", "rd"],
        ["[EXFILTRATION] Envoi de Impots_2025.pdf (412 Ko) vers 203.0.113.7", "rd"],
      ],
    },
    ecran: {
      label: "Voir votre écran",
      sortie: [
        '<span class="p">&gt; screenshot</span>',
        '<div class="capture"><i></i><u></u><u></u><u style="width:60%"></u></div>',
        "✓ Capture reçue",
      ],
      explication:
        "Il voit exactement ce que vous voyez : votre dossier d’inscription, avec votre date de naissance et votre adresse.",
      signe: null,
      journal: [["[COMMANDE] Capture d’écran envoyée à 203.0.113.7", "rd"]],
    },
    webcam: {
      label: "Allumer votre webcam",
      sortie: [
        '<span class="p">&gt; webcam start</span>',
        '<div class="cam"><span>● REC</span></div>',
        "✓ Image reçue (floutée pour la simulation)",
      ],
      explication:
        "Il peut vous voir. Un simple cache posé sur la webcam bloque l’image, même si l’ordinateur est piraté.",
      signe: "Le petit voyant de la webcam s’allume quelques secondes.",
      journal: [["[COMMANDE] Activation de la webcam", "rd"]],
    },
    mdp: {
      label: "Voler vos mots de passe enregistrés",
      sortie: [
        '<span class="p">&gt; dump navigateur</span>',
        'mail-exemple.fr · alice.m · <span class="vole">Chaton2019</span>',
        'reseau-social.fr · alice_m · <span class="vole">Chaton2019</span>',
        "✓ 2 mots de passe récupérés",
      ],
      explication:
        "Il récupère les mots de passe que le navigateur avait mémorisés. Le même mot de passe partout ? Tous vos comptes tombent d’un coup.",
      signe: null,
      journal: [["[COMMANDE] Lecture des mots de passe enregistrés dans le navigateur", "rd"]],
    },
    malware: {
      label: "Installer un autre malware",
      sortie: [
        '<span class="p">&gt; download rancon.exe &amp;&amp; run</span>',
        "(bloqué : c’est une simulation)",
      ],
      explication:
        'Une porte dérobée sert souvent à installer d’autres malwares, par exemple un <a href="ransomware.html#demo">rançongiciel</a> qui bloque tous vos fichiers.',
      signe: "L’ordinateur ralentit, le ventilateur souffle plus fort.",
      journal: [["[COMMANDE] Téléchargement d’un second malware (bloqué par la simulation)", "rd"]],
    },
  };

  const signesVisibles = (e) => [...e.cmds].filter((k) => COMMANDES[k].signe).length;

  /* ---------- Textes des bilans ---------- */

  const INDICES = [
    "Le premier résultat était une <b>annonce</b> payée, vers un site en <b>.xyz</b>.",
    "Le site promettait « 100 % sans virus » et affichait un compte à rebours et de faux avis.",
    "Le programme n’avait <b>pas d’éditeur</b> : le système affichait « Éditeur : inconnu ».",
    "L’installeur ajoutait un autre programme avec une case <b>pré-cochée</b>.",
  ];
  const PROTEGER = [
    "Se demander d’abord si l’on a besoin d’installer quelque chose : le navigateur ouvre déjà les PDF.",
    "Télécharger uniquement sur le <b>site officiel</b> de l’éditeur ou dans le magasin d’applications du système.",
    "Lire les alertes de sécurité avant de cliquer « Oui » : un éditeur inconnu doit faire renoncer.",
    "Garder le système et l’antivirus à jour, et utiliser au quotidien un compte <b>sans droits administrateur</b>.",
    "Poser un cache sur la webcam quand on ne s’en sert pas.",
  ];
  const REAGIR = [
    "Débrancher l’ordinateur d’Internet (couper le Wi-Fi ou retirer le câble).",
    "Lancer une analyse complète avec un antivirus à jour ; en cas de doute, faire réinstaller le système.",
    "Changer vos mots de passe <b>depuis un autre appareil</b>, en commençant par la messagerie et la banque.",
    "Se faire aider : <b>17cyber.gouv.fr</b> ou cybermalveillance.gouv.fr.",
  ];

  /* ---------- Les scènes ---------- */

  monterSimulation("trojan", {
    titre: "Trojan",
    etapes: ["Recherche", "Téléchargement", "Installation", "Porte dérobée", "Bilan"],
    autres: '<a href="keylogger.html#demo">Keylogger</a> · <a href="ransomware.html#demo">Ransomware</a>',
    etatInitial: () => ({ cmds: new Set(), retour: false }),

    scenes: {
      intro: (e) => ({
        etape: 0,
        ton: e.retour ? "ok" : "info",
        titre: e.retour ? "Bon réflexe : vous avez quitté ce site" : "Vous devez ouvrir un PDF",
        texte: e.retour
          ? "<p>Un site qui vous presse et promet monts et merveilles mérite toujours de la méfiance. Choisissez une autre solution.</p>"
          : "<p>Votre école vous a envoyé <b>dossier_inscription.pdf</b>, mais votre ordinateur affiche « Aucune application pour ouvrir ce fichier ». Vous cherchez une solution sur Internet.</p>",
        consigne: "Cliquez sur un résultat de recherche.",
        ecran: uiNavigateur("cherchetout.fr/?q=lecteur+pdf+gratuit", RESULTATS),
        espion: terminal(
          "Tableau de bord de l’attaquant",
          [
            ["Annonce payée", "« Lecteur PDF Express »"],
            ["Faux site", "telecharger-pdf-gratuit.xyz"],
            ["Victimes connectées", "0"],
          ],
          "En attente d’un clic",
        ),
        stMoi: ["Ordinateur sain", "ok"],
        stEux: ["Aucun accès", ""],
        journal: e.retour ? [] : [["[NAVIGATEUR] Recherche : « lecteur pdf gratuit »"]],
      }),

      piege: () => ({
        etape: 1,
        ton: "alerte",
        titre: "Un site de téléchargement très… insistant",
        texte:
          "<p>Plusieurs gros boutons « Télécharger », un compte à rebours, des avis enthousiastes : tout est fait pour que vous cliquiez vite, sans réfléchir.</p>",
        consigne: "Téléchargez le fichier… ou quittez le site.",
        ecran: uiNavigateur(
          "telecharger-pdf-gratuit.xyz/lecteur-pdf",
          `
          ${indice("Le cadenas indique seulement que la connexion est chiffrée. Un site piégé peut très bien l’avoir.")}
          <div class="pg-ban">${ico("attention")} Votre ordinateur n’a pas de lecteur PDF ! Installez-le MAINTENANT</div>
          ${indice("Un message alarmant pour vous faire peur et vous presser.")}
          <p class="pg-cd">Offre gratuite encore <b data-cd>04:59</b></p>
          <button class="dl" type="button" data-go="uac">${ico("telecharger")} TÉLÉCHARGER GRATUITEMENT</button>
          <p class="pg-f">Fichier : <b>LecteurPDF_Express_Setup.exe</b> · 2,1 Mo · Éditeur : —</p>
          ${indice("Aucun éditeur, aucun numéro de version : impossible de savoir qui a créé ce programme.")}
          <div class="avis"><b>★★★★★</b> « Super, ça marche !!! » — Kevin, il y a 2 min<br><b>★★★★★</b> « Super, ça marche !!! » — Julie, il y a 2 min</div>
          ${indice("Des avis identiques publiés à la même minute : ce sont de faux avis.")}
          <div class="pg-bas"><button class="dl mini" type="button" data-go="uac">Télécharger (rapide)</button><button class="ui-lien" type="button" data-act="quitter">← Quitter ce site</button></div>`,
        ),
        espion: terminal(
          "Tableau de bord de l’attaquant",
          [
            ["Faux site", "telecharger-pdf-gratuit.xyz"],
            ["Visiteurs en ce moment", "1 (vous)"],
            ["Victimes connectées", "0"],
          ],
          "Un visiteur hésite…",
        ),
        stEux: ["Vous observe", "alerte"],
        journal: [["[NAVIGATEUR] Visite de telecharger-pdf-gratuit.xyz (site non officiel)", "am"]],
        actions: {
          quitter: (sim) => {
            sim.etat.retour = true;
            sim.aller("intro");
          },
        },
        entree: (sim) => {
          let s = 299;
          sim.chaque(1000, () => {
            s = Math.max(0, s - 1);
            const z = sim.racine.querySelector("[data-cd]");
            if (z) z.textContent = `0${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
          });
        },
      }),

      uac: () => ({
        etape: 2,
        ton: "alerte",
        titre: "Le système vous demande une autorisation",
        texte:
          "<p>Vous lancez le fichier téléchargé. Il veut s’installer avec les <b>droits administrateur</b>, c’est-à-dire le droit de tout modifier sur l’ordinateur. Votre système vous prévient.</p>",
        consigne: "Autorisez-vous ce programme ?",
        ecran: `
          <div class="ui-dlg">
            <p class="ui-dlg-h">Contrôle de sécurité</p>
            <p><b>Autoriser cette application à apporter des modifications à votre appareil ?</b></p>
            <div class="ui-app">${ico("appli")} LecteurPDF_Express_Setup.exe</div>
            <p class="ui-l">Éditeur : <b class="rouge">Inconnu</b></p>
            ${indice("« Éditeur inconnu » : le programme n’est pas signé, personne ne garantit d’où il vient.")}
            <p class="ui-l">Provenance : Internet (telecharger-pdf-gratuit.xyz)</p>
            <div class="ui-btns"><button class="ui-btn" type="button" data-go="installation">Oui</button><button class="ui-btn" type="button" data-go="annule">Non</button></div>
          </div>`,
        espion: terminal(
          "Tableau de bord de l’attaquant",
          [
            ["Téléchargements", "1 ✓"],
            ["Victimes connectées", "0"],
          ],
          "Le fichier est sur l’ordinateur… sera-t-il lancé ?",
        ),
        stMoi: ["Fichier suspect téléchargé", "alerte"],
        stEux: ["Vous observe", "alerte"],
        journal: [
          ["[FICHIER] LecteurPDF_Express_Setup.exe enregistré dans Téléchargements (2,1 Mo)"],
          ["[SYSTÈME] Demande de droits administrateur — programme non signé", "am"],
        ],
      }),

      installation: () => ({
        etape: 2,
        ton: "danger",
        titre: "L’installation se passe… normalement",
        texte:
          "<p>Un assistant d’installation tout à fait classique s’affiche. Mais pendant que la barre avance, le programme copie aussi une <b>partie cachée</b> sur votre ordinateur.</p>",
        consigne: "Regardez les deux écrans pendant l’installation.",
        ecran: uiFenetre(
          "Installation de Lecteur PDF Express",
          `
          <p class="inst-t" data-it>Préparation…</p>
          <div class="inst-bar"><i data-ib></i></div>
          <label class="chk sus"><input type="checkbox" checked disabled> Installer aussi « BarreRecherche+ » (recommandé)</label>
          ${indice("Case pré-cochée : les installeurs douteux ajoutent souvent d’autres programmes en douce.")}
          <div data-fin></div>`,
        ),
        espion: terminal("Tableau de bord de l’attaquant", [["Victimes connectées", "0"]], "Installation en cours chez la victime…"),
        stMoi: ["Installation…", "alerte"],
        entree: (sim) => {
          const r = sim.racine;
          const etapes = [
            [15, "Copie des fichiers…", ["[INSTALLATION] Copie de LecteurPDF.exe (le vrai lecteur, qui fonctionne)"]],
            [40, "Copie des fichiers…", ["[INSTALLATION] Copie cachée de « maj_systeme.exe » dans un dossier système", "rd"]],
            [65, "Création des raccourcis…", ["[PERSISTANCE] maj_systeme.exe ajouté au démarrage automatique (clé de registre « Run ») : il se relancera à chaque allumage", "rd"]],
            [85, "Configuration…", ["[RÉSEAU] Connexion sortante vers 203.0.113.7:443 — ressemble à une simple visite de site web", "rd"]],
            [100, "Installation terminée ✓", null],
          ];
          etapes.forEach(([pct, txt, j], k) =>
            sim.apres(900 * (k + 1), () => {
              r.querySelector("[data-ib]").style.width = pct + "%";
              r.querySelector("[data-it]").textContent = txt;
              if (j) sim.journal(...j);
              if (pct === 85) {
                sim.flux("on");
                sim.statut("eux", "Connecté à votre PC", "danger");
                sim.maj(
                  "espion",
                  terminal(
                    "Tableau de bord de l’attaquant",
                    [
                      ["Nouvelle victime !", '<span class="vole">PC-MAISON</span>'],
                      ["Adresse", "203.0.113.7 (fictive)"],
                      ["Victimes connectées", "1"],
                    ],
                    "Prêt à envoyer des ordres",
                  ),
                );
              }
              if (pct === 100) {
                r.querySelector("[data-fin]").innerHTML =
                  '<button class="ui-btn pri" type="button" data-go="ouvert">Terminer et ouvrir mon PDF</button>';
                sim.statut("moi", "Infecté (sans le savoir)", "danger");
              }
            }),
          );
        },
      }),

      ouvert: () => ({
        etape: 3,
        ton: "danger",
        titre: "Votre PDF s’ouvre… et l’attaquant est entré",
        texte:
          "<p>Le lecteur fonctionne parfaitement. C’est tout le principe du <b>cheval de Troie</b> : le cadeau est réel, mais il cache des soldats. La partie cachée a ouvert une <b>porte dérobée</b> : l’attaquant peut maintenant donner des ordres à votre ordinateur.</p>",
        consigne:
          "Prenez la place de l’attaquant : cliquez sur ses commandes, puis regardez ce qui change (ou pas) sur votre écran.",
        choix: [{ texte: "Voir le bilan", go: "bilan", style: "" }],
        ecran:
          uiFenetre("dossier_inscription.pdf — Lecteur PDF Express", PDF) +
          `<div class="signes" data-signes aria-live="polite"><b>Ce que vous remarquez :</b><ul><li>Rien du tout. Vous lisez tranquillement votre PDF.</li></ul></div>`,
        espion: `
          <div class="term">
            <p class="term-h">Session ouverte · PC-MAISON (203.0.113.7)</p>
            <div class="cmds">${Object.entries(COMMANDES)
              .map(([id, c]) => `<button class="cmd" type="button" data-act="cmd" data-cmd="${id}">&gt; ${c.label}</button>`)
              .join("")}</div>
            <div class="out" data-out aria-live="polite"><span class="wait">Choisissez une commande</span></div>
          </div>`,
        stMoi: ["Infecté (sans le savoir)", "danger"],
        stEux: ["Contrôle total", "danger"],
        flux: "on",
        journal: [["[PDF] Ouverture de dossier_inscription.pdf"]],
        actions: {
          cmd: (sim, b) => {
            const e = sim.etat,
              c = COMMANDES[b.dataset.cmd],
              r = sim.racine;
            e.cmds.add(b.dataset.cmd);
            b.classList.add("fait");
            r.querySelector("[data-out]").innerHTML =
              c.sortie.map((l) => `<div>${l}</div>`).join("") + `<p class="out-ex">${c.explication}</p>`;
            const signes = [...e.cmds].map((k) => COMMANDES[k].signe).filter(Boolean);
            r.querySelector("[data-signes]").innerHTML = `
              <b>Ce que vous remarquez :</b>
              ${liste(signes.length ? signes : ["Rien du tout. Vous lisez tranquillement votre PDF."])}
              <p class="signes-n">Ordres exécutés sur votre PC : <b>${e.cmds.size}</b> · Signes visibles : <b>${signes.length}</b></p>`;
            c.journal.forEach(([t, cl]) => sim.journal(t, cl));
            sim.flux("on rev");
            sim.apres(1600, () => sim.flux("on"));
          },
        },
      }),

      /* --- Chemins sûrs --- */

      officiel: () => ({
        etape: 1,
        ton: "ok",
        titre: "Le site officiel de l’éditeur",
        texte:
          "<p>Une page sobre, une adresse qui correspond au nom du logiciel, un numéro de version et le nom de l’éditeur : ce sont de bons signes.</p>",
        consigne: "Téléchargez le logiciel.",
        ecran: uiNavigateur(
          "lectpdf.fr/telecharger",
          `<div class="off"><p class="off-logo">LectPDF</p><p>Lecteur PDF gratuit · Version 12.4 · Éditeur : LectPDF SAS</p><button class="ui-btn pri" type="button" data-go="uac_ok">Télécharger LectPDF 12.4</button></div>`,
        ),
        espion: terminal("Tableau de bord de l’attaquant", [["Victimes connectées", "0"]], "Cette personne n’est pas passée par le faux site…"),
        stEux: ["Aucun accès", ""],
        journal: [["[NAVIGATEUR] Visite de lectpdf.fr (site officiel de l’éditeur)", "ok"]],
      }),

      uac_ok: () => ({
        etape: 2,
        ton: "ok",
        titre: "Une alerte… rassurante",
        texte:
          "<p>Le système demande aussi une autorisation, mais cette fois l’éditeur est <b>vérifié</b> : le programme est signé numériquement. On sait qui l’a créé et qu’il n’a pas été modifié en route.</p>",
        consigne: "Comparez avec le faux site, puis autorisez l’installation.",
        ecran: `
          <div class="ui-dlg">
            <p class="ui-dlg-h">Contrôle de sécurité</p>
            <p><b>Autoriser cette application à apporter des modifications à votre appareil ?</b></p>
            <div class="ui-app">${ico("doc")} LectPDF_12.4_Setup.exe</div>
            <p class="ui-l">Éditeur vérifié : <b class="vert">LectPDF SAS</b></p>
            <p class="ui-l">Provenance : Internet (lectpdf.fr)</p>
            <div class="ui-btns"><button class="ui-btn" type="button" data-go="bilan_officiel">Oui</button><button class="ui-btn" type="button" data-go="intro">Non</button></div>
          </div>`,
        stMoi: ["Ordinateur sain", "ok"],
        journal: [["[SYSTÈME] Demande de droits administrateur — signature valide : LectPDF SAS", "ok"]],
      }),

      navigateur: () => ({
        etape: 1,
        ton: "ok",
        titre: "Le PDF s’ouvre… sans rien installer",
        texte:
          "<p>Les navigateurs web récents savent afficher les PDF. Aucun téléchargement, aucun programme inconnu : <b>aucun risque</b>.</p>",
        choix: [{ texte: "Voir le bilan", go: "bilan_navigateur", style: "" }],
        ecran: uiNavigateur("file:///C:/Users/vous/Téléchargements/dossier_inscription.pdf", PDF, false),
        espion: terminal("Tableau de bord de l’attaquant", [["Victimes connectées", "0"]], "Pas de téléchargement, pas de victime."),
        stMoi: ["Ordinateur sain", "ok"],
        stEux: ["Aucun accès", ""],
        journal: [["[NAVIGATEUR] Ouverture locale de dossier_inscription.pdf, aucun programme installé", "ok"]],
      }),

      /* --- Bilans --- */

      bilan: (e) => ({
        etape: 4,
        ton: "danger",
        titre: "Résultat : votre ordinateur est contrôlé à distance",
        texte: `<p>Vous avez installé un programme qui fonctionnait… et qui a ouvert une porte à l’attaquant. Il a exécuté <b>${e.cmds.size} ordre${e.cmds.size > 1 ? "s" : ""}</b> sur votre ordinateur, et vous n’avez presque rien vu : c’est exactement le but d’un trojan.</p>`,
        bilan: {
          stats: [
            ["Clics pour être infecté", "3", "rd"],
            ["Ordres de l’attaquant", e.cmds.size, "rd"],
            ["Signes visibles pour vous", signesVisibles(e), ""],
          ],
          passe: [
            "Une annonce payée a placé un faux site en tête des résultats.",
            "Le fichier téléchargé contenait le vrai lecteur PDF <b>et</b> une partie cachée.",
            "En cliquant « Oui », vous lui avez donné les droits administrateur : il s’est installé au démarrage de l’ordinateur.",
            "La porte dérobée contacte l’attaquant, qui envoie ses ordres sans que rien ne s’affiche.",
          ],
          indices: INDICES,
          proteger: PROTEGER,
          reagir: REAGIR,
        },
      }),

      annule: () => ({
        etape: 4,
        ton: "ok",
        titre: "Résultat : installation refusée, bien joué",
        texte:
          "<p>En lisant l’alerte, vous avez vu que l’éditeur était inconnu et vous avez cliqué « Non ». Le programme ne s’est pas installé : l’attaquant n’a aucun accès.</p>",
        bilan: {
          stats: [
            ["Ordres de l’attaquant", "0", "ok"],
            ["Fichier piégé", "encore dans Téléchargements", "am"],
          ],
          passe: [
            "Une annonce payée menait vers un faux site de téléchargement.",
            "Vous avez téléchargé le fichier, mais <b>refusé</b> de lui donner les droits.",
            "Tant qu’il n’est pas lancé, un trojan ne peut rien faire.",
          ],
          titreIndices: "Les indices repérables dès le départ",
          indices: INDICES,
          proteger: PROTEGER,
          reagir: [
            "Supprimer le fichier téléchargé, puis vider la corbeille.",
            "Lancer une analyse antivirus par précaution.",
            "Au moindre doute, se faire aider : <b>17cyber.gouv.fr</b>.",
          ],
        },
      }),

      bilan_officiel: () => ({
        etape: 4,
        ton: "ok",
        titre: "Résultat : bon choix, rien à signaler",
        texte:
          "<p>Vous avez pris le logiciel à la source : sur le site de son éditeur, avec une signature vérifiée. L’attaquant n’a jamais eu sa chance.</p>",
        bilan: {
          stats: [
            ["Ordres de l’attaquant", "0", "ok"],
            ["Éditeur", "vérifié", "ok"],
          ],
          passe: [
            "Vous avez ignoré l’annonce et choisi le site officiel de l’éditeur.",
            "L’alerte du système affichait un éditeur <b>vérifié</b>.",
            "Le logiciel installé est exactement celui qui est annoncé, sans partie cachée.",
          ],
          titreIndices: "Les pièges que vous avez évités",
          indices: INDICES,
          proteger: PROTEGER,
          reagir: REAGIR,
        },
      }),

      bilan_navigateur: () => ({
        etape: 4,
        ton: "ok",
        titre: "Résultat : le meilleur réflexe",
        texte:
          "<p>Pas besoin d’installer un logiciel pour ouvrir un PDF. Moins on installe de programmes, moins il y a de portes d’entrée pour un attaquant.</p>",
        bilan: {
          stats: [
            ["Ordres de l’attaquant", "0", "ok"],
            ["Programmes installés", "0", "ok"],
          ],
          passe: [
            "Vous avez lu un conseil fiable avant d’installer quoi que ce soit.",
            "Le navigateur, déjà présent et mis à jour, a ouvert le PDF.",
            "Aucun fichier inconnu n’est arrivé sur l’ordinateur.",
          ],
          titreIndices: "Les pièges que vous avez évités",
          indices: INDICES,
          proteger: PROTEGER,
          reagir: REAGIR,
        },
      }),
    },
  });
})();
