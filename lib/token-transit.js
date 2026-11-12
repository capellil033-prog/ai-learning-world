'use strict';

const byId = (id) => document.getElementById(id);
const icons = () => window.lucide?.createIcons();
const stations = {
  input: { name: 'Input-Terminal', subtitle: 'Die Reise beginnt', icon: 'message-square', color: 0x7d9d84, position: [-27, 16], title: 'Alles beginnt mit Kontext.', text: 'Ein Prompt ist mehr als eine Frage. Systemanweisungen, Gesprächsverlauf und deine Nachricht bilden gemeinsam den Input für das Modell.', fact: 'Beispiel: „Warum ist der Himmel blau?“', cargo: 'Dein Prompt', count: '01', building: 'terminal' },
  tokens: { name: 'Token-Manufaktur', subtitle: 'Text wird zu Zahlen', icon: 'blocks', color: 0x78a290, position: [-29, -7], title: 'Wörter werden zu Bausteinen.', text: 'Der Tokenizer zerlegt Text in Tokens: Wörter, Wortteile oder Zeichen. Jedes Token erhält eine numerische ID, die im Modell in einen Vektor übersetzt wird.', fact: 'Illustrativ: [Warum] [ ist] [ der] [ Himmel] [ blau] [?]', cargo: 'Input-Tokens', count: '06', building: 'factory' },
  cache: { name: 'Cache-Lager', subtitle: 'Bekanntes wiederverwenden', icon: 'warehouse', color: 0xd9b85e, position: [-8, -20], title: 'Nicht alles neu berechnen.', text: 'Ein KV-Cache speichert Attention-Zwischenwerte bereits verarbeiteter Tokens. Ein exakt passendes Prompt-Präfix kann wiederverwendet werden, sofern die Anwendung Prefix-Caching unterstützt.', fact: 'Gespeichert werden Rechenzustände, nicht fertige Antworten.', cargo: 'Tokens + KV-Zustände', count: '06', building: 'warehouse' },
  prefill: { name: 'Kontext-Fabrik', subtitle: 'Prefill & Attention', icon: 'network', color: 0x62987f, position: [18, -16], title: 'Kontext wird verrechnet.', text: 'Im Prefill verarbeitet der Transformer die Input-Tokens. Attention verknüpft relevante Positionen; viele Schichten berechnen daraus kontextabhängige Darstellungen.', fact: 'Ohne Cache-Treffer wird der gesamte Prompt verarbeitet.', cargo: 'Kontext-Vektoren', count: '06', building: 'processor' },
  decode: { name: 'Token-Generator', subtitle: 'Ein Token nach dem anderen', icon: 'sparkles', color: 0x779bb0, position: [29, 6], title: 'Eine Antwort wächst.', text: 'Das Modell berechnet Wahrscheinlichkeiten für das nächste Token. Ein Decoding-Verfahren wählt eines aus. Dieses wird an den Kontext angehängt, dann folgt der nächste Schritt.', fact: 'Nächstes Token → Kontext erweitern → wiederholen.', cargo: 'Output-Tokens', count: '12', building: 'generator' },
  output: { name: 'Output-Hafen', subtitle: 'Aus Tokens wird eine Antwort', icon: 'send', color: 0xd89076, position: [5, 23], title: 'Die Ladung kommt an.', text: 'Die ausgegebenen Token-IDs werden wieder zu Text. Das endet etwa bei einem Stop-Token oder einem Längenlimit. Flüssiger Text ist dabei keine Garantie für eine richtige Antwort.', fact: '„Luftmoleküle streuen blaues Licht stärker als rotes.“', cargo: 'Deine Antwort', count: '✓', building: 'output' },
  context: { name: 'Kontext-Zentrale', subtitle: 'Ziel, Regeln & Werkzeuge', icon: 'clipboard-list', color: 0x78a290, position: [-29, -7], title: 'Ein Ziel mit Rahmen.', text: 'Die Agent-Anwendung stellt den Kontext zusammen: Nutzerziel, Regeln, Verlauf und die Beschreibungen verfügbarer Werkzeuge. Auch dieser Kontext wird tokenisiert.', fact: 'Auftrag: „Wie warm ist es gerade in Berlin?“', cargo: 'Ziel + Werkzeuge', count: '03', building: 'factory' },
  think: { name: 'Modell-Fabrik', subtitle: 'Der nächste Schritt', icon: 'cpu', color: 0x62987f, position: [-8, -20], title: 'Das Modell schlägt vor.', text: 'Ein LLM verarbeitet den Kontext und erzeugt entweder eine Antwort oder einen strukturierten Werkzeugaufruf. Auch hier laufen Tokenisierung, Prefill, Cache und Decoding ab.', fact: 'Vorschlag: weather({ city: "Berlin" })', cargo: 'Werkzeugaufruf', count: '01', building: 'processor' },
  tools: { name: 'Werkzeug-Werkstatt', subtitle: 'Die Anwendung handelt', icon: 'wrench', color: 0xd9b85e, position: [18, -16], title: 'Vom Vorschlag zur Aktion.', text: 'Nicht das Modell selbst, sondern die Agent-Anwendung prüft Argumente und Berechtigungen und führt das Werkzeug aus. Kritische Aktionen benötigen eine Freigabe.', fact: 'Hier simuliert: Wetterdienst → Berlin, 18 °C.', cargo: 'Werkzeug-Ergebnis', count: '18°', building: 'workshop' },
  observe: { name: 'Ergebnis-Lager', subtitle: 'Beobachten & ergänzen', icon: 'database', color: 0xd9b85e, position: [29, 6], title: 'Das Ergebnis wird Kontext.', text: 'Die Antwort des Werkzeugs wird als Nachricht an den Verlauf angehängt. Sie ist neue Information, keine vertrauenswürdige Systemanweisung. Fehler können ebenfalls zurückgemeldet werden.', fact: 'Neuer Kontext: { city: "Berlin", temperature: 18 }', cargo: 'Erweiterter Kontext', count: '+01', building: 'warehouse' },
  rethink: { name: 'Zurück zum Modell', subtitle: 'Der Agent Loop', icon: 'repeat-2', color: 0x62987f, position: [-8, -20], title: 'Ein weiterer Modelldurchlauf.', text: 'Mit dem Werkzeugergebnis wird das LLM erneut aufgerufen. Es kann weitere Werkzeuge anfordern oder antworten. Die Anwendung begrenzt Schleifen durch Budget, Zeit und maximale Schritte.', fact: 'Kontext → Modell → Werkzeug → Ergebnis → Modell.', cargo: 'Geprüfter Kontext', count: '02', building: 'processor' },
  finish: { name: 'Abschluss-Prüfung', subtitle: 'Antwort oder weiterer Loop?', icon: 'shield-check', color: 0x779bb0, position: [-16, 11], title: 'Wann ist das Ziel erreicht?', text: 'Hier erzeugt das Modell eine finale Antwort statt eines weiteren Werkzeugaufrufs. Die Anwendung beendet die Schleife. Sie kann zusätzlich Formate, Grenzen und Sicherheitsregeln prüfen.', fact: 'In dieser Simulation genügt ein Werkzeugaufruf.', cargo: 'Finale Antwort', count: '01', building: 'generator' },
  agentOutput: { name: 'Output-Hafen', subtitle: 'Das Ergebnis zurückgeben', icon: 'send', color: 0xd89076, position: [5, 23], title: 'Eine Antwort mit Grundlage.', text: 'Der Nutzer bekommt die finale Antwort, die hier auf dem Werkzeugergebnis basiert. Ein Agent ergänzt das Sprachmodell um Werkzeuge, Zustand und eine gesteuerte Ausführungsschleife.', fact: 'Simuliertes Ergebnis: „In Berlin sind es aktuell 18 °C.“', cargo: 'Deine Antwort', count: '✓', building: 'output' }
};
const routes = {
  llm: ['input', 'tokens', 'cache', 'prefill', 'decode', 'output'],
  agent: ['input', 'context', 'think', 'tools', 'observe', 'rethink', 'finish', 'agentOutput']
};
const stationDetails = {
  input: { role: 'Talstation · Annahme', input: 'Systemregeln, Gesprächsverlauf und deine Nachricht', steps: ['Die Anwendung nimmt die Nachricht entgegen und ergänzt die gültigen Systemanweisungen.', 'Frühere Nachrichten werden in ihrer Rollenverteilung hinzugefügt. Das Kontextfenster begrenzt, wie viel davon mitreisen kann.', 'Die vollständige Eingabe wird an die Tokenisierung übergeben. Hier ist noch keine Antwort entstanden.'], output: 'Ein geordneter Nachrichtenkontext für den nächsten Verarbeitungsschritt', caution: 'Das Modell kennt nur bereitgestellte Informationen und erlernte Muster. Es liest nicht automatisch deine Dateien oder das Internet.', example: 'System: Antworte verständlich.\nNutzer: Warum ist der Himmel blau?' },
  tokens: { role: 'Schneidwerk · Tokenisierung', input: 'Der zusammengesetzte Text aus der Talstation', steps: ['Ein festgelegtes Tokenizer-Verfahren zerlegt den Text in Einheiten aus seinem Vokabular.', 'Jede Einheit bekommt eine Token-ID. Wortgrenzen und Tokengrenzen sind nicht dasselbe; Leerzeichen können dazugehören.', 'Embedding-Vektoren und Positionsinformationen machen die Reihenfolge für den Transformer verarbeitbar.'], output: 'Eine geordnete Folge von Token-IDs mit Vektordarstellungen', caution: 'Ein Token ist nicht immer ein Wort. Die genaue Zerlegung hängt vom verwendeten Modell und Tokenizer ab.', example: 'Illustrativ, kein echter Tokenizer:\n[Warum] [ ist] [ der] [ Himmel] [ blau] [?]' },
  cache: { role: 'Depot · KV- und Prefix-Cache', input: 'Input-Tokens und eventuell passende gespeicherte Attention-Zustände', steps: ['Die Laufzeit prüft, ob ein identisches Prompt-Präfix bereits verarbeitete Zustände besitzt.', 'Bei einem Treffer können Key- und Value-Zwischenwerte aus früheren Schichten wiederverwendet werden. Neue Tokens müssen weiter berechnet werden.', 'Beim Decoding wächst der KV-Cache um neue Positionen. Das sichtbare Paket steht für diese Zwischenwerte, nicht für eine fertige Antwort.'], output: 'Wiederverwendbare KV-Zustände und weniger doppelte Berechnung', caution: 'Ähnlich klingende Fragen reichen für exaktes Prefix-Caching nicht aus. Cache-Verfügbarkeit und Lebensdauer hängen von der Laufzeit ab.', example: 'Gleiche Systemregeln + identischer Anfang\n→ Präfix wiederverwenden\nNeue Frage → neue Berechnung' },
  prefill: { role: 'Rechenstation · Prefill', input: 'Input-Vektoren und gegebenenfalls ein passender KV-Cache', steps: ['Die Transformer-Schichten verarbeiten die Prompt-Positionen; bei kausalen Modellen darf eine Position nur auf frühere und die eigene Position zugreifen.', 'Attention gewichtet Zusammenhänge zwischen Positionen. Weitere Teilnetze verändern die Darstellungen innerhalb jeder Schicht.', 'Am Ende stehen kontextabhängige Repräsentationen und Wahrscheinlichkeiten für das erste neue Token bereit.'], output: 'Verarbeiteter Kontext, KV-Zustände und die Verteilung für das nächste Token', caution: 'Attention ist eine mathematische Gewichtung, kein menschliches Verstehen. Ein langer Kontext kostet Speicher und Rechenzeit.', example: '„Himmel“ + „blau“ + Fragekontext\n→ kontextabhängige Darstellungen\n→ nächste Token-Verteilung' },
  decode: { role: 'Gipfelwerk · Decoding', input: 'Wahrscheinlichkeiten über das Token-Vokabular', steps: ['Logits werden durch das gewählte Decoding-Verfahren in eine Auswahl übersetzt. Temperatur und Sampling können die Auswahl beeinflussen.', 'Ein Token wird ausgegeben und an den bisherigen Kontext angehängt. Seine KV-Zustände ergänzen den Cache.', 'Das Modell berechnet die nächste Verteilung. Dieser autoregressive Zyklus wiederholt sich bis zu einer Abbruchbedingung.'], output: 'Eine schrittweise wachsende Folge von Output-Tokens', caution: 'Hohe Wahrscheinlichkeit ist kein Wahrheitsbeweis. Temperatur steuert die Auswahl, nicht zuverlässig die sachliche Richtigkeit.', example: '„Luft“ → „moleküle“ → „ streuen“ → …\nJedes neue Token hängt vom bisherigen Kontext ab.' },
  output: { role: 'Bergpost · Ausgabe', input: 'Die erzeugten Token-IDs', steps: ['Der Detokenizer setzt die Tokenfolge wieder zu lesbarem Text zusammen.', 'Die Anwendung kann Tokens schon während der Erzeugung streamen. Ein Stop-Token oder ein Längenlimit beendet die Ausgabe.', 'Der Text wird dem Nutzer angezeigt. Quellenprüfung und sachliche Bewertung sind davon getrennte Aufgaben.'], output: 'Eine lesbare, aber nicht automatisch richtige Antwort', caution: 'Die Simulation erklärt einen Ablauf. Hier läuft kein echtes Sprachmodell und es wird kein Prompt an einen KI-Dienst gesendet.', example: '„Luftmoleküle streuen kurzwelliges\nblaues Licht stärker als rotes Licht.“' },
  context: { role: 'Leitstelle · Agent-Kontext', input: 'Nutzerziel, Regeln, Verlauf und Werkzeugbeschreibungen', steps: ['Die Agent-Anwendung übersetzt das Nutzerziel in einen kontrollierten Arbeitskontext.', 'Werkzeuge werden mit Namen, Argument-Schema und Beschreibung angekündigt. Verfügbarkeit bedeutet noch keine Ausführungsberechtigung.', 'Die Anwendung übergibt den Kontext an das Modell und verwaltet den Zustand zwischen den Aufrufen.'], output: 'Ein Modellkontext mit Ziel und möglichen Werkzeugen', caution: 'Ein Agent ist kein unabhängiges Bewusstsein. Die Anwendung organisiert Modellaufrufe, Werkzeuge, Speicher und Grenzen.', example: 'Ziel: Aktuelles Wetter in Berlin\nWerkzeug: weather(city: string)\nRegel: Nur lesender Zugriff' },
  think: { role: 'Rechenstation · Entscheidung', input: 'Ziel, bisheriger Verlauf und Werkzeug-Schemata', steps: ['Ein normaler LLM-Aufruf verarbeitet den Kontext durch Tokenisierung, Prefill und Decoding.', 'Statt nur Text kann das Modell eine strukturierte Werkzeuganforderung erzeugen.', 'Die Anwendung übernimmt diesen Vorschlag zur Prüfung. Bis dahin wurde noch kein Wetterdienst aufgerufen.'], output: 'Ein vorgeschlagener Werkzeugaufruf oder eine direkte Antwort', caution: 'Das Modell erzeugt einen Aufrufvorschlag. Die tatsächliche Ausführung und Autorisierung liegen bei der Anwendung.', example: '{\n  "tool": "weather",\n  "arguments": { "city": "Berlin" }\n}' },
  tools: { role: 'Werkstatt · Ausführung', input: 'Der vorgeschlagene Aufruf samt Argumenten', steps: ['Die Anwendung validiert Werkzeugname, Argument-Typen und Berechtigungen. Kritische Aktionen können eine Bestätigung benötigen.', 'Nur ein zugelassener Aufruf wird ausgeführt. Hier ersetzt ein festes Beispiel den echten Netzwerkzugriff.', 'Ergebnis, Fehler oder Zeitüberschreitung werden als Werkzeugantwort zurückgegeben.'], output: 'Ein Werkzeugergebnis oder eine kontrollierte Fehlermeldung', caution: 'Werkzeugzugriff braucht Grenzen. Vom Modell erzeugte Argumente sind nicht automatisch sicher oder korrekt.', example: 'Simulierte Antwort:\n{ "city": "Berlin", "temperature": 18,\n  "unit": "°C" }' },
  observe: { role: 'Messstation · Rückmeldung', input: 'Die Antwort des ausgeführten Werkzeugs', steps: ['Die Anwendung ordnet die Rückmeldung dem ursprünglichen Werkzeugaufruf zu.', 'Die Daten werden als Werkzeugnachricht an den Verlauf angehängt, nicht als neue Systemregel.', 'Der erweiterte Kontext steht für einen weiteren Modellaufruf bereit. Auch Fehler werden sichtbar zurückgemeldet.'], output: 'Ein Verlauf, der jetzt externe Beobachtungen enthält', caution: 'Werkzeugtexte sind externe Daten. Eingebettete Handlungsanweisungen dürfen nicht ungeprüft höhere Priorität erhalten.', example: 'Bisheriger Kontext\n+ vorgeschlagener weather-Aufruf\n+ Werkzeugantwort: Berlin, 18 °C' },
  rethink: { role: 'Rechenstation II · Rückkopplung', input: 'Der Kontext einschließlich Werkzeugergebnis', steps: ['Dasselbe Modell wird erneut aufgerufen, diesmal mit der zusätzlichen Beobachtung.', 'Es kann eine Antwort formulieren oder einen weiteren Werkzeugaufruf vorschlagen, falls Informationen fehlen.', 'Die Anwendung zählt Schritte, Zeit und Budget. So verhindert sie unbegrenzte Werkzeugschleifen.'], output: 'Ein weiterer Handlungsvorschlag oder eine finale Antwort', caution: 'Das zweite Gebäude ist eine didaktische Darstellung eines weiteren Aufrufs, kein zweites Modell.', example: 'Ziel → Modell → Werkzeug → Ergebnis\n                  ↑             ↓\n                  └── Modell ───┘' },
  finish: { role: 'Kontrollpunkt · Abbruch', input: 'Die Modellausgabe und die Grenzen der Anwendung', steps: ['Die Anwendung erkennt, dass keine weitere Werkzeuganforderung vorliegt, oder stoppt bei einem Budget- oder Zeitlimit.', 'Sie kann Ausgabeformat und zusätzliche Regeln prüfen. Eine Formatprüfung ist keine vollständige Faktenprüfung.', 'Der Ablauf wird abgeschlossen und die finale Nachricht für den Nutzer bereitgestellt.'], output: 'Ein beendeter Agentenlauf mit einem definierten Ergebnis', caution: 'Eine beendete Schleife bedeutet nicht automatisch, dass das Nutzerziel erfolgreich erreicht wurde. Fehler müssen klar gemeldet werden.', example: 'Werkzeugaufrufe: 1\nWeitere Aktion nötig: nein\nStatus: finale Antwort bereit' },
  agentOutput: { role: 'Bergpost · Ergebnis', input: 'Die finale Antwort aus dem abgeschlossenen Agentenlauf', steps: ['Die Anwendung zeigt die finale Nachricht an und kann relevante Herkunftsinformationen ergänzen.', 'In diesem Beispiel nutzt die Antwort den simulierten Wetterwert aus dem Werkzeugergebnis.', 'Modell, Werkzeuge und Ablaufsteuerung bilden gemeinsam den Agenten. Ohne Werkzeug wäre dies nur ein normaler Modellaufruf.'], output: 'Eine Antwort auf Grundlage des bereitgestellten Werkzeugergebnisses', caution: '18 °C ist ein festes Demonstrationsdatum, keine aktuelle Wetterauskunft. Es findet kein Zugriff auf einen Wetterdienst statt.', example: '„In Berlin sind es aktuell 18 °C.“\nNur ein simuliertes Beispiel, keine Live-Daten.' }
};
const state = { mode: 'llm', index: 0, distance: 0, running: false, speed: 1, completed: false, elapsed: 0, x: -92, z: 0, heading: Math.PI / 2, velocity: 0, surface: 'road', parkedAt: -1, parkingTime: 0, visited: new Set() };
const pressedKeys = new Set();
const touchInputs = new Map();
const driveInput = { forward: false, reverse: false, left: false, right: false, brake: false };
let scene, camera, renderer, worldGroup, truck, routeCurve, buildings = [], wheels = [], tokenCrates = [], animationFrame;
let physicsWorld, vehicleBody, sunlight, routeStart = -92, routeEnd = 92;
let cameraFollow = true, cameraTarget = { x: -92, y: 0, z: 0 };
let windRotors = [], cacheDrop = null, snowfall;
let cameraAngle = .68, cameraZoom = 1, drag = null, lastTime = 0, uiTime = 0, arrivalTimer;
const sceneHost = byId('scene');

