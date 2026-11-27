// Postfach: Claudes Antworten auf Nachrichten aus der App (kommen über data/wuensche.json).
// Format: { datum: "JJJJ-MM-TT HH:MM", bezug: "<genauer Text der Nachricht>" (leer = Nachricht von Claude aus eigenem Anlass),
//   text: "Antwort", karten: [{ it, de }] (Vorschläge zum Übernehmen per ➕), gruppe: "p_restaurant", lektion: "l5" }
// Alle Antworten bleiben stehen (Verlauf). Datenschutz: Die Datei ist öffentlich – keine echten Namen o. Ä.
window.POSTFACH = [
  { datum: "2026-11-27 16:00", bezug: "",
    text: "Willkommen in deinem Postfach! 📬\nHier kannst du mir jederzeit schreiben – oben ins Feld, oder mit einem der Vorschläge (z. B. „Mache eine Karte: …“). Ich antworte hier mit der nächsten Version. Karten, die ich dir vorschlage, übernimmst du mit ➕ – sie kommen dann gleich beim Üben dran.\n\nZum Beispiel dein Satz von vorhin:",
    karten: [
      { it: "Avete un tavolo per due persone?", de: "Haben Sie einen Tisch für zwei Personen?" },
      { it: "Un tavolo per due, per favore.", de: "Einen Tisch für zwei, bitte." }
    ], gruppe: "p_restaurant", lektion: "l5" },
  { datum: "2026-11-27 18:00", id: "lk_l1:Come va?", bezug: "Was ist mit come stai?",
    text: "Come stai? ist auch richtig und zählt jetzt als Antwort. Der Unterschied: Come va? heißt „Wie geht's?“ – ohne Person, passt also für du und Sie. Come stai? = „Wie geht es dir?“ (du), Come sta? = „Wie geht es Ihnen?“ (Sie).",
    karten: [{ it: "Come stai?", de: "Wie geht es dir?" }, { it: "Come sta?", de: "Wie geht es Ihnen?" }], gruppe: "p_begruessung", lektion: "l1" },
  { datum: "2026-11-27 18:00", id: "lk_l1:un po'", bezug: "Wann un poco?",
    text: "un po' ist einfach die Kurzform von un poco – beides ist richtig und zählt jetzt auch. Im Gespräch sagt man fast immer un po' (un po' di pane, parlo un po' d'italiano). un poco hört man eher allein oder betont: „Solo un poco!“",
    karten: [{ it: "Parlo un po' di italiano.", de: "Ich spreche ein bisschen Italienisch." }], gruppe: "p_verstaendigung", lektion: "l1" },
  { datum: "2026-11-27 18:00", id: "lk_l1:Buon fine settimana!", bezug: "Warum nicht buona...",
    text: "Weil il fine settimana männlich ist (fine = Ende ist hier männlich). buono wird vor männlichen Wörtern zu buon: buon giorno, buon viaggio, buon appetito. Bei weiblichen Wörtern heißt es buona: buona sera, buona giornata, buona notte.",
    karten: [{ it: "Buon viaggio!", de: "Gute Reise!" }, { it: "Buona giornata!", de: "Einen schönen Tag!" }], gruppe: "p_begruessung", lektion: "l1" },
  { datum: "2026-11-27 18:00", id: "lk_l1:Sto mangiando.", bezug: "Erklärung",
    text: "stare + -ando/-endo heißt „gerade etwas tun“ – wie im Englischen „I am eating“. Also: sto, stai, sta … + Verbform. -are-Verben → -ando (mangiando, parlando), -ere/-ire-Verben → -endo (leggendo, dormendo). Typische Frage: Che cosa stai facendo? = Was machst du gerade?",
    karten: [{ it: "Che cosa stai facendo?", de: "Was machst du gerade?" }, { it: "Sto leggendo un libro.", de: "Ich lese gerade ein Buch." }], gruppe: "p_alltag", lektion: "l1" },
  { datum: "2026-11-27 18:00", id: "lk_l1:Può parlare più lentamente?", bezug: "Wie sagt man ... etwas langsamer sprechen? Karte erzeugen",
    text: "„Etwas langsamer“ = un po' più lentamente (oder kürzer: un po' più piano). Die Karten habe ich angelegt – mit ➕ kommen sie gleich beim Üben dran.",
    karten: [{ it: "Può parlare un po' più lentamente?", de: "Können Sie etwas langsamer sprechen?" }, { it: "Puoi parlare un po' più piano?", de: "Kannst du etwas langsamer sprechen?" }], gruppe: "p_verstaendigung", lektion: "l1" }
];
