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
