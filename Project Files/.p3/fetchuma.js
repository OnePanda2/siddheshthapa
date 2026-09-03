/* Pull the Ursa Major field from SIMBAD (CDS) and write it with provenance
   split the same way LOVE's data is: measured / derived / illustrative /
   unverified. Nothing here is typed from memory. */
const { execSync } = require('child_process');
const fs = require('fs');

function tap(query) {
  const cmd = 'curl -sS --max-time 120 -G "https://simbad.cds.unistra.fr/simbad/sim-tap/sync"' +
    ' --data-urlencode "request=doQuery" --data-urlencode "lang=adql"' +
    ' --data-urlencode "format=csv" --data-urlencode ' + JSON.stringify('query=' + query);
  return execSync(cmd, { maxBuffer: 1 << 26, timeout: 180000 }).toString();
}
function csv(text) {
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0].split(',');
  return lines.slice(1).map(l => {
    const cells = l.match(/("([^"]|"")*"|[^,]*)/g).filter((_, i) => i % 2 === 0);
    const o = {};
    head.forEach((h, i) => {
      let v = (cells[i] || '').replace(/^"|"$/g, '').trim();
      o[h] = (v === '' ? null : (isNaN(+v) ? v : +v));
    });
    return o;
  });
}

const NAMED = ['* eta UMa', '* zet UMa', '* eps UMa', '* del UMa',
               '* gam UMa', '* bet UMa', '* alf UMa', '* 80 UMa'];
const PROPER = { '* eta UMa': 'Alkaid', '* zet UMa': 'Mizar', '* eps UMa': 'Alioth',
                 '* del UMa': 'Megrez', '* gam UMa': 'Phecda', '* bet UMa': 'Merak',
                 '* alf UMa': 'Dubhe', '* 80 UMa': 'Alcor' };
const BAYER = { '* eta UMa': 'eta UMa', '* zet UMa': 'zeta UMa', '* eps UMa': 'epsilon UMa',
                '* del UMa': 'delta UMa', '* gam UMa': 'gamma UMa', '* bet UMa': 'beta UMa',
                '* alf UMa': 'alpha UMa', '* 80 UMa': '80 UMa' };

const idList = NAMED.map(s => "'" + s + "'").join(',');
const main = csv(tap(
  "SELECT i.id, b.main_id, b.ra, b.dec, b.plx_value, b.sp_type, f.V " +
  "FROM basic AS b JOIN ident AS i ON b.oid = i.oidref " +
  "LEFT JOIN allfluxes AS f ON f.oidref = b.oid WHERE i.id IN (" + idList + ")"));

/* Mizar's naked-eye entry carries no V — it is a resolved pair. Derive the
   combined magnitude from its two MEASURED components rather than typing a
   remembered number. */
const zeta = csv(tap(
  "SELECT i.id, f.V FROM basic AS b JOIN ident AS i ON b.oid = i.oidref " +
  "JOIN allfluxes AS f ON f.oidref = b.oid WHERE i.id IN ('* zet01 UMa','* zet02 UMa')"));
const z1 = zeta.find(r => /zet01/.test(r.id)), z2 = zeta.find(r => /zet02/.test(r.id));
const mizarV = +(-2.5 * Math.log10(Math.pow(10, -0.4 * z1.V) + Math.pow(10, -0.4 * z2.V))).toFixed(3);

const stars = NAMED.map(id => {
  const row = main.find(r => r.id.replace(/\s+/g, ' ').trim() === id);
  if (!row) throw new Error('missing ' + id);
  const pc = 1000 / row.plx_value;
  return {
    id: id, proper: PROPER[id], bayer: BAYER[id],
    raDeg: row.ra, decDeg: row.dec,
    parallaxMas: row.plx_value,
    spectralType: row.sp_type || null,
    vMag: row.V !== null && row.V !== undefined ? row.V : null,
    vMagDerived: row.V === null || row.V === undefined ? mizarV : null,
    distancePc: +pc.toFixed(3),
    distanceLy: +(pc * 3.26156).toFixed(2)
  };
});