function renderRoute() {
  byId('station-list').innerHTML = routes[state.mode].map((key, index) => `<button class="station-button${index === state.index ? ' active' : ''}${state.visited.has(index) ? ' visited' : ''}" data-index="${index}" aria-label="Station ${index + 1}: ${stations[key].name}${state.visited.has(index) ? ', besucht' : ''}"${index === state.index ? ' aria-current="step"' : ''}><span class="station-number">${state.visited.has(index) ? '✓' : String(index + 1).padStart(2, '0')}</span><span class="station-copy"><span class="station-name">${stations[key].name}</span><span class="station-subtitle">${stations[key].subtitle}</span></span><i class="station-arrow" data-lucide="arrow-up-right"></i></button>`).join('');
  byId('route-count').textContent = `${routes[state.mode].length} STATIONEN`;
  byId('mode-description').textContent = state.mode === 'llm' ? 'Vom ersten Wort zum nächsten Token.' : 'Ein Ziel. Werkzeuge. Eine Rückkopplung.';
  byId('progress-label').textContent = 'STATIONEN BESUCHT';
  if (window.innerWidth > 760) {
    const active = byId('station-list').querySelector('.active');
    if (active) byId('station-list').scrollTop = Math.max(0, active.offsetTop - byId('station-list').clientHeight / 2 + active.offsetHeight / 2);
  }
  icons();
}

