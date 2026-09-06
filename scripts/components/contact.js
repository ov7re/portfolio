/**
 * Section contact : coordonnées directes, grille tarifaire indicative et
 * formulaire de demande de devis.
 *
 * Le formulaire est validé côté client puis envoyé :
 *   - à `formConfig.endpoint` si une API est configurée ;
 *   - sinon via le repli e-mail (mailto), pour ne jamais perdre une demande.
 *
 * Aucun secret ne transite ici : la protection anti-spam sérieuse et l'envoi
 * réel (e-mail, Discord, CRM) appartiennent au backend.
 */

import { qs, qsa, html, raw, render } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { contacts, formConfig, responseTime } from '../data/site.js';
import { projectTypes, budgetRanges, deadlines } from '../data/form.js';
import { pricing, pricingNotice } from '../data/content.js';
import { t } from '../i18n/index.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const MIN_MESSAGE_LENGTH = 30;

/* ------------------------------------------------------------------ */
/* Coordonnées directes                                               */
/* ------------------------------------------------------------------ */

function contactItem(item) {
  return html`
    <button type="button" class="contact-item" data-copy="${item.copy}">
      <span class="contact-item__icon">${raw(icon(item.icon))}</span>
      <span class="contact-item__info">
        <span class="contact-item__label">${item.label}</span>
        <span class="contact-item__value">${item.value}</span>
      </span>
      <span class="contact-item__action">${t('common.copy', 'Copier')}</span>
    </button>
  `;
}

async function copyValue(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Repli pour les navigateurs sans API presse-papiers ou hors contexte sécurisé
    const helper = document.createElement('textarea');
    helper.value = value;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    let done = false;
    try {
      done = document.execCommand('copy');
    } catch {
      done = false;
    }
    document.body.removeChild(helper);
    return done;
  }
}

function mountContactList(selector) {
  const list = qs(selector);
  if (!list) return;

  render(list, contacts.map(contactItem).join(''));

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;

    const action = qs('.contact-item__action', button);
    const copied = await copyValue(button.dataset.copy);
    if (!copied) return;

    button.classList.add('is-copied');
    action.textContent = t('common.copied', 'Copié');
    window.setTimeout(() => {
      button.classList.remove('is-copied');
      action.textContent = t('common.copy', 'Copier');
    }, 1800);
  });
}

/* ------------------------------------------------------------------ */
/* Grille tarifaire indicative                                        */
/* ------------------------------------------------------------------ */

function mountPricing(selector) {
  const target = qs(selector);
  if (!target) return;

  const rows = pricing
    .map(
      (line) => html`
        <div class="spec-row">
          <span class="spec-row__k">${line.scope}</span>
          <span class="spec-row__v">à partir de ${line.from}</span>
        </div>
      `
    )
    .join('');

  render(target, rows);
}

/* ------------------------------------------------------------------ */
/* Champs à choix                                                     */
/* ------------------------------------------------------------------ */

function choice({ type, name, option }) {
  const isRadio = type === 'radio';
  return html`
    <label class="choice ${isRadio ? 'choice--radio' : ''}">
      <input type="${type}" name="${name}" value="${option.label}" />
      <span class="choice__box" aria-hidden="true"></span>
      <span>${option.label}</span>
    </label>
  `;
}

function mountChoiceGroup(selector, { type, name, options }) {
  const target = qs(selector);
  if (!target) return;
  render(target, options.map((option) => choice({ type, name, option })).join(''));
}

/* ------------------------------------------------------------------ */
/* Validation                                                         */
/* ------------------------------------------------------------------ */

function setError(field, message) {
  const wrapper = field.closest('.field') || field.parentElement;
  const errorEl = wrapper ? qs('.field__error', wrapper) : null;
  const invalid = Boolean(message);

  field.setAttribute('aria-invalid', String(invalid));
  if (errorEl) {
    errorEl.textContent = message || '';
    errorEl.classList.toggle('is-shown', invalid);
  }
  return !invalid;
}

function validateField(field) {
  const value = field.value.trim();

  if (field.required && !value) return setError(field, t('form.required', 'Ce champ est obligatoire.'));
  if (field.type === 'email' && value && !EMAIL_PATTERN.test(value))
    return setError(field, t('form.invalidEmail', 'Adresse e-mail invalide.'));
  if (field.name === 'message' && value && value.length < MIN_MESSAGE_LENGTH)
    return setError(
      field,
      t('form.tooShort', 'Merci de détailler un peu plus votre projet (30 caractères minimum).')
    );

  return setError(field, '');
}

function validateTypes(form) {
  const checked = qsa('input[name="type"]:checked', form);
  const errorEl = qs('[data-error="type"]', form);
  const valid = checked.length > 0;

  if (errorEl) {
    errorEl.textContent = valid ? '' : t('form.selectType', 'Sélectionnez au moins un type de projet.');
    errorEl.classList.toggle('is-shown', !valid);
  }
  return valid;
}

