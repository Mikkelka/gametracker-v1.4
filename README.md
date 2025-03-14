# GameTrack

GameTrack er en webapp til at holde styr på din personlige spilsamling og spillehistorik. Applikationen giver dig mulighed for at kategorisere spil efter status, organisere dem efter platform, og holde styr på dine fremskridt.

> **Bemærk**: Dette er den originale version af GameTrack. En nyere Vue.js-baseret version er nu tilgængelig på [https://github.com/Mikkelka/gametracker-v2-vueJS](https://github.com/Mikkelka/gametracker-v2-vueJS).

## ✨ Funktioner

- **Kategorisering**: Organiser dine spil i seks forskellige kategorier (Vil spille, Spiller nu, Gennemført, På pause, Droppet, Ser frem til)
- **Platformhåndtering**: Tilføj og tilpas platforme med brugerdefinerede farver
- **Drag and drop**: Nem reorganisering af spil via drag and drop
- **Realtidssynkronisering**: Automatisk synkronisering med Firebase
- **Responsivt design**: Optimeret til alle enheder
- **Brugervenligt interface**: Intuitivt design for nem navigation og brug
- **Mørkt tema**: Behageligt design optimeret til langvarig brug
- **Import/Eksport**: Sikkerhedskopier og gendan dine data

## 🛠️ Teknologistack

- **Frontend**: Vanilla JavaScript med modulariseret kodebase
- **Backend/Database**: Firebase (Authentication & Firestore)
- **Styling**: CSS med variabler og modulært design
- **Deployment**: Firebase Hosting

## 🚀 Projektstatus

Dette projekt er nu erstattet af en nyere Vue.js-baseret version, som du kan finde på [https://github.com/Mikkelka/gametracker-v2-vueJS](https://github.com/Mikkelka/gametracker-v2-vueJS). Dette repository bevares til reference og arkiv-formål.

## 📁 Projektstruktur

```
public/
├── css/                  # CSS-filer
│   ├── components/       # Komponent-specifik styling
│   ├── layout/           # Layout styling
│   ├── pages/            # Side-specifik styling
│   └── utilities/        # Hjælpe-styling
├── js/                   # JavaScript filer
│   ├── components/       # UI komponenter
│   ├── services/         # Firebase services
│   └── utils/            # Hjælpefunktioner
├── index.html            # Hovedapp
└── login.html            # Login-side
```

## 🌟 Hovedfunktionalitet

- **Google Authentication**: Sikker login med Google-konto
- **Drag and Drop Interface**: Intuitiv organisering af spil
- **Realtidsopdateringer**: Ændringer synkroniseres automatisk
- **Brugervenligt interface**: Intuitiv navigation og interaktion
- **Mobile-First Design**: Fuldt responsivt brugerinterface

## 👨‍💻 Udviklernoter

Dette projekt bruger en modulær tilgang til JavaScript og CSS, hvor hver funktionalitet er isoleret i sin egen fil. Denne tilgang gør koden mere vedligeholdbar og lettere at forstå.

### Nøglekomponenter:

- **Storage Service**: Håndterer synkronisering med Firestore
- **UI Components**: Modulære UI-komponenter som cards, modals og knapper
- **Drag and Drop**: Håndterer træk-og-slip funktionalitet mellem lister

## 📄 Licens

Dette projekt er licenseret under [MIT License](LICENSE).