function updateStation(announce = false) {
  const station = stations[routes[state.mode][state.index]];
  renderRoute();
  byId('detail-kicker').textContent = `${String(state.index + 1).padStart(2, '0')} / ${station.subtitle.toLocaleUpperCase('de')}`;
  byId('detail-title').textContent = station.title;
  byId('detail-text').textContent = station.text;
  byId('detail-fact').textContent = state.mode === 'agent' && state.index === 0 ? 'Auftrag: „Wie warm ist es gerade in Berlin?“' : station.fact;
  byId('cargo-label').textContent = station.cargo;
  byId('cargo-count').textContent = station.count;
  byId('world-status').textContent = state.completed ? 'Alle Stationen besucht' : `Ziel: ${station.name}`;
  buildings.forEach(({ key, marker, halo }) => {
    const active = stations[key].position === station.position || (stations[key].position[0] === station.position[0] && stations[key].position[1] === station.position[1]);
    marker.material.color.setHex(active ? 0xd94d36 : 0xf1f6f7);
    halo.visible = active;
  });
  tokenCrates.forEach((crate, index) => {
    crate.visible = index < (state.index === 0 ? 2 : 6);
    crate.material.color.setHex(state.index === routes[state.mode].length - 1 ? 0xe7a18a : state.index > 2 ? 0x9fbd9e : 0xe9c76a);
  });
  if (announce) {
    byId('arrival-number').textContent = String(state.index + 1).padStart(2, '0');
    byId('arrival-name').textContent = station.name;
    byId('arrival').querySelector('small').textContent = 'STATION ERREICHT';
    byId('arrival').classList.add('visible');
    clearTimeout(arrivalTimer);
    arrivalTimer = setTimeout(() => byId('arrival').classList.remove('visible'), 3200);
    openStationDialog(true);
  }
}

