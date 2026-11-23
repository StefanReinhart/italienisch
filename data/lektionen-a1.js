// Ergänzungen der 12 Lektionen für das volle A1-Niveau (wird nach lektionen.js geladen).
// kern = Wörter/Sätze aus Wortschatz und Phrasen, die zur Lektion gehören – über ihre feste Kennung (bleibt gleich, auch wenn der Text geändert wird)
// neu  = neue Wörter und Beispielsätze der Lektion (Format je Zeile: italienisch | deutsch)
// grammatikPlus / fragenPlus / erklaerungPlus werden an die Lektion in lektionen.js angehängt
window.LEKTION_ERGAENZUNG = {
l1: {
  kern: ["grundwoerter:ciao", "grundwoerter:buongiorno", "grundwoerter:buonasera", "grundwoerter:buonanotte", "grundwoerter:arrivederci", "grundwoerter:grazie", "grundwoerter:prego", "grundwoerter:per favore", "grundwoerter:scusi", "grundwoerter:sì", "grundwoerter:no", "personen:io", "personen:tu", "personen:lui", "personen:lei", "personen:noi", "personen:voi", "personen:loro", "fragen:come", "fragen:dove", "fragen:chi", "fragen:che cosa", "personen:l'amico", "personen:l'amica", "freizeit:il nome", "grundwoerter:anche",
    "p_begruessung:Ciao, come stai?", "p_begruessung:Buongiorno, come sta?", "p_begruessung:Sto bene, grazie.", "p_begruessung:Non c'è male.", "p_begruessung:E tu?", "p_begruessung:Come ti chiami?", "p_begruessung:Mi chiamo Marco.", "p_begruessung:Piacere!", "p_begruessung:Di dove sei?", "p_begruessung:Sono tedesco.", "p_begruessung:A presto!", "p_begruessung:A domani!", "p_verstaendigung:Parlo un po' di italiano.", "p_verstaendigung:Non capisco."],
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
  kern: ["zahlen:uno", "zahlen:due", "zahlen:tre", "zahlen:quattro", "zahlen:cinque", "zahlen:sei", "zahlen:sette", "zahlen:otto", "zahlen:nove", "zahlen:dieci", "zahlen:undici", "zahlen:dodici", "zahlen:quindici", "zahlen:venti", "zahlen:ventuno", "zahlen:trenta", "zahlen:quaranta", "zahlen:cinquanta", "zahlen:sessanta", "zahlen:settanta", "zahlen:ottanta", "zahlen:novanta", "zahlen:cento", "zahlen:mille", "fragen:quanti", "fragen:quanto", "zeit:l'anno",
    "p_begruessung:Quanti anni hai?", "p_begruessung:Ho cinquanta anni."],
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
  kern: ["trinken:il caffè", "trinken:il cappuccino", "trinken:il tè", "trinken:il latte", "trinken:l'acqua", "trinken:l'acqua frizzante", "trinken:l'acqua naturale", "trinken:la birra", "trinken:il vino", "trinken:il succo", "trinken:il bicchiere", "trinken:la tazza", "trinken:la bottiglia", "restaurant:il bar", "restaurant:il conto", "essen:lo zucchero", "einkaufen:lo scontrino",
    "p_restaurant:Un caffè, per favore.", "p_restaurant:Il conto, per favore.", "p_restaurant:Una bottiglia d'acqua naturale.", "p_restaurant:Un bicchiere di vino rosso.", "p_verstaendigung:Può ripetere, per favore?", "p_verstaendigung:Più piano, per favore."],
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
  kern: ["personen:la famiglia", "personen:il padre", "personen:la madre", "personen:il figlio", "personen:la figlia", "personen:il fratello", "personen:la sorella", "personen:il marito", "personen:la moglie", "personen:il nonno", "personen:la nonna", "personen:lo zio", "personen:la zia", "personen:il cugino", "personen:i genitori", "personen:il bambino", "personen:la bambina", "personen:il ragazzo", "personen:la ragazza", "personen:l'uomo", "personen:la donna", "farben:grande", "farben:piccolo", "farben:giovane", "farben:vecchio", "farben:bello"],
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
  kern: ["essen:la pasta", "essen:la pizza", "essen:il pane", "essen:la carne", "essen:il pesce", "essen:il pollo", "essen:il formaggio", "essen:la verdura", "essen:la frutta", "essen:l'insalata", "essen:il dolce", "essen:il gelato", "essen:la colazione", "essen:il pranzo", "essen:la cena", "restaurant:il ristorante", "restaurant:il cameriere", "restaurant:il menù", "restaurant:il tavolo", "restaurant:il primo", "restaurant:il secondo", "restaurant:il contorno",
    "p_restaurant:Un tavolo per due, per favore.", "p_restaurant:Il menù, per favore.", "p_restaurant:Che cosa ci consiglia?", "p_restaurant:mi-consiglia", "p_restaurant:specialita", "p_restaurant:Vorrei una pizza margherita.", "p_restaurant:È delizioso!", "p_restaurant:Sono vegetariano.", "p_alltag:Mi piace molto."],
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
  kern: ["einkaufen:il negozio", "einkaufen:il supermercato", "einkaufen:il mercato", "einkaufen:il prezzo", "einkaufen:i soldi", "einkaufen:l'euro", "einkaufen:il chilo", "einkaufen:il litro", "einkaufen:il pezzo", "einkaufen:aperto", "einkaufen:chiuso", "einkaufen:la carta di credito", "einkaufen:la borsa", "kleidung:la maglietta", "kleidung:la camicia", "kleidung:i pantaloni", "kleidung:la giacca", "kleidung:le scarpe", "kleidung:la taglia", "farben:rosso", "farben:blu", "farben:verde", "farben:giallo", "farben:bianco", "farben:nero", "farben:caro", "farben:economico",
    "p_einkaufen:Quanto costa?", "p_einkaufen:Quanto costano?", "p_einkaufen:Posso provarlo?", "p_einkaufen:È troppo caro.", "p_einkaufen:Lo prendo.", "p_einkaufen:Un chilo di mele, per favore.", "p_einkaufen:Nient'altro, grazie."],
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
  kern: ["stadt:la città", "stadt:la strada", "stadt:la via", "stadt:la piazza", "stadt:il centro", "stadt:la chiesa", "stadt:il museo", "stadt:la banca", "stadt:la posta", "stadt:l'ospedale", "stadt:la stazione", "stadt:il parco", "weg:a destra", "weg:a sinistra", "weg:dritto", "weg:vicino", "weg:lontano", "weg:davanti", "weg:dietro", "weg:accanto", "weg:di fronte", "weg:l'angolo", "weg:il semaforo", "weg:l'incrocio",
    "p_weg:Scusi, dov'è la stazione?", "p_weg:Come arrivo al centro?", "p_weg:È lontano?", "p_weg:È vicino.", "p_weg:Vada sempre dritto.", "p_weg:Giri a destra.", "p_weg:Giri a sinistra.", "p_weg:È dietro l'angolo.", "p_weg:Mi sono perso.", "p_weg:C'è una farmacia qui vicino?"],
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
  kern: ["zeit:il giorno", "zeit:la settimana", "zeit:il mese", "zeit:l'ora", "zeit:la mattina", "zeit:il pomeriggio", "zeit:la sera", "zeit:la notte", "zeit:lunedì", "zeit:martedì", "zeit:mercoledì", "zeit:giovedì", "zeit:venerdì", "zeit:sabato", "zeit:domenica", "zeit:il fine settimana", "zeit:presto", "zeit:tardi", "zeit:dopo", "zeit:prima",
    "verben:parlare", "verben:lavorare", "verben:abitare", "verben:mangiare", "verben:guardare", "verben:comprare", "verben:ascoltare", "verben:arrivare", "p_alltag:Che ore sono?", "p_alltag:Sono le tre."],
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
  kern: ["verkehr:il treno", "verkehr:l'autobus", "verkehr:la macchina", "verkehr:la bicicletta", "verkehr:l'aereo", "verkehr:il taxi", "verkehr:la metropolitana", "verkehr:il biglietto", "verkehr:il binario", "verkehr:la fermata", "verkehr:la partenza", "verkehr:l'arrivo", "verkehr:il ritardo", "verkehr:la valigia", "verkehr:il passaporto", "verkehr:il viaggio", "verkehr:le vacanze",
    "p_reisen:Un biglietto per Roma, per favore.", "p_reisen:Solo andata.", "p_reisen:Andata e ritorno.", "p_reisen:A che ora parte il treno?", "p_reisen:Da quale binario parte?", "p_reisen:Il treno è in ritardo."],
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
  kern: ["stadt:l'albergo", "verkehr:la camera", "verkehr:la chiave", "restaurant:la prenotazione", "essen:la colazione", "haus:il bagno", "haus:la doccia", "haus:il letto", "haus:la finestra", "verben:volere", "verben:potere", "verben:dovere",
    "p_reisen:Ho prenotato una camera.", "p_reisen:Avete una camera libera?", "p_reisen:A che ora è la colazione?", "p_reisen:La chiave, per favore.", "p_restaurant:Posso pagare con la carta?"],
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
  kern: ["freizeit:la musica", "freizeit:il film", "freizeit:il cinema", "freizeit:il teatro", "freizeit:lo sport", "freizeit:il calcio", "freizeit:la partita", "freizeit:la festa", "wetter:il tempo", "wetter:il sole", "wetter:la pioggia", "wetter:la neve", "wetter:il vento", "wetter:la primavera", "wetter:l'estate", "wetter:l'autunno", "wetter:l'inverno", "verben:fare", "verben:leggere", "verben:scrivere", "verben:dormire", "verben:vedere",
    "p_alltag:Che tempo fa?", "p_alltag:Fa caldo.", "p_alltag:Fa freddo."],
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
  kern: ["koerper:la testa", "koerper:gli occhi", "koerper:il naso", "koerper:la bocca", "koerper:l'orecchio", "koerper:i denti", "koerper:il braccio", "koerper:la mano", "koerper:la gamba", "koerper:il piede", "koerper:la schiena", "koerper:lo stomaco", "koerper:il medico", "koerper:la medicina", "koerper:il dolore", "koerper:la febbre", "koerper:malato", "koerper:sano", "farben:stanco",
    "p_alltag:Mi sento male.", "p_alltag:Mi fa male la testa.", "p_alltag:Chiami un medico!", "p_alltag:Aiuto!", "p_alltag:Ho fame.", "p_alltag:Ho sete.", "p_alltag:Sono stanco."],
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
