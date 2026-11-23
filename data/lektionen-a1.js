// Ergänzungen der 12 Lektionen für das volle A1-Niveau (wird nach lektionen.js geladen).
// kern = Wörter/Sätze aus Wortschatz und Phrasen (genauer italienischer Text), die zur Lektion gehören
// neu  = neue Wörter und Beispielsätze der Lektion (Format je Zeile: italienisch | deutsch)
// grammatikPlus / fragenPlus / erklaerungPlus werden an die Lektion in lektionen.js angehängt
window.LEKTION_ERGAENZUNG = {
l1: {
  kern: ["ciao", "buongiorno", "buonasera", "buonanotte", "arrivederci", "grazie", "prego", "per favore", "scusi", "sì", "no", "io", "tu", "lui", "lei", "noi", "voi", "loro", "come", "dove", "chi", "che cosa", "l'amico", "l'amica", "il nome", "anche",
    "Ciao, come stai?", "Buongiorno, come sta?", "Sto bene, grazie.", "Non c'è male.", "E tu?", "Come ti chiami?", "Mi chiamo Marco.", "Piacere!", "Di dove sei?", "Sono tedesco.", "A presto!", "A domani!", "Parlo un po' di italiano.", "Non capisco."],
  neu: `
Sono Marco, e tu? | Ich bin Marco, und du?
Lei è italiana? | Sind Sie Italienerin?
No, non sono italiano. | Nein, ich bin kein Italiener.
Noi siamo di Monaco. | Wir sind aus München.
Siete in vacanza? | Seid ihr im Urlaub?
Loro sono amici. | Sie sind Freunde.
Come si chiama Lei? | Wie heißen Sie?
Anch'io sono tedesco. | Ich bin auch Deutscher.
Ci vediamo domani! | Wir sehen uns morgen!
Non sono di qui. | Ich bin nicht von hier.
`,
  grammatikPlus: [{ luecke: "fragewoerter" }],
  erklaerungPlus: `<p><b>Fragewörter:</b> <i>come</i> (wie) · <i>dove</i> (wo) · <i>di dove</i> (woher) · <i>chi</i> (wer) · <i>che cosa</i> (was) · <i>quando</i> (wann) · <i>quanto</i> (wie viel) · <i>perché</i> (warum).</p>
<p><b>Verneinen:</b> einfach <b>non</b> vor das Verb: <i>Non sono italiano.</i> = Ich bin kein Italiener. <i>Non capisco.</i> = Ich verstehe nicht.</p>`
},
l2: {
  kern: ["uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci", "undici", "dodici", "quindici", "venti", "ventuno", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta", "cento", "mille", "quanti", "quanto", "l'anno",
    "Quanti anni hai?", "Ho cinquantaquattro anni."],
  neu: `
ventitré | dreiundzwanzig
trentadue | zweiunddreißig
quarantotto | achtundvierzig
sessantacinque | fünfundsechzig
novantanove | neunundneunzig
Mia figlia ha diciotto anni. | Meine Tochter ist achtzehn.
Quanti anni ha tuo padre? | Wie alt ist dein Vater?
Abbiamo una casa a Monaco. | Wir haben ein Haus in München.
Hai un cellulare? | Hast du ein Handy?
Hanno tre bambini. | Sie haben drei Kinder.
Avete tempo domani? | Habt ihr morgen Zeit?
Non ho tempo. | Ich habe keine Zeit.
`
},
l3: {
  kern: ["il caffè", "il cappuccino", "il tè", "il latte", "l'acqua", "l'acqua frizzante", "l'acqua naturale", "la birra", "il vino", "il succo", "il bicchiere", "la tazza", "la bottiglia", "il bar", "il conto", "lo zucchero", "lo scontrino",
    "Un caffè, per favore.", "Il conto, per favore.", "Una bottiglia d'acqua naturale.", "Un bicchiere di vino rosso.", "Può ripetere, per favore?", "Più piano, per favore."],
  neu: `
il cornetto | das Hörnchen (Croissant)
al banco | an der Theke
al tavolo | am Tisch
la cassa | die Kasse
la spremuta | der frisch gepresste Saft
l'aranciata | die Orangenlimonade
Vorrei un cappuccino e un cornetto. | Ich hätte gern einen Cappuccino und ein Hörnchen.
Un'acqua naturale, per favore. | Ein stilles Wasser, bitte.
Prendo un tè al limone. | Ich nehme einen Zitronentee.
Quant'è? | Was macht das?
Pago alla cassa. | Ich zahle an der Kasse.
Senza zucchero, grazie. | Ohne Zucker, danke.
Ecco a Lei! | Bitte schön (für Sie)!
Al banco o al tavolo? | An der Theke oder am Tisch?
Per me una spremuta d'arancia. | Für mich einen frisch gepressten Orangensaft.
`,
  grammatikPlus: [{ luecke: "unbestimmt" }],
  fragenPlus: ["Prendi un cornetto con il caffè?"],
  erklaerungPlus: `<p><b>„ein/eine“ (unbestimmter Artikel):</b></p>
<table class="tab"><tr><td>männlich</td><td><b>un</b> caffè, <b>un</b> amico</td></tr><tr><td>männlich vor z / s+Mitlaut</td><td><b>uno</b> zio, <b>uno</b> spumante</td></tr>
<tr><td>weiblich</td><td><b>una</b> birra</td></tr><tr><td>weiblich vor Selbstlaut</td><td><b>un'</b>acqua, <b>un'</b>amica</td></tr></table>`
},
l4: {
  kern: ["la famiglia", "il padre", "la madre", "il figlio", "la figlia", "il fratello", "la sorella", "il marito", "la moglie", "il nonno", "la nonna", "lo zio", "la zia", "il cugino", "i genitori", "il bambino", "la bambina", "il ragazzo", "la ragazza", "l'uomo", "la donna", "grande", "piccolo", "giovane", "vecchio", "bello"],
  neu: `
i figli | die Kinder (Söhne und Töchter)
il nipote | der Enkel / der Neffe
sposato | verheiratet
simpatico | sympathisch
alto | groß (Körpergröße)
basso | klein (Körpergröße)
biondo | blond
Sono sposato e ho due figli. | Ich bin verheiratet und habe zwei Kinder.
Mia moglie si chiama Anna. | Meine Frau heißt Anna.
I miei genitori abitano a Monaco. | Meine Eltern wohnen in München.
Mio fratello è alto e biondo. | Mein Bruder ist groß und blond.
Mia sorella è molto simpatica. | Meine Schwester ist sehr sympathisch.
Come si chiama tuo figlio? | Wie heißt dein Sohn?
Sua madre è italiana. | Seine (oder: ihre) Mutter ist Italienerin.
Le mie figlie sono grandi. | Meine Töchter sind erwachsen.
Questa è la mia famiglia. | Das ist meine Familie.
I nonni hanno un grande giardino. | Die Großeltern haben einen großen Garten.
`,
  grammatikPlus: [{ luecke: "possessiv2" }, { luecke: "adjektiv" }],
  fragenPlus: ["Come si chiama tua madre?"],
  erklaerungPlus: `<p><b>dein / sein / ihr:</b> <i>tuo / tua</i> (dein, deine) · <i>suo / sua</i> (sein, seine <b>und</b> ihr, ihre). Die Endung richtet sich nach dem <b>Wort</b>, nicht nach der Person: <i>sua madre</i> = seine Mutter oder ihre Mutter.</p>
<p><b>Eigenschaftswörter</b> passen sich an: <i>il ragazzo alt<b>o</b>, la ragazza alt<b>a</b>, i ragazzi alt<b>i</b>, le ragazze alt<b>e</b></i>. Wörter auf -e haben nur zwei Formen: <i>grand<b>e</b> / grand<b>i</b></i>.</p>`
},
l5: {
  kern: ["la pasta", "la pizza", "il pane", "la carne", "il pesce", "il pollo", "il formaggio", "la verdura", "la frutta", "l'insalata", "il dolce", "il gelato", "la colazione", "il pranzo", "la cena", "il ristorante", "il cameriere", "il menù", "il tavolo", "il primo", "il secondo", "il contorno",
    "Un tavolo per due, per favore.", "Il menù, per favore.", "Che cosa ci consiglia?", "Che cosa mi consiglia?", "Qual è la specialità della casa?", "Vorrei una pizza margherita.", "È delizioso!", "Sono vegetariano.", "Mi piace molto."],
  neu: `
gli spaghetti | die Spaghetti
il tiramisù | das Tiramisu
piccante | scharf
buonissimo | sehr gut, köstlich
Mi piace molto la pasta. | Ich mag Nudeln sehr.
Mi piacciono gli spaghetti al pomodoro. | Ich mag Spaghetti mit Tomatensoße.
Non mi piace il pesce. | Ich mag keinen Fisch.
Ti piace il vino rosso? | Magst du Rotwein?
Per primo prendo gli spaghetti. | Als ersten Gang nehme ich Spaghetti.
Per secondo vorrei il pollo. | Als Hauptgang hätte ich gern das Hähnchen.
Come dolce, un tiramisù. | Als Nachtisch ein Tiramisu.
La pizza è buonissima! | Die Pizza ist köstlich!
È piccante? | Ist das scharf?
Mi piace mangiare al ristorante. | Ich esse gern im Restaurant.
Le patate non mi piacciono. | Kartoffeln mag ich nicht.
`,
  fragenPlus: ["Ti piacciono gli spaghetti?"]
},
l6: {
  kern: ["il negozio", "il supermercato", "il mercato", "il prezzo", "i soldi", "l'euro", "il chilo", "il litro", "il pezzo", "aperto", "chiuso", "la carta di credito", "la borsa", "la maglietta", "la camicia", "i pantaloni", "la giacca", "le scarpe", "la taglia", "rosso", "blu", "verde", "giallo", "bianco", "nero", "caro", "economico",
    "Quanto costa?", "Quanto costano?", "Posso provarlo?", "È troppo caro.", "Lo prendo.", "Un chilo di mele, per favore.", "Nient'altro, grazie."],
  neu: `
mezzo chilo | ein halbes Kilo
un etto | 100 Gramm
il resto | das Wechselgeld
questo / questa | dieser / diese
quello / quella | der / die dort
Quanto costa questa giacca? | Was kostet diese Jacke?
Quanto costano queste scarpe? | Was kosten diese Schuhe?
Vorrei quella maglietta rossa. | Ich hätte gern das rote T-Shirt dort.
Avete una taglia più piccola? | Haben Sie eine kleinere Größe?
Un etto di prosciutto, per favore. | 100 Gramm Schinken, bitte.
Mezzo chilo di pomodori. | Ein halbes Kilo Tomaten.
C'è uno sconto? | Gibt es einen Rabatt?
Ci sono scarpe nere? | Gibt es schwarze Schuhe?
Il negozio è chiuso la domenica. | Das Geschäft ist sonntags geschlossen.
Ecco il resto. | Hier ist das Wechselgeld.
Pago con la carta. | Ich zahle mit Karte.
`,
  grammatikPlus: [{ luecke: "questo" }, { luecke: "adjektiv" }],
  fragenPlus: ["Di che colore è la tua giacca?"],
  erklaerungPlus: `<p><b>dieser / diese:</b> <i>questo</i> libro · <i>questa</i> giacca · <i>questi</i> pantaloni · <i>queste</i> scarpe. Für „der/die dort“: <i>quello / quella</i>.</p>
<table class="tab"><tr><th></th><th>Einzahl</th><th>Mehrzahl</th></tr><tr><td>männlich</td><td>ross<b>o</b></td><td>ross<b>i</b></td></tr><tr><td>weiblich</td><td>ross<b>a</b></td><td>ross<b>e</b></td></tr>
<tr><td>auf -e (beide)</td><td>verd<b>e</b></td><td>verd<b>i</b></td></tr></table>
<p><i>blu, rosa</i> und <i>arancione</i> ändern sich (fast) nie: <i>le scarpe blu</i>.</p>`
},
l7: {
  kern: ["la città", "la strada", "la via", "la piazza", "il centro", "la chiesa", "il museo", "la banca", "la posta", "l'ospedale", "la stazione", "il parco", "a destra", "a sinistra", "dritto", "vicino", "lontano", "davanti", "dietro", "accanto", "di fronte", "l'angolo", "il semaforo", "l'incrocio",
    "Scusi, dov'è la stazione?", "Come arrivo al centro?", "È lontano?", "È vicino.", "Vada sempre dritto.", "Giri a destra.", "Giri a sinistra.", "È dietro l'angolo.", "Mi sono perso.", "C'è una farmacia qui vicino?"],
  neu: `
fino a | bis (zu)
poi | dann
a piedi | zu Fuß
Scusi, come arrivo in piazza? | Entschuldigung, wie komme ich zum Platz?
Prenda la seconda strada a destra. | Nehmen Sie die zweite Straße rechts.
La banca è di fronte alla posta. | Die Bank ist gegenüber der Post.
Il museo è accanto alla chiesa. | Das Museum ist neben der Kirche.
Vada dritto fino al semaforo. | Gehen Sie geradeaus bis zur Ampel.
È a cinque minuti a piedi. | Es ist fünf Minuten zu Fuß.
Vengo da Monaco. | Ich komme aus München.
Vado in centro con un amico. | Ich gehe mit einem Freund ins Zentrum.
È la chiave di Marco. | Das ist Marcos Schlüssel.
Questo autobus va in centro? | Fährt dieser Bus ins Zentrum?
`,
  grammatikPlus: [{ luecke: "praep" }],
  fragenPlus: ["C'è una farmacia vicino a casa tua?"],
  erklaerungPlus: `<p><b>Vier wichtige kleine Wörter:</b> <i>di</i> (von, aus – Herkunft und Besitz: <i>sono di Monaco, la chiave di Marco</i>) · <i>da</i> (von … her: <i>vengo da Roma</i>) · <i>con</i> (mit) · <i>per</i> (für, nach: <i>un biglietto per Firenze</i>).</p>`
},
l8: {
  kern: ["il giorno", "la settimana", "il mese", "l'ora", "la mattina", "il pomeriggio", "la sera", "la notte", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica", "il fine settimana", "presto", "tardi", "dopo", "prima",
    "parlare", "lavorare", "abitare", "mangiare", "guardare", "comprare", "ascoltare", "arrivare", "Che ore sono?", "Sono le tre."],
  neu: `
mezzogiorno | zwölf Uhr mittags
mezzanotte | Mitternacht
e mezza | halb (… Uhr dreißig)
e un quarto | Viertel nach
meno un quarto | Viertel vor
alzarsi | aufstehen
chiamarsi | heißen
di solito | normalerweise
Mi alzo alle sette. | Ich stehe um sieben auf.
Sono le otto e mezza. | Es ist halb neun.
È l'una e un quarto. | Es ist Viertel nach eins.
Sono le dieci meno un quarto. | Es ist Viertel vor zehn.
Lavoro dalle nove alle cinque. | Ich arbeite von neun bis fünf.
Mangio a mezzogiorno. | Ich esse um zwölf Uhr mittags.
La sera guardo la televisione. | Abends sehe ich fern.
Il sabato compro il pane. | Samstags kaufe ich Brot.
Di solito arrivo alle otto. | Normalerweise komme ich um acht an.
Mi lavo e faccio colazione. | Ich wasche mich und frühstücke.
Noi parliamo italiano. | Wir sprechen Italienisch.
`,
  grammatikPlus: [{ luecke: "uhrzeit" }, { luecke: "reflexiv" }],
  erklaerungPlus: `<p><b>Reflexive Verben</b> („sich …“) – das kleine Wort steht <b>vor</b> dem Verb:</p>
<table class="tab"><tr><td>io</td><td><b>mi</b> alzo</td><td>ich stehe auf</td></tr><tr><td>tu</td><td><b>ti</b> alzi</td><td>du stehst auf</td></tr>
<tr><td>lui / lei</td><td><b>si</b> alza</td><td>er/sie steht auf</td></tr><tr><td>noi</td><td><b>ci</b> alziamo</td><td>wir stehen auf</td></tr></table>
<p>So funktioniert auch <i>mi chiamo</i> (ich heiße, wörtlich: ich nenne mich).</p>
<p><b>Wochentage:</b> <i>lunedì</i> = am Montag · <i>il lunedì</i> = montags (jeden Montag).</p>`
},
l9: {
  kern: ["il treno", "l'autobus", "la macchina", "la bicicletta", "l'aereo", "il taxi", "la metropolitana", "il biglietto", "il binario", "la fermata", "la partenza", "l'arrivo", "il ritardo", "la valigia", "il passaporto", "il viaggio", "le vacanze",
    "Un biglietto per Roma, per favore.", "Solo andata.", "Andata e ritorno.", "A che ora parte il treno?", "Da quale binario parte?", "Il treno è in ritardo."],
  neu: `
uscire | hinausgehen
prossimo | nächster
cambiare | umsteigen, wechseln
in orario | pünktlich
Vado a Roma in treno. | Ich fahre mit dem Zug nach Rom.
Vieni con me? | Kommst du mit mir?
Il prossimo treno parte alle dieci. | Der nächste Zug fährt um zehn ab.
Devo cambiare a Bologna? | Muss ich in Bologna umsteigen?
Il treno è in orario. | Der Zug ist pünktlich.
Andiamo in vacanza al mare. | Wir fahren ans Meer in den Urlaub.
Vado al lavoro in bicicletta. | Ich fahre mit dem Rad zur Arbeit.
Esco di casa alle otto. | Ich gehe um acht aus dem Haus.
Da dove vieni? | Woher kommst du?
Vengono domani. | Sie kommen morgen.
Dov'è la fermata dell'autobus? | Wo ist die Bushaltestelle?
`,
  grammatikPlus: [{ verben: ["uscire"] }],
  fragenPlus: ["Come vai in centro?"]
},
l10: {
  kern: ["l'albergo", "la camera", "la chiave", "la prenotazione", "la colazione", "il bagno", "la doccia", "il letto", "la finestra", "volere", "potere", "dovere",
    "Ho prenotato una camera.", "Avete una camera libera?", "A che ora è la colazione?", "La chiave, per favore.", "Posso pagare con la carta?"],
  neu: `
la camera singola | das Einzelzimmer
la camera doppia | das Doppelzimmer
la colazione inclusa | Frühstück inklusive
l'ascensore | der Aufzug
funzionare | funktionieren
Vorrei una camera doppia per tre notti. | Ich hätte gern ein Doppelzimmer für drei Nächte.
La colazione è inclusa? | Ist das Frühstück inklusive?
Posso lasciare la valigia qui? | Kann ich den Koffer hier lassen?
Devo pagare adesso? | Muss ich jetzt bezahlen?
Vogliamo una camera con balcone. | Wir möchten ein Zimmer mit Balkon.
La doccia non funziona. | Die Dusche funktioniert nicht.
Dov'è l'ascensore? | Wo ist der Aufzug?
Può chiamare un taxi? | Können Sie ein Taxi rufen?
Potete aiutarmi? | Könnt ihr mir helfen?
Non posso dormire, c'è rumore. | Ich kann nicht schlafen, es ist laut.
`,
  grammatikPlus: [{ luecke: "infinitiv" }],
  fragenPlus: ["Vuole una camera singola o doppia?", "Posso pagare con la carta? (Antworte als Hotel)"]
},
l11: {
  kern: ["la musica", "il film", "il cinema", "il teatro", "lo sport", "il calcio", "la partita", "la festa", "il tempo", "il sole", "la pioggia", "la neve", "il vento", "la primavera", "l'estate", "l'autunno", "l'inverno", "fare", "leggere", "scrivere", "dormire", "vedere",
    "Che tempo fa?", "Fa caldo.", "Fa freddo."],
  neu: `
giocare | spielen (Sport, Spiel)
nuotare | schwimmen
camminare | gehen, wandern
spesso | oft
qualche volta | manchmal
non … mai | nie
piove | es regnet
nevica | es schneit
Nel tempo libero leggo molto. | In der Freizeit lese ich viel.
Gioco a calcio il sabato. | Samstags spiele ich Fußball.
Vado spesso al cinema. | Ich gehe oft ins Kino.
Qualche volta faccio una passeggiata. | Manchmal mache ich einen Spaziergang.
Non guardo mai la televisione. | Ich sehe nie fern.
Oggi fa bel tempo. | Heute ist schönes Wetter.
Domani piove. | Morgen regnet es.
In inverno nevica in montagna. | Im Winter schneit es in den Bergen.
Ascolto la musica italiana. | Ich höre italienische Musik.
Che cosa fai stasera? | Was machst du heute Abend?
Preferisco il mare. | Ich bevorzuge das Meer.
La domenica dormo fino alle nove. | Sonntags schlafe ich bis neun.
`,
  grammatikPlus: [{ luecke: "haeufigkeit" }],
  erklaerungPlus: `<p><b>Wie oft?</b> <i>sempre</i> (immer) · <i>spesso</i> (oft) · <i>qualche volta</i> (manchmal) · <i>non … mai</i> (nie): <i>Non bevo <b>mai</b> birra.</i> – das <i>non</i> steht vor dem Verb, <i>mai</i> dahinter.</p>`
},
l12: {
  kern: ["la testa", "gli occhi", "il naso", "la bocca", "l'orecchio", "i denti", "il braccio", "la mano", "la gamba", "il piede", "la schiena", "lo stomaco", "il medico", "la medicina", "il dolore", "la febbre", "malato", "sano", "stanco",
    "Mi sento male.", "Mi fa male la testa.", "Chiami un medico!", "Aiuto!", "Ho fame.", "Ho sete.", "Sono stanco."],
  neu: `
la tosse | der Husten
il raffreddore | der Schnupfen, die Erkältung
il mal di testa | die Kopfschmerzen
la ricetta | das Rezept
il pronto soccorso | die Notaufnahme
Non sto bene. | Mir geht es nicht gut.
Ho mal di testa. | Ich habe Kopfschmerzen.
Ho la febbre da ieri. | Ich habe seit gestern Fieber.
Ho il raffreddore e la tosse. | Ich habe Schnupfen und Husten.
Mi fanno male i piedi. | Mir tun die Füße weh.
Ho bisogno di un medico. | Ich brauche einen Arzt.
Devo prendere questa medicina? | Muss ich dieses Medikament nehmen?
Ho freddo. | Mir ist kalt.
Ho caldo. | Mir ist warm.
Sto meglio, grazie. | Es geht mir besser, danke.
Dov'è il pronto soccorso? | Wo ist die Notaufnahme?
`,
  fragenPlus: ["Che cosa ti fa male?"],
  erklaerungPlus: `<p><b>Mit „haben“ statt „sein“:</b> <i>Ho fame / sete / freddo / caldo.</i> = Ich habe Hunger / Durst, mir ist kalt / warm. · <i>Ho bisogno di …</i> = Ich brauche …</p>`
}
};
LEKTIONEN.forEach((l) => {
  const e = window.LEKTION_ERGAENZUNG[l.id]; if (!e) return;
  l.kern = e.kern || []; l.neu = e.neu || "";
  l.grammatik = l.grammatik.concat(e.grammatikPlus || []);
  l.fragen = l.fragen.concat(e.fragenPlus || []);
  l.erklaerung += e.erklaerungPlus || "";
});
