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
