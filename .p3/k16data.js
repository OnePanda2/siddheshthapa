/* Close the Kepler-16 gap recorded on 2026-08-19 with the binary's own
   elements, and keep MEASURED / DERIVED / ILLUSTRATIVE strictly separated so
   nothing invented can ever be read back as astronomy. */
const fs = require('fs');
const F = 'data/astronomy-systems.json';
const d = JSON.parse(fs.readFileSync(F, 'utf8'));

const MA = 0.6897, MB = 0.20, Mt = MA + MB, P = 41, aP = 0.7048;
const Pyr = P / 365.25;
const aBin = Math.pow(Mt * Pyr * Pyr, 1 / 3);
const mu = MB / Mt;
const HW = 1.60 + 4.12 * mu - 5.09 * mu * mu;
const r5 = x => +x.toFixed(5);

const i = d.systems.findIndex(s => s.system === 'Kepler-16');
if (i < 0) { console.error('Kepler-16 missing'); process.exit(1); }

d.systems[i] = {
  system: 'Kepler-16',
  sourceType: 'circumbinary-system',
  planetCount: 1,
  semiMajorAxisAU: [0.7048],
  orbitalPeriodDays: [228.776],
  letters: ['b'],

  /* ---- MEASURED. Every value here came off an authoritative source in this
     session and can be re-fetched from the URLs in _provenance. ---- */
  measured: {
    planet: { semiMajorAxisAU: 0.7048, orbitalPeriodDays: 228.776,
              eccentricity: 0.0069, inclinationDeg: 90.0322,
              massJupiter: 0.333, radiusJupiter: 0.7538 },
    stars:  { count: 2, massSolar: [0.6897, 0.20],
              primaryRadiusSolar: 0.6489, primaryTeffK: 4450 },
    binary: { periodDays: 41, eccentric: true },
    coplanarWithinDeg: 0.5,
    circumbinaryFlag: 1,
    _massSource: 'primary 0.6897 from pscomppars; secondary 0.20 from the Doyle et al. 2011 abstract ("20% and 69% as massive as the sun")',
    _binarySource: 'Doyle et al. 2011 abstract: "The eclipsing stars are 20% and 69% as massive as the sun, and have an eccentric 41-day orbit."',
    _coplanarSource: 'Doyle et al. 2011 abstract: "The motions of all three bodies are confined to within 0.5 degree of a single plane."'
  },

  /* ---- DERIVED. Computed from the measured values above by the stated
     formula. Legitimate, but not observations. ---- */
  derived: {
    _formula: "Kepler's third law, a^3 = M_total * (P/365.25)^2 in AU / solar masses / years",
    binarySemiMajorAxisAU: r5(aBin),
    barycentreOffsetAU: [r5(aBin * mu), r5(aBin * (1 - mu))],
    swingRatioBoverA: r5(MA / MB),
    _swingMeaning: 'the small star swings 3.45x wider than the massive one — they are bound, but they do not move equally',
    planetToBinaryRatio: r5(aP / aBin),
    _planetMeaning: 'the planet orbits at 3.15x the stellar separation, so the centre of this system is a large empty region',
    stabilityLowerBoundRatio: r5(HW),
    stabilityLowerBoundAU: r5(HW * aBin),
    _stabilitySource: 'Holman & Wiegert 1999 critical semi-major axis for P-type orbits, evaluated at e=0. Because the binary is eccentric the true limit is LARGER than this; this is a lower bound only.',
    visualSizeRatioAoverB: r5(Math.pow(MA / MB, 1 / 3)),
    _sizeMeaning: 'cube root of the measured mass ratio, used only to size the two stars relative to each other',
    secondaryIsCoolerThanPrimary: true,
    _tempMeaning: 'follows from 0.20 < 0.69 solar masses on the main sequence; the secondary Teff itself was NOT measured'
  },

  /* ---- ILLUSTRATIVE. Not astronomy. Rendering needed a number and the
     measurement was unavailable. Flagged so no check can read it as fact. ---- */
  illustrative: {
    _warning: 'NOT ASTRONOMY. Chosen for rendering because the measured value could not be sourced. Must never be presented as measured.',
    binaryEccentricity: 0.16,
    _why: 'Doyle et al. 2011 states the binary orbit IS eccentric but gives no number in any abstract or archive table reachable here, so the orbit is drawn visibly non-circular at a declared value rather than drawn as a circle, which would contradict the published description.',
    orbitSpacingRule: 'successive 3:2 period ratio, a ∝ P^(2/3), step 1.31037',
    orbitSpacingStep: 1.31037,
    _whySpacing: 'Kepler-16 has exactly ONE measured planet. LOVE has four Minor IGs. Orbit 0 is the real measured orbit; orbits 1-3 are spaced by this declared rule and are NOT measurements.'
  },

  unverified: {
    binaryEccentricityValue: 'no numeric value in NASA pscomppars, the ps table, or any fetchable abstract',
    secondaryRadiusSolar: null,
    secondaryTeffK: null,
    binaryArgumentOfPeriapsis: null
  },

  geometryBasis: 'CIRCUMBINARY. Two stars of 0.69 and 0.20 solar masses on an eccentric 41-day mutual orbit, derived separation 0.2238 AU. The single measured planet orbits the PAIR at 0.7048 AU — 3.15x the stellar separation — leaving a large dynamically empty centre.',
  visualCharacter: 'two unequal centres swinging anti-phase about a shared barycentre, a wide hollow middle where nothing can hold an orbit, then a small number of far, slow bodies',
  confidence: 'high',
  notes: 'Planet geometry and primary star from pscomppars (Doyle et al. 2011). Secondary mass, binary period, eccentric-ness and 0.5-degree coplanarity from the Doyle et al. 2011 abstract. Binary semi-major axis and barycentre split DERIVED via Kepler third law. Binary eccentricity value remains UNVERIFIED.',
  _provenance: [
    'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+pscomppars+where+hostname=%27Kepler-16%27',
    'https://arxiv.org/abs/1109.3432  (Doyle et al. 2011, Science 333, 1602)',
    'https://ui.adsabs.harvard.edu/abs/2011Sci...333.1602D/abstract'
  ]
};

