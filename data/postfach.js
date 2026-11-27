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
    ], gruppe: "p_restaurant", lektion: "l5" }
];
