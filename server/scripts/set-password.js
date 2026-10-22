/**
 * Réinitialise le compte du logiciel d'administration.
 *
 *   npm run set-password
 *   docker compose exec ov7 npm run set-password
 *
 * Toutes les sessions ouvertes sont fermées.
 */

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { initAuth, setCredentials, destroyAllSessions, getUsername } from '../lib/auth.js';

initAuth();
const rl = readline.createInterface({ input, output });
const current = getUsername() || 'admin';
const username = (await rl.question(`Identifiant [${current}] : `)).trim() || current;
const password = await rl.question('Nouveau mot de passe (12 caractères minimum) : ');
rl.close();

if (password.length < 12) {
  console.error('Mot de passe trop court : rien n’a été modifié.');
  process.exit(1);
}
setCredentials(username, password);
destroyAllSessions();
console.log(`Compte « ${username} » mis à jour. Toutes les sessions ont été fermées.`);
