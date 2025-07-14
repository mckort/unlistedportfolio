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

  // Debug-information för att verifiera beräkningar
  console.log('Beräkningsdebug:', {
    f,
    initialValue,
    newOwnershipShare,
    substanceValue,
    finalMarketValue,
    newValue,
    percentageChange,
    dilutionFactor: params.newIssueAmount > 0 ? (params.initialMarketValue / (params.initialMarketValue + params.newIssueAmount)) : 1
  });

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
  const initialMarketValue = params.initialMarketValue ?? (antalAktier * aktiePris / 1_000_000);

  // Sammanfattning för investerare i första nyemissionen (år 0)
  const invested = parseFloat(yearInputs?.[0]?.newIssue ?? 0) || 0;
  const preMoney = customResults?.[0]?.marketValue ?? 0;
  const postMoney = preMoney + invested;
  const ownershipAfter0 = postMoney === 0 ? 0 : (invested / postMoney) * 100;
  const last = customResults ? customResults[customResults.length-1] : null;
  const ownerAfter10 = last && last.totalShares ? (last.simOwnerShares / last.totalShares) * 100 : 0;
  const valueAfter10 = last && last.totalShares ? (last.simOwnerShares / last.totalShares) * last.marketValue : 0;
  
  // Beräkna IRR baserat på faktiska kassaflöden från simuleringen
  let irr = null;
  let cashFlows = null;
  if (customResults && customResults.length > 0 && invested > 0) {
    cashFlows = [];
    cashFlows.push(-invested);
    for (let year = 1; year < 10; year++) {
      cashFlows.push(0);
    }
    cashFlows.push(valueAfter10);
    if (cashFlows.length === 11 && invested > 0 && valueAfter10 > 0) {
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
          irr = newGuess; 
          break; 
        }
        guess = newGuess;
      }
      if (irr < -0.99) irr = null;
    }
  }

  // Sammanfattning för simulerad ägare (efter 10 år)
  const simOwnerShare = last && last.ownershipShare ? last.ownershipShare : 0;
  const simOwnerValue = last && last.shareValue ? last.shareValue : 0;

  // Slutvärden från sista året
  const finalSubstance = last && last.substanceValue != null ? last.substanceValue : 'n/a';
  const finalMarket = last && last.marketValue != null ? last.marketValue : 'n/a';

  // Helper to format numbers with '.' as decimal and 2 decimals
  function fmt(n) {
    if (typeof n === 'number') return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (typeof n === 'string' && n !== 'n/a') return parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n;
  }

  // Use semicolon as separator
  const sep = ';';

  const csvContent = [
    'Sammanfattning', '', '',
    'Investerare i första nyemissionen (år 0)', '', '',
    `Investerat belopp (MSEK)${sep}${fmt(invested)}${sep}MSEK`,
    `Ägarandel efter emission år 0${sep}${fmt(ownershipAfter0)}${sep}%`,
    `Ägarandel efter 10 år${sep}${fmt(ownerAfter10)}${sep}%`,
    `Värde efter 10 år (MSEK)${sep}${fmt(valueAfter10)}${sep}MSEK`,
    `IRR (10 år)${sep}${irr !== null && !isNaN(irr) ? fmt(irr*100) + '%' : 'n/a'}${sep}`,
    `Kassaflöden för IRR${sep}"${cashFlows ? cashFlows.map(fmt).join(' ; ') : 'n/a'}"${sep}`,
    '',
    'Simulerad ägare efter 10 år', '', '',
    `Ägarandel efter 10 år${sep}${fmt(simOwnerShare)}${sep}%`,
    `Värde efter 10 år (MSEK)${sep}${fmt(simOwnerValue)}${sep}MSEK`,
    `IRR (10 år simulering)${sep}${simulationIRR !== null && !isNaN(simulationIRR) ? fmt(simulationIRR) + '%' : 'n/a'}${sep}`,
    '',
    'Resultat;Värde;Enhet',
    `Substans (MSEK) år 10${sep}${finalSubstance !== 'n/a' ? fmt(finalSubstance) : 'n/a'}${sep}MSEK`,
    `Marknadsvärde (MSEK) år 10${sep}${finalMarket !== 'n/a' ? fmt(finalMarket) : 'n/a'}${sep}MSEK`,
    `Nytt värde på andelar${sep}${results.newValue ? fmt(results.newValue) : 'n/a'}${sep}MSEK`,
    `Procentuell förändring${sep}${results.percentageChange ? fmt(results.percentageChange) : 'n/a'}${sep}%`,
    `IRR (1 år)${sep}${results.irr ? fmt(results.irr) + '%' : 'n/a'}${sep}`,
    '',
    'OBS: IRR kan vara negativ om värdet efter 10 år är lägre än investerat belopp.',
    'IRR (1 år) baseras på förenklad 1-års beräkning.',
    'IRR (10 år) baseras på detaljerad 10-års simulering.',
  ].join('\n');

  if (options.returnString) {
    return csvContent;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'portfoljsimulering_resultat.csv');
  link.style.visibility = 'hidden';
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
  let currentSubstanceValue = params.initialNav;
  let currentMarketValue = params.initialMarketValue;
  let currentOwnershipShare = params.ownershipShare / 100;
  let currentCash = 0;
  let totalInvested = currentOwnershipShare * params.initialMarketValue;
  let totalShares = Number(antalAktier);
  let sharePrice = Number(aktiePris);
  // Track simulated owner's number of shares (does not change unless they invest more)
  let simOwnerShares = Math.round(Number(antalAktier) * currentOwnershipShare);

  // --- ÅR 0 ---
  // 0.1: Före investering
  // Beräkna substansrabatt för år 0 baserat på angivet marknadsvärde och substansvärde
  // För år 0: Substansrabatt = (1 - Marknadsvärde/Substansvärde) * 100
  const calculatedSubstanceDiscount0 = (1 - params.initialMarketValue / currentSubstanceValue) * 100;
  // Använd den beräknade substansrabatten för alla beräkningar år 0
  let marketValue0 = currentSubstanceValue * (1 - calculatedSubstanceDiscount0 / 100) + currentCash;
  
  let totalShares0 = Number(antalAktier);
  results.push({
    year: 0,
    step: 'innan investering',
    substanceValue: currentSubstanceValue,
    marketValue: marketValue0,
    ownershipShare: currentOwnershipShare * 100,
    shareValue: currentOwnershipShare * marketValue0,
    cash: currentCash,
    newIssue: null,
    dilution: null,
    exit: 0,
    investment: 0,
    growth: yearInputs[0]?.growth ?? params.substanceIncreasePercent,
    substanceDiscount: calculatedSubstanceDiscount0,
    totalShares: totalShares0,
    sharePrice: Number(aktiePris),
    simOwnerShares
  });

  // 0.2: Efter investering
  let initialNewIssue = yearInputs[0]?.newIssue ?? params.newIssueAmount;
  let initialDilution = null;
  let oldShares = Number(totalShares);
  let newShares = 0;
  if (initialNewIssue > 0) {
    currentCash += initialNewIssue;
    // Använd den beräknade substansrabatten för år 0
    const preMoneyValue = currentSubstanceValue * (1 - calculatedSubstanceDiscount0 / 100) + (currentCash - initialNewIssue);
    const postMoneyValue = preMoneyValue + initialNewIssue;
    const dilutionFactor = preMoneyValue / postMoneyValue;
    currentOwnershipShare *= dilutionFactor;
    initialDilution = (1 - dilutionFactor) * 100;
    // Räkna ut nya aktier baserat på pris per aktie FÖRE emission
    const pricePerShareBefore = Number(preMoneyValue) * 1_000_000 / Number(oldShares);
    newShares = Math.round(Number(initialNewIssue) * 1_000_000 / pricePerShareBefore);
    totalShares = Number(oldShares) + Number(newShares);
    // simOwnerShares ändras INTE om simulerad ägare inte deltar i emissionen
    // simOwnerShares = newShares; // FEL: kommentera bort denna rad
  }
  // Beräkna marknadsvärde efter investering med den beräknade substansrabatten
  let marketValue1 = currentSubstanceValue * (1 - calculatedSubstanceDiscount0 / 100) + currentCash;
  let totalShares1 = totalShares;
  results.push({
    year: 0,
    step: 'efter investering',
    substanceValue: currentSubstanceValue,
    marketValue: marketValue1,
    ownershipShare: currentOwnershipShare * 100,
    shareValue: currentOwnershipShare * marketValue1,
    cash: currentCash,
    newIssue: initialNewIssue > 0 ? initialNewIssue : null,
    dilution: initialDilution,
    exit: 0,
    investment: 0,
    growth: yearInputs[0]?.growth ?? params.substanceIncreasePercent,
    substanceDiscount: calculatedSubstanceDiscount0,
    totalShares: totalShares1,
    sharePrice: totalShares1 > 0 ? (marketValue1 * 1_000_000) / totalShares1 : 0,
    simOwnerShares,
    oldShares,
    newShares
  });

  // --- ÅR 1 och framåt ---
  for (let year = 1; year < yearInputs.length; year++) {
    // Hämta custom-parametrar för året
    const input = yearInputs[year];
    const newIssue = input?.newIssue ?? params.newIssueAmount;
    const exit = input?.exit ?? 0;
    const investment = input?.investment ?? 0;
    const growthPercentRaw = input?.growth ?? params.substanceIncreasePercent;
    const growthPercent = (typeof growthPercentRaw === 'number' && !isNaN(growthPercentRaw)) ? growthPercentRaw : 0;
    const managementCosts = input?.managementCosts ?? params.managementCosts;
    const substanceDiscount = input?.substanceDiscount ?? params.substanceDiscount;

    // Hantera exit och investering före tillväxt/kostnader
    if (exit > 0) {
      currentCash += exit;
      currentSubstanceValue -= exit;
    }
    if (investment > 0) {
      currentCash -= investment;
      currentSubstanceValue += investment;
    }

    // 1. Tillväxt (procent)
    const growth = currentSubstanceValue * (growthPercent / 100);
    currentSubstanceValue += growth;

    // 2. Dra förvaltningskostnad från kassan innan nyemission
    currentCash -= managementCosts;

    // --- Innan investering ---
    const marketValueBefore = currentSubstanceValue * (1 - substanceDiscount / 100) + currentCash;
    const totalSharesBefore = totalShares;
    results.push({
      year,
      step: 'innan investering',
      substanceValue: currentSubstanceValue,
      marketValue: marketValueBefore,
      ownershipShare: currentOwnershipShare * 100,
      shareValue: currentOwnershipShare * marketValueBefore,
      cash: currentCash,
      newIssue: null,
      dilution: null,
      exit: exit > 0 ? exit : null,
      investment: investment > 0 ? investment : null,
      growth: growthPercent,
      substanceDiscount,
      percentageChange: null,
      totalShares: totalSharesBefore,
      sharePrice: totalSharesBefore > 0 ? (marketValueBefore * 1_000_000) / totalSharesBefore : 0,
      simOwnerShares
    });

    // 2. Nyemission (om > 0)
    let dilution = null;
    oldShares = Number(totalShares);
    newShares = 0;
    if (newIssue > 0) {
      currentCash += newIssue;
      const preMoneyValue = (1 - substanceDiscount / 100) * currentSubstanceValue + (currentCash - newIssue);
      const postMoneyValue = preMoneyValue + newIssue;
      const dilutionFactor = preMoneyValue / postMoneyValue;
      currentOwnershipShare *= dilutionFactor;
      dilution = (1 - dilutionFactor) * 100;
      // Räkna ut nya aktier baserat på pris per aktie FÖRE emission
      const pricePerShareBefore = Number(preMoneyValue) * 1_000_000 / Number(oldShares);
      newShares = Math.round(Number(newIssue) * 1_000_000 / pricePerShareBefore);
      totalShares = Number(oldShares) + Number(newShares);
      sharePrice = (params.initialMarketValue + (newIssue > 0 ? newIssue : 0)) / totalShares;
      // Debug log
      console.log('Emission:', {
        year,
        oldShares,
        newShares,
        totalShares,
        pricePerShareBefore,
        typeof_oldShares: typeof oldShares,
        typeof_newShares: typeof newShares,
        typeof_totalShares: typeof totalShares,
        typeof_pricePerShareBefore: typeof pricePerShareBefore
      });
      // simOwnerShares ändras INTE om simulerad ägare inte deltar i emissionen
    }

    // --- Efter investering ---
    const marketValueAfter = (1 - substanceDiscount / 100) * currentSubstanceValue + currentCash;
    const totalSharesAfter = totalShares;
    const newMarketValueAfter = currentSubstanceValue * (1 - substanceDiscount / 100) + currentCash;
    const shareValueAfter = (simOwnerShares / totalSharesAfter) * marketValueAfter;
    results.push({
      year,
      step: 'efter investering',
      substanceValue: currentSubstanceValue,
      marketValue: newMarketValueAfter,
      ownershipShare: currentOwnershipShare * 100,
      shareValue: shareValueAfter,
      cash: currentCash,
      newIssue: newIssue > 0 ? newIssue : null,
      dilution: newIssue > 0 ? dilution : null,
      exit: exit > 0 ? exit : null,
      investment: investment > 0 ? investment : null,
      growth: growthPercent,
      substanceDiscount,
      percentageChange: ((shareValueAfter - totalInvested) / totalInvested) * 100,
      totalShares: totalSharesAfter,
      sharePrice: totalSharesAfter > 0 ? (marketValueAfter * 1_000_000) / totalSharesAfter : 0,
      simOwnerShares,
      oldShares,
      newShares
    });
  }

  // Beräkna IRR för hela simuleringen
  let simulationIRR = null;
  if (results.length > 0) {
    const initialInvestment = results[0].shareValue; // Initialt värde på andelar
    const finalValue = results[results.length - 1].shareValue; // Slutvärde på andelar
    
    // Skapa kassaflöden för IRR-beräkning
    const cashFlows = [];
    
    // År 0: Initial investering (negativt)
    cashFlows.push(-initialInvestment);
    
    // År 1-10: Inga ytterligare investeringar i denna modell
    for (let year = 1; year <= 10; year++) {
      cashFlows.push(0);
    }
    
    // År 10: Slutvärde (positivt)
    cashFlows.push(finalValue);
    
    // Beräkna IRR med Newton-Raphson metod
    if (cashFlows.length === 12 && initialInvestment > 0 && finalValue > 0) {
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
          simulationIRR = newGuess * 100; // Som procent
          break; 
        }
        guess = newGuess;
      }
      // Visa IRR även om den är låg, så länge den är > -99%
      if (simulationIRR < -99) simulationIRR = null;
    }
  }

  return { results, simulationIRR };
} 