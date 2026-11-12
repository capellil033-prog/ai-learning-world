window.LearningDemos = (() => {
  'use strict';
  function render(host, demo, done) {
    host.innerHTML = `<section class="demo-box"><span class="eyebrow">SELBST AUSPROBIEREN</span><h3>${demo.title}</h3><div class="demo-content"></div><p class="demo-explanation">${demo.explanation || ''}</p><p class="demo-feedback" role="status"></p></section>`;
    const content=host.querySelector('.demo-content'),feedback=host.querySelector('.demo-feedback');
    const finish=text=>{feedback.textContent=text;feedback.classList.add('success');done(demo.id);};
    if(demo.type==='tool'){
      content.innerHTML='<ol class="demo-flow"><li>Model</li><li>Tool Request</li><li>Tool</li><li>Result</li><li>Context</li><li>Model</li></ol><label>Tool Call (JSON)<textarea rows="5" maxlength="800" spellcheck="false"></textarea></label><button class="secondary" id="run-demo-tool" type="button">Aufruf prüfen und ausführen</button><pre class="tool-result" aria-live="polite"></pre><button class="secondary" id="append-demo-result" type="button" disabled>Ergebnis in Kontext aufnehmen</button><pre class="tool-context" aria-live="polite"></pre>';
      const input=content.querySelector('textarea'),append=content.querySelector('#append-demo-result');input.value=JSON.stringify(demo.call,null,2);let pending;
      input.addEventListener('input',()=>{pending=null;append.disabled=true;content.querySelector('.tool-context').textContent='';});
      content.querySelector('#run-demo-tool').addEventListener('click',()=>{pending=LearningLogic.toolCall(input.value,demo);feedback.classList.remove('success');content.querySelector('.tool-context').textContent='';if(pending.error){feedback.textContent=pending.error;append.disabled=true;content.querySelector('.tool-result').textContent='Nicht ausgeführt.';}else{feedback.textContent='Schema geprüft. Das Beispielwerkzeug wurde ausgeführt.';content.querySelector('.tool-result').textContent='Tool Result:\n'+JSON.stringify(pending.result,null,2);append.disabled=false;}});
      append.addEventListener('click',()=>{if(!pending||pending.error)return;content.querySelector('.tool-context').textContent='Kontext für den nächsten Modellaufruf:\nNutzerziel\n+ Tool Call: '+JSON.stringify(pending.call)+'\n+ Tool Result: '+JSON.stringify(pending.result)+'\n→ Modell kann mit diesen Daten antworten.';finish('Der Rückweg ist vollständig: Werkzeugdaten sind jetzt Teil des Modellkontexts.');});
    }
    if(demo.type==='tokenize'){
      content.innerHTML='<label>Dein Text<textarea maxlength="500" rows="3"></textarea></label><button class="secondary" type="button">Text zerlegen</button><div class="token-pieces" aria-live="polite"></div>';
      content.querySelector('textarea').value=demo.text;
      content.querySelector('button').addEventListener('click',()=>{
        const text=content.querySelector('textarea').value;if(!text.trim()){feedback.textContent='Gib zuerst einen Text ein.';return;}
        const pieces=LearningLogic.tokenize(text),tokens=content.querySelector('.token-pieces');tokens.replaceChildren();
        pieces.forEach(piece=>{const span=document.createElement('span');span.textContent=piece.replace(/ /g,'␣').replace(/\n/g,'↵');tokens.append(span);});
        finish(`${pieces.length} illustrative Bausteine. Der Originaltext lässt sich daraus wieder zusammensetzen.`);
      });
    }
    if(demo.type==='cargo'){
      content.innerHTML=`<div class="cargo-demo-vehicle"><i data-lucide="truck"></i><span>SNOWCAT · KONTEXTLADUNG</span></div><div class="demo-options">${demo.cargo.map(c=>`<label><input type="checkbox" value="${c.id}" checked><span>${c.label}<small>${c.tokens} Beispiel-Tokens</small></span></label>`).join('')}</div><p class="cargo-total" role="status"></p><meter min="0" max="${demo.capacity}" value="0" aria-label="Belegte Kontextkapazität"></meter><button class="secondary" type="button">Über den Pass fahren</button>`;
      const check=()=>LearningLogic.cargo(demo,[...content.querySelectorAll('input:checked')].map(c=>c.value));
      const refresh=()=>{const result=check();content.querySelector('.cargo-total').textContent=`${result.used} / ${demo.capacity} Tokens · davon ${demo.reserve} für die Ausgabe reserviert${result.over?' · Überladen!':''}`;content.querySelector('meter').value=result.used;};
      content.querySelectorAll('input').forEach(c=>c.addEventListener('change',refresh));refresh();
      content.querySelector('button').addEventListener('click',()=>{const result=check();feedback.classList.remove('success');if(result.over){feedback.textContent='Die Ladung ist zu gross. Entferne unpassenden Kontext.';return;}if(result.missing.length){feedback.textContent='Die Aufgabe oder ihre Quelle fehlt. Weniger Kontext allein genügt nicht.';return;}finish(`Pass geschafft: ${result.used} Tokens inklusive Ausgabereserve. Die nötigen Informationen sind an Bord.`);content.querySelector('.cargo-demo-vehicle').classList.add('departed');});
    }
    if(demo.type==='cache'){
      content.innerHTML='<p>Gespeicherter Anfang:</p><pre class="cache-prefix"></pre><label>Nächster Aufruf<textarea rows="3" maxlength="500"></textarea></label><button class="secondary" type="button">Präfix prüfen</button>';
      content.querySelector('pre').textContent=demo.prefix;content.querySelector('textarea').value=demo.request;
      content.querySelector('button').addEventListener('click',()=>{const hit=content.querySelector('textarea').value.startsWith(demo.prefix);feedback.classList.remove('success');if(hit)finish('Cache-Treffer: identischer Anfang. Neue Tokens benötigen weiter Berechnung; der Kontext wird nicht kleiner.');else feedback.textContent='Kein Treffer: Der Anfang wurde verändert. Ähnliche Bedeutung reicht nicht. Stelle den gespeicherten Anfang wieder her.';});
    }
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
