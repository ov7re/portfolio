

/* Editable content for the À Propos timeline. Coordinates use the SVG viewBox. */
const ABOUT_TIMELINE = {
  fr: [
    {x:92, y:173, title:'2022 — Début du projet', text:'Premières expérimentations autour des outils web, fonctionnement de discord et de l’automatisation avec découverte des services fivem ainsi que la logique discord.'},
    {x:190, y:157, title:'2023 — Premiers produits', text:'Conception d’interfaces desktop et web pensées pour rester rapides et lisibles, en parallèle développement des mes compétences en scripting et organisation LUA.'},
    {x:287, y:105, title:'2024 — Full-stack', text:'A ce moment donné, j’ai décider d’élargir mes compétences et de devenir full stack, je suis passer au REACT, Node.js, API et base de données.'},
    {x:393, y:164, title:'2025 — Sécurité', text:'Exploration des systèmes informatiques plus comlexe, exploration des réseaux et exploration de l’attauqe / défense.'},
    {x:489, y:116, title:'Aujourd’hui — Construire', text:'Après avoir accumulé un peu d’expériences, je rélise maintenant des projets de plus grosse envergure en full stack.'}
  ],
  en: [
    {x:92, y:173, title:'2022 — Project start', text:'First experiments with web tools, Discord, and automation, along with discovering FiveM services and Discord logic.'},
    {x:190, y:157, title:'2023 — First products', text:'Designing desktop and web interfaces focused on staying fast and readable, while developing my scripting and Lua programming skills.'},
    {x:287, y:105, title:'2024 — Full-stack', text:'At this point, I decided to expand my skills and become a full-stack developer, moving into React, Node.js, APIs, and databases.'},
    {x:393, y:164, title:'2025 — Security', text:'Exploring more complex computer systems, networking, and the fundamentals of offensive and defensive security.'},
    {x:489, y:116, title:'Today — Building', text:'After gaining some experience, I am now working on larger-scale full-stack projects.'}
  ]
};

/* ============================================================
   SFX ENGINE — sons synthétisés en direct (Web Audio API),
   aucun fichier externe requis.
   ============================================================ */
const SFX = (() => {
  let ctx = null, master = null, dry = null, wet = null, reverb = null, muted = false, unlocked = false, masterVolume = .55;

  function buildReverb(c, duration=1.6, decay=3.2){
    const rate = c.sampleRate;
    const len = Math.floor(rate * duration);
    const buf = c.createBuffer(2, len, rate);
    for(let ch=0; ch<2; ch++){
      const data = buf.getChannelData(ch);
      for(let i=0;i<len;i++){
        data[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay);
      }
    }
    const node = c.createConvolver();
    node.buffer = buf;
    return node;
  }

  function ensureCtx(){
    if(ctx) return ctx;
    try{
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = .55;
      dry = ctx.createGain(); dry.gain.value = 1;
      wet = ctx.createGain(); wet.gain.value = .16;
      reverb = buildReverb(ctx);
      dry.connect(master);
      reverb.connect(wet); wet.connect(master);
      master.connect(ctx.destination);
    }catch(e){ ctx = null; }
    return ctx;
  }

  // every voice feeds both the dry bus and the reverb send, for a bit of "room"
  function out(node){
    node.connect(dry);
    node.connect(reverb);
  }

  function unlock(){
    if(unlocked) return;
    unlocked = true;
    const c = ensureCtx();
    if(c && c.state === 'suspended') c.resume().catch(()=>{});
  }
  ['pointerdown','keydown'].forEach(ev=> window.addEventListener(ev, unlock, {passive:true}));

  function noiseBuffer(duration, colorPow=1){
    const c = ensureCtx(); if(!c) return null;
    const n = Math.max(1, Math.floor(c.sampleRate * duration));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for(let i=0;i<n;i++){
      const white = Math.random()*2-1;
      last = (last + white*0.5) / 1.5; // gentle brownian smoothing for less harsh noise
      data[i] = last * Math.pow(1 - i/n, colorPow);
    }
    return buf;
  }

  function now(){ return ctx ? ctx.currentTime : 0; }
  const rnd = (a,b) => a + Math.random()*(b-a);

  function playNoise({duration=.3, type='bandpass', freq=800, q=1, gain=.35, delay=0, sweepTo=null}={}){
    const c = ensureCtx(); if(!c || muted) return;
    const buf = noiseBuffer(duration, 1.4);
    if(!buf) return;
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = type; filt.frequency.value = freq; filt.Q.value = q;
    const g = c.createGain(); g.gain.value = 0;
    src.connect(filt); filt.connect(g); out(g);
    const t = now() + delay;
    if(sweepTo) filt.frequency.exponentialRampToValueAtTime(Math.max(sweepTo,40), t + duration*.9);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + duration*0.12);
    g.gain.exponentialRampToValueAtTime(.001, t + duration);
    src.start(t); src.stop(t + duration + .02);
  }

  // layered tone: fundamental + soft harmonic, gives voices body instead of a bare beep
  function playTone({freq=440, endFreq=null, duration=.2, type='sine', gain=.2, delay=0, glide=null, detune=0, harmonic=.18}={}){
    const c = ensureCtx(); if(!c || muted) return;
    const t = now() + delay;
    const g = c.createGain(); g.gain.value = 0;
    out(g);

    const osc = c.createOscillator(); osc.type = type; osc.detune.value = detune;
    osc.frequency.setValueAtTime(freq, t);
    if(endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq,1), t + (glide||duration));
    osc.connect(g);

    if(harmonic > 0){
      const osc2 = c.createOscillator(); osc2.type = type==='sine' ? 'triangle' : 'sine';
      osc2.frequency.setValueAtTime(freq*2, t);
      if(endFreq) osc2.frequency.exponentialRampToValueAtTime(Math.max(endFreq*2,1), t + (glide||duration));
      const g2 = c.createGain(); g2.gain.value = gain*harmonic;
      osc2.connect(g2); g2.connect(dry); g2.connect(reverb);
      osc2.start(t); osc2.stop(t + duration + .03);
    }

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.min(.02,duration*0.3));
    g.gain.exponentialRampToValueAtTime(.001, t + duration);
    osc.start(t); osc.stop(t + duration + .03);
  }

  // SFX désactivés : toutes les méthodes sont des no-ops, aucun son n'est joué.
  return {
    setMuted(v){ muted = !!v; },
    isMuted(){ return muted; },
    setVolume(v){ masterVolume = Math.max(0, Math.min(1, Number(v) || 0)); },
    getVolume(){ return Math.round(masterVolume * 100); },
    hum(){},
    ignite(){},
    ember(){},
    flash(){},
    tick(){},
    click(){},
    hover(){},
    open(){},
    close(){},
    toggle(){}
  };
})();

