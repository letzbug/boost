window.UNIPOP_BOOST_CONFIG = {
  // HIER DIE ECHTE FRANK'S-MAGIC-URL EINTRAGEN.
  // Beispiel:
  // DATA_URL: "https://raw.githubusercontent.com/letzbug/franks_magic/b3df21c89a53ca7bc1536aa541f9c1b72077c0e2/data/trainings.json",
  DATA_URL: "https://raw.githubusercontent.com/letzbug/franks_magic/b3df21c89a53ca7bc1536aa541f9c1b72077c0e2/data/trainings.json",

  // Optional: öffentliche Supabase-Konfiguration.
  // Wenn leer, läuft der Prototyp vollständig über localStorage.
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Nur UniPop-Kurse
  ORGANISER_CODE: "UNIPOP",

  // Kandidaten: 0 bis einschließlich 3 Einschreibungen
  MAX_REGISTRATIONS: 3,

  // Maximal 8 Kurse auf der öffentlichen Seite
  MAX_SELECTED: 8
};