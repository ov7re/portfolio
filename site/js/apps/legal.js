/**
 * Mentions légales et politique de confidentialité.
 *
 * Les informations sur l'éditeur viennent de la section « Mentions légales »
 * du logiciel. La politique décrit ce que fait réellement le serveur : à
 * modifier en même temps que lui (formulaire, mesure d'audience, stockage).
 */

import { escapeHtml as e, formatDate } from '/shared/util.js';

const TABS = [
  { id: '', label: 'Mentions légales' },
  { id: 'confidentialite', label: 'Confidentialité' },
];

const duration = (months) =>
  months % 12 === 0 ? `${months / 12} an${months > 12 ? 's' : ''}` : `${months} mois`;

const lines = (text) => e(text).replace(/\n/g, '<br>');

export default {
  id: 'legal',
  route: 'mentions-legales',
  title: 'Mentions légales',
  icon: 'shield',
  tone: 'slate',
  size: [760, 640],
  subRoutes: true,
  desktop: false,

  render(body, { content, os, params }) {
    const { identity, legal } = content;
    const email = legal.email || identity.email;
    const mail = email ? `<a href="mailto:${e(email)}">${e(email)}</a>` : '';
    let current = TABS.some((t) => t.id === params.sub) ? params.sub : '';

    const row = (label, value) => (value ? `<div><dt>${label}</dt><dd>${value}</dd></div>` : '');

    const panels = {
      '': () => `
        <h1 class="h1">Mentions légales</h1>
        <section class="section">
          <h2 class="h2">Éditeur du site</h2>
          <dl class="specs legal-specs">
            ${row('Éditeur', e(legal.editor))}
            ${row('Statut', e(legal.status))}
            ${row('SIREN', e(legal.siren))}
            ${row('Adresse', lines(legal.address))}
            ${row('E-mail', mail)}
            ${row('Téléphone', e(legal.phone))}
          </dl>
        </section>
        <section class="section prose">
          <h2 class="h2">Directeur de la publication</h2>
          <p>${e(legal.director || legal.editor)}</p>
        </section>
        <section class="section prose">
          <h2 class="h2">Hébergement</h2>
          <p>${lines(legal.host)}</p>
        </section>
        <section class="section prose">
          <h2 class="h2">Propriété intellectuelle</h2>
          <p>Les textes, visuels et le code de ce site sont la propriété de ${e(legal.editor)}, sauf mention contraire. Toute reproduction, même partielle, sans autorisation préalable est interdite. Les noms et marques cités (FiveM, Minecraft, Roblox, Discord…) appartiennent à leurs propriétaires respectifs.</p>
        </section>
        <section class="section prose">
          <h2 class="h2">Crédits</h2>
          <p>Polices Geist et Geist Mono © Vercel, sous licence SIL Open Font License 1.1, hébergées sur ce site.</p>
        </section>`,

      confidentialite: () => `
        <h1 class="h1">Politique de confidentialité</h1>
        <p class="lead" style="margin-top:12px">Ce site collecte le moins de données possible : aucun cookie publicitaire ni de mesure d’audience, aucune revente, aucun profilage.</p>

        <section class="section prose">
          <h2 class="h2">Responsable du traitement</h2>
          <p>${e(legal.editor)}${mail ? ` — ${mail}` : ''}.</p>
        </section>

        <section class="section prose">
          <h2 class="h2">Formulaire de contact</h2>
          <p>Lorsque vous envoyez une demande, sont enregistrés : votre nom, votre adresse e-mail, le type de projet, le budget et le délai indiqués, et votre message.</p>
          <p>Ces données servent uniquement à répondre à votre demande et, le cas échéant, à établir un devis. Ce traitement repose sur les mesures précontractuelles prises à votre demande (article 6.1.b du RGPD).</p>
          <p>Elles sont stockées sur le serveur de l’éditeur, en France, et ne sont lues que par lui.${legal.discord ? ' Une notification contenant votre demande est également envoyée à l’éditeur sur Discord (Discord Inc., États-Unis).' : ''} Elles sont supprimées automatiquement ${e(duration(legal.messagesRetention))} après leur réception.</p>
        </section>

        <section class="section prose">
          <h2 class="h2">Mesure d’audience</h2>
          <p>Le site compte les pages vues et les visiteurs uniques par jour, sans cookie. Pour reconnaître un même visiteur au cours d’une journée, le serveur calcule une empreinte à partir de l’adresse IP et du navigateur, mélangée à une valeur aléatoire renouvelée chaque jour. Cette empreinte reste en mémoire et n’est jamais enregistrée : seuls les totaux quotidiens sont conservés, pendant 90 jours.</p>
        </section>

        <section class="section prose">
          <h2 class="h2">Cookies et stockage local</h2>
          <p>Le site ne dépose aucun cookie. Cloudflare peut seulement poser un cookie technique de sécurité, sans suivi, s’il doit vérifier qu’une visite ne provient pas d’un robot. Le site garde dans votre navigateur vos préférences d’affichage (thème, couleur, fond d’écran, animations), le fait d’avoir déjà vu l’écran de démarrage et la fermeture du bandeau d’information. Ces informations ne quittent jamais votre appareil ; vous pouvez les effacer depuis Paramètres ou les réglages de votre navigateur.</p>
        </section>

        <section class="section prose">
          <h2 class="h2">Hébergement et prestataires</h2>
          <p>Le site est servi depuis un serveur de l’éditeur situé en France. Les connexions transitent par Cloudflare, qui traite les adresses IP et les données techniques nécessaires pour acheminer le site et le protéger des attaques. Cloudflare peut traiter ces données aux États-Unis, dans le cadre du Data Privacy Framework UE–États-Unis.</p>
          <p>Les polices sont hébergées sur le site : aucune donnée n’est transmise à Google ou à un autre service tiers.</p>
        </section>

        <section class="section prose">
          <h2 class="h2">Vos droits</h2>
          <p>Vous pouvez accéder à vos données, les faire rectifier ou supprimer, vous opposer à leur traitement ou en demander la limitation et la portabilité${mail ? ` en écrivant à ${mail}` : ''}. Vous pouvez aussi adresser une réclamation à la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>).</p>
        </section>

        ${legal.extra ? `<section class="section prose"><h2 class="h2">Précisions</h2><p>${lines(legal.extra)}</p></section>` : ''}`,
    };

    body.innerHTML = `
      <div class="app legal">
        <div class="tabs" role="tablist">
          ${TABS.map((t) => `<button type="button" role="tab" data-tab="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div class="legal__panel" role="tabpanel"></div>
        ${legal.updatedAt ? `<p class="muted legal__date">Dernière mise à jour : ${e(formatDate(legal.updatedAt))}</p>` : ''}
      </div>`;

    const panel = body.querySelector('.legal__panel');
    const show = (id) => {
      current = id;
      panel.innerHTML = panels[id]();
      for (const b of body.querySelectorAll('[data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === id));
      os.setTitle('Mentions légales', id ? TABS.find((t) => t.id === id).label : '');
    };

    body.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-tab]');
      if (!tab || tab.dataset.tab === current) return;
      show(tab.dataset.tab);
      os.navigate(tab.dataset.tab);
    });

    show(current);
    return {
      update(next) {
        const sub = next.sub || '';
        if (TABS.some((t) => t.id === sub) && sub !== current) show(sub);
      },
    };
  },
};
