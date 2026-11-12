# AI Learning World

Interaktive, datengetriebene 3D-Lernwelt nach der Spezifikation in `C:\Obsidian\ChatGPT\Projekte\AI Learning World`.

## Start

`index.html` in einem aktuellen Browser öffnen. Alternativ im Projektordner `python -m http.server 4173 --bind 127.0.0.1` starten und `http://127.0.0.1:4173` öffnen. Kein Build, npm, Backend oder Internetzugang nötig; Bibliotheken liegen lokal in `assets/vendor/`.

Für 3D wird WebGL benötigt. Ist 3D nicht verfügbar, bleiben die Stationen, Demos und Wissenschecks erreichbar.

## Fertiger Umfang

1. **LLM City:** sieben Stationen von User bis Verify, schrittweise Token-Generierung.
2. **Token Pass:** übernommene Bergwelt mit Snowcat, Tokenzerlegung, begrenzter Kontextladung und Präfix-Cache.
3. **Tool River:** Boot, geprüfter Tool Call und Rückgabe des Ergebnisses in den Kontext.
4. **Agent Forest:** Jeep, beobachtungsabhängige Entscheidungen, Schrittlimit und menschlicher Abbruch.
5. **MCP Harbor:** Hafenboot, Host/Client/Server, Tools, Resources und Prompts.
6. **Retrieval Desert:** Geländewagen, Wort-/Vektorsuche, Quellenwahl, Grounding und RAG.
7. **Verification Lab:** Shuttle, Belegprüfung, Tests, Evaluation, Validation und Human Review.

Jeder Level enthält Einstieg, Stationen, mindestens eine interaktive Demo, Zusammenfassung und drei Checkpoint-Fragen. Nach bestätigten Stationen, ausgeführten Demos und bestandenem Checkpoint wird der nächste Level freigeschaltet. Zu Beginn ist nur LLM City verfügbar; Token Pass und die weiteren Gebiete sind sichtbar und gesperrt.

## Bedienung

- Weltkarte: Region anklicken und **Level erkunden** wählen. Kleine Bildschirme können die Karte horizontal verschieben.
- Stationen: anklicken, lesen, Demo ausprobieren und **Station verstanden** bestätigen.
- **Tour:** zur ausgewählten Station fahren und dort automatisch halten. An Parkbuchten öffnet sich nach 0,65 Sekunden Stillstand die Erklärung.
- **W / ↑:** Gas; **S / ↓:** bremsen und rückwärts; **A/D / ←/→:** lenken; **Leertaste:** anhalten; **P:** Tempomat. Manuelle Eingabe übernimmt die Kontrolle.
- Touch: Pedal und Lenkknöpfe gedrückt halten. Kamera durch Ziehen drehen; Mausrad oder +/− zum Zoomen; Kartenknopf für die Übersicht.
- **Wissenscheck:** Zusammenfassung und Quiz öffnen. **Weltkarte:** zum Atlas zurückkehren.

Der Fahrzeug-Reset setzt die Fahrt zurück; der Lernfortschritt bleibt erhalten.

## Speicherung und fachliche Grenzen

Fortschritt liegt unter `ai-learning-world-v1` im localStorage des Browsers. Datei-Aufruf und verschiedene Serveradressen besitzen getrennte Speicherbereiche. Ist Speicherung blockiert, läuft die App mit Sitzungsfortschritt weiter und zeigt einen Hinweis.

Alle Modell-, Token-, Wetter-, MCP-, Retrieval- und Evaluationsbeispiele laufen lokal. Es gibt keine echte KI-Anbindung und keine ausgehenden API-Aufrufe. Tokenzerlegung, Vektoren, Kapazitäten und externe Datensätze sind didaktische Beispiele. Die fachlichen Quellen stehen in `docs/sources.md`.

## Struktur

- `data/`: Welt- und Leveldaten, Lerntexte, Demonstrationen und Checkpoints.
- `app.js`: gemeinsame Navigation und Lernablauf.
- `lib/`: gemeinsame Fahr-/Szenenlogik und Fortschritt.
- `assets/`: wiederverwendete Gestaltung und lokale Bibliotheken.
- `docs/`: Herkunft und Nachweise der Entwicklungsphasen.

Die Token-Transit-Quelldateien wurden ausschliesslich gelesen. Ihre ursprünglichen SHA-256-Prüfsummen stehen in `docs/template-hashes.json`; alle vier Dateien sind unverändert. Gebäude und Grundfahrzeug stehen als gemeinsame Modelle in `lib/models.js`, die übernommene Berg-/Fahr-/Kameralogik in `lib/expedition.js`. Die Oberfläche entwickelt das Originaldesign aus `assets/token-transit.css` weiter. Fahrzeugvarianten und Biome ergänzen dieselben geometrischen Grundformen.

## Einen Level ergänzen

Eine Datei unter `data/` legt ein weiteres Objekt in `AIWorld.levels` ab; sie wird in `index.html` nach `data/world.js` eingebunden. `app.js` enthält keine Levelinhalte.

Das Objekt beschreibt `id`, `number`, `title`, `topic`, `environment`, `vehicle`, `unlockedAfter`, Kartenposition, Lernziele, `stations`, `summary` und `checkpoints`. Stationen enthalten Texte, drei Verarbeitungsschritte, Beispiel, fachliche Grenze und optional eine deklarative `demo`. Der gemeinsame Lernablauf liest diese Daten.

`completedLevels`, `currentLevel` und `unlockedLevels` folgen dem spezifizierten Fortschrittsmodell. Zusätzliche Listen halten besuchte Stationen, abgeschlossene Demos und bestandene Checkpoint-Fragen für die Wiederaufnahme fest.

## Prüfungen

Mit Node.js 18 oder neuer: `node --test`.

17 Tests prüfen Datenmodell, Freischaltungen, Speicherung, Demonstrationen und die tatsächliche Cannon-Fahrphysik. Für die Szenentests wird die Grafikausgabe ersetzt; Geometrie und Physik verwenden die lokalen Originalbibliotheken. Die Prüfung der echten Darstellung und die Browserdurchläufe stehen in `docs/phases.md`.

## Entwicklung

Branch: `feature/world-map`. Nach jeder Phase wird die laufende App geprüft und ein eigener Commit erstellt.

Remote: `https://github.com/capellil033-prog/ai-learning-world.git`. Der Feature-Branch wird per Pull Request geprüft und nicht automatisch in main gemergt.
