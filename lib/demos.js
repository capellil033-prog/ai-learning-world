window.LearningDemos = (() => {
  'use strict';
  function render(host, demo, done) {
    host.innerHTML = `<section class="demo-box"><span class="eyebrow">SELBST AUSPROBIEREN</span><h3>${demo.title}</h3><div class="demo-content"></div><p class="demo-explanation">${demo.explanation || ''}</p><p class="demo-feedback" role="status"></p></section>`;
    const content=host.querySelector('.demo-content'),feedback=host.querySelector('.demo-feedback');
    const finish=text=>{feedback.textContent=text;feedback.classList.add('success');done(demo.id);};
    if(demo.type==='generation'){
      let step=0;content.innerHTML=`<p class="demo-prompt">Prompt: ${demo.prompt}</p><output class="generated-text" aria-live="polite">▌</output><p class="demo-context">0 neue Tokens im Kontext</p><button class="secondary" type="button">Nächstes Token</button>`;
      const button=content.querySelector('button');button.addEventListener('click',()=>{
        step++;content.querySelector('output').textContent=demo.tokens.slice(0,step).join('')+(step<demo.tokens.length?'▌':'');content.querySelector('.demo-context').textContent=`${step} neue Tokens im Kontext`;
        if(step===demo.tokens.length){button.disabled=true;finish('Ausgabe beendet. Du hast gesehen, wie jedes Token den Kontext erweitert.');}
      });
    }
  }
  return {render};
})();
