// Grammatik-Daten: Verben im Präsens (presente)
window.PERSONEN = ["io", "tu", "lui/lei", "noi", "voi", "loro"];
window.PERSONEN_DE = ["ich", "du", "er/sie", "wir", "ihr", "sie"];

// Unregelmäßige Verben: alle sechs Formen
window.VERBEN_UNREGELMAESSIG = {
  "essere":  { de: "sein",            formen: ["sono", "sei", "è", "siamo", "siete", "sono"] },
  "avere":   { de: "haben",           formen: ["ho", "hai", "ha", "abbiamo", "avete", "hanno"] },
  "andare":  { de: "gehen",           formen: ["vado", "vai", "va", "andiamo", "andate", "vanno"] },
  "fare":    { de: "machen",          formen: ["faccio", "fai", "fa", "facciamo", "fate", "fanno"] },
  "stare":   { de: "sein / bleiben",  formen: ["sto", "stai", "sta", "stiamo", "state", "stanno"] },
  "venire":  { de: "kommen",          formen: ["vengo", "vieni", "viene", "veniamo", "venite", "vengono"] },
  "volere":  { de: "wollen",          formen: ["voglio", "vuoi", "vuole", "vogliamo", "volete", "vogliono"] },
  "potere":  { de: "können",          formen: ["posso", "puoi", "può", "possiamo", "potete", "possono"] },
  "dovere":  { de: "müssen",          formen: ["devo", "devi", "deve", "dobbiamo", "dovete", "devono"] },
  "sapere":  { de: "wissen",          formen: ["so", "sai", "sa", "sappiamo", "sapete", "sanno"] },
  "dire":    { de: "sagen",           formen: ["dico", "dici", "dice", "diciamo", "dite", "dicono"] },
  "dare":    { de: "geben",           formen: ["do", "dai", "dà", "diamo", "date", "danno"] },
  "bere":    { de: "trinken",         formen: ["bevo", "bevi", "beve", "beviamo", "bevete", "bevono"] },
  "uscire":  { de: "hinausgehen",     formen: ["esco", "esci", "esce", "usciamo", "uscite", "escono"] }
};

// Regelmäßige Verben (werden automatisch konjugiert)
// "isc" = Verben auf -ire mit Einschub -isc- (capire → capisco)
window.VERBEN_REGELMAESSIG = [
  { inf: "parlare",   de: "sprechen" },
  { inf: "abitare",   de: "wohnen" },
  { inf: "lavorare",  de: "arbeiten" },
  { inf: "comprare",  de: "kaufen" },
  { inf: "aspettare", de: "warten" },
  { inf: "ascoltare", de: "zuhören" },
  { inf: "guardare",  de: "anschauen" },
  { inf: "arrivare",  de: "ankommen" },
  { inf: "amare",     de: "lieben" },
  { inf: "mangiare",  de: "essen" },
  { inf: "cercare",   de: "suchen" },
  { inf: "pagare",    de: "bezahlen" },
  { inf: "prendere",  de: "nehmen" },
  { inf: "vedere",    de: "sehen" },
  { inf: "leggere",   de: "lesen" },
  { inf: "scrivere",  de: "schreiben" },
  { inf: "chiudere",  de: "schließen" },
  { inf: "vivere",    de: "leben" },
  { inf: "dormire",   de: "schlafen" },
  { inf: "sentire",   de: "hören / fühlen" },
  { inf: "aprire",    de: "öffnen" },
  { inf: "partire",   de: "abreisen" },
  { inf: "capire",    de: "verstehen", isc: true },
  { inf: "finire",    de: "beenden", isc: true },
  { inf: "preferire", de: "bevorzugen", isc: true },
  { inf: "pulire",    de: "putzen", isc: true }
];

