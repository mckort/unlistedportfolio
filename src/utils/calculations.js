/**
 * Beräkningsmodul för portföljsimulering av onoterade bolag
 * Implementerar alla formler från specifikationen
 */

/**
 * Validerar inmatningsparametrar
 * @param {Object} params - Inmatningsparametrar
 * @returns {Object} - Valideringsresultat med errors-array
 */
export function validateInputs(params) {
  const errors = [];
  
  if (params.initialMarketValue <= 0) {
    errors.push("Initialt marknadsvärde måste vara större än 0");
  }
  
  if (params.initialNav <= 0) {
    errors.push("Initialt substansvärde måste vara större än 0");
  }
  
  if (params.substanceDiscount < 0 || params.substanceDiscount > 100) {
    errors.push("Substansrabatt måste vara mellan 0 och 100 procent");
  }
  
  if (params.ownershipShare < 0 || params.ownershipShare > 100) {
    errors.push("Ägarandel måste vara mellan 0 och 100 procent");
  }
  
  if (params.newIssueAmount < 0) {
    errors.push("Nyemissionsbelopp måste vara större än eller lika med 0");
  }
  
  if (params.managementCosts < 0) {
    errors.push("Förvaltningskostnader måste vara större än eller lika med 0");
  }
  
  if (params.substanceIncrease < 0) {
    errors.push("Substansvärdets ökning måste vara större än eller lika med 0");
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Beräknar break-even värdet för substansvärdets ökning (1 år)
 * @param {Object} params - Inmatningsparametrar
 * @returns {Object} - Break-even resultat
 */
export function calculateBreakEven(params) {
  const f = params.ownershipShare / 100; // Ägarandel som decimal
  const initialMarketValue = params.initialMarketValue;
  
  // Break-even formel: f * (0.4 * S) / 3 = f * initialMarketValue
  // Där S är slutligt substansvärde
  // Löser för S: S = (f * initialMarketValue * 3) / (f * 0.4) = initialMarketValue * 3 / 0.4
  const breakEvenSubstanceValue = initialMarketValue * 3 / 0.4;
  
  // Substansvärde efter förvaltningskostnader
  const substanceAfterCosts = params.initialNav + params.newIssueAmount - params.managementCosts;
  
  // Ökning i kronor som behövs för break-even
  const breakEvenIncrease = breakEvenSubstanceValue - substanceAfterCosts;
  
  // Ökning i procent
  const breakEvenIncreasePercent = (breakEvenIncrease / substanceAfterCosts) * 100;
  
  return {
    breakEvenSubstanceValue,
    breakEvenIncrease,
    breakEvenIncreasePercent,
    substanceAfterCosts
  };
}

/**
 * Simulerar 10 års utveckling med årliga nyemissioner
 * @param {Object} params - Inmatningsparametrar
 * @returns {Array} - Array med årliga resultat
 */
export function simulateTenYears(params) {
  const results = [];
  let currentSubstanceValue = params.initialNav;
  let currentMarketValue = params.initialMarketValue;
  let currentOwnershipShare = params.ownershipShare / 100;
  let currentCash = 0; // Börjar med 0 kassa
  let totalInvested = currentOwnershipShare * params.initialMarketValue;
  
  // År 0 (initialt läge)
  results.push({
    year: 0,
    substanceValue: currentSubstanceValue,
    marketValue: currentMarketValue,
    ownershipShare: currentOwnershipShare * 100,
    shareValue: totalInvested,
    cash: currentCash,
    newIssue: null,
    dilution: null
  });
  
  // Initial nyemission år 0 för att fylla kassan till 5 MSEK
  const initialNewIssue = params.newIssueAmount;
  currentCash += initialNewIssue;
  
  // Beräkna utspädning från initial nyemission
  const preMoneyValue = currentMarketValue;
  const postMoneyValue = preMoneyValue + initialNewIssue;
  const dilutionFactor = preMoneyValue / postMoneyValue;
  currentOwnershipShare *= dilutionFactor;
  const initialDilution = (1 - dilutionFactor) * 100;
  
  // Uppdatera år 0 med nyemission
  results[0] = {
    year: 0,
    substanceValue: currentSubstanceValue,
    marketValue: currentMarketValue,
    ownershipShare: currentOwnershipShare * 100,
    shareValue: currentOwnershipShare * currentMarketValue,
    cash: currentCash,
    newIssue: initialNewIssue,
    dilution: initialDilution
  };
  
  // Simulera 10 år
  for (let year = 1; year <= 10; year++) {
    // Öka substansvärde först
    currentSubstanceValue += params.substanceIncrease;
    // Uppdatera marknadsvärde
    currentMarketValue = (1 - params.substanceDiscount / 100) * currentSubstanceValue;

    // Kontrollera om vi behöver nyemission (efter substansökning, innan kostnad)
    let newIssue = null;
    let dilution = null;
    if (currentCash <= params.managementCosts) {
      // Behöver nyemission för att ha tillräckligt med kassa för årets kostnader
      newIssue = params.newIssueAmount;
      currentCash += newIssue;
      currentSubstanceValue += newIssue;
      // Beräkna utspädning baserat på UPPDATERAT marknadsvärde
      const preMoneyValue = currentMarketValue;
      const postMoneyValue = preMoneyValue + newIssue;
      const dilutionFactor = preMoneyValue / postMoneyValue;
      currentOwnershipShare *= dilutionFactor;
      dilution = (1 - dilutionFactor) * 100; // Procentuell utspädning
    }

    // Förbruka förvaltningskostnader under året
    currentCash -= params.managementCosts;

    // Beräkna nytt värde på andelar
    const newShareValue = currentOwnershipShare * currentMarketValue;

    results.push({
      year,
      substanceValue: currentSubstanceValue,
      marketValue: currentMarketValue,
      ownershipShare: currentOwnershipShare * 100,
      shareValue: newShareValue,
      cash: currentCash,
      newIssue,
      dilution,
      percentageChange: ((newShareValue - totalInvested) / totalInvested) * 100
    });
  }
  
  return results;
}

/**
 * Beräknar slutresultat baserat på inmatade parametrar (1 år)
 * @param {Object} params - Inmatningsparametrar
 * @returns {Object} - Beräkningsresultat
 */
export function calculateResults(params) {
  const f = params.ownershipShare / 100; // Ägarandel som decimal

  // 1. Initialt värde på användarens andelar
  const initialValue = f * params.initialMarketValue;

  // 2. Utspädning vid nyemission
  let newOwnershipShare = f;
  if (params.newIssueAmount > 0) {
    // Beräkna utspädning baserat på nyemission
    const preMoneyValue = params.initialMarketValue;
    const postMoneyValue = preMoneyValue + params.newIssueAmount;
    const dilutionFactor = preMoneyValue / postMoneyValue;
    newOwnershipShare = f * dilutionFactor;
  }

  // 3. Substansvärde och marknadsvärde vid årets slut
  let substanceValue = params.initialNav;
  substanceValue += params.newIssueAmount;
  substanceValue -= params.managementCosts;
  substanceValue += params.substanceIncrease;
  const finalMarketValue = (1 - params.substanceDiscount / 100) * substanceValue;

  // 4. Värde på användarens andelar (efter utspädning och substansrabatt)
  const newValue = newOwnershipShare * finalMarketValue;

  // 5. Procentuell förändring
  const percentageChange = initialValue !== 0 ? ((newValue - initialValue) / initialValue) * 100 : 0;

  // 6. IRR-beräkning (korrekt för 1 år: (slutvärde / initial investering) - 1)
  let irr = null;
  if (initialValue > 0) {
    irr = ((newValue / initialValue) - 1) * 100;
  }

  return {
    initialValue,
    newOwnershipShare: newOwnershipShare * 100, // Konvertera tillbaka till procent
    substanceValue,
    finalMarketValue,
    newValue,
    percentageChange,
    irr
  };
}

/**
 * Beräknar IRR baserat på kassaflöden
 * @param {number} initialInvestment - Initial investering
 * @param {number} managementCosts - Förvaltningskostnader (negativt kassaflöde)
 * @param {number} finalValue - Slutvärde
 * @returns {number} - IRR i procent
 */
function calculateIRR(initialInvestment, managementCosts, finalValue) {
  // Förbättrad IRR-beräkning för 1-års period
  // Skapa kassaflöden: [initialInvestment (negativt), managementCosts (negativt), finalValue (positivt)]
  const cashFlows = [-initialInvestment, -managementCosts, finalValue];
  
  // Newton-Raphson metod för IRR-beräkning
  let guess = 0.1; // Starta med 10%
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
  
  // Fallback till enkel beräkning om Newton-Raphson inte konvergerar
  const totalReturn = finalValue - initialInvestment - managementCosts;
  return initialInvestment !== 0 ? (totalReturn / initialInvestment) * 100 : 0;
}

/**
 * Genererar data för 5-årig graf
 * @param {Object} params - Inmatningsparametrar
 * @returns {Array} - Array med data för olika substansökningar över 5 år
 */
export function generateChartData(params) {
  const data = [];
  
  // Generera data för olika substansökningar (0% till 200% av break-even)
  for (let i = 0; i <= 20; i++) {
    const increasePercent = (i / 20) * 200; // 0% till 200%
    const breakEven = calculateBreakEven(params);
    const increaseAmount = (breakEven.breakEvenIncrease * increasePercent) / 100;
    
    // Skapa temporära parametrar med denna ökning
    const tempParams = { ...params, substanceIncrease: increaseAmount };
    const tenYearResults = simulateTenYears(tempParams);
    
    // Lägg till data för varje år
    tenYearResults.forEach(result => {
      data.push({
        year: result.year,
        increasePercent,
        increaseAmount,
        percentageChange: result.percentageChange,
        shareValue: result.shareValue,
        marketValue: result.marketValue,
        ownershipShare: result.ownershipShare,
        newIssue: result.newIssue,
        dilution: result.dilution
      });
    });
  }
  
  return data;
}

/**
 * Sparar ett scenario till localStorage
 * @param {string} name - Namn på scenariot
 * @param {Object} params - Parametrar att spara
 * @param {Array} yearInputs - Array med custom-parametrar för varje år
 * @returns {Object} - Resultat av sparandet
 */
export function saveScenario(name, params, yearInputs) {
  try {
    const savedScenarios = getSavedScenarios();
    savedScenarios[name] = {
      params,
      yearInputs,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('portfolioScenarios', JSON.stringify(savedScenarios));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Hämtar alla sparade scenarier från localStorage
 * @returns {Object} - Objekt med sparade scenarier
 */
export function getSavedScenarios() {
  try {
    const saved = localStorage.getItem('portfolioScenarios');
    if (!saved) return {};
    
    const parsed = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn('Invalid saved scenarios data, clearing localStorage');
      localStorage.removeItem('portfolioScenarios');
      return {};
    }
    
    return parsed;
  } catch (error) {
    console.error('Fel vid läsning av sparade scenarier:', error);
    // Rensa korrupt data
    try {
      localStorage.removeItem('portfolioScenarios');
    } catch (e) {
      console.error('Kunde inte rensa localStorage:', e);
    }
    return {};
  }
}

/**
 * Laddar ett sparat scenario
 * @param {string} name - Namn på scenariot att ladda
 * @returns {Object|null} - Scenario parametrar eller null om inte hittat
 */
export function loadScenario(name) {
  try {
    const savedScenarios = getSavedScenarios();
    return savedScenarios[name] || null;
  } catch (error) {
    console.error('Fel vid laddning av scenario:', error);
    return null;
  }
}

/**
 * Tar bort ett sparat scenario
 * @param {string} name - Namn på scenariot att ta bort
 * @returns {Object} - Resultat av borttagningen
 */
export function deleteScenario(name) {
  try {
    const savedScenarios = getSavedScenarios();
    delete savedScenarios[name];
    localStorage.setItem('portfolioScenarios', JSON.stringify(savedScenarios));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Exporterar resultat som CSV
 * @param {Object} params - Inmatningsparametrar
 * @param {Object} results - Beräkningsresultat
 * @param {number} antalAktier - Antal aktier i portföljen
 * @param {number} aktiePris - Aktiepriset i portföljen
 * @param {Array} customResults - Array med custom-resultat för varje år
 * @param {Array} yearInputs - Array med custom-parametrar för varje år
 */
export function exportToCSV(params, results, antalAktier, aktiePris, customResults, yearInputs, simulationIRR, options = {}) {
  // Robust formattering
  function fmt(n) {
    if (n === undefined || n === null || isNaN(n)) return 'n/a';
    if (typeof n === 'number') return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (typeof n === 'string' && n !== 'n/a') return parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n;
  }
  const sep = ';';

  // Hämta rätt rad för emission år 0 och sista rad för 10 år
  const row0 = customResults && customResults.find(r => r.year === 0 && r.step === 'början av året');
  const last = customResults && customResults[customResults.length - 1];
  const invested = parseFloat(yearInputs?.[0]?.newIssue ?? 0);
  const preMoney = params.initialNav * (1 - params.substanceDiscount / 100) + (isNaN(Number(params.initialCash)) ? 0 : Number(params.initialCash));
  const oldShares = Number(antalAktier);
  let newShares = 0;
  let totalNewShares = 0;
  for (let i = 0; i < yearInputs.length; i++) {
    const ni = parseFloat(yearInputs[i]?.newIssue ?? 0);
    if (ni > 0) {
      const pm = i === 0 ? preMoney : customResults.find(r => r.year === i && r.step === 'början av året').marketValue;
      const os = i === 0 ? oldShares : customResults.find(r => r.year === i && r.step === 'början av året').oldShares;
      const pps = pm / os;
      if (i === 0) newShares = ni / pps;
      totalNewShares += ni / pps;
    }
  }
  const totalSharesAfter10 = oldShares + totalNewShares;
  const ownerAfter0 = (newShares > 0 && (oldShares + newShares) > 0) ? (newShares / (oldShares + newShares)) * 100 : 0;
  const ownerAfter10 = (newShares > 0 && totalSharesAfter10 > 0) ? (newShares / totalSharesAfter10) * 100 : 0;
  const valueAfter10 = (newShares > 0 && totalSharesAfter10 > 0 && last && last.marketValue)
    ? (newShares / totalSharesAfter10) * last.marketValue
    : 0;
  let irr = null;
  if (invested > 0 && valueAfter10 > 0) {
    irr = (Math.pow(valueAfter10 / invested, 1/10) - 1) * 100;
  }
  // Simulerad ägare efter 10 år
  const simOwnerShare = last && last.ownershipShare ? last.ownershipShare : 0;
  const simOwnerValue = last && last.shareValue ? last.shareValue : 0;
  const initialSimOwnerShare = customResults && customResults.length > 0 ? customResults[0].ownershipShare : 0;
  const initialSimOwnerValue = customResults && customResults.length > 0 ? customResults[0].shareValue : 0;
  const simOwnerPercentageChange = initialSimOwnerValue !== 0 ? ((simOwnerValue - initialSimOwnerValue) / initialSimOwnerValue) * 100 : 0;
  const simOwnerIRR = (initialSimOwnerValue > 0 && simOwnerValue > 0) ? (Math.pow(simOwnerValue / initialSimOwnerValue, 1/10) - 1) * 100 : null;

  // Bygg CSV-rader
  const csvRows = [
    'Sammanfattning', '', '',
    'Investerare i första nyemissionen (år 0)', '', '',
    `Investerat belopp (MSEK)${sep}${fmt(invested)}${sep}MSEK`,
    `Antal nya aktier (år 0)${sep}${newShares}${sep}st`,
    `Totalt antal aktier efter emission (år 0)${sep}${totalSharesAfter10}${sep}st`,
    `Ägarandel efter emission år 0${sep}${fmt(ownerAfter0)}${sep}%`,
    `Ägarandel efter 10 år${sep}${fmt(ownerAfter10)}${sep}%`,
    `Värde efter 10 år (MSEK)${sep}${fmt(valueAfter10)}${sep}MSEK`,
    `IRR (10 år)${sep}${irr !== null && !isNaN(irr) ? fmt(irr) + '%' : 'n/a'}${sep}`,
    '',
    'Simulerad ägare efter 10 år', '', '',
    `Ägarandel år 0${sep}${fmt(initialSimOwnerShare)}${sep}%`,
    `Ägarandel efter 10 år${sep}${fmt(simOwnerShare)}${sep}%`,
    `Värde efter 10 år (MSEK)${sep}${fmt(simOwnerValue)}${sep}MSEK`,
    `Procentuell förändring (10 år)${sep}${fmt(simOwnerPercentageChange)}${sep}%`,
    `IRR (10 år)${sep}${simOwnerIRR !== null && !isNaN(simOwnerIRR) ? fmt(simOwnerIRR) + '%' : 'n/a'}${sep}`,
    '',
    'OBS: IRR kan vara negativ om värdet efter 10 år är lägre än investerat belopp.'
  ];

  // Om returnString-flaggan är satt, returnera CSV-strängen direkt (för tester)
  if (options.returnString) {
    return csvRows.map(r => r).join('\n');
  }

  // Skapa och ladda ner CSV
  const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(r => r).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'portfoljsimulering_resultat.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Simulerar X års utveckling med redigerbara parametrar per år
 * @param {Object} params - Initiala parametrar (från formuläret)
 * @param {Array} yearInputs - Array med custom-parametrar för varje år
 * @param {number} antalAktier - Antal aktier i portföljen
 * @param {number} aktiePris - Aktiepriset i portföljen
 * @returns {Array} - Array med årliga resultat
 */
export function simulateCustomYears(params, yearInputs, antalAktier, aktiePris) {
  const results = [];
  let currentSubstance = params.initialNav;  // Substans = underliggande tillgångar
  const initialCash = isNaN(Number(params.initialCash)) ? 0 : Number(params.initialCash);
  let currentCash = initialCash; // Sätt currentCash till initialCash direkt
  let currentOwnershipShare = params.ownershipShare / 100;
  let totalShares = Number(antalAktier);
  let simOwnerShares = Math.round(Number(antalAktier) * params.ownershipShare / 100); // Konstant antal aktier för simulerad ägare

  // --- År 0 ---
  let newIssue = yearInputs[0]?.newIssue ?? params.newIssueAmount;
  let dilution = null;
  let newShares = 0;
  // Hantera exit och investering före tillväxt/kostnader (år 0)
  const exit0 = Number(yearInputs[0]?.exit ?? 0);
  const investment0 = Number(yearInputs[0]?.investment ?? 0);
  if (exit0 > 0) {
    currentCash += exit0;
    currentSubstance -= exit0;
  }
  if (investment0 > 0) {
    currentCash -= investment0;
    currentSubstance += investment0;
  }
  // Lägg till emissionen (om någon) på kassan för rad 1
  if (newIssue && !isNaN(newIssue) && Number(newIssue) > 0) {
    currentCash += Number(newIssue);
    // Beräkna antal nya aktier och utspädning för emission år 0
    const preMoneyValue = currentSubstance * (1 - (yearInputs[0]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash - Number(newIssue);
    const pricePerShare = preMoneyValue * 1_000_000 / totalShares;
    newShares = Math.round(Number(newIssue) * 1_000_000 / pricePerShare);
    dilution = (newShares / (totalShares + newShares)) * 100;
    totalShares += newShares;
    // simOwnerShares är konstant
  }
  // Spara rad 1 (början av året) med korrekt kassa och nya aktier
  results.push({
    year: 0,
    step: 'början av året',
    substanceValue: currentSubstance,
    substanceExCash: currentSubstance,
    cash: currentCash,
    marketValue: currentSubstance * (1 - (yearInputs[0]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash,
    ownershipShare: simOwnerShares / totalShares * 100,
    shareValue: (simOwnerShares / totalShares) * (currentSubstance * (1 - (yearInputs[0]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash),
    simOwnerShares,
    totalShares,
    newIssue: newIssue && !isNaN(newIssue) && Number(newIssue) > 0 ? Number(newIssue) : null,
    dilution,
    exit: yearInputs[0]?.exit ?? 0,
    investment: yearInputs[0]?.investment ?? 0,
    growth: yearInputs[0]?.growth ?? params.substanceIncreasePercent,
    substanceDiscount: yearInputs[0]?.substanceDiscount ?? params.substanceDiscount,
    percentageChange: null,
    sharePrice: aktiePris,
    oldShares: totalShares - newShares,
    newShares
  });

  // 3. Tillväxt på substans (underliggande tillgångar)
  let growthPercentRaw = yearInputs[0]?.growth ?? params.substanceIncreasePercent;
  let growthPercent = (typeof growthPercentRaw === 'number' && !isNaN(growthPercentRaw)) ? growthPercentRaw : 0;
  let growth = currentSubstance * (growthPercent / 100);
  currentSubstance += growth;

  // 4. Dra förvaltningskostnad från kassa
  let managementCosts = yearInputs[0]?.managementCosts ?? params.managementCosts;
  currentCash -= managementCosts;

  // 5. Slutet av året
  results.push({
    year: 0,
    step: 'slutet av året',
    substanceValue: currentSubstance,
    substanceExCash: currentSubstance,
    cash: currentCash,
    marketValue: currentSubstance * (1 - (yearInputs[0]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash,
    ownershipShare: simOwnerShares / totalShares * 100,
    shareValue: (simOwnerShares / totalShares) * (currentSubstance * (1 - (yearInputs[0]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash),
    simOwnerShares,
    totalShares,
    newIssue: null,
    dilution: null,
    exit: yearInputs[0]?.exit ?? 0,
    investment: yearInputs[0]?.investment ?? 0,
    growth: growthPercent,
    substanceDiscount: yearInputs[0]?.substanceDiscount ?? params.substanceDiscount,
    percentageChange: null,
    sharePrice: aktiePris,
    oldShares: totalShares,
    newShares: 0
  });

  // --- År 1 och framåt ---
  for (let year = 1; year < yearInputs.length; year++) {
    // Hantera exit och investering före tillväxt/kostnader
    const exit = Number(yearInputs[year]?.exit ?? 0);
    const investment = Number(yearInputs[year]?.investment ?? 0);
    if (exit > 0) {
      currentCash += exit;
      currentSubstance -= exit;
    }
    if (investment > 0) {
      currentCash -= investment;
      currentSubstance += investment;
    }
    // 1. Lägg till emission på kassan direkt (om någon)
    newIssue = yearInputs[year]?.newIssue ?? params.newIssueAmount;
    dilution = null;
    newShares = 0;
    if (newIssue && !isNaN(newIssue) && Number(newIssue) > 0) {
      currentCash += Number(newIssue);
      // Räkna ut utspädning och nya aktier
      const preMoneyValue = currentSubstance * (1 - (yearInputs[year]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash - Number(newIssue);
      const pricePerShare = preMoneyValue * 1_000_000 / totalShares;
      newShares = Math.round(Number(newIssue) * 1_000_000 / pricePerShare);
      dilution = (newShares / (totalShares + newShares)) * 100;
      totalShares += newShares;
      // simOwnerShares är konstant
    }

    // 2. Början av året (kassan inkluderar emissionen)
    results.push({
      year,
      step: 'början av året',
      substanceValue: currentSubstance,
      substanceExCash: currentSubstance,
      cash: currentCash,
      marketValue: currentSubstance * (1 - (yearInputs[year]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash,
      ownershipShare: simOwnerShares / totalShares * 100,
      shareValue: (simOwnerShares / totalShares) * (currentSubstance * (1 - (yearInputs[year]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash),
      simOwnerShares,
      totalShares,
      newIssue: newIssue && !isNaN(newIssue) && Number(newIssue) > 0 ? Number(newIssue) : null,
      dilution,
      exit: yearInputs[year]?.exit ?? 0,
      investment: yearInputs[year]?.investment ?? 0,
      growth: yearInputs[year]?.growth ?? params.substanceIncreasePercent,
      substanceDiscount: yearInputs[year]?.substanceDiscount ?? params.substanceDiscount,
      percentageChange: null,
      sharePrice: aktiePris,
      oldShares: totalShares - newShares,
      newShares
    });

    // 3. Tillväxt på substans (underliggande tillgångar)
    growthPercentRaw = yearInputs[year]?.growth ?? params.substanceIncreasePercent;
    growthPercent = (typeof growthPercentRaw === 'number' && !isNaN(growthPercentRaw)) ? growthPercentRaw : 0;
    growth = currentSubstance * (growthPercent / 100);
    currentSubstance += growth;

    // 4. Dra förvaltningskostnad från kassa
    managementCosts = yearInputs[year]?.managementCosts ?? params.managementCosts;
    currentCash -= managementCosts;

    // 5. Slutet av året
    results.push({
      year,
      step: 'slutet av året',
      substanceValue: currentSubstance,
      substanceExCash: currentSubstance,
      cash: currentCash,
      marketValue: currentSubstance * (1 - (yearInputs[year]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash,
      ownershipShare: simOwnerShares / totalShares * 100,
      shareValue: (simOwnerShares / totalShares) * (currentSubstance * (1 - (yearInputs[year]?.substanceDiscount ?? params.substanceDiscount) / 100) + currentCash),
      simOwnerShares,
      totalShares,
      newIssue: null,
      dilution: null,
      exit: yearInputs[year]?.exit ?? 0,
      investment: yearInputs[year]?.investment ?? 0,
      growth: growthPercent,
      substanceDiscount: yearInputs[year]?.substanceDiscount ?? params.substanceDiscount,
      percentageChange: null,
      sharePrice: aktiePris,
      oldShares: totalShares,
      newShares: 0
    });
  }

  // Beräkna IRR för hela simuleringen (oförändrad)
  let simulationIRR = null;
  if (results.length > 0) {
    const initialInvestment = results[0].shareValue;
    let finalValue = results[results.length - 1].shareValue;
    if (finalValue < 0) finalValue = 0;
    const cashFlows = [];
    cashFlows.push(-initialInvestment);
    for (let year = 1; year <= 10; year++) {
      cashFlows.push(0);
    }
    cashFlows.push(finalValue);
    if (cashFlows.length === 12 && initialInvestment > 0) {
      if (finalValue <= 0.01 * initialInvestment) {
        simulationIRR = -100;
      } else if (finalValue > 0) {
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
            simulationIRR = newGuess * 100;
            break;
          }
          guess = newGuess;
        }
      }
    }
  }
  return { results, simulationIRR };
} 