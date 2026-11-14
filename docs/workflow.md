# Projekt-Workflow

Diese Notiz gehört zum lokalen Obsidian-Vault `C:\learning_world`.

## Verbindlicher Ablauf

Nach jeder fertig umgesetzten Änderung:

1. Relevante Syntaxprüfungen und automatisierte Tests ausführen.
2. Nur die zur Aufgabe gehörenden Dateien committen.
3. Den Arbeitsbranch zu `origin` pushen.
4. Einen Pull Request vom Arbeitsbranch nach `main` erstellen.
5. Falls bereits ein offener Pull Request für diesen Branch existiert, diesen durch den neuen Push aktualisieren statt einen doppelten Pull Request anzulegen.
6. Änderung, Testergebnis, Commit und Pull Request in diesem Obsidian-Vault dokumentieren.

Ein Pull Request wird nicht automatisch gemergt. Das Mergen nach `main` erfolgt nur auf ausdrücklichen Auftrag.

## Änderungsprotokoll

### 2026-11-14 – Game-UI und Umgebungsgeräusche

- Branch: `codex/game-ui-sounds`
- Commit: `0f4189c`
- Pull Request: [#9 – Redesign game UI and add procedural sounds](https://github.com/capellil033-prog/ai-learning-world/pull/9)
- Prüfung: Syntaxprüfung der Frontend-Skripte und `node --test` mit 24/24 bestandenen Tests
- Inhalt: dunkles Mission-Control-Menü, kompakteres Level-HUD, einklappbares Roadbook, responsive Spielsteuerung sowie prozedurale Weltraum-, Motor-, Strassen-, Gelände- und Wassergeräusche
- Einschränkung: Chrome erzeugte in dieser Sitzung keinen Headless-Screenshot; deshalb wurde keine visuelle Browserprüfung als bestanden dokumentiert

### 2026-11-14 – Anspruchsvollere Expeditionen

- Branch: `feature/world-map`
- Commit: `173b319`
- Pull Request: [#7 – Make expeditions steeper and more dramatic](https://github.com/capellil033-prog/ai-learning-world/pull/7)
- Prüfung: `node --check lib/expedition.js` und `node --test` mit 23/23 bestandenen Tests
- Inhalt: exklusive Boot-Wassereffekte, steilere und schmalere Landstrassen, dichtere Wälder, Steigungswirkung, veränderte Geländetraktion und dynamischere Kamera
