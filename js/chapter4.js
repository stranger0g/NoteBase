// js/chapter4.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Electrolysis of CuSO4 Interaction ---
    window.showCuSO4Electrolysis = function() { // Attach to window for onchange
        const electrodeType = getElementByIdValue('electrodeType'); // Function from common.js
        const outputDivId = 'cuso4Output';
        let results = [];

        if (electrodeType === 'inert') {
            results = [
                { title: "Cathode (-) Reaction (Reduction)", text: "\\( Cu^{2+}(aq) + 2e^- \\rightarrow Cu(s) \\)", type: "info" },
                { title: "Cathode Observation", text: "Pink/brown solid (copper) deposits.", type: "info" },
                { title: "Anode (+) Reaction (Oxidation)", text: "\\( 4OH^-(aq) \\rightarrow O_2(g) + 2H_2O(l) + 4e^- \\)<br>(OH⁻ easier to oxidise than SO₄²⁻)", type: "info" },
                { title: "Anode Observation", text: "Bubbles of colourless gas (oxygen) form.", type: "info" },
                { title: "Electrolyte Change", text: "Blue colour fades as \\(Cu^{2+}\\) is removed. Solution becomes acidic (excess \\(H^+\\) ions).", type: "warning" }
            ];
        } else if (electrodeType === 'copper') {
             results = [
                { title: "Cathode (-) Reaction (Reduction)", text: "\\( Cu^{2+}(aq) + 2e^- \\rightarrow Cu(s) \\)", type: "info" },
                { title: "Cathode Observation", text: "Pink/brown solid (copper) deposits.", type: "info" },
                { title: "Anode (+) Reaction (Oxidation)", text: "\\( Cu(s) \\rightarrow Cu^{2+}(aq) + 2e^- \\)<br>(Copper anode itself oxidises)", type: "info" },
                { title: "Anode Observation", text: "Copper anode dissolves / gets smaller.", type: "info" },
                { title: "Electrolyte Change", text: "Concentration of \\(Cu^{2+}\\) and blue colour remain approx. constant.", type: "success" }
            ];
        } else {
             results = [{ title: "Error", text: "Invalid electrode type selected.", type: "error" }];
        }
        setComplexOutput(outputDivId, results); // Function from common.js
    }

    // Initial call to display default (inert) results
    if (document.getElementById('electrodeType')) {
        showCuSO4Electrolysis();
    }

}); // End DOMContentLoaded