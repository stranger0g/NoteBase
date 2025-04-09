// js/chapter5.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Bond Energy Delta H Calculator ---
    window.calculateDeltaH = function() { // Attach to window for onclick
        const energyBroken = getElementByIdValue('bondsBrokenEnergy', 'number'); // Func from common.js
        const energyFormed = getElementByIdValue('bondsFormedEnergy', 'number');

        if (energyBroken === null || energyFormed === null || isNaN(energyBroken) || isNaN(energyFormed)) {
            setOutput('deltaHOutput', 'Please enter valid numbers for both energy values.', 'error');
            return;
        }

        const deltaH = energyBroken - energyFormed;
        const sign = deltaH > 0 ? '+' : (deltaH < 0 ? '' : ''); // Determine sign for display
        // Format to 1 decimal place only if needed
        const formattedDeltaH = (deltaH % 1 === 0) ? deltaH.toFixed(0) : deltaH.toFixed(1);
        const reactionType = deltaH < 0 ? 'Exothermic' : (deltaH > 0 ? 'Endothermic' : 'Neutral');

        // Use setOutput to display with MathJax rendering and color coding based on sign
        const message = `\\( \\Delta H = \\Sigma E_{\\text{broken}} - \\Sigma E_{\\text{formed}} \\) <br> \\( \\Delta H = ${energyBroken} - ${energyFormed} = ${sign}${formattedDeltaH} \\) kJ/mol <br> Reaction is <strong>${reactionType}</strong>.`;

        // setOutput will handle color based on the sign detected in the message
        setOutput('deltaHOutput', message); // Let setOutput handle type based on sign
    }

}); // End DOMContentLoaded