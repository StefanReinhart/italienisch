// Mini-Dialoge zum Hören.
// text: je Zeile  Sprecher | Italienisch | Deutsch
// fragen: f = Frage (Deutsch), o = Antwortmöglichkeiten, r = Nummer der richtigen (0 = erste)
window.DIALOGE = [
{ id: "bar", titel: "Al bar", icon: "☕", situation: "Im Café: Ein Gast bestellt an der Theke.", text: `
Barista | Buongiorno! Cosa prende? | Guten Tag! Was nehmen Sie?
Cliente | Buongiorno. Un cappuccino e un cornetto, per favore. | Guten Tag. Einen Cappuccino und ein Hörnchen, bitte.
Barista | Al banco o al tavolo? | An der Theke oder am Tisch?
Cliente | Al banco, grazie. | An der Theke, danke.
Barista | Ecco a Lei. Sono tre euro e cinquanta. | Bitte schön. Das macht drei Euro fünfzig.
Cliente | Ecco. Grazie, arrivederci! | Bitte. Danke, auf Wiedersehen!
`, fragen: [
  { f: "Was bestellt der Gast?", o: ["Einen Cappuccino und ein Hörnchen", "Einen Espresso und ein Wasser", "Einen Tee und ein Stück Kuchen"], r: 0 },
  { f: "Wo trinkt der Gast?", o: ["An der Theke", "Am Tisch", "Er nimmt es mit"], r: 0 },
  { f: "Wie viel kostet es?", o: ["3,50 €", "5,30 €", "3,15 €"], r: 0 }
]},
{ id: "stazione", titel: "Alla stazione", icon: "🚆", situation: "Am Bahnhof: Jemand kauft eine Fahrkarte.", text: `
Viaggiatore | Buongiorno, un biglietto per Firenze, per favore. | Guten Tag, eine Fahrkarte nach Florenz, bitte.
Impiegata | Solo andata o andata e ritorno? | Nur Hinfahrt oder hin und zurück?
Viaggiatore | Andata e ritorno. | Hin und zurück.
Impiegata | Sono quaranta euro. | Das macht vierzig Euro.
Viaggiatore | A che ora parte il treno? | Um wie viel Uhr fährt der Zug ab?
Impiegata | Alle dieci e un quarto, dal binario cinque. | Um Viertel nach zehn, von Gleis fünf.
Viaggiatore | Grazie mille! | Vielen Dank!
`, fragen: [
  { f: "Wohin fährt der Reisende?", o: ["Nach Florenz", "Nach Rom", "Nach Mailand"], r: 0 },
  { f: "Was für eine Fahrkarte kauft er?", o: ["Hin und zurück", "Nur Hinfahrt", "Eine Wochenkarte"], r: 0 },
  { f: "Wann und wo fährt der Zug?", o: ["10:15 Uhr, Gleis 5", "10:50 Uhr, Gleis 15", "11:15 Uhr, Gleis 5"], r: 0 }
]},
{ id: "albergo", titel: "In albergo", icon: "🏨", situation: "Im Hotel: Ein Gast kommt am Abend an.", text: `
Ospite | Buonasera, ho una prenotazione. Mi chiamo Weber. | Guten Abend, ich habe eine Reservierung. Ich heiße Weber.
Receptionist | Buonasera, signor Weber. Sì, una camera doppia per tre notti. | Guten Abend, Herr Weber. Ja, ein Doppelzimmer für drei Nächte.
Ospite | Esatto. A che ora è la colazione? | Genau. Um wie viel Uhr ist das Frühstück?
Receptionist | Dalle sette alle dieci, al primo piano. | Von sieben bis zehn, im ersten Stock.
Ospite | C'è il Wi-Fi in camera? | Gibt es WLAN im Zimmer?
Receptionist | Sì, la password è sulla chiave. Ecco la chiave: camera duecentoquattro. | Ja, das Passwort steht auf dem Schlüssel. Hier ist der Schlüssel: Zimmer 204.
Ospite | Grazie, buonanotte! | Danke, gute Nacht!
`, fragen: [
  { f: "Wie lange bleibt der Gast?", o: ["Drei Nächte", "Zwei Nächte", "Eine Woche"], r: 0 },
  { f: "Wann gibt es Frühstück?", o: ["Von 7 bis 10 Uhr", "Von 8 bis 11 Uhr", "Von 6 bis 9 Uhr"], r: 0 },
  { f: "Welche Zimmernummer hat er?", o: ["204", "214", "240"], r: 0 }
]},
{ id: "ristorante", titel: "Al ristorante", icon: "🍝", situation: "Im Restaurant: Ein Paar bestellt das Abendessen.", text: `
Cliente | Buonasera, avete un tavolo per due? | Guten Abend, haben Sie einen Tisch für zwei?
Cameriere | Sì, prego, da questa parte. Ecco il menù. | Ja, bitte, hier entlang. Hier ist die Speisekarte.
Cameriere | Cosa prendete? | Was nehmen Sie?
Cliente | Per me una pizza margherita. E per mia moglie gli spaghetti al pomodoro. | Für mich eine Pizza Margherita. Und für meine Frau die Spaghetti mit Tomatensoße.
Cameriere | E da bere? | Und zu trinken?
Cliente | Una bottiglia d'acqua naturale e due bicchieri di vino rosso. | Eine Flasche stilles Wasser und zwei Gläser Rotwein.
Cameriere | Perfetto, grazie. | Perfekt, danke.
`, fragen: [
  { f: "Für wie viele Personen ist der Tisch?", o: ["Für zwei", "Für drei", "Für vier"], r: 0 },
  { f: "Was isst die Frau?", o: ["Spaghetti mit Tomatensoße", "Pizza Margherita", "Fisch"], r: 0 },
  { f: "Was trinken die beiden?", o: ["Stilles Wasser und Rotwein", "Sprudelwasser und Bier", "Nur Weißwein"], r: 0 }
]},
{ id: "mercato", titel: "Al mercato", icon: "🍅", situation: "Auf dem Markt: Eine Kundin kauft Obst und Gemüse.", text: `
Venditore | Buongiorno! Cosa desidera? | Guten Tag! Was wünschen Sie?
Cliente | Vorrei un chilo di pomodori, per favore. | Ich hätte gern ein Kilo Tomaten, bitte.
Venditore | Ecco. Altro? | Bitte. Sonst noch etwas?
Cliente | Sì, anche mezzo chilo di mele. Quanto costa tutto? | Ja, auch ein halbes Kilo Äpfel. Was kostet alles zusammen?
Venditore | Sono quattro euro e venti. | Das macht vier Euro zwanzig.
Cliente | Ecco cinque euro. | Hier sind fünf Euro.
Venditore | Ed ecco il resto: ottanta centesimi. Grazie e buona giornata! | Und hier das Wechselgeld: achtzig Cent. Danke und einen schönen Tag!
`, fragen: [
  { f: "Was kauft die Kundin zuerst?", o: ["Ein Kilo Tomaten", "Ein Kilo Äpfel", "Kartoffeln"], r: 0 },
  { f: "Wie viele Äpfel kauft sie?", o: ["Ein halbes Kilo", "Ein Kilo", "Zwei Kilo"], r: 0 },
  { f: "Wie viel Wechselgeld bekommt sie?", o: ["80 Cent", "20 Cent", "1,80 €"], r: 0 }
]},
{ id: "strada", titel: "Chiedere la strada", icon: "🧭", situation: "In der Stadt: Jemand fragt nach dem Weg.", text: `
Turista | Scusi, dov'è il museo? | Entschuldigung, wo ist das Museum?
Signora | Il museo? Vada sempre dritto fino al semaforo. | Das Museum? Gehen Sie immer geradeaus bis zur Ampel.
Turista | E poi? | Und dann?
Signora | Al semaforo giri a sinistra. Il museo è in piazza, accanto alla chiesa. | An der Ampel biegen Sie links ab. Das Museum ist auf dem Platz, neben der Kirche.
Turista | È lontano? | Ist es weit?
Signora | No, sono cinque minuti a piedi. | Nein, es sind fünf Minuten zu Fuß.
Turista | Grazie mille! | Vielen Dank!
Signora | Prego! | Gern geschehen!
`, fragen: [
  { f: "Wohin möchte der Tourist?", o: ["Zum Museum", "Zum Bahnhof", "Zur Kirche"], r: 0 },
  { f: "Wo muss er abbiegen?", o: ["An der Ampel links", "An der Kreuzung rechts", "Er muss nicht abbiegen"], r: 0 },
  { f: "Wie weit ist es?", o: ["5 Minuten zu Fuß", "15 Minuten zu Fuß", "5 Minuten mit dem Bus"], r: 0 }
]},
{ id: "conoscersi", titel: "Conoscersi", icon: "🤝", situation: "Kennenlernen: Zwei Leute treffen sich zum ersten Mal.", text: `
Giulia | Ciao! Sei nuovo qui? | Hallo! Bist du neu hier?
Thomas | Sì, sono arrivato ieri. Mi chiamo Thomas. E tu? | Ja, ich bin gestern angekommen. Ich heiße Thomas. Und du?
Giulia | Io sono Giulia. Di dove sei? | Ich bin Giulia. Woher kommst du?
Thomas | Sono tedesco, di Monaco. E tu, sei di qui? | Ich bin Deutscher, aus München. Und du, bist du von hier?
Giulia | Sì, sono di Bologna. Che lavoro fai? | Ja, ich bin aus Bologna. Was arbeitest du?
Thomas | Sono ingegnere. E tu? | Ich bin Ingenieur. Und du?
Giulia | Io sono insegnante. Piacere! | Ich bin Lehrerin. Freut mich!
`, fragen: [
  { f: "Woher kommt Thomas?", o: ["Aus München", "Aus Berlin", "Aus Bologna"], r: 0 },
  { f: "Wann ist Thomas angekommen?", o: ["Gestern", "Heute", "Vor einer Woche"], r: 0 },
  { f: "Was ist Giulia von Beruf?", o: ["Lehrerin", "Ingenieurin", "Ärztin"], r: 0 }
]},
{ id: "farmacia", titel: "In farmacia", icon: "💊", situation: "In der Apotheke: Jemand fühlt sich nicht gut.", text: `
Farmacista | Buongiorno, mi dica. | Guten Tag, was kann ich für Sie tun?
Cliente | Buongiorno. Ho mal di testa e un po' di febbre. | Guten Tag. Ich habe Kopfschmerzen und ein bisschen Fieber.
Farmacista | Da quando? | Seit wann?
Cliente | Da ieri sera. | Seit gestern Abend.
Farmacista | Prenda questa medicina tre volte al giorno, dopo i pasti. | Nehmen Sie dieses Medikament dreimal am Tag, nach dem Essen.
Cliente | Grazie. Quanto costa? | Danke. Was kostet es?
Farmacista | Otto euro. | Acht Euro.
`, fragen: [
  { f: "Welche Beschwerden hat die Person?", o: ["Kopfschmerzen und etwas Fieber", "Bauchschmerzen", "Husten und Schnupfen"], r: 0 },
  { f: "Seit wann?", o: ["Seit gestern Abend", "Seit drei Tagen", "Seit heute Morgen"], r: 0 },
  { f: "Wie soll sie das Medikament nehmen?", o: ["Dreimal am Tag nach dem Essen", "Zweimal am Tag vor dem Essen", "Einmal am Abend"], r: 0 }
]},
{ id: "eta", titel: "Quanti anni hai?", icon: "🎂", situation: "Zwei neue Kollegen lernen sich kennen.", text: `
Luca | Ciao, sono Luca. Tu come ti chiami? | Hallo, ich bin Luca. Wie heißt du?
Anna | Mi chiamo Anna. Piacere! | Ich heiße Anna. Freut mich!
Luca | Piacere! Quanti anni hai, se posso chiedere? | Freut mich! Wie alt bist du, wenn ich fragen darf?
Anna | Ho trentadue anni. E tu? | Ich bin zweiunddreißig. Und du?
Luca | Io ho ventotto anni. | Ich bin achtundzwanzig.
Anna | Qual è il tuo numero di telefono? | Was ist deine Telefonnummer?
Luca | Tre quattro sette, due due uno, otto nove. | Drei vier sieben, zwei zwei eins, acht neun.
`, fragen: [
  { f: "Wie alt ist Anna?", o: ["32", "23", "28"], r: 0 },
  { f: "Wie alt ist Luca?", o: ["28", "32", "18"], r: 0 },
  { f: "Wonach fragt Anna am Ende?", o: ["Nach der Telefonnummer", "Nach der Adresse", "Nach dem Beruf"], r: 0 }
]},
{ id: "famiglia", titel: "La famiglia", icon: "👪", situation: "Zwei Freunde schauen sich ein Familienfoto an.", text: `
Sara | Chi è questa signora nella foto? | Wer ist diese Frau auf dem Foto?
Marco | È mia madre. E questo è mio padre. | Das ist meine Mutter. Und das ist mein Vater.
Sara | Hai fratelli? | Hast du Geschwister?
Marco | Sì, ho una sorella e due fratelli. | Ja, ich habe eine Schwester und zwei Brüder.
Sara | E i tuoi nonni? | Und deine Großeltern?
Marco | I miei nonni abitano a Napoli. Hanno un grande giardino. | Meine Großeltern wohnen in Neapel. Sie haben einen großen Garten.
`, fragen: [
  { f: "Wer ist auf dem Foto?", o: ["Marcos Mutter und Vater", "Marcos Großeltern", "Marcos Schwester"], r: 0 },
  { f: "Wie viele Geschwister hat Marco?", o: ["Drei", "Zwei", "Eins"], r: 0 },
  { f: "Wo wohnen die Großeltern?", o: ["In Neapel", "In Rom", "In Mailand"], r: 0 }
]},
{ id: "giornata", titel: "Una giornata", icon: "🕐", situation: "Ein Nachbar fragt nach dem Tagesablauf.", text: `
Paolo | Ciao Elena! A che ora lavori domani? | Hallo Elena! Um wie viel Uhr arbeitest du morgen?
Elena | Lavoro dalle nove alle cinque. | Ich arbeite von neun bis fünf.
Paolo | E a che ora mangi? | Und um wie viel Uhr isst du?
Elena | Mangio all'una con i colleghi. | Ich esse um eins mit den Kollegen.
Paolo | Stasera guardi la partita con noi? | Schaust du heute Abend das Spiel mit uns?
Elena | Sì, volentieri! A che ora? | Ja, gern! Um wie viel Uhr?
Paolo | Alle otto e mezza, a casa mia. | Um halb neun, bei mir zu Hause.
`, fragen: [
  { f: "Wann arbeitet Elena morgen?", o: ["Von 9 bis 17 Uhr", "Von 8 bis 16 Uhr", "Von 9 bis 15 Uhr"], r: 0 },
  { f: "Mit wem isst sie zu Mittag?", o: ["Mit den Kollegen", "Mit Paolo", "Allein"], r: 0 },
  { f: "Wann und wo ist das Spiel?", o: ["Um 20:30 Uhr bei Paolo", "Um 20 Uhr im Stadion", "Um 18:30 Uhr in der Bar"], r: 0 }
]},
{ id: "weekend", titel: "Il fine settimana", icon: "⚽", situation: "Zwei Freunde planen das Wochenende.", text: `
Giulia | Che cosa fai questo fine settimana? | Was machst du dieses Wochenende?
Tom | Sabato gioco a calcio. E tu? | Am Samstag spiele ich Fußball. Und du?
Giulia | Io vado al mare, se fa bel tempo. | Ich fahre ans Meer, wenn schönes Wetter ist.
Tom | Che bello! Domenica però piove. | Wie schön! Am Sonntag regnet es allerdings.
Giulia | Allora domenica leggo un libro e guardo un film. | Dann lese ich am Sonntag ein Buch und schaue einen Film.
Tom | Buona idea! Buon fine settimana! | Gute Idee! Schönes Wochenende!
`, fragen: [
  { f: "Was macht Tom am Samstag?", o: ["Er spielt Fußball", "Er fährt ans Meer", "Er schaut einen Film"], r: 0 },
  { f: "Wie wird das Wetter am Sonntag?", o: ["Es regnet", "Es ist heiß", "Es schneit"], r: 0 },
  { f: "Was macht Giulia am Sonntag?", o: ["Lesen und einen Film schauen", "Fußball spielen", "Einkaufen gehen"], r: 0 }
]}
];
