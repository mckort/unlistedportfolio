import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  validateInputs,
  calculateResults,
  calculateBreakEven,
  generateChartData,
  simulateCustomYears,
  exportToCSV,
  saveScenario,
  getSavedScenarios,
  loadScenario,
  deleteScenario
} from './utils/calculations';

// Registrera Chart.js komponenter
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Helper function for IRR calculation
function calculateIRRFromCashFlows(cashFlows) {
  // Newton-Raphson method for IRR
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
    if (Math.abs(newGuess - guess) < 1e-7) return newGuess;
    guess = newGuess;
  }
  return guess;
}

function App() {
  const [antalAktier, setAntalAktier] = useState(441862);
  const [aktiePris, setAktiePris] = useState(21);

  // Standardvärden enligt specifikationen
  const defaultParams = {
    initialNav: 50,            // MSEK
    substanceDiscount: 80,     // %
    ownershipShare: 10,        // %
    newIssueAmount: 5,         // MSEK
    managementCosts: 5,        // MSEK
    substanceIncrease: 30,     // MSEK
    substanceIncreasePercent: 20 // % (default för tillväxt i procent)
  };

  // Räkna ut initialMarketValue automatiskt
  const initialMarketValue = antalAktier * aktiePris / 1_000_000; // MSEK

  const [params, setParams] = useState({ ...defaultParams, initialMarketValue });
  const [results, setResults] = useState(null);
  const [breakEven, setBreakEven] = useState(null);
  const [customResults, setCustomResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [yearInputs, setYearInputs] = useState(() => {
    return Array.from({ length: 11 }, () => ({
      newIssue: defaultParams.newIssueAmount,
      exit: 0,
      investment: 0,
      growth: defaultParams.substanceIncreasePercent,
      managementCosts: defaultParams.managementCosts,
      substanceDiscount: defaultParams.substanceDiscount
    }));
  });

  // Ladda sparade scenarier vid start
  useEffect(() => {
    const scenarios = getSavedScenarios();
    setSavedScenarios(scenarios);
  }, []);

  // Beräkna resultat när parametrar ändras (realtidsuppdatering)
  useEffect(() => {
    const validation = validateInputs(params);
    setErrors(validation.errors);

    if (validation.isValid) {
      const calculatedResults = calculateResults(params);
      const calculatedBreakEven = calculateBreakEven(params);
      const customSim = simulateCustomYears(params, yearInputs, antalAktier, aktiePris);
      setResults(calculatedResults);
      setBreakEven(calculatedBreakEven);
      setCustomResults(customSim);
      // chartData kan byggas om på liknande sätt om du vill
    } else {
      setResults(null);
      setBreakEven(null);
      setCustomResults(null);
    }
  }, [params, yearInputs, antalAktier, aktiePris]);

  // När antalAktier eller aktiePris ändras, uppdatera initialMarketValue i params
  useEffect(() => {
    setParams(prev => ({ ...prev, initialMarketValue }));
  }, [antalAktier, aktiePris]);

  // Hantera input-ändringar med realtidsuppdatering
  const handleInputChange = (field, value) => {
    // Hantera tomma fält: spara som '' i state
    const isEmpty = value === '';
    const numValue = isEmpty ? '' : parseFloat(value);
    setParams(prev => ({
      ...prev,
      [field]: numValue
    }));

    // Om ett template-värde ändras, uppdatera yearInputs för alla år där värdet är lika med params (dvs. inte manuellt ändrat)
    if ([
      'newIssueAmount',
      'managementCosts',
      'substanceIncreasePercent',
      'substanceDiscount'
    ].includes(field)) {
      setYearInputs(prev => prev.map((row, i) => {
        // Korrekt mappning av fältnamn
        const key =
          field === 'substanceIncreasePercent' ? 'growth'
          : field === 'newIssueAmount' ? 'newIssue'
          : field;
        // Om värdet är lika med params (dvs. inte manuellt ändrat), uppdatera till nya värdet
        if (row[key] === params[field]) {
          return {
            ...row,
            [key]: numValue
          };
        }
        return row;
      }));
    }
  };

  // Återställ till standardvärden
  const handleReset = () => {
    setParams(defaultParams);
    setYearInputs(Array.from({ length: 11 }, () => ({
      newIssue: defaultParams.newIssueAmount,
      exit: 0,
      investment: 0,
      growth: defaultParams.substanceIncreasePercent,
      managementCosts: defaultParams.managementCosts,
      substanceDiscount: defaultParams.substanceDiscount
    })));
    setSaveMessage('');
  };

  // Spara scenario
  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      setSaveMessage('Ange ett namn för scenariot');
      return;
    }

    const result = saveScenario(scenarioName.trim(), params, yearInputs);
    if (result.success) {
      setSaveMessage('Scenario sparat!');
      setShowSaveDialog(false);
      setScenarioName('');
      // Uppdatera listan med sparade scenarier
      setSavedScenarios(getSavedScenarios());
    } else {
      setSaveMessage('Fel vid sparande: ' + result.error);
    }
  };

  // Ladda scenario
  const handleLoadScenario = (name) => {
    const scenario = loadScenario(name);
    if (scenario) {
      setParams(scenario.params);
      setYearInputs(scenario.yearInputs);
      setShowLoadDialog(false);
      setSaveMessage('Scenario laddat!');
    } else {
      setSaveMessage('Kunde inte ladda scenario');
    }
  };

  // Ta bort scenario
  const handleDeleteScenario = (name) => {
    const result = deleteScenario(name);
    if (result.success) {
      setSavedScenarios(getSavedScenarios());
      setSaveMessage('Scenario borttaget!');
    } else {
      setSaveMessage('Fel vid borttagning: ' + result.error);
    }
  };

  // Exportera till CSV
  const handleExport = () => {
    if (results && breakEven && customResults && yearInputs) {
      exportToCSV(params, results, breakEven, antalAktier, aktiePris, customResults, yearInputs);
    }
  };

  // Hantera ändring i tabellens inputfält
  const handleYearInputChange = (year, field, value) => {
    setYearInputs(prev => {
      const updated = prev.map((row, i) =>
        i === year ? { ...row, [field]: value === '' ? '' : parseFloat(value) } : row
      );
      return updated;
    });
  };

  // Chart.js konfiguration för 5-årig graf
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '5-årig värdetillväxt med nyemissioner',
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const data = context[0].dataset.data[dataIndex];
            if (data.newIssue) {
              return [
                `Nyemission: ${data.newIssue} MSEK`,
                `Utspädning: ${data.dilution?.toFixed(1)}%`,
                `Ägarandel: ${data.ownershipShare?.toFixed(1)}%`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'År',
        },
        type: 'linear',
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1
        }
      },
      y: {
        title: {
          display: true,
          text: 'Procentuell förändring i andelsvärde (%)',
        },
      },
    },
  };

  // Chart.js konfiguration för 10-årig graf med olika investerarperspektiv
  const chartOptions10Year = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '10-årig värdetillväxt - Olika investerarperspektiv',
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const data = context[0].dataset.data[dataIndex];
            if (data.newIssue) {
              return [
                `Nyemission: ${data.newIssue} MSEK`,
                `Utspädning: ${data.dilution?.toFixed(1)}%`,
                `Ägarandel: ${data.ownershipShare?.toFixed(1)}%`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'År',
        },
        type: 'linear',
        min: 0,
        max: 10,
        ticks: {
          stepSize: 1
        }
      },
      y: {
        title: {
          display: true,
          text: 'Procentuell förändring från investering (%)',
        },
      },
    },
  };

  // Förbereder data för grafen
  const prepareChartData = () => {
    if (!chartData) return null;

    // Gruppera data per år
    const datasets = [];
    const increaseLevels = [...new Set(chartData.map(d => d.increasePercent))];
    
    increaseLevels.forEach((level, index) => {
      const yearData = chartData.filter(d => d.increasePercent === level);
      const sortedData = yearData.sort((a, b) => a.year - b.year);
      
      datasets.push({
        label: `${level.toFixed(0)}% av break-even`,
        data: sortedData.map(d => ({
          x: d.year,
          y: d.percentageChange,
          newIssue: d.newIssue,
          dilution: d.dilution,
          ownershipShare: d.ownershipShare
        })),
        borderColor: `hsl(${(index * 360) / increaseLevels.length}, 70%, 50%)`,
        backgroundColor: `hsla(${(index * 360) / increaseLevels.length}, 70%, 50%, 0.1)`,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6
      });
    });

    return { datasets };
  };

  // Förbereder data för 10-årig graf med olika investerarperspektiv
  const prepare10YearChartData = () => {
    if (!customResults) return null;

    const datasets = [];
    
    // Dataset 1: Original investerare (från år 0)
    datasets.push({
      label: 'Original investerare (år 0)',
      data: customResults.map(result => ({
        x: result.year,
        y: result.percentageChange,
        newIssue: result.newIssue,
        dilution: result.dilution,
        ownershipShare: result.ownershipShare
      })),
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.1,
      pointRadius: 4,
      pointHoverRadius: 6
    });

    // Dataset 2-10: Nya investerare som kliver in varje år
    const colors = ['#e74c3c', '#f39c12', '#27ae60', '#9b59b6', '#3498db', '#e67e22', '#1abc9c', '#34495e', '#f1c40f', '#e91e63'];
    
    // Ny logik: hitta alla emissioner på 'efter investering'-rader
    customResults.forEach((entryResult, idx) => {
      if (entryResult.step === 'efter investering' && entryResult.newIssue && entryResult.newIssue > 0) {
        const entryYear = entryResult.year;
        const entryInvestment = entryResult.newIssue;
        const preMoneyValue = entryResult.marketValue;
        const postMoneyValue = preMoneyValue + entryInvestment;
        // Ägarandel EFTER emissionen de deltar i
        const initialOwnershipShare = (entryInvestment / postMoneyValue) * 100;
        let currentOwnershipShare = initialOwnershipShare;
        let entryValue = entryInvestment;
        const entryData = [];
        for (let year = entryYear; year <= 10; year++) {
          // Hitta 'efter investering'-raden för detta år
          const yearResult = customResults.find(r => r.year === year && r.step === 'efter investering');
          if (yearResult) {
            // Utspäd endast av emissioner EFTER inträdesåret
            if (year > entryYear && yearResult.newIssue && yearResult.newIssue > 0) {
              const preMoneyValueDil = yearResult.marketValue;
              const postMoneyValueDil = preMoneyValueDil + yearResult.newIssue;
              const dilutionFactor = preMoneyValueDil / postMoneyValueDil;
              currentOwnershipShare *= dilutionFactor;
            }
            const currentValue = (currentOwnershipShare / 100) * yearResult.marketValue;
            const percentageChange = ((currentValue - entryValue) / entryValue) * 100;
            entryData.push({
              x: year,
              y: percentageChange,
              newIssue: yearResult.newIssue,
              dilution: yearResult.dilution,
              ownershipShare: currentOwnershipShare
            });
          }
        }
        if (entryData.length > 0) {
          datasets.push({
            label: `Ny investerare (år ${entryYear})`,
            data: entryData,
            borderColor: colors[entryYear - 1] || '#000',
            backgroundColor: `${colors[entryYear - 1] || '#000'}20`,
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderDash: [5, 5]
          });
        }
      }
    });

    return { datasets };
  };

  const chartDataConfig = prepareChartData();
  const chart10YearDataConfig = prepare10YearChartData();

  return (
    <div className="container">
      <h1>Portföljsimulator - Onoterade Bolag (10-årig simulering)</h1>
      
      {/* Input-formulär */}
      <div className="form-grid">
        {/* Grupp: Marknadsvärde, antal aktier, pris per aktie */}
        <div className="form-group" style={{ gridColumn: 'span 3', display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
          <div>
            <label>Initialt marknadsvärde (MSEK)</label>
            <div style={{ fontWeight: 600, fontSize: '1.1em', marginTop: 2 }}>{initialMarketValue.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <label>Värde innehav simulerad ägare (MSEK)</label>
            <div style={{ fontWeight: 600, fontSize: '1.1em', marginTop: 2 }}>
              {((params.ownershipShare / 100) * initialMarketValue).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <label htmlFor="antalAktier">Antal aktier</label>
            <input
              id="antalAktier"
              type="number"
              value={antalAktier}
              onChange={(e) => setAntalAktier(parseInt(e.target.value))}
              step="1"
              min="0"
              style={{ width: 120 }}
            />
          </div>
          <div>
            <label htmlFor="aktiePris">Pris per aktie (SEK)</label>
            <input
              id="aktiePris"
              type="number"
              value={aktiePris}
              onChange={(e) => setAktiePris(parseFloat(e.target.value))}
              step="0.01"
              min="0"
              style={{ width: 100 }}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="initialNav">Initialt substansvärde (MSEK)</label>
          <input
            id="initialNav"
            type="number"
            value={params.initialNav}
            onChange={(e) => handleInputChange('initialNav', e.target.value)}
            step="0.1"
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="substanceDiscount">Substansrabatt (%)</label>
          <input
            id="substanceDiscount"
            type="number"
            value={params.substanceDiscount}
            onChange={(e) => handleInputChange('substanceDiscount', e.target.value)}
            step="0.1"
            min="0"
            max="100"
          />
        </div>

        <div className="form-group">
          <label htmlFor="ownershipShare">Initial ägarandel simulerad ägare (%)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              id="ownershipShare"
              type="number"
              value={params.ownershipShare}
              onChange={(e) => handleInputChange('ownershipShare', e.target.value)}
              step="0.1"
              min="0"
              max="100"
              style={{ width: 80 }}
            />
            <span style={{ fontSize: '0.95em', color: '#333', fontWeight: 500 }}>
              Antal aktier simulerad ägare: {(antalAktier * params.ownershipShare / 100).toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <span style={{fontSize: '0.85em', color: '#888'}}>Tabellen visar alltid ägarandel efter utspädning</span>
        </div>

        <div className="form-group">
          <label htmlFor="newIssueAmount">Nyemissionsbelopp (MSEK)</label>
          <input
            id="newIssueAmount"
            type="number"
            value={params.newIssueAmount}
            onChange={(e) => handleInputChange('newIssueAmount', e.target.value)}
            step="0.1"
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="managementCosts">Förvaltningskostnader (MSEK/år)</label>
          <input
            id="managementCosts"
            type="number"
            value={params.managementCosts}
            onChange={(e) => handleInputChange('managementCosts', e.target.value)}
            step="0.1"
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="substanceIncreasePercent">Substansvärdets ökning (%)</label>
          <input
            id="substanceIncreasePercent"
            type="number"
            value={params.substanceIncreasePercent ?? ''}
            onChange={(e) => handleInputChange('substanceIncreasePercent', e.target.value)}
            step="0.1"
            min="-100"
            max="1000"
          />
        </div>
      </div>

      {/* Felmeddelanden */}
      {errors.length > 0 && (
        <div style={{ color: '#e74c3c', marginBottom: '1rem', textAlign: 'left' }}>
          {errors.map((error, index) => (
            <div key={index}>• {error}</div>
          ))}
        </div>
      )}

      {/* Meddelanden */}
      {saveMessage && (
        <div style={{ 
          color: saveMessage.includes('Fel') ? '#e74c3c' : '#27ae60', 
          marginBottom: '1rem', 
          padding: '0.5rem',
          backgroundColor: saveMessage.includes('Fel') ? '#fdf2f2' : '#f0f9ff',
          borderRadius: '4px',
          border: `1px solid ${saveMessage.includes('Fel') ? '#fecaca' : '#bfdbfe'}`
        }}>
          {saveMessage}
        </div>
      )}

      {/* Knappar */}
      <div className="button-group">
        <button className="btn-secondary" onClick={handleReset}>
          Återställ
        </button>
        <button className="btn-primary" onClick={() => setShowSaveDialog(true)}>
          Spara Scenario
        </button>
        <button className="btn-secondary" onClick={() => setShowLoadDialog(true)}>
          Ladda Scenario
        </button>
        {results && (
          <button className="btn-export" onClick={handleExport}>
            Exportera CSV
          </button>
        )}
      </div>

      {/* Spara dialog */}
      {showSaveDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Spara Scenario</h3>
            <input
              type="text"
              placeholder="Ange namn för scenariot"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="modal-input"
            />
            <div className="modal-buttons">
              <button className="modal-button modal-button-cancel" onClick={() => setShowSaveDialog(false)}>
                Avbryt
              </button>
              <button className="modal-button modal-button-primary" onClick={handleSaveScenario}>
                Spara
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ladda dialog */}
      {showLoadDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Ladda Scenario</h3>
            {Object.keys(savedScenarios).length === 0 ? (
              <p>Inga sparade scenarier hittades.</p>
            ) : (
              <div>
                {Object.entries(savedScenarios).map(([name, scenario]) => (
                  <div key={name} className="scenario-item">
                    <div className="scenario-info">
                      <div className="scenario-name">{name}</div>
                      <div className="scenario-date">
                        Sparat: {new Date(scenario.savedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="scenario-actions">
                      <button 
                        className="modal-button modal-button-primary"
                        onClick={() => handleLoadScenario(name)}
                      >
                        Ladda
                      </button>
                      <button 
                        className="modal-button modal-button-danger"
                        onClick={() => handleDeleteScenario(name)}
                      >
                        Ta bort
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-buttons">
              <button className="modal-button modal-button-cancel" onClick={() => setShowLoadDialog(false)}>
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10-årig simuleringstabell med redigerbara fält */}
      {customResults && (
        <div className="results">
          <h2>10-årig simulering (redigerbar)</h2>
          <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
            <strong>Notera:</strong> Du kan ändra Nyemission, Exit, Investering och Tillväxt (%) för varje år direkt i tabellen.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              marginBottom: '1rem',
              fontSize: '0.85rem',
              minWidth: '1200px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '8px 4px', minWidth: '30px' }}>År</th>
                  <th style={{ padding: '8px 4px', minWidth: '80px' }}>Substans (MSEK)</th>
                  <th style={{ padding: '8px 4px', minWidth: '80px' }}>Marknadsvärde (MSEK)</th>
                  <th style={{ padding: '8px 4px', minWidth: '70px' }}>Ägarandel simulerad ägare (%)</th>
                  <th style={{ padding: '8px 4px', minWidth: '80px' }}>Andelsvärde (MSEK)</th>
                  <th style={{ padding: '8px 4px', minWidth: '60px' }}>Kassa (MSEK)</th>
                  <th style={{ padding: '8px 4px', minWidth: '90px' }}>Antal aktier simulerad ägare</th>
                  <th style={{ padding: '8px 4px', minWidth: '90px' }}>Totala antalet aktier</th>
                  <th style={{ padding: '8px 4px', minWidth: '70px' }}>Nyemission (MSEK)</th>
                  <th style={{ padding: '8px 4px', minWidth: '60px' }}>Substansrabatt (%)</th>
                  <th style={{ padding: '8px 4px', minWidth: '60px' }}>Utspädning (%)</th>
                  <th style={{ padding: '8px 4px', minWidth: '60px' }}>Exit (MSEK)</th>
                  <th style={{ padding: '8px 4px', minWidth: '70px' }}>Investering (MSEK)</th>
                  <th style={{ padding: '8px 4px', minWidth: '60px' }}>Tillväxt (%)</th>
                  <th style={{ padding: '8px 4px', minWidth: '70px' }}>Förändring från start (%)</th>
                  <th style={{ padding: '8px 4px', minWidth: '90px' }}>Pris per aktie (SEK)</th>
                  <th style={{ padding: '8px 4px', minWidth: '90px', background: '#ffe' }}>Gamla aktier</th>
                  <th style={{ padding: '8px 4px', minWidth: '90px', background: '#ffe' }}>Nya aktier</th>
                </tr>
              </thead>
              <tbody>
                {customResults.map((result, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td style={{ fontWeight: 'bold', textAlign: 'center', padding: '6px 4px' }}>{result.year}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>{result.substanceValue.toFixed(1)}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>{result.marketValue.toFixed(1)}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>{result.ownershipShare.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>{result.shareValue.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>{result.cash.toFixed(1)}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>{result.simOwnerShares?.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>{result.totalShares?.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                      {result.step === 'efter investering' ? (
                        <input
                          type="number"
                          value={yearInputs[Math.floor(index/2)]?.newIssue ?? ''}
                          min="0"
                          step="0.1"
                          style={{ width: 50, fontSize: '0.8rem', padding: '2px' }}
                          onChange={e => handleYearInputChange(Math.floor(index/2), 'newIssue', e.target.value)}
                          disabled={index === 0 ? false : false}
                        />
                      ) : ''}
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                      <input
                        type="number"
                        value={yearInputs[Math.floor(index/2)]?.substanceDiscount ?? ''}
                        min="0"
                        max="100"
                        step="0.1"
                        style={{ width: 50, fontSize: '0.8rem', padding: '2px' }}
                        onChange={e => handleYearInputChange(Math.floor(index/2), 'substanceDiscount', e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>{result.step === 'efter investering' ? (result.dilution ? result.dilution.toFixed(1) : '-') : ''}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                      {result.step === 'efter investering' ? (
                        <input
                          type="number"
                          value={yearInputs[Math.floor(index/2)]?.exit ?? ''}
                          min="0"
                          step="0.1"
                          style={{ width: 50, fontSize: '0.8rem', padding: '2px' }}
                          onChange={e => handleYearInputChange(Math.floor(index/2), 'exit', e.target.value)}
                        />
                      ) : ''}
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                      {result.step === 'efter investering' ? (
                        <input
                          type="number"
                          value={yearInputs[Math.floor(index/2)]?.investment ?? ''}
                          min="0"
                          step="0.1"
                          style={{ width: 50, fontSize: '0.8rem', padding: '2px' }}
                          onChange={e => handleYearInputChange(Math.floor(index/2), 'investment', e.target.value)}
                        />
                      ) : ''}
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                      <input
                        type="number"
                        value={yearInputs[Math.floor(index/2)]?.growth ?? ''}
                        min="-100"
                        max="1000"
                        step="0.1"
                        style={{ width: 50, fontSize: '0.8rem', padding: '2px' }}
                        onChange={e => handleYearInputChange(Math.floor(index/2), 'growth', e.target.value)}
                      />
                    </td>
                    <td style={{ 
                      textAlign: 'center', 
                      padding: '6px 4px',
                      color: result.percentageChange > 0 ? '#27ae60' : result.percentageChange < 0 ? '#e74c3c' : '#666', 
                      fontWeight: 'bold' 
                    }}>
                      {result.percentageChange ? `${result.percentageChange.toFixed(1)}%` : '-'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>{result.sharePrice ? result.sharePrice.toLocaleString('sv-SE', { maximumFractionDigits: 2 }) : '-'}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px', background: '#ffe' }}>{result.oldShares !== undefined ? result.oldShares.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) : '-'}</td>
                    <td style={{ textAlign: 'center', padding: '6px 4px', background: '#ffe' }}>{result.newShares !== undefined ? result.newShares.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resultat (1 år) */}
      {customResults && customResults.length > 10 && (
        <div className="results">
          <h2>Sammanfattning: Investerare i första nyemissionen (år 0)</h2>
          <div className="results-grid">
            <div className="result-item">
              <div className="result-value">{parseFloat(yearInputs[0]?.newIssue ?? 0).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="result-label">Investerat belopp (MSEK)</div>
            </div>
            <div className="result-item">
              <div className="result-value">{(() => {
                // Ägarandel efter emission år 0
                const invested = parseFloat(yearInputs[0]?.newIssue ?? 0);
                const preMoney = customResults[0].marketValue;
                const postMoney = preMoney + invested;
                if (postMoney === 0) return '0.00';
                return ((invested / postMoney) * 100).toFixed(2);
              })()}%</div>
              <div className="result-label">Ägarandel efter emission år 0</div>
            </div>
            <div className="result-item">
              <div className="result-value">{(() => {
                // Ägarandel efter 10 år
                const last = customResults[customResults.length-1];
                if (!last) return 'n/a';
                const percent = (last.simOwnerShares / last.totalShares) * 100;
                return percent.toFixed(2) + '%';
              })()}</div>
              <div className="result-label">Ägarandel efter 10 år</div>
            </div>
            <div className="result-item">
              <div className="result-value">{(() => {
                // Värde efter 10 år = (antal aktier simulerad ägare år 10) / (totala antalet aktier år 10) * marknadsvärde år 10
                const last = customResults[customResults.length-1];
                if (!last) return 'n/a';
                const value = (last.simOwnerShares / last.totalShares) * last.marketValue;
                return value.toFixed(2);
              })()}</div>
              <div className="result-label">Värde efter 10 år (MSEK)</div>
            </div>
            <div className="result-item">
              <div className="result-value">{(() => {
                const invested = parseFloat(yearInputs[0]?.newIssue ?? 0);
                const last = customResults[customResults.length-1];
                if (!invested || !last) return 'n/a';
                const finalValue = (last.simOwnerShares / last.totalShares) * last.marketValue;
                const cashFlows = [ -invested, ...Array(9).fill(0), finalValue ];
                const irr = calculateIRRFromCashFlows(cashFlows);
                if (isNaN(irr)) return 'n/a';
                return (irr * 100).toFixed(2) + '%';
              })()}</div>
              <div className="result-label">IRR (10 år)</div>
            </div>
          </div>
        </div>
      )}

      {/* Diagram */}
      {chartData && (
        <div className="chart-container">
          <h3>5-årig värdetillväxt med nyemissioner</h3>
          <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
            <strong>Notera:</strong> En initial nyemission på {params.newIssueAmount} MSEK görs år 0. Håll muspekaren över punkterna för att se nyemissioner och utspädning.
          </p>
          <Line options={chartOptions} data={chartDataConfig} />
        </div>
      )}

      {/* 10-årig diagram */}
      {customResults && (
        <div className="chart-container">
          <h3>10-årig värdetillväxt - Olika investerarperspektiv</h3>
          <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
            <strong>Notera:</strong> Diagrammet visar förändringen i andelsvärde från olika investerarperspektiv.
          </p>
          <Line options={chartOptions10Year} data={chart10YearDataConfig} />
        </div>
      )}
    </div>
  );
}

export default App; 