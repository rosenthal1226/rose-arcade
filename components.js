// Reusable UI components.
(function(){
  // Pill mode toggle. Usage:
  //   const t = arcadeUI.toggle({ options:[{value:'cpu',label:'VS CPU'},{value:'2p',label:'2 PLAYER'}], value:'cpu', onChange:fn });
  //   parent.appendChild(t.el);
  function toggle({ options, value, onChange }) {
    const el = document.createElement('div');
    el.className = 'mode-toggle';

    const slider = document.createElement('div');
    slider.className = 'slider';
    el.appendChild(slider);

    const optEls = options.map(o => {
      const b = document.createElement('div');
      b.className = 'opt';
      b.textContent = o.label;
      b.dataset.value = o.value;
      b.onclick = () => {
        if(b.dataset.value === current) return;
        set(b.dataset.value);
        if(window.sfx) sfx.click();
        onChange && onChange(current);
      };
      el.appendChild(b);
      return b;
    });

    let current = value;
    function positionSlider(){
      const i = options.findIndex(o => o.value === current);
      const target = optEls[i];
      if(!target) return;
      slider.style.left = target.offsetLeft + 'px';
      slider.style.width = target.offsetWidth + 'px';
    }
    function set(v){
      current = v;
      optEls.forEach(b => b.classList.toggle('active', b.dataset.value === v));
      positionSlider();
    }

    set(value);
    requestAnimationFrame(positionSlider);
    window.addEventListener('resize', positionSlider);

    return { el, set, get: () => current };
  }

  window.arcadeUI = { toggle };
})();