// mute button
const sfxBtn = document.getElementById('sfxBtn');
const sfxIconOn = document.getElementById('sfxIconOn');
const sfxIconOff = document.getElementById('sfxIconOff');
sfxBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  const nowMuted = !SFX.isMuted();
  SFX.setMuted(nowMuted);
  sfxBtn.classList.toggle('muted', nowMuted);
  sfxIconOn.style.display = nowMuted ? 'none' : 'block';
  sfxIconOff.style.display = nowMuted ? 'block' : 'none';
  SFX.toggle(!nowMuted);
});

/* ============================================================
   SETTINGS — persisted preferences, tabs, accent, language, audio
   ============================================================ */
const ACCENT_THEMES={
  red:{color:'#d4162c',strong:'#ff5a1f',dark:'#8f0f1e',glow:'#ff9a3d',rgb:'212,22,44'},
  green:{color:'#16a34a',strong:'#4ade80',dark:'#166534',glow:'#86efac',rgb:'22,163,74'},
  violet:{color:'#7c3aed',strong:'#c084fc',dark:'#4c1d95',glow:'#e9d5ff',rgb:'124,58,237'},
  blue:{color:'#2563eb',strong:'#60a5fa',dark:'#1e3a8a',glow:'#93c5fd',rgb:'37,99,235'},
  yellow:{color:'#ca8a04',strong:'#facc15',dark:'#854d0e',glow:'#fde68a',rgb:'202,138,4'}
};
const settingsI18n = {
  fr:{
    settingsTitle:'~/Paramètres', settingsLabel:'Paramètres',
    general:'Général', appearance:'Apparence', audio:'Audio',
    generalHeading:'Préférences générales', language:'Langue', languageHelp:'Choisissez la langue de l’interface.',
    appearanceHeading:'Fond d’écran', accent:'Couleur du fond', accentHelp:'Change la couleur du dégradé du fond d’écran, en direct.',
    audioHeading:'Audio système', volume:'Volume général', volumeHelp:'Contrôle le moteur SFX de 7OS.', mute:'Silencieux',
    pinned:'Épinglés', noResults:'Aucun résultat', searchPlaceholder:'Rechercher dans 7OS...',
    projects:'Mes Projets', about:'À Propos', skills:'Compétences', contact:'Contact', settings:'Paramètres',
    bootLabel:'Démarrage de',
    winProjects:'~/Mes-Projets', winAbout:'~/A-Propos', winSkills:'~/Competences', winContact:'~/Contact',
    explorerBack:'Retour', explorerUp:'Dossier parent', favorites:'FAVORIS', favProjects:'Mes Projets', favRecent:'Projets récents',
    colName:'Nom', colType:'Type', colModified:'Modifié', statusProjectsCount:'projets', statusFileCount:'1 fichier',
    fileTypeText:'Document texte', fileTypeSource:'Fichier source', fileTypeFolder:'Dossier',
    editorMeta:'DOCUMENT TEXTE · sauvegarde locale par projet', editorDesc:'Description du projet',
    editorReady:'Prêt à modifier', editorSaved:'Enregistré', editorReadonly:'Lecture seule', editorSaveBtn:'Enregistrer',
    aboutIntro:'Développeur full-stack — applications desktop et web orientées outils d\'administration et sécurité. Stack principale : Electron, React, Node.js/Express, PostgreSQL.',
    aboutCaption:'Parcours // repères temporels',
    skillCore:'Core', skillFrontend:'Frontend', skillBackend:'Backend',
    skillsIntro:'Un écosystème d\'outils que j\'utilise au quotidien, classés par orbite : le cœur du langage, le frontend, puis le backend.',
    contactIntro:'Le plus simple pour me joindre : mail ou Discord. Un clic copie l\'info dans le presse-papiers.',
    contactEmail:'Email', contactDiscord:'Discord', contactCopy:'Copier', contactCopied:'Copié !',
    winMin:'Réduire', winMax:'Agrandir', winRestore:'Restaurer', winClose:'Fermer'
  },
  en:{
    settingsTitle:'~/Settings', settingsLabel:'Settings',
    general:'General', appearance:'Appearance', audio:'Audio',
    generalHeading:'General preferences', language:'Language', languageHelp:'Choose the interface language.',
    appearanceHeading:'Wallpaper', accent:'Wallpaper colour', accentHelp:'Changes the desktop wallpaper gradient, live.',
    audioHeading:'System audio', volume:'Master volume', volumeHelp:'Controls the 7OS SFX engine.', mute:'Mute',
    pinned:'Pinned', noResults:'No results', searchPlaceholder:'Search 7OS...',
    projects:'Projects', about:'About', skills:'Skills', contact:'Contact', settings:'Settings',
    bootLabel:'Starting',
    winProjects:'~/My-Projects', winAbout:'~/About', winSkills:'~/Skills', winContact:'~/Contact',
    explorerBack:'Back', explorerUp:'Parent folder', favorites:'FAVORITES', favProjects:'My Projects', favRecent:'Recent projects',
    colName:'Name', colType:'Type', colModified:'Modified', statusProjectsCount:'projects', statusFileCount:'1 file',
    fileTypeText:'Text document', fileTypeSource:'Source file', fileTypeFolder:'Folder',
    editorMeta:'TEXT DOCUMENT · saved locally per project', editorDesc:'Project description',
    editorReady:'Ready to edit', editorSaved:'Saved', editorReadonly:'Read-only', editorSaveBtn:'Save',
    aboutIntro:'Full-stack developer — desktop and web apps focused on admin tools and security. Main stack: Electron, React, Node.js/Express, PostgreSQL.',
    aboutCaption:'Journey // timeline milestones',
    skillCore:'Core', skillFrontend:'Frontend', skillBackend:'Backend',
    skillsIntro:'A toolkit I use daily, grouped by orbit: core language, frontend, then backend.',
    contactIntro:'The simplest way to reach me: email or Discord. One click copies it to your clipboard.',
    contactEmail:'Email', contactDiscord:'Discord', contactCopy:'Copy', contactCopied:'Copied!',
    winMin:'Minimize', winMax:'Maximize', winRestore:'Restore', winClose:'Close'
  }
};
const accentThemes={red:['#d4162c','#8f0f1e','212,22,44'],green:['#25b579','#13704b','37,181,121'],violet:['#9b6cff','#5f3db0','155,108,255'],blue:['#3b9cff','#1764ad','59,156,255'],yellow:['#e5b93f','#987a16','229,185,63']};
const saved=JSON.parse(localStorage.getItem('7os-preferences')||'{}');
let prefs={lang:saved.lang==='en'?'en':'fr',accent:accentThemes[saved.accent]?saved.accent:'red',volume:Number.isFinite(+saved.volume)?Math.max(0,Math.min(100,+saved.volume)):55,mute:!!saved.mute};
let i18nReady=false;
function savePrefs(){localStorage.setItem('7os-preferences',JSON.stringify(prefs));}
function applyLanguage(){
  const dict=settingsI18n[prefs.lang];
  document.documentElement.lang=prefs.lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{if(dict[el.dataset.i18n])el.textContent=dict[el.dataset.i18n]});
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{if(dict[el.dataset.i18nTitle])el.title=dict[el.dataset.i18nTitle]});
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{if(dict[el.dataset.i18nAria])el.setAttribute('aria-label',dict[el.dataset.i18nAria])});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{if(dict[el.dataset.i18nPlaceholder])el.placeholder=dict[el.dataset.i18nPlaceholder]});
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===prefs.lang));
  if(!i18nReady) return;
  renderExplorer();
  if(document.getElementById('win-apropos') && document.getElementById('win-apropos').classList.contains('open')) initAboutTimeline();
  const editor=document.getElementById('descriptionEditor');
  const savedLabel=document.getElementById('editorSaved');
  if(editor && savedLabel && !editor.dataset.project) savedLabel.textContent=dict.editorReady;
}
function applyAccent(){
  // Only the desktop wallpaper gradient follows the chosen accent — the rest of the
  // interface (icons, borders, buttons, flame) keeps its fixed brand color.
  const theme=ACCENT_THEMES[prefs.accent] || ACCENT_THEMES.red;
  const root=document.documentElement;
  root.style.setProperty('--wall-accent',theme.color);
  root.style.setProperty('--wall-accent-rgb',theme.rgb);
  document.querySelectorAll('.accent-dot').forEach(d=>d.classList.toggle('active',d.dataset.accent===prefs.accent));
}
function applyAudio(){SFX.setVolume(prefs.volume/100);SFX.setMuted(prefs.mute);const v=document.getElementById('settingsVolume');if(v)v.value=prefs.volume;const out=document.getElementById('settingsVolumeValue');if(out)out.textContent=prefs.volume+'%';const t=document.getElementById('settingsMute');if(t){t.classList.toggle('on',prefs.mute);t.setAttribute('aria-pressed',String(prefs.mute));}}
applyAccent();applyAudio();applyLanguage();
const initialMuted=prefs.mute;sfxBtn.classList.toggle('muted',initialMuted);sfxIconOn.style.display=initialMuted?'none':'block';sfxIconOff.style.display=initialMuted?'block':'none';
document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>{prefs.lang=btn.dataset.lang;savePrefs();applyLanguage();SFX.toggle(true);}));
document.querySelectorAll('.accent-dot').forEach(dot=>dot.addEventListener('click',()=>{prefs.accent=dot.dataset.accent;savePrefs();applyAccent();SFX.click();}));
document.getElementById('settingsVolume').addEventListener('input',e=>{prefs.volume=+e.target.value;savePrefs();applyAudio();});
document.getElementById('settingsMute').addEventListener('click',()=>{prefs.mute=!prefs.mute;savePrefs();applyAudio();SFX.toggle(!prefs.mute);});
const settingsLauncher=document.getElementById('settingsLauncher');
settingsLauncher.addEventListener('click',e=>{e.stopPropagation();flameMenu.classList.remove('open');openWindow('settings');SFX.open();});
settingsLauncher.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();settingsLauncher.click();}});

