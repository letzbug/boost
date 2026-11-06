window.UNIPOP_BOOST_CONFIG = {
  // Offizielle UniPop-Quelle (immer aktueller Stand, kein GitHub-Commit-Snapshot)
  DATA_URL: "https://www.unipop.lu/private/trainings.json",

  // ZENTRALE AUSWAHL FÜR ALLE PCs / BROWSER
  // Einmal die Project URL und den "anon public" Key aus Supabase eintragen.
  // Danach sieht jeder Browser dieselbe gespeicherte Auswahl.
  SUPABASE_URL: "https://zphmvlmzptcytaxjstui.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_GngfNJK_hNnsgQ0J9ElxJQ_-z9DYNN8",

  // Nur UniPop-Kurse
  ORGANISER_CODE: "UNIPOP",

  // Kandidaten: 0 bis einschließlich 3 Einschreibungen
  MAX_REGISTRATIONS: 3,

  // Maximal 8 Kurse auf der öffentlichen Seite
  MAX_SELECTED: 8
};