/* the 2026-08-19 gap is now closed; record what is still open */
d.gaps = (d.gaps || []).filter(g => !/Kepler-16/.test(g.issue + ' ' + g.detail));
d.gaps.push({
  issue: 'Kepler-16 binary eccentricity has no numeric value',
  detail: 'Doyle et al. 2011 describes the 41-day stellar orbit as eccentric but states no figure in the abstract, and neither pscomppars nor the ps table carries stellar binary elements. The renderer therefore uses a declared ILLUSTRATIVE eccentricity, flagged as such in systems[].illustrative.',
  action: 'read the value out of the Science paper or its supplementary material, then move it from illustrative to measured'
});
d.gaps.push({
  issue: 'Kepler-16 has one planet; LOVE has four Minor IGs',
  detail: 'Only orbit 0 is a measurement. Orbits 1-3 are spaced by a declared 3:2 period rule recorded in systems[].illustrative.orbitSpacingRule and must never be described as measured.',
  action: 'none — the split is recorded and machine-checked'
});
d._retrieved_kepler16 = '2026-08-20';

fs.writeFileSync(F, JSON.stringify(d, null, 1), 'utf8');
console.log('Kepler-16 updated');
console.log('  a_binary derived     ', r5(aBin), 'AU');
console.log('  barycentre split     ', r5(aBin * mu), '/', r5(aBin * (1 - mu)), 'AU');
console.log('  planet / binary      ', r5(aP / aBin), 'x');
console.log('  stability lower bound', r5(HW), 'x a_bin');
console.log('  open gaps            ', d.gaps.length);
