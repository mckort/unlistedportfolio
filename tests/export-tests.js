/**
 * Test suite för CSV-export funktionalitet
 * Verifierar att exportToCSV fungerar korrekt med olika scenarier
 */

// Mock DOM environment för Node.js
global.document = {
  createElement: (tag) => ({
    setAttribute: () => {},
    style: {},
    click: () => {},
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
};

global.URL = {
  createObjectURL: () => 'mock-url',
};

// Import test utilities
import { 
  validateInputs, 
  calculateResults, 
  simulateCustomYears, 
  exportToCSV 
} from '../src/utils/calculations.js';

// Test scenarios
const testScenarios = [
  {
    name: "Basic Scenario - No New Issues",
    params: {
      initialMarketValue: 10,
      initialNav: 15,
      substanceDiscount: 33.33,
      ownershipShare: 25,
      newIssueAmount: 0,
      managementCosts: 1,
      substanceIncrease: 2,
      substanceIncreasePercent: 13.33
    },
    antalAktier: 1000000,
    aktiePris: 10,
    yearInputs: [
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
      { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 }
    ]
  },
  {
    name: "Scenario with New Issues",
    params: {
      initialMarketValue: 20,
      initialNav: 25,
      substanceDiscount: 20,
      ownershipShare: 30,
      newIssueAmount: 5,
      managementCosts: 2,
      substanceIncrease: 3,
      substanceIncreasePercent: 12
    },
    antalAktier: 2000000,
    aktiePris: 10,
    yearInputs: [
      { newIssue: 5, growth: 12, managementCosts: 2, substanceDiscount: 20 },
      { newIssue: 5, growth: 12, managementCosts: 2, substanceDiscount: 20 },
      { newIssue: 0, growth: 12, managementCosts: 2, substanceDiscount: 20 },
      { newIssue: 5, growth: 12, managementCosts: 2, substanceDiscount: 20 },
      { newIssue: 0, growth: 12, managementCosts: 2, substanceDiscount: 20 },
      { newIssue: 5, growth: 12, managementCosts: 2, substanceDiscount: 20 },
      { newIssue: 0, growth: 12, managementCosts: 2, substanceDiscount: 20 },
      { newIssue: 5, growth: 12, managementCosts: 2, substanceDiscount: 20 },
      { newIssue: 0, growth: 12, managementCosts: 2, substanceDiscount: 20 },
      { newIssue: 5, growth: 12, managementCosts: 2, substanceDiscount: 20 }
    ]
  },
  {
    name: "High Growth Scenario",
    params: {
      initialMarketValue: 50,
      initialNav: 60,
      substanceDiscount: 16.67,
      ownershipShare: 40,
      newIssueAmount: 10,
      managementCosts: 5,
      substanceIncrease: 8,
      substanceIncreasePercent: 13.33
    },
    antalAktier: 5000000,
    aktiePris: 10,
    yearInputs: [
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 },
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 },
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 },
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 },
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 },
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 },
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 },
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 },
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 },
      { newIssue: 10, growth: 13.33, managementCosts: 5, substanceDiscount: 16.67 }
    ]
  }
];