const bg = csv(tap(
  "SELECT b.ra, b.dec, f.V FROM basic AS b JOIN allfluxes AS f ON f.oidref = b.oid " +
  "WHERE b.ra BETWEEN 160 AND 212 AND b.dec BETWEEN 44 AND 66 AND f.V < 6.0 " +
  "AND b.ra IS NOT NULL AND b.dec IS NOT NULL"))
  .filter(r => r.ra !== null && r.dec !== null && r.V !== null)
  .map(r => ({ raDeg: +(+r.ra).toFixed(5), decDeg: +(+r.dec).toFixed(5), vMag: +r.V }));

const out = {
  _note: 'Ursa Major field. Star positions, parallaxes and magnitudes are MEASURED values retrieved from SIMBAD. Nothing in this file was typed from memory. Constellation LINES are not astronomy and are not stored here — see MIG_CONSTELLATION_RESEARCH.md.',
  _source: 'SIMBAD Astronomical Database — CDS (Strasbourg), TAP service',
  _sourceUrl: 'https://simbad.cds.unistra.fr/simbad/sim-tap/sync',
  _sourceCredit: 'Wenger et al. 2000, A&AS 143, 9 — "The SIMBAD astronomical database"',
  _retrieved: '2026-08-21',
  measured: {
    _what: 'ra/dec (ICRS degrees), parallax (mas), spectral type, V magnitude — straight from SIMBAD',
    asterism: 'Big Dipper / Plough, the seven-star asterism within the constellation Ursa Major',
    stars: stars
  },
  derived: {
    _formula: 'distance_pc = 1000 / parallax_mas ; distance_ly = distance_pc * 3.26156',
    _mizar: 'The naked-eye entry for zeta UMa carries no V magnitude because SIMBAD resolves it as a pair. Combined magnitude derived from the MEASURED components zeta-1 (V=' +
            z1.V + ') and zeta-2 (V=' + z2.V + ') by flux addition: m = -2.5*log10(10^(-0.4*m1) + 10^(-0.4*m2)) = ' + mizarV,
    mizarCombinedV: mizarV,
    distanceSpreadLy: {
      nearest: Math.min(...stars.map(s => s.distanceLy)),
      farthest: Math.max(...stars.map(s => s.distanceLy)),
      _meaning: 'The figure is NOT a physical object. Five middle stars plus Alcor lie within a few light years of each other (the Ursa Major Moving Group); Dubhe and Alkaid are tens of light years further away and are not members. The shape exists only from here.'
    }
  },
  background: {
    _what: 'Every SIMBAD object in RA 160-212, Dec 44-66 with V < 6.0 — the naked-eye limit. Atmospheric context only.',
    _rule: 'These are RENDER-ONLY. They never enter the graph, the menu, or the pick list.',
    count: bg.length,
    stars: bg
  },
  unverified: {
    properNames: 'The proper names (Dubhe, Merak, ...) are traditional and were supplied by this file, not returned by the query. The Bayer designations ARE the queried identifiers.',
    asterismLineOrder: 'The order in which the seven stars are traditionally joined is a cultural convention, not a measurement. It is recorded in the research document, never here.'
  }
};

fs.writeFileSync('data/constellation-ursa-major.json', JSON.stringify(out, null, 1), 'utf8');
console.log('wrote data/constellation-ursa-major.json');
console.log('  named stars     ' + stars.length);
console.log('  background      ' + bg.length + ' (V < 6.0)');
console.log('  Mizar V derived ' + mizarV + '  from ' + z1.V + ' + ' + z2.V);
console.log('  distance spread ' + out.derived.distanceSpreadLy.nearest + ' – ' +
            out.derived.distanceSpreadLy.farthest + ' ly');
stars.forEach(s => console.log('   ' + s.proper.padEnd(7) + s.bayer.padEnd(13) +
  'RA ' + s.raDeg.toFixed(4).padStart(9) + '  Dec ' + s.decDeg.toFixed(4).padStart(8) +
  '  V ' + String(s.vMag === null ? s.vMagDerived + '*' : s.vMag).padStart(6) +
  '  ' + String(s.distanceLy).padStart(6) + ' ly'));
