/* =====================================================================
   MalAware · Simulation « Keylogger » (enregistreur de frappes)
   ---------------------------------------------------------------------
   Scénario : un « jeu gratuit » a installé un keylogger. Vous vous
   connectez à votre banque : chaque touche apparaît côté espion.
   Deux protections à activer ou non : antivirus et double
   authentification. Si la double authentification bloque l’attaquant,
   il tente une arnaque au faux conseiller.

   Confidentialité : ce que vous tapez reste dans la page. Rien n’est
   envoyé ni enregistré ; tout est effacé quand on recommence.
   Les adresses IP utilisées (198.51.100.x) sont réservées à la documentation.
   ===================================================================== */
(() => {
  const SITE = "banque-exemple.fr";

  /* ---------- Capture des touches (uniquement dans la page) ---------- */

  // Ajoute une touche au journal de l’espion
  const capturer = (sim, texte, speciale = false) => {
    const e = sim.etat;
    if (e.av) return; // l’espion est en quarantaine : il ne voit rien
    e.nb++;
    const klog = sim.racine.querySelector("[data-klog]");
    if (!klog) return;
    klog.insertAdjacentHTML(
      "beforeend",
      speciale ? `<span class="k-sp">[${texte}]</span>` : `<span class="k">${esc(texte)}</span>`,
    );
    klog.scrollTop = klog.scrollHeight;
    sim.racine.querySelector("[data-kn]").textContent = e.nb;
  };

  // Met à jour la comparaison « ce que vous voyez / ce que l’espion lit »
  const comparer = (sim) => {
    const z = sim.racine.querySelector("[data-cmp]");
    if (!z) return;
    const m = sim.etat.mdp;
    z.innerHTML = `
      <div><small>Vous voyez</small><span>${m ? "●".repeat(m.length) : "—"}</span></div>
      <div><small>L’espion lit</small><b class="vole">${m ? esc(m) : "—"}</b></div>`;
  };

  const connexion = (sim) => {
    const e = sim.etat;
    if (!e.login.trim() || !e.mdp) {
      sim.racine.querySelector("[data-err]").textContent =
        "Remplissez les deux champs (avec des informations inventées).";
      return;
    }
    sim.aller("envoi");
  };

  // Bouton « Remplir l’exemple » : tape un faux identifiant, touche par touche
  const remplirExemple = (sim, bouton) => {
    const e = sim.etat,
      r = sim.racine;
    const id = r.querySelector("#kl-id"),
      mdp = r.querySelector("#kl-mdp");
    id.value = mdp.value = "";
    e.login = e.mdp = "";
    bouton.disabled = true;
    const sequence = [
      ...[..."alice.martin"].map((c) => [id, c]),
      [null, "TAB"],
      ...[..."Soleil2026!"].map((c) => [mdp, c]),
    ];
    sequence.forEach(([champ, c], k) =>
      sim.apres(110 * k, () => {
        if (!champ) return capturer(sim, c, true);
        champ.value += c;
        e.login = id.value;
        e.mdp = mdp.value;
        capturer(sim, c);
        comparer(sim);
      }),
    );
  };

  /* ---------- Morceaux d’écran ---------- */

  const compte = () =>
    uiNavigateur(
      `${SITE}/mes-comptes`,
      `<div class="bk">
        <p class="bk-logo">Banque Exemple</p>
        <p class="bk-h">Compte courant</p>
        <p class="solde" data-solde>2 340,50 €</p>
        <div class="ops"><div><span>Supermarché</span><span class="neg">−42,30 €</span></div><div><span>Salaire</span><span>+1 650,00 €</span></div></div>
      </div>`,
    );

  const telephone = '<div class="phone" data-tel><p class="tel-h">Votre téléphone</p></div>';

  const navigateurPirate = () =>
    `<div class="term"><p class="term-h">Navigateur de l’attaquant · ${SITE}</p><div class="att" data-att></div></div>`;

  // Fait apparaître des lignes dans la console de l’attaquant, une par une
  const derouler = (sim, lignes) =>
    lignes.forEach(([t, html]) =>
      sim.apres(t, () => sim.racine.querySelector("[data-att]").insertAdjacentHTML("beforeend", html)),
    );

  /* ---------- Textes des bilans ---------- */

  const INDICES = [
    "Le keylogger est arrivé avec un « jeu gratuit » téléchargé sur un forum.",
    "Il se cache sous un nom qui imite un programme du système (svchost_update.exe).",
    "Signes possibles : ordinateur plus lent, antivirus désactivé tout seul, activité réseau inhabituelle… mais bien souvent, aucun signe.",
  ];
  const PROTEGER = [
    "Garder un <b>antivirus à jour</b> : il reconnaît la plupart des keyloggers connus.",
    "Activer la <b>double authentification</b> sur les comptes importants (banque, messagerie).",
    "Ne jamais communiquer un code reçu par SMS, même à quelqu’un qui dit appeler de votre banque.",
    "N’installer des programmes que depuis des sources officielles, jamais un « jeu gratuit » trouvé sur un forum.",
    "Utiliser un gestionnaire de mots de passe : il remplit les champs sans passer par le clavier, ce qui limite ce qu’un keylogger simple peut lire.",
  ];
  const REAGIR = [
    "Appeler votre banque au numéro officiel (au dos de la carte) pour bloquer les opérations.",
    "Changer vos mots de passe <b>depuis un autre appareil sain</b>.",
    "Nettoyer l’ordinateur avec un antivirus à jour, ou le faire réinstaller.",
    "Porter plainte et se faire accompagner : <b>17cyber.gouv.fr</b>.",
  ];

  /* ---------- Les scènes ---------- */

  monterSimulation("keylogger", {
    titre: "Keylogger",
    etapes: ["Protections", "Saisie", "Envoi", "Attaque", "Bilan"],
    autres: '<a href="trojan.html#demo">Trojan</a> · <a href="ransomware.html#demo">Ransomware</a>',
    etatInitial: () => ({ av: false, a2f: false, login: "", mdp: "", nb: 0 }),

    scenes: {
      intro: (e) => ({
        etape: 0,
        ton: "info",
        titre: "Un « jeu gratuit » cachait un espion",
        texte:
          "<p>Hier, vous avez installé un petit jeu trouvé sur un forum. Sans le savoir, il a aussi installé un <b>keylogger</b> : un programme qui enregistre chaque touche tapée sur le clavier. Aujourd’hui, vous allez consulter votre compte en banque.</p>",
        consigne:
          "Choisissez les protections de votre ordinateur, puis allumez-le. Astuce : jouez une fois sans protection, puis une fois avec.",
        choix: [{ texte: "Allumer l’ordinateur", act: "demarrer", style: "" }],
        ecran: `
          <p class="ui-l">Protections de votre ordinateur</p>
          <label class="opt"><input type="checkbox" data-champ="av"${e.av ? " checked" : ""}><span><b>Antivirus à jour</b>Il compare chaque programme à une liste de menaces connues, mise à jour tous les jours.</span></label>
          <label class="opt"><input type="checkbox" data-champ="a2f"${e.a2f ? " checked" : ""}><span><b>Double authentification</b>Pour se connecter, la banque demande le mot de passe <b>et</b> un code reçu sur votre téléphone.</span></label>`,
        espion: terminal(
          "Programme espion caché sur votre PC",
          [
            ["Nom", "svchost_update.exe"],
            indice("Un nom qui imite un programme du système pour passer inaperçu."),
            ["Arrivé avec", "« SuperJeu_gratuit.exe »"],
            ["Lancement", "à chaque démarrage"],
          ],
          "En sommeil : attend que vous tapiez quelque chose",
        ),
        stMoi: ["Infecté (sans le savoir)", "alerte"],
        stEux: ["En attente", ""],
        actions: {
          demarrer: (sim) => sim.aller(sim.etat.av ? "demarrage" : "saisie"),
        },
      }),

      demarrage: () => ({
        etape: 0,
        ton: "ok",
        titre: "L’antivirus a repéré l’espion",
        texte:
          "<p>Au démarrage, l’antivirus analyse les programmes lancés. Grâce à sa mise à jour du jour, il reconnaît le keylogger et le place en <b>quarantaine</b> : isolé, il ne peut plus rien faire.</p>",
        choix: [{ texte: "Aller sur le site de la banque", go: "saisie", style: "" }],
        ecran: `<div class="av-notif pop"><b>${ico("bouclier")} Menace bloquée</b><span>Spyware.Keylogger dans svchost_update.exe</span><small>Fichier placé en quarantaine · à l’instant</small></div>`,
        espion: terminal(
          "Programme espion",
          [["État", "en quarantaine ✕"]],
          "Plus aucun contact avec l’attaquant",
        ),
        stMoi: ["Protégé", "ok"],
        stEux: ["Connexion perdue", "ok"],
        flux: "cut",
        journal: [["[ANTIVIRUS] svchost_update.exe détecté (signature Spyware.Keylogger) → quarantaine", "ok"]],
      }),

      saisie: (e) => ({
        etape: 1,
        ton: e.av ? "ok" : "danger",
        titre: "Connectez-vous à votre banque",
        texte: e.av
          ? "<p>L’espion est en quarantaine. Tapez un identifiant et un mot de passe <b>inventés</b> : rien n’apparaît du côté de l’attaquant.</p>"
          : "<p>Le keylogger est actif. Tapez un identifiant et un mot de passe <b>inventés</b>, et regardez le panneau « Côté attaquant » : chaque touche y apparaît, même celles du mot de passe que vous voyez masqué.</p>",
        consigne:
          "Tapez dans le formulaire, ou cliquez sur « Remplir l’exemple ». N’utilisez jamais un vrai mot de passe.",
        ecran: uiNavigateur(
          `${SITE}/connexion`,
          `
          ${indice("Le cadenas protège le trajet vers la banque… mais le keylogger lit les touches <b>avant</b>, directement sur votre clavier.")}
          <div class="login">
            <p class="bk-logo">Banque Exemple</p>
            <label for="kl-id">Identifiant</label>
            <input id="kl-id" type="text" autocomplete="off" autocapitalize="off" spellcheck="false">
            <label for="kl-mdp">Mot de passe</label>
            <input id="kl-mdp" type="password" autocomplete="off">
            <p class="err" data-err role="alert"></p>
            <button class="ui-btn pri" type="button" data-act="connexion">Se connecter</button>
          </div>
          <p class="avert">Simulation : n’entrez pas un vrai mot de passe. Rien n’est envoyé ni enregistré.</p>
          <p class="ctr"><button class="ui-lien" type="button" data-act="auto">Remplir l’exemple</button></p>`,
        ),
        espion: e.av
          ? terminal("Programme espion", [["État", "en quarantaine ✕"], ["Touches capturées", "0"]], "Rien à enregistrer")
          : `
          <div class="term">
            <p class="term-h">Journal de frappes · svchost_update.exe</p>
            <p class="k-ctx">Enregistré en cachette sur votre PC, avant l’envoi</p>
            <div class="klog" data-klog><span class="k-win">[${heure()}] Fenêtre : « Banque Exemple — Connexion »</span></div>
            <div class="kv"><span>Touches capturées</span><b data-kn>0</b></div>
            <div class="cmp" data-cmp></div>
          </div>`,
        stMoi: e.av ? ["Protégé", "ok"] : ["Infecté (sans le savoir)", "danger"],
        stEux: e.av ? ["Inactif", "ok"] : ["Enregistre vos touches", "danger"],
        flux: e.av ? "cut" : "",
        journal: e.av ? [] : [["[KEYLOGGER] Fenêtre active : « Banque Exemple — Connexion » → enregistrement des touches", "rd"]],
        actions: { connexion, auto: remplirExemple },
        entree: (sim) => {
          const r = sim.racine;
          const id = r.querySelector("#kl-id"),
            mdp = r.querySelector("#kl-mdp");
          comparer(sim);
          [id, mdp].forEach((champ) => {
            champ.addEventListener("input", (ev) => {
              e.login = id.value;
              e.mdp = mdp.value;
              comparer(sim);
              const t = ev.inputType || "";
              if (t === "insertCompositionText") return; // saisie en cours (claviers spéciaux)
              if (t === "insertFromPaste") capturer(sim, "CTRL+V", true);
              else if (t.startsWith("insert") && ev.data) capturer(sim, ev.data);
              else if (t === "deleteContentBackward") capturer(sim, "⌫", true);
              else if (t.startsWith("delete")) capturer(sim, "SUPPR", true);
            });
            champ.addEventListener("compositionend", (ev) => ev.data && capturer(sim, ev.data));
            champ.addEventListener("keydown", (ev) => {
              if (ev.key === "Tab") capturer(sim, "TAB", true);
              if (ev.key === "Enter") {
                ev.preventDefault();
                capturer(sim, "ENTRÉE", true);
                connexion(sim);
              }
            });
          });
        },
      }),

      envoi: (e) =>
        e.av
          ? {
              etape: 2,
              ton: "ok",
              titre: "La connexion fonctionne… et rien n’a fuité",
              texte:
                "<p>L’espion étant en quarantaine, aucune touche n’a été enregistrée. Il n’y a rien à envoyer à l’attaquant.</p>",
              choix: [{ texte: "Voir le bilan", go: "bilan_av", style: "" }],
              ecran: compte(),
              espion: terminal("Serveur de l’attaquant", [["Rapports reçus", "0"]], "Plus aucune nouvelle du programme espion…"),
              stEux: ["Connexion perdue", "ok"],
              flux: "cut",
            }
          : {
              etape: 2,
              ton: "danger",
              titre: "La connexion fonctionne… pour vous et pour l’espion",
              texte:
                "<p>Vous voyez votre compte, tout est normal. Pendant ce temps, le keylogger envoie son journal à l’attaquant par Internet. Celui-ci y retrouve sans effort votre identifiant et votre mot de passe, <b>en clair</b>.</p><p>Le cadenas du site n’y change rien : les touches ont été lues sur votre clavier, <b>avant</b> d’être chiffrées pour partir vers la banque.</p>",
              choix: [{ texte: "Voir ce que fait l’attaquant", go: "attaque", style: "" }],
              ecran: compte(),
              espion: terminal(
                "Rapport reçu · victime n°1 284",
                [
                  ["Site détecté", "Banque Exemple"],
                  ["Identifiant", `<span class="vole">${esc(e.login)}</span>`],
                  ["Mot de passe", `<span class="vole">${esc(e.mdp)}</span>`],
                  ["Touches enregistrées", e.nb],
                ],
                "Tentative de connexion à la banque…",
              ),
              stEux: ["Identifiants volés", "danger"],
              flux: "on",
              journal: [[`[RÉSEAU] Envoi du journal de frappes (${e.nb} touches) vers 198.51.100.23 (adresse fictive)`, "rd"]],
            },

      attaque: (e) =>
        e.a2f
          ? {
              etape: 3,
              ton: "alerte",
              titre: "L’attaquant essaie… mais la banque demande un code",
              texte:
                "<p>Le mot de passe est bon, mais la banque envoie un <b>code à usage unique</b> sur <b>votre</b> téléphone. Sans lui, l’attaquant est bloqué. Alors il tente autre chose : il vous appelle en se faisant passer pour la banque.</p>",
              consigne: "Regardez votre téléphone, sur votre écran.",
              ecran: compte() + telephone,
              espion: navigateurPirate(),
              stEux: ["Bloqué par le code", "alerte"],
              flux: "",
              entree: (sim) => {
                derouler(sim, [
                  [500, `<div>&gt; Identifiant : <span class="vole">${esc(e.login)}</span></div>`],
                  [1100, `<div>&gt; Mot de passe : <span class="vole">${esc(e.mdp)}</span></div>`],
                  [1800, '<div class="ko">✕ Code de vérification demandé (envoyé au téléphone de la victime)</div>'],
                  [3000, "<div>&gt; Plan B : appeler la victime en se faisant passer pour sa banque…</div>"],
                ]);
                const tel = () => sim.racine.querySelector("[data-tel]");
                sim.apres(1900, () => {
                  tel().insertAdjacentHTML(
                    "beforeend",
                    `<div class="notif"><small>SMS · Banque Exemple</small>Votre code de connexion est <b>482 913</b>. Ne le communiquez à personne, même à un conseiller.</div>${indice("Le SMS le dit lui-même : ce code ne se donne à personne.")}`,
                  );
                  sim.journal("[BANQUE] Connexion depuis un appareil inconnu → code envoyé par SMS au titulaire", "am");
                  sim.majIndices();
                });
                sim.apres(3600, () => {
                  tel().insertAdjacentHTML(
                    "beforeend",
                    `<div class="appel pop"><small>Appel entrant</small><b>01 23 45 67 89</b><span>« Banque Exemple — Service fraude »</span></div>
                     ${indice("Le numéro affiché peut être falsifié : il ne prouve pas que c’est votre banque.")}
                     <p class="bulle pop">« Bonjour, ici le service fraude de Banque Exemple. Une opération suspecte vient d’être détectée sur votre compte. Pour la bloquer, lisez-moi vite le code que vous venez de recevoir. »</p>
                     ${indice("Urgence et peur : c’est une technique de manipulation. Un vrai conseiller ne demande jamais ce code.")}`,
                  );
                  sim.statut("moi", "Appel en cours", "alerte");
                  sim.journal("[TÉLÉPHONE] Appel entrant, numéro affiché usurpé (simulation)", "am");
                  sim.choix([
                    { texte: "Donner le code", go: "bilan_code" },
                    { texte: "Raccrocher et rappeler ma banque au numéro officiel", go: "bilan_a2f" },
                  ]);
                  sim.majIndices();
                });
              },
            }
          : {
              etape: 3,
              ton: "danger",
              titre: "L’attaquant se connecte à votre compte",
              texte:
                "<p>Depuis son propre ordinateur, il entre votre identifiant et votre mot de passe sur le site de la banque. Pour la banque, <b>le mot de passe est bon</b>, donc c’est vous. Rien ne l’arrête.</p>",
              consigne: "Regardez votre solde et votre téléphone.",
              choix: [{ texte: "Voir le bilan", go: "bilan_vole", style: "" }],
              ecran: compte() + telephone,
              espion: navigateurPirate(),
              stEux: ["Dans votre compte", "danger"],
              flux: "",
              entree: (sim) => {
                derouler(sim, [
                  [500, `<div>&gt; Identifiant : <span class="vole">${esc(e.login)}</span></div>`],
                  [1100, `<div>&gt; Mot de passe : <span class="vole">${esc(e.mdp)}</span></div>`],
                  [1800, '<div class="okk">✓ Connexion réussie · solde : 2 340,50 €</div>'],
                  [2700, "<div>&gt; Virement de 1 900,00 € vers FR76 XXXX… (compte d’un complice, fictif)</div>"],
                  [3500, '<div class="okk">✓ Virement envoyé</div>'],
                ]);
                sim.apres(3600, () => {
                  const r = sim.racine;
                  r.querySelector("[data-solde]").textContent = "440,50 €";
                  r.querySelector(".ops").insertAdjacentHTML(
                    "afterbegin",
                    '<div class="pop"><span>Virement émis</span><span class="neg">−1 900,00 €</span></div>',
                  );
                  r.querySelector("[data-tel]").insertAdjacentHTML(
                    "beforeend",
                    '<div class="notif"><small>Banque Exemple · maintenant</small>Un virement de 1 900,00 € a été effectué depuis votre compte.</div>',
                  );
                  sim.statut("moi", "Compte vidé", "danger");
                  sim.journal("[BANQUE] Connexion depuis un appareil inconnu, puis virement de 1 900 € (fictif)", "rd");
                });
              },
            },

      /* --- Bilans --- */

      bilan_vole: (e) => ({
        etape: 4,
        ton: "danger",
        titre: "Résultat : l’attaquant a vidé votre compte",
        texte:
          "<p>Avec votre seul mot de passe, l’attaquant s’est connecté comme s’il était vous. Aucune protection ne l’a arrêté.</p>",
        bilan: {
          stats: [
            ["Touches capturées", e.nb, "rd"],
            ["Argent perdu", "1 900 € (fictif)", "rd"],
            ["Protections actives", "0 / 2", "rd"],
          ],
          passe: [
            "Le keylogger a enregistré toutes vos touches, y compris le mot de passe masqué à l’écran.",
            "Il a envoyé ce journal à l’attaquant, qui y a lu vos identifiants en clair.",
            "Le mot de passe suffisait pour se connecter : l’attaquant a fait un virement.",
          ],
          indices: INDICES,
          proteger: PROTEGER,
          reagir: REAGIR,
        },
      }),

      bilan_code: (e) => ({
        etape: 4,
        ton: "danger",
        titre: "Résultat : le code a suffi à l’attaquant",
        texte:
          "<p>La double authentification l’avait bloqué… jusqu’à ce que vous lui donniez le code. Il s’est connecté et a vidé le compte. C’est de l’<b>ingénierie sociale</b> : manipuler la personne plutôt que la machine.</p>",
        bilan: {
          stats: [
            ["Touches capturées", e.nb, "rd"],
            ["Argent perdu", "1 900 € (fictif)", "rd"],
            ["Protections actives", "1 / 2", "am"],
          ],
          passe: [
            "Le keylogger a volé votre mot de passe.",
            "La double authentification a bloqué la première tentative de l’attaquant.",
            "Il a téléphoné en se faisant passer pour la banque, et a obtenu le code.",
          ],
          titreIndices: "Les indices de l’appel piège",
          indices: [
            "Le SMS précisait : « Ne le communiquez à personne, même à un conseiller ».",
            "L’appel arrivait juste après le SMS, avec un ton urgent et inquiétant.",
            "Un numéro affiché peut être falsifié : il ne prouve rien.",
            ...INDICES,
          ],
          proteger: PROTEGER,
          reagir: REAGIR,
        },
      }),

      bilan_a2f: (e) => ({
        etape: 4,
        ton: "ok",
        titre: "Résultat : votre compte est sauvé… mais votre mot de passe est connu",
        texte:
          "<p>La double authentification a bloqué l’attaquant, et vous avez déjoué le piège du faux conseiller. Attention : le keylogger est toujours là et votre mot de passe a été volé.</p>",
        bilan: {
          stats: [
            ["Touches capturées", e.nb, "am"],
            ["Argent perdu", "0 €", "ok"],
            ["Mot de passe", "volé : à changer", "am"],
          ],
          passe: [
            "Le keylogger a volé votre mot de passe.",
            "La banque a demandé un code envoyé sur <b>votre</b> téléphone : l’attaquant était bloqué.",
            "Vous avez raccroché au lieu de donner le code, puis rappelé la banque au numéro officiel.",
          ],
          indices: INDICES,
          proteger: PROTEGER,
          reagir: [
            "Changer votre mot de passe <b>depuis un autre appareil sain</b> : il a été volé.",
            "Nettoyer l’ordinateur : le keylogger est toujours actif.",
            "Signaler l’appel frauduleux à votre banque, et les SMS suspects au <b>33700</b>.",
            "Se faire aider : <b>17cyber.gouv.fr</b>.",
          ],
        },
      }),

      bilan_av: (e) => ({
        etape: 4,
        ton: "ok",
        titre: "Résultat : l’antivirus a neutralisé l’espion",
        texte:
          "<p>Un antivirus <b>à jour</b> a reconnu le keylogger dès le démarrage. Rien n’a été enregistré, rien n’a été envoyé.</p>",
        bilan: {
          stats: [
            ["Touches capturées", "0", "ok"],
            ["Argent perdu", "0 €", "ok"],
            ["Protections actives", e.a2f ? "2 / 2" : "1 / 2", "ok"],
          ],
          passe: [
            "Le « jeu gratuit » avait bien installé un keylogger.",
            "L’antivirus, mis à jour le jour même, l’a reconnu et placé en quarantaine.",
            "Vos identifiants n’ont jamais quitté votre ordinateur.",
          ],
          titreIndices: "Les signes d’un keylogger",
          indices: INDICES,
          proteger: PROTEGER,
          reagir: REAGIR,
        },
      }),
    },
  });
})();
