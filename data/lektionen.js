// Lernpfad: 12 aufbauende Lektionen (Niveau A1).
// themen   = Wortschatz-/Phrasen-Gruppen (IDs aus wortschatz.js / phrasen.js) für die Karteikarten der Lektion
// grammatik = Übungen: { verben: [...] }  { artikel: true }  { ce: true }  { zahlen: true }  { luecke: "<Satz-Set aus grammatik.js>" }
// dialog   = ID aus dialoge.js     fragen = Fragen aus gespraech.js (genauer Text)     szene = Claude-Rollenspiel (ID aus app.js)
window.LEKTIONEN = [
{ id: "l1", titel: "Begrüßen & Vorstellen", icon: "👋", ziel: "Du kannst grüßen, dich vorstellen und sagen, woher du kommst.",
  themen: ["grundwoerter", "p_begruessung"], grammatik: [{ verben: ["essere"] }], dialog: "conoscersi", szene: "kennenlernen",
  fragen: ["Come ti chiami?", "Come stai?", "Di dove sei?", "Dove abiti?", "Parli italiano?"],
  erklaerung: `<p><b>Grüßen:</b> <i>Ciao</i> (hallo/tschüss, unter Bekannten) · <i>Buongiorno</i> (guten Tag) · <i>Buonasera</i> (ab Nachmittag) · <i>Arrivederci</i> (auf Wiedersehen).</p>
<p><b>Sich vorstellen:</b> <i>Mi chiamo Marco.</i> = Ich heiße Marco. · <i>Sono di Monaco.</i> = Ich bin aus München.</p>
<p><b>essere = sein</b> – das wichtigste Verb überhaupt, unregelmäßig:</p>
<table class="tab"><tr><td>io</td><td><b>sono</b></td><td>ich bin</td></tr><tr><td>tu</td><td><b>sei</b></td><td>du bist</td></tr>
<tr><td>lui / lei / Lei</td><td><b>è</b></td><td>er/sie ist, Sie sind</td></tr><tr><td>noi</td><td><b>siamo</b></td><td>wir sind</td></tr>
<tr><td>voi</td><td><b>siete</b></td><td>ihr seid</td></tr><tr><td>loro</td><td><b>sono</b></td><td>sie sind</td></tr></table>
<p><b>Du oder Sie?</b> Mit Freunden <i>tu</i>: <i>Come stai?</i> – Mit Fremden höflich <i>Lei</i>: <i>Come sta?</i> Die höfliche Form benutzt die Verbform von „er/sie“.</p>
<p>Das Wort für „ich, du …“ lässt man meist weg: <i>Sono tedesco.</i> statt <i>Io sono tedesco.</i></p>` },

{ id: "l2", titel: "Zahlen & Alter", icon: "🔢", ziel: "Du kannst bis 100 zählen und sagen, wie alt du bist.",
  themen: ["zahlen", "fragen"], grammatik: [{ zahlen: true }, { verben: ["avere"] }], dialog: "eta", szene: "kennenlernen",
  fragen: ["Quanti anni hai?", "Hai figli?", "Quanto fa due più tre?", "Quanti giorni ha una settimana?", "Che giorno è oggi?"],
  erklaerung: `<p><b>Das Alter sagt man mit „haben“:</b> <i>Ho 54 anni.</i> = Ich bin 54 (wörtlich: ich <b>habe</b> 54 Jahre). <i>Quanti anni hai?</i> = Wie alt bist du?</p>
<p><b>avere = haben</b> (das h wird nie gesprochen):</p>
<table class="tab"><tr><td>io</td><td><b>ho</b></td></tr><tr><td>tu</td><td><b>hai</b></td></tr><tr><td>lui / lei</td><td><b>ha</b></td></tr>
<tr><td>noi</td><td><b>abbiamo</b></td></tr><tr><td>voi</td><td><b>avete</b></td></tr><tr><td>loro</td><td><b>hanno</b></td></tr></table>
<p><b>Zahlen ab 20</b> baut man einfach zusammen: <i>venti + tre = ventitré</i>, <i>cinquanta + quattro = cinquantaquattro</i>.<br>
Vor <i>uno</i> und <i>otto</i> fällt der letzte Buchstabe weg: <i>ventuno, ventotto, trentuno</i>.</p>` },

{ id: "l3", titel: "Im Café", icon: "☕", ziel: "Du kannst in der Bar etwas bestellen und bezahlen.",
  themen: ["trinken", "p_verstaendigung"], grammatik: [{ artikel: true }], dialog: "bar", szene: "bar",
  fragen: ["Che cosa bevi la mattina?", "Che cosa prendi?", "Vuoi un caffè?", "Vuole qualcosa da bere?"],
  erklaerung: `<p><b>Höflich bestellen:</b> <i>Vorrei un caffè, per favore.</i> = Ich hätte gern einen Kaffee, bitte. <i>Vorrei</i> ist höflicher als <i>voglio</i> (ich will).</p>
<p><b>„Ein/eine“:</b> männlich <i>un</i> caffè, weiblich <i>una</i> birra, vor Selbstlaut weiblich <i>un'</i>acqua.</p>
<p><b>„Der/die/das“ in der Einzahl:</b></p>
<table class="tab"><tr><td>männlich</td><td><b>il</b> caffè, <b>il</b> tè</td></tr><tr><td>männlich vor Selbstlaut</td><td><b>l'</b>aperitivo</td></tr>
<tr><td>männlich vor z / s+Mitlaut</td><td><b>lo</b> zucchero, <b>lo</b> spumante</td></tr><tr><td>weiblich</td><td><b>la</b> birra</td></tr>
<tr><td>weiblich vor Selbstlaut</td><td><b>l'</b>acqua</td></tr></table>
<p>Faustregel: Wörter auf <b>-o</b> sind meist männlich, auf <b>-a</b> meist weiblich. In der Bar bezahlt man oft zuerst an der Kasse und trinkt dann <i>al banco</i> (an der Theke).</p>` },

{ id: "l4", titel: "Familie", icon: "👪", ziel: "Du kannst über deine Familie sprechen.",
  themen: ["personen"], grammatik: [{ luecke: "mehrzahl" }, { luecke: "possessiv" }], dialog: "famiglia", szene: "nachbar",
  fragen: ["Sei sposato?", "Hai figli?", "Hai fratelli o sorelle?", "Quante persone ci sono nella tua famiglia?"],
  erklaerung: `<p><b>Mehrzahl:</b> Die Endung ändert sich, und der Artikel auch:</p>
<table class="tab"><tr><th>Einzahl</th><th>Mehrzahl</th></tr><tr><td>il figli<b>o</b></td><td><b>i</b> figl<b>i</b></td></tr>
<tr><td>la figli<b>a</b></td><td><b>le</b> figli<b>e</b></td></tr><tr><td>il padr<b>e</b> / la madr<b>e</b></td><td><b>i</b> padr<b>i</b> / <b>le</b> madr<b>i</b></td></tr>
<tr><td><b>lo</b> zio · <b>l'</b>amico</td><td><b>gli</b> zii · <b>gli</b> amici</td></tr></table>
<p><b>mein/meine:</b> passt sich dem Wort an, nicht dem Besitzer:</p>
<table class="tab"><tr><td>männlich Einzahl</td><td><b>mio</b> padre, il <b>mio</b> libro</td></tr><tr><td>weiblich Einzahl</td><td><b>mia</b> madre, la <b>mia</b> casa</td></tr>
<tr><td>männlich Mehrzahl</td><td>i <b>miei</b> figli</td></tr><tr><td>weiblich Mehrzahl</td><td>le <b>mie</b> sorelle</td></tr></table>
<p>Besonderheit: Bei <b>einem</b> Familienmitglied fällt der Artikel weg: <i>mia moglie, mio fratello</i> – aber <i>i miei genitori</i>.</p>` },

{ id: "l5", titel: "Essen & Restaurant", icon: "🍝", ziel: "Du kannst im Restaurant bestellen und sagen, was dir schmeckt.",
  themen: ["essen", "restaurant", "p_restaurant"], grammatik: [{ luecke: "piacere" }, { artikel: true }], dialog: "ristorante", szene: "ristorante",
  fragen: ["Ti piace la pizza?", "Che cosa ti piace mangiare?", "Buongiorno, che cosa desidera?", "Ti piace cucinare?"],
  erklaerung: `<p><b>„Mögen“ heißt auf Italienisch „gefallen“:</b> <i>Mi piace la pizza.</i> = Mir gefällt die Pizza = Ich mag Pizza.</p>
<table class="tab"><tr><td>eine Sache</td><td><b>Mi piace</b> la pasta.</td></tr><tr><td>mehrere Sachen</td><td><b>Mi piacciono</b> gli spaghetti.</td></tr>
<tr><td>etwas tun</td><td><b>Mi piace</b> cucinare.</td></tr><tr><td>verneint</td><td><b>Non mi piace</b> il pesce.</td></tr></table>
<p>Merkhilfe: Schau auf das, was gefällt. Eins → <i>piace</i>, mehrere → <i>piacciono</i>.</p>
<p><b>Artikel in der Mehrzahl:</b> il → <b>i</b>, lo/l' (männlich) → <b>gli</b>, la/l' (weiblich) → <b>le</b>.</p>
<p><b>Im Restaurant:</b> <i>Il menù, per favore.</i> · <i>Che cosa mi consiglia?</i> · <i>Il conto, per favore.</i></p>` },

{ id: "l6", titel: "Einkaufen", icon: "🛒", ziel: "Du kannst nach Preisen fragen, Mengen nennen und sagen, was es gibt.",
  themen: ["einkaufen", "kleidung", "farben", "p_einkaufen"], grammatik: [{ ce: true }], dialog: "mercato", szene: "markt",
  fragen: ["Quanto costa? (Du bist der Verkäufer)", "Posso aiutarla?", "C'è un supermercato vicino a casa tua?", "Che cosa c'è nel tuo frigorifero?"],
  erklaerung: `<p><b>Was kostet …?</b> Eine Sache: <i>Quanto <b>costa</b>?</i> · Mehrere: <i>Quanto <b>costano</b>?</i></p>
<p><b>Mengen:</b> <i>un chilo di mele</i> (ein Kilo Äpfel) · <i>mezzo chilo</i> (ein halbes Kilo) · <i>un litro di latte</i> · <i>un pezzo di formaggio</i>.</p>
<p><b>„Es gibt“:</b> eine Sache → <b>c'è</b>, mehrere → <b>ci sono</b>.<br><i>C'è un mercato?</i> · <i>Ci sono pomodori?</i> · <i>Non c'è problema.</i></p>
<p><b>Farben</b> passen sich an wie andere Eigenschaftswörter: <i>la giacca ross<b>a</b>, il cappello ross<b>o</b></i>. Sie stehen <b>hinter</b> dem Hauptwort.</p>` },

{ id: "l7", titel: "In der Stadt", icon: "🧭", ziel: "Du kannst nach dem Weg fragen und Wegbeschreibungen verstehen.",
  themen: ["stadt", "weg", "p_weg", "p_esgibt"], grammatik: [{ luecke: "orte" }, { ce: true }], dialog: "strada", szene: "weg",
  fragen: ["Scusi, dov'è la stazione?", "Che cosa c'è da vedere nella tua città?", "Ci sono molti turisti nella tua città?", "Dove vai adesso?"],
  erklaerung: `<p><b>Nach dem Weg fragen:</b> <i>Scusi, dov'è la stazione?</i> · <i>C'è una farmacia qui vicino?</i> · <i>È lontano?</i></p>
<p><b>Wohin / wo:</b></p>
<table class="tab"><tr><td>Stadt</td><td><b>a</b> Roma, <b>a</b> Monaco</td></tr><tr><td>Land</td><td><b>in</b> Italia, <b>in</b> Germania</td></tr>
<tr><td>zum/zur … (a + Artikel)</td><td><b>al</b> mare (a+il), <b>alla</b> stazione (a+la)</td></tr><tr><td>manche Orte ohne Artikel</td><td><b>in</b> banca, <b>in</b> centro, <b>a</b> casa, <b>a</b> piedi</td></tr></table>
<p><b>Wegbeschreibungen</b> (als feste Wendungen lernen): <i>vada dritto</i> (gehen Sie geradeaus) · <i>giri a destra / a sinistra</i> (biegen Sie rechts/links ab) · <i>vicino a</i> (nahe bei) · <i>accanto a</i> (neben).</p>` },

{ id: "l8", titel: "Tagesablauf & Uhrzeit", icon: "🕐", ziel: "Du kannst die Uhrzeit sagen und deinen Tag beschreiben.",
  themen: ["zeit", "verben", "p_alltag"], grammatik: [{ verben: ["parlare", "abitare", "lavorare", "mangiare", "guardare", "arrivare", "aspettare", "comprare", "ascoltare"] }],
  dialog: "giornata", szene: "nachbar",
  fragen: ["Che ore sono?", "Che giorno è oggi?", "A che ora ti alzi?", "Che cosa fai domani?", "Come vai al lavoro?"],
  erklaerung: `<p><b>Regelmäßige Verben auf -are</b> – die größte Gruppe. Endung <i>-are</i> weg, dann:</p>
<table class="tab"><tr><td>io</td><td>parl<b>o</b></td></tr><tr><td>tu</td><td>parl<b>i</b></td></tr><tr><td>lui / lei</td><td>parl<b>a</b></td></tr>
<tr><td>noi</td><td>parl<b>iamo</b></td></tr><tr><td>voi</td><td>parl<b>ate</b></td></tr><tr><td>loro</td><td>parl<b>ano</b></td></tr></table>
<p>Kleine Besonderheiten: <i>mangiare → tu mangi, noi mangiamo</i> (kein doppeltes i) · <i>cercare → tu cerchi</i> (h, damit es hart bleibt).</p>
<p><b>Uhrzeit:</b> <i>Che ore sono?</i> → <i>Sono le tre.</i> (Es ist drei Uhr) · Ausnahme: <i>È l'una.</i> (Es ist eins) · <i>e mezza</i> (halb) · <i>e un quarto</i> (Viertel nach).<br>
<b>Um</b> … Uhr: <i>alle otto</i>, <i>all'una</i>.</p>` },

{ id: "l9", titel: "Unterwegs", icon: "🚆", ziel: "Du kannst Fahrkarten kaufen und sagen, wohin du fährst.",
  themen: ["verkehr"], grammatik: [{ verben: ["andare", "venire"] }, { luecke: "orte" }], dialog: "stazione", szene: "bahnhof",
  fragen: ["Come vai al lavoro?", "Dove vai in vacanza?", "Sei mai stato in Italia?", "Dove vai adesso?"],
  erklaerung: `<p><b>andare = gehen/fahren</b> und <b>venire = kommen</b> sind unregelmäßig:</p>
<table class="tab"><tr><th></th><th>andare</th><th>venire</th></tr><tr><td>io</td><td><b>vado</b></td><td><b>vengo</b></td></tr>
<tr><td>tu</td><td><b>vai</b></td><td><b>vieni</b></td></tr><tr><td>lui / lei</td><td><b>va</b></td><td><b>viene</b></td></tr>
<tr><td>noi</td><td>andiamo</td><td>veniamo</td></tr><tr><td>voi</td><td>andate</td><td>venite</td></tr><tr><td>loro</td><td><b>vanno</b></td><td><b>vengono</b></td></tr></table>
<p><b>Womit?</b> <i>in</i> treno, <i>in</i> macchina, <i>in</i> autobus, <i>in</i> bicicletta – aber <i>a</i> piedi (zu Fuß).</p>
<p><b>Am Schalter:</b> <i>Un biglietto per Firenze.</i> · <i>Solo andata o andata e ritorno?</i> · <i>Da quale binario?</i></p>` },

{ id: "l10", titel: "Im Hotel", icon: "🏨", ziel: "Du kannst einchecken, Wünsche äußern und höflich um etwas bitten.",
  themen: ["haus", "p_reisen"], grammatik: [{ verben: ["volere", "potere", "dovere"] }], dialog: "albergo", szene: "hotel",
  fragen: ["Avete una prenotazione?", "Vuoi un caffè?", "Posso aiutarla?"],
  erklaerung: `<p><b>wollen, können, müssen</b> + Grundform – wie im Deutschen:</p>
<table class="tab"><tr><th></th><th>volere</th><th>potere</th><th>dovere</th></tr><tr><td>io</td><td>voglio</td><td>posso</td><td>devo</td></tr>
<tr><td>tu</td><td>vuoi</td><td>puoi</td><td>devi</td></tr><tr><td>lui / lei</td><td>vuole</td><td>può</td><td>deve</td></tr>
<tr><td>noi</td><td>vogliamo</td><td>possiamo</td><td>dobbiamo</td></tr><tr><td>voi</td><td>volete</td><td>potete</td><td>dovete</td></tr>
<tr><td>loro</td><td>vogliono</td><td>possono</td><td>devono</td></tr></table>
<p><i>Posso pagare con la carta?</i> = Kann ich mit Karte zahlen? · <i>Devo partire alle otto.</i> = Ich muss um acht abfahren.</p>
<p><b>Höflich:</b> Statt <i>voglio</i> lieber <i>vorrei</i> (ich hätte gern): <i>Vorrei una camera doppia.</i></p>` },

{ id: "l11", titel: "Freizeit & Wetter", icon: "⚽", ziel: "Du kannst über Hobbys, Pläne und das Wetter sprechen.",
  themen: ["freizeit", "wetter"], grammatik: [{ verben: ["fare", "prendere", "leggere", "scrivere", "vedere", "dormire", "sentire", "aprire", "partire", "capire", "finire"] }],
  dialog: "weekend", szene: "nachbar",
  fragen: ["Che cosa fai nel tempo libero?", "Ti piace la musica italiana?", "Che tempo fa oggi?", "Hai un animale?", "Che cosa fai domani?"],
  erklaerung: `<p><b>Verben auf -ere und -ire:</b> fast wie -are, nur <i>lui/lei</i> endet auf <b>-e</b>:</p>
<table class="tab"><tr><th></th><th>prendere</th><th>dormire</th></tr><tr><td>io</td><td>prend<b>o</b></td><td>dorm<b>o</b></td></tr>
<tr><td>tu</td><td>prend<b>i</b></td><td>dorm<b>i</b></td></tr><tr><td>lui / lei</td><td>prend<b>e</b></td><td>dorm<b>e</b></td></tr>
<tr><td>noi</td><td>prend<b>iamo</b></td><td>dorm<b>iamo</b></td></tr><tr><td>voi</td><td>prend<b>ete</b></td><td>dorm<b>ite</b></td></tr>
<tr><td>loro</td><td>prend<b>ono</b></td><td>dorm<b>ono</b></td></tr></table>
<p>Einige -ire-Verben schieben <b>-isc-</b> ein: <i>capisco, finisci, preferisce</i> (aber <i>capiamo, capite</i>).</p>
<p><b>fare = machen</b> braucht man fürs Wetter: <i>fa caldo</i> (es ist heiß) · <i>fa freddo</i> · <i>fa bel tempo</i>. Und: <i>fare la spesa</i> (einkaufen), <i>fare una passeggiata</i> (spazieren gehen).</p>` },

{ id: "l12", titel: "Gesundheit", icon: "🩺", ziel: "Du kannst sagen, wie es dir geht und was dir wehtut.",
  themen: ["koerper"], grammatik: [{ verben: ["stare"] }, { luecke: "male" }], dialog: "farmacia", szene: "arzt",
  fragen: ["Come stai?", "Sei stanco?", "Hai fame?", "Hai sete?"],
  erklaerung: `<p><b>stare</b> benutzt man fürs Befinden: <i>Come stai? – Sto bene / Sto male.</i></p>
<table class="tab"><tr><td>io</td><td><b>sto</b></td></tr><tr><td>tu</td><td><b>stai</b></td></tr><tr><td>lui / lei</td><td><b>sta</b></td></tr>
<tr><td>noi</td><td>stiamo</td></tr><tr><td>voi</td><td>state</td></tr><tr><td>loro</td><td><b>stanno</b></td></tr></table>
<p><b>Was tut weh?</b> Wie bei <i>mi piace</i>: eins → <b>mi fa male</b> la testa · mehrere → <b>mi fanno male</b> i piedi.<br>
Oder kurz: <i>Ho mal di testa.</i> (Ich habe Kopfweh) · <i>Ho la febbre.</i> (Ich habe Fieber)</p>
<p><b>Hunger, Durst, müde:</b> <i>Ho fame. Ho sete.</i> (mit „haben“!) – aber <i>Sono stanco.</i> (mit „sein“).</p>` }
];