// Kurze Erklärungen, die in der App angezeigt werden
window.GRAMMATIK_HILFE = {
  verben: `<p><b>So bildet man das Präsens</b> – man nimmt die Endung <b>-are / -ere / -ire</b> ab und hängt an:</p>
<table class="tab"><tr><th></th><th>-are<br><small>parlare</small></th><th>-ere<br><small>prendere</small></th><th>-ire<br><small>dormire</small></th></tr>
<tr><td>io</td><td>parl<b>o</b></td><td>prend<b>o</b></td><td>dorm<b>o</b></td></tr>
<tr><td>tu</td><td>parl<b>i</b></td><td>prend<b>i</b></td><td>dorm<b>i</b></td></tr>
<tr><td>lui/lei</td><td>parl<b>a</b></td><td>prend<b>e</b></td><td>dorm<b>e</b></td></tr>
<tr><td>noi</td><td>parl<b>iamo</b></td><td>prend<b>iamo</b></td><td>dorm<b>iamo</b></td></tr>
<tr><td>voi</td><td>parl<b>ate</b></td><td>prend<b>ete</b></td><td>dorm<b>ite</b></td></tr>
<tr><td>loro</td><td>parl<b>ano</b></td><td>prend<b>ono</b></td><td>dorm<b>ono</b></td></tr></table>
<p>Manche -ire-Verben schieben <b>-isc-</b> ein: capire → cap<b>isc</b>o, cap<b>isc</b>i, cap<b>isc</b>e, capiamo, capite, cap<b>isc</b>ono.</p>
<p>Das Personalwort (io, tu …) lässt man im Italienischen meist weg: <i>Parlo italiano.</i> = Ich spreche Italienisch.</p>`,
  artikel: `<p><b>Der bestimmte Artikel (der / die / das)</b></p>
<table class="tab"><tr><th></th><th>Einzahl</th><th>Mehrzahl</th></tr>
<tr><td>männlich, normal</td><td><b>il</b> libro</td><td><b>i</b> libri</td></tr>
<tr><td>männlich vor s+Mitlaut, z, gn, ps</td><td><b>lo</b> zio, <b>lo</b> studente</td><td><b>gli</b> zii</td></tr>
<tr><td>männlich vor Selbstlaut</td><td><b>l'</b>amico</td><td><b>gli</b> amici</td></tr>
<tr><td>weiblich</td><td><b>la</b> casa</td><td><b>le</b> case</td></tr>
<tr><td>weiblich vor Selbstlaut</td><td><b>l'</b>amica</td><td><b>le</b> amiche</td></tr></table>
<p>Faustregel: Wörter auf <b>-o</b> sind meist männlich, auf <b>-a</b> meist weiblich. Bei <b>-e</b> muss man es lernen.</p>`,
  satz: `<p><b>Satzbau</b> – wie im Deutschen meist: <b>Wer – tut – was</b>.</p>
<p><i>Marco mangia la pizza.</i> = Marco isst die Pizza.</p>
<p><b>Verneinung:</b> einfach <b>non</b> vor das Verb: <i>Non capisco.</i> = Ich verstehe nicht.</p>
<p><b>Fragen</b> haben oft dieselbe Wortstellung, nur die Stimme geht am Ende hoch: <i>Parli italiano?</i></p>
<p><b>Eigenschaftswörter</b> stehen meist <b>hinter</b> dem Hauptwort: <i>il vino rosso</i> = der Rotwein.</p>`,
  ce: `<p><b>c'è / ci sono</b> = „es gibt“ bzw. „da ist / da sind“</p>
<table class="tab"><tr><th></th><th>Italienisch</th><th>Deutsch</th></tr>
<tr><td>eine Sache (Einzahl)</td><td><b>c'è</b> un bar</td><td>es gibt eine Bar</td></tr>
<tr><td>mehrere (Mehrzahl)</td><td><b>ci sono</b> due bar</td><td>es gibt zwei Bars</td></tr>
<tr><td>verneint</td><td><b>non c'è</b> / <b>non ci sono</b></td><td>es gibt kein … / keine …</td></tr>
<tr><td>Frage</td><td><b>C'è</b> un bagno? <b>Ci sono</b> posti liberi?</td><td>Gibt es …?</td></tr></table>
<p><b>c'è</b> ist die Kurzform von <i>ci è</i> („da ist“) – immer mit Apostroph und Akzent.</p>
<p>Merkhilfe: Schau auf das Wort <b>danach</b>. Eins → <b>c'è</b>, mehrere → <b>ci sono</b>.<br>
<i>C'è una farmacia.</i> – <i>Ci sono due farmacie.</i></p>
<p>Feste Wendungen: <i>Non c'è male.</i> = Nicht schlecht. · <i>Non c'è problema.</i> = Kein Problem. · <i>Che c'è?</i> = Was ist los?</p>`
};

