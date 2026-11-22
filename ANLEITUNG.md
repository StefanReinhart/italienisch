# Italienisch lernen – Anleitung

**Adresse der App:** https://stefanreinhart.github.io/italienisch/
(Projekt auf GitHub: https://github.com/StefanReinhart/italienisch – öffentlich, Konto StefanReinhart)

Diese App ist eine **Web-App**: eine Internetseite, die sich wie eine richtige App aufs Handy legen lässt,
mit eigenem Symbol auf dem Startbildschirm, im Vollbild und auch ohne Internet.
Man kann sie sich wie ein Buch vorstellen, das einmal ins Handy kopiert wird und danach immer dabei ist.

## Was die App kann

- **▶ Heute üben** (oben auf der Startseite): eine gemischte Runde von etwa 15 Minuten – fällige Karteikarten,
  Fehler, Grammatik, ein Hör-Dialog und Frage & Antwort. Am besten täglich; danach ist man „für heute fertig“.
- **🎧 Hör-Dialoge**: 8 kurze Alltagsgespräche (Bar, Bahnhof, Hotel, Restaurant, Markt, Weg, Kennenlernen, Apotheke).
  Erst nur hören, dann Zeile für Zeile oder ganz aufdecken (mit Übersetzung), zum Schluss drei Verständnisfragen.
- **🎯 Fehler wiederholen**: nur das, was oft falsch war oder als „nicht gewusst“ markiert wurde.
- **🤖 Mit Claude üben**: fertige Anweisungen für die Claude-App (über das eigene Claude-Abo, ohne Zusatzkosten) –
  Rollenspiele in 9 Alltagssituationen, freies Gespräch, Sätze korrigieren lassen, Grammatikfragen, eine Geschichte mit
  den eigenen Fehler-Wörtern und Übersetzungs-Training. Antippen kopiert die Anweisung und öffnet Claude; dort einfügen
  und senden. Im Sprachmodus der Claude-App kann man sich auch mündlich unterhalten.
- **Grammatik → Verben im Satz**: die Verbform selbst eintippen, z. B. *Noi ___ (andare) al mare.*
- **Karteikarten**: rund 450 Grundwörter in 20 Themen und rund 85 Alltagssätze. Die App merkt sich, was du schon kannst,
  und zeigt Wörter in immer größeren Abständen wieder (1 Tag, 2 Tage, 4 Tage …), wie ein Karteikasten mit Fächern.
- **Grammatik**: Verben konjugieren (essere, avere, regelmäßige und unregelmäßige Verben), Artikel üben, Sätze bauen,
  dazu kurze Erklärungen und Verbtabellen zum Anhören.
- **Hören**: Die App spricht ein Wort oder einen Satz, du wählst die Bedeutung. 🐢 spielt es langsam ab.
- **Sprechen**: Du sprichst nach, die App schreibt auf, was sie verstanden hat, und markiert Wörter
  grün (richtig), orange (fast), rot (falsch) oder durchgestrichen (fehlt). Danach spielt sie die richtige Aussprache vor.
- **Wörterbuch** zum Suchen und **Phrasen** zum Anhören.

### So lernt die App (seit Version 2)

- **Zwei Karten je Wort:** „verstehen“ (Italienisch → Deutsch) und „selbst sagen“ (Deutsch → Italienisch), getrennt geplant.
  Bei „Beide“ kommt ein neues Wort zuerst als Italienisch → Deutsch, andersherum erst, wenn du es einmal gekonnt hast.
- **Abstände nach dem SM-2-Prinzip** (wie bei Anki): Jede Karte merkt sich, wie leicht sie dir fällt. Daraus wird der
  nächste Abstand berechnet (z. B. 1 → 2 → 5 → 12 Tage …). Wer eine Karte vergisst, fängt bei ihr wieder klein an.
- **Eintippen bei Deutsch → Italienisch:** Die App prüft die Antwort tolerant (Akzente, fehlender Artikel, kleine Tippfehler)
  und schlägt eine Bewertung vor. Abschaltbar in den Einstellungen.
- **Alles hängt zusammen:** Fehler beim Hören machen ein Wort sofort wieder fällig. Beim Sprechen „aus dem Gedächtnis“
  zählt das Ergebnis für „selbst sagen“. Hören und Sprechen nehmen bevorzugt Wörter, die fällig sind oder dir schwerfallen.
- **Grammatik merkt sich Fehler:** Verbformen, Artikel und Sätze, die du falsch hattest, kommen bald wieder; was sitzt, seltener.
- **Phrasen verdecken:** In den Phrasen lässt sich das Italienische ausblenden und per Antippen aufdecken.
- Ein Lernstand aus Version 1 wird automatisch übernommen.

### Neu in Version 3

- **Frage & Antwort:** Die App stellt rund 55 Alltagsfragen auf Italienisch (über dich, Vorlieben, Alltag, unterwegs,
  Wissen). Du antwortest gesprochen oder getippt. Die App prüft gegen typische Antwortmuster
  (z. B. „Mi chiamo …“ mit beliebigem Namen) und zeigt eine Beispielantwort. Erkennt sie eine richtige Antwort nicht,
  tippst du auf „Meine Antwort war richtig“. Falsch beantwortete Fragen kommen bald wieder.
  Neue Fragen ergänzt man in `data/gespraech.js` (Schreibweise steht oben in der Datei).
- **Sprechen – drei Arten:** „Lesen + hören“ (alles sichtbar), „Nur hören“ (nur Deutsch sichtbar, der italienische
  Satz wird vorgelesen, Text per Knopf), „Gedächtnis“ (ohne Hilfe, zählt für den Lernstand).

**Ehrlich gesagt:** Die Spracherkennung ist **keine echte Aussprache-Bewertung**. Sie prüft nur, ob das Handy
die Wörter verstanden hat. Das ist trotzdem ein guter Hinweis: Was das Handy versteht, verstehen meist auch Menschen.
Auf Android braucht die Spracherkennung **meistens Internet**. Alles andere (Karteikarten, Grammatik, Hören, Vorlesen) geht auch offline.

Dein Lernstand wird **nur auf dem Handy** gespeichert. Unter *Einstellungen → Sichern* kannst du ihn als Datei
herunterladen (z. B. nach Google Drive) und später wieder einlesen.

---

## 1. Am PC ausprobieren

Im Ordner auf **`lokal-starten.ps1`** rechtsklicken → **„Mit PowerShell ausführen“**.
Der Browser öffnet `http://localhost:8765` mit der App. Zum Beenden das schwarze Fenster schließen.

(Tipp: In Chrome mit F12 und dem Handy-Symbol oben links sieht man die App in Handygröße.)

## 2. Kostenlos ins Internet stellen (GitHub Pages)

Damit das Handy die App laden kann, muss sie einmal im Internet liegen. GitHub Pages ist dafür kostenlos.
Vergleich: GitHub ist wie ein Schaufenster, in das du deinen Ordner stellst – jeder mit der Adresse kann hineinschauen,
aber niemand außer dir kann etwas ändern.

1. Auf **github.com** ein kostenloses Konto anlegen (falls noch nicht vorhanden).
2. Oben rechts **„+“ → „New repository“**. Name z. B. `italienisch`. **Public** wählen
   (bei kostenlosen Konten geht GitHub Pages nur mit öffentlichen Projekten). Nichts weiter ankreuzen → **Create repository**.
3. Den Ordner hochladen. Am einfachsten mit Git (es ist auf dem PC schon eingerichtet), in PowerShell im App-Ordner:
   ```
   git remote add origin https://github.com/DEIN-NAME/italienisch.git
   git push -u origin master
   ```
   Alternative ohne Befehle: Auf der GitHub-Seite des Projekts **„uploading an existing file“** anklicken und alle Dateien
   und Ordner aus `Italienisch-App` hineinziehen.
4. Im Projekt auf GitHub: **Settings → Pages**. Bei *Source* „Deploy from a branch“, Branch **master**, Ordner **/ (root)** → **Save**.
5. Nach 1–2 Minuten steht oben die Adresse, z. B. `https://DEIN-NAME.github.io/italienisch/`.

Hinweis: Weil das Projekt öffentlich ist, kann jeder mit der Adresse die App sehen. Persönliches steht darin nicht –
dein Lernstand bleibt immer nur auf deinem Handy.

## 3. Aufs Handy installieren

1. Auf dem Android-Handy **Chrome** öffnen und die Adresse von oben eingeben.
2. Oben rechts **⋮ (drei Punkte) → „App installieren“** (oder „Zum Startbildschirm hinzufügen“).
3. Fertig: Das grüne **„Ciao!“-Symbol** liegt auf dem Startbildschirm. Die App öffnet im Vollbild.
4. Einmal mit Internet öffnen und kurz durchklicken – danach geht sie auch offline.

**Italienische Stimme fürs Vorlesen:** Falls die App nicht oder mit deutscher Aussprache vorliest:
Handy-*Einstellungen* → nach **„Sprachausgabe“** (Text-in-Sprache) suchen → *Google-Sprachausgabe* →
Zahnrad → *Sprachdaten installieren* → **Italienisch** herunterladen. Dann geht das Vorlesen auch ohne Internet.

**Mikrofon:** Beim ersten Tippen auf 🎤 fragt Chrome nach dem Mikrofon → **Zulassen**.

## 4. Inhalte bearbeiten und veröffentlichen

### Am einfachsten: in der App (am PC)

In der App **Einstellungen → „Wörter, Phrasen und Fragen bearbeiten“** antippen
(oder direkt https://stefanreinhart.github.io/italienisch/bearbeiten.html öffnen, am besten in Chrome oder Edge).

- Links wählst du den Bereich (Wortschatz, Phrasen, Satzbau, Frage & Antwort) und das Thema, rechts steht die Liste:
  **links Deutsch, rechts Italienisch**. Einfach hineinklicken und tippen.
- Jede Änderung wird **sofort automatisch gespeichert** (als Entwurf in diesem Browser).
- **🚀 Veröffentlichen** schickt alles zu GitHub, erhöht die Versionsnummer und wartet, bis es online ist.
- Die Seite lädt beim Öffnen immer den aktuellen Stand von GitHub – egal an welchem PC.
- Jeder Eintrag hat eine feste Kennung: Korrekturen am italienischen Text setzen den Lernstand **nicht** zurück.

**Einmalig einrichten:** Beim ersten Öffnen fragt die Seite nach einem GitHub-Zugangsschlüssel und erklärt Schritt für
Schritt, wie man ihn anlegt (nur für das Projekt „italienisch“, Recht „Contents: Read and write“). Der Schlüssel bleibt
nur im Browser des jeweiligen PCs gespeichert.

Nicht in der App bearbeitbar sind die Verben und Grammatik-Erklärungen (`data/grammatik.js`) – die ändert man von Hand.

### Von Hand (für Fortgeschrittene)

**Bearbeiten** (am PC, z. B. mit dem Editor oder Visual Studio Code):

| Was | Datei |
|---|---|
| Vokabeln | `data/wortschatz.js` |
| Phrasen und Satzbau-Sätze | `data/phrasen.js` |
| Verben, Grammatik-Erklärungen | `data/grammatik.js` |
| Frage & Antwort | `data/gespraech.js` |

Jede Zeile: `italienisch | deutsch | kennung`. Die Kennung (dritte Spalte) nicht ändern – sie verbindet den Eintrag mit dem Lernstand. Fehlt sie (bei neu von Hand eingetippten Zeilen), setzt eine spätere Korrektur am italienischen
Text den Lernstand zurück – in der App vergibt die Bearbeiten-Seite die Kennung automatisch. Den deutschen Text kann man frei ändern.

**Testen** (optional): Rechtsklick auf `lokal-starten.ps1` → „Mit PowerShell ausführen“.

**Veröffentlichen:** Doppelklick auf **`Veröffentlichen.cmd`**. Das Skript
1. holt zuerst den Stand vom anderen PC (falls dort etwas geändert wurde),
2. prüft die Datendateien auf typische Tippfehler (fehlender Backtick, Klammern),
3. erhöht die Versionsnummer, damit das Handy die neue Fassung lädt,
4. fragt kurz, was du geändert hast, speichert und lädt alles zu GitHub hoch,
5. wartet, bis die neue Version online ist.

Danach auf dem Handy die App öffnen, ganz schließen und wieder öffnen.

**Am zweiten PC** einmalig in PowerShell im Ordner `Documents`:
`git clone https://github.com/StefanReinhart/italienisch.git Italienisch-App` – danach funktioniert dort alles genauso.

## Dateien im Ordner

| Datei | Wozu |
|---|---|
| `index.html` | Die Seite selbst |
| `app.js` | Alle Abläufe der App |
| `styles.css` | Aussehen |
| `data/wortschatz.js` | Grundwortschatz nach Themen |
| `data/phrasen.js` | Alltagsphrasen und Sätze für den Satzbau |
| `data/grammatik.js` | Verben und Grammatik-Erklärungen |
| `manifest.webmanifest` | Name und Symbol fürs Handy |
| `sw.js` | Sorgt dafür, dass die App offline läuft |
| `icons/` | App-Symbole |
| `lokal-starten.ps1` | Startet die App zum Testen am PC |
