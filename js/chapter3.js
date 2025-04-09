// js/chapter3.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Ionic Formula Builder ---
    window.buildIonicFormula = function() { // Attach to window for onclick
        const cationSelect = document.getElementById('cation');
        const anionSelect = document.getElementById('anion');
        if (!cationSelect || !anionSelect) return;

        const cationCharge = parseInt(cationSelect.value);
        const anionChargeRaw = parseInt(anionSelect.value);
        const anionChargeAbs = Math.abs(anionChargeRaw);
        const cationSymbol = cationSelect.options[cationSelect.selectedIndex].dataset.symbol;
        const anionSymbol = anionSelect.options[anionSelect.selectedIndex].dataset.symbol;

        if (!cationSymbol || !anionSymbol || isNaN(cationCharge) || isNaN(anionChargeAbs)) {
            setOutput('ionicFormulaOutput', 'Please select valid ions.', 'error'); return;
        }
        if (cationCharge === 0 || anionChargeAbs === 0) {
            setOutput('ionicFormulaOutput', 'Charges cannot be zero.', 'error'); return;
        }

        const lcm = getLowestCommonMultiple(cationCharge, anionChargeAbs); // Function from common.js
        if (lcm === 0) { setOutput('ionicFormulaOutput', 'Invalid charge combination (LCM is zero).', 'error'); return; }

        const cationSubscript = lcm / cationCharge;
        const anionSubscript = lcm / anionChargeAbs;

        // Basic check for polyatomic ions needing parentheses (can be improved)
        const cationNeedsParen = cationSymbol.length > 2 && /[A-Z][a-z]*\d*$/.test(cationSymbol) && cationSubscript > 1;
        const anionNeedsParen = anionSymbol.length > 2 && /[A-Z][a-z]*\d$/.test(anionSymbol) && anionSubscript > 1;

        const displayCation = cationNeedsParen ? `(${cationSymbol})` : cationSymbol;
        const displayAnion = anionNeedsParen ? `(${anionSymbol})` : anionSymbol;

        let plainFormula = (cationSubscript === 1 ? displayCation : `${displayCation}${cationSubscript}`)
                         + (anionSubscript === 1 ? displayAnion : `${displayAnion}${anionSubscript}`);

        const finalFormula = formatFormulaForMathJax(plainFormula); // Function from common.js
        setOutput('ionicFormulaOutput', `Formula: \\( ${finalFormula} \\)`, 'success');
    }

    // --- Equation Balancer ---
    window.checkBalanceH2O = function() {
        const coeffH2 = getElementByIdValue('coeffH2', 'number');
        const coeffO2 = getElementByIdValue('coeffO2', 'number');
        const coeffH2O = getElementByIdValue('coeffH2O', 'number');

        if (coeffH2 === null || coeffO2 === null || coeffH2O === null) {
            setOutput('balanceOutput', 'Please enter all coefficients.', 'error'); return;
        }
        if (coeffH2 <= 0 || coeffO2 <= 0 || coeffH2O <= 0 || !Number.isInteger(coeffH2) || !Number.isInteger(coeffO2) || !Number.isInteger(coeffH2O)) {
            setOutput('balanceOutput', 'Coefficients must be positive integers.', 'error'); return;
        }

        const hReactants = coeffH2 * 2; const oReactants = coeffO2 * 2;
        const hProducts = coeffH2O * 2; const oProducts = coeffH2O * 1;

        if (hReactants === hProducts && oReactants === oProducts) {
            setOutput('balanceOutput', 'Equation is BALANCED!', 'success');
        } else {
            setOutput('balanceOutput', `NOT balanced. Reactants: ${hReactants}H, ${oReactants}O | Products: ${hProducts}H, ${oProducts}O.`, 'error');
        }
    }

    // --- Mr Calculator ---
    window.calculateMr = function() {
         const formula = getElementByIdValue('mrFormulaInput');
         if (!formula) { setOutput('mrOutput', 'Please enter a chemical formula.', 'error'); return; }
         try {
             const mr = calculateMrFromString(formula); // Function from common.js
             const displayFormula = formatFormulaForMathJax(formula);
             setOutput('mrOutput', `Calculated \\( M_r \\) for \\( ${displayFormula} \\) = <strong>${mr.toFixed(1)}</strong>`, 'success');
         }
         catch (error) {
             console.error("Mr Calc Error:", error);
             setOutput('mrOutput', `Error: ${error.message}. Check format.`, 'error');
         }
    }

    // --- Moles/Mass/Particles Calculator ---
    window.calculateMolesMass = function() {
         const mass = getElementByIdValue('massInput', 'number');
         const molarMass = getElementByIdValue('molarMassInput', 'number');
         const moles = getElementByIdValue('molesInput', 'number');
         clearOutput('particlesOutput'); // Clear particle output when calculating mass/moles
         let calculatedValue = null; let resultMessage = ''; const precision = 3;

         const inputsProvided = [mass, molarMass, moles].filter(val => val !== null).length;
         if (inputsProvided !== 2) { setOutput('molesMassOutput', 'Please provide exactly two values.', 'error'); return; }

         try {
             if (moles === null) { // Calculate Moles
                 if (molarMass === null || molarMass <= 0) throw new Error("Valid Molar Mass (>0) required.");
                 if (mass === null || mass < 0) throw new Error("Valid Mass (≥0) required.");
                 calculatedValue = mass / molarMass;
                 resultMessage = `Amount (n) = \\( \\frac{${mass.toFixed(1)} \\, g}{${molarMass.toFixed(1)} \\, g/mol} = \\) <strong>${calculatedValue.toPrecision(precision)} mol</strong>`;
                 const molesInputElement = document.getElementById('molesInput');
                 if (molesInputElement) molesInputElement.value = calculatedValue.toPrecision(precision);
             } else if (mass === null) { // Calculate Mass
                 if (molarMass === null || molarMass <= 0) throw new Error("Valid Molar Mass (>0) required.");
                 if (moles === null || moles < 0) throw new Error("Valid Moles (≥0) required.");
                 calculatedValue = moles * molarMass;
                 resultMessage = `Mass (m) = \\( ${moles.toPrecision(precision)} \\, mol \\times ${molarMass.toFixed(1)} \\, g/mol = \\) <strong>${calculatedValue.toPrecision(precision)} g</strong>`;
                 const massInputElement = document.getElementById('massInput');
                 if (massInputElement) massInputElement.value = calculatedValue.toPrecision(precision);
             } else { // Calculate Molar Mass
                 if (moles === null || moles <= 0) throw new Error("Valid Moles (>0) required.");
                 if (mass === null || mass < 0) throw new Error("Valid Mass (≥0) required.");
                 calculatedValue = mass / moles;
                 resultMessage = `Molar Mass (M) = \\( \\frac{${mass.toFixed(1)} \\, g}{${moles.toPrecision(precision)} \\, mol} = \\) <strong>${calculatedValue.toPrecision(precision)} g/mol</strong>`;
                 const molarMassInputElement = document.getElementById('molarMassInput');
                 if (molarMassInputElement) molarMassInputElement.value = calculatedValue.toPrecision(precision);
             }
             setOutput('molesMassOutput', resultMessage, 'success');
         } catch (error) {
              setOutput('molesMassOutput', `Error: ${error.message}`, 'error');
         }
    }

    window.calculateParticles = function() {
         const moles = getElementByIdValue('molesInput', 'number');
         if (moles === null || moles < 0) {
             setOutput('particlesOutput', 'Need valid moles (≥ 0) to calculate particles.', 'error');
             if (moles !== null) clearOutput('molesMassOutput'); // Clear other calc if moles entered directly
             return;
         }
          if (moles === 0) {
              setOutput('particlesOutput', `Number of Particles = <strong>0</strong>`, 'success'); return;
          }
         const particles = moles * AVOGADRO_CONSTANT; // Constant from common.js
         const avogadroDisplay = AVOGADRO_CONSTANT.toExponential(2).replace('e+', '\\times 10^{') + '}';
         setOutput('particlesOutput', `Particles = \\( ${moles.toPrecision(3)} \\, mol \\times ${avogadroDisplay} \\, mol^{-1} = \\) <strong>${particles.toExponential(3)}</strong>`, 'success');
    }

    window.resetCalc = function() {
         const massInput = document.getElementById('massInput'); if(massInput) massInput.value = '';
         const molarMassInput = document.getElementById('molarMassInput'); if(molarMassInput) molarMassInput.value = '';
         const molesInput = document.getElementById('molesInput'); if(molesInput) molesInput.value = '';
         clearOutput('molesMassOutput');
         clearOutput('particlesOutput');
    }

    // --- Gas Volume Calculator ---
    window.calculateGas = function() {
         const volume = getElementByIdValue('gasVolumeInput', 'number');
         const moles = getElementByIdValue('gasMolesInput', 'number');
         const inputsProvided = [volume, moles].filter(val => val !== null).length;
         const precision = 3; let calculatedValue = null; let resultMessage = '';

         if (inputsProvided !== 1) { setOutput('gasOutput', 'Please provide exactly one value.', 'error'); return; }

         try {
             if (moles === null) { // Calculate Moles from Volume
                 if (volume === null || volume < 0) throw new Error("Valid Volume (≥0 dm³) required.");
                 calculatedValue = volume / MOLAR_GAS_VOLUME_RTP; // Constant from common.js
                 resultMessage = `Amount (n) = \\( \\frac{${volume.toPrecision(precision)} \\, dm^3}{${MOLAR_GAS_VOLUME_RTP} \\, dm^3/mol} = \\) <strong>${calculatedValue.toPrecision(precision)} mol</strong>`;
                 const gasMolesInputElement = document.getElementById('gasMolesInput');
                 if (gasMolesInputElement) gasMolesInputElement.value = calculatedValue.toPrecision(precision);
             } else { // Calculate Volume from Moles
                 if (moles === null || moles < 0) throw new Error("Valid Moles (≥0) required.");
                 calculatedValue = moles * MOLAR_GAS_VOLUME_RTP;
                 resultMessage = `Volume (V) = \\( ${moles.toPrecision(precision)} \\, mol \\times ${MOLAR_GAS_VOLUME_RTP} \\, dm^3/mol = \\) <strong>${calculatedValue.toPrecision(precision)} dm³</strong>`;
                 const gasVolumeInputElement = document.getElementById('gasVolumeInput');
                 if (gasVolumeInputElement) gasVolumeInputElement.value = calculatedValue.toPrecision(precision);
             }
              setOutput('gasOutput', resultMessage, 'success');
         } catch (error) {
             setOutput('gasOutput', `Error: ${error.message}`, 'error');
         }
    }

    window.resetGasCalc = function() {
        const gasVolumeInput = document.getElementById('gasVolumeInput'); if (gasVolumeInput) gasVolumeInput.value = '';
        const gasMolesInput = document.getElementById('gasMolesInput'); if (gasMolesInput) gasMolesInput.value = '';
        clearOutput('gasOutput');
    }

    // --- Concentration Calculator ---
    window.calculateConcentration = function() {
         const moles = getElementByIdValue('concMolesInput', 'number');
         const volume = getElementByIdValue('concVolumeInput', 'number');
         const concentration = getElementByIdValue('concMolDm3Input', 'number');
         const inputsProvided = [moles, volume, concentration].filter(val => val !== null).length;
         const precision = 3; let calculatedValue = null; let resultMessage = '';

         if (inputsProvided !== 2) { setOutput('concOutput', 'Please provide exactly two values.', 'error'); return; }

         try {
             if (concentration === null) { // Calculate Concentration
                 if (moles === null || moles < 0) throw new Error("Valid Moles (≥0) required.");
                 if (volume === null || volume <= 0) throw new Error("Valid Volume (>0 dm³) required.");
                 calculatedValue = moles / volume;
                 resultMessage = `Conc (C) = \\( \\frac{${moles.toPrecision(precision)} \\, mol}{${volume.toPrecision(precision)} \\, dm^3} = \\) <strong>${calculatedValue.toPrecision(precision)} mol/dm³</strong>`;
                 const concMolDm3InputElement = document.getElementById('concMolDm3Input');
                 if(concMolDm3InputElement) concMolDm3InputElement.value = calculatedValue.toPrecision(precision);
             } else if (moles === null) { // Calculate Moles
                 if (concentration === null || concentration < 0) throw new Error("Valid Concentration (≥0 mol/dm³) required.");
                 if (volume === null || volume <= 0) throw new Error("Valid Volume (>0 dm³) required.");
                 calculatedValue = concentration * volume;
                 resultMessage = `Amount (n) = \\( ${concentration.toPrecision(precision)} \\times ${volume.toPrecision(precision)} = \\) <strong>${calculatedValue.toPrecision(precision)} mol</strong>`;
                 const concMolesInputElement = document.getElementById('concMolesInput');
                 if(concMolesInputElement) concMolesInputElement.value = calculatedValue.toPrecision(precision);
             } else { // Calculate Volume
                  if (moles === null || moles < 0) throw new Error("Valid Moles (≥0) required.");
                  if (concentration === null || concentration <= 0) throw new Error("Valid Conc (>0 mol/dm³) required.");
                 calculatedValue = moles / concentration;
                 resultMessage = `Volume (V) = \\( \\frac{${moles.toPrecision(precision)}}{${concentration.toPrecision(precision)}} = \\) <strong>${calculatedValue.toPrecision(precision)} dm³</strong>`;
                 const concVolumeInputElement = document.getElementById('concVolumeInput');
                 if(concVolumeInputElement) concVolumeInputElement.value = calculatedValue.toPrecision(precision);
             }
              setOutput('concOutput', resultMessage, 'success');
         } catch (error) {
             setOutput('concOutput', `Error: ${error.message}`, 'error');
         }
    }

    window.resetConcCalc = function() {
         const concMolesInput = document.getElementById('concMolesInput'); if(concMolesInput) concMolesInput.value = '';
         const concVolumeInput = document.getElementById('concVolumeInput'); if(concVolumeInput) concVolumeInput.value = '';
         const concMolDm3Input = document.getElementById('concMolDm3Input'); if(concMolDm3Input) concMolDm3Input.value = '';
         clearOutput('concOutput');
     }

    // --- Empirical Formula Calculator ---
    window.calculateEmpiricalFormula = function() {
         const elements = [];
         for (let i = 1; i <= 3; i++) {
             const symbol = getElementByIdValue(`el${i}_symbol`);
             const arVal = getElementByIdValue(`el${i}_ar`, 'number'); // Rename var to avoid conflict
             const comp = getElementByIdValue(`el${i}_comp`, 'number');
             if (symbol && arVal !== null && comp !== null) {
                 const correctedSymbol = symbol.length > 0 ? symbol[0].toUpperCase() + symbol.slice(1).toLowerCase() : '';
                 // Use Ar from common.js if not provided or invalid in input, otherwise use input
                 const finalAr = (arVal && arVal > 0) ? arVal : (relativeAtomicMasses.hasOwnProperty(correctedSymbol) ? relativeAtomicMasses[correctedSymbol] : null);

                 if (!finalAr) { setOutput('empiricalOutput', `Valid Ar required for ${correctedSymbol}. Check symbol/input or ensure it's in common dataset.`, 'error'); return; }
                 if (comp <= 0) { setOutput('empiricalOutput', `Composition/mass for ${correctedSymbol} must be > 0.`, 'error'); return; }
                 elements.push({ symbol: correctedSymbol, ar: finalAr, comp });
             } else if (symbol || arVal !== null || comp !== null) { // Partial input check
                  if (i < 3 || (i === 3 && (symbol || arVal !== null || comp !== null))) {
                       setOutput('empiricalOutput', `Please complete all fields for Element ${i} or leave all blank.`, 'error'); return;
                  }
             }
         }

         if (elements.length < 2) { setOutput('empiricalOutput', 'Need data for at least 2 elements.', 'error'); return; }

         try {
             elements.forEach(el => { el.moles = el.comp / el.ar; if (isNaN(el.moles) || !isFinite(el.moles)) throw new Error(`Invalid calc for ${el.symbol}.`); });
             const minMoles = Math.min(...elements.map(el => el.moles)); if (minMoles <= 0) throw new Error('Minimum moles is zero/negative.');
             elements.forEach(el => { el.ratio = el.moles / minMoles; });

             let multiplier = 1; const tolerance = 0.1;
             for (let m = 2; m <= 6; m++) { let allNearWhole = true; for (const el of elements) { const scaledRatio = el.ratio * m; if (Math.abs(scaledRatio - Math.round(scaledRatio)) > tolerance * m) { allNearWhole = false; break; } } if (allNearWhole) { multiplier = m; break; } }
             if (multiplier === 1) { let allNearWhole = true; for (const el of elements) { if (Math.abs(el.ratio - Math.round(el.ratio)) > tolerance) { allNearWhole = false; break; } } if (!allNearWhole) console.warn("EF Ratios not easily convertible:", elements.map(e => e.ratio)); }

             let formulaParts = [];
             elements.forEach(el => { const finalRatioNum = Math.round(el.ratio * multiplier); if (finalRatioNum <= 0 || !Number.isInteger(finalRatioNum)) throw new Error(`Cannot get whole ratio for ${el.symbol}.`); formulaParts.push({ symbol: el.symbol, count: finalRatioNum }); });
             formulaParts.sort((a, b) => { if (a.symbol === 'C') return -1; if (b.symbol === 'C') return 1; if (a.symbol === 'H') return -1; if (b.symbol === 'H') return 1; return a.symbol.localeCompare(b.symbol); });

             let plainEmpiricalFormula = ''; formulaParts.forEach(part => { plainEmpiricalFormula += part.symbol + (part.count > 1 ? part.count : ''); });

             let steps = 'Steps:<br>';
             elements.forEach(el => steps += `Moles ${el.symbol}: \\( \\frac{${el.comp.toFixed(2)}}{${el.ar.toFixed(1)}} = ${el.moles.toPrecision(3)} \\, mol \\)<br>`);
             steps += `Smallest moles = ${minMoles.toPrecision(3)} mol<br>`;
             elements.forEach(el => steps += `Ratio ${el.symbol}: \\( \\frac{${el.moles.toPrecision(3)}}{${minMoles.toPrecision(3)}} \\approx ${el.ratio.toFixed(2)} \\)<br>`);
             if (multiplier > 1) { steps += `Multiply ratios by ${multiplier} → Whole numbers.<br>`; }

             const mathjaxEmpiricalFormula = formatFormulaForMathJax(plainEmpiricalFormula);
             setOutput('empiricalOutput', `${steps}<strong>Empirical Formula: \\( ${mathjaxEmpiricalFormula} \\)</strong>`, 'success');

         } catch (error) { setOutput('empiricalOutput', `Calculation Error: ${error.message}`, 'error'); }
    }

    // --- Percentage Yield Calculator ---
    window.calculatePercentageYield = function() {
        const actual = getElementByIdValue('actualYield', 'number');
        const theoretical = getElementByIdValue('theoreticalYield', 'number');

        if (actual === null || theoretical === null) { setOutput('yieldOutput', 'Need both Actual and Theoretical Yield values.', 'error'); return; }
        if (theoretical <= 0) { setOutput('yieldOutput', 'Theoretical Yield must be > 0.', 'error'); return; }
        if (actual < 0) { setOutput('yieldOutput', 'Actual Yield cannot be negative.', 'error'); return; }

        const yieldPercent = (actual / theoretical) * 100;
        let message = `Percentage Yield = \\( \\frac{${actual.toFixed(1)}}{${theoretical.toFixed(1)}} \\times 100\\% = \\) <strong>${yieldPercent.toFixed(1)}%</strong>`;
        let type = 'success';

        if (yieldPercent > 100.1) { // Allow slight rounding errors
             message += '<br><span class="warning">(Warning: Yield > 100%, check values/calculation)</span>';
             type = 'warning';
         }
         setOutput('yieldOutput', message, type);
    }

    // --- Percentage Purity Calculator ---
    window.calculatePercentagePurity = function() {
         const pure = getElementByIdValue('pureMass', 'number');
         const impure = getElementByIdValue('impureMass', 'number');

         if (pure === null || impure === null) { setOutput('purityOutput', 'Need both Pure Mass and Total Sample Mass.', 'error'); return; }
         if (impure <= 0) { setOutput('purityOutput', 'Total Sample Mass must be > 0.', 'error'); return; }
         if (pure < 0) { setOutput('purityOutput', 'Mass of Pure Substance cannot be negative.', 'error'); return; }
         if (pure > impure && Math.abs(pure - impure) > 1e-6) { // Add tolerance
             setOutput('purityOutput', 'Pure Mass cannot be greater than Total Sample Mass.', 'error'); return;
         }

         const purityPercent = (impure === 0) ? 0 : (pure / impure) * 100;
         setOutput('purityOutput', `% Purity = \\( \\frac{${pure.toFixed(1)}}{${impure.toFixed(1)}} \\times 100\\% = \\) <strong>${purityPercent.toFixed(1)}%</strong>`, 'success');
    }

}); // End DOMContentLoaded