/* ============================================================
   BOOT -> DESKTOP TRANSITION
   ============================================================ */
const boot = document.getElementById('boot');
const desktop = document.getElementById('desktop');
const flameWrap = document.getElementById('flameWrap');
const bootPct = document.getElementById('bootPct');

// the flame no longer travels in — it draws itself on in place. The formation
// sequence (previously frozen/paused) starts right away on load.
(function startBootSequence(){
  boot.classList.add('formed');

  // animated percentage counter synced with the progress bar (3.1s -> 5.5s after formation)
  (function animatePct(){
    const start = 3100, duration = 2400;
    const bootStart = performance.now();
    function frame(){
      const elapsed = performance.now() - bootStart;
      const p = Math.min(100, Math.max(0, Math.round(((elapsed - start) / duration) * 100)));
      if(elapsed >= start) bootPct.textContent = p + '%';
      if(elapsed < start + duration + 50) requestAnimationFrame(frame);
      else bootPct.textContent = '100%';
    }
    requestAnimationFrame(frame);
  })();

  setTimeout(()=>{
    flameWrap.classList.add('flash');
    boot.classList.add('hit');
  }, 4650);
  setTimeout(()=>{
    boot.classList.add('hide');
    desktop.classList.add('show');
  }, 5050);
})();

// --- clock ---
function tick(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const mo = String(now.getMonth()+1).padStart(2,'0');
  document.getElementById('clock').innerHTML = `${hh}:${mm}<small>${dd}/${mo}/${now.getFullYear()}</small>`;
}
tick(); setInterval(tick, 1000*30);

