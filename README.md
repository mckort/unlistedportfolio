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

Applikationen beräknar IRR på flera sätt för olika perspektiv:

#### 1. IRR för investerare i första nyemissionen (år 0)
- **Kassaflöden**: Initial investering (år 0), 9 år utan kassaflöden, slutvärde (år 10)
- **Metod**: Newton-Raphson iteration för att lösa NPV = 0
- **Visas**: I sammanfattningssektionen och CSV-export

#### 2. IRR för simulerad ägare (10 år)
- **Kassaflöden**: Initialt andelsvärde (år 0), 10 år utan kassaflöden, slutvärde (år 10)
- **Metod**: Newton-Raphson iteration för att lösa NPV = 0
- **Visas**: I CSV-export som "IRR (10 år simulering)"

#### 3. IRR för förenklad 1-års beräkning
- **Kassaflöden**: Initial investering, förvaltningskostnader, slutvärde (alla år 0)
- **Metod**: Newton-Raphson iteration för att lösa NPV = 0
- **Visas**: I CSV-export som "IRR (1 år)"

#### IRR-beräkning med Newton-Raphson metod
```javascript
// Starta med gissning på 10%
let guess = 0.1;
for (let iter = 0; iter < 100; iter++) {
  let npv = 0;
  let dnpv = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    npv += cashFlows[t] / Math.pow(1 + guess, t);
    if (t > 0) {
      dnpv -= t * cashFlows[t] / Math.pow(1 + guess, t + 1);
    }
  }
  const newGuess = guess - npv / dnpv;
  if (Math.abs(newGuess - guess) < 1e-7) { 
    return newGuess * 100; // Returnera som procent
  }
  guess = newGuess;
}
```

**Notera**: IRR kan vara negativ om slutvärdet är lägre än den initiala investeringen.

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

### CSV Export

Exporterar detaljerad sammanfattning till CSV-fil med följande sektioner:

#### Sammanfattning för investerare i första nyemissionen (år 0)
- **Investerat belopp (MSEK)**: Belopp som investeras år 0
- **Ägarandel efter emission år 0**: Procentuell ägarandel direkt efter första emissionen
- **Ägarandel efter 10 år**: Procentuell ägarandel efter 10 års utspädning
- **Värde efter 10 år (MSEK)**: Slutvärde på investeringen
- **IRR (10 år)**: Internal Rate of Return baserat på faktiska kassaflöden
- **Kassaflöden för IRR**: Array med alla kassaflöden för IRR-beräkning

#### Simulerad ägare efter 10 år
- **Ägarandel efter 10 år**: Procentuell ägarandel för simulerad ägare
- **Värde efter 10 år (MSEK)**: Slutvärde på simulerad ägares andelar
- **IRR (10 år simulering)**: IRR för simulerad ägares investering

#### Resultat
- **Substans (MSEK) år 10**: Slutligt substansvärde
- **Marknadsvärde (MSEK) år 10**: Slutligt marknadsvärde
- **Nytt värde på andelar**: Värde på andelar efter 1 år (förenklad beräkning)
- **Procentuell förändring**: Förändring i andelsvärde efter 1 år
- **IRR (1 år)**: IRR baserat på förenklad 1-års beräkning

**Förbättringar i IRR-beräkning**:
- Newton-Raphson metod för korrekt IRR-beräkning
- Separata IRR-värden för olika perspektiv
- Kassaflöden inkluderas för felsökning
- Hantering av negativa IRR-värden

### Pris per aktie (SEK)
```
```

## CSV Export Format

- The exported CSV uses a semicolon (`;`) as the column separator for best compatibility with Swedish/European spreadsheet software.
- All numbers use a period (`.`) as the decimal separator.
- The “Kassaflöden för IRR” row is quoted and uses ` ; ` as the separator between values, or `"n/a"` if not applicable.
- The export is compatible with Excel, Numbers, and Google Sheets (import as semicolon-separated).

## Testing the Export

To verify the correctness of the CSV export, run:

```bash
node tests/export-tests.js
```

This will run a suite of tests to ensure the export format and values are correct.

## Beräkning av andelsvärde simulerad ägare

Andelsvärdet visar vad den simulerade ägarens aktier är värda vid varje tidpunkt, givet utspädning och förändringar i bolagets marknadsvärde.

**Formel:**

    Andelsvärde simulerad ägare = (Antal aktier simulerad ägare / Totala antalet aktier) × Marknadsvärde (MSEK)

**I kod:**

```js
shareValue = (simOwnerShares / totalShares) * marketValue
```

**Exempel:**

Om den simulerade ägaren har 250 000 aktier, totalt antal aktier är 1 000 000 och marknadsvärdet är 20 MSEK:

    (250 000 / 1 000 000) × 20 = 0,25 × 20 = 5 MSEK

Detta värde tar hänsyn till eventuell utspädning vid nyemissioner (om ägaren inte deltar minskar andelen över tid).