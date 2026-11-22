# Italienisch lernen – Anleitung

**Adresse der App:** https://stefanreinhart.github.io/italienisch/
(Projekt auf GitHub: https://github.com/StefanReinhart/italienisch – öffentlich, Konto StefanReinhart)

Diese App ist eine **Web-App**: eine Internetseite, die sich wie eine richtige App aufs Handy legen lässt,
mit eigenem Symbol auf dem Startbildschirm, im Vollbild und auch ohne Internet.
Man kann sie sich wie ein Buch vorstellen, das einmal ins Handy kopiert wird und danach immer dabei ist.

## Was die App kann

- **Karteikarten**: rund 450 Grundwörter in 20 Themen und rund 85 Alltagssätze. Die App merkt sich, was du schon kannst,
  und zeigt Wörter in immer größeren Abständen wieder (1 Tag, 2 Tage, 4 Tage …), wie ein Karteikasten mit Fächern.
- **Grammatik**: Verben konjugieren (essere, avere, regelmäßige und unregelmäßige Verben), Artikel üben, Sätze bauen,
  dazu kurze Erklärungen und Verbtabellen zum Anhören.
- **Hören**: Die App spricht ein Wort oder einen Satz, du wählst die Bedeutung. 🐢 spielt es langsam ab.
- **Sprechen**: Du sprichst nach, die App schreibt auf, was sie verstanden hat, und markiert Wörter
  grün (richtig), orange (fast), rot (falsch) oder durchgestrichen (fehlt). Danach spielt sie die richtige Aussprache vor.
- **Wörterbuch** zum Suchen und **Phrasen** zum Anhören.

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

## 4. Änderungen und Updates

Wenn an der App etwas geändert wird:
1. In der Datei `sw.js` oben die Versionsnummer erhöhen (z. B. `italienisch-v1` → `italienisch-v2`).
   Sonst hält das Handy an der alten, gespeicherten Fassung fest.
2. Hochladen (`git push`).
3. Auf dem Handy die App öffnen, ganz schließen und wieder öffnen – dann ist die neue Version da.

**Eigene Wörter ergänzen:** In `data/wortschatz.js` oder `data/phrasen.js` einfach eine neue Zeile im Format
`italienisch | deutsch` in das passende Thema schreiben.

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
