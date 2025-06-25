# Portföljsimulator – Onoterade Bolag

En avancerad webapp för att simulera värdetillväxt och utspädning i en portfölj av onoterade bolag, med stöd för år-för-år-scenarier, nyemissioner, investeringar, exits och interaktiva grafer.

## Funktioner

### Simulering & Tabell
- **10-årig simulering** med redigerbar tabell:
  - Ange nyemission, tillväxt (%), exit och investering för varje år
  - Varje år visas i två steg: "innan investering" och "efter investering"
  - Tabell och graf uppdateras direkt vid ändringar
  - Alla parametrar kan sparas/laddas som scenario

### Visualisering
- **Interaktiv graf**:
  - Visar andelsvärdets utveckling för originalägare och för investerare som kliver in vid varje emission
  - Varje kurva startar det år en nyemission görs och visar utvecklingen till år 10
  - Hover ger info om emission, utspädning och ägarandel

### Resultat & Export
- **Sammanfattning**:
  - Investerat belopp, ägarandel efter emission, ägarandel efter 10 år, värde efter 10 år, IRR (10 år)
  - Visas för både originalägare och investerare i varje emission
- **CSV-export**:
  - Robust export med sammanfattning, slutvärden och IRR
  - Kassaflöden för IRR inkluderas för felsökning

### Scenarier
- **Spara/ladda scenarier** (inklusive alla tabellrader och parametrar)
- Återställ till standardvärden

## Tabellkolumner och Beräkningslogik

- **Initialt marknadsvärde (MSEK):** Sätts alltid av användaren och används som startvärde år 0 i simuleringen.
- **Pris per aktie (SEK):**
  - Första raden (år 0, innan investering): Visar det inmatade priset per aktie.
  - Övriga rader: Beräknas som Marknadsvärde (SEK) / Totala antalet aktier för respektive rad.
- **Andelsvärde simulerad ägare (MSEK):** Nytt kolumnnamn (tidigare "Andelsvärde (MSEK)").
- **Marknadsvärde år 0:** Sätts alltid till det initiala marknadsvärdet som användaren anger, inte ett statiskt värde.

## Formler och Beräkningar

### Grundläggande Begrepp

#### Substansvärde (NAV - Net Asset Value)
```
Substansvärde = Initialt substansvärde + Nyemissioner + Tillväxt - Förvaltningskostnader + Investeringar - Exits
```

#### Marknadsvärde
```
Marknadsvärde = Substansvärde × (1 - Substansrabatt/100) + Kassa
```

- **För år 0**: Substansrabatten beräknas automatiskt som `(1 - Marknadsvärde / Substansvärde) × 100` och kan inte redigeras manuellt.
- **För år 1 och framåt**: Substansrabatten anges i inputfältet och används för att beräkna marknadsvärdet.

#### Andelsvärde
```
Andelsvärde = Ägarandel (%) × Marknadsvärde
```

### Utspädning vid Nyemissioner

#### Pre-money och Post-money värde
```
Pre-money värde = Marknadsvärde före emission
Post-money värde = Pre-money värde + Nyemissionsbelopp
```

#### Utspädningsfaktor
```
Utspädningsfaktor = Pre-money värde / Post-money värde
Ny ägarandel = Gammal ägarandel × Utspädningsfaktor
Procentuell utspädning = (1 - Utspädningsfaktor) × 100
```

#### Antal nya aktier
```
Pris per aktie före emission = Pre-money värde × 1,000,000 / Antal aktier
Antal nya aktier = Nyemissionsbelopp × 1,000,000 / Pris per aktie före emission
```

### IRR (Internal Rate of Return)

#### Förenklad IRR-beräkning
```
IRR = (Slutvärde - Initial investering - Förvaltningskostnader) / Initial investering × 100
```

#### Avancerad IRR-beräkning (Newton-Raphson)
För mer komplexa kassaflöden används Newton-Raphson-metoden:
```
NPV = Σ(CFt / (1 + r)^t) = 0
dNPV/dr = Σ(-t × CFt / (1 + r)^(t+1))
r_new = r_old - NPV / dNPV/dr
```

