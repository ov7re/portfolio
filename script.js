// ── Menu mobile ──────────────────────────────────────────────────────────────
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  });
});

// ── Terminal typing effect ────────────────────────────────────────────────────
const terminalEl = document.getElementById('terminal');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const line = {
  prompt: 'ov7@portfolio:~$ ',
  cmd: 'whoami',
  out: 'Développeur FiveM & Full-Stack'
};

if (reduced) {
  terminalEl.innerHTML = `<span class="prompt">${line.prompt}</span>${line.cmd}<br><span class="out">${line.out}</span>`;
} else {
  let i = 0;
  const cmdSpan = document.createElement('span');
  terminalEl.innerHTML = `<span class="prompt">${line.prompt}</span>`;
  terminalEl.appendChild(cmdSpan);

  const type = () => {
    if (i < line.cmd.length) {
      cmdSpan.textContent += line.cmd[i++];
      setTimeout(type, 70);
    } else {
      const br = document.createElement('br');
      const out = document.createElement('span');
      out.className = 'out';
      out.textContent = line.out;
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      terminalEl.append(br, out, cursor);
    }
  };

  setTimeout(type, 400);
}

// ── Toast notification ────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function copyText(text, msg) {
  navigator.clipboard.writeText(text)
    .then(() => showToast(msg))
    .catch(() => showToast('Copié : ' + text));
}

// ── Formulaire de contact ─────────────────────────────────────────────────────
// Le formulaire est géré par FormSubmit (https://formsubmit.co).
// À la soumission, FormSubmit envoie le message par email et redirige
// vers la page définie dans le champ caché _next.