// Übung "c'è / ci sono": ___ wird durch die richtige Form ersetzt
window.CE_CI_SONO = [
  { s: "___ una farmacia qui vicino?", de: "Gibt es hier in der Nähe eine Apotheke?", a: "C'è" },
  { s: "___ due bar in piazza.", de: "Es gibt zwei Bars auf dem Platz.", a: "Ci sono" },
  { s: "Non ___ problema.", de: "Kein Problem.", a: "c'è" },
  { s: "___ molti turisti a Roma.", de: "Es gibt viele Touristen in Rom.", a: "Ci sono" },
  { s: "___ un bagno qui?", de: "Gibt es hier eine Toilette?", a: "C'è" },
  { s: "Nel frigorifero ___ il latte.", de: "Im Kühlschrank ist Milch.", a: "c'è" },
  { s: "Nel frigorifero ___ tre uova.", de: "Im Kühlschrank sind drei Eier.", a: "ci sono" },
  { s: "Oggi ___ il sole.", de: "Heute scheint die Sonne. (wörtl.: Heute ist die Sonne da.)", a: "c'è" },
  { s: "___ posti liberi?", de: "Gibt es freie Plätze?", a: "Ci sono" },
  { s: "Non ___ più biglietti.", de: "Es gibt keine Fahrkarten mehr.", a: "ci sono" },
  { s: "In questa città ___ un museo famoso.", de: "In dieser Stadt gibt es ein berühmtes Museum.", a: "c'è" },
  { s: "In questa via ___ molti negozi.", de: "In dieser Straße gibt es viele Geschäfte.", a: "ci sono" },
  { s: "Scusi, ___ un supermercato qui vicino?", de: "Entschuldigung, gibt es hier in der Nähe einen Supermarkt?", a: "c'è" },
  { s: "Nella mia famiglia ___ quattro persone.", de: "In meiner Familie gibt es vier Personen.", a: "ci sono" },
  { s: "Che ___ da mangiare?", de: "Was gibt es zu essen?", a: "c'è" },
  { s: "Sul tavolo ___ due bicchieri.", de: "Auf dem Tisch stehen zwei Gläser.", a: "ci sono" },
  { s: "Non ___ nessuno a casa.", de: "Es ist niemand zu Hause.", a: "c'è" },
  { s: "Al mercato ___ tante cose buone.", de: "Auf dem Markt gibt es viele gute Sachen.", a: "ci sono" },
  { s: "Quanti giorni ___ in una settimana?", de: "Wie viele Tage hat eine Woche? (wörtl.: … gibt es in einer Woche?)", a: "ci sono" },
  { s: "___ un treno per Milano alle otto?", de: "Gibt es einen Zug nach Mailand um acht?", a: "C'è" },
  { s: "Ci scusi, ___ un tavolo per due?", de: "Entschuldigen Sie, gibt es einen Tisch für zwei?", a: "c'è" },
  { s: "Qui non ___ parcheggi.", de: "Hier gibt es keine Parkplätze.", a: "ci sono" }
];

