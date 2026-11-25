// Zusätzliche Wörter NUR für das Wörterbuch (keine Karteikarten).
// Vor allem Grundformen von Wörtern, die in Phrasen und Lektionssätzen vorkommen (z. B. consigliare aus „Che cosa mi consiglia?“).
// Format je Zeile:  italienisch | deutsch
// Verben (Grundform auf -are/-ere/-ire, rückbezüglich auf -arsi/-ersi/-irsi) bekommen im Wörterbuch automatisch ihre Formen.
window.WOERTERBUCH = `
a | in, nach, zu, um (Uhrzeit)
di | von, aus
da | von … her, bei, seit
in | in, nach (bei Ländern)
su | auf, über
per | für, nach (Ziel)
tra / fra | zwischen; in (Zeit: tra due giorni)
al / alla / ai / alle | zum, zur (a + Artikel)
del / della / dei / delle | vom, von der; einige (di + Artikel)
dal / dalla | vom, von der; bei (da + Artikel)
nel / nella | im, in der (in + Artikel)
sul / sulla | auf dem, auf der (su + Artikel)
mi | mir, mich
ti | dir, dich
ci | uns; da, dort
vi | euch
si | sich; man
me | mich, mir (betont: per me)
te | dich, dir (betont: per te)
mio / mia | mein, meine
miei / mie | meine (Mehrzahl)
tuo / tua | dein, deine
tuoi / tue | deine (Mehrzahl)
suo / sua | sein, seine / ihr, ihre / Ihr, Ihre
nostro / nostra | unser, unsere
tutto | alles, ganz
troppo | zu (viel), zu sehr
niente | nichts
nessuno | niemand, kein
qualcosa | etwas
altro | andere; noch etwas
stesso | gleich, derselbe
ancora | noch; wieder
già | schon
più | mehr; (nicht) mehr
meglio | besser (wie: es geht mir besser)
solo | nur; allein
piano | langsam, leise
fuori | draußen
dentro | drinnen
ecco | hier ist, da ist
così | so
abbastanza | ziemlich; genug
bene | gut (wie: mir geht es gut)
benissimo | sehr gut
male | schlecht (wie: mir geht es schlecht)
insieme | zusammen
volentieri | gern
lentamente | langsam
separatamente | getrennt
basta | genug, es reicht
vorrei | ich hätte gern, ich möchte (von volere)
l'aiuto | die Hilfe
l'appetito | der Appetit
l'attenzione | die Aufmerksamkeit; Achtung!
il balcone | der Balkon
il bisogno | das Bedürfnis (aver bisogno di = brauchen)
il colore | die Farbe
la fame | der Hunger
la sete | der Durst
la fretta | die Eile
la ragione | der Grund; die Vernunft (aver ragione = recht haben)
il maschio | der Junge; männlich
la femmina | das Mädchen; weiblich
il gioco | das Spiel
la giornata | der Tag (wie er verläuft)
la serata | der Abend (wie er verläuft)
la volta | das Mal
la lasagna | die Lasagne
l'oliva | die Olive
l'olio d'oliva | das Olivenöl
la passeggiata | der Spaziergang
la persona | die Person
il posto | der Platz
l'andata | die Hinfahrt
il ritorno | die Rückfahrt (andata e ritorno = hin und zurück)
il rumore | der Lärm
il sangue | das Blut
il servizio | die Bedienung, der Service
la televisione | der Fernseher, das Fernsehen
il turista | der Tourist
la vacanza | der Urlaub
il momento | der Moment
la specialità | die Spezialität
il wifi | das WLAN
l'Italia | Italien
la Germania | Deutschland
l'italiano | Italienisch (Sprache); der Italiener
l'inglese | Englisch (Sprache)
italiano | italienisch
tedesco | deutsch; der Deutsche
inglese | englisch
delizioso | köstlich
incluso | inbegriffen
libero | frei
pieno | voll; satt
pronto | fertig, bereit; hallo (am Telefon)
vegetariano | vegetarisch
lento | langsam
consigliare | empfehlen
costare | kosten
significare | bedeuten
offrire | anbieten, spendieren
presentare | vorstellen
ordinare | bestellen
cucinare | kochen
lasciare | lassen, verlassen
ripetere | wiederholen
aiutare | helfen
provare | probieren, anprobieren
salutare | grüßen
prenotare | reservieren
perdere | verlieren
girare | abbiegen, drehen
tornare | zurückkommen
viaggiare | reisen
studiare | lernen, studieren
visitare | besichtigen, besuchen
entrare | hineingehen
cominciare | anfangen
desiderare | wünschen
pensare | denken
credere | glauben
conoscere | kennen, kennenlernen
tenere | halten, behalten
rimanere | bleiben
scegliere | auswählen
salire | einsteigen, hinaufgehen
distare | entfernt sein
volerci | brauchen (Zeit: ci vuole, ci vogliono)
indicare | zeigen, hinweisen
mostrare | zeigen
continuare | weitergehen, fortsetzen
passeggiare | spazieren gehen
pranzare | zu Mittag essen
cenare | zu Abend essen
durare | dauern
noleggiare | mieten (Auto, Fahrrad)
cancellare | streichen, absagen
dispiacere | leidtun (mi dispiace = es tut mir leid)
la pensione | die Rente; die Pension
diretto | direkt
la destra | die rechte Seite (sulla destra)
la sinistra | die linke Seite (sulla sinistra)
il chilometro | der Kilometer
accomodarsi | hereinkommen, Platz nehmen (Si accomodi! = Bitte setzen Sie sich / Kommen Sie herein)
sedersi | sich setzen
lavarsi | sich waschen
svegliarsi | aufwachen
sentirsi | sich fühlen
`;

// Unregelmäßige Verben, die nicht schon in grammatik.js stehen: die sechs Formen im Präsens (io, tu, lui/lei, noi, voi, loro)
window.VERBEN_FORMEN_EXTRA = {
  "piacere":  ["piaccio", "piaci", "piace", "piacciamo", "piacete", "piacciono"],
  "tenere":   ["tengo", "tieni", "tiene", "teniamo", "tenete", "tengono"],
  "rimanere": ["rimango", "rimani", "rimane", "rimaniamo", "rimanete", "rimangono"],
  "scegliere":["scelgo", "scegli", "sceglie", "scegliamo", "scegliete", "scelgono"],
  "salire":   ["salgo", "sali", "sale", "saliamo", "salite", "salgono"],
  "sedersi":  ["mi siedo", "ti siedi", "si siede", "ci sediamo", "vi sedete", "si siedono"]
};
