// js/quiz_prompts.js
// Contains detailed prompts for the AI Quiz Generator for each chapter.

const quizPrompts = {
  '1': `
      Generate exactly 5 distinct IGCSE Chemistry (0620) questions on States of Matter (Chapter 1), mixing Core and Supplement. Ensure questions cover properties/structure, state changes/kinetic theory, gas behavior, and diffusion. Use IGCSE command words (State, Describe, Explain, Interpret). The output MUST be a valid JSON array of objects, each with "question" (string, use MathJax \\\\(..\\\\) if needed) and "answer_guideline" (string, brief points).

      Syllabus Context:
      - Core 1.1.1: State distinguishing properties of solids, liquids, gases (shape, volume, compressibility, flow, density).
      - Core 1.1.2: Describe structures (particle separation, arrangement, motion) for solids, liquids, gases.
      - Core 1.1.3: Describe changes of state (melting, freezing, boiling, evaporation, condensing, sublimation, deposition).
      - Core 1.1.4: Describe effects of temperature and pressure on gas volume.
      - Core 1.2.1: Describe and explain diffusion using kinetic particle theory (net movement, high to low conc, random motion).
      - Supplement 1.1.5: Explain changes of state using kinetic particle theory (energy input, KE/PE changes, intermolecular forces, latent heat). Interpret heating/cooling curves (sloped vs flat sections, melting/boiling points).
      - Supplement 1.1.6: Explain T/P effects on gas volume using kinetic particle theory (particle collisions, speed, force, area).
      - Supplement 1.2.2: Describe and explain the effect of relative molecular mass (Mr) on gas diffusion rate (link KE, mass, speed).

      Example JSON object format:
      {
        "question": "Explain, using kinetic particle theory, why gases diffuse faster than liquids.",
        "answer_guideline": "Gas particles move faster/have higher KE; Gas particles have negligible intermolecular forces/move more freely; Gas particles have larger spaces between them."
      }
  `,
  '2': `
      Generate exactly 5 distinct IGCSE Chemistry (0620) questions on Atoms, Elements & Compounds (Chapter 2), mixing Core and Supplement. Cover topics like classification, atomic structure/notation, isotopes, and different bonding types (ionic, covalent, metallic) including structure & properties. Use IGCSE command words (Describe, State, Define, Determine, Interpret, Use, Calculate, Explain, Relate). The output MUST be a valid JSON array of objects, each with "question" (string, use MathJax \\\\(..\\\\) for symbols/formulas like \\\\(^{24}_{12}Mg^{2+}\\\\)) and "answer_guideline" (string, brief points).

      Syllabus Context:
      - Core 2.1.1: Describe differences between elements, compounds, mixtures (composition, bonding, separation, properties).
      - Core 2.2.1: Describe atom structure (nucleus: protons, neutrons; electrons in shells).
      - Core 2.2.2: State relative mass & charge of proton, neutron, electron.
      - Core 2.2.3: Define proton/atomic number (Z).
      - Core 2.2.4: Define mass/nucleon number (A); A = Z + N.
      - Core 2.2.5: Determine electronic configuration (Z=1-20, shells 2,8,8...), including ions.
      - Core 2.2.6: State relationship between config & Periodic Table (Group=outer e⁻, Period=shells, Group VIII=full shell).
      - Core 2.3.1: Define isotopes (same Z, different N/A).
      - Core 2.3.2: Interpret/use notation \\\\(^{A}_{Z}X^{charge}\\\\\) for atoms/ions.
      - Core 2.4.1: Describe formation of cations (+) by electron loss (metals) and anions (-) by electron gain (non-metals).
      - Core 2.4.2: State ionic bond is strong electrostatic attraction between opposite ions.
      - Core 2.4.3: Describe ionic bond formation (e.g., Group I/VII, dot-cross).
      - Core 2.4.4: Describe ionic compound properties (high MP/BP, conductivity molten/aq only).
      - Core 2.5.1: State covalent bond involves shared electrons.
      - Core 2.5.2: Describe covalent bond formation in simple molecules (H₂, Cl₂, H₂O, CH₄, NH₃, HCl, dot-cross).
      - Core 2.5.3: Describe simple molecular properties (low MP/BP, poor conductivity).
      - Core 2.6.1: Describe giant covalent structures (graphite, diamond).
      - Core 2.6.2: Relate structure/bonding of graphite (lubricant, electrode) and diamond (cutting tools) to uses.
      - Supplement 2.3.3: State why isotopes have same chemical properties (same electron config).
      - Supplement 2.3.4: Calculate relative atomic mass (Ar) from isotopic abundances.
      - Supplement 2.4.5: Describe giant ionic lattice structure.
      - Supplement 2.4.6: Describe ionic bond formation between metallic/non-metallic elements (dot-cross).
      - Supplement 2.4.7: Explain ionic properties using structure/bonding (strong forces, mobile ions when molten/aq).
      - Supplement 2.5.4: Describe covalent bond formation in other molecules (multiple bonds: O₂, CO₂, N₂, C₂H₄; also CH₃OH).
      - Supplement 2.5.5: Explain simple molecular properties (weak intermolecular forces, no mobile charges).
      - Supplement 2.6.3: Describe giant covalent structure of SiO₂.
      - Supplement 2.6.4: Describe property similarities (hardness, MP/BP, conductivity) between diamond & SiO₂ related to structure.
      - Supplement 2.7.1: Describe metallic bonding (lattice positive ions, delocalised electrons).
      - Supplement 2.7.2: Explain metal properties (conductivity - mobile e⁻; malleability/ductility - layers slide).

      Example JSON object format:
      {
        "question": "Draw a dot-and-cross diagram to show the bonding in ammonia, \\\\(NH_3\\\\). Show outer shell electrons only.",
        "answer_guideline": "Correct symbols (N, H). N shares one electron pair with each of 3 H atoms. N has one lone pair shown. Each H has 2 electrons, N has 8 electrons in outer shell."
      }
  `,
  '3': `
      Generate exactly 5 distinct IGCSE Chemistry (0620) questions on Stoichiometry (Chapter 3), mixing Core and Supplement. Ensure coverage of formulae, relative masses, mole concept calculations (mass, gas vol, solution conc.), reacting quantities, and yield/purity. Use IGCSE command words (State, Define, Deduce, Construct, Calculate, Use). The output MUST be a valid JSON array of objects, each with "question" (string, use MathJax \\\\(..\\\\) like \\\\(H_2SO_4\\\\), \\\\(M_r\\\\)) and "answer_guideline" (string, brief points).

      Syllabus Context:
      - Core 3.1.1: State formulae (elements/compounds).
      - Core 3.1.2: Define molecular formula.
      - Core 3.1.3: Deduce formula from model/diagram.
      - Core 3.1.4: Construct word & balanced symbol equations (state symbols).
      - Core 3.2.1: Describe relative atomic mass (Ar) vs C-12.
      - Core 3.2.2: Define relative molecular/formula mass (Mr) as sum Ar.
      - Core 3.2.3: Calculate reacting masses (simple proportions, no moles).
      - Core 3.3.1: State concentration units (g/dm³, mol/dm³).
      - Supplement 3.1.5: Define empirical formula (simplest ratio).
      - Supplement 3.1.6: Deduce ionic formula (model/ions/charges).
      - Supplement 3.1.7: Construct symbol equations with state symbols, including ionic equations.
      - Supplement 3.1.8: Deduce symbol equation from info.
      - Supplement 3.3.2: State mole definition & Avogadro constant (6.02x10²³ particles/mol).
      - Supplement 3.3.3: Use n=m/M to calculate n, m, M, Ar/Mr. Calculate number of particles using Avogadro constant.
      - Supplement 3.3.4: Use molar gas volume (24 dm³/mol at r.t.p.) in gas calculations.
      - Supplement 3.3.5: Calculate stoichiometric reacting masses, limiting reactants, gas volumes (rtp), solution volumes/concentrations (g/dm³, mol/dm³), handle cm³/dm³ conversion.
      - Supplement 3.3.6: Use titration data to calculate moles, concentration, or volume.
      - Supplement 3.3.7: Calculate empirical and molecular formulae from data.
      - Supplement 3.3.8: Calculate percentage yield, percentage composition by mass, percentage purity from data.

      Example JSON object format:
      {
        "question": "A compound contains 40.0% Carbon, 6.7% Hydrogen, and 53.3% Oxygen by mass. Calculate its empirical formula. (Ar: C=12.0, H=1.0, O=16.0)",
        "answer_guideline": "Assume 100g: 40.0g C, 6.7g H, 53.3g O. Moles: C=40/12=3.33, H=6.7/1=6.7, O=53.3/16=3.33. Divide by smallest (3.33): C=1, H=2, O=1. EF = CH₂O."
      }
  `,
      '4': `
      Generate exactly 5 distinct IGCSE Chemistry (0620) questions on Electrochemistry (Chapter 4), mixing Core and Supplement. Cover electrolysis definition/setup, product prediction (molten/aqueous/electrode type), half-equations, electroplating, and fuel cells. Use IGCSE command words (Define, Identify, State, Describe, Predict, Construct, Explain). The output MUST be a valid JSON array of objects, each with "question" (string, use MathJax \\\\(..\\\\) like \\\\(Cu^{2+}\\\\), \\\\(e^-\\\\)) and "answer_guideline" (string, brief points).

      Syllabus Context:
      - Core 4.1.1: Define electrolysis (decomposition of molten/aq ionic compound by electricity).
      - Core 4.1.2: Identify anode (+), cathode (-), electrolyte in cells.
      - Core 4.1.3: Identify products/observations for electrolysis of: molten PbBr₂, conc. aq. NaCl, dilute H₂SO₄ (using inert electrodes).
      - Core 4.1.4: State general products: metal/H₂ at cathode, non-metal (not H₂) at anode.
      - Core 4.1.5: Predict products for molten binary compound electrolysis.
      - Core 4.1.6: State reasons for electroplating (appearance, corrosion resistance).
      - Core 4.1.7: Describe how metals are electroplated (object=cathode, plating metal=anode, electrolyte=plating metal ions).
      - Core 4.2.1: State H₂/O₂ fuel cell function (uses H₂, O₂ → electricity + water only).
      - Supplement 4.1.8: Describe charge transfer (e⁻ in circuit, ion movement in electrolyte, e⁻ gain/loss at electrodes).
      - Supplement 4.1.9: Identify products/observations for aq. CuSO₄ electrolysis (inert C vs active Cu electrodes).
      - Supplement 4.1.10: Predict products for aq. halide electrolysis (dilute vs conc., considering relative discharge ease).
      - Supplement 4.1.11: Construct ionic half-equations (oxidation at anode, reduction at cathode).
      - Supplement 4.2.2: Describe advantages/disadvantages of H₂/O₂ fuel cells vs petrol engines (efficiency, pollution, cost, H₂ production/storage/infrastructure).

      Example JSON object format:
      {
        "question": "Write the ionic half-equation for the reaction occurring at the cathode during the electrolysis of molten magnesium chloride, \\\\(MgCl_2\\\\).",
        "answer_guideline": "Identify cation (Mg²⁺). State cathode is negative/reduction occurs. Equation: Mg²⁺(l) + 2e⁻ → Mg(l)."
      }
  `,
  '5': `
      Generate exactly 5 distinct IGCSE Chemistry (0620) questions on Chemical Energetics (Chapter 5), mixing Core/Supplement. Include questions on definitions (exo/endo, \\\\( \\\\Delta H \\\\), \\\\( E_a \\\\)), interpreting/drawing reaction profiles, explaining \\\\( \\\\Delta H \\\\) via bond energy concepts, and calculating \\\\( \\\\Delta H \\\\) from bond energies. Use IGCSE command words (State, Define, Interpret, Draw, Label, Explain, Calculate). The output MUST be a valid JSON array of objects, each with "question" (string, use MathJax delimiters \\\\(..\\\\) for \\\\( \\\\Delta H \\\\), \\\\( E_a \\\\)) and "answer_guideline" (string, brief points).

      Syllabus Context:
      - Core 5.1.1: State exothermic reaction transfers thermal energy out, surroundings temp increases.
      - Core 5.1.2: State endothermic reaction takes thermal energy in, surroundings temp decreases.
      - Core 5.1.3: Interpret reaction pathway diagrams (exo/endo).
      - Supplement 5.1.4: State enthalpy change (\\\\( \\\\Delta H \\\\)) is thermal energy transfer; \\\\( \\\\Delta H \\\\) is negative (exo) / positive (endo).
      - Supplement 5.1.5: Define activation energy (\\\\( E_a \\\\)) as minimum energy for colliding particles to react.
      - Supplement 5.1.6: Draw and label reaction pathway diagrams (reactants, products, \\\\( \\\\Delta H \\\\), \\\\( E_a \\\\)).
      - Supplement 5.1.7: State bond breaking is endothermic, bond making is exothermic; Explain overall \\\\( \\\\Delta H \\\\) in terms of energy balance between breaking/making.
      - Supplement 5.1.8: Calculate \\\\( \\\\Delta H \\\\) of a reaction using provided bond energies (\\\\( \\\\Delta H = \\\\Sigma E_{broken} - \\\\Sigma E_{formed} \\\\)).

      Example JSON object format:
      {
        "question": "The reaction \\\\( N_2(g) + 3H_2(g) \\\\rightarrow 2NH_3(g) \\\\) is exothermic. Sketch the reaction pathway diagram, labelling reactants, products, \\\\( E_a \\\\) and \\\\( \\\\Delta H \\\\).",
        "answer_guideline": "Diagram shows reactants (N₂+3H₂) energy level higher than products (2NH₃). Peak shown higher than reactants. Ea labelled from reactants to peak. ΔH labelled as arrow pointing down from reactants to products (negative)."
      }
  `
};