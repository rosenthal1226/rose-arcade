// Shared chiptune SFX via Web Audio API. No asset files.
(function(){
  let ctx;
  let muted = localStorage.getItem('arcade_mute') === '1';

  function ac(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Core tone generator: type, freq, duration, volume, optional pitch slide
  function tone(type, freq, dur, vol=0.15, slideTo=null){
    if(muted) return;
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type; o.frequency.value = freq;
    if(slideTo!==null) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur);
  }

  function noise(dur, vol=0.15){
    if(muted) return;
    const a = ac();
    const buf = a.createBuffer(1, a.sampleRate*dur, a.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
    const src = a.createBufferSource();
    const g = a.createGain();
    g.gain.value = vol;
    src.buffer = buf; src.connect(g); g.connect(a.destination);
    src.start();
  }

  function seq(notes, type='square'){
    if(muted) return;
    const a = ac();
    let t = a.currentTime;
    notes.forEach(([f,d,v=0.15])=>{
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t+d);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t+d);
      t += d;
    });
  }

  window.sfx = {
    blip:    ()=>tone('square', 660, 0.06, 0.12),
    click:   ()=>tone('square', 880, 0.04, 0.10),
    coin:    ()=>seq([[988,0.07],[1318,0.12]], 'square'),
    hit:     ()=>tone('square', 220, 0.08, 0.18, 110),
    paddle:  ()=>tone('square', 440, 0.05, 0.15),
    wall:    ()=>tone('triangle', 330, 0.06, 0.12),
    powerup: ()=>seq([[523,0.06],[659,0.06],[784,0.08],[1047,0.12]], 'square'),
    merge:   ()=>tone('square', 540, 0.08, 0.14, 720),
    flip:    ()=>tone('triangle', 600, 0.05, 0.10),
    win:     ()=>seq([[523,0.1],[659,0.1],[784,0.1],[1047,0.2]], 'square'),
    lose:    ()=>seq([[392,0.12],[330,0.12],[262,0.2]], 'square'),
    explode: ()=>noise(0.4, 0.25),
    flag:    ()=>tone('square', 740, 0.05, 0.10),
    countdown: ()=>tone('square', 500, 0.1, 0.14),
  };

  window.arcadeAudio = {
    isMuted: ()=>muted,
    toggle: ()=>{
      muted = !muted;
      localStorage.setItem('arcade_mute', muted?'1':'0');
      updateBtn();
      return muted;
    },
    mount(){
      if(document.getElementById('mute-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'mute-btn';
      btn.title = 'Toggle sound';
      btn.style.cssText = 'position:fixed;top:14px;right:14px;z-index:200;background:rgba(0,0,0,0.7);border:2px solid #00ffff;color:#00ffff;font-family:monospace;font-size:18px;width:42px;height:42px;border-radius:50%;cursor:pointer;box-shadow:0 0 10px #00ffff;text-shadow:0 0 8px #00ffff;';
      btn.onclick = ()=>{ window.arcadeAudio.toggle(); sfx.click(); };
      document.body.appendChild(btn);
      updateBtn();
    }
  };

  function updateBtn(){
    const b = document.getElementById('mute-btn');
    if(b) b.textContent = muted ? '🔇' : '🔊';
  }

  // Mount on DOM ready
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>window.arcadeAudio.mount());
  else window.arcadeAudio.mount();
})();