// --- minimized windows: shown as chips in the taskbar, next to the flame icon ---
const tbMinimized = document.getElementById('tbMinimized');
const minimizedWindows = new Map(); // name -> chip element

function windowLabel(win){
  const t = win.querySelector('.win-title span:not(.sq)');
  return t ? t.textContent : win.id.replace('win-','');
}
function clearMinimizedChip(name){
  const chip = minimizedWindows.get(name);
  if(chip){ chip.remove(); minimizedWindows.delete(name); }
}
function minimizeWindow(win){
  const name = win.id.replace('win-','');
  win.classList.remove('open');
  win.classList.add('minimized');
  if(!minimizedWindows.has(name)){
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tb-min-chip';
    chip.textContent = windowLabel(win);
    chip.addEventListener('click', ()=>{ openWindow(name); SFX.open(); });
    chip.addEventListener('mouseenter', ()=> SFX.hover());
    tbMinimized.appendChild(chip);
    minimizedWindows.set(name, chip);
  }
}

// --- open a window by id (shared by desktop icons + start menu) ---
function openWindow(name){
  const id = 'win-'+name;
  document.querySelectorAll('.window').forEach(w=>w.style.zIndex=20);
  const win = document.getElementById(id);
  win.classList.add('open');
  win.classList.remove('minimized');
  clearMinimizedChip(name);
  win.style.zIndex = 30;
  if(name === 'apropos') initAboutTimeline();
}

// --- tray panel (flèche) ---
const trayPanel = document.getElementById('trayPanel');
const caretBtn = document.querySelector('.caret-btn');
caretBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  flameMenu.classList.remove('open');
  const opening = !trayPanel.classList.contains('open');
  SFX.click();
  if(opening){
    const deskRect = desktop.getBoundingClientRect();
    const caretRect = caretBtn.getBoundingClientRect();
    const panelWidth = 200;
    let left = (caretRect.left - deskRect.left) + caretRect.width/2 - panelWidth/2;
    left = Math.min(Math.max(left, 10), deskRect.width - panelWidth - 10);
    trayPanel.style.left = left + 'px';
  }
  trayPanel.classList.toggle('open');
});

