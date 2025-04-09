// js/chapter1.js

document.addEventListener('DOMContentLoaded', () => {
    // --- States of Matter Simulation ---
    const canvasStates = document.getElementById('statesCanvas');
    const ctxStates = canvasStates ? canvasStates.getContext('2d') : null;
    const statesWidth = canvasStates ? canvasStates.width : 0;
    const statesHeight = canvasStates ? canvasStates.height : 0;
    const btnSolid = document.getElementById('btnSolid');
    const btnLiquid = document.getElementById('btnLiquid');
    const btnGas = document.getElementById('btnGas');
    const tempSlider = document.getElementById('tempSlider');
    let particlesStates = [];
    let currentState = 'solid';
    let animationFrameIdStates;
    const particleRadius = 4;
    const numParticles = 36;

    class ParticleStates {
         constructor(x, y, vx, vy, state) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.state = state; this.baseX = x; this.baseY = y; this.color = '#3498db'; }
         draw() { if (!ctxStates) return; ctxStates.beginPath(); ctxStates.arc(this.x, this.y, particleRadius, 0, Math.PI * 2); ctxStates.fillStyle = this.color; ctxStates.fill(); ctxStates.closePath(); }
         update(speedFactor) {
             if (!ctxStates) return;
             let nextX = this.x + this.vx * speedFactor;
             let nextY = this.y + this.vy * speedFactor;

             // Boundary collision for gas & liquid
             if (this.state === 'gas' || this.state === 'liquid') {
                 if (nextX > statesWidth - particleRadius || nextX < particleRadius) { this.vx = -this.vx; nextX = this.x; } // Reverse velocity, don't move past edge
                 if (nextY > statesHeight - particleRadius || nextY < particleRadius) { this.vy = -this.vy; nextY = this.y; }
             }

              if (this.state === 'gas') {
                 this.x += this.vx * speedFactor;
                 this.y += this.vy * speedFactor;
             } else if (this.state === 'liquid') {
                  // Add some random movement component for fluidity
                  this.x += this.vx * speedFactor * 0.3 + (Math.random() - 0.5) * 1.5;
                  this.y += this.vy * speedFactor * 0.3 + (Math.random() - 0.5) * 1.5;
                  // Keep within bounds
                  this.x = Math.max(particleRadius, Math.min(statesWidth - particleRadius, this.x));
                  this.y = Math.max(particleRadius, Math.min(statesHeight - particleRadius, this.y));
             } else if (this.state === 'solid') {
                 const vibrationRange = 1.5 * speedFactor; // Vibration intensity tied to temp
                 this.x = this.baseX + (Math.random() - 0.5) * vibrationRange;
                 this.y = this.baseY + (Math.random() - 0.5) * vibrationRange;
                 // Keep within bounds (though less likely to hit with small vibrations)
                 this.x = Math.max(particleRadius, Math.min(statesWidth - particleRadius, this.x));
                 this.y = Math.max(particleRadius, Math.min(statesHeight - particleRadius, this.y));
             }
         }
    }

    function initParticles(state) {
        particlesStates = [];
        const speed = 2;
        const spacing = 35; // Adjust for visual density
        const rows = Math.floor(Math.sqrt(numParticles));
        const cols = Math.ceil(numParticles / rows);
        const startX = (statesWidth - (cols - 1) * spacing) / 2;
        const startY = (statesHeight - (rows - 1) * spacing) / 2;

        for (let i = 0; i < numParticles; i++) {
            let x, y, vx, vy;
            if (state === 'solid') {
                const row = Math.floor(i / cols);
                const col = i % cols;
                x = startX + col * spacing;
                y = startY + row * spacing;
                vx = 0; // Initial velocity zero for solid vibration start
                vy = 0;
            } else if (state === 'liquid') {
                // Start particles closer together for liquid
                x = Math.random() * (statesWidth * 0.8 - 2 * particleRadius) + statesWidth * 0.1 + particleRadius;
                y = Math.random() * (statesHeight * 0.8 - 2 * particleRadius) + statesHeight * 0.1 + particleRadius;
                vx = (Math.random() - 0.5) * speed * 0.5;
                vy = (Math.random() - 0.5) * speed * 0.5;
            } else { // gas
                x = Math.random() * (statesWidth - 2 * particleRadius) + particleRadius;
                y = Math.random() * (statesHeight - 2 * particleRadius) + particleRadius;
                vx = (Math.random() - 0.5) * speed;
                vy = (Math.random() - 0.5) * speed;
            }
            particlesStates.push(new ParticleStates(x, y, vx, vy, state));
        }
    }

    function animateStates() {
        if (!ctxStates) return;
        ctxStates.clearRect(0, 0, statesWidth, statesHeight);
        const speedFactor = tempSlider ? tempSlider.value / 2 : 1; // Scale speed with temperature slider
        particlesStates.forEach(p => {
            p.update(speedFactor);
            p.draw();
        });
        animationFrameIdStates = requestAnimationFrame(animateStates);
    }

    function setActiveButton(activeBtn) {
        [btnSolid, btnLiquid, btnGas].forEach(btn => btn?.classList.remove('active'));
        activeBtn?.classList.add('active');
    }

    if (btnSolid) { btnSolid.addEventListener('click', () => { currentState = 'solid'; if(tempSlider) tempSlider.value = 1; initParticles(currentState); setActiveButton(btnSolid); }); }
    if (btnLiquid) { btnLiquid.addEventListener('click', () => { currentState = 'liquid'; if(tempSlider) tempSlider.value = 5; initParticles(currentState); setActiveButton(btnLiquid); }); }
    if (btnGas) { btnGas.addEventListener('click', () => { currentState = 'gas'; if(tempSlider) tempSlider.value = 10; initParticles(currentState); setActiveButton(btnGas); }); }

    if (canvasStates) {
        initParticles(currentState); // Initialize with default state
        animateStates(); // Start animation loop
    }

    // --- Diffusion Simulation ---
    const canvasDiffusion = document.getElementById('diffusionCanvas');
    const ctxDiffusion = canvasDiffusion ? canvasDiffusion.getContext('2d') : null;
    const diffusionWidth = canvasDiffusion ? canvasDiffusion.width : 0;
    const diffusionHeight = canvasDiffusion ? canvasDiffusion.height : 0;
    const startDiffusionBtn = document.getElementById('startDiffusion');
    const compareMassesCheckbox = document.getElementById('compareMasses');
    const diffusionInfo = document.getElementById('diffusionInfo');
    let particlesDiffusion = [];
    let animationFrameIdDiffusion;
    let diffusionStarted = false;
    const numDiffusionParticles = 50;
    const diffusionParticleRadius = 3;

    class ParticleDiffusion {
        constructor(x, y, vx, vy, color, massFactor = 1) {
             this.x = x; this.y = y;
             // Speed is inversely proportional to sqrt of mass factor
             const speedMultiplier = 1 / Math.sqrt(massFactor);
             this.vx = vx * speedMultiplier;
             this.vy = vy * speedMultiplier;
             this.color = color;
             this.massFactor = massFactor;
        }
        draw() { if (!ctxDiffusion) return; ctxDiffusion.beginPath(); ctxDiffusion.arc(this.x, this.y, diffusionParticleRadius, 0, Math.PI * 2); ctxDiffusion.fillStyle = this.color; ctxDiffusion.fill(); ctxDiffusion.closePath(); }
        update() {
             if (!ctxDiffusion) return;
             let nextX = this.x + this.vx;
             let nextY = this.y + this.vy;
             // Boundary collision
             if (nextX > diffusionWidth - diffusionParticleRadius || nextX < diffusionParticleRadius) { this.vx = -this.vx; }
             if (nextY > diffusionHeight - diffusionParticleRadius || nextY < diffusionParticleRadius) { this.vy = -this.vy; }
             this.x += this.vx;
             this.y += this.vy;
        }
    }

    function initDiffusionParticles(compareMasses = false) {
        particlesDiffusion = [];
        const speed = 0.8; // Base speed
        diffusionStarted = false; // Reset flag
        if (diffusionInfo) diffusionInfo.textContent = "Click 'Start/Reset' to begin.";

        const particlesPerSide = Math.floor(numDiffusionParticles / (compareMasses ? 2 : 1));
        const color1 = compareMasses ? '#3498db' : '#e74c3c'; // Blue for lighter if comparing
        const color2 = '#e74c3c'; // Red for heavier

        // Place particles for side 1 (or all if not comparing)
        for (let i = 0; i < particlesPerSide; i++) {
            if (!diffusionWidth || !diffusionHeight) break;
            const x = Math.random() * (diffusionWidth / 2 - 2 * diffusionParticleRadius) + diffusionParticleRadius;
            const y = Math.random() * (diffusionHeight - 2 * diffusionParticleRadius) + diffusionParticleRadius;
            const vx = (Math.random() - 0.5) * speed;
            const vy = (Math.random() - 0.5) * speed;
            // Mass factor 1 for side 1 (or all)
            particlesDiffusion.push(new ParticleDiffusion(x, y, vx, vy, color1, 1));
        }

        // Place particles for side 2 if comparing
        if (compareMasses) {
            if (diffusionInfo) diffusionInfo.textContent = "Blue = Lower Mr Gas, Red = Higher Mr Gas. Click 'Start/Reset'.";
             // Ensure enough particles even if num is odd
             const particlesSide2 = numDiffusionParticles - particlesPerSide;
            for (let i = 0; i < particlesSide2; i++) {
                if (!diffusionWidth || !diffusionHeight) break;
                const x = Math.random() * (diffusionWidth / 2 - 2 * diffusionParticleRadius) + diffusionParticleRadius + diffusionWidth / 2;
                const y = Math.random() * (diffusionHeight - 2 * diffusionParticleRadius) + diffusionParticleRadius;
                const vx = (Math.random() - 0.5) * speed;
                const vy = (Math.random() - 0.5) * speed;
                 // Mass factor 4 for heavier gas (adjust as needed, makes speed sqrt(4)=2 times slower)
                particlesDiffusion.push(new ParticleDiffusion(x, y, vx, vy, color2, 4));
            }
        }

        drawDiffusionFrame(); // Draw initial state with barrier
    }

    function drawDiffusionBarrier() {
        if (!ctxDiffusion || diffusionStarted) return; // Only draw barrier before start
        ctxDiffusion.strokeStyle = '#555';
        ctxDiffusion.lineWidth = 2;
        ctxDiffusion.beginPath();
        ctxDiffusion.moveTo(diffusionWidth / 2, 0);
        ctxDiffusion.lineTo(diffusionWidth / 2, diffusionHeight);
        ctxDiffusion.stroke();
    }

    function drawDiffusionFrame() {
        if (!ctxDiffusion) return;
        ctxDiffusion.clearRect(0, 0, diffusionWidth, diffusionHeight);
        particlesDiffusion.forEach(p => p.draw());
        drawDiffusionBarrier(); // Draw barrier if needed
    }

    function animateDiffusion() {
        if (!diffusionStarted || !ctxDiffusion) {
            if (animationFrameIdDiffusion) cancelAnimationFrame(animationFrameIdDiffusion);
            return;
        }
        ctxDiffusion.clearRect(0, 0, diffusionWidth, diffusionHeight);
        particlesDiffusion.forEach(p => {
            p.update();
            p.draw();
        });
        animationFrameIdDiffusion = requestAnimationFrame(animateDiffusion);
    }

    if (startDiffusionBtn) {
        startDiffusionBtn.addEventListener('click', () => {
            const compare = compareMassesCheckbox ? compareMassesCheckbox.checked : false;
            if (animationFrameIdDiffusion) { cancelAnimationFrame(animationFrameIdDiffusion); } // Clear previous animation
            initDiffusionParticles(compare); // Re-initialize particles
            diffusionStarted = true; // Set flag to remove barrier and start movement
            if (diffusionInfo) diffusionInfo.textContent = compare ? "Observe mixing: Gas with lower Mr (blue) diffuses faster." : "Observe diffusion: Particles spread out.";
            animateDiffusion(); // Start the animation
        });
    }

    if (compareMassesCheckbox) {
        compareMassesCheckbox.addEventListener('change', () => {
             if (animationFrameIdDiffusion) { cancelAnimationFrame(animationFrameIdDiffusion); } // Stop current animation
             initDiffusionParticles(compareMassesCheckbox.checked); // Re-initialize based on checkbox
             diffusionStarted = false; // Ensure barrier is drawn initially
        });
    }

     if (canvasDiffusion) { // Initial setup
        initDiffusionParticles(compareMassesCheckbox ? compareMassesCheckbox.checked : false);
    }

    // --- Heating Curve Interaction ---
    const curveSegmentsDataOfficial = {
        'solid': 'Solid phase: Added energy increases average kinetic energy (particles vibrate more). Temperature increases.',
        'melting': 'Melting: Added energy (latent heat of fusion) overcomes intermolecular forces, increasing potential energy. Average kinetic energy (Temperature) remains constant at the Melting Point.',
        'liquid': 'Liquid phase: Added energy increases average kinetic energy (particles move faster). Temperature increases.',
        'boiling': 'Boiling: Added energy (latent heat of vaporization) overcomes remaining intermolecular forces, significantly increasing potential energy. Average kinetic energy (Temperature) remains constant at the Boiling Point.',
        'gas': 'Gas phase: Added energy increases average kinetic energy (particles move faster). Temperature increases.'
    };

    function setupHeatingCurveInteraction(svgId, infoId, data) {
        const svgElement = document.getElementById(svgId);
        const infoElement = document.getElementById(infoId);
        const defaultText = "Hover over a section of the heating curve above.";

        if (!svgElement || !infoElement) return;

        infoElement.textContent = defaultText;

        svgElement.querySelectorAll('.curve-segment').forEach(segment => {
            const segmentType = segment.id.split('_')[0].replace('segment-', '');
            segment.addEventListener('mouseover', () => {
                if (data[segmentType]) {
                    infoElement.textContent = data[segmentType];
                    infoElement.style.fontWeight = 'bold';
                }
            });
            segment.addEventListener('mouseout', () => {
                infoElement.textContent = defaultText;
                infoElement.style.fontWeight = 'normal';
            });
        });
    }

    // Setup for both curves
    setupHeatingCurveInteraction('heatingCurveSVG_main', 'curveInfo_main', curveSegmentsDataOfficial);
    setupHeatingCurveInteraction('heatingCurveSVG_summary', 'curveInfo_summary', curveSegmentsDataOfficial);

});