# AI Learning World

Interaktive, datengetriebene 3D-Lernwelt nach der Spezifikation in `C:\Obsidian\ChatGPT\Projekte\AI Learning World`.

## Start

`index.html` im Browser öffnen oder im Projektordner `python -m http.server 4173 --bind 127.0.0.1` starten und `http://127.0.0.1:4173` öffnen. Kein Build, npm oder Backend nötig.

## Struktur

- `data/`: Welt- und Leveldaten, Lerntexte, Demonstrationen und Checkpoints.
- `app.js`: gemeinsame Navigation und Lernablauf.
- `lib/`: gemeinsame Fahr-/Szenenlogik und Fortschritt.
- `assets/`: wiederverwendete Gestaltung und lokale Bibliotheken.
- `docs/`: Herkunft und Nachweise der Entwicklungsphasen.

Die Token-Transit-Quelldateien werden ausschliesslich gelesen. Deren ursprüngliche SHA-256-Prüfsummen stehen in `docs/template-hashes.json`.

## Entwicklung

Branch: `feature/world-map`. Nach jeder Phase wird die laufende App geprüft und ein eigener Commit erstellt.