// --- flame start menu ---
const flameMenu = document.getElementById('flameMenu');
const flameBtn = document.querySelector('.flame-btn');
flameBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  trayPanel.classList.remove('open');
  const opening = !flameMenu.classList.contains('open');
  flameMenu.classList.toggle('open');
  opening ? SFX.open() : SFX.close();
  if(opening){
    resetFlameMenuSearch();
    setTimeout(()=> flameMenuSearch.focus(), 180);
  }
});
document.getElementById('flameMenuClose').addEventListener('click', (e)=>{
  e.stopPropagation();
  flameMenu.classList.remove('open');
  SFX.close();
});
document.querySelectorAll('.flame-menu-app').forEach(app=>{
  app.addEventListener('click', ()=>{
    flameMenu.classList.remove('open');
    openWindow(app.dataset.win);
    SFX.open();
  });
  app.addEventListener('mouseenter', ()=> SFX.hover());
});

// --- flame menu search (filters the pinned apps live) ---
const flameMenuSearch = document.getElementById('flameMenuSearch');
const flameMenuEmpty = document.getElementById('flameMenuEmpty');
const flameMenuLabel = document.getElementById('flameMenuLabel');
const flameMenuApps = Array.from(document.querySelectorAll('.flame-menu-app'));

function filterFlameMenu(){
  const q = flameMenuSearch.value.trim().toLowerCase();
  let visibleCount = 0;
  flameMenuApps.forEach(app=>{
    const haystack = (app.dataset.keywords || '') + ' ' + app.textContent.toLowerCase();
    const match = q === '' || haystack.toLowerCase().includes(q);
    app.style.display = match ? '' : 'none';
    if(match) visibleCount++;
  });
  flameMenuEmpty.classList.toggle('show', visibleCount === 0);
  flameMenuLabel.textContent = q === '' ? 'Épinglés' : `Résultats pour "${flameMenuSearch.value.trim()}"`;
}
flameMenuSearch.addEventListener('input', filterFlameMenu);
flameMenuSearch.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){
    const firstVisible = flameMenuApps.find(a => a.style.display !== 'none');
    if(firstVisible) firstVisible.click();
  }
});
// reset search + refocus each time the menu opens
function resetFlameMenuSearch(){
  flameMenuSearch.value = '';
  filterFlameMenu();
}

// close panels on outside click
document.addEventListener('click', (e)=>{
  if(!trayPanel.contains(e.target) && !caretBtn.contains(e.target)) trayPanel.classList.remove('open');
  if(!flameMenu.contains(e.target) && !flameBtn.contains(e.target)) flameMenu.classList.remove('open');
});

