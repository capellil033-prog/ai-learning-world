window.levelShell = `
  <div class="workspace game-workspace" id="mission-workspace">
    <aside class="sidebar mission-drawer" id="mission-drawer">
      <div class="intro mission-intro">
        <span class="eyebrow"><span class="status-dot"></span> AKTIVE MISSION</span>
        <h1><span id="level-heading"></span></h1>
        <p id="mode-description">Vom ersten Wort zum nächsten Token.</p>
        <div class="pass-meta" id="level-meta"><span><i data-lucide="route"></i> Lernroute</span><span>Fahrzeug</span></div>
      </div>
      <div class="route-heading"><span>STATIONEN</span><span id="route-count">6 STATIONEN</span></div>
      <nav id="station-list" class="station-list mission-list" aria-label="Verarbeitungsstationen"></nav>
      <section class="learning-note mission-intel" aria-live="polite" aria-atomic="true">
        <div class="note-heading"><i data-lucide="scan-line"></i><span id="detail-kicker">MISSION INTEL</span></div>
        <h2 id="detail-title"></h2><p id="detail-text"></p><div id="detail-fact" class="detail-fact"></div>
      </section>
      <div class="sidebar-footer"><i data-lucide="radio"></i> SYSTEM ONLINE <span>LOKAL</span></div>
    </aside>

    <section class="world" aria-label="Interaktive 3D-Landschaft mit Lernroute">
      <div id="scene" tabindex="0" aria-label="Fahrzeug: W zum Beschleunigen, S zum Bremsen und Rückwärtsfahren, A und D zum Lenken, Leertaste zum Anhalten"></div>
      <button class="mission-panel-toggle hud-button" id="mission-panel-toggle" type="button" aria-controls="mission-drawer" aria-expanded="true"><i data-lucide="panel-left-close"></i><span>Missionen</span></button>
      <div class="world-top mission-target"><div><span class="eyebrow">AKTIVES ZIEL</span><div class="world-title"><span class="status-dot"></span><span id="world-status">Bereit zur Abfahrt</span></div><div class="destination"><i data-lucide="locate-fixed"></i><span id="station-distance">0 m</span><span id="parking-status"></span></div></div></div>
      <div class="altitude-marker" hidden><i data-lucide="mountain-snow"></i><div><strong>2.240</strong><span>METER ÜBER DEM MEER</span></div><span class="compass-mark">N ↑</span></div>
      <div class="driving-hud game-speed"><span id="drive-state">PARKEN</span><div><strong id="vehicle-speed">0</strong><small>km/h</small></div><span id="surface-label" data-surface="road">Asphalt</span></div>
      <div class="view-controls game-tools"><button class="icon-button" id="zoom-in" title="Vergrössern" aria-label="Vergrössern"><i data-lucide="plus"></i></button><button class="icon-button" id="zoom-out" title="Verkleinern" aria-label="Verkleinern"><i data-lucide="minus"></i></button><span></span><button class="icon-button" id="view-reset" title="Kamera folgt Fahrzeug" aria-label="Kamera folgt Fahrzeug"><i data-lucide="crosshair"></i></button><button class="icon-button" id="view-overview" title="Gesamte Route anzeigen" aria-label="Gesamte Route anzeigen" aria-pressed="false"><i data-lucide="map"></i></button></div>
      <div class="cargo-chip game-cargo"><span class="cargo-icon"><i data-lucide="package"></i></span><div><span class="chip-label">MISSION CARGO</span><strong id="cargo-label">Dein Prompt</strong></div><span id="cargo-count">01</span></div>
      <button class="minimap-button game-minimap" id="minimap-button" title="Zwischen Übersicht und Verfolgung wechseln" aria-label="Zwischen Kartenübersicht und Verfolgung wechseln"><canvas id="minimap" width="336" height="184" aria-label="Karte mit Stationen und Fahrzeugposition"></canvas><span><i data-lucide="navigation"></i> LIVE ROUTE</span></button>
      <div class="manual-controls" role="group" aria-label="Fahrsteuerung"><button data-drive="left" title="Links lenken (A / ←)" aria-label="Links lenken"><i data-lucide="arrow-left"></i></button><button data-drive="right" title="Rechts lenken (D / →)" aria-label="Rechts lenken"><i data-lucide="arrow-right"></i></button><button data-drive="reverse" title="Bremsen und rückwärts fahren (S / ↓)" aria-label="Bremsen und rückwärts fahren"><i data-lucide="arrow-down"></i></button><button data-drive="brake" title="Anhalten (Leertaste)" aria-label="Anhalten"><i data-lucide="circle-pause"></i></button></div>
      <div class="arrival" id="arrival" aria-live="polite"><span id="arrival-number">01</span><div><small>STATION ERREICHT</small><strong id="arrival-name">Input-Terminal</strong></div><i data-lucide="map-pin"></i></div>
      <div class="canvas-error" id="canvas-error" hidden><i data-lucide="monitor-x"></i><h2 id="error-title">Die 3D-Ansicht braucht WebGL.</h2><p id="error-text">Aktiviere die Hardwarebeschleunigung deines Browsers. Stationen und Erklärungen bleiben über das Missionsmenü verfügbar.</p></div>
    </section>
  </div>

  <footer class="dashboard game-dashboard">
    <div class="drive-controls"><button class="secondary" id="tour-button" title="Geführt zur ausgewählten Station fahren"><i data-lucide="navigation"></i><span>Zum Ziel</span></button><button class="drive-button" id="play-button" title="Route automatisch entlangfahren, ohne Stationsstopps (P)"><i data-lucide="route"></i><span>Autopilot</span></button><button class="icon-button reset-button" id="reset-button" title="Fahrzeug zum Start zurücksetzen" aria-label="Fahrzeug zum Start zurücksetzen"><i data-lucide="rotate-ccw"></i></button></div>
    <div class="trip-progress"><div class="progress-label"><span id="progress-label">MISSIONSFORTSCHRITT</span><span id="progress-value">0 / 6</span></div><div class="progress-track"><div id="progress-fill"></div><span id="progress-truck"><i data-lucide="navigation"></i></span></div></div>
    <div class="speed-control"><i data-lucide="gauge"></i><label for="speed">TEMPO</label><input id="speed" type="range" min="0.5" max="2" step="0.5" value="1"><output for="speed" id="speed-value">1×</output></div>
    <button class="pedal" id="pedal" title="Gedrückt halten zum Fahren (W / ↑)" aria-label="Gedrückt halten zum Fahren"><i data-lucide="chevrons-up"></i></button>
    <button class="secondary summary-control" id="summary-button"><i data-lucide="flag"></i><span>Mission abschliessen</span></button>
  </footer>

  <dialog id="station-dialog" class="station-dialog" aria-labelledby="station-heading"></dialog>
  <dialog id="help-dialog" aria-labelledby="help-heading"><div class="dialog-header"><span class="eyebrow">SPIELMENÜ / STEUERUNG</span><button class="icon-button" id="close-help" aria-label="Hilfe schliessen">×</button></div><h2 id="help-heading">Fahren. Entdecken. Verstehen.</h2><p>Wähle eine Station im Missionsmenü oder fahre selbst zur markierten Haltebucht. Der Besuch wird beim Öffnen gespeichert; Demos und Wissenscheck bleiben freiwillig.</p><p><strong>Fahren:</strong> W / ↑ Gas · S / ↓ Rückwärts · A/D / ←/→ Lenken · Leertaste Anhalten · P Autopilot. Manuelle Eingaben übernehmen jederzeit die Kontrolle.</p><p><strong>Ansicht:</strong> Maus ziehen dreht die Kamera, Mausrad und +/− ändern den Zoom. Mit „Missionen“ blendest du das Roadbook ein oder aus.</p><p><strong>Sound:</strong> Das Lautsprechersymbol oben startet oder stoppt Weltraum-, Motor-, Strassen- und Wasserklänge. Browser benötigen dafür zuerst eine Eingabe.</p></dialog>
  <dialog id="checkpoint-dialog" class="station-dialog" aria-labelledby="checkpoint-heading"></dialog>
  <dialog id="intro-dialog" aria-labelledby="intro-heading"></dialog>`;
