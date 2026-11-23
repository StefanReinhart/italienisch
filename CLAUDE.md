# Italienisch-Lern-App – Hinweise für Claude

Der Nutzer ist kein Programmierer: einfach erklären, auf Deutsch, ohne Fachbegriffe.

## Bei JEDER Bearbeitung zuerst: Erklärungs-Wünsche abarbeiten

1. `git pull` (die App und die Bearbeiten-Seite schreiben direkt zu GitHub).
2. `data/wuensche.json` lesen. Jeder Eintrag ist eine Karte, zu der der Nutzer eine Erklärung möchte
   (`id` = feste Kennung, `it`, `de`).
3. Für jede eine kurze, einfache Erklärung (1–2 Sätze, Deutsch) in `data/hinweise.js` eintragen:
   `"kennung": "Hinweis",`
4. Einträge mit `"typ": "antwort"` sind Antworten aus „Frage & Antwort“, die der Nutzer selbst als richtig
   markiert hat (`id` = Kennung der Frage, z. B. `dialog:Che cosa prendi?`, `frage`, `antwort`). Prüfen:
   - **Richtig:** in `data/gespraech.js` bei dieser Frage ein passendes, möglichst allgemeines Antwortmuster
     ergänzen (Schreibweise steht oben in der Datei), damit es auf allen Geräten erkannt wird.
   - **Falsch:** in `data/hinweise.js` unter `window.ABGELEHNTE_ANTWORTEN` eintragen
     (`"dialog:…": ["falsche Antwort"]`) – dann zählt sie nicht mehr als richtig – und dem Nutzer den Fehler erklären.
5. `data/wuensche.json` danach wieder auf `[]` setzen.
6. Dem Nutzer kurz sagen, welche Erklärungen und Antwortmuster dazugekommen sind.

## Veröffentlichen

`veroeffentlichen.ps1 -Nachricht "…" -OhnePause` (erhöht die Version in `sw.js`, committet mit der
anonymen GitHub-Adresse, pusht und wartet, bis die Version online ist).

## Wichtige Regeln

- Verknüpfungen immer über feste Kennungen (IDs), nie über Texte.
- Neue Datendateien in `index.html` UND in die Liste in `sw.js` eintragen.
- Vor dem Veröffentlichen lokal testen (`lokal-starten.ps1 -OhneBrowser`), auch mit leerem Lernstand.