// v7 project explorer: single select, double-click to open
const PROJECTS = ['Ov Bot','Ov SB','Vaultdesk','OwO Search','Ov7rE Bot','Tor Project','Serveur fivem','Ov Secure'];
const PROJECT_LANGUAGES = {
  'Ov Bot': {file:'language.js', content:'Langage utilisé : Node.js'},
  'Ov SB': {file:'language.js', content:'Langage utilisé : Node.js'},
  'Vaultdesk': {file:'language.jsx', content:'Langage utilisé : JSX'},
  'OwO Search': {file:'language.html', content:'Langages utilisés : HTML/CSS/JS'},
  'Ov7rE Bot': {file:'language.js', content:'Langage utilisé : Node.js'},
  'Tor Project': {file:'language.js', content:'Langage utilisé : JavaScript'},
  'Serveur fivem': {file:'language.lua', content:'Langage utilisé : Lua'},
  'Ov Secure': {file:'language.py', content:'Langage utilisé : Python'}
};
// Descriptions éditoriales embarquées : elles restent disponibles même hors ligne.
const PROJECT_DESCRIPTIONS = {
  'Ov Bot': 'Ov Bot est un projet personnel de bot sur la plateforme discord, mon objectif était de comprendre et expérimenter sur les bots, il est global et compatible multi serveur, il intégre un système de propriétaire, owner et whitelist.',
  'Ov SB': 'Ov SB est ce que l\'on appel sur discord un SelfBot, pour faire simple il utilise le token (clé personnel discord) afin de se connecter à un compte, il facilite l\'usage quotidien et répond à des commandes tel un bot mais intéragit uniquement sur un compte utilisateur.',
  'Ov7rE Bot': 'Ov7rE Bot est un projet de bot conçu pour expérimenter et développer des fonctionnalités automatisées.',
  'Vaultdesk': 'VaultDesk est un logiciel développé dans le but d\'expérimenter et apprendre electron (outil permettant de créer des logiciels sur le bureau) il regroupe un système complet d\'administration, de ticket, de signalement, de chat et de recherche en base de donnée, il inclue également un login sécurisé multi profil et de clé d\'accès.',
  'OwO Search': 'OwO Search est un site web avec système de login admin/user fonctionnant avec des clés d\'accès permettant d\'effectuer des recherches dans des bases données indexées automatiquement ainsi que la gestion complète, création, modification et suppression des utilisateurs.',
  'Tor Project': 'Tor Project est un projet de logiciel axé pour la cyber sécurité, sous la forme d\'un terminal il permet de centraliser rapidement les informations de la machine utilisateur, il exécute des scans de sécurité complet sur la machine, inclue un système de protection d\'ip complet, il permet de changer en un clic d\'ip public ipv4, en utilisant le proxy windows et en se connectant au réseau tor, il permet une rotation d\'ip, toute les 10 secondes de facon automatique la machine se connecte à un serveur différent dans le monde entier afin de rendre presque impossible la retracabilité de l\opérateur, il permet également un scan complet des ports ouverts et une auto-évaluation de leur rique via des couleurs. Développé dans le but de comprendre comment fonctionnait le réseau Tor utiliser pour se rendre sur le DarkWeb, ce réseau est particulièrement intéréssant et sécurisé axé sur la confidentialité.',
  'Serveur fivem': 'Ov Base est une base que j\'ai créer afin de comprendre les logiques fivem, elle inclue un multicharacter développé par mes soins en m\'aidant de la ressource présente chez ESX, 2 exemples de menu administrateur créer à 1 an d\écart pour évaluer mes compétences, une boutique, un sysème de garage et de fourrière, un inventaire inspiré de chez OX, un menu Contextuel, un menu F5 complet, un système de banque complet, d\'Ammunation et de LTD complet ainsi qu\'un système de carte d\identité.',
  'Ov Secure': 'Ov Secure est un logiciel entièrement développe en Python qui permet de crypter et décrypter un message avec les meilleurs techniques actuelles, clé et mot de cryptage unique choisis par l\'utilisateur, la méthode AES-256-GCM et Argon2id, il intégre aussi un login protégé complétement par un module spécial anti bruteforce.'
};
const EXPLORER_DATE = '19/08/2026';
const projectRows = document.getElementById('projectRows');
const breadcrumbs = document.getElementById('breadcrumbs');
const explorerBack = document.getElementById('explorerBack');
const explorerUp = document.getElementById('explorerUp');
const explorerStatus = document.getElementById('explorerStatus');
const explorerTitle = document.getElementById('explorerTitle');
let explorerPath = ['root'];
let currentProject = null;
function iconFor(kind){ return kind === 'folder' ? '<span class="file-icon folder-icon">▰</span>' : '<span class="file-icon">TXT</span>'; }
function renderExplorer(){
  const dict = settingsI18n[prefs.lang];
  const inProject = explorerPath.length > 1;
  currentProject = inProject ? explorerPath[1] : null;
  const entries = inProject ? [
    {name:'description.txt',kind:'file',type:dict.fileTypeText},
    {name:PROJECT_LANGUAGES[currentProject].file,kind:'file',type:dict.fileTypeSource}
  ] : PROJECTS.map(name=>({name,kind:'folder',type:dict.fileTypeFolder}));
  projectRows.innerHTML = entries.map(e=>`<div class="project-row" role="option" tabindex="0" data-kind="${e.kind}" data-name="${e.name}"><span class="file-name">${iconFor(e.kind)}<b>${e.name}</b></span><span class="file-kind">${e.type}</span><span class="file-date">${EXPLORER_DATE}</span></div>`).join('');
  explorerStatus.textContent = inProject ? dict.statusFileCount : `${PROJECTS.length} ${dict.statusProjectsCount}`;
  explorerTitle.textContent = inProject ? `${dict.winProjects}/${currentProject}` : dict.winProjects;
  breadcrumbs.innerHTML = `<button data-path="root">${dict.favProjects}</button>` + (inProject ? `<span class="crumb-sep">›</span><button data-path="${currentProject}">${currentProject}</button>` : '');
  explorerBack.disabled = !inProject; explorerUp.disabled = !inProject;
}
function openProjectFolder(name){ explorerPath=['root',name]; renderExplorer(); SFX.open(); }
function openFile(project, fileName){
  const dict = settingsI18n[prefs.lang];
  const editor=document.getElementById('descriptionEditor');
  const isDescription = fileName === 'description.txt';
  const language = PROJECT_LANGUAGES[project];
  const key = isDescription ? '7os-description-'+project : '7os-language-'+project;
  editor.dataset.project=project; editor.dataset.file=fileName;
  editor.value = isDescription ? (PROJECT_DESCRIPTIONS[project] || '') : (language ? language.content : '');
  editor.readOnly=true;
  document.getElementById('editorTitle').textContent=`${project} — ${fileName}`;
  document.getElementById('editorSaved').textContent=dict.editorReadonly; openWindow('editor'); editor.focus();
}
function openDescription(name){ openFile(name, 'description.txt'); }
projectRows.addEventListener('click', e=>{ const row=e.target.closest('.project-row'); if(!row)return; projectRows.querySelectorAll('.project-row').forEach(r=>r.classList.remove('selected')); row.classList.add('selected'); });
projectRows.addEventListener('dblclick', e=>{ const row=e.target.closest('.project-row'); if(!row)return; row.dataset.kind==='folder' ? openProjectFolder(row.dataset.name) : openFile(currentProject, row.dataset.name); });
projectRows.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.target.dispatchEvent(new MouseEvent('dblclick',{bubbles:true})); } });
function goRoot(){ explorerPath=['root']; renderExplorer(); }
explorerBack.addEventListener('click',goRoot); explorerUp.addEventListener('click',goRoot);
breadcrumbs.addEventListener('click',e=>{if(e.target.dataset.path==='root')goRoot();});
const saveDescription=document.getElementById('saveDescription');
function saveCurrentDescription(){ const editor=document.getElementById('descriptionEditor'); if(!editor.dataset.project)return; localStorage.setItem('7os-description-'+editor.dataset.project,editor.value); document.getElementById('editorSaved').textContent=settingsI18n[prefs.lang].editorSaved; }
saveDescription.addEventListener('click',saveCurrentDescription); document.getElementById('descriptionEditor').addEventListener('blur',saveCurrentDescription);
renderExplorer();
i18nReady=true;

