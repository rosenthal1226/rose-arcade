// Theme registry + picker.
(function(){
  const THEMES = {
    rose:   { name:'ROSE',   pink:'#ff3068', cyan:'#4df0ff', yellow:'#ffd166', green:'#5dff8a', orange:'#ff8a65', purple:'#cc44aa', bg:'#0f0008', bg2:'#200010' },
    matrix: { name:'MATRIX', pink:'#39ff14', cyan:'#39ff14', yellow:'#aaff66', green:'#39ff14', orange:'#88ff44', purple:'#66dd33', bg:'#000800', bg2:'#001500' },
    amber:  { name:'AMBER',  pink:'#ffaa00', cyan:'#ffcc44', yellow:'#ffdd66', green:'#ff9900', orange:'#ffaa00', purple:'#ff8800', bg:'#1a0a00', bg2:'#2a1500' },
    ice:    { name:'ICE',    pink:'#88ddff', cyan:'#aaeeff', yellow:'#ccffff', green:'#66ffdd', orange:'#88ffee', purple:'#aaddff', bg:'#001020', bg2:'#002040' },
    sunset: { name:'SUNSET', pink:'#ff6699', cyan:'#ffaa66', yellow:'#ffdd66', green:'#ff8866', orange:'#ff9944', purple:'#cc66bb', bg:'#1a0010', bg2:'#330020' },
  };

  function apply(key){
    // migrate old 'neon' saves → 'rose'
    if(key === 'neon') key = 'rose';
    const t = THEMES[key] || THEMES.rose;
    const r = document.documentElement.style;
    r.setProperty('--neon-pink', t.pink);
    r.setProperty('--neon-cyan', t.cyan);
    r.setProperty('--neon-yellow', t.yellow);
    r.setProperty('--neon-green', t.green);
    r.setProperty('--neon-orange', t.orange);
    r.setProperty('--neon-purple', t.purple);
    r.setProperty('--bg', t.bg);
    r.setProperty('--bg2', t.bg2);
    localStorage.setItem('arcade_theme', key);
    document.dispatchEvent(new CustomEvent('themechange', { detail:{key, theme:t} }));
  }
  function current(){
    const saved = localStorage.getItem('arcade_theme');
    if(!saved || saved === 'neon') return 'rose';
    return saved;
  }
  function list(){ return Object.entries(THEMES).map(([k,v]) => ({ key:k, ...v })); }

  apply(current());

  window.arcadeThemes = { apply, current, list, THEMES };
})();
