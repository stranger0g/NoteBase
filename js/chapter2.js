// js/chapter2.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Atom Builder Logic ---
    const protonInput = document.getElementById('protons');
    const neutronInput = document.getElementById('neutrons');
    const atomVisualization = document.getElementById('atomVisualization');
    const nucleusDiv = document.querySelector('#atomVisualization .nucleus');
    // protonDisplay and neutronDisplay are inside nucleusDiv, managed below
    const atomInfo = document.getElementById('atomInfo');

    const elementSymbols = ["", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca"];
    const elementNames = ["", "Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminium", "Silicon", "Phosphorus", "Sulfur", "Chlorine", "Argon", "Potassium", "Calcium"];

    function updateAtomBuilder() {
        const Z = parseInt(protonInput?.value) || 0; // Use optional chaining
        const N = parseInt(neutronInput?.value) || 0;
        const A = Z + N;
        const numElectrons = Z; // Assuming neutral atom for builder

        // Basic validation
        if (Z < 1 || Z > 20) {
            if (atomInfo) atomInfo.innerHTML = `<span class="error">Select protons between 1 and 20.</span>`;
            if (atomVisualization) atomVisualization.querySelectorAll('.electron-shell, .electron').forEach(el => el.remove());
            if (nucleusDiv) nucleusDiv.innerHTML = `<span>?p<sup>+</sup></span><span>?n<sup>0</sup></span>`;
            return;
        }

        // Update nucleus display
        if (nucleusDiv) {
            nucleusDiv.innerHTML = `<span id="protonDisplay">${Z}p<sup>+</sup></span><span id="neutronDisplay">${N}n<sup>0</sup></span>`;
        }

        // Update info display
        const symbol = elementSymbols[Z];
        const name = elementNames[Z];
        if (atomInfo) {
            atomInfo.innerHTML = `Element: <strong>${name} (${symbol})</strong> | Mass No. (A): <strong>${A}</strong> | Electronic Config: <strong>${getElectronicConfig(numElectrons)}</strong>`;
        }

        // Redraw electrons
        drawElectronShells(numElectrons);
    }

    function getElectronicConfig(electrons) {
        let config = [];
        let remaining = electrons;
        if (remaining > 0) { let shell1 = Math.min(remaining, 2); config.push(shell1); remaining -= shell1; }
        if (remaining > 0) { let shell2 = Math.min(remaining, 8); config.push(shell2); remaining -= shell2; }
        if (remaining > 0) { let shell3 = Math.min(remaining, 8); config.push(shell3); remaining -= shell3; } // Correct for Z<=20
        if (remaining > 0) { let shell4 = Math.min(remaining, 2); config.push(shell4); } // Correct for K, Ca
        return config.join(',');
    }

    function drawElectronShells(electrons) {
        if (!atomVisualization) return;
        // Clear previous shells and electrons
        atomVisualization.querySelectorAll('.electron-shell, .electron').forEach(el => el.remove());

        let electronsPlaced = 0;
        const shellRadii = [35, 55, 75, 95]; // Radii for shells
        const shellCapacity = [2, 8, 8, 2]; // Max electrons per shell (for Z <= 20)
        let shellIndex = 0;
        const electronSize = 9;

        while (electronsPlaced < electrons && shellIndex < shellCapacity.length) {
            const currentShellRadius = shellRadii[shellIndex];
            const capacity = shellCapacity[shellIndex];
            const electronsInThisShell = Math.min(electrons - electronsPlaced, capacity);

            // Only draw shell if it has electrons
            if (electronsInThisShell > 0) {
                const shellDiv = document.createElement('div');
                shellDiv.className = 'electron-shell';
                shellDiv.style.width = `${currentShellRadius * 2}px`;
                shellDiv.style.height = `${currentShellRadius * 2}px`;
                shellDiv.style.zIndex = '5'; // Ensure shells are behind electrons
                atomVisualization.appendChild(shellDiv);

                // Distribute electrons evenly on the shell
                for (let i = 0; i < electronsInThisShell; i++) {
                    // Add slight offset per shell to avoid overlap if shells had same number
                    const angleOffset = shellIndex * 15;
                    // Calculate angle for even distribution
                    const angle = (360 / electronsInThisShell) * i + angleOffset;
                    const electronDiv = document.createElement('div');
                    electronDiv.className = 'electron';

                    // Calculate position using trigonometry
                    // Center is (currentShellRadius, currentShellRadius) within the shell's bounding box
                    // Offset by half electron size to center the electron dot
                    const xPos = currentShellRadius * Math.cos(angle * Math.PI / 180);
                    const yPos = currentShellRadius * Math.sin(angle * Math.PI / 180);

                    // Position relative to the parent visualization div's center
                    electronDiv.style.left = `calc(50% + ${xPos}px - ${electronSize / 2}px)`;
                    electronDiv.style.top = `calc(50% + ${yPos}px - ${electronSize / 2}px)`;
                    electronDiv.style.width = `${electronSize}px`;
                    electronDiv.style.height = `${electronSize}px`;
                    atomVisualization.appendChild(electronDiv);
                }
            }
            electronsPlaced += electronsInThisShell;
            shellIndex++;
        }
    }

    // Initial call and event listeners
    if (protonInput && neutronInput) {
        protonInput.addEventListener('input', updateAtomBuilder);
        neutronInput.addEventListener('input', updateAtomBuilder);
        updateAtomBuilder(); // Initial draw
    }
});