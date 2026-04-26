// Shared game library: juice (particles, shake, popups), pause, game-over, scores, difficulty.
(function(){
  // ---------- Persistent scores / leaderboard ----------
  function recordScore(gameId, score, meta = {}){
    const key = 'arcade_scores_' + gameId;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({ score, t: Date.now(), ...meta });
    list.sort((a,b) => (b.score||0) - (a.score||0));
    const trimmed = list.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(trimmed));
    return trimmed;
  }
  function topScores(gameId){
    return JSON.parse(localStorage.getItem('arcade_scores_'+gameId) || '[]');
  }
  function bestScore(gameId){
    const top = topScores(gameId);
    return top.length ? top[0].score : 0;
  }
  function setBestIfHigher(gameId, score){
    const cur = bestScore(gameId);
    if(score > cur){
      recordScore(gameId, score);
      // Push to global leaderboard if Firebase is wired up
      if(window.arcadeScores) arcadeScores.submit(gameId, score);
      return true;
    }
    return false;
  }

  // ---------- Difficulty ----------
  function getDiff(gameId, defaultD = 'normal'){
    return localStorage.getItem('arcade_diff_'+gameId) || defaultD;
  }
  function setDiff(gameId, d){ localStorage.setItem('arcade_diff_'+gameId, d); }

  // ---------- Screen shake ----------
  function shake(el, intensity = 6, duration = 300){
    if(!el) return;
    const start = performance.now();
    function step(now){
      const t = (now - start) / duration;
      if(t >= 1){ el.style.transform = ''; return; }
      const f = (1 - t) * intensity;
      const x = (Math.random()*2-1) * f;
      const y = (Math.random()*2-1) * f;
      el.style.transform = `translate(${x}px,${y}px)`;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    if(navigator.vibrate) navigator.vibrate(Math.min(80, duration/4));
  }

  // ---------- Particles on a canvas ----------
  // pass the game canvas; particles drawn during caller's render or via burst overlay
  // Burst returns an array of particles you can draw + step each frame, OR you can use the overlay version.
  function spawnParticles(arr, x, y, opts = {}){
    const count = opts.count || 18;
    const color = opts.color || '#ffe14d';
    const speed = opts.speed || 4;
    for(let i=0;i<count;i++){
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.5 + Math.random());
      arr.push({
        x, y,
        vx: Math.cos(a)*v, vy: Math.sin(a)*v,
        life: 1,
        decay: 0.025 + Math.random()*0.02,
        size: 2 + Math.random()*3,
        color
      });
    }
  }
  function stepParticles(arr){
    for(let i = arr.length - 1; i >= 0; i--){
      const p = arr[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life -= p.decay;
      if(p.life <= 0) arr.splice(i, 1);
    }
  }
  function drawParticles(ctx, arr){
    for(const p of arr){
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // ---------- DOM-based particles (for non-canvas games) ----------
  function domBurst(targetEl, opts = {}){
    if(!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const count = opts.count || 14;
    const color = opts.color || 'var(--neon-yellow)';
    for(let i=0;i<count;i++){
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.background = color;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 80;
      p.style.setProperty('--dx', Math.cos(a)*v + 'px');
      p.style.setProperty('--dy', Math.sin(a)*v + 'px');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  // ---------- Floating score popup ----------
  function popup(targetEl, text, opts = {}){
    const rect = targetEl.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'score-popup';
    el.textContent = text;
    el.style.left = (rect.left + rect.width/2 + (opts.dx||0)) + 'px';
    el.style.top = (rect.top + rect.height/2 + (opts.dy||0)) + 'px';
    if(opts.color) el.style.color = opts.color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  // ---------- Game over modal ----------
  function gameOver({ title='GAME OVER', subtitle='', stats=[], onRestart, onQuit }){
    const overlay = document.createElement('div');
    overlay.className = 'gameover-overlay';
    const statsHtml = stats.map(s => `<div class="go-stat"><span>${s.label}</span><b>${s.value}</b></div>`).join('');
    overlay.innerHTML = `
      <div class="gameover-card">
        <div class="gameover-title">${title}</div>
        ${subtitle ? `<div class="gameover-sub">${subtitle}</div>` : ''}
        ${stats.length ? `<div class="gameover-stats">${statsHtml}</div>` : ''}
        <div class="gameover-actions">
          <button class="btn" id="go-restart">▶ AGAIN</button>
          <button class="btn btn-secondary" id="go-quit">◄ ARCADE</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    overlay.querySelector('#go-restart').onclick = () => { overlay.remove(); if(window.sfx) sfx.coin(); onRestart && onRestart(); };
    overlay.querySelector('#go-quit').onclick = () => { if(window.sfx) sfx.click(); onQuit ? onQuit() : (location.href='../index.html'); };
    return overlay;
  }

  // ---------- Pause menu ----------
  let pauseEl = null;
  function pause({ onResume, onRestart, onQuit }){
    if(pauseEl) return;
    pauseEl = document.createElement('div');
    pauseEl.className = 'pause-overlay';
    pauseEl.innerHTML = `
      <div class="pause-card">
        <div class="pause-title">‖ PAUSED</div>
        <div class="pause-actions">
          <button class="btn" id="p-resume">▶ RESUME</button>
          <button class="btn btn-secondary" id="p-restart">↻ RESTART</button>
          <button class="btn btn-danger" id="p-quit">◄ ARCADE</button>
        </div>
      </div>`;
    document.body.appendChild(pauseEl);
    requestAnimationFrame(() => pauseEl.classList.add('open'));
    pauseEl.querySelector('#p-resume').onclick = () => { unpause(); onResume && onResume(); };
    pauseEl.querySelector('#p-restart').onclick = () => { unpause(); if(window.sfx) sfx.click(); onRestart && onRestart(); };
    pauseEl.querySelector('#p-quit').onclick = () => { location.href='../index.html'; };
    if(window.sfx) sfx.click();
  }
  function unpause(){
    if(!pauseEl) return;
    pauseEl.classList.remove('open');
    setTimeout(() => { if(pauseEl){ pauseEl.remove(); pauseEl = null; } }, 250);
  }
  function isPaused(){ return !!pauseEl; }

  // ---------- Standard top-bar pause button ----------
  function mountPauseButton(headerEl, handlers){
    const btn = document.createElement('button');
    btn.className = 'pause-btn';
    btn.title = 'Pause';
    btn.textContent = '‖';
    btn.onclick = () => pause(handlers);
    headerEl.appendChild(btn);
    document.addEventListener('keydown', e => {
      if(e.key.toLowerCase() === 'p' || e.key === 'Escape'){
        if(isPaused()) unpause();
        else pause(handlers);
        e.preventDefault();
      }
    });
    return btn;
  }

  // ---------- Player chip helper ----------
  function playerChip(slot, color){
    const av = window.arcadeAvatars ? arcadeAvatars.get(slot) : {e:'🎮',n:slot.toUpperCase()};
    const el = document.createElement('div');
    el.className = 'player-chip';
    el.style.setProperty('--c', color);
    el.innerHTML = `<span class="av"></span><span class="pname">${av.n}</span><b class="pscore">0</b>`;
    arcadeAvatars.renderInto(el.querySelector('.av'), av);
    el.update = (score) => { el.querySelector('.pscore').textContent = score; };
    el.refresh = () => {
      const a = arcadeAvatars.get(slot);
      arcadeAvatars.renderInto(el.querySelector('.av'), a);
      el.querySelector('.pname').textContent = a.n;
    };
    el.setLabel = (txt) => { el.querySelector('.pname').textContent = txt; };
    el.setEmoji = (e) => { el.querySelector('.av').textContent = e; };
    document.addEventListener('avatarchange', e => { if(e.detail.slot === slot) el.refresh(); });
    return el;
  }

  // ---------- Fit a canvas inside a flex play-area ----------
  function fitCanvasToBox(canvas, box, opts = {}){
    const aspect = opts.aspect || 1;
    const snap = opts.snap || 1;
    const r = box.getBoundingClientRect();
    let w = Math.max(120, r.width - 4);
    let h = Math.max(120, r.height - 4);
    if(w / aspect > h){ w = h * aspect; }
    else { h = w / aspect; }
    if(snap > 1){
      w = Math.floor(w / snap) * snap;
      h = Math.floor(h / snap) * snap;
    } else {
      w = Math.floor(w);
      h = Math.floor(h);
    }
    canvas.width = w;
    canvas.height = h;
    return { w, h };
  }

  // ---------- Coin economy ----------
  const COIN_KEY = 'arcade_coins';
  function getCoins(){ return parseInt(localStorage.getItem(COIN_KEY) || '5'); }
  function setCoins(n){ localStorage.setItem(COIN_KEY, String(Math.max(0, n))); document.dispatchEvent(new CustomEvent('coinchange', { detail:{ coins: getCoins() } })); }
  function addCoins(n, reason){
    const cur = getCoins(); const next = cur + n;
    setCoins(next);
    if(n > 0) document.dispatchEvent(new CustomEvent('coinearn', { detail:{ amount: n, reason: reason || '' } }));
    return next;
  }

  // ---------- Achievements ----------
  const ACHIEVEMENTS = [
    { id:'first_play',   icon:'🎮', name:'FIRST PLAY',     desc:'Play any game',                  reward: 2 },
    { id:'first_win',    icon:'🏆', name:'FIRST WIN',      desc:'Score in any game',              reward: 3 },
    { id:'snake_20',     icon:'🐍', name:'SNAKE CHARMER',  desc:'Score 20+ in Snake',             reward: 5 },
    { id:'tetris_clear', icon:'🟦', name:'LINE CLEAR',     desc:'Clear a line in Tetris',         reward: 3 },
    { id:'tetris_4',     icon:'🟦', name:'TETRIS!',        desc:'Clear 4 lines at once',          reward: 10 },
    { id:'breakout_lvl', icon:'🧱', name:'BRICK MASTER',   desc:'Beat a level in Breakout',       reward: 5 },
    { id:'invaders_3',   icon:'👾', name:'ALIEN HUNTER',   desc:'Reach Wave 3 in Invaders',       reward: 5 },
    { id:'flappy_10',    icon:'🐦', name:'FLAPPY 10',      desc:'Score 10 in Flappy',             reward: 5 },
    { id:'mole_combo',   icon:'🔨', name:'COMBO KING',     desc:'5x combo in Whack-a-Mole',       reward: 5 },
    { id:'pong_win',     icon:'🏓', name:'PONG CHAMP',     desc:'Beat CPU in Pong',               reward: 5 },
    { id:'mines_clear',  icon:'💣', name:'BOMB SQUAD',     desc:'Clear Minesweeper',              reward: 5 },
    { id:'memory_full',  icon:'🧠', name:'TOTAL RECALL',   desc:'Match all pairs',                reward: 3 },
    { id:'theme_swap',   icon:'🎨', name:'STYLE CHAMP',    desc:'Try a theme',                    reward: 2 },
    { id:'avatar_swap',  icon:'👤', name:'IDENTITY',       desc:'Change your avatar',             reward: 2 },
    { id:'play_all',     icon:'🌟', name:'EXPLORER',       desc:'Play every game',                reward: 20 },
  ];
  const ACH_KEY = 'arcade_achievements';
  function unlockedAchievements(){ try { return JSON.parse(localStorage.getItem(ACH_KEY) || '[]'); } catch(_){ return []; } }
  function isUnlocked(id){ return unlockedAchievements().includes(id); }
  function unlock(id){
    if(isUnlocked(id)) return false;
    const list = unlockedAchievements();
    list.push(id);
    localStorage.setItem(ACH_KEY, JSON.stringify(list));
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if(a){
      addCoins(a.reward, 'achievement: '+a.name);
      toast({ title: 'ACHIEVEMENT', body: a.icon + ' ' + a.name, sub: '+' + a.reward + ' COINS · ' + a.desc, color: '#ffe14d' });
      if(window.sfx) sfx.win();
    }
    return true;
  }

  function trackPlayed(gameId){
    const k = 'arcade_played';
    const set = new Set(JSON.parse(localStorage.getItem(k) || '[]'));
    set.add(gameId);
    localStorage.setItem(k, JSON.stringify([...set]));
    unlock('first_play');
    // EXPLORER if all 13 games played
    const allGames = ['snake','snake-duel','tictactoe','pong','memory','2048','whackamole','rps','minesweeper','tetris','breakout','invaders','flappy'];
    if(allGames.every(g => set.has(g))) unlock('play_all');
  }

  // ---------- Toast notifications ----------
  function toast({ title='', body='', sub='', color='#4df0ff', duration=3500 }){
    const el = document.createElement('div');
    el.className = 'arcade-toast';
    el.style.setProperty('--c', color);
    el.innerHTML = `
      <div class="toast-title">${title}</div>
      <div class="toast-body">${body}</div>
      ${sub ? `<div class="toast-sub">${sub}</div>` : ''}
    `;
    let host = document.getElementById('toast-host');
    if(!host){ host = document.createElement('div'); host.id = 'toast-host'; document.body.appendChild(host); }
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, duration);
  }

  // ---------- Insert-coin ceremony ----------
  function insertCoin(onComplete){
    const overlay = document.createElement('div');
    overlay.className = 'insert-coin-overlay';
    overlay.innerHTML = `
      <div class="ic-stage">
        <div class="ic-coin">🪙</div>
        <div class="ic-slot"></div>
      </div>
      <div class="ic-text">INSERT COIN</div>
      <div class="ic-wipe"></div>
    `;
    document.body.appendChild(overlay);
    if(window.sfx) sfx.coin();
    // consume phase: coin sinks into slot, wipe transitions out
    setTimeout(() => {
      overlay.classList.add('consume');
      if(window.sfx) sfx.click();
    }, 850);
    setTimeout(() => {
      overlay.remove();
      onComplete && onComplete();
    }, 1450);
  }

  // ---------- Attract mode (idle demo) ----------
  function attractMode({ trigger, action, idleMs = 30000 }){
    let timer = null, active = false;
    const reset = () => {
      if(active){ active = false; document.dispatchEvent(new CustomEvent('attractend')); }
      clearTimeout(timer);
      timer = setTimeout(() => { active = true; document.dispatchEvent(new CustomEvent('attractstart')); trigger && trigger(); }, idleMs);
    };
    ['mousedown','touchstart','keydown','wheel','mousemove'].forEach(ev => {
      document.addEventListener(ev, () => { if(active && action) action(); reset(); }, { passive: true });
    });
    reset();
    return { isActive: () => active, reset };
  }

  window.gamelib = {
    recordScore, topScores, bestScore, setBestIfHigher,
    getDiff, setDiff,
    shake, spawnParticles, stepParticles, drawParticles, domBurst, popup,
    gameOver, pause, unpause, isPaused, mountPauseButton,
    playerChip, fitCanvasToBox,
    // new:
    getCoins, addCoins, setCoins,
    ACHIEVEMENTS, unlockedAchievements, isUnlocked, unlock, trackPlayed,
    toast, insertCoin, attractMode,
  };
})();