// Übung "Verben im Satz": die richtige Verbform eintippen.
// inf = Grundform, p = Person (0 io, 1 tu, 2 lui/lei, 3 noi, 4 voi, 5 loro)
window.VERB_SAETZE = [
  { s: "Io ___ tedesco.", inf: "essere", p: 0, de: "Ich bin Deutscher." },
  { s: "Tu ___ molto stanco?", inf: "essere", p: 1, de: "Bist du sehr müde?" },
  { s: "Marco ___ italiano.", inf: "essere", p: 2, de: "Marco ist Italiener." },
  { s: "Noi ___ in vacanza.", inf: "essere", p: 3, de: "Wir sind im Urlaub." },
  { s: "Voi ___ di Roma?", inf: "essere", p: 4, de: "Seid ihr aus Rom?" },
  { s: "Loro ___ a casa.", inf: "essere", p: 5, de: "Sie sind zu Hause." },
  { s: "Io ___ due figli.", inf: "avere", p: 0, de: "Ich habe zwei Kinder." },
  { s: "Tu quanti anni ___?", inf: "avere", p: 1, de: "Wie alt bist du?" },
  { s: "Lei ___ una macchina rossa.", inf: "avere", p: 2, de: "Sie hat ein rotes Auto." },
  { s: "Noi ___ fame.", inf: "avere", p: 3, de: "Wir haben Hunger." },
  { s: "Voi ___ una prenotazione?", inf: "avere", p: 4, de: "Habt ihr eine Reservierung?" },
  { s: "Loro ___ un cane.", inf: "avere", p: 5, de: "Sie haben einen Hund." },
  { s: "Io ___ un po' di italiano.", inf: "parlare", p: 0, de: "Ich spreche ein bisschen Italienisch." },
  { s: "Tu ___ a Monaco?", inf: "abitare", p: 1, de: "Wohnst du in München?" },
  { s: "Lui ___ in un ufficio.", inf: "lavorare", p: 2, de: "Er arbeitet in einem Büro." },
  { s: "Noi ___ la pizza stasera.", inf: "mangiare", p: 3, de: "Wir essen heute Abend Pizza." },
  { s: "Voi ___ la televisione?", inf: "guardare", p: 4, de: "Schaut ihr fern?" },
  { s: "Loro ___ il treno.", inf: "prendere", p: 5, de: "Sie nehmen den Zug." },
  { s: "Io ___ un libro.", inf: "leggere", p: 0, de: "Ich lese ein Buch." },
  { s: "Tu ___ bene?", inf: "dormire", p: 1, de: "Schläfst du gut?" },
  { s: "Lei ___ la porta.", inf: "aprire", p: 2, de: "Sie öffnet die Tür." },
  { s: "Noi non ___ la domanda.", inf: "capire", p: 3, de: "Wir verstehen die Frage nicht." },
  { s: "Loro ___ alle otto.", inf: "finire", p: 5, de: "Sie hören um acht auf." },
  { s: "Io ___ al mare.", inf: "andare", p: 0, de: "Ich fahre ans Meer." },
  { s: "Tu ___ la spesa?", inf: "fare", p: 1, de: "Machst du den Einkauf?" },
  { s: "Come ___ Lei?", inf: "stare", p: 2, de: "Wie geht es Ihnen?" },
  { s: "Noi ___ domani alla festa.", inf: "venire", p: 3, de: "Wir kommen morgen zum Fest." },
  { s: "Io ___ un caffè.", inf: "volere", p: 0, de: "Ich will einen Kaffee." },
  { s: "Tu ___ aprire la finestra?", inf: "potere", p: 1, de: "Kannst du das Fenster öffnen?" },
  { s: "Noi ___ partire presto.", inf: "dovere", p: 3, de: "Wir müssen früh losfahren." },
  { s: "Io non lo ___.", inf: "sapere", p: 0, de: "Ich weiß es nicht." },
  { s: "Loro ___ sempre la verità.", inf: "dire", p: 5, de: "Sie sagen immer die Wahrheit." },
  { s: "Voi ___ stasera?", inf: "uscire", p: 4, de: "Geht ihr heute Abend aus?" },
  { s: "Io ___ un bicchiere d'acqua.", inf: "bere", p: 0, de: "Ich trinke ein Glas Wasser." },
  { s: "Lui ___ in Italia ogni anno.", inf: "andare", p: 2, de: "Er fährt jedes Jahr nach Italien." },
  { s: "Voi che cosa ___ domenica?", inf: "fare", p: 4, de: "Was macht ihr am Sonntag?" }
];

