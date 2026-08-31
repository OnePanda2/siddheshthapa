/* The asterism's draw order is a CULTURAL CONVENTION, not a measurement, so it
   lives under `unverified` where no check can mistake it for astronomy. It is
   used for one purpose only: fixing which graph object lands on which star.
   Also record that no depth exaggeration is used — measurement showed the
   figure is 0.90x as deep as it is wide, so true relative scale suffices. */
const fs = require('fs');
const F = 'data/constellation-ursa-major.json';
const d = JSON.parse(fs.readFileSync(F, 'utf8'));

d.unverified.asterismDrawOrder = ['Alkaid', 'Mizar', 'Alioth', 'Megrez', 'Phecda', 'Merak', 'Dubhe'];
d.unverified.asterismDrawOrderNote =
  'Handle tip to bowl lip, the conventional traversal of the Big Dipper. A cultural convention, NOT a measurement, and never drawn as astronomy. Used only to fix the graph-object-to-star sequence.';
d.unverified.offAsterismStar = 'Alcor';
d.unverified.offAsterismNote =
  'Alcor is a real star of the field but is NOT part of the seven-star asterism. It receives the graph object that has no relationship inside its own region.';

d.derived.trueExtentLy = {
  transverseX: 43.8, transverseY: 24.8, depth: 39.2, depthOverWidth: 0.90,
  _formula: 'RA/Dec/distance -> Cartesian light years, rotated so the mean line of sight is the depth axis',
  _meaning: 'The figure is very nearly as DEEP as it is WIDE. No depth exaggeration is required or used: the renderer applies true relative 3D scale with a single map constant, exactly as WORLD_SCALE does for the other worlds.'
};
d.derived.meanDistanceLy = +(d.measured.stars.reduce((a, s) => a + s.distanceLy, 0) /
                             d.measured.stars.length).toFixed(3);
d.derived._meanDistanceUse =
  'The ideal viewpoint sits at this distance along the depth axis — the scaled equivalent of where Earth actually stands. The figure resolves there because that is where the pattern was drawn from.';

d.illustrative = {
  _warning: 'NOT ASTRONOMY. Rendering choices only. Must never be presented as measured.',
  sceneUnitsPerLightYear: 'a map scale, like WORLD_SCALE for the other worlds — it sets size, never ratios',
  backgroundStarDepth: 'The 53 background stars have no parallax in this dataset, so they carry NO measured distance. They are placed behind the figure at a declared depth. Their RA/Dec are measured; their depth is not.',
  fieldRoll: 'the angle the plate is presented at — cosmetic'
};

fs.writeFileSync(F, JSON.stringify(d, null, 1), 'utf8');
console.log('draw order + true-extent recorded');
console.log('  order        ' + d.unverified.asterismDrawOrder.join(' -> '));
console.log('  off-asterism ' + d.unverified.offAsterismStar);
console.log('  depth/width  ' + d.derived.trueExtentLy.depthOverWidth + 'x  -> no exaggeration used');
console.log('  mean dist    ' + d.derived.meanDistanceLy + ' ly (the ideal viewpoint)');
console.log('  provenance   ' + Object.keys(d).filter(k => k[0] !== '_').join(', '));
