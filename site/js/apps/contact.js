/** Contact : coordonnées, tarifs indicatifs et formulaire de demande de devis. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e, safeHref } from '/shared/util.js';
import { sendContact } from '../api.js';
import { copy, toast } from '../ui.js';

export default {
  id: 'contact',
  route: 'contact',
  title: 'Contact',
  icon: 'mail',
  tone: 'accent',
  size: [980, 680],

  render(body, { content, os, params }) {
    const { identity, contact, pricing, socials } = content;
    const options = (list, placeholder) =>
      `<option value="">${e(placeholder)}</option>${list.map((v) => `<option>${e(v)}</option>`).join('')}`;

    body.innerHTML = `
      <div class="contact">
        <aside class="contact__side">
          <div>
            <p class="kicker">Coordonnées</p>
            <div style="margin-top:10px">
              ${identity.email ? `
                <button class="coord" type="button" data-copy="${e(identity.email)}" data-label="Adresse e-mail copiée">
                  ${icon('mail')}<span><small>E-mail</small><strong>${e(identity.email)}</strong></span>${icon('copy')}
                </button>` : ''}
              ${identity.discord ? `
                <button class="coord" type="button" data-copy="${e(identity.discord)}" data-label="Pseudo Discord copié">
                  ${icon('discord')}<span><small>Discord</small><strong>${e(identity.discord)}</strong></span>${icon('copy')}
                </button>` : ''}
              ${socials.links.filter((l) => safeHref(l.href)).map((l) => `
                <a class="coord" href="${e(safeHref(l.href))}" target="_blank" rel="noopener me">
                  ${icon(l.icon)}<span><small>${e(l.label)}</small><strong>${e(l.href.replace(/^https?:\/\/(www\.)?/, ''))}</strong></span>${icon('external')}
                </a>`).join('')}
            </div>
            <p class="muted" style="margin-top:12px;font-size:13px;display:flex;gap:8px;align-items:center">
              <i class="status-dot" data-status="${e(identity.availability)}"></i>${e(identity.availabilityLabel)}
            </p>
            ${identity.responseTime ? `<p class="muted" style="font-size:13px;margin-top:4px">${e(identity.responseTime)}</p>` : ''}
          </div>
          ${pricing.items.length ? `
            <div>
              <p class="kicker">Tarifs indicatifs</p>
              <div class="prices" style="margin-top:10px">
                ${pricing.items.map((p) => `
                  <div class="price"><strong>${e(p.scope)}</strong><b>dès ${e(p.from)}</b><small>${e(p.detail)}</small></div>`).join('')}
              </div>
              ${pricing.notice ? `<p class="muted" style="font-size:12px;margin-top:10px">${e(pricing.notice)}</p>` : ''}
            </div>` : ''}
        </aside>

        <div class="contact__main">
          <div class="contact__form">
            <p class="kicker">Nouveau message</p>
            <h1 class="h1" style="margin-top:8px">Parlons de votre projet</h1>
            ${contact.intro ? `<p class="lead" style="margin-top:6px">${e(contact.intro)}</p>` : ''}
            <form class="form" novalidate>
              <div class="form__row">
                <label class="field"><span>Nom</span><input name="name" autocomplete="name" required maxlength="80"></label>
                <label class="field"><span>E-mail</span><input name="email" type="email" autocomplete="email" required maxlength="200"></label>
              </div>
              ${contact.projectTypes.length ? `
                <fieldset class="field" style="border:0;padding:0;margin:0">
                  <span>Type de projet</span>
                  <div class="choice">
                    ${contact.projectTypes.map((t) => `<label><input type="radio" name="type" value="${e(t)}"><span>${e(t)}</span></label>`).join('')}
                  </div>
                </fieldset>` : ''}
              <div class="form__row">
                ${contact.budgets.length ? `<label class="field"><span>Budget</span><select name="budget">${options(contact.budgets, 'Non précisé')}</select></label>` : ''}
                ${contact.deadlines.length ? `<label class="field"><span>Délai</span><select name="deadline">${options(contact.deadlines, 'Non précisé')}</select></label>` : ''}
              </div>
              <label class="field">
                <span>Votre projet</span>
                <textarea name="message" required maxlength="5000" placeholder="Contexte, fonctionnalités attendues, contraintes…"></textarea>
                <small class="field__hint" data-count>0 / 5000</small>
              </label>
              <label class="trap" aria-hidden="true">Site web<input name="website" tabindex="-1" autocomplete="off"></label>
              <div class="form__foot">
                <p class="muted" style="font-size:12px">Vos informations servent uniquement à vous répondre.${content.legal.editor ? ' <a href="/mentions-legales/confidentialite" data-legal="confidentialite">En savoir plus</a>' : ''}</p>
                <button class="btn btn--primary" type="submit">${icon('send')}Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;

    const form = body.querySelector('form');
    const counter = body.querySelector('[data-count]');
    const prefill = (p) => {
      if (p.about && !form.elements.message.value) form.elements.message.value = `Bonjour, je souhaiterais un projet similaire à « ${p.about} ».\n\n`;
      counter.textContent = `${form.elements.message.value.length} / 5000`;
    };
    prefill(params);

    body.addEventListener('click', (event) => {
      const target = event.target.closest('[data-copy]');
      if (target) copy(target.dataset.copy, target.dataset.label);
    });

    form.elements.message.addEventListener('input', () => (counter.textContent = `${form.elements.message.value.length} / 5000`));

    function showErrors(errors) {
      for (const field of form.querySelectorAll('.field')) {
        field.classList.remove('has-error');
        field.querySelector('.field__error')?.remove();
      }
      for (const [name, text] of Object.entries(errors)) {
        const field = form.elements[name]?.closest('.field');
        if (!field) continue;
        field.classList.add('has-error');
        field.insertAdjacentHTML('beforeend', `<small class="field__error">${e(text)}</small>`);
      }
      const first = Object.keys(errors)[0];
      if (first) form.elements[first]?.focus();
    }

    function validate(data) {
      const errors = {};
      if (data.name.trim().length < 2) errors.name = 'Indiquez votre nom.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) errors.email = 'Adresse e-mail invalide.';
      if (data.message.trim().length < 20) errors.message = 'Décrivez votre projet en quelques phrases (20 caractères minimum).';
      return errors;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      data.type ||= '';
      const errors = validate(data);
      showErrors(errors);
      if (Object.keys(errors).length) return;

      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      button.innerHTML = `${icon('refresh')}Envoi…`;
      try {
        const result = await sendContact(data);
        body.querySelector('.contact__form').innerHTML = `
          <div class="sent">
            <span class="sent__check">${icon('check')}</span>
            <h2 class="h1">Message envoyé</h2>
            <p class="lead">${e(result.message || contact.successMessage)}</p>
            <button class="btn" type="button" data-close>Fermer</button>
          </div>`;
        body.querySelector('[data-close]').addEventListener('click', () => os.close());
        toast({ title: 'Message envoyé', text: 'Merci, je reviens vers vous rapidement.', iconName: 'check', tone: 'emerald' });
      } catch (error) {
        button.disabled = false;
        button.innerHTML = `${icon('send')}Envoyer`;
        if (error.status === 422) return showErrors(error.details);
        // Repli : le message part par le client e-mail du visiteur.
        if (identity.email && !error.status) {
          const subject = encodeURIComponent(`Demande de devis — ${data.type || 'projet'}`);
          const text = encodeURIComponent(`${data.message}\n\n${data.name}\nBudget : ${data.budget || '—'}\nDélai : ${data.deadline || '—'}`);
          location.href = `mailto:${identity.email}?subject=${subject}&body=${text}`;
        }
        toast({ title: 'Envoi impossible', text: error.message, iconName: 'alert', tone: 'slate' });
      }
    });

    return { update: prefill };
  },
};
