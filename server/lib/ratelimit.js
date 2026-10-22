/** Limiteur en mémoire à fenêtre glissante, par clé (adresse IP en général). */
export function createLimiter({ windowMs, max }) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => now - t < windowMs);
      if (fresh.length) hits.set(key, fresh);
      else hits.delete(key);
    }
  }, windowMs).unref();

  return {
    /** Enregistre une tentative ; renvoie le délai d'attente en secondes si refusée. */
    hit(key) {
      const now = Date.now();
      const times = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (times.length >= max) return Math.ceil((windowMs - (now - times[0])) / 1000);
      times.push(now);
      hits.set(key, times);
      return 0;
    },
    reset(key) {
      hits.delete(key);
    },
  };
}
