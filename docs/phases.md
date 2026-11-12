# Entwicklungsnachweis

## Phase 1 – Foundation

- Datenmodell in `data/`, gemeinsame Gestaltung und defensive localStorage-Verarbeitung.
- Token-Transit-Szenencode und CSS als Grundlage übernommen; Vorlage unverändert.
- Lokale, fest versionierte Bibliotheken für Betrieb ohne CDN.

Prüfung: App unter http://127.0.0.1:4174 gestartet; Browser zeigt zwei Leveldaten, LLM City verfügbar und Token Pass gesperrt. JavaScript-Syntaxprüfung bestanden.

## Phase 2 – World Map
3D-Karte mit Originalmodellen, zwei Level-Nodes, Route, Sperrzustand, responsivem Koordinatensystem und Navigation. Browserprüfung: Karte gerendert; Einstieg in LLM City und Rückweg verfügbar; Token Pass gesperrt.

## Phase 3 – LLM City
Sieben datengetriebene Stationen, Token-Generierung, Zusammenfassung, Wissenscheck, Tour und wiederverwendete Fahrphysik. Browserprüfung: 7 Stationen bestätigt, Demo vollständig ausgeführt, unbeantworteter Check blockiert Abschluss, 3 richtige Antworten schalten Token Pass frei. Keine Browserfehler.

## Phase 4 – Token Pass
Originale Bergwelt mit Snowcat, Tunnel, Tokenzerlegung, Kontextladung und Präfix-Cache. Browserprüfung: Berglevel gestartet, Überladung blockiert, relevante Ladung mit Ausgabereserve akzeptiert. Sechs automatisierte Tests für Datenmodell, Speicherung, Freischaltung, Tokenisierung und Kapazität bestanden.

## Phase 5 – Tool River
Flusslandschaft, Boot, Anleger, Brücke und Tool-Call-Simulation mit Argumentprüfung. Browserprüfung: Nach Token-Pass-Abschluss wird Tool River geöffnet; Werkzeugergebnis wird sichtbar in den Kontext aufgenommen. Keine Browserfehler. Sieben automatisierte Tests bestanden, einschliesslich ungültiger Werkzeugaufrufe.

## Phase 6 – Agent Forest
Wald-Biom, Jeep, Wegkreuzungen und datengetriebener Agent Loop. Browserprüfung: manueller Abbruch und erfolgreicher Wegwechsel nach neuer Beobachtung. Acht Tests bestanden; wiederholte Prüfungen stoppen am Schrittlimit.

## Phase 7 – MCP Harbor
Hafenboot, Container, Kräne und Verbindungsdemo für Host, Client, Server und externe Systeme. Browserprüfung: Tool-Aufruf, Serverwechsel, Resource und Prompt erfolgreich dargestellt. Neun Tests bestanden; Verbindung und servereigene Fähigkeiten werden geprüft. Fachliche Rollen mit offiziellen MCP-Dokumenten abgeglichen.

## Phase 8 – Retrieval und Verification

- Retrieval Desert: Wüsten-Biom, Geländewagen, Wort-/Vektorsuche, Quellenwahl, Grounding und RAG.
- Verification Lab: Shuttle, Belegprüfung, Tests, Evaluation, Verification, Validation und menschliche Prüfung.
- Browserprüfung: veraltete Quelle zurückgewiesen; passende Quellen für beide Fragen in den Kontext aufgenommen; Beleg, Widerspruch und fehlende Information korrekt zugeordnet.
- Fehlerhafte Beispielantwort besteht nur 1/3 Tests und bleibt gesperrt. Die korrigierte Antwort besteht 3/3 Tests; Freigabe erfordert zusätzlich bestätigte menschliche Prüfung.

## Abschliessende Gesamtprüfung

- Vollständige Freischaltkette im Browser von LLM City bis Verification Lab durchgespielt: **7/7 abgeschlossen**. Neuladen stellt den gespeicherten Fortschritt wieder her.
- Frischer Browser-Ursprung: **0/7**, LLM City verfügbar, Token Pass und weitere Gebiete gesperrt. Der gesperrte Einstieg lässt sich nicht ausführen.
- Manuelle Fahrt im Browser: W beschleunigt das Fahrzeug, Anzeige zeigt MANUELL und Geschwindigkeit. Geführte Fahrt erreicht eine Parkbucht und öffnet nach dem Halt die richtige Station.
- Desktop mit 1440 × 1000 und schmale Ansichten mit 390 × 844 und 320 × 800 geprüft. Die Karte scrollt innerhalb ihres Containers; die Seite läuft nicht horizontal über. Der letzte Bedienknopf liegt nach der Korrektur auch bei 305 CSS-Pixeln nutzbarer Breite innerhalb der Ansicht.
- Mobiles Stationsfenster mit Demo geprüft: kein horizontaler Überlauf, Inhalt vertikal scrollbar.
- **17 automatisierte Tests bestanden** (`node --test`), einschliesslich sieben 3D-Umgebungen/Fahrzeugen, echter Cannon-Fahrphysik mit ersetzter Grafikausgabe und fehlender 3D-Bibliothek.
- JavaScript-Syntax aller eigenen Skripte geprüft. Keine Fehler in der Browserkonsole beim finalen Start von Token Pass.
- SHA-256-Vergleich: alle vier Token-Transit-Quelldateien unverändert.
- Bildschirmnachweise: `screenshots/world-map.jpg`, `screenshots/token-pass.jpg`, `screenshots/mobile-lesson.jpg`.

Nicht geprüft: physische Touchgeräte, andere Browser-Engines und unterschiedliche reale Grafiktreiber. Die Prüfung ersetzt keinen Test auf diesen Geräten. Die App verwendet bewusst keine echten KI-/Wetter-/MCP-Dienste.
