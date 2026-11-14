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

### 2026-11-14 – Anspruchsvollere Expeditionen

- Branch: `feature/world-map`
- Commit: `173b319`
- Pull Request: [#7 – Make expeditions steeper and more dramatic](https://github.com/capellil033-prog/ai-learning-world/pull/7)
- Prüfung: `node --check lib/expedition.js` und `node --test` mit 23/23 bestandenen Tests
- Inhalt: exklusive Boot-Wassereffekte, steilere und schmalere Landstrassen, dichtere Wälder, Steigungswirkung, veränderte Geländetraktion und dynamischere Kamera
