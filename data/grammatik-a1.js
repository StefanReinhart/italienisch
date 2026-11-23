// Weitere Lückensätze für das volle A1-Niveau (ergänzt LUECKEN aus grammatik.js).
// optionen = Auswahl für alle Sätze des Sets · o = eigene Auswahl für einen Satz · a = richtige Antwort
Object.assign(window.LUECKEN, {
  fragewoerter: { titel: "Fragewörter", saetze: [
    { s: "___ ti chiami?", o: ["Come", "Dove", "Chi", "Quando"], a: "Come", de: "Wie heißt du?" },
    { s: "___ abiti?", o: ["Dove", "Come", "Quanto", "Chi"], a: "Dove", de: "Wo wohnst du?" },
    { s: "Di ___ sei?", o: ["dove", "come", "chi", "quando"], a: "dove", de: "Woher kommst du?" },
    { s: "___ è quella signora?", o: ["Chi", "Che cosa", "Dove", "Quanto"], a: "Chi", de: "Wer ist die Frau dort?" },
    { s: "___ anni hai?", o: ["Quanti", "Quanto", "Come", "Quale"], a: "Quanti", de: "Wie alt bist du?" },
    { s: "___ costa il caffè?", o: ["Quanto", "Quanti", "Come", "Che cosa"], a: "Quanto", de: "Was kostet der Kaffee?" },
    { s: "___ prendi?", o: ["Che cosa", "Chi", "Dove", "Quando"], a: "Che cosa", de: "Was nimmst du?" },
    { s: "___ arriva il treno?", o: ["Quando", "Quanto", "Chi", "Come"], a: "Quando", de: "Wann kommt der Zug an?" },
    { s: "___ stai?", o: ["Come", "Dove", "Chi", "Che cosa"], a: "Come", de: "Wie geht es dir?" },
    { s: "___ impari l'italiano?", o: ["Perché", "Come", "Quanto", "Chi"], a: "Perché", de: "Warum lernst du Italienisch?" }
  ]},
  unbestimmt: { titel: "un / uno / una / un'", optionen: ["un", "uno", "una", "un'"], saetze: [
    { s: "Vorrei ___ caffè.", a: "un", de: "Ich hätte gern einen Kaffee." },
    { s: "Prendo ___ birra.", a: "una", de: "Ich nehme ein Bier." },
    { s: "___ acqua minerale, per favore.", a: "Un'", de: "Ein Mineralwasser, bitte." },
    { s: "Ho ___ zio a Roma.", a: "uno", de: "Ich habe einen Onkel in Rom." },
    { s: "Vorrei ___ aranciata.", a: "un'", de: "Ich hätte gern eine Orangenlimonade." },
    { s: "Marco è ___ amico.", a: "un", de: "Marco ist ein Freund." },
    { s: "Giulia è ___ amica.", a: "un'", de: "Giulia ist eine Freundin." },
    { s: "Mangio ___ cornetto.", a: "un", de: "Ich esse ein Hörnchen." },
    { s: "Bevo ___ spremuta.", a: "una", de: "Ich trinke einen frischen Saft." },
    { s: "Cerco ___ studente.", a: "uno", de: "Ich suche einen Studenten." },
    { s: "Vorrei ___ bottiglia d'acqua.", a: "una", de: "Ich hätte gern eine Flasche Wasser." },
    { s: "C'è ___ albergo qui vicino?", a: "un", de: "Gibt es hier in der Nähe ein Hotel?" }
  ]},
  possessiv2: { titel: "tuo / tua / suo / sua", optionen: ["tuo", "tua", "suo", "sua"], saetze: [
    { s: "Come si chiama ___ padre?", a: "tuo", de: "Wie heißt dein Vater?" },
    { s: "Come si chiama ___ madre?", a: "tua", de: "Wie heißt deine Mutter?" },
    { s: "___ fratello abita a Roma.", a: "Suo", de: "Sein Bruder wohnt in Rom." },
    { s: "___ moglie è medico.", a: "Sua", de: "Seine Frau ist Ärztin." },
    { s: "Dov'è la ___ macchina?", a: "tua", de: "Wo ist dein Auto?" },
    { s: "Il ___ libro è qui.", a: "tuo", de: "Dein Buch ist hier." },
    { s: "La ___ casa è grande.", a: "sua", de: "Ihr Haus ist groß." },
    { s: "Il ___ cane è piccolo.", a: "suo", de: "Sein Hund ist klein." },
    { s: "___ figlia ha dieci anni.", a: "Tua", de: "Deine Tochter ist zehn." },
    { s: "Il ___ nome è Paolo.", a: "suo", de: "Sein Name ist Paolo." }
  ]},
  adjektiv: { titel: "Endungen der Eigenschaftswörter", saetze: [
    { s: "La macchina è ___.", o: ["rossa", "rosso", "rossi", "rosse"], a: "rossa", de: "Das Auto ist rot." },
    { s: "Il vino è ___.", o: ["rosso", "rossa", "rossi", "rosse"], a: "rosso", de: "Der Wein ist rot." },
    { s: "Le scarpe sono ___.", o: ["nere", "nero", "neri", "nera"], a: "nere", de: "Die Schuhe sind schwarz." },
    { s: "I pantaloni sono ___.", o: ["neri", "nero", "nere", "nera"], a: "neri", de: "Die Hose ist schwarz." },
    { s: "Mia sorella è ___.", o: ["simpatica", "simpatico", "simpatici", "simpatiche"], a: "simpatica", de: "Meine Schwester ist sympathisch." },
    { s: "I bambini sono ___.", o: ["piccoli", "piccolo", "piccole", "piccola"], a: "piccoli", de: "Die Kinder sind klein." },
    { s: "La casa è ___.", o: ["piccola", "piccolo", "piccole", "piccoli"], a: "piccola", de: "Das Haus ist klein." },
    { s: "Le camere sono ___.", o: ["nuove", "nuovo", "nuovi", "nuova"], a: "nuove", de: "Die Zimmer sind neu." },
    { s: "Il museo è ___.", o: ["grande", "granda", "grandi", "grando"], a: "grande", de: "Das Museum ist groß." },
    { s: "Le città sono ___.", o: ["grandi", "grande", "grandie", "grando"], a: "grandi", de: "Die Städte sind groß." },
    { s: "La giacca è ___.", o: ["verde", "verda", "verdi", "verdo"], a: "verde", de: "Die Jacke ist grün." },
    { s: "Ho una camicia ___.", o: ["bianca", "bianco", "bianche", "bianchi"], a: "bianca", de: "Ich habe ein weißes Hemd." }
  ]},
  questo: { titel: "questo / questa / questi / queste", optionen: ["questo", "questa", "questi", "queste"], saetze: [
    { s: "___ giacca è bella.", a: "Questa", de: "Diese Jacke ist schön." },
    { s: "___ pantaloni sono cari.", a: "Questi", de: "Diese Hose ist teuer." },
    { s: "Quanto costa ___ libro?", a: "questo", de: "Was kostet dieses Buch?" },
    { s: "Vorrei ___ scarpe.", a: "queste", de: "Ich hätte gern diese Schuhe." },
    { s: "___ ristorante è buono.", a: "Questo", de: "Dieses Restaurant ist gut." },
    { s: "Prendo ___ mele.", a: "queste", de: "Ich nehme diese Äpfel." },
    { s: "___ ragazzi sono italiani.", a: "Questi", de: "Diese Jungen sind Italiener." },
    { s: "Di chi è ___ borsa?", a: "questa", de: "Wem gehört diese Tasche?" },
    { s: "___ caffè è freddo.", a: "Questo", de: "Dieser Kaffee ist kalt." },
    { s: "Mi piacciono ___ fiori.", a: "questi", de: "Mir gefallen diese Blumen." }
  ]},
  praep: { titel: "di / da / con / per", optionen: ["di", "da", "con", "per"], saetze: [
    { s: "Sono ___ Monaco.", a: "di", de: "Ich bin aus München." },
    { s: "Vengo ___ Roma.", a: "da", de: "Ich komme aus Rom (von Rom her)." },
    { s: "Vado al cinema ___ Anna.", a: "con", de: "Ich gehe mit Anna ins Kino." },
    { s: "Un biglietto ___ Firenze, per favore.", a: "per", de: "Eine Fahrkarte nach Florenz, bitte." },
    { s: "È il libro ___ Marco.", a: "di", de: "Das ist Marcos Buch." },
    { s: "Il treno ___ Milano arriva alle otto.", a: "da", de: "Der Zug aus Mailand kommt um acht an." },
    { s: "Un caffè ___ latte, per favore.", a: "con", de: "Einen Kaffee mit Milch, bitte." },
    { s: "Questo regalo è ___ te.", a: "per", de: "Dieses Geschenk ist für dich." },
    { s: "Parlo ___ mia madre.", a: "con", de: "Ich spreche mit meiner Mutter." },
    { s: "Abito qui ___ due anni.", a: "da", de: "Ich wohne seit zwei Jahren hier." }
  ]},
  uhrzeit: { titel: "Uhrzeit", saetze: [
    { s: "8:30 → ___", o: ["Sono le otto e mezza", "Sono le otto e un quarto", "Sono le nove e mezza"], a: "Sono le otto e mezza", de: "Es ist halb neun." },
    { s: "1:00 → ___", o: ["È l'una", "Sono le una", "È uno"], a: "È l'una", de: "Es ist ein Uhr." },
    { s: "3:15 → ___", o: ["Sono le tre e un quarto", "Sono le tre meno un quarto", "Sono le tre e mezza"], a: "Sono le tre e un quarto", de: "Es ist Viertel nach drei." },
    { s: "9:45 → ___", o: ["Sono le dieci meno un quarto", "Sono le nove meno un quarto", "Sono le nove e mezza"], a: "Sono le dieci meno un quarto", de: "Es ist Viertel vor zehn." },
    { s: "12:00 → ___", o: ["È mezzogiorno", "È mezzanotte", "Sono le dodici e mezza"], a: "È mezzogiorno", de: "Es ist zwölf Uhr mittags." },
    { s: "7:00 → ___", o: ["Sono le sette", "È le sette", "Sono sette ore"], a: "Sono le sette", de: "Es ist sieben Uhr." },
    { s: "um 8 Uhr → ___", o: ["alle otto", "le otto", "a otto"], a: "alle otto", de: "um acht Uhr" },
    { s: "um 1 Uhr → ___", o: ["all'una", "alle una", "a una"], a: "all'una", de: "um ein Uhr" },
    { s: "10:30 → ___", o: ["Sono le dieci e mezza", "Sono le undici e mezza", "Sono le dieci e un quarto"], a: "Sono le dieci e mezza", de: "Es ist halb elf." },
    { s: "0:00 → ___", o: ["È mezzanotte", "È mezzogiorno", "Sono le zero"], a: "È mezzanotte", de: "Es ist Mitternacht." }
  ]},
  reflexiv: { titel: "mi / ti / si / ci", optionen: ["mi", "ti", "si", "ci"], saetze: [
    { s: "Io ___ chiamo Marco.", a: "mi", de: "Ich heiße Marco." },
    { s: "Come ___ chiami?", a: "ti", de: "Wie heißt du?" },
    { s: "Lui ___ alza alle sette.", a: "si", de: "Er steht um sieben auf." },
    { s: "A che ora ___ alzi?", a: "ti", de: "Um wie viel Uhr stehst du auf?" },
    { s: "Noi ___ alziamo presto.", a: "ci", de: "Wir stehen früh auf." },
    { s: "Lei come ___ chiama?", a: "si", de: "Wie heißen Sie?" },
    { s: "Io ___ lavo le mani.", a: "mi", de: "Ich wasche mir die Hände." },
    { s: "Il sabato ___ riposiamo.", a: "ci", de: "Samstags ruhen wir uns aus." },
    { s: "Mia figlia ___ chiama Sara.", a: "si", de: "Meine Tochter heißt Sara." },
    { s: "Tu ___ diverti in Italia?", a: "ti", de: "Amüsierst du dich in Italien?" }
  ]},
  infinitiv: { titel: "posso / devo / voglio + Grundform", saetze: [
    { s: "Posso ___ con la carta?", o: ["pagare", "pago", "paga"], a: "pagare", de: "Kann ich mit Karte zahlen?" },
    { s: "Voglio ___ una camera.", o: ["prenotare", "prenoto", "prenota"], a: "prenotare", de: "Ich will ein Zimmer reservieren." },
    { s: "Devo ___ alle otto.", o: ["partire", "parto", "parte"], a: "partire", de: "Ich muss um acht abfahren." },
    { s: "Puoi ___ la finestra?", o: ["aprire", "apri", "apre"], a: "aprire", de: "Kannst du das Fenster öffnen?" },
    { s: "Vogliamo ___ al mare.", o: ["andare", "andiamo", "vado"], a: "andare", de: "Wir wollen ans Meer fahren." },
    { s: "Dovete ___ il biglietto.", o: ["comprare", "comprate", "compra"], a: "comprare", de: "Ihr müsst die Fahrkarte kaufen." },
    { s: "Non posso ___ oggi.", o: ["venire", "vengo", "viene"], a: "venire", de: "Ich kann heute nicht kommen." },
    { s: "Vorrei ___ un caffè.", o: ["bere", "bevo", "beve"], a: "bere", de: "Ich würde gern einen Kaffee trinken." },
    { s: "Può ___ più piano?", o: ["parlare", "parla", "parlo"], a: "parlare", de: "Können Sie langsamer sprechen?" },
    { s: "Devo ___ a casa.", o: ["tornare", "torno", "torna"], a: "tornare", de: "Ich muss nach Hause zurück." }
  ]},
  haeufigkeit: { titel: "sempre / spesso / qualche volta / mai", optionen: ["sempre", "spesso", "qualche volta", "mai"], saetze: [
    { s: "Bevo ___ il caffè la mattina.", a: "sempre", de: "Ich trinke morgens immer Kaffee." },
    { s: "Non mangio ___ carne.", a: "mai", de: "Ich esse nie Fleisch." },
    { s: "Vado ___ al cinema.", a: "spesso", de: "Ich gehe oft ins Kino." },
    { s: "___ leggo un libro.", a: "Qualche volta", de: "Manchmal lese ich ein Buch." },
    { s: "Lui arriva ___ in ritardo.", a: "sempre", de: "Er kommt immer zu spät." },
    { s: "Non bevo ___ birra.", a: "mai", de: "Ich trinke nie Bier." },
    { s: "Andiamo ___ al mare.", a: "spesso", de: "Wir fahren oft ans Meer." },
    { s: "___ guardo un film italiano.", a: "Qualche volta", de: "Manchmal schaue ich einen italienischen Film." }
  ]}
});
