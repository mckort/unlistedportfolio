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