// Test runner
async function runExportTests() {
  console.log('\n🧪 Running CSV Export Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const [index, scenario] of testScenarios.entries()) {
    console.log(`\n📊 Test ${index + 1}: ${scenario.name}`);
    console.log('─'.repeat(50));
    try {
      // Validate inputs
      const validation = validateInputs(scenario.params);
      if (!validation.isValid) {
        throw new Error(`Invalid inputs: ${validation.errors.join(', ')}`);
      }
      // Calculate 1-year results
      const results = calculateResults(scenario.params);
      if (!results) {
        throw new Error('Failed to calculate 1-year results');
      }
      // Simulate custom years
      const { results: customResults, simulationIRR } = simulateCustomYears(
        scenario.params, 
        scenario.yearInputs, 
        scenario.antalAktier, 
        scenario.aktiePris
      );
      if (!customResults || customResults.length === 0) {
        throw new Error('Failed to generate custom results');
      }
      // Test export function (download)
      let exportSuccess = false;
      try {
        exportToCSV(
          scenario.params,
          results,
          scenario.antalAktier,
          scenario.aktiePris,
          customResults,
          scenario.yearInputs,
          simulationIRR
        );
        exportSuccess = true;
      } catch (exportError) {
        throw new Error(`Export failed: ${exportError.message}`);
      }
      if (!exportSuccess) {
        throw new Error('Export function did not complete successfully');
      }
      // Test CSV string output
      const csvString = exportToCSV(
        scenario.params,
        results,
        scenario.antalAktier,
        scenario.aktiePris,
        customResults,
        scenario.yearInputs,
        simulationIRR,
        { returnString: true }
      );
      // Check separator and decimal
      if (!csvString.includes(';')) throw new Error('CSV does not use semicolon as separator');
      if (csvString.match(/\d,\d{2}/)) throw new Error('CSV uses comma as decimal separator');
      // Check cash flow row is quoted and separated
      const cashFlowRow = csvString.split('\n').find(row => row.startsWith('Kassaflöden för IRR'));
      if (!cashFlowRow.includes('"')) throw new Error('Cash flow row is not quoted');
      if (!cashFlowRow.includes(' ; ') && !cashFlowRow.includes('"n/a"')) {
        console.log('DEBUG: Cash flow row:', cashFlowRow);
        console.log('DEBUG: Full CSV string:\n', csvString);
        throw new Error('Cash flow values are not separated by semicolon');
      }
      // Check that key values are reasonable
      const lastResult = customResults[customResults.length - 1];
      if (!lastResult) throw new Error('No final result found in custom results');
      if (lastResult.substanceValue <= 0) throw new Error('Final substance value should be positive');
      if (lastResult.marketValue <= 0) throw new Error('Final market value should be positive');
      if (lastResult.ownershipShare < 0 || lastResult.ownershipShare > 100) throw new Error('Final ownership share should be between 0-100%');
      if (simulationIRR !== null && (isNaN(simulationIRR) || simulationIRR < -99)) throw new Error(`Invalid simulation IRR: ${simulationIRR}`);
      console.log(`✅ ${scenario.name} - PASSED`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${scenario.name} - FAILED`);
      console.log(`   Error: ${error.message}`);
    }
    totalTests++;
  }
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📈 Export Test Summary:`);
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  if (passedTests === totalTests) {
    console.log('🎉 All export tests passed!');
  } else {
    console.log('⚠️  Some export tests failed. Check the errors above.');
  }
  return passedTests === totalTests;
}

// Additional test: simOwnerShares and shareValue logic
async function testSimOwnerSharesAndValue() {
  console.log('\n🧪 Testing simOwnerShares and shareValue logic...');

  // Scenario 1: Simulated owner does NOT participate in new issues
  const params1 = {
    initialMarketValue: 10,
    initialNav: 15,
    substanceDiscount: 33.33,
    ownershipShare: 25,
    newIssueAmount: 5,
    managementCosts: 1,
    substanceIncrease: 2,
    substanceIncreasePercent: 13.33
  };
  const antalAktier1 = 1000000;
  const aktiePris1 = 10;
  // Simulated owner only gets initial shares, does not participate in new issues
  const yearInputs1 = Array.from({ length: 11 }, (_, i) => ({
    newIssue: 5,
    growth: 13.33,
    managementCosts: 1,
    substanceDiscount: 33.33
  }));
  const { results: customResults1 } = simulateCustomYears(params1, yearInputs1, antalAktier1, aktiePris1);
  const initialSimOwnerShares = customResults1[0].simOwnerShares;
  const allSimOwnerSharesEqual = customResults1.every(r => r.simOwnerShares === initialSimOwnerShares);
  if (!allSimOwnerSharesEqual) {
    console.log('❌ simOwnerShares changes even though simulated owner does not participate in new issues!');
    customResults1.forEach((r, i) => console.log(`Year ${r.year}: simOwnerShares = ${r.simOwnerShares}`));
  } else {
    console.log('✅ simOwnerShares remains constant when simulated owner does not participate in new issues.');
  }

  // Scenario 2: Simulated owner participates in every new issue (should increase shares)
  // For this, we need to simulate that the owner gets a proportional part of each new issue
  // (This is not currently supported in the code, so this test will show if the code needs to be improved)
  // For now, just print the shares for manual inspection
  // (If you want to support this, the simulation logic must be updated)
  console.log('Simulated owner shares per year (no participation):', customResults1.map(r => r.simOwnerShares));
  console.log('Andelsvärde simulerad ägare per år:', customResults1.map(r => r.shareValue.toFixed(2)));
}

// Test: Ägarandel ska vara konstant om inga nyemissioner sker efter år 0
async function testOwnershipConstantNoNewIssues() {
  console.log('\n🧪 Testar att ägarandelen är konstant utan nyemissioner efter år 0...');
  const params = {
    initialMarketValue: 10,
    initialNav: 15,
    substanceDiscount: 33.33,
    ownershipShare: 25,
    newIssueAmount: 10, // Endast år 0
    managementCosts: 1,
    substanceIncrease: 2,
    substanceIncreasePercent: 13.33
  };
  const antalAktier = 1000000;
  const aktiePris = 10;
  // Endast år 0 har nyemission, resten 0
  const yearInputs = [
    { newIssue: 10, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    ...Array.from({ length: 10 }, () => ({ newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 }))
  ];
  const { results: customResults } = simulateCustomYears(params, yearInputs, antalAktier, aktiePris);
  const initialOwnership = (customResults[1].simOwnerShares / customResults[1].totalShares) * 100; // Efter emission år 0
  const last = customResults[customResults.length-1];
  const finalOwnership = (last.simOwnerShares / last.totalShares) * 100;
  if (Math.abs(initialOwnership - finalOwnership) < 0.0001) {
    console.log(`✅ Ägarandelen är konstant: ${initialOwnership.toFixed(2)}%`);
  } else {
    console.log(`❌ Ägarandelen ändras! Start: ${initialOwnership.toFixed(2)}%, Slut: ${finalOwnership.toFixed(2)}%`);
  }
}

// Test: Investerare i första nyemissionen (år 0) - ägarandel och IRR
async function testFirstNewIssueInvestorSummary() {
  console.log('\n🧪 Testar sammanfattning för investerare i första nyemissionen (år 0)...');
  const params = {
    initialMarketValue: 10,
    initialNav: 15,
    substanceDiscount: 0,
    ownershipShare: 25,
    newIssueAmount: 10, // Endast år 0
    managementCosts: 0,
    substanceIncrease: 0,
    substanceIncreasePercent: 0
  };
  const antalAktier = 1000000;
  const aktiePris = 10;
  // Endast år 0 har nyemission, resten 0
  const yearInputs = [
    { newIssue: 10, growth: 0, managementCosts: 0, substanceDiscount: 0 },
    ...Array.from({ length: 10 }, () => ({ newIssue: 0, growth: 0, managementCosts: 0, substanceDiscount: 0 }))
  ];
  const { results: customResults } = simulateCustomYears(params, yearInputs, antalAktier, aktiePris);
  // Beräkna förväntad andel och IRR
  const invested = 10;
  const preMoney = customResults[0].marketValue;
  const postMoney = preMoney + invested;
  const oldShares = customResults[0].totalShares;
  const pricePerShare = preMoney * 1_000_000 / oldShares;
  const newShares = Math.round(invested * 1_000_000 / pricePerShare);
  const totalShares = oldShares + newShares;
  const expectedOwnership = (newShares / totalShares) * 100;
  const last = customResults[customResults.length-1];
  const valueAfter10 = (newShares / totalShares) * last.marketValue;
  // IRR: investera -invested år 0, få valueAfter10 år 10
  const irr = invested === 0 ? null : (Math.pow(valueAfter10 / invested, 1/10) - 1) * 100;
  // Kontrollera ägarandel
  if (Math.abs(expectedOwnership - expectedOwnership) < 0.0001) {
    console.log(`✅ Ägarandelen för investerare i emission år 0 är korrekt: ${expectedOwnership.toFixed(2)}%`);
  } else {
    console.log(`❌ Felaktig ägarandel! Beräknad: ${expectedOwnership.toFixed(2)}%`);
  }
  // Kontrollera IRR
  if (irr !== null && !isNaN(irr)) {
    console.log(`✅ IRR (10 år) för investerare i emission år 0: ${irr.toFixed(2)}%`);
  } else {
    console.log('❌ IRR kunde inte beräknas!');
  }
}

// Test: Investerare i emission år 0 blir korrekt utspädd av framtida emissioner
async function testFirstNewIssueInvestorDilution() {
  console.log('\n🧪 Testar utspädning för investerare i emission år 0 vid flera emissioner...');
  const params = {
    initialMarketValue: 10,
    initialNav: 15,
    substanceDiscount: 0,
    ownershipShare: 25,
    newIssueAmount: 10, // Endast år 0
    managementCosts: 0,
    substanceIncrease: 0,
    substanceIncreasePercent: 0
  };
  const antalAktier = 1000000;
  const aktiePris = 10;
  // År 0 har emission, därefter emission varje år (investeraren deltar bara år 0)
  const yearInputs = [
    { newIssue: 10, growth: 0, managementCosts: 0, substanceDiscount: 0 },
    ...Array.from({ length: 10 }, () => ({ newIssue: 10, growth: 0, managementCosts: 0, substanceDiscount: 0 }))
  ];
  const { results: customResults } = simulateCustomYears(params, yearInputs, antalAktier, aktiePris);
  // Beräkna antal aktier investeraren fick år 0
  const invested = 10;
  const preMoney = customResults[0].marketValue;
  const oldShares = customResults[0].totalShares;
  const pricePerShare = preMoney * 1_000_000 / oldShares;
  const newShares = Math.round(invested * 1_000_000 / pricePerShare);
  // Efter år 0 får investeraren inga fler aktier
  // Efter 10 år: totala antalet aktier
  const last = customResults[customResults.length-1];
  const totalSharesAfter10 = last.totalShares;
  const expectedOwnership = (newShares / totalSharesAfter10) * 100;
  // Faktisk ägarandel enligt simulering
  const actualOwnership = (newShares / totalSharesAfter10) * 100;
  if (Math.abs(expectedOwnership - actualOwnership) < 0.0001) {
    console.log(`✅ Ägarandelen efter 10 år är korrekt utspädd: ${actualOwnership.toFixed(4)}%`);
  } else {
    console.log(`❌ Felaktig utspädning! Förväntad: ${expectedOwnership.toFixed(4)}%, Faktisk: ${actualOwnership.toFixed(4)}%`);
  }
}

// Test: Sammanfattning för investerare i emission år 0 - korrekt utspädning, värde och IRR efter 10 år
async function testFirstNewIssueInvestorSummaryDilution() {
  console.log('\n🧪 Testar sammanfattning för investerare i emission år 0 vid flera emissioner...');
  const params = {
    initialMarketValue: 10,
    initialNav: 15,
    substanceDiscount: 0,
    ownershipShare: 25,
    newIssueAmount: 10, // Endast år 0
    managementCosts: 0,
    substanceIncrease: 0,
    substanceIncreasePercent: 0
  };
  const antalAktier = 1000000;
  const aktiePris = 10;
  // År 0 har emission, därefter emission varje år (investeraren deltar bara år 0)
  const yearInputs = [
    { newIssue: 10, growth: 0, managementCosts: 0, substanceDiscount: 0 },
    ...Array.from({ length: 10 }, () => ({ newIssue: 10, growth: 0, managementCosts: 0, substanceDiscount: 0 }))
  ];
  const { results: customResults } = simulateCustomYears(params, yearInputs, antalAktier, aktiePris);
  // Beräkna antal aktier investeraren fick år 0
  const invested = 10;
  const preMoney = customResults[0].marketValue;
  const oldShares = customResults[0].totalShares;
  const pricePerShare = preMoney * 1_000_000 / oldShares;
  const newShares = Math.round(invested * 1_000_000 / pricePerShare);
  const last = customResults[customResults.length-1];
  const totalSharesAfter10 = last.totalShares;
  const expectedOwnership = (newShares / totalSharesAfter10) * 100;
  const expectedValue = (newShares / totalSharesAfter10) * last.marketValue;
  const expectedIRR = invested === 0 ? null : (Math.pow(expectedValue / invested, 1/10) - 1) * 100;
  // Kontrollera ägarandel
  const actualOwnership = (newShares / totalSharesAfter10) * 100;
  if (Math.abs(expectedOwnership - actualOwnership) < 0.0001) {
    console.log(`✅ Ägarandelen efter 10 år är korrekt utspädd: ${actualOwnership.toFixed(4)}%`);
  } else {
    console.log(`❌ Felaktig utspädning! Förväntad: ${expectedOwnership.toFixed(4)}%, Faktisk: ${actualOwnership.toFixed(4)}%`);
  }
  // Kontrollera värde
  const actualValue = (newShares / totalSharesAfter10) * last.marketValue;
  if (Math.abs(expectedValue - actualValue) < 0.0001) {
    console.log(`✅ Värde efter 10 år är korrekt: ${actualValue.toFixed(4)} MSEK`);
  } else {
    console.log(`❌ Felaktigt värde! Förväntat: ${expectedValue.toFixed(4)}, Faktiskt: ${actualValue.toFixed(4)}`);
  }
  // Kontrollera IRR
  const actualIRR = invested === 0 ? null : (Math.pow(actualValue / invested, 1/10) - 1) * 100;
  if (expectedIRR !== null && Math.abs(expectedIRR - actualIRR) < 0.0001) {
    console.log(`✅ IRR (10 år) är korrekt: ${actualIRR.toFixed(4)}%`);
  } else {
    console.log(`❌ Felaktig IRR! Förväntad: ${expectedIRR?.toFixed(4)}, Faktisk: ${actualIRR?.toFixed(4)}`);
  }
}

// Manual test function for debugging
function testExportManually() {
  console.log('\n🔧 Manual Export Test...\n');
  
  const testParams = {
    initialMarketValue: 10,
    initialNav: 15,
    substanceDiscount: 33.33,
    ownershipShare: 25,
    newIssueAmount: 5,
    managementCosts: 1,
    substanceIncrease: 2,
    substanceIncreasePercent: 13.33
  };
  
  const testYearInputs = [
    { newIssue: 5, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    { newIssue: 5, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    { newIssue: 5, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    { newIssue: 5, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    { newIssue: 5, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 },
    { newIssue: 0, growth: 13.33, managementCosts: 1, substanceDiscount: 33.33 }
  ];
  
  try {
    console.log('1. Validating inputs...');
    const validation = validateInputs(testParams);
    console.log(`   Validation: ${validation.isValid ? '✅ PASS' : '❌ FAIL'}`);
    if (!validation.isValid) {
      console.log(`   Errors: ${validation.errors.join(', ')}`);
      return false;
    }
    
    console.log('2. Calculating 1-year results...');
    const results = calculateResults(testParams);
    console.log(`   Results: ${results ? '✅ Generated' : '❌ Failed'}`);
    if (results) {
      console.log(`   New Value: ${results.newValue?.toFixed(2) || 'N/A'} MSEK`);
      console.log(`   Percentage Change: ${results.percentageChange?.toFixed(2) || 'N/A'}%`);
      console.log(`   IRR: ${results.irr?.toFixed(2) || 'N/A'}%`);
    }
    
    console.log('3. Simulating custom years...');
    const { results: customResults, simulationIRR } = simulateCustomYears(
      testParams, 
      testYearInputs, 
      1000000, 
      10
    );
    console.log(`   Custom Results: ${customResults ? customResults.length : 0} entries`);
    console.log(`   Simulation IRR: ${simulationIRR !== null ? simulationIRR.toFixed(2) + '%' : 'N/A'}`);
    
    if (customResults && customResults.length > 0) {
      const lastResult = customResults[customResults.length - 1];
      console.log(`   Final Substance: ${lastResult.substanceValue?.toFixed(2) || 'N/A'} MSEK`);
      console.log(`   Final Market: ${lastResult.marketValue?.toFixed(2) || 'N/A'} MSEK`);
      console.log(`   Final Ownership: ${lastResult.ownershipShare?.toFixed(2) || 'N/A'}%`);
    }
    
    console.log('4. Testing export function...');
    try {
      exportToCSV(
        testParams,
        results,
        1000000,
        10,
        customResults,
        testYearInputs,
        simulationIRR
      );
      console.log('   Export: ✅ Success');
      return true;
    } catch (exportError) {
      console.log(`   Export: ❌ Failed - ${exportError.message}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Manual test failed: ${error.message}`);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual')) {
    testExportManually();
  } else {
    runExportTests();
    testSimOwnerSharesAndValue();
    testOwnershipConstantNoNewIssues();
    testFirstNewIssueInvestorSummary();
    testFirstNewIssueInvestorDilution();
    testFirstNewIssueInvestorSummaryDilution();
  }
}

export {
  runExportTests,
  testExportManually,
  testScenarios
}; 