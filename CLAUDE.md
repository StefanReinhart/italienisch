# Italienisch-Lern-App – Hinweise für Claude

Der Nutzer ist kein Programmierer: einfach erklären, auf Deutsch, ohne Fachbegriffe.

## Bei JEDER Bearbeitung zuerst: Erklärungs-Wünsche abarbeiten

1. `git pull` (die App und die Bearbeiten-Seite schreiben direkt zu GitHub).
2. `data/wuensche.json` lesen. Einträge ohne `typ` sind Karten, zu denen der Nutzer eine Erklärung möchte
   (`id` = feste Kennung, `it`, `de`) – manchmal mit einer **Frage** im Feld `nachricht`.
3. Für jede eine kurze, einfache Erklärung (1–2 Sätze, Deutsch) in `data/hinweise.js` eintragen:
   `"kennung": "Hinweis",` (gibt es schon einen Hinweis, ihn ergänzen). Mit `nachricht`: die Frage beantworten, und zwar
   so, dass der Hinweis auch später allein verständlich ist.
   - Fragt der Nutzer „Ist … auch richtig?“ und es **stimmt**: die Antwort in `window.KARTEN_ALTERNATIVEN`
     (italienisch) bzw. `window.KARTEN_ALTERNATIVEN_DE` (deutsch) unter der Kennung eintragen – dann zählt sie
     beim Prüfen als richtig – und im Hinweis erwähnen. Stimmt es **nicht**: im Hinweis erklären, warum.
   - **Immer auch in die Karten einbauen** (Wunsch des Nutzers): Taucht in der Antwort ein nützliches Wort oder
     eine Wendung auf, die es noch nicht als Karte gibt (z. B. „la prima volta“ aus „È la prima volta …“), sie als
     neue Karte in die passende Lektion (`neu` in `data/lektionen-a1.js`) aufnehmen – Karten gibt es automatisch in
     beiden Richtungen – und die Grundform ins Wörterbuch. Nicht nur erklären, sondern lernbar machen.
   - Einträge mit `"typ": "nachricht"` (`id: "allgemein"`) sind freie Nachrichten aus den Einstellungen
     (Wünsche, Fragen, Fehlermeldungen): umsetzen bzw. beantworten; wenn unklar oder größer, den Nutzer erst fragen.
4. Einträge mit `"typ": "antwort"` sind Antworten aus „Frage & Antwort“, die der Nutzer selbst als richtig
   markiert hat (`id` = Kennung der Frage, z. B. `dialog:Che cosa prendi?`, `frage`, `antwort`). Prüfen:
   - **Richtig:** in `data/gespraech.js` bei dieser Frage ein passendes, möglichst allgemeines Antwortmuster
     ergänzen (Schreibweise steht oben in der Datei), damit es auf allen Geräten erkannt wird.
   - **Falsch:** in `data/hinweise.js` unter `window.ABGELEHNTE_ANTWORTEN` eintragen
     (`"dialog:…": ["falsche Antwort"]`) – dann zählt sie nicht mehr als richtig – und dem Nutzer den Fehler erklären.
5. `data/wuensche.json` danach wieder auf `[]` setzen.
6. Dem Nutzer kurz sagen, welche Erklärungen und Antwortmuster dazugekommen sind, und seine Fragen auch im Chat beantworten.

## Veröffentlichen

`veroeffentlichen.ps1 -Nachricht "…" -OhnePause` (erhöht die Version in `sw.js`, committet mit der
anonymen GitHub-Adresse, pusht und wartet, bis die Version online ist).

## Lernstand-Abgleich

Die App sichert den Lernstand (mit GitHub-Schlüssel) als `lernstand.json` auf dem Zweig **`lernstand`**
(nicht master, gehört nicht zur Webseite) und gleicht so Handy und PC ab. Diesen Zweig nie löschen oder
zurücksetzen. Neue Felder im Lernstand, die zwischen Geräten wandern sollen, in `SYNC_FELDER` und
`zusammenfuehren()` in app.js aufnehmen.

## Wichtige Regeln

- Verknüpfungen immer über feste Kennungen (IDs), nie über Texte.
- Wörterbuch = nur Wörter (keine Sätze). Kommen neue Phrasen/Lektionssätze dazu, deren Wörter noch fehlen, die
  **Grundform** (Verb im Infinitiv, Hauptwort mit Artikel) in `data/woerterbuch.js` ergänzen; unregelmäßige Verben
  dort auch in `VERBEN_FORMEN_EXTRA`. Hinweise zu diesen Wörtern haben die Kennung `wb:<italienisch>`.
- Neue Datendateien in `index.html` UND in die Liste in `sw.js` eintragen.
- Vor dem Veröffentlichen lokal testen (`lokal-starten.ps1 -OhneBrowser`), auch mit leerem Lernstand.
