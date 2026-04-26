// Character roster + name + custom image upload support.
(function(){
  // Shared images bundled with the site — everyone visiting sees these as picker options.
  // Drop image files at the listed paths and they appear automatically.
  const SHARED_IMAGES = [
    { src:'assets/avatars/churu.jpg',  n:'CHURU' },
    { src:'assets/avatars/doodle.jpg', n:'DOODLE' },
  ];

  const DEFAULT_ROSTER = [
    { e:'🦸‍♂️', n:'CAP BLAST' },     { e:'🦸‍♀️', n:'STARLIGHT' },
    { e:'🥷',  n:'SHADOW' },          { e:'🧙',  n:'WIZ' },
    { e:'🤖',  n:'BIT-9' },           { e:'🦹',  n:'VOLT' },
    { e:'👑',  n:'REGENT' },          { e:'🧛',  n:'NIGHT' },
    { e:'🐉',  n:'DRAGO' },           { e:'🦊',  n:'TAIL' },
    { e:'🐱',  n:'WHISKER' },         { e:'🦖',  n:'REX' },
    { e:'🐺',  n:'FANG' },            { e:'🦁',  n:'MANE' },
    { e:'👽',  n:"Z'ORG" },           { e:'🚀',  n:'ROCKET' },
    { e:'🦾',  n:'FLEX' },            { e:'⚔️',  n:'BLADE' },
    { e:'🔥',  n:'BLAZE' },           { e:'⚡',  n:'BOLT' },
    { e:'💀',  n:'GRIM' },            { e:'🎯',  n:'BULLSEYE' },
    { e:'🎮',  n:'P1' },              { e:'👾',  n:'GLITCH' },
    { e:'🍕',  n:'SLICE' },           { e:'🌮',  n:'TACO' },
    { e:'🎸',  n:'AXE' },             { e:'🦔',  n:'SPIKE' },
    { e:'🐸',  n:'HOPPS' },           { e:'🦅',  n:'TALON' },
  ];

  const DEFAULT = { p1: {e:'🎮', n:'P1'}, p2: {e:'👾', n:'P2'} };
  const USER_KEY = 'arcade_user_avatars';

  function getUserRoster(){ try { return JSON.parse(localStorage.getItem(USER_KEY) || '[]'); } catch(_){ return []; } }
  function saveUserRoster(arr){ localStorage.setItem(USER_KEY, JSON.stringify(arr)); }
  function getRoster(){ return [...getUserRoster(), ...DEFAULT_ROSTER]; }

  function get(slot){
    const raw = localStorage.getItem('arcade_avatar_'+slot);
    if(!raw) return DEFAULT[slot];
    try { return JSON.parse(raw); } catch(_){
      const m = DEFAULT_ROSTER.find(r => r.e === raw);
      return m || DEFAULT[slot];
    }
  }
  function set(slot, av){
    localStorage.setItem('arcade_avatar_'+slot, JSON.stringify(av));
    document.dispatchEvent(new CustomEvent('avatarchange', { detail:{slot,av} }));
  }

  // ---- Render helpers ----
  function imgSrc(av){ return av && (av.img || av.src); }
  function html(av){
    const src = imgSrc(av);
    if(src) return `<img src="${src}" alt="${av.n||''}" class="av-img-render">`;
    return av ? av.e : '';
  }
  function renderInto(el, av){
    if(!el) return;
    const src = imgSrc(av);
    if(src) el.innerHTML = `<img src="${src}" alt="${av.n||''}" class="av-img-render">`;
    else el.textContent = av ? av.e : '';
  }

  // ---- Modal ----
  let modal, activeSlot, pending;

  function ensureModal(){
    if(modal) return modal;
    modal = document.createElement('div');
    modal.className = 'av-modal';
    modal.innerHTML = `
      <div class="av-modal-inner">
        <div class="av-modal-title" id="av-title">SELECT AVATAR</div>
        <div class="av-grid" id="av-grid"></div>
        <div class="av-modal-actions">
          <button class="btn btn-danger" id="av-cancel">CANCEL</button>
          <button class="btn" id="av-save">SAVE</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target === modal) close(); });
    modal.querySelector('#av-cancel').onclick = close;
    return modal;
  }

  function open(slot){
    activeSlot = slot;
    pending = get(slot);
    ensureModal();
    modal.querySelector('#av-title').textContent = 'SELECT '+slot.toUpperCase()+' CHARACTER';
    refreshGrid();
    modal.querySelector('#av-save').onclick = () => {
      set(activeSlot, pending);
      if(window.sfx) sfx.coin();
      close();
    };
    modal.classList.add('open');
    if(window.sfx) sfx.click();
  }

  function refreshGrid(){
    const grid = modal.querySelector('#av-grid');
    grid.innerHTML = '';

    // Upload tile (always first)
    const up = document.createElement('button');
    up.className = 'av-option av-upload';
    up.innerHTML = `<div class="av-option-emoji">📷</div><div class="av-option-name">+ UPLOAD</div>`;
    up.onclick = () => triggerUpload();
    grid.appendChild(up);

    // User-uploaded
    const user = getUserRoster();
    user.forEach((r, idx) => {
      const b = document.createElement('button');
      const isSel = pending && pending.img === r.img;
      b.className = 'av-option av-custom' + (isSel?' selected':'');
      b.innerHTML = `
        <span class="av-del" data-idx="${idx}" title="Remove">×</span>
        <div class="av-option-emoji"><img src="${r.img}" class="av-img-render" alt="${r.n}"></div>
        <div class="av-option-name">${r.n}</div>`;
      b.onclick = (e) => {
        if(e.target.classList.contains('av-del')){
          e.stopPropagation();
          const u = getUserRoster();
          u.splice(idx, 1);
          saveUserRoster(u);
          if(window.sfx) sfx.click();
          refreshGrid();
          return;
        }
        pending = { img: r.img, n: r.n };
        grid.querySelectorAll('.av-option').forEach(x=>x.classList.remove('selected'));
        b.classList.add('selected');
        if(window.sfx) sfx.blip();
      };
      grid.appendChild(b);
    });

    // Shared bundled images (everyone sees these on the deployed site)
    SHARED_IMAGES.forEach(r => {
      const b = document.createElement('button');
      const isSel = pending && pending.src === r.src;
      b.className = 'av-option av-shared' + (isSel?' selected':'');
      b.innerHTML = `
        <div class="av-option-emoji"><img src="${r.src}" class="av-img-render" alt="${r.n}" onerror="this.parentElement.parentElement.style.display='none'"></div>
        <div class="av-option-name">${r.n}</div>`;
      b.onclick = () => {
        pending = { src: r.src, n: r.n };
        grid.querySelectorAll('.av-option').forEach(x=>x.classList.remove('selected'));
        b.classList.add('selected');
        if(window.sfx) sfx.blip();
      };
      grid.appendChild(b);
    });

    // Default emoji roster
    DEFAULT_ROSTER.forEach(r => {
      const b = document.createElement('button');
      const isSel = pending && pending.e === r.e && !pending.img;
      b.className = 'av-option' + (isSel?' selected':'');
      b.innerHTML = `<div class="av-option-emoji">${r.e}</div><div class="av-option-name">${r.n}</div>`;
      b.onclick = () => {
        pending = { e: r.e, n: r.n };
        grid.querySelectorAll('.av-option').forEach(x=>x.classList.remove('selected'));
        b.classList.add('selected');
        if(window.sfx) sfx.blip();
      };
      grid.appendChild(b);
    });
  }

  function triggerUpload(){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const SIZE = 256;
          const canvas = document.createElement('canvas');
          canvas.width = SIZE; canvas.height = SIZE;
          const ctx = canvas.getContext('2d');
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min)/2, sy = (img.height - min)/2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const name = promptName();
          if(name === null) return;
          const av = { img: dataUrl, n: name };
          const user = getUserRoster();
          user.unshift(av);
          try {
            saveUserRoster(user);
          } catch(err) {
            alert('Storage full — try removing an existing custom avatar first.');
            return;
          }
          pending = av;
          if(window.sfx) sfx.coin();
          refreshGrid();
        };
        img.onerror = () => alert('Could not read image.');
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function promptName(){
    const raw = window.prompt('NAME THIS AVATAR (max 12 chars):', 'CUSTOM');
    if(raw === null) return null;
    return (raw.trim() || 'CUSTOM').slice(0, 12).toUpperCase();
  }

  function close(){ if(modal) modal.classList.remove('open'); }

  window.arcadeAvatars = { get, set, open, list: DEFAULT_ROSTER, html, renderInto, getUserRoster };
})();