### Procentuell Förändring
```
Procentuell förändring = ((Nytt andelsvärde - Initialt andelsvärde) / Initialt andelsvärde) × 100
```

### Årlig Simulering

#### Steg 1: Tillväxt och Kostnader
```
Substansvärde efter tillväxt = Tidigare substansvärde × (1 + Tillväxt%/100)
Kassa efter kostnader = Tidigare kassa - Förvaltningskostnader
```

#### Steg 2: Exit och Investeringar
```
Kassa efter exit = Kassa + Exitbelopp
Substansvärde efter exit = Substansvärde - Exitbelopp
Kassa efter investering = Kassa - Investeringsbelopp
Substansvärde efter investering = Substansvärde + Investeringsbelopp
```

#### Steg 3: Nyemission (om kassa < förvaltningskostnader)
```
Pre-money värde = Marknadsvärde före emission
Post-money värde = Pre-money värde + Nyemissionsbelopp
Utspädningsfaktor = Pre-money värde / Post-money värde
Ny ägarandel = Gammal ägarandel × Utspädningsfaktor
```

### Validering av Inmatningsparametrar

#### Tillåtna värden
- **Initialt marknadsvärde**: > 0
- **Initialt substansvärde**: > 0
- **Substansrabatt**: 0-100%
- **Ägarandel**: 0-100%
- **Nyemissionsbelopp**: ≥ 0
- **Förvaltningskostnader**: ≥ 0
- **Substansökning**: ≥ 0

### Grafdata Generering

#### 5-årig graf med olika tillväxtscenarier
```
För varje tillväxtnivå (0% till 200% av break-even ökning):
- Beräkna tillväxtbelopp = (Break-even ökning × Tillväxt%) / 100
- Simulera 10 år med denna tillväxt
- Spara resultat för varje år

Notera: Break-even beräknas internt för diagramdata men visas inte i UI eller export.
```

### Export-funktioner

#### CSV-export innehåller:
- **Sammanfattning för investerare**: Investerat belopp, ägarandel efter emission, ägarandel efter 10 år, värde efter 10 år, IRR
- **Kassaflöden för IRR**: Array med alla kassaflöden för IRR-beräkning
- **Slutvärden**: Substansvärde, marknadsvärde, andelsvärde, procentuell förändring

### Pris per aktie (SEK)
```
Första raden: Pris per aktie = inmatat värde (SEK)
Övriga rader: Pris per aktie = Marknadsvärde (MSEK) * 1 000 000 / Totala antalet aktier
```

## Installation & Körning

### Förutsättningar
- Node.js (v16+)
- npm

### Kom igång
```bash
git clone <repository-url>
cd investment-co
npm install
npm run dev
```
Öppna [http://localhost:5173](http://localhost:5173)

### Bygg för produktion
```bash
npm run build
npm run preview
```

### Docker & Google Cloud Run
- Bygg och kör med Docker:
```bash
docker build -t portfoljsimulator .
docker run -p 8080:8080 portfoljsimulator
```
- Deploy till Google Cloud Run:
  - Fyll i `.env` enligt `env.example`
  - Kör `./deploy.sh`

## Teknisk översikt

- **React 18** – UI och logik
- **Vite** – Byggverktyg
- **Chart.js** – Diagram
- **CSS3** – Styling
- **Projektstruktur:**
```
src/
  utils/calculations.js   # All beräkningslogik, simulering, export mm
  App.jsx                 # Huvudkomponent, tabell, graf, UI
  main.jsx                # React entry point
  index.css               # Styling
```
- **Beräkningsmodul:**
  - `simulateCustomYears()` – Simulerar hela tabellen/scenariot
  - `exportToCSV()` – Exporterar robust CSV med sammanfattning
  - `validateInputs()`, `calculateResults()`, mm

## Exempel på användning
- Ändra nyemission, tillväxt, exit eller investering för valfritt år
- Se direkt hur utspädning, andelsvärde och IRR påverkas
- Spara/ladda olika scenarier
- Exportera resultat till CSV för vidare analys

## Licens
MIT

## Support
Skapa en issue i projektets repo eller kontakta utvecklingsteamet. 