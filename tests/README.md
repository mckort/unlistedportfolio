# IRR Test Suite

Detta testpaket validerar IRR-beräkningarna i portföljsimuleringsapplikationen.

## Testscenarier

### 1. Enkel positiv IRR - 100% avkastning på 1 år
- **Scenario**: Initial investering 10 MSEK, slutvärde 20 MSEK efter 1 år
- **Förväntad IRR**: 100%
- **Testar**: Grundläggande IRR-beräkning för positiv avkastning

### 2. Negativ IRR - Förlust på 1 år
- **Scenario**: Initial investering 10 MSEK, slutvärde 5 MSEK efter 1 år
- **Förväntad IRR**: -50%
- **Testar**: IRR-beräkning för negativ avkastning

### 3. Komplex scenario med nyemission och utspädning
- **Scenario**: Initial investering 10 MSEK, nyemission 5 MSEK, tillväxt 20% per år
- **Förväntad IRR**: ~15%
- **Testar**: IRR med utspädning och komplexa kassaflöden

### 4. Hög tillväxt scenario
- **Scenario**: Initial investering 10 MSEK, 50% tillväxt per år i 10 år
- **Förväntad IRR**: ~45%
- **Testar**: IRR för hög tillväxt över lång tid

### 5. Stagnation scenario
- **Scenario**: Initial investering 10 MSEK, ingen tillväxt, bara förvaltningskostnader
- **Förväntad IRR**: ~-10%
- **Testar**: IRR med negativ tillväxt och kostnader

### 6. Exit scenario
- **Scenario**: Initial investering 10 MSEK, exit 5 MSEK år 5, resten tillväxt
- **Förväntad IRR**: ~25%
- **Testar**: IRR med partiell exit under simuleringen

## Körning av tester

### Snabb test (rekommenderat)
```bash
npm test
```

### Alternativt
```bash
npm run test:irr
```

### Verbos test (mer detaljerad output)
```bash
npm run test:verbose
```

### Direkt via Node.js
```bash
node tests/run-tests.js
```

## Testrapport

Testerna genererar en detaljerad rapport som inkluderar:

- **Sammanfattning**: Totalt antal tester, godkända/underkända, framgångsgrad
- **Detaljerad rapport**: Resultat för varje testscenario
- **Färgkodning**: Grön för godkända, röd för underkända tester
- **Exit code**: 0 för framgångsgrad ≥80%, 1 för <80%

## Teststruktur

### `irr-tests.js`
- Innehåller alla testscenarier
- Testar både 1-års och 10-års IRR-beräkningar
- Inkluderar manuell validering för enkla scenarier

### `run-tests.js`
- CLI test runner med färgkodad output
- Detaljerad rapport och sammanfattning
- Hanterar fel och exit codes

## Validering

Varje test validerar:

1. **1-års IRR** (`calculateResults`)
2. **10-års IRR** (`simulateCustomYears`)
3. **Manuell validering** (för enkla scenarier)

Tolerans används för att hantera små avrundningsfel i beräkningar.

## Förväntade resultat

- **Framgångsgrad**: ≥90% för att anses godkänd
- **Tolerans**: 0.1-5% beroende på scenario
- **Exit code**: 0 för framgångsgrad ≥80%

## Felsökning

Om tester misslyckas:

1. Kontrollera att beräkningsfunktionerna fungerar korrekt
2. Verifiera att Newton-Raphson-metoden konvergerar
3. Kontrollera kassaflöden i komplexa scenarier
4. Justera tolerans om nödvändigt

## Utökning

För att lägga till nya testscenarier:

1. Lägg till scenario i `testScenarios`-arrayen i `irr-tests.js`
2. Definiera förväntade värden och tolerans
3. Kör testerna för att validera
4. Uppdatera denna dokumentation 