// Lückensätze für die Lektionen: ___ wird durch eine der Möglichkeiten ersetzt.
// optionen = Auswahl für alle Sätze des Sets (o = eigene Auswahl für einen Satz), a = richtige Antwort
window.LUECKEN = {
  piacere: { titel: "mi piace / mi piacciono", optionen: ["mi piace", "mi piacciono"], saetze: [
    { s: "___ la pizza.", a: "Mi piace", de: "Ich mag Pizza." },
    { s: "___ gli spaghetti.", a: "Mi piacciono", de: "Ich mag Spaghetti." },
    { s: "Non ___ il pesce.", a: "mi piace", de: "Ich mag keinen Fisch." },
    { s: "___ i dolci.", a: "Mi piacciono", de: "Ich mag Süßspeisen." },
    { s: "___ l'Italia.", a: "Mi piace", de: "Mir gefällt Italien." },
    { s: "___ le mele.", a: "Mi piacciono", de: "Ich mag Äpfel." },
    { s: "Non ___ i pomodori.", a: "mi piacciono", de: "Ich mag keine Tomaten." },
    { s: "___ molto il caffè.", a: "Mi piace", de: "Ich mag Kaffee sehr." },
    { s: "___ cucinare.", a: "Mi piace", de: "Ich koche gern." },
    { s: "___ i film italiani.", a: "Mi piacciono", de: "Ich mag italienische Filme." },
    { s: "___ la musica italiana.", a: "Mi piace", de: "Ich mag italienische Musik." },
    { s: "Non ___ le patate.", a: "mi piacciono", de: "Ich mag keine Kartoffeln." }
  ]},
  mehrzahl: { titel: "Mehrzahl", saetze: [
    { s: "il ragazzo → ___", o: ["i ragazzi", "le ragazze", "gli ragazzi"], a: "i ragazzi", de: "der Junge → die Jungen" },
    { s: "la casa → ___", o: ["le case", "i casi", "le casa"], a: "le case", de: "das Haus → die Häuser" },
    { s: "il treno → ___", o: ["i treni", "le treni", "gli treni"], a: "i treni", de: "der Zug → die Züge" },
    { s: "la mela → ___", o: ["le mele", "i meli", "le mela"], a: "le mele", de: "der Apfel → die Äpfel" },
    { s: "lo zio → ___", o: ["gli zii", "i zii", "lo zii"], a: "gli zii", de: "der Onkel → die Onkel" },
    { s: "l'amico → ___", o: ["gli amici", "i amici", "le amiche"], a: "gli amici", de: "der Freund → die Freunde" },
    { s: "l'amica → ___", o: ["le amiche", "gli amici", "le amice"], a: "le amiche", de: "die Freundin → die Freundinnen" },
    { s: "il padre → ___", o: ["i padri", "le padre", "i padre"], a: "i padri", de: "der Vater → die Väter" },
    { s: "la chiave → ___", o: ["le chiavi", "le chiave", "i chiavi"], a: "le chiavi", de: "der Schlüssel → die Schlüssel" },
    { s: "il bicchiere → ___", o: ["i bicchieri", "le bicchiere", "gli bicchieri"], a: "i bicchieri", de: "das Glas → die Gläser" },
    { s: "lo studente → ___", o: ["gli studenti", "i studenti", "le studente"], a: "gli studenti", de: "der Student → die Studenten" },
    { s: "la figlia → ___", o: ["le figlie", "le figli", "i figlie"], a: "le figlie", de: "die Tochter → die Töchter" }
  ]},
  possessiv: { titel: "mio / mia / miei / mie", optionen: ["mio", "mia", "miei", "mie"], saetze: [
    { s: "Questo è ___ fratello.", a: "mio", de: "Das ist mein Bruder." },
    { s: "Questa è ___ sorella.", a: "mia", de: "Das ist meine Schwester." },
    { s: "Questi sono i ___ amici.", a: "miei", de: "Das sind meine Freunde." },
    { s: "Queste sono le ___ chiavi.", a: "mie", de: "Das sind meine Schlüssel." },
    { s: "Dov'è la ___ borsa?", a: "mia", de: "Wo ist meine Tasche?" },
    { s: "Il ___ libro è qui.", a: "mio", de: "Mein Buch ist hier." },
    { s: "Ecco i ___ biglietti.", a: "miei", de: "Hier sind meine Fahrkarten." },
    { s: "Le ___ scarpe sono nuove.", a: "mie", de: "Meine Schuhe sind neu." },
    { s: "___ moglie si chiama Anna.", a: "Mia", de: "Meine Frau heißt Anna." },
    { s: "Il ___ cane è piccolo.", a: "mio", de: "Mein Hund ist klein." },
    { s: "La ___ casa è grande.", a: "mia", de: "Mein Haus ist groß." },
    { s: "I ___ genitori abitano a Monaco.", a: "miei", de: "Meine Eltern wohnen in München." }
  ]},
  orte: { titel: "a / in / al / alla", optionen: ["a", "in", "al", "alla"], saetze: [
    { s: "Abito ___ Monaco.", a: "a", de: "Ich wohne in München." },
    { s: "Vado ___ Italia.", a: "in", de: "Ich fahre nach Italien." },
    { s: "Vado ___ mare.", a: "al", de: "Ich fahre ans Meer." },
    { s: "Vado ___ stazione.", a: "alla", de: "Ich gehe zum Bahnhof." },
    { s: "Sono ___ Roma.", a: "a", de: "Ich bin in Rom." },
    { s: "Andiamo ___ Germania.", a: "in", de: "Wir fahren nach Deutschland." },
    { s: "Il museo è vicino ___ chiesa.", a: "alla", de: "Das Museum ist nahe bei der Kirche." },
    { s: "Stasera vado ___ cinema.", a: "al", de: "Heute Abend gehe ich ins Kino." },
    { s: "Lavoro ___ ufficio.", a: "in", de: "Ich arbeite im Büro." },
    { s: "Mangiamo ___ ristorante.", a: "al", de: "Wir essen im Restaurant." },
    { s: "Vado ___ casa.", a: "a", de: "Ich gehe nach Hause." },
    { s: "Andiamo ___ piedi.", a: "a", de: "Wir gehen zu Fuß." }
  ]},
  male: { titel: "mi fa male / mi fanno male", optionen: ["mi fa male", "mi fanno male"], saetze: [
    { s: "___ la testa.", a: "Mi fa male", de: "Mir tut der Kopf weh." },
    { s: "___ i piedi.", a: "Mi fanno male", de: "Mir tun die Füße weh." },
    { s: "___ la schiena.", a: "Mi fa male", de: "Mir tut der Rücken weh." },
    { s: "___ gli occhi.", a: "Mi fanno male", de: "Mir tun die Augen weh." },
    { s: "___ lo stomaco.", a: "Mi fa male", de: "Mir tut der Magen weh." },
    { s: "___ i denti.", a: "Mi fanno male", de: "Mir tun die Zähne weh." },
    { s: "___ il braccio.", a: "Mi fa male", de: "Mir tut der Arm weh." },
    { s: "___ le gambe.", a: "Mi fanno male", de: "Mir tun die Beine weh." },
    { s: "___ la mano.", a: "Mi fa male", de: "Mir tut die Hand weh." },
    { s: "___ le orecchie.", a: "Mi fanno male", de: "Mir tun die Ohren weh." }
  ]}
};