// --- Contact: copier au clic + feedback ---
document.querySelectorAll('.contact-item').forEach(item=>{
  item.addEventListener('click', ()=>{
    const value = item.dataset.copy;
    if(navigator.clipboard && value){ navigator.clipboard.writeText(value).catch(()=>{}); }
    const label = item.querySelector('.contact-action');
    const original = label.textContent;
    item.classList.add('copied'); label.textContent = settingsI18n[prefs.lang].contactCopied;
    SFX.click();
    setTimeout(()=>{ item.classList.remove('copied'); label.textContent = settingsI18n[prefs.lang].contactCopy; }, 1600);
  });
  item.addEventListener('mouseenter', ()=> SFX.hover());
});

// --- galaxie de competences ---
const SKILLS = [
  {name:'JavaScript', slug:'javascript', color:'F7DF1E', cat:'core',     r:60,  speed:9,   phase:5},
  {name:'TypeScript', slug:'typescript', color:'3178C6', cat:'core',     r:60,  speed:9,   phase:135},
  {name:'HTML5',      slug:'html5',      color:'E34F26', cat:'core',     r:60,  speed:9,   phase:250},
  {name:'React',      slug:'react',      color:'61DAFB', cat:'frontend', r:110, speed:-6.5,phase:20},
  {name:'Electron',   slug:'electron',   color:'47848F', cat:'frontend', r:110, speed:-6.5,phase:140},
  {name:'Tailwind CSS',slug:'tailwindcss',color:'38BDF8', cat:'frontend', r:110, speed:-6.5,phase:260},
  {name:'Node.js',    slug:'nodedotjs',  color:'339933', cat:'backend',  r:160, speed:4.5, phase:0},
  {name:'Express',    slug:'express',    color:'eae7e0', cat:'backend',  r:160, speed:4.5, phase:72},
  {name:'PostgreSQL', slug:'postgresql', color:'4169E1', cat:'backend',  r:160, speed:4.5, phase:144},
  {name:'MySQL',      slug:'mysql',      color:'4479A1', cat:'backend',  r:160, speed:4.5, phase:216},
  {name:'Lua',        slug:'lua',        color:'2C2D72', cat:'backend',  r:160, speed:4.5, phase:288},
  {name:'Python',     slug:'python',     color:'3776AB', cat:'backend',  r:205, speed:-3,  phase:60},
  {name:'Git',        slug:'git',        color:'F05032', cat:'core',     r:205, speed:-3,  phase:240},
];
(function buildGalaxy(){
  const galaxy = document.getElementById('galaxy');
  if(!galaxy) return;
  const tooltip = document.getElementById('skillTooltip');
  const tooltipName = document.getElementById('skillTooltipName');
  const tooltipCat = document.getElementById('skillTooltipCat');
  const catLabel = {core:'Core', frontend:'Frontend', backend:'Backend'};
  SKILLS.forEach(s=>{
    const el = document.createElement('div');
    el.className = 'planet ' + s.cat;
    el.innerHTML = `<img src="https://cdn.simpleicons.org/${s.slug}/${s.color}" alt="${s.name}">`;
    el.addEventListener('mouseenter', ()=>{
      s.hovered = true;
      el.classList.add('hovered');
      tooltipName.textContent = s.name;
      tooltipCat.textContent = catLabel[s.cat] || s.cat;
      const gRect = galaxy.getBoundingClientRect();
      const pRect = el.getBoundingClientRect();
      tooltip.style.left = (pRect.left - gRect.left + pRect.width/2) + 'px';
      tooltip.style.top = (pRect.top - gRect.top + pRect.height/2) + 'px';
      tooltip.classList.add('show');
    });
    el.addEventListener('mouseleave', ()=>{
      s.hovered = false;
      el.classList.remove('hovered');
      tooltip.classList.remove('show');
    });
    galaxy.appendChild(el);
    s.el = el;
  });
  let start = null;
  function tick(ts){
    if(start === null) start = ts;
    const t = (ts - start) / 1000;
    for(const s of SKILLS){
      if(s.hovered) continue; // freeze position while the user reads the tooltip
      const a = (s.phase + t * s.speed) * Math.PI / 180;
      s._lastAngle = a;
      const x = Math.cos(a) * s.r, y = Math.sin(a) * s.r;
      s.el.style.transform = `translate(${x}px, ${y}px)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();


// --- À Propos timeline: points configurés + tooltips au survol ---
function initAboutTimeline(){
  const group = document.getElementById('aboutTimelinePoints');
  const tooltip = document.getElementById('aboutTimelineTooltip');
  if(!group || !tooltip) return;
  group.innerHTML = '';
  const items = ABOUT_TIMELINE[prefs.lang] || ABOUT_TIMELINE.fr;
  items.forEach((item, index)=>{
    const point = document.createElementNS('http://www.w3.org/2000/svg','circle');
    point.classList.add('about-timeline-point');
    point.setAttribute('cx', item.x); point.setAttribute('cy', item.y); point.setAttribute('r', '7');
    point.setAttribute('tabindex','0'); point.setAttribute('aria-label', item.title);
    const show = ()=>{
      tooltip.querySelector('strong').textContent = item.title;
      tooltip.querySelector('span').textContent = item.text;
      const wrap = document.getElementById('aboutTimelineWrap');
      const rect = wrap.getBoundingClientRect();
      const svgRect = document.getElementById('aboutTimeline').getBoundingClientRect();
      const scaleX = svgRect.width / 600, scaleY = svgRect.height / 250;
      const left = Math.min(Math.max(8, (item.x * scaleX) - 76), rect.width - tooltip.offsetWidth - 8);
      const top = Math.max(30, (item.y * scaleY) - 72);
      tooltip.style.left = left + 'px'; tooltip.style.top = top + 'px'; tooltip.classList.add('show');
    };
    const hide = ()=>tooltip.classList.remove('show');
    point.addEventListener('mouseenter', show); point.addEventListener('mouseleave', hide);
    point.addEventListener('focus', show); point.addEventListener('blur', hide);
    group.appendChild(point);
  });
}

// --- windows ---
document.querySelectorAll('.icon').forEach(icon=>{
  icon.addEventListener('click', ()=>{ openWindow(icon.dataset.win); SFX.open(); });
  icon.addEventListener('mouseenter', ()=> SFX.hover());
});
document.querySelectorAll('[data-close]').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const win = e.target.closest('.window');
    win.classList.remove('open','maximized','minimized');
    clearMinimizedChip(win.id.replace('win-',''));
    SFX.close();
  });
});
document.querySelectorAll('[data-min]').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    minimizeWindow(e.target.closest('.window'));
    SFX.close();
  });
});
function toggleMaximize(win){
  const dict = settingsI18n[prefs.lang];
  const maxBtn = win.querySelector('.win-max');
  if(win.classList.contains('maximized')){
    win.classList.remove('maximized');
    win.style.top = win.dataset.prevTop || '';
    win.style.left = win.dataset.prevLeft || '';
    win.style.width = win.dataset.prevWidth || '';
    win.style.height = win.dataset.prevHeight || '';
    if(maxBtn){ maxBtn.innerHTML='&#9633;'; maxBtn.title=dict.winMax; maxBtn.setAttribute('aria-label',dict.winMax); }
  }else{
    win.dataset.prevTop = win.style.top;
    win.dataset.prevLeft = win.style.left;
    win.dataset.prevWidth = win.style.width;
    win.dataset.prevHeight = win.style.height;
    win.classList.add('maximized');
    win.style.zIndex = 40;
    if(maxBtn){ maxBtn.innerHTML='&#10697;'; maxBtn.title=dict.winRestore; maxBtn.setAttribute('aria-label',dict.winRestore); }
  }
}
document.querySelectorAll('[data-max]').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    toggleMaximize(e.target.closest('.window'));
    SFX.click();
  });
});

document.querySelectorAll('.flame-btn, .caret-btn, .tray-item').forEach(el=>{
  el.addEventListener('mouseenter', ()=> SFX.hover());
});

// drag windows by titlebar
document.querySelectorAll('.window').forEach(win=>{
  const bar = win.querySelector('.win-titlebar');
  let dragging=false, ox=0, oy=0;
  bar.addEventListener('mousedown', e=>{
    if(e.target.closest('.win-controls') || win.classList.contains('maximized')) return;
    dragging=true; ox=e.clientX-win.offsetLeft; oy=e.clientY-win.offsetTop;
    win.style.zIndex = 40;
  });
  bar.addEventListener('dblclick', e=>{
    if(e.target.closest('.win-controls')) return;
    toggleMaximize(win);
    SFX.click();
  });
  window.addEventListener('mousemove', e=>{
    if(!dragging) return;
    win.style.left = (e.clientX-ox)+'px';
    win.style.top = (e.clientY-oy)+'px';
  });
  window.addEventListener('mouseup', ()=> dragging=false);
});
