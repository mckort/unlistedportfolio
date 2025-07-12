#!/usr/bin/env node

/**
 * CLI Test Runner för IRR-tester
 * Kör: node tests/run-tests.js
 */

import { runAllTests } from './irr-tests.js';

// Färger för terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.log(colorize('\n' + '='.repeat(80), 'cyan'));
  console.log(colorize('🧪 IRR-TESTSUITE FÖR PORTFÖLJSIMULERING', 'bright'));
  console.log(colorize('='.repeat(80), 'cyan'));
  console.log(colorize('Testar IRR-beräkningar med olika scenarier', 'yellow'));
  console.log(colorize('Körs:', 'yellow'), new Date().toLocaleString('sv-SE'));
  console.log(colorize('='.repeat(80), 'cyan') + '\n');
}

function printFooter(results) {
  console.log('\n' + colorize('='.repeat(80), 'cyan'));
  console.log(colorize('📊 SLUTSAMMANFATTNING', 'bright'));
  console.log(colorize('='.repeat(80), 'cyan'));
  
  const successRate = results.successRate;
  const statusColor = successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red';
  const statusEmoji = successRate >= 90 ? '🎉' : successRate >= 70 ? '⚠️' : '💥';
  
  console.log(`${colorize('Totalt antal tester:', 'bright')} ${results.totalTests}`);
  console.log(`${colorize('Godkända tester:', 'green')} ${results.passedTests}`);
  console.log(`${colorize('Underkända tester:', 'red')} ${results.totalTests - results.passedTests}`);
  console.log(`${colorize('Framgångsgrad:', statusColor)} ${statusEmoji} ${successRate.toFixed(1)}%`);
  
  if (successRate === 100) {
    console.log(colorize('\n🎉 ALLA TEST GODKÄNDA! IRR-beräkningarna fungerar perfekt!', 'green'));
  } else if (successRate >= 80) {
    console.log(colorize('\n⚠️  De flesta tester godkända, men några behöver justering.', 'yellow'));
  } else {
    console.log(colorize('\n💥 Många tester underkända. IRR-beräkningarna behöver granskas.', 'red'));
  }
  
  console.log(colorize('='.repeat(80), 'cyan') + '\n');
}

function printDetailedReport(results) {
  console.log(colorize('📋 DETALJERAD RAPPORT:', 'bright'));
  console.log(colorize('-'.repeat(80), 'cyan'));
  
  results.results.forEach((result, index) => {
    const status = result.allPassed ? '✅' : '❌';
    const statusColor = result.allPassed ? 'green' : 'red';
    
    console.log(`${colorize(`${index + 1}.`, 'bright')} ${status} ${colorize(result.scenario, statusColor)}`);
    
    if (result.error) {
      console.log(`   ${colorize('Fel:', 'red')} ${result.error}`);
    } else {
      if (result.oneYearIRR !== null) {
        const oneYearColor = result.oneYearPass ? 'green' : 'red';
        console.log(`   ${colorize('1-års IRR:', 'blue')} ${colorize(result.oneYearIRR.toFixed(2) + '%', oneYearColor)}`);
      }
      if (result.tenYearIRR !== null) {
        const tenYearColor = result.tenYearPass ? 'green' : 'red';
        console.log(`   ${colorize('10-års IRR:', 'blue')} ${colorize(result.tenYearIRR.toFixed(2) + '%', tenYearColor)}`);
      }
      if (result.manualIRR !== null) {
        console.log(`   ${colorize('Manuell IRR:', 'blue')} ${result.manualIRR.toFixed(2)}%`);
      }
    }
    console.log('');
  });
}

function printTestInfo() {
  console.log(colorize('ℹ️  TESTINFORMATION:', 'bright'));
  console.log(colorize('-'.repeat(80), 'cyan'));
  console.log('• Testerna kontrollerar IRR-beräkningar för olika scenarier');
  console.log('• Varje test jämför beräknat värde med förväntat värde');
  console.log('• Tolerans används för att hantera små avrundningsfel');
  console.log('• Manuell validering görs för enkla scenarier');
  console.log(colorize('-'.repeat(80), 'cyan') + '\n');
}

// Huvudfunktion
async function main() {
  try {
    printHeader();
    printTestInfo();
    
    // Kör alla tester
    const results = await runAllTests();
    
    printDetailedReport(results);
    printFooter(results);
    
    // Exit code baserat på framgångsgrad
    process.exit(results.successRate >= 80 ? 0 : 1);
    
  } catch (error) {
    console.error(colorize('\n💥 KRITISKT FEL:', 'red'));
    console.error(colorize(error.message, 'red'));
    console.error(colorize(error.stack, 'red'));
    process.exit(1);
  }
}

// Kör om detta är huvudfilen
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 