function openStationDialog(arrived = false) {
  const key = routes[state.mode][state.index];
  const station = stations[key];
  const detail = stationDetails[key];
  pauseDriving();
  byId('visit-status').textContent = arrived ? 'ANKUNFT BESTÄTIGT' : state.visited.has(state.index) ? 'BEREITS BESUCHT' : 'STATION ERKUNDEN';
  byId('station-dialog-number').textContent = String(state.index + 1).padStart(2, '0');
  byId('station-dialog-role').textContent = detail.role;
  byId('station-dialog-title').textContent = station.name;
  byId('station-dialog-intro').textContent = station.text;
  byId('station-dialog-icon').innerHTML = `<i data-lucide="${station.icon}"></i>`;
  byId('station-dialog-input').textContent = detail.input;
  byId('station-dialog-steps').innerHTML = detail.steps.map((step, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><p>${step}</p></li>`).join('');
  byId('station-dialog-output').textContent = detail.output;
  byId('station-dialog-example').textContent = key === 'input' && state.mode === 'agent' ? 'Nutzer: Wie warm ist es gerade in Berlin?\nDie Anwendung ergänzt Regeln und Werkzeugbeschreibungen.' : detail.example;
  byId('station-dialog-caution').textContent = detail.caution;
  const next = routes[state.mode][state.index + 1];
  byId('next-station-label').textContent = next ? `Nächstes Ziel: ${stations[next].name}` : 'Zurück zum Pass';
  byId('station-dialog-progress').textContent = `${state.visited.size} von ${routes[state.mode].length} Stationen besucht`;
  const dialog = byId('station-dialog');
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  icons();
}

function updatePlayButton() {
  byId('play-button').innerHTML = `<i data-lucide="${state.running ? 'pause' : 'route'}"></i><span>${state.running ? 'Tempomat aus' : 'Tempomat'}</span>`;
  byId('play-button').setAttribute('aria-label', state.running ? 'Tempomat ausschalten' : 'Tempomat einschalten');
  byId('play-button').setAttribute('aria-pressed', String(state.running));
  icons();
}

function togglePlay() {
  if (!vehicleBody) return;
  state.running = !state.running;
  if (!state.running) state.velocity = 0;
  updatePlayButton();
}

function resetJourney() {
  clearDrivingInput();
  byId('station-dialog').close();
  Object.assign(state, { index: 0, distance: 0, running: false, completed: false, x: routeStart, z: roadZ(routeStart) + 1.65, heading: roadHeading(routeStart), velocity: 0, parkedAt: -1, parkingTime: 0, surface: 'road', visited: new Set() });
  if (vehicleBody) {
    vehicleBody.position.set(state.x, 1, state.z);
    vehicleBody.velocity.setZero();
    vehicleBody.angularVelocity.setZero();
    vehicleBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), state.heading);
  }
  if (cacheDrop) {
    cacheDrop.active = false;
    cacheDrop.stored = false;
    cacheDrop.packet.visible = false;
    cacheDrop.ring.visible = false;
  }
  cameraTarget = { x: state.x, y: 0, z: state.z };
  byId('arrival').classList.remove('visible');
  clearTimeout(arrivalTimer);
  updateStation();
  updatePlayButton();
  updateProgress();
  positionTruck();
}

function switchMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  for (const name of ['llm', 'agent']) {
    byId(`${name}-mode`).classList.toggle('active', name === mode);
    byId(`${name}-mode`).setAttribute('aria-pressed', String(name === mode));
  }
  if (scene) buildWorld();
  resetJourney();
}

function updateProgress() {
  const percentage = Math.round(state.visited.size / routes[state.mode].length * 100);
  byId('progress-value').textContent = `${state.visited.size} / ${routes[state.mode].length}`;
  byId('progress-fill').style.width = `${percentage}%`;
  byId('progress-truck').style.left = `calc(${percentage}% - ${percentage / 100 * 22}px)`;
  if (byId('vehicle-speed')) byId('vehicle-speed').textContent = String(Math.round(Math.abs(state.velocity) * 3.6));
  if (byId('surface-label')) byId('surface-label').textContent = { road: 'Passstraße', bay: 'Haltebucht', shoulder: 'Schneerand', grass: 'Tiefschnee' }[state.surface];
  if (byId('surface-label')) byId('surface-label').dataset.surface = state.surface;
  if (byId('drive-state')) byId('drive-state').textContent = state.running ? 'TEMPOMAT' : state.velocity < -.15 ? 'RÜCKWÄRTS' : Math.abs(state.velocity) < .15 ? 'PARKEN' : 'MANUELL';
  if (byId('station-distance')) {
    const [targetX, targetZ] = stations[routes[state.mode][state.index]].position;
    byId('station-distance').textContent = `${Math.round(Math.hypot(state.x - targetX, state.z - targetZ))} m`;
  }
  if (byId('parking-status')) byId('parking-status').textContent = state.parkingTime >= .65 ? 'Station besucht' : state.parkedAt >= 0 ? 'Parken …' : '';
  drawMinimap();
}

function drawMinimap() {
  const canvas = byId('minimap');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const mapX = (x) => 12 + (x - routeStart) / (routeEnd - routeStart) * 144;
  const mapZ = (z) => 54 + z * .86;
  context.setTransform(2, 0, 0, 2, 0, 0);
  context.clearRect(0, 0, 168, 92);
  context.fillStyle = '#e4eff2';
  context.fillRect(0, 0, 168, 92);
  context.beginPath();
  for (let x = routeStart - 20; x <= routeEnd + 20; x += 2) context.lineTo(mapX(x), mapZ(roadZ(x)));
  context.strokeStyle = '#748d99';
  context.lineWidth = 5;
  context.stroke();
  routes[state.mode].forEach((key, index) => {
    const [x, z] = stations[key].position;
    context.fillStyle = state.visited.has(index) ? '#168276' : '#ffffff';
    context.strokeStyle = index === state.index ? '#e15b3c' : '#9aafb7';
    context.lineWidth = index === state.index ? 2 : 1;
    context.fillRect(mapX(x) - 3.5, mapZ(z) - 4, 7, 7);
    context.strokeRect(mapX(x) - 3.5, mapZ(z) - 4, 7, 7);
  });
  context.save();
  context.translate(Math.max(5, Math.min(163, mapX(state.x))), Math.max(5, Math.min(87, mapZ(state.z))));
  context.rotate(Math.PI / 2 - state.heading);
  context.beginPath();
  context.moveTo(6, 0);
  context.lineTo(-4, -4);
  context.lineTo(-2, 0);
  context.lineTo(-4, 4);
  context.closePath();
  context.fillStyle = '#df5238';
  context.strokeStyle = '#ffffff';
  context.lineWidth = 1.5;
  context.fill();
  context.stroke();
  context.restore();
}

function roadZ(x) {
  const bounded = Math.max(-230, Math.min(230, x));
  return Math.sin(bounded * .038) * 19 + Math.sin(bounded * .076) * 4;
}

function roadHeading(x) {
  return Math.atan2(1, (roadZ(x + .1) - roadZ(x - .1)) / .2);
}

function roadSurface(x, z) {
  if (Math.abs(z - roadZ(x)) <= 3.6) return 'road';
  for (const key of routes[state.mode]) {
    const [stopX, stopZ] = stations[key].position;
    if (Math.abs(x - stopX) <= 7 && z >= stopZ - 3.2 && z <= roadZ(x) - 2.8) return 'bay';
  }
  return Math.abs(z - roadZ(x)) < 4.7 ? 'shoulder' : 'grass';
}

function addObstacle(x, z, width, depth, rotation = 0) {
  if (!physicsWorld) return;
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(width / 2, 2, depth / 2)));
  body.position.set(x, 1, z);
  body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
  physicsWorld.addBody(body);
}

function makeMaterial(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0, ...extra });
}

function box(parent, width, height, depth, color, x = 0, y = 0, z = 0, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material || makeMaterial(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radius, height, color, x, y, z, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), makeMaterial(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function label(parent, text, x, y, z, accent = false, size = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 112;
  const context = canvas.getContext('2d');
  context.fillStyle = accent ? '#d94d36' : '#f4f9fa';
  context.beginPath();
  context.roundRect(3, 3, 762, 106, 14);
  context.fill();
  context.strokeStyle = accent ? '#d94d36' : '#bacfd7';
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = accent ? '#ffffff' : '#365b69';
  context.font = '600 37px Manrope, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 384, 57, 716);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set(12.8 * size, 1.87 * size, 1);
  sprite.position.set(x, y, z);
  sprite.renderOrder = 5;
  parent.add(sprite);
  return sprite;
}

function addTree(parent, x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, terrainHeight(x, z), z);
  group.scale.setScalar(scale);
  cylinder(group, .17, 1.8, 0x645d59, 0, .9, 0, 7);
  for (let tier = 0; tier < 3; tier++) {
    const radius = 1.5 - tier * .35;
    const foliage = new THREE.Mesh(new THREE.ConeGeometry(radius, 2.5, 7), makeMaterial(0x285e57));
    foliage.position.y = 2 + tier * 1.1;
    foliage.castShadow = true;
    group.add(foliage);
    const snow = new THREE.Mesh(new THREE.ConeGeometry(radius * .94, 1.95, 7), makeMaterial(0xeaf5f6));
    snow.position.y = 2.35 + tier * 1.1;
    snow.castShadow = true;
    group.add(snow);
  }
  parent.add(group);
  addObstacle(x, z, .45 * scale, .45 * scale);
}

function terrainHeight(x, z) {
  let edgeDistance = Math.abs(z - roadZ(x)) - 5.2;
  for (const key of routes[state.mode]) {
    const [stopX, stopZ] = stations[key].position;
    const platformDistance = Math.max(Math.abs(x - stopX) - 9.2, stopZ - 11.2 - z, z - Math.max(roadZ(x) + 1, roadZ(stopX) + 1));
    edgeDistance = Math.min(edgeDistance, platformDistance);
  }
  if (edgeDistance <= 0) return -.08;
  const drop = THREE.MathUtils.smoothstep(edgeDistance, 0, 24);
  const ridges = Math.sin(x * .24 + z * .12) * 3 + Math.sin(x * .09 - z * .18) * 5;
  return -.08 - drop * (58 + ridges) - Math.max(0, edgeDistance - 24) * .14;
}

function addLandscape() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), makeMaterial(0xb9d3dd));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -100;
  ground.receiveShadow = true;
  worldGroup.add(ground);
  const terrain = new THREE.PlaneGeometry(560, 440, 420, 330);
  terrain.rotateX(-Math.PI / 2);
  const positions = terrain.attributes.position;
  const colors = [];
  const snowColor = new THREE.Color(0xe4f0f3);
  const rockColor = new THREE.Color(0x668392);
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index), z = positions.getZ(index);
    const height = terrainHeight(x, z);
    positions.setY(index, height);
    const color = snowColor.clone().lerp(rockColor, THREE.MathUtils.smoothstep(-height, 2, 32) * .87);
    color.multiplyScalar(.94 + Math.sin(x * .51 + z * .37) * .06);
    colors.push(color.r, color.g, color.b);
  }
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  terrain.computeVertexNormals();
  const terrainMesh = new THREE.Mesh(terrain, makeMaterial(0xffffff, { vertexColors: true, flatShading: true }));
  terrainMesh.receiveShadow = true;
  worldGroup.add(terrainMesh);

  const forestCount = 210;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.15, .24, 2, 6), makeMaterial(0x655b56), forestCount);
  const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1.9, 6, 7), makeMaterial(0x285c54, { flatShading: true }), forestCount);
  const snowCaps = new THREE.InstancedMesh(new THREE.ConeGeometry(1.65, 5, 7), makeMaterial(0xe9f3f5), forestCount);
  const transform = new THREE.Object3D();
  for (let index = 0; index < forestCount; index++) {
    const x = (index * 71 % 470) - 235;
    const z = roadZ(x) + (index % 2 ? -1 : 1) * (30 + index * 17 % 105);
    const height = terrainHeight(x, z);
    const scale = .7 + (index % 7) * .19;
    transform.position.set(x, height + scale, z);
    transform.scale.set(scale, scale, scale);
    transform.rotation.set(0, index * 2.399963, 0);
    transform.updateMatrix();
    trunks.setMatrixAt(index, transform.matrix);
    transform.position.y = height + 3.8 * scale;
    transform.updateMatrix();
    crowns.setMatrixAt(index, transform.matrix);
    transform.position.y += .6 * scale;
    transform.updateMatrix();
    snowCaps.setMatrixAt(index, transform.matrix);
  }
  trunks.castShadow = true;
  crowns.castShadow = true;
  snowCaps.castShadow = true;
  worldGroup.add(trunks, crowns, snowCaps);
  for (let index = 0; index < 22; index++) {
    const x = -410 + index * 39;
    const z = index % 2 ? -175 - index % 4 * 19 : 185 + index % 3 * 22;
    const height = 80 + index * 29 % 105;
    const peak = new THREE.Group();
    peak.position.set(x, -94, z);
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(53 + index % 4 * 12, height, 5), makeMaterial(index % 2 ? 0x78919c : 0x8ca4ae, { flatShading: true }));
    mountain.position.y = height / 2;
    mountain.rotation.y = index * .7;
    peak.add(mountain);
    const summit = new THREE.Mesh(new THREE.ConeGeometry((53 + index % 4 * 12) * .47, height * .47, 5), makeMaterial(0xf1f6f7, { flatShading: true }));
    summit.position.y = height * .765 + .15;
    summit.rotation.y = mountain.rotation.y;
    peak.add(summit);
    worldGroup.add(peak);
  }
  const flakes = [];
  for (let index = 0; index < 650; index++) flakes.push((index * 71 % 500) - 250, index * 31 % 92, (index * 43 % 160) - 80);
  const snowGeometry = new THREE.BufferGeometry();
  snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(flakes, 3));
  snowfall = new THREE.Points(snowGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: .17, transparent: true, opacity: .7, depthWrite: false }));
  snowfall.frustumCulled = false;
  worldGroup.add(snowfall);
}

function addBuilding(key, number) {
  const station = stations[key];
  const [x, z] = station.position;
  const group = new THREE.Group();
  group.position.set(x, 0, z - 6.4);
  worldGroup.add(group);
  const palettes = {
    terminal: { wall: 0xeee7db, roof: 0xb64c3c, trim: 0x965c49, glass: 0xffd18c },
    factory: { wall: 0xdee8e7, roof: 0x317a7c, trim: 0x58777a, glass: 0xffce81 },
    warehouse: { wall: 0xddd4bd, roof: 0x9b683c, trim: 0x88715b, glass: 0xffd185 },
    workshop: { wall: 0xdf7660, roof: 0x4b646c, trim: 0xe9ddd0, glass: 0xffd494 },
    processor: { wall: 0x789b9c, roof: 0x35565c, trim: 0xd7e3de, glass: 0xa2e4df },
    generator: { wall: 0xd5e1e6, roof: 0x496b7c, trim: 0x69848d, glass: 0x9cdde6 },
    output: { wall: 0xc96554, roof: 0x74504c, trim: 0xece1cb, glass: 0xffd79c }
  };
  const palette = palettes[station.building];
  const color = palette.roof;
  box(group, 12.6, .35, 9.1, 0xa2b4bc, 0, .12, 0);
  box(group, 12.8, .12, 9.3, 0xf1f6f7, 0, .36, 0);
  box(group, 12.6, 9, .65, 0x6d828d, 0, -4.2, -4.2);
  for (const side of [-1, 1]) {
    box(group, .65, 14, .8, 0x81949d, side * 4.9, -6.7, -3.8);
    box(group, 12.5, .12, .12, 0x77919a, 0, 1.1 + (side + 1) * .22, -4.45);
  }
  for (let post = -6; post <= 6; post += 2) box(group, .1, 1.1, .1, 0x77919a, post, .95, -4.45);
  const marker = cylinder(group, .66, .16, 0xf5f7ed, -4.4, .4, 3.2);
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.3, 40), new THREE.MeshBasicMaterial({ color: 0xf08a59, transparent: true, opacity: .6, side: THREE.DoubleSide }));
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(x, .12, z);
  worldGroup.add(halo);
  if (station.building === 'warehouse' || station.building === 'workshop') {
    box(group, 8.5, 3.3, 5.5, palette.wall, 0, 1.9, 0);
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-4.65, 0);
    roofShape.lineTo(0, 1.7);
    roofShape.lineTo(4.65, 0);
    roofShape.closePath();
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 6, bevelEnabled: false }), makeMaterial(0xe8f1f3));
    roof.position.set(0, 3.65, -3);
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    box(group, 9.1, .3, 6, color, 0, 3.7, 0);
    for (let door = 0; door < 3; door++) {
      box(group, 1.9, 2.3, .15, palette.glass, -2.7 + door * 2.7, 1.55, 2.82);
      for (let slat = 0; slat < 5; slat++) box(group, 1.75, .04, .05, 0xbfc6b2, -2.7 + door * 2.7, .8 + slat * .37, 2.92);
    }
    for (let crate = 0; crate < 4; crate++) {
      box(group, .9, .8, .9, 0xd8bc77, 3.7 + (crate % 2) * 1.1, .7 + Math.floor(crate / 2) * .83, 3.3);
    }
  } else if (station.building === 'processor') {
    box(group, 7.7, 5, 5.6, palette.wall, 0, 2.8, 0);
    box(group, 8.2, .4, 6.1, color, 0, 5.5, 0);
    box(group, 5.3, 1, 3.7, palette.trim, 0, 6.1, -.4);
    for (let chimney = 0; chimney < 3; chimney++) {
      cylinder(group, .45, 1.3, 0x8eaa96, -1.6 + chimney * 1.6, 7.15, -.5);
      cylinder(group, .57, .15, 0xcbd6c3, -1.6 + chimney * 1.6, 7.8, -.5);
    }
    for (let column = 0; column < 5; column++) {
      box(group, .85, 2.4, .13, palette.glass, -2.8 + column * 1.4, 3.6, 2.86);
      box(group, .85, .08, .08, 0xd1e4d7, -2.8 + column * 1.4, 3.7, 2.96);
    }
    box(group, 2.3, 1.5, .2, 0x567b68, 0, 1.1, 2.9);
  } else if (station.building === 'generator') {
    box(group, 6.8, 4.1, 5.1, palette.wall, 0, 2.35, 0);
    box(group, 7.3, .3, 5.6, color, 0, 4.55, 0);
    for (let vent = 0; vent < 2; vent++) {
      box(group, 2, .8, 2.4, 0xb5c6bf, -1.7 + vent * 3.4, 5.1, -.3);
      for (let slat = 0; slat < 4; slat++) box(group, 1.6, .07, .16, 0x829c96, -1.7 + vent * 3.4, 5.55, -1.1 + slat * .5);
    }
    box(group, 5.4, 1.2, .12, palette.glass, 0, 3, 2.62);
    box(group, 2.2, 1.8, .16, 0xaabeb4, 0, 1.2, 2.66);
    for (let token = 0; token < 3; token++) box(group, .7, .7, .7, 0x9dbbaa, 4.2 + token * .9, .65, 1.5);
  } else if (station.building === 'output') {
    box(group, 8.5, 3.4, 4.8, palette.wall, 0, 2, 0);
    box(group, 9, .32, 5.4, color, 0, 3.87, 0);
    box(group, 2.4, 2.4, .15, 0xb5b7a3, -1.9, 1.6, 2.5);
    box(group, 2.4, 1.2, .15, palette.glass, 1.7, 2.4, 2.5);
    box(group, 9.2, .2, 1.8, palette.trim, 0, 3.1, 3.1);
    for (const post of [-4.3, 4.3]) cylinder(group, .09, 2.7, 0xbcbba7, post, 1.7, 3.8, 8);
    box(group, 1.2, .9, 1.2, 0xd99c7f, 4.1, .8, 2.7);
  } else {
    box(group, 7.7, 3.5, 5.1, palette.wall, 0, 2.05, 0);
    box(group, 8.2, .35, 5.6, color, 0, 3.98, 0);
    if (station.building === 'factory') {
      box(group, 3, 2.5, 3.6, palette.trim, -1.5, 5.3, -.5);
      box(group, 3.4, .25, 4, color, -1.5, 6.7, -.5);
      cylinder(group, .42, 2.1, 0x93aa94, 2.4, 5.2, -1.4);
      cylinder(group, .48, .2, 0xc1cfb8, 2.4, 6.3, -1.4);
    } else {
      box(group, 5, .2, 3.5, 0x718f7e, 0, 4.3, -.2);
      for (let stripe = 0; stripe < 5; stripe++) box(group, .05, .025, 3.3, 0xb3c6b6, -2 + stripe, 4.42, -.2);
    }
    for (const windowX of [-2.5, 2.5]) box(group, 1.5, 1.3, .15, palette.glass, windowX, 2.7, 2.62);
    box(group, 1.5, 2.2, .15, color, 0, 1.55, 2.65);
  }
  for (const side of [-1, 1]) {
    box(group, .2, 2.7, .2, palette.trim, side * 3.55, 1.75, 2.75);
    box(group, 1.8, .45, .8, 0x7d969c, side * 3.1, .55, 3.5);
    box(group, 1.9, .22, .9, 0xf5f9fa, side * 3.1, .87, 3.5);
  }
  const roofSurfaces = group.children.filter((mesh) => mesh.geometry?.type === 'BoxGeometry' && mesh.geometry.parameters.width > 3 && mesh.geometry.parameters.depth > 3 && mesh.geometry.parameters.height <= .4 && mesh.position.y > 3);
  roofSurfaces.forEach((roof) => box(group, roof.geometry.parameters.width + .18, .19, roof.geometry.parameters.depth + .18, 0xf4f8fa, roof.position.x, roof.position.y + roof.geometry.parameters.height / 2 + .09, roof.position.z));
  group.traverse((object) => {
    if (object.material?.color?.getHex() === palette.glass) {
      object.material.emissive.setHex(palette.glass);
      object.material.emissiveIntensity = .35;
    }
  });
  for (const side of [-1, 1]) {
    box(group, .16, 3, .16, palette.trim, side * 3.4, 1.9, 2.97);
    cylinder(group, .09, 3.2, 0x506770, side * 5.3, 1.95, 2.5, 8);
    box(group, .35, .55, .35, 0xffd7a2, side * 5.3, 3.6, 2.5, makeMaterial(0xffd7a2, { emissive: 0xffb957, emissiveIntensity: .7 }));
  }
  box(group, 7.3, .13, .15, palette.trim, 0, 1.2, 2.97);
  cylinder(group, .07, 3.3, 0x6e828c, 4.5, 5.1, -1.9, 8);
  const antenna = new THREE.Mesh(new THREE.SphereGeometry(.24, 8, 6), makeMaterial(color));
  antenna.position.set(4.5, 6.85, -1.9);
  group.add(antenna);
  box(group, 3.4, .08, 1.3, 0xb9c7af, 0, .34, 3.25);
  label(group, `${String(number).padStart(2, '0')}  ${station.name.toLocaleUpperCase('de')}`, 0, station.building === 'processor' ? 9.7 : station.building === 'factory' ? 8.5 : 6.6, 0);
  buildings.push({ key, group, marker, halo });
  addObstacle(x, z - 6.4, 8.7, 5.7);
  if (key === 'cache') createCacheDepot(x - 6, z - 3.2);
}

function createCacheDepot(x, z) {
  box(worldGroup, 3.5, .15, 3.1, 0xe9c76c, x, .03, z);
  for (let slat = 0; slat < 4; slat++) {
    box(worldGroup, .49, .15, 2.3, 0xb18a56, x - .9 + slat * .6, .18, z);
  }
  const packet = new THREE.Group();
  box(packet, 1.65, 1.5, 1.5, 0xf2b848, 0, .75, 0);
  box(packet, .3, 1.53, 1.53, 0xffe6a0, 0, .75, 0);
  box(packet, 1.68, .25, 1.53, 0xffe6a0, 0, 1.15, 0);
  box(packet, .5, .42, .04, 0x397d83, .48, .65, .77);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.85, 40), new THREE.MeshBasicMaterial({ color: 0xffda73, transparent: true, opacity: 0, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, .12, z);
  ring.visible = false;
  packet.visible = false;
  worldGroup.add(packet, ring);
  cacheDrop = { packet, ring, target: new THREE.Vector3(x, .26, z), from: new THREE.Vector3(), time: 0, active: false, stored: false, startRotation: 0 };
}

function syncCacheDrop() {
  if (!cacheDrop || cacheDrop.active || cacheDrop.stored || routes[state.mode][state.parkedAt] !== 'cache') return;
  const { packet, ring } = cacheDrop;
  positionTruck();
  truck.updateMatrixWorld(true);
  tokenCrates[0].getWorldPosition(cacheDrop.from);
  cacheDrop.from.y -= .35;
  cacheDrop.time = 0;
  cacheDrop.active = true;
  cacheDrop.stored = false;
  cacheDrop.startRotation = truck.rotation.y;
  packet.position.copy(cacheDrop.from);
  packet.rotation.y = cacheDrop.startRotation;
  packet.scale.setScalar(.48);
  packet.visible = true;
  ring.visible = true;
  ring.scale.setScalar(1);
  ring.material.opacity = .8;
  byId('detail-fact').textContent = 'Eine KV-Kopie wird abgelegt. Die Input-Tokens bleiben im Kontext; das Paket steht für Attention-Zwischenwerte.';
}

function animateCacheDrop(delta) {
  if (!cacheDrop || !cacheDrop.active) return;
  const { packet, ring, from, target } = cacheDrop;
  cacheDrop.time = Math.min(3.2, cacheDrop.time + delta);
  const progress = cacheDrop.time / 3.2;
  const lift = THREE.MathUtils.smoothstep(progress, 0, .25);
  const travel = THREE.MathUtils.smoothstep(progress, .25, .65);
  const lower = THREE.MathUtils.smoothstep(progress, .65, 1);
  const liftHeight = Math.max(from.y, target.y) + 3;
  packet.position.lerpVectors(from, target, travel);
  packet.position.y = progress < .65 ? THREE.MathUtils.lerp(from.y, liftHeight, lift) : THREE.MathUtils.lerp(liftHeight, target.y, lower);
  packet.rotation.y = THREE.MathUtils.lerp(cacheDrop.startRotation, Math.PI / 9, travel);
  packet.scale.setScalar(THREE.MathUtils.lerp(.48, 1, lift));
  ring.scale.setScalar(1 + Math.sin(progress * Math.PI) * .3);
  ring.material.opacity = .8 * (1 - lower);
  if (progress === 1) {
    packet.position.copy(target);
    ring.visible = false;
    cacheDrop.active = false;
    cacheDrop.stored = true;
    if (routes[state.mode][state.index] === 'cache') byId('cargo-label').textContent = 'KV-Kopie gespeichert';
  }
}

function buildRoad(points, width, color, height) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const vertices = [], indices = [];
  const segments = 600;
  for (let index = 0; index <= segments; index++) {
    const point = curve.getPointAt(index / segments);
    vertices.push(point.x, height, point.z + width / 2, point.x, height, point.z - width / 2);
    if (index < segments) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, makeMaterial(color, { side: THREE.DoubleSide }));
  mesh.receiveShadow = true;
  worldGroup.add(mesh);
  return curve;
}

function addRoadMarkings(curve, start = 0, end = 1) {
  const length = curve.getLength();
  for (let distance = start * length; distance < end * length; distance += 2.6) {
    const point = curve.getPointAt(distance / length);
    const tangent = curve.getTangentAt(distance / length);
    const stripe = box(worldGroup, .12, .015, 1.05, 0xebece0, point.x, .09, point.z);
    stripe.rotation.y = Math.atan2(tangent.x, tangent.z);
    stripe.castShadow = false;
  }
  for (const side of [-1, 1]) {
    const points = [];
    for (let sample = 0; sample <= 600; sample++) {
      const point = curve.getPointAt(sample / 600);
      points.push(new THREE.Vector3(point.x, .09, point.z + 3.15 * side));
    }
    worldGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xf3edcf })));
  }
}

function addPassBarriers() {
  const capacity = 304;
  const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), makeMaterial(0x9aafb8), capacity);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, 1, .15), makeMaterial(0x718d9a), capacity);
  const reflectors = new THREE.InstancedMesh(new THREE.BoxGeometry(.2, .14, .2), makeMaterial(0xffffff), capacity);
  const drifts = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 5), makeMaterial(0xf1f7f8), capacity);
  const transform = new THREE.Object3D();
  let count = 0, driftCount = 0;
  for (let x = -228; x < 228; x += 3) {
    for (const side of [-1, 1]) {
      const startZ = roadZ(x) + side * 4.45;
      const endZ = roadZ(x + 3) + side * 4.45;
      const centerZ = (startZ + endZ) / 2;
      if (roadSurface(x + 1.5, centerZ) === 'bay') continue;
      const length = Math.hypot(3, endZ - startZ);
      const angle = -Math.atan2(endZ - startZ, 3);
      transform.position.set(x + 1.5, .91, centerZ);
      transform.rotation.set(0, angle, 0);
      transform.scale.set(length + .12, .28, .15);
      transform.updateMatrix();
      beams.setMatrixAt(count, transform.matrix);
      transform.rotation.set(0, 0, 0);
      transform.scale.setScalar(1);
      transform.position.set(x, .5, startZ);
      transform.updateMatrix();
      posts.setMatrixAt(count, transform.matrix);
      transform.position.y = 1.07;
      transform.updateMatrix();
      reflectors.setMatrixAt(count, transform.matrix);
      reflectors.setColorAt(count, new THREE.Color(side === 1 ? 0xd64b37 : 0xffd58b));
      count++;
      addObstacle(x + 1.5, centerZ, length, .18, angle);
      if (x % 9 === 0) {
        const driftZ = roadZ(x) + side * 5;
        transform.position.set(x, -.1, driftZ);
        transform.scale.set(1.7, .45, .65);
        transform.updateMatrix();
        drifts.setMatrixAt(driftCount++, transform.matrix);
      }
    }
  }
  beams.count = posts.count = reflectors.count = count;
  drifts.count = driftCount;
  worldGroup.add(beams, posts, reflectors, drifts);
}

function addParkingApron(x, z) {
  const vertices = [], indices = [];
  for (let sample = 0; sample <= 28; sample++) {
    const sampleX = x - 7 + sample * .5;
    vertices.push(sampleX, .055, roadZ(sampleX), sampleX, .055, z - 3.2);
    if (sample < 28) {
      const base = sample * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const apron = new THREE.Mesh(geometry, makeMaterial(0x697f89, { side: THREE.DoubleSide }));
  apron.receiveShadow = true;
  worldGroup.add(apron);
}

function makeTruck() {
  truck = new THREE.Group();
  wheels = [];
  tokenCrates = [];
  box(truck, 1.65, .34, 3.5, 0x344c56, 0, .62, 0);
  box(truck, 1.7, .8, 1.05, 0xd9533d, 0, 1.17, 1.2);
  box(truck, 1.7, .38, 1.4, 0xe7694d, 0, .94, 1.05);
  box(truck, 1.73, .13, 1.15, 0xf1f6f7, 0, 1.63, 1.18);
  box(truck, 1.42, .47, .04, 0x426b7c, 0, 1.32, 1.74);
  box(truck, 1.4, .11, .15, 0x405963, 0, 1.86, 1.2);
  for (const lampX of [-.5, 0, .5]) box(truck, .22, .18, .16, 0xfff0c4, lampX, 1.98, 1.2, makeMaterial(0xfff0c4, { emissive: 0xffe6a3, emissiveIntensity: 1 }));
  for (const side of [-1, 1]) {
    box(truck, .04, .44, .68, 0x426b7c, side * .87, 1.32, 1.22);
    box(truck, .13, .32, .25, 0x344c56, side * 1.02, 1.36, 1.5);
    box(truck, .23, .16, .08, 0xfff7ce, side * .52, .94, 1.8);
    box(truck, .12, .48, 2.2, 0xe6ebe0, side * .82, 1.02, -.53);
  }
  box(truck, 1.7, .15, 2.25, 0xe6e9dc, 0, .84, -.53);
  box(truck, 1.7, .48, .13, 0xe6ebe0, 0, 1.02, -1.63);
  box(truck, 1.8, .15, .16, 0x657764, 0, .65, 1.79);
  for (const side of [-1, 1]) {
    for (const axle of [-1.12, 1.06]) {
      const wheel = cylinder(truck, .37, .22, 0x26373e, side * .88, .43, axle, 16);
      wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(truck, .17, .24, 0xd2dfe4, side * .9, .43, axle, 12);
      hub.rotation.z = Math.PI / 2;
      wheels.push(wheel);
    }
  }
  for (let index = 0; index < 6; index++) {
    const crate = box(truck, .62, .55, .57, 0xe8c065, (index % 2) * .73 - .365, 1.2, -.98 + Math.floor(index / 2) * .64);
    box(crate, .12, .02, .59, 0xf8e5aa, 0, .28, 0);
    tokenCrates.push(crate);
  }
  truck.scale.setScalar(1.14);
  worldGroup.add(truck);
}

function disposeWorld() {
  if (!worldGroup) return;
  scene.remove(worldGroup);
  worldGroup.traverse((object) => {
    object.geometry?.dispose();
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    materials.forEach((material) => { material.map?.dispose(); material.dispose(); });
  });
}

function buildWorld() {
  disposeWorld();
  physicsWorld = new CANNON.World();
  physicsWorld.gravity.set(0, 0, 0);
  physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld);
  physicsWorld.solver.iterations = 10;
  physicsWorld.defaultContactMaterial.friction = .15;
  physicsWorld.defaultContactMaterial.restitution = 0;
  worldGroup = new THREE.Group();
  scene.add(worldGroup);
  buildings = [];
  windRotors = [];
  cacheDrop = null;
  routes[state.mode].forEach((key, index) => {
    const x = (index - (routes[state.mode].length - 1) / 2) * 30;
    stations[key].position = [x, roadZ(x) - 8];
  });
  routeStart = stations[routes[state.mode][0]].position[0] - 15;
  routeEnd = stations[routes[state.mode].at(-1)].position[0] + 15;
  addLandscape();
  const roadPoints = [];
  for (let x = -230; x <= 230; x += 10) roadPoints.push(new THREE.Vector3(x, 0, roadZ(x)));
  buildRoad(roadPoints, 10.1, 0xe7f1f5, .015);
  routeCurve = buildRoad(roadPoints, 7.2, 0x465964, .04);
  addRoadMarkings(routeCurve);
  for (const side of [-1, 1]) {
    const extensionX = side * 5230;
    box(worldGroup, 10000, .025, 10.1, 0xe7f1f5, extensionX, .015, roadZ(side * 230));
    box(worldGroup, 10000, .025, 7.2, 0x465964, extensionX, .04, roadZ(side * 230));
  }
  routes[state.mode].forEach((key, index) => {
    const [x, z] = stations[key].position;
    const mainZ = roadZ(x);
    addParkingApron(x, z);
    box(worldGroup, 12.8, .025, .14, 0xfff0cc, x, .08, z - 2.7);
    for (const side of [-1, 1]) box(worldGroup, .14, .025, 4.5, 0xfff0cc, x + side * 3.2, .08, z - .4);
    label(worldGroup, `P  ${String(index + 1).padStart(2, '0')}`, x, .4, z, true, .32);
    addBuilding(key, index + 1);
    cylinder(worldGroup, .1, 2.4, 0x87908a, x - 6, 1.2, mainZ - 3.8, 8);
    label(worldGroup, `${String(index + 1).padStart(2, '0')}  ↗`, x - 6, 2.7, mainZ - 3.8, true, .3);
    const bench = new THREE.Group();
    bench.position.set(x + 6, 0, z - 5);
    box(bench, 2.3, .18, .8, 0xbb865d, 0, .7, 0);
    box(bench, 2.3, .8, .14, 0xd4a374, 0, 1.1, -.4);
    for (const side of [-1, 1]) box(bench, .12, .7, .65, 0x496b63, side * .9, .35, 0);
    worldGroup.add(bench);
    addObstacle(x + 6, z - 5, 2.3, 1);
    cylinder(worldGroup, .4, 1, index % 2 ? 0x609ab6 : 0x72965b, x + 7.8, .5, z - 5, 8);
    cylinder(worldGroup, .44, .12, 0x456257, x + 7.8, 1.06, z - 5, 8);
    const awningColor = index % 2 ? 0xc55943 : 0x3f777a;
    box(worldGroup, 3.6, .16, 1.3, awningColor, x, 3.15, z - 2.9);
    box(worldGroup, 3.8, .14, 1.4, 0xf4f8fa, x, 3.3, z - 2.9);
  });
  for (let x = -140; x <= 140; x += 15) {
    const z = roadZ(x) + 7;
    cylinder(worldGroup, .08, 3.5, 0x91a18b, x, 1.75, z, 6);
    box(worldGroup, .8, .17, .5, 0xf7f4df, x, 3.5, z);
    addTree(worldGroup, x + 5, z + 6, .9 + Math.abs(x % 3) * .1);
    for (const side of [-1, 1]) {
      const postZ = roadZ(x) + side * 4.5;
      if (roadSurface(x, postZ) === 'bay') continue;
      box(worldGroup, .16, .9, .16, 0xfaf5e3, x, .45, postZ);
      box(worldGroup, .18, .2, .18, 0x354e53, x, .65, postZ);
      box(worldGroup, .19, .1, .19, 0xedb34b, x, .72, postZ);
    }
  }
  addPassBarriers();
  for (const x of [routeStart - 6, routeEnd + 6]) {
    const sign = new THREE.Group();
    sign.position.set(x, 0, roadZ(x) + 6.1);
    cylinder(sign, .13, 4.8, 0x718b98, 0, 2.4, 0, 8);
    label(sign, x < 0 ? 'NORDGRAT  /  2.240 m' : 'PASSHÖHE  /  GUTE FAHRT', 0, 5.3, 0, true, .65);
    worldGroup.add(sign);
  }
  makeTruck();
  vehicleBody = new CANNON.Body({ mass: 180, fixedRotation: true, linearDamping: 0 });
  vehicleBody.addShape(new CANNON.Box(new CANNON.Vec3(.97, .8, 2.05)));
  vehicleBody.position.set(routeStart, 1, roadZ(routeStart) + 1.65);
  physicsWorld.addBody(vehicleBody);
  resetJourney();
  positionTruck();
}

function positionTruck() {
  if (!truck) return;
  const forwardX = Math.sin(state.heading), forwardZ = Math.cos(state.heading);
  const height = terrainHeight(state.x, state.z);
  const frontHeight = terrainHeight(state.x + forwardX * 1.7, state.z + forwardZ * 1.7);
  const rearHeight = terrainHeight(state.x - forwardX * 1.7, state.z - forwardZ * 1.7);
  const leftHeight = terrainHeight(state.x + forwardZ, state.z - forwardX);
  const rightHeight = terrainHeight(state.x - forwardZ, state.z + forwardX);
  truck.position.set(state.x, height + .2, state.z);
  truck.rotation.order = 'YXZ';
  truck.rotation.set(-Math.atan2(frontHeight - rearHeight, 3.4), state.heading, Math.atan2(leftHeight - rightHeight, 2));
}

function updateCamera(resize = true) {
  if (!camera || !renderer) return;
  const width = sceneHost.clientWidth, height = sceneHost.clientHeight;
  const aspect = width / height;
  const halfHeight = (cameraFollow ? Math.max(23, 32 / aspect) : Math.max(62, (routeEnd + 22) / aspect)) / cameraZoom;
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  const target = cameraFollow ? cameraTarget : { x: 0, y: 0, z: -4 };
  camera.position.set(target.x + Math.sin(cameraAngle) * 85, target.y + 85, target.z + Math.cos(cameraAngle) * 85);
  camera.lookAt(target.x, target.y, target.z);
  camera.updateProjectionMatrix();
  if (resize) renderer.setSize(width, height);
}

function advance(delta) {
  state.elapsed += delta;
  if (!vehicleBody) return;
  state.surface = roadSurface(state.x, state.z);
  const surfaceLimit = { road: 14, bay: 7, shoulder: 8, grass: 4.2 }[state.surface];
  let steering = Number(driveInput.left) - Number(driveInput.right);
  let throttle = Number(driveInput.forward) - Number(driveInput.reverse);
  if (state.running && Object.values(driveInput).some(Boolean)) {
    state.running = false;
    updatePlayButton();
  }
  if (state.running) {
    const aimX = Math.min(routeEnd, state.x + 7);
    const aimZ = roadZ(aimX) + 1.65;
    const desiredHeading = Math.atan2(aimX - state.x, aimZ - state.z);
    const error = Math.atan2(Math.sin(desiredHeading - state.heading), Math.cos(desiredHeading - state.heading));
    steering = THREE.MathUtils.clamp(error * 2.1, -1, 1);
    throttle = 1;
    if (state.x >= routeEnd - 2) {
      throttle = 0;
      state.running = false;
      state.velocity = 0;
      updatePlayButton();
    }
  }
  const maxSpeed = surfaceLimit * state.speed;
  const targetSpeed = driveInput.brake ? 0 : throttle > 0 ? maxSpeed : throttle < 0 ? -Math.min(5, maxSpeed * .5) : 0;
  const acceleration = driveInput.brake || state.velocity * throttle < 0 ? 24 : throttle ? 8 : 9;
  state.velocity += THREE.MathUtils.clamp(targetSpeed - state.velocity, -acceleration * delta, acceleration * delta);
  state.velocity = THREE.MathUtils.clamp(state.velocity, -maxSpeed, maxSpeed);
  state.heading += state.velocity / 2.8 * Math.tan(steering * .52 / (1 + Math.abs(state.velocity) * .035)) * delta;
  vehicleBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), state.heading);
  vehicleBody.velocity.set(Math.sin(state.heading) * state.velocity, 0, Math.cos(state.heading) * state.velocity);
  vehicleBody.position.y = 1;
  physicsWorld.step(1 / 60, delta, 4);
  state.x = vehicleBody.position.x;
  state.z = vehicleBody.position.z;
  state.velocity = vehicleBody.velocity.x * Math.sin(state.heading) + vehicleBody.velocity.z * Math.cos(state.heading);
  if (terrainHeight(state.x, state.z) < -9) recoverVehicle();
  state.distance += Math.abs(state.velocity) * delta;
  wheels.forEach((wheel) => wheel.rotateY(state.velocity * delta / .37));
  checkParking(delta);
}

function recoverVehicle() {
  pauseDriving();
  state.z = roadZ(state.x) + 1.65;
  state.heading = roadHeading(state.x);
  state.surface = 'road';
  state.parkedAt = -1;
  state.parkingTime = 0;
  vehicleBody.position.set(state.x, 1, state.z);
  vehicleBody.angularVelocity?.setZero();
  vehicleBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), state.heading);
  byId('arrival-number').textContent = 'SOS';
  byId('arrival-name').textContent = 'Zurück auf dem Bergpass';
  byId('arrival').querySelector('small').textContent = 'FAHRZEUG GEBORGEN';
  byId('arrival').classList.add('visible');
  clearTimeout(arrivalTimer);
  arrivalTimer = setTimeout(() => byId('arrival').classList.remove('visible'), 3200);
}

function checkParking(delta) {
  const candidate = routes[state.mode].findIndex((key) => {
    const [x, z] = stations[key].position;
    return Math.abs(state.x - x) < 3.3 && Math.abs(state.z - z) < 2.6;
  });
  if (candidate < 0 || Math.abs(state.velocity) > .35) {
    state.parkingTime = 0;
    state.parkedAt = -1;
    return;
  }
  if (state.parkedAt !== candidate) state.parkingTime = 0;
  state.parkedAt = candidate;
  const previousTime = state.parkingTime;
  state.parkingTime += delta;
  if (previousTime < .65 && state.parkingTime >= .65) {
    state.index = candidate;
    state.visited.add(candidate);
    state.completed = state.visited.size === routes[state.mode].length;
    updateStation(true);
    syncCacheDrop();
  }
}

function animate(timestamp) {
  const delta = Math.min((timestamp - (lastTime || timestamp)) / 1000, .05);
  lastTime = timestamp;
  const paused = document.hidden || byId('help-dialog').open || byId('station-dialog').open;
  if (!paused) advance(delta);
  positionTruck();
  if (!paused) animateCacheDrop(delta);
  if (snowfall && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    const snowPositions = snowfall.geometry.attributes.position;
    for (let index = 0; index < snowPositions.count; index++) {
      snowPositions.setY(index, ((index * 31 - timestamp * .0025) % 92 + 92) % 92 - 5);
    }
    snowPositions.needsUpdate = true;
  }
  const tracking = 1 - Math.exp(-delta * 4);
  cameraTarget.x += (state.x + Math.sin(state.heading) * 5 - cameraTarget.x) * tracking;
  cameraTarget.z += (state.z + Math.cos(state.heading) * 5 - cameraTarget.z) * tracking;
  if (renderer) cameraTarget.y += (terrainHeight(state.x, state.z) - cameraTarget.y) * tracking;
  updateCamera(false);
  if (sunlight) {
    sunlight.position.set(state.x - 35, 65, state.z + 30);
    sunlight.target.position.set(state.x, 0, state.z);
  }
  buildings.forEach(({ halo }) => { halo.material.opacity = .42 + Math.sin(state.elapsed * 2) * .15; });
  windRotors.forEach((rotor, index) => { rotor.rotation.z = state.elapsed * (.4 + index * .08); });
  if (timestamp - uiTime > 100) { updateProgress(); uiTime = timestamp; }
  if (renderer) renderer.render(scene, camera);
  animationFrame = requestAnimationFrame(animate);
}

function initScene() {
  try {
    if (!window.THREE) throw new Error('Die 3D-Bibliothek konnte nicht vom CDN geladen werden.');
    if (!window.CANNON) throw new Error('Die Fahrphysik konnte nicht vom CDN geladen werden.');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc6dde7);
    scene.fog = new THREE.Fog(0xc6dde7, 210, 620);
    camera = new THREE.OrthographicCamera(-60, 60, 40, -40, .1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0xc6dde7, 1);
    sceneHost.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xe7f4ff, .85));
    sunlight = new THREE.DirectionalLight(0xffedda, 2.5);
    sunlight.position.set(-35, 65, 30);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunlight.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: .5, far: 180 });
    sunlight.shadow.normalBias = .045;
    sunlight.shadow.bias = -.0002;
    sunlight.shadow.radius = 3;
    scene.add(sunlight);
    scene.add(sunlight.target);
    scene.add(new THREE.HemisphereLight(0xe8f6ff, 0x768e9b, 1.25));
    buildWorld();
    updateCamera();
    new ResizeObserver(updateCamera).observe(sceneHost);
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      state.running = false;
      clearDrivingInput();
      updatePlayButton();
      byId('canvas-error').hidden = false;
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => { byId('canvas-error').hidden = true; });
  } catch (error) {
    console.error(error);
    scene = null;
    renderer = null;
    byId('canvas-error').hidden = false;
    vehicleBody = null;
    if (!window.THREE || !window.CANNON) {
      byId('error-title').textContent = 'Die 3D- oder Physik-Bibliothek konnte nicht laden.';
      byId('error-text').textContent = 'Three.js und Cannon.js werden über cdn.jsdelivr.net geladen. Prüfe deine Internetverbindung und lade die Seite neu. Die Stationen und Erklärungen bleiben über die Routenliste verfügbar.';
    }
    byId('play-button').disabled = true;
    byId('pedal').disabled = true;
    byId('zoom-in').disabled = true;
    byId('zoom-out').disabled = true;
  }
}

byId('llm-mode').addEventListener('click', () => switchMode('llm'));
byId('agent-mode').addEventListener('click', () => switchMode('agent'));
byId('play-button').addEventListener('click', togglePlay);
byId('reset-button').addEventListener('click', resetJourney);
byId('speed').addEventListener('input', (event) => { state.speed = Number(event.target.value); byId('speed-value').textContent = `${state.speed.toLocaleString('de')}×`; });
byId('station-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-index]');
  if (!button) return;
  state.index = Number(button.dataset.index);
  updateStation();
  updateProgress();
  openStationDialog();
});

byId('close-station').addEventListener('click', () => byId('station-dialog').close());
byId('next-station').addEventListener('click', () => {
  if (state.index + 1 < routes[state.mode].length) state.index++;
  byId('station-dialog').close();
  updateStation();
  updateProgress();
  sceneHost.focus({ preventScroll: true });
});
byId('station-dialog').addEventListener('close', clearDrivingInput);

function changeZoom(amount) { cameraZoom = Math.min(1.65, Math.max(.7, cameraZoom + amount)); updateCamera(); }
byId('zoom-in').addEventListener('click', () => changeZoom(.12));
byId('zoom-out').addEventListener('click', () => changeZoom(-.12));
byId('view-reset').addEventListener('click', () => { cameraAngle = .68; cameraZoom = 1; cameraFollow = true; byId('view-overview').setAttribute('aria-pressed', 'false'); updateCamera(); });
function toggleOverview() {
  cameraFollow = !cameraFollow;
  cameraZoom = 1;
  byId('view-overview').setAttribute('aria-pressed', String(!cameraFollow));
  updateCamera();
}
byId('view-overview').addEventListener('click', toggleOverview);
byId('minimap-button').addEventListener('click', toggleOverview);
sceneHost.addEventListener('pointerdown', (event) => { drag = { x: event.clientX, angle: cameraAngle, id: event.pointerId }; sceneHost.setPointerCapture(event.pointerId); });
sceneHost.addEventListener('pointermove', (event) => { if (!drag || drag.id !== event.pointerId) return; cameraAngle = drag.angle - (event.clientX - drag.x) * .006; updateCamera(); });
sceneHost.addEventListener('pointerup', () => { drag = null; });
sceneHost.addEventListener('pointercancel', () => { drag = null; });
sceneHost.addEventListener('wheel', (event) => { event.preventDefault(); changeZoom(-Math.sign(event.deltaY) * .06); }, { passive: false });
function refreshDrivingInput() {
  const keyActions = { forward: ['KeyW', 'ArrowUp'], reverse: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], brake: ['Space'] };
  for (const [action, keys] of Object.entries(keyActions)) {
    driveInput[action] = keys.some((key) => pressedKeys.has(key)) || [...touchInputs.values()].includes(action);
  }
  byId('pedal').classList.toggle('held', driveInput.forward);
  document.querySelectorAll('[data-drive]').forEach((button) => button.classList.toggle('held', driveInput[button.dataset.drive]));
}

function clearDrivingInput() {
  pressedKeys.clear();
  touchInputs.clear();
  refreshDrivingInput();
}

for (const button of [byId('pedal'), ...document.querySelectorAll('[data-drive]')]) {
  button.addEventListener('pointerdown', (event) => {
    if (!vehicleBody) return;
    event.preventDefault();
    touchInputs.set(event.pointerId, button.dataset.drive || 'forward');
    button.setPointerCapture(event.pointerId);
    refreshDrivingInput();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, (event) => { touchInputs.delete(event.pointerId); refreshDrivingInput(); });
  }
}
byId('help-button').addEventListener('click', () => { pauseDriving(); byId('help-dialog').showModal(); });
byId('close-help').addEventListener('click', () => byId('help-dialog').close());
byId('help-dialog').addEventListener('click', (event) => { if (event.target === byId('help-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });
window.addEventListener('keydown', (event) => {
  if (byId('help-dialog').open || byId('station-dialog').open || event.target.matches('input, textarea, select, [contenteditable]') || !renderer) return;
  if (event.code === 'Space' && event.target.closest('button, a')) return;
  if (!['Space', 'KeyP', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) return;
  event.preventDefault();
  if (event.code === 'KeyP' && !event.repeat) togglePlay();
  if (event.code !== 'KeyP') sceneHost.focus({ preventScroll: true });
  pressedKeys.add(event.code);
  refreshDrivingInput();
});
window.addEventListener('keyup', (event) => {
  pressedKeys.delete(event.code);
  refreshDrivingInput();
});
function pauseDriving() {
  clearDrivingInput();
  state.velocity = 0;
  state.running = false;
  vehicleBody?.velocity.setZero();
  updatePlayButton();
  drag = null;
}
window.addEventListener('blur', pauseDriving);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseDriving(); lastTime = 0; });

icons();
document.fonts.ready.then(() => {
  initScene();
  updateStation();
  updatePlayButton();
  animationFrame = requestAnimationFrame(animate);
});