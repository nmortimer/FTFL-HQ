export interface Team {
  slug: string;
  name: string;
  bg: string;      // each team's actual dark/base fill color from the workbook
  accent: string;  // each team's actual pop color from the workbook
  accent2: string; // each team's real secondary color, for a two-tone identity
  logo: string;
}

// These colors are NOT guessed. Every team tab in the master workbook
// already had its own deliberate 2-3 color scheme baked into the cell
// fills — this just surfaces it. Hue is real; saturation/lightness were
// pushed toward vivid (not muted) for a bold, jersey-like feel on a dark
// UI. accent2 that was genuinely white/silver in the sheet stays white —
// everything else got the vivid treatment. See scripts/import-from-excel.py.
export const teams: Team[] = [
  { slug: 'boulder-bandits', name: 'Boulder Bandits', bg: '#03182e', accent: '#39e1ef', accent2: '#ef3946', logo: '/logos/boulder-bandits.png' },
  { slug: 'broad-ripple-big-horns', name: 'Broad Ripple Big Horns', bg: '#000000', accent: '#ef5539', accent2: '#ef3969', logo: '/logos/broad-ripple-big-horns.png' },
  { slug: 'denver-diamondbacks', name: 'Denver Diamondbacks', bg: '#1d1d1f', accent: '#efab39', accent2: '#ffffff', logo: '/logos/denver-diamondbacks.png' },
  { slug: 'elkhart-express', name: 'Elkhart Express', bg: '#00274c', accent: '#efc939', accent2: '#ffffff', logo: '/logos/elkhart-express.png' },
  { slug: 'kansas-city-kaiju', name: 'Kansas City Kaiju', bg: '#000000', accent: '#efc439', accent2: '#ef4339', logo: '/logos/kansas-city-kaiju.png' },
  { slug: 'olde-town-osos', name: 'Olde Town Osos', bg: '#1b4500', accent: '#ef7739', accent2: '#efde39', logo: '/logos/olde-town-osos.png' },
  { slug: 'south-bend-silver-hawks', name: 'South Bend Silver Hawks', bg: '#0b3d28', accent: '#39efa2', accent2: '#ffffff', logo: '/logos/south-bend-silver-hawks.png' },
  { slug: 'strasbourg-soldiers', name: 'Strasbourg Soldiers', bg: '#10172a', accent: '#39b8ef', accent2: '#ef393e', logo: '/logos/strasbourg-soldiers.png' },
  { slug: 'summit-county-ski-bums', name: 'Summit County Ski Bums', bg: '#0e5d78', accent: '#39dfef', accent2: '#ffffff', logo: '/logos/summit-county-ski-bums.png' },
  { slug: 'wakarusa-wizards', name: 'Wakarusa Wizards', bg: '#000000', accent: '#efb239', accent2: '#ffffff', logo: '/logos/wakarusa-wizards.png' },
];

export function teamBySlug(slug: string): Team {
  const t = teams.find((t) => t.slug === slug);
  if (!t) throw new Error(`Unknown team: ${slug}`);
  return t;
}
