// Recharge la page dès que la maintenance est levée.
const check = async () => {
  try {
    const res = await fetch('/api/public/status', { cache: 'no-store' });
    if (res.ok && !(await res.json()).maintenance) location.reload();
  } catch {
    /* serveur en cours de redémarrage : on réessaie au prochain tour */
  }
};
setInterval(check, 10_000);