/* ------------------------------------------------------------------ */
/* Envoi                                                              */
/* ------------------------------------------------------------------ */

function collect(form) {
  const data = new FormData(form);
  return {
    name: (data.get('name') || '').toString().trim(),
    email: (data.get('email') || '').toString().trim(),
    discord: (data.get('discord') || '').toString().trim(),
    types: data.getAll('type'),
    budget: (data.get('budget') || '').toString(),
    deadline: (data.get('deadline') || '').toString(),
    message: (data.get('message') || '').toString().trim(),
  };
}

function buildMailto(payload) {
  const subject = `Demande de devis — ${payload.name}`;
  const body = [
    `Nom : ${payload.name}`,
    `Email : ${payload.email}`,
    payload.discord ? `Discord : ${payload.discord}` : null,
    `Type de projet : ${payload.types.join(', ')}`,
    payload.budget ? `Budget : ${payload.budget}` : null,
    payload.deadline ? `Délai souhaité : ${payload.deadline}` : null,
    '',
    'Description du projet :',
    payload.message,
  ]
    .filter(Boolean)
    .join('\n');

  return `mailto:${formConfig.fallbackEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

function showStatus(statusEl, message, variant) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `form-status is-shown form-status--${variant}`;
}

async function submitForm(form, statusEl, submitButton) {
  const payload = collect(form);
  const originalLabel = submitButton.innerHTML;

  submitButton.disabled = true;
  submitButton.textContent = t('form.sending', 'Envoi en cours…');

  try {
    if (formConfig.endpoint) {
      const response = await fetch(formConfig.endpoint, {
        method: formConfig.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      showStatus(
        statusEl,
        t('form.successApi', 'Demande envoyée. Vous recevrez une réponse sous 24 à 48 h.'),
        'ok'
      );
      form.reset();
      qsa('.choice.is-checked', form).forEach((el) => el.classList.remove('is-checked'));
    } else {
      window.location.href = buildMailto(payload);
      showStatus(
        statusEl,
        `${t(
          'form.successMail',
          'Votre message est prêt : votre logiciel de messagerie vient de s’ouvrir avec la demande pré-remplie. Si rien ne s’est passé, écrivez directement à'
        )} ${formConfig.fallbackEmail}`,
        'ok'
      );
    }
  } catch {
    showStatus(
      statusEl,
      `${t('form.error', 'L’envoi a échoué. Réessayez ou écrivez directement à')} ${
        formConfig.fallbackEmail
      }`,
      'error'
    );
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalLabel;
  }
}

/* ------------------------------------------------------------------ */
/* Montage                                                            */
/* ------------------------------------------------------------------ */

export function mountContact() {
  mountContactList('[data-contact-list]');
  mountPricing('[data-pricing]');

  const noticeEl = qs('[data-pricing-notice]');
  if (noticeEl) noticeEl.textContent = pricingNotice;

  const responseEl = qs('[data-response-time]');
  if (responseEl) responseEl.textContent = responseTime;

  mountChoiceGroup('[data-types]', { type: 'checkbox', name: 'type', options: projectTypes });
  mountChoiceGroup('[data-budgets]', { type: 'radio', name: 'budget', options: budgetRanges });
  mountChoiceGroup('[data-deadlines]', { type: 'radio', name: 'deadline', options: deadlines });

  const form = qs('[data-quote-form]');
  if (!form) return;

  const statusEl = qs('[data-form-status]', form);
  const submitButton = qs('[type="submit"]', form);

  // Reflet visuel de l'état coché (sans dépendre de :has, non supporté partout)
  form.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    if (input.type === 'radio') {
      qsa(`input[name="${input.name}"]`, form).forEach((radio) =>
        radio.closest('.choice')?.classList.toggle('is-checked', radio.checked)
      );
    } else if (input.type === 'checkbox') {
      input.closest('.choice')?.classList.toggle('is-checked', input.checked);
    }

    if (input.name === 'type') validateTypes(form);
  });

  qsa('.input, .textarea', form).forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Piège à robots : rempli uniquement par un script automatisé
    if (qs('[name="website"]', form)?.value) return;

    const fields = qsa('.input, .textarea', form);
    const validFields = fields.map(validateField).every(Boolean);
    const validTypes = validateTypes(form);

    if (!validFields || !validTypes) {
      const firstInvalid =
        fields.find((field) => field.getAttribute('aria-invalid') === 'true') ||
        (!validTypes ? qs('input[name="type"]', form) : null);
      firstInvalid?.focus();
      return;
    }

    submitForm(form, statusEl, submitButton);
  });
}
