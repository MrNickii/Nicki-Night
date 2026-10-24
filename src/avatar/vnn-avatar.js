/* Virtual Nicki Night: layered avatar module (catalog + look composer + renderer). Needs rig8.js loaded first (RIG). */
var VNNA = (function () {
  var P = '#ff3fa4';
  var CATALOG = {
    version: 3,
    bodies: ['straight', 'curvy'],
    heights: [{ id: 'short', label: 'Short', hs: 0.93, legk: 0.97 }, { id: 'regular', label: 'Regular', hs: 1, legk: 1 }, { id: 'tall', label: 'Tall', hs: 1.07, legk: 1.06 }],
    /* tintable tops: col = default colour. Signature looks keep their own colours. */
    looks: [
      { id: 'tee', name: 'Boxy tee', fit: 'any', unlock: 'free', sheet: 'TOP-SLEEVED-1', v: 'A', col: '#f4f0fa' },
      { id: 'croptop', name: 'Ribbed crop', fit: 'fem', unlock: 'free', sheet: 'TOP-SLEEVED-1', v: 'B', col: '#ff3fa4' },
      { id: 'hoodie', name: 'Hoodie', fit: 'any', unlock: 'free', sheet: 'TOP-SLEEVED-2', v: 'A', col: '#7c5cff' },
      { id: 'shirt', name: 'Button-up', fit: 'any', unlock: 'free', sheet: 'TOP-SLEEVED-2', v: 'B', col: '#f4f0fa' },
      { id: 'cropbomber', name: 'Cropped bomber', fit: 'any', unlock: 'free', sheet: 'TOP-SLEEVED-3', v: 'A', col: '#16101f' },
      { id: 'blazer', name: 'Blazer', fit: 'any', unlock: 'free', sheet: 'TOP-SLEEVED-3', v: 'B', col: '#16101f' },
      { id: 'tank', name: 'Ribbed tank', fit: 'any', unlock: 'free', sheet: 'TOP-SLEEVELESS-1', v: 'A', col: '#16101f' },
      { id: 'halter', name: 'Halter', fit: 'fem', unlock: 'free', sheet: 'TOP-SLEEVELESS-1', v: 'B', col: '#ff3fa4' },
      { id: 'corset', name: 'Corset', fit: 'fem', unlock: 'free', sheet: 'TOP-SLEEVELESS-2', v: 'A', col: '#16101f' },
      { id: 'tube', name: 'Tube top', fit: 'fem', unlock: 'free', sheet: 'TOP-SLEEVELESS-2', v: 'B', col: '#f4f0fa' },
      { id: 'bodysuit', name: 'Bodysuit', fit: 'fem', unlock: 'free', sheet: 'TOP-SLEEVELESS-3', v: 'A', col: '#d62839' },
      { id: 'cami', name: 'Lace cami', fit: 'fem', unlock: 'free', sheet: 'TOP-SLEEVELESS-3', v: 'B', col: '#f4f0fa' },
      { id: 'slipdress', name: 'Slip dress', fit: 'fem', unlock: 'earned', dress: true, sheet: 'DRESS-1', col: '#d62839' },
      { id: 'bodycon', name: 'Bodycon dress', fit: 'fem', unlock: 'earned', dress: true, sheet: 'DRESS-2', col: '#16101f' },
      { id: 'skater', name: 'Skater dress', fit: 'fem', unlock: 'earned', dress: true, sheet: 'DRESS-3', col: '#ff3fa4' },
      { id: 'satindress', name: 'Satin midi dress', fit: 'fem', unlock: 'earned', dress: true, sheet: 'DRESS-4', col: '#f2c14e' },
      { id: 'pinkfriday', name: 'Pink Friday', fit: 'any', unlock: 'free', sig: 1, sheet: 'SIG-TOP-1', v: 'A' },
      { id: 'queen', name: 'Queen', fit: 'any', unlock: 'vip', sig: 1, sheet: 'SIG-TOP-1', v: 'B' },
      { id: 'harajuku', name: 'Harajuku', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-2', v: 'A' },
      { id: 'roman', name: 'Roman', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-2', v: 'B' },
      { id: 'queens', name: 'Queens', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-3', v: 'A' },
      { id: 'trini', name: 'Trini', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-3', v: 'B' },
      { id: 'barbtee', name: 'Barb Tee', fit: 'any', unlock: 'free', sig: 1, sheet: 'SIG-TOP-4', v: 'A' },
      { id: 'chrome', name: 'Chrome', fit: 'any', unlock: 'vip', sig: 1, sheet: 'SIG-TOP-4', v: 'B' },
      { id: 'varsity', name: 'Varsity', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-5', v: 'A' },
      { id: 'bomber', name: 'Bomber', fit: 'any', unlock: 'vip', sig: 1, sheet: 'SIG-TOP-5', v: 'B' },
      { id: 'letterman', name: 'Letterman', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-6', v: 'A' },
      { id: 'whitebomber', name: 'Sky Bomber', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-6', v: 'B' },
      { id: 'racermoto', name: 'Racer Moto', fit: 'any', unlock: 'vip', sheet: 'TOP-SLEEVED-4', v: 'A', col: '#16101f' },
      { id: 'cablesweater', name: 'Cable Sweater', fit: 'any', unlock: 'free', sheet: 'TOP-SLEEVED-4', v: 'B', col: '#f4f0fa' },
      { id: 'puffvest', name: 'Puff Vest', fit: 'any', unlock: 'earned', sheet: 'TOP-SLEEVELESS-4', v: 'A', col: '#ff9a3c' },
      { id: 'waistcoat', name: 'Tailored Waistcoat', fit: 'any', unlock: 'free', sheet: 'TOP-SLEEVELESS-4', v: 'B', col: '#16101f' },
      { id: 'partydress', name: 'Sculpted Party Dress', fit: 'fem', unlock: 'vip', dress: true, sheet: 'DRESS-5', col: '#d62839' },
      { id: 'orbithaori', name: 'Orbit Haori', fit: 'any', unlock: 'vip', sig: 1, sheet: 'SIG-TOP-8', v: 'A' },
      { id: 'barbcrystal', name: 'Barb Crystal Tee', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-9', v: 'A' },
      { id: 'resortmuscle', name: 'Resort Muscle Top', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-9', v: 'B' },
      { id: 'pinkprintzip', name: 'Pinkprint Zip', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-10', v: 'A' },
      { id: 'cityletterman', name: 'City Letterman', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-10', v: 'B' },
      { id: 'pf2bomber', name: 'PF2 Flight Bomber', fit: 'masc', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-11', v: 'A' },
      { id: 'pinkprintcrew', name: 'Pinkprint Crew', fit: 'masc', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-11', v: 'B' },
      { id: 'nightanorak', name: 'Nightshift Anorak', fit: 'any', unlock: 'vip', sig: 1, sheet: 'SIG-TOP-8', v: 'B' },
      { id: 'nickitee', name: 'Nicki Tee', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-7', v: 'A' },
      { id: 'nickicrew', name: 'Nicki Crew', fit: 'any', unlock: 'earned', sig: 1, sheet: 'SIG-TOP-7', v: 'B' },
      { id: 'nicki', name: 'Silver and fur', unlock: 'nicki', body: 'curvy', sheet: 'NICKI-1', nk: 1, hair: 'long', hairColor: 'black', shoes: 'boots', shoesColor: 'black', acc: ['crown', 'visor', 'choker'], accColor: 'gold' },
      { id: 'nicki2', name: 'Neon trench', unlock: 'nicki', body: 'curvy', sheet: 'NICKI-2', nk: 1, hair: 'wavy', hairColor: 'sunset', shoes: 'chunky', shoesColor: 'green', acc: ['crown', 'chain'], accColor: 'gold' },
      { id: 'nicki3', name: 'Burgundy suit', unlock: 'nicki', body: 'curvy', sheet: 'NICKI-3', nk: 1, hair: 'bob', hairColor: 'platinum', shoes: 'boots', shoesColor: 'burgundy', acc: ['crown'], accColor: 'gold' },
      { id: 'nicki4', name: 'Pink latex', unlock: 'nicki', body: 'curvy', sheet: 'NICKI-4', nk: 1, hair: 'long', hairColor: 'peach', shoes: 'heels', shoesColor: 'orange', acc: ['crown', 'choker'], accColor: 'silver' },
      { id: 'nicki5', name: 'Rose Circuit', unlock: 'nicki', body: 'curvy', sheet: 'NICKI-5', nk: 1, hair: 'long', hairColor: 'pink', shoes: 'heels', shoesColor: 'pink', acc: ['crown', 'choker'], accColor: 'gold' }
    ],
    bottoms: [
      { id: 'jeans', name: 'Jeans', unlock: 'free', sheet: 'BOTTOM-PANTS-1', col: '#3f6fb0' },
      { id: 'cargo', name: 'Cargo pants', unlock: 'free', sheet: 'BOTTOM-PANTS-2', col: '#6b7a4a' },
      { id: 'flares', name: 'Flares', unlock: 'free', sheet: 'BOTTOM-PANTS-3', col: '#7a2d9e' },
      { id: 'joggers', name: 'Joggers', unlock: 'free', sheet: 'BOTTOM-PANTS-4', col: '#8a8f9c' },
      { id: 'trousers', name: 'Wide trousers', unlock: 'free', sheet: 'BOTTOM-PANTS-5', col: '#d9cfb8' },
      { id: 'cutoffs', name: 'Cutoff shorts', unlock: 'free', sheet: 'BOTTOM-SHORTS-1', col: '#3f6fb0', alias: ['shorts'] },
      { id: 'bikers', name: 'Biker shorts', unlock: 'free', sheet: 'BOTTOM-SHORTS-2', col: '#16101f' },
      { id: 'miniskirt', name: 'Mini skirt', unlock: 'earned', skirt: true, sheet: 'BOTTOM-SKIRTS-1', v: 'A', col: '#ff3fa4' },
      { id: 'midiskirt', name: 'Midi skirt', unlock: 'earned', skirt: true, sheet: 'BOTTOM-SKIRTS-1', v: 'B', col: '#1f6f5a' },
      { id: 'pleated', name: 'Pleated skirt', unlock: 'earned', skirt: true, sheet: 'BOTTOM-SKIRTS-2', v: 'A', col: '#3b82f6' },
      { id: 'denimskirt', name: 'Denim skirt', unlock: 'earned', skirt: true, sheet: 'BOTTOM-SKIRTS-2', v: 'B', col: '#3f6fb0' },
      { id: 'leathertrousers', name: 'Leather Trousers', unlock: 'vip', sheet: 'BOTTOM-PANTS-6', col: '#16101f' },
      { id: 'resortshorts', name: 'Resort Sweatshorts', unlock: 'earned', fixed: 1, sheet: 'BOTTOM-SHORTS-4' },
      { id: 'airbrushjoggers', name: 'Airbrush Joggers', unlock: 'earned', fixed: 1, sheet: 'BOTTOM-PANTS-7' },
      { id: 'gagcargos', name: 'Gag City Cargos', unlock: 'earned', fixed: 1, sheet: 'BOTTOM-PANTS-8' },
      { id: 'courtshorts', name: 'Court Shorts', unlock: 'free', sheet: 'BOTTOM-SHORTS-3', col: '#f4f0fa' },
      { id: 'utilitymini', name: 'Utility Mini', unlock: 'earned', skirt: true, sheet: 'BOTTOM-SKIRTS-3', v: 'A', col: '#6b7a4a' },
      { id: 'wrapmidi', name: 'Wrap Midi', unlock: 'vip', skirt: true, sheet: 'BOTTOM-SKIRTS-3', v: 'B', col: '#16101f' }
    ],
    shoes: [
      { id: 'sneakers', name: 'High-tops', sheet: 'SHOES-1', v: 'A', col: '#f4f0fa' },
      { id: 'chunky', name: 'Chunky sneakers', sheet: 'SHOES-1', v: 'B', col: '#f4f0fa' },
      { id: 'ankle', name: 'Ankle boots', sheet: 'SHOES-1', v: 'C', col: '#16101f' },
      { id: 'combat', name: 'Combat boots', sheet: 'SHOES-2', v: 'A', col: '#16101f' },
      { id: 'heels', name: 'Stilettos', sheet: 'SHOES-2', v: 'B', col: '#d62839' },
      { id: 'boots', name: 'Tall boots', sheet: 'SHOES-2', v: 'C', col: '#7a1226', shaft: { sheet: 'SHOES-3', v: 'A' } },
      { id: 'warmers', name: 'Leg warmers', sheet: 'SHOES-1', v: 'A', col: '#f4f0fa', shaft: { sheet: 'SHOES-3', v: 'B', col: '#ff9ed2' } },
      { id: 'westernboots', name: 'Western Boots', unlock: 'vip', sheet: 'SHOES-4', v: 'A', col: '#8a5a34', shaft: { sheet: 'SHOES-5', v: 'A' } },
      { id: 'fphightops', name: 'Fingerprint High-tops', unlock: 'earned', fixed: 1, sheet: 'SHOES-6', v: 'A' },
      { id: 'crowntrainers', name: 'Crown Trainers', unlock: 'earned', fixed: 1, sheet: 'SHOES-6', v: 'B' },
      { id: 'pinkstarboots', name: 'Pink Star Boots', unlock: 'earned', fixed: 1, sheet: 'SHOES-6', v: 'C' },
      { id: 'loafers', name: 'Penny Loafers', unlock: 'earned', sheet: 'SHOES-4', v: 'B', col: '#16101f', shaft: { sheet: 'SHOES-5', v: 'B', col: '#f4f0fa' } },
      { id: 'cloudslides', name: 'Cloud Slides', unlock: 'free', sheet: 'SHOES-4', v: 'C', col: '#f4f0fa' }
    ],
    /* dances: clip = mocap clip id; viewers can still use the six original names */
    dances: [
      { id: 'groove', name: 'Groove', clip: 'hh1' }, { id: 'bounce', name: 'Bounce', clip: 'hh2' }, { id: 'rock', name: 'Rock', clip: 'hh3' },
      { id: 'shuffle', name: 'Shuffle', clip: 'hh4' }, { id: 'pump', name: 'Pump', clip: 'hh5' }, { id: 'wave', name: 'Wave', clip: 'hh6' },
      { id: 'bboy', name: 'B-boy', clip: 'bboy' }, { id: 'twerk', name: 'Twerk', clip: 'twerk' }, { id: 'snake', name: 'Snake', clip: 'snake' }
    ],
    danceAlias: { sway: 'rock', spin: 'bboy', hop: 'bounce' },
    colors: {
      clothing: [
        { id: 'black', hex: '#16101f' }, { id: 'white', hex: '#f4f0fa' }, { id: 'pink', hex: '#ff3fa4' }, { id: 'red', hex: '#d62839' },
        { id: 'orange', hex: '#ff9a3c' }, { id: 'yellow', hex: '#ffd23f' }, { id: 'green', hex: '#2fbf5a' }, { id: 'teal', hex: '#1fc8b8' },
        { id: 'blue', hex: '#3b82f6' }, { id: 'purple', hex: '#7c5cff' }, { id: 'burgundy', hex: '#7a1f3a', hidden: 1 }
      ]
    },
    skin: [
      { id: 'porcelain', name: 'Porcelain', hex: '#f8cdb6' }, { id: 'sand', name: 'Sand', hex: '#ecba96' },
      { id: 'honey', name: 'Honey', hex: '#dc9b6c' }, { id: 'caramel', name: 'Caramel', hex: '#c4825a' },
      { id: 'bronze', name: 'Bronze', hex: '#a9683f' }, { id: 'mocha', name: 'Mocha', hex: '#86543a' },
      { id: 'cocoa', name: 'Cocoa', hex: '#6a412b' }, { id: 'espresso', name: 'Espresso', hex: '#4b2c1e' }
    ],
    accessories: {
      items: [
        { id: 'shades', name: 'Shades', slot: 'face', sheet: 'ACC-HEAD', key: 'SHADES', fit: 'any' },
        { id: 'heartshades', name: 'Heart shades', slot: 'face', sheet: 'ACC-HEAD', key: 'HEART_SHADES', fit: 'fem' },
        { id: 'cap', name: 'Baseball cap', slot: 'head', sheet: 'ACC-HEAD', key: 'BASEBALL_CAP', fit: 'any' },
        { id: 'headphones', name: 'DJ headphones', slot: 'head', sheet: 'ACC-HEAD', key: 'HEADPHONES', fit: 'any' },
        { id: 'beanie', name: 'Beanie', slot: 'head', sheet: 'ACC-HEAD', key: 'BEANIE', fit: 'any' },
        { id: 'bandana', name: 'Bandana', slot: 'head', sheet: 'ACC-HEAD', key: 'HEADBAND_BANDANA', fit: 'any' },
        { id: 'bucket', name: 'Bucket hat', slot: 'head', sheet: 'ACC-HEAD', key: 'BUCKET_HAT', fit: 'any' },
        { id: 'bow', name: 'Hair bow', slot: 'head', sheet: 'ACC-HEAD', key: 'HAIR_BOW', fit: 'fem' },
        { id: 'hoops', name: 'Hoops', slot: 'ears', sheet: 'ACC-HEAD', key: 'HOOP_EARRINGS', fit: 'any' },
        { id: 'cowboyhat', name: 'Cowboy hat', slot: 'head', sheet: 'ACC-HEAD-2', key: 'COWBOY_HAT', unlock: 'earned', fit: 'any' },
        { id: 'fedora', name: 'Fedora', slot: 'head', sheet: 'ACC-HEAD-2', key: 'FEDORA_HAT', unlock: 'earned', fit: 'any' },
        { id: 'beret', name: 'Artist beret', slot: 'head', sheet: 'ACC-HEAD-2', key: 'ARTIST_BERET', fit: 'any' },
        { id: 'durag', name: 'Silk durag', slot: 'head', sheet: 'ACC-HEAD-2', key: 'SILK_DURAG', unlock: 'earned', fit: 'any' },
        { id: 'sportvisor', name: 'Sport visor', slot: 'head', sheet: 'ACC-HEAD-2', key: 'SPORT_VISOR', fit: 'any' },
        { id: 'orbitglasses', name: 'Orbit glasses', slot: 'face', sheet: 'ACC-HEAD-2', key: 'ORBIT_GLASSES', unlock: 'vip', fit: 'any' },
        { id: 'cateye', name: 'Cat-eye glasses', slot: 'face', sheet: 'ACC-HEAD-2', key: 'CATEYE_GLASSES', unlock: 'earned', fit: 'any' },
        { id: 'halo', name: 'Halo band', slot: 'head', sheet: 'ACC-HEAD-2', key: 'HALO_BAND', unlock: 'vip', fit: 'any' },
        { id: 'airtrucker', name: 'Airbrush Trucker', slot: 'head', sheet: 'ACC-HEAD-3', key: 'TRUCKER_HAT', unlock: 'earned', fit: 'any', full: 1 },
        { id: 'fuzzybucket', name: 'Fuzzy Bucket', slot: 'head', sheet: 'ACC-HEAD-3', key: 'FUZZY_BUCKET', unlock: 'earned', fit: 'any', full: 1 },
        { id: 'citysnap', name: 'City Snapback', slot: 'head', sheet: 'ACC-HEAD-3', key: 'CITY_SNAPBACK', unlock: 'earned', fit: 'any', full: 1 },
        { id: 'satinscarf', name: 'Satin Headscarf', slot: 'head', sheet: 'ACC-HEAD-3', key: 'SATIN_HEADSCARF', unlock: 'earned', fit: 'any', full: 1 },
        { id: 'pinkbeanie', name: 'Pinkprint Beanie', slot: 'head', sheet: 'ACC-HEAD-3', key: 'PINKPRINT_BEANIE', unlock: 'earned', fit: 'any', full: 1 },
        { id: 'nightshades', name: 'Night Shades', slot: 'face', sheet: 'ACC-HEAD-3', key: 'NIGHT_SHADES', unlock: 'earned', fit: 'any', full: 1 },
        { id: 'crystalcat', name: 'Crystal Cat-eye', slot: 'face', sheet: 'ACC-HEAD-3', key: 'CRYSTAL_CATEYE', unlock: 'earned', fit: 'any', full: 1 },
        { id: 'heartcrown', name: 'Heart Crown', slot: 'head', sheet: 'ACC-HEAD-3', key: 'HEART_CROWN', unlock: 'earned', fit: 'any', full: 1 },
        { id: 'heartstud', name: 'Heart Stud', slot: 'ears', sheet: 'ACC-HEAD-3', key: 'HEART_STUD', unlock: 'earned', fit: 'any', full: 1 },
        { id: 'gemstuds', name: 'Gem studs', slot: 'ears', sheet: 'ACC-HEAD-2', key: 'GEM_STUDS', fit: 'any' },
        { id: 'chain', name: 'Gold chain', slot: 'neck', key: 'NECKLACE', fit: 'any' },
        { id: 'pearls', name: 'Pearls', slot: 'neck', key: 'PEARLS', fit: 'fem' },
        { id: 'choker', name: 'Choker', slot: 'neck', key: 'CHOKER', fit: 'fem' },
        { id: 'belt', name: 'Chain belt', slot: 'waist', key: 'BELT', fit: 'any' },
        { id: 'bag', name: 'Crossbody bag', slot: 'carry', key: 'HIPBAG', fit: 'any' },
        { id: 'nails', name: 'Long nails', slot: 'hands', fit: 'any' },
        { id: 'bracelets', name: 'Bracelets', slot: 'wrist', key: 'BRACELETS', fit: 'any' },
        { id: 'watch', name: 'Watch', slot: 'wrist', key: 'WATCH', fit: 'any' },
        { id: 'armband', name: 'Arm band', slot: 'arm', key: 'ARM_BAND', fit: 'any' },
        { id: 'visor', name: 'Gold visor', slot: 'face', sheet: 'ACC-SPECIAL', key: 'GOLD_VISOR', full: 1, unlock: 'vip', fit: 'any' },
        { id: 'glamshades', name: 'Glam shades', slot: 'face', sheet: 'ACC-SPECIAL', key: 'GLAM_SHADES', full: 1, unlock: 'vip', fit: 'any' },
        { id: 'crown', name: 'Crown', slot: 'head', sheet: 'ACC-SPECIAL', key: 'CROWN', full: 1, unlock: 'nicki', hidden: 1, fit: 'any' }
      ],
      colors: [{ id: 'gold', name: 'Gold', hex: '#f2c14e' }, { id: 'pink', name: 'Pink', hex: '#ff4fb0' }, { id: 'silver', name: 'Silver', hex: '#cfd6e6' }, { id: 'black', name: 'Black', hex: '#1b1426' }]
    },
    hair: {
      styles: [
        { id: 'long', name: 'Long straight', fit: 'fem', sheet: 'HAIR-1', v: 'A' }, { id: 'wavy', name: 'Long wavy', fit: 'fem', sheet: 'HAIR-1', v: 'B' },
        { id: 'bob', name: 'Chin bob', fit: 'fem', sheet: 'HAIR-2', v: 'A' }, { id: 'ponytail', name: 'High ponytail', fit: 'fem', sheet: 'HAIR-2', v: 'B' },
        { id: 'buns', name: 'Space buns', fit: 'fem', sheet: 'HAIR-3', v: 'A' }, { id: 'fade', name: 'Fade with curls', fit: 'masc', sheet: 'HAIR-3', v: 'B' },
        { id: 'flattop', name: 'Flat top', fit: 'masc', sheet: 'HAIR-4', v: 'A' }, { id: 'hightop', name: 'High-top fade', fit: 'masc', sheet: 'HAIR-4', v: 'B' },
        { id: 'manbun', name: 'Man bun', fit: 'masc', sheet: 'HAIR-5', v: 'A' }, { id: 'twists', name: 'Twists', fit: 'any', sheet: 'HAIR-5', v: 'B' },
        { id: 'cornrows', name: 'Cornrows', fit: 'any', sheet: 'HAIR-6', v: 'A' }, { id: 'locs', name: 'Locs', fit: 'any', sheet: 'HAIR-6', v: 'B' },
        { id: 'afro', name: 'Big afro', fit: 'any', sheet: 'HAIR-7', v: 'A' }, { id: 'boxbraids', name: 'Box braids', fit: 'any', sheet: 'HAIR-7', v: 'B' },
        { id: 'pixie', name: 'Pixie cut', fit: 'fem', sheet: 'HAIR-8', v: 'A' }, { id: 'puffs', name: 'Double puffs', fit: 'fem', sheet: 'HAIR-8', v: 'B' },
        { id: 'bantu', name: 'Bantu knots', fit: 'any', sheet: 'HAIR-9', v: 'A' }, { id: 'wolf', name: 'Wolf cut', fit: 'any', sheet: 'HAIR-9', v: 'B' },
        { id: 'pigtails', name: 'Pigtail braids', fit: 'fem', sheet: 'HAIR-10', v: 'A' }, { id: 'slickback', name: 'Slick-back wave', fit: 'masc', sheet: 'HAIR-10', v: 'B' },
        { id: 'braidpony', name: 'Braided Ponytail', fit: 'any', unlock: 'vip', sheet: 'HAIR-11', v: 'A' }, { id: 'layeredcurls', name: 'Layered Curls', fit: 'any', unlock: 'earned', sheet: 'HAIR-11', v: 'B' },
        { id: 'frenchbraid', name: 'French Braid', fit: 'fem', sheet: 'HAIR-12', v: 'A' },
        { id: 'gibson', name: 'Gibson Roll', fit: 'fem', sheet: 'HAIR-12', v: 'B' },
        { id: 'halfupknot', name: 'Half-up Knot', fit: 'fem', sheet: 'HAIR-13', v: 'A' },
        { id: 'shoulderflip', name: 'Shoulder Flip', fit: 'fem', sheet: 'HAIR-13', v: 'B' },
        { id: 'crimped', name: 'Crimped Cascade', fit: 'fem', unlock: 'earned', sheet: 'HAIR-14', v: 'A' },
        { id: 'bubbletail', name: 'Bubble Tail', fit: 'fem', unlock: 'earned', sheet: 'HAIR-14', v: 'B' },
        { id: 'jellyfish', name: 'Jellyfish Cut', fit: 'fem', unlock: 'earned', sheet: 'HAIR-15', v: 'A' },
        { id: 'fulani', name: 'Fulani Sweep', fit: 'fem', unlock: 'earned', sheet: 'HAIR-15', v: 'B' },
        { id: 'victoryrolls', name: 'Victory Rolls', fit: 'fem', unlock: 'vip', sheet: 'HAIR-16', v: 'A' },
        { id: 'beehive', name: 'Sculpted Beehive', fit: 'fem', unlock: 'vip', sheet: 'HAIR-16', v: 'B' },
        { id: 'crownbraid', name: 'Crown Braid', fit: 'fem', unlock: 'vip', sheet: 'HAIR-17', v: 'A' },
        { id: 'ropechignon', name: 'Rope Chignon', fit: 'fem', unlock: 'vip', sheet: 'HAIR-17', v: 'B' },
        { id: 'crewcut', name: 'Crew Cut', fit: 'masc', sheet: 'HAIR-18', v: 'A' },
        { id: 'sidepart', name: 'Side Part', fit: 'masc', sheet: 'HAIR-18', v: 'B' },
        { id: 'curtainpart', name: 'Curtain Part', fit: 'masc', sheet: 'HAIR-19', v: 'A' },
        { id: 'brushup', name: 'Brush Up', fit: 'masc', sheet: 'HAIR-19', v: 'B' },
        { id: 'curlymullet', name: 'Curly Mullet', fit: 'masc', unlock: 'earned', sheet: 'HAIR-20', v: 'A' },
        { id: 'fauxhawk', name: 'Faux Hawk', fit: 'masc', unlock: 'earned', sheet: 'HAIR-20', v: 'B' },
        { id: 'twoblock', name: 'Two Block', fit: 'masc', unlock: 'earned', sheet: 'HAIR-21', v: 'A' },
        { id: 'angfringe', name: 'Angular Fringe', fit: 'masc', unlock: 'earned', sheet: 'HAIR-21', v: 'B' },
        { id: 'libspikes', name: 'Liberty Spikes', fit: 'masc', unlock: 'vip', sheet: 'HAIR-22', v: 'A' },
        { id: 'quiff', name: 'Rockabilly Quiff', fit: 'masc', unlock: 'vip', sheet: 'HAIR-22', v: 'B' },
        { id: 'regencycurls', name: 'Regency Curls', fit: 'masc', unlock: 'vip', sheet: 'HAIR-23', v: 'A' },
        { id: 'vikingplait', name: 'Viking Plait', fit: 'masc', unlock: 'vip', sheet: 'HAIR-23', v: 'B' }
      ],
      colors: [
        { id: 'black', name: 'Black', hex: '#0b0710' }, { id: 'brown', name: 'Brown', hex: '#5a3420' }, { id: 'auburn', name: 'Auburn', hex: '#8a3b1f' },
        { id: 'ginger', name: 'Ginger', hex: '#c8642a' }, { id: 'blonde', name: 'Blonde', hex: '#e2b95c' }, { id: 'platinum', name: 'Platinum', hex: '#f3ecd6' },
        { id: 'white', name: 'White', hex: '#fafafa' }, { id: 'silver', name: 'Silver', hex: '#b9c0cc' }, { id: 'red', name: 'Red', hex: '#b5301f' },
        { id: 'burgundy', name: 'Burgundy', hex: '#6a1330' }, { id: 'pink', name: 'Pink', hex: '#ff4fb0' }, { id: 'purple', name: 'Purple', hex: '#7c3fe0' },
        { id: 'lilac', name: 'Lilac', hex: '#a07bff' }, { id: 'blue', name: 'Blue', hex: '#2f7bff' }, { id: 'teal', name: 'Teal', hex: '#22c7b8' },
        { id: 'green', name: 'Green', hex: '#2fbf5a' }, { id: 'orange', name: 'Orange', hex: '#ff8a1f' }, { id: 'yellow', name: 'Yellow', hex: '#ffd23f' },
        { id: 'peach', name: 'Peach', hex: '#f2c9a0', hidden: 1 },
        { id: 'ombre', name: 'Ombre', ombre: ['#ff4fb0', '#a07bff', '#4fa8ff'] }, { id: 'sunset', name: 'Sunset', ombre: ['#ff4f6d', '#ff9a3c', '#ffd23f'] }, { id: 'ocean', name: 'Ocean', ombre: ['#22c7b8', '#2f7bff', '#7c3fe0'] }
      ]
    }
  };
  function byId(a, id) { for (var i = 0; i < a.length; i++) if (a[i].id === id || (a[i].alias && a[i].alias.indexOf(id) >= 0)) return a[i]; return null; }
  function hex2(h) { h = String(h).replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function clothHex(id, dflt) { var c = byId(CATALOG.colors.clothing, id); return c ? c.hex : dflt; }

  /* ------------------------------------------------ composer */
  var LIB = null, BASE = '', Q = 1, IMG = {}, TINT = {}, TORD = [], CACHE = {}, CORDER = [];
  function tkeep(ck, c) { TINT[ck] = c; TORD.push(ck); while (TORD.length > 300) delete TINT[TORD.shift()]; return c; } /* recoloured layers: capped so long shows don't pile them up */
  function loadJSON(url) { return fetch(url + (url.indexOf('?') < 0 ? '?v=' + Math.floor(Date.now() / 600000) : '')).then(function (r) { return r.json(); }); }
  function img(f) { if (IMG[f]) return IMG[f]; return IMG[f] = new Promise(function (res, rej) { var i = new Image(); i.crossOrigin = 'anonymous'; i.onload = function () { res(i); }; i.onerror = function () { rej(new Error('img ' + f)); }; i.src = BASE + f; }); }
  function init(base, mocap) {
    BASE = base; return Promise.all([loadJSON(base + 'lib.json'), typeof mocap === 'string' ? loadJSON(mocap) : Promise.resolve(mocap)]).then(function (z) { LIB = z[0]; Q = LIB.q || 1; RIG.load(z[1]); return LIB; });
  }
  function colArr(c) { return typeof c === 'string' ? hex2(c) : c; }
  function tint(im, col, key) {
    var ck = key + '|' + (col.ombre ? col.ombre.join('') : col.join(',')); if (TINT[ck]) return TINT[ck];
    var c = document.createElement('canvas'); c.width = im.width; c.height = im.height; var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    var d = x.getImageData(0, 0, c.width, c.height), p = d.data, n = p.length / 4, i, hist = new Uint32Array(256), cnt = 0, W = c.width, H = c.height;
    for (i = 0; i < n; i++) if (p[i * 4 + 3] > 128) { hist[(p[i * 4] * 0.3 + p[i * 4 + 1] * 0.59 + p[i * 4 + 2] * 0.11) | 0]++; cnt++; }
    var acc = 0, ref = 255, tgt = cnt * 0.08; for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc >= tgt) { ref = Math.max(60, i); break; } }
    var om = col.ombre ? col.ombre.map(hex2) : null, cc = om ? null : col;
    for (i = 0; i < n; i++) {
      if (om) { var t = Math.floor(i / W) / H * 2, s = Math.min(1, t), a = t < 1 ? om[0] : om[1], b = t < 1 ? om[1] : om[2], f = t < 1 ? t : t - 1; cc = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
      var L = (p[i * 4] * 0.3 + p[i * 4 + 1] * 0.59 + p[i * 4 + 2] * 0.11) / ref, k = Math.min(L, 1.25), r, g, bb, dk = 1 - (cc[0] * 0.3 + cc[1] * 0.59 + cc[2] * 0.11) / 255, lift = 16 * k * k * dk * dk;
      if (k <= 1) { r = cc[0] * k + lift; g = cc[1] * k + lift; bb = cc[2] * k + lift; } else { var tt = (k - 1) * 1.6; r = cc[0] + (255 - cc[0]) * tt + lift; g = cc[1] + (255 - cc[1]) * tt + lift; bb = cc[2] + (255 - cc[2]) * tt + lift; }
      p[i * 4] = r; p[i * 4 + 1] = g; p[i * 4 + 2] = bb;
    }
    x.putImageData(d, 0, 0); return tkeep(ck, c);
  }
  function skinRatio(skinHex) {
    var t = hex2(skinHex), best = 'M', bd = 1e9, sb = LIB.skinBase;
    Object.keys(sb).forEach(function (k) { var b = sb[k], d = Math.abs((b[0] * 0.3 + b[1] * 0.59 + b[2] * 0.11) - (t[0] * 0.3 + t[1] * 0.59 + t[2] * 0.11)); if (d < bd) { bd = d; best = k; } });
    var b = sb[best], lr = (t[0] * 0.3 + t[1] * 0.59 + t[2] * 0.11) / (b[0] * 0.3 + b[1] * 0.59 + b[2] * 0.11); return { base: best, r: t.map(function (v, i) { var cr = v / b[i]; return Math.max(0.5, Math.min(1.7, lr + (cr - lr) * 0.55)); }) };
  }
  function skinned(im, ratio, key) {
    var ck = key + '|s' + ratio.r.join(','); if (TINT[ck]) return TINT[ck];
    var c = document.createElement('canvas'); c.width = im.width; c.height = im.height; var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    var d = x.getImageData(0, 0, c.width, c.height), p = d.data, i, n = p.length / 4, r = ratio.r;
    for (i = 0; i < n; i++) { p[i * 4] = Math.min(255, p[i * 4] * r[0]); p[i * 4 + 1] = Math.min(255, p[i * 4 + 1] * r[1]); p[i * 4 + 2] = Math.min(255, p[i * 4 + 2] * r[2]); }
    x.putImageData(d, 0, 0); return tkeep(ck, c);
  }
  function lyr(sheet, key, v) { var s = LIB.lib[sheet]; if (!s) return null; return s[v ? v + ' · ' + key : key] || null; }
  function resolveLayer(L, spec) {
    var e = lyr(L.sheet, L.key, L.v); if (!e) return null;
    return img(e.f).then(function (im) {
      var o = im;
      if (L.skin) o = skinned(im, L.skin, e.f); else if (L.col) o = tint(im, L.col, e.f);
      return { e: e, im: o, garment: !!L.garment, big: !!L.big };
    });
  }
  var BKEY = { torso: 'A', pelvis: 'A', neck: 'A', uarm: 'A', farm: 'A', thigh: 'A', shin: 'A', hand_open: 'A', hand_relax: 'A', fist: 'A', torso34: 'B', pelvis34: 'B', farmcam: 'B' };
  var TOPK = { torso: 'torso', torso34: 'torso34', uarm: 'sleeveU', farm: 'sleeveF' }, BOTK = { pelvis: 'pelvis', pelvis34: 'pelvis34', thigh: 'thigh', shin: 'shin' };
  var STRIP = { torso: 1, torso34: 1 }, NAILK = { hand_open: 'NAILS_OPEN', hand_relax: 'NAILS_RELAXED', fist: 'NAILS_FIST' };
  var SCX = { uarm: 0.94, farm: 0.96, thigh: 0.9, shin: 0.93 }, SCU = { hand_open: 1.1, hand_relax: 1.1, fist: 1.08 };
  function composePart(key, S) {
    var layers = [{ sheet: 'BODY-' + S.skinSheet + '-' + BKEY[key], key: key, skin: S.skinRatio }];
    if ((key === 'thigh' || key === 'shin') && S.bottom && !S.bottom.skirt && /PANTS-/.test(S.bottom.sheet || '')) layers.shift();
    if (S.top && TOPK[key]) layers.push({ sheet: S.top.sheet, key: TOPK[key], v: S.top.v, col: S.top.col, garment: true });
    if (S.nails && NAILK[key]) layers.push({ sheet: 'ACC-HANDS', key: NAILK[key], col: S.nails });
    if (S.bottom && BOTK[key] && !S.bottom.skirt) layers.push({ sheet: S.bottom.sheet, key: BOTK[key], v: S.bottom.v, col: S.bottom.col, garment: true, big: key !== 'pelvis34' });
    if (S.shaft && key === 'shin') layers.push({ sheet: S.shaft.sheet, key: 'shaft', v: S.shaft.v, col: S.shaft.col, garment: true });
    return Promise.all(layers.map(function (l) { return resolveLayer(l); })).then(function (R) {
      var def = LIB.defs[key], minx = 0, miny = 0, maxx = def.w, maxy = def.h;
      R.forEach(function (r) { if (!r) return; minx = Math.min(minx, r.e.ox); miny = Math.min(miny, r.e.oy); maxx = Math.max(maxx, r.e.ox + r.e.w); maxy = Math.max(maxy, r.e.oy + r.e.h); });
      if (STRIP[key]) { miny = 0; maxy = def.h; }
      minx = Math.floor(minx); miny = Math.floor(miny); var W = Math.ceil(maxx) - minx, H = Math.ceil(maxy) - miny;
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(W * Q)); c.height = Math.max(1, Math.round(H * Q)); var x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; /* built in main memory: the sleeve fix below reads pixels back, which stalls the graphics card in OBS */
      R.forEach(function (r) {
        if (!r) return; var dx = (r.e.ox - minx) * Q, dy = (r.e.oy - miny) * Q, w = r.e.w * Q, h = r.e.h * Q;
        if (r.garment) { var o = (r.big ? 8 : 3) * Q, A = [[o, 0], [-o, 0], [0, o], [0, -o]]; A.forEach(function (a) { x.drawImage(r.im, dx + a[0], dy + a[1], w, h); }); }
        x.drawImage(r.im, dx, dy, w, h);
      });
      var d = { piv: [def.piv[0] - minx, def.piv[1] - miny], bone: def.bone }, sx = SCX[key] || SCU[key] || 1, sy = SCU[key] || 1;
      if (sx !== 1 || sy !== 1) { var c2 = document.createElement('canvas'); c2.width = Math.max(1, Math.round(c.width * sx)); c2.height = Math.max(1, Math.round(c.height * sy)); var x2 = c2.getContext('2d'); x2.imageSmoothingQuality = 'high'; x2.drawImage(c, 0, 0, c2.width, c2.height); c = c2; d.piv = [d.piv[0] * sx, d.piv[1] * sy]; if (d.bone) d.bone = [d.bone[0] * sx, d.bone[1] * sy]; }
      if ((key === 'torso' || key === 'torso34') && S.top && lyr(S.top.sheet, 'sleeveU', S.top.v)) {
        /* sleeved tops: the baked armhole interior is near-black; recolour it to a darkened shirt tone so exposed armholes look like fabric */
        try {
          var gx = c.getContext('2d'), W2 = c.width, H2 = c.height, id = gx.getImageData(0, 0, W2, H2), D = id.data, i, n = 0, rr = [], gg = [], bb = [];
          for (var sy = Math.floor(H2 * 0.38); sy < H2 * 0.62; sy += 3) for (var sx = Math.floor(W2 * 0.08); sx < W2 * 0.92; sx += 3) { if (sx > W2 * 0.28 && sx < W2 * 0.72) continue; i = (sy * W2 + sx) * 4; if (D[i + 3] > 250) { rr.push(D[i]); gg.push(D[i + 1]); bb.push(D[i + 2]); } }
          var md = function (q) { q.sort(function (a, b) { return a - b; }); return q[q.length >> 1] || 0; }, mr = md(rr), mg = md(gg), mb = md(bb);
          for (var yy = Math.floor(H2 * 0.04); yy < H2 * 0.6; yy++) for (var xx = 0; xx < W2; xx++) {
            if (xx > W2 * 0.3 && xx < W2 * 0.7) continue; i = (yy * W2 + xx) * 4;
            if (D[i + 3] > 200 && D[i] + D[i + 1] + D[i + 2] < 150) { D[i] = mr * 0.55; D[i + 1] = mg * 0.55; D[i + 2] = mb * 0.55; }
          }
          gx.putImageData(id, 0, 0);
        } catch (e) { }
      }
      if ((key === 'pelvis' || key === 'pelvis34') && S.bottom && /PANTS-ZZ$/.test(S.bottom.sheet || '')) {
        var px2 = c.getContext('2d'); px2.globalCompositeOperation = 'destination-in'; var pg = px2.createLinearGradient(0, 0, 0, c.height); pg.addColorStop(0, 'rgba(0,0,0,1)'); pg.addColorStop(0.7, 'rgba(0,0,0,1)'); pg.addColorStop(1, 'rgba(0,0,0,0)'); px2.fillStyle = pg; px2.fillRect(0, 0, c.width, c.height);
      }
      if (key === 'thigh' && (!S.bottom || S.bottom.skirt || /SHORTS|PANTS-[1-5]$/.test(S.bottom.sheet || ''))) {
        var pantsT = !!(S.bottom && !S.bottom.skirt && /PANTS-[1-5]$/.test(S.bottom.sheet || ''));
        var tx = c.getContext('2d'); tx.globalCompositeOperation = 'destination-in'; var tg = tx.createLinearGradient(0, 0, 0, c.height); tg.addColorStop(0, pantsT ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)'); tg.addColorStop(pantsT ? 0.09 : 0.2, 'rgba(0,0,0,1)'); tg.addColorStop(0.94, 'rgba(0,0,0,1)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); tx.fillStyle = tg; tx.fillRect(0, 0, c.width, c.height);
      }
      var res = { canvas: c, def: d };
      if (key === 'uarm' && S.top && lyr(S.top.sheet, 'sleeveU', S.top.v)) {
        var ch = Math.round(120 * Q * sy), cw = c.width, cc = document.createElement('canvas'); cc.width = Math.round(cw * 1.08); cc.height = ch; var cx = cc.getContext('2d'); cx.imageSmoothingQuality = 'high';
        cx.drawImage(c, 0, 0, cw, ch, 0, 0, cc.width, ch);
        /* fade the bottom of the cap so it blends into the sleeve */
        cx.globalCompositeOperation = 'destination-in'; var gr = cx.createLinearGradient(0, ch * 0.25, 0, ch * 0.75); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, cc.width, ch);
        res.extra = { scap: { canvas: cc, def: { piv: [d.piv[0] * 1.08, 30] } } };
      }
      return res;
    });
  }
  function shoeParts(S) {
    var out = {}, sh = S.shoes; if (!sh) return Promise.resolve(out);
    var m = [['shoe34', 'shoeA'], ['shoeS', 'shoeS'], ['shoeF', 'shoeF'], ['shoeB', 'shoeB']];
    return Promise.all(m.map(function (z) { var e = lyr(sh.sheet, z[0], sh.v); if (!e) return null; return img(e.f).then(function (im) { var c = sh.col ? tint(im, sh.col, e.f) : im; out[z[1]] = { canvas: c, def: { ank: e.ank, ball: e.ball, piv: e.ank } }; }); })).then(function () { return out; });
  }
  function hairParts(S) {
    var out = {}, h = S.hair; if (!h) return Promise.resolve(out);
    return Promise.all([['hairB', 'hairb'], ['hairF', 'hairf']].map(function (z) {
      var e = lyr(h.sheet, z[0], h.v); if (!e) return null; return img(e.f).then(function (im) {
        var c = document.createElement('canvas'); var W = e.slot[0] + 120, Hh = e.slot[1] + 120; c.width = Math.round(W * Q); c.height = Math.round(Hh * Q); var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
        x.drawImage(h.col ? tint(im, h.col, e.f + (h.col.ombre ? 'o' : '')) : im, (e.ox + 60) * Q, (e.oy + 60) * Q, e.w * Q, e.h * Q);
        var dsc = z[0] === 'hairF' ? [145, 180] : [145, 205]; out[z[1]] = { canvas: c, def: { disc: [dsc[0] + 60, dsc[1] + 60] } };
      });
    })).then(function () { return out; });
  }
  function skirtParts(S) {
    var out = {}, b = S.bottom && S.bottom.skirt ? S.bottom : (S.top && S.top.dress ? S.top : null); if (!b) return Promise.resolve(out);
    var names, v = b.v, sh = b.sheet;
    if (S.top && S.top.dress && b === S.top) names = LIB.lib[sh].mdskF ? { skirt: 'mdskF', skirt34: 'mdskF' } : { skirt: 'dskF', skirt34: 'dskF' };
    else { var m = lyr(sh, 'mskF', v) ? 'm' : ''; names = { skirt: m + 'skF', skirt34: m + 'sk34' }; }
    var pt = LIB.defs.pelvisTop;
    return Promise.all(['skirt', 'skirt34'].map(function (z) {
      var e = lyr(sh, names[z], v); if (!e) return null;
      return img(e.f).then(function (im) {
        var k = (pt[1] - pt[0]) * 1.02 / (e.tx1 - e.tx0), src = b.col ? tint(im, b.col, e.f) : im, c = document.createElement('canvas'); c.width = Math.max(1, Math.round(e.w * k * Q)); c.height = Math.max(1, Math.round(e.h * k * Q));
        var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, c.width, c.height);
        out[z] = { canvas: c, def: { piv: [(e.tx0 + e.tx1) / 2 * k, 0] } };
      });
    })).then(function () { return out; });
  }
  function accParts(S) {
    var out = {}, A = S.acc || {}, jobs = [];
    function add(name, e, col, def) { if (!e) return; jobs.push(img(e.f).then(function (im) { out[name] = { canvas: col ? tint(im, col, e.f) : im, def: def(e) }; })); }
    if (A.headItems && A.headItems.length) {
      var c = document.createElement('canvas'); c.width = Math.round(300 * Q); c.height = Math.round(300 * Q); var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      jobs.push(Promise.all(A.headItems.map(function (it) { var e = lyr(it.sheet, it.key); return e ? img(e.f).then(function (im) { return { e: e, im: it.full ? im : tint(im, it.col, e.f) }; }) : null; })).then(function (R) {
        R.forEach(function (r) { if (r) x.drawImage(r.im, r.e.ox * Q, r.e.oy * Q, r.e.w * Q, r.e.h * Q); });
        out.hacc = { canvas: c, def: { disc: [150, 150] } };
      }));
    }
    if (A.neck) add('nacc', lyr('ACC-BODY', A.neck.key), A.neck.col, function (e) { return { piv: [e.w / 2, 0] }; });
    if (A.belt) add('bacc', lyr('ACC-BODY', 'BELT'), A.belt.col, function (e) { return { piv: [e.w / 2, e.h / 2] }; });
    if (A.bag) add('gacc', lyr('ACC-BODY', 'HIPBAG'), A.bag.col, function (e) { return { piv: [e.w * 0.5, 0] }; });
    if (A.wrist) add('wacc', lyr('ACC-HANDS', A.wrist.key), A.wrist.col, function (e) { return { piv: [e.w / 2, e.h / 2] }; });
    if (A.arm) add('aacc', lyr('ACC-HANDS', 'ARM_BAND'), A.arm.col, function (e) { return { piv: [e.w / 2, e.h / 2] }; });
    return Promise.all(jobs).then(function () { return out; });
  }
  /* ------------------------------------------------ look -> spec */
  /* look: { skin, body, height, top, topColor, bottom, bottomColor, shoes, shoesColor, hair, hairColor, acc:[], accColor } (all catalog ids; may be null) */
  function spec(look) {
    var S = {}, sk = byId(CATALOG.skin, look.skin) || CATALOG.skin[3]; S.skinHex = sk.hex; S.skinRatioInfo = skinRatio(sk.hex); S.skinSheet = S.skinRatioInfo.base; S.skinRatio = S.skinRatioInfo;
    S.body = look.body || 'straight';
    var hg = byId(CATALOG.heights, look.height) || CATALOG.heights[1]; S.hs = hg.hs; S.legk = hg.legk;
    var top = byId(CATALOG.looks, look.top) || CATALOG.looks[0], nk = top.nk;
    function c(id, dflt) { return colArr(clothHex(id, dflt)); }
    if (nk) { S.top = { sheet: top.sheet + '-TOP' }; S.bottom = { sheet: top.sheet + '-BOTTOM' }; S.body = 'curvy'; }
    else if (top.sig) S.top = { sheet: top.sheet, v: top.v };
    else S.top = { sheet: top.sheet, v: top.v, col: look.topColor ? c(look.topColor) : colArr(top.col), dress: !!top.dress };
    if (!nk && !top.dress) { var b = byId(CATALOG.bottoms, look.bottom) || CATALOG.bottoms[0]; S.bottom = { sheet: b.sheet, v: b.v, skirt: !!b.skirt, col: b.fixed ? null : (look.bottomColor ? c(look.bottomColor) : colArr(b.col)) }; }
    var shId = look.shoes || (nk && top.shoes) || 'sneakers', sh = byId(CATALOG.shoes, shId) || CATALOG.shoes[0], shc = look.shoesColor || (nk && top.shoesColor);
    S.shoes = { sheet: sh.sheet, v: sh.v, col: sh.fixed ? null : (shc ? c(shc) : colArr(sh.col)) };
    if (sh.shaft) S.shaft = { sheet: sh.shaft.sheet, v: sh.shaft.v, col: sh.shaft.col ? colArr(sh.shaft.col) : S.shoes.col };
    var hid = look.hair || (nk && top.hair), hs = hid && byId(CATALOG.hair.styles, hid);
    if (!hs && look.hairColor) hs = byId(CATALOG.hair.styles, 'long');
    if (hs) { var hcid = look.hairColor || (nk && top.hairColor) || 'brown', hc = byId(CATALOG.hair.colors, hcid) || CATALOG.hair.colors[1]; S.hair = { sheet: hs.sheet, v: hs.v, col: hc.ombre ? { ombre: hc.ombre } : hex2(hc.hex) }; }
    var accIds = (look.acc && look.acc.length ? look.acc : (nk && top.acc) || []).slice(), acid = look.accColor || (nk && top.accColor) || 'gold', ac = byId(CATALOG.accessories.colors, acid) || CATALOG.accessories.colors[0], acol = hex2(ac.hex);
    var A = { headItems: [] }, slotWin = {};
    accIds.forEach(function (id) { var it = byId(CATALOG.accessories.items, id); if (it) slotWin[it.slot] = it; });
    var order = ['ears', 'head', 'face'];
    order.forEach(function (sl) { var it = slotWin[sl]; if (it) A.headItems.push({ sheet: it.sheet, key: it.key, full: it.full, col: acol }); });
    if (slotWin.neck) A.neck = { key: slotWin.neck.key, col: acol }; if (slotWin.waist) A.belt = { col: acol }; if (slotWin.carry) A.bag = { col: hex2('#1b1426') };
    if (slotWin.wrist) A.wrist = { key: slotWin.wrist.key, col: acol }; if (slotWin.arm) A.arm = { col: acol }; if (slotWin.hands) S.nails = acol;
    S.acc = A; return S;
  }
  function sig(S) { return JSON.stringify([S.skinHex, S.top, S.bottom, S.shaft, S.shoes, S.hair, S.acc, S.nails]); }
  /* build (cached) part set for a look */
  function build(look) {
    var S = spec(look), k = sig(S);
    if (CACHE[k]) { touch(k); return CACHE[k].p.then(function (set) { return { set: set, spec: S }; }); }
    var keys = ['torso', 'torso34', 'pelvis', 'pelvis34', 'neck', 'uarm', 'farm', 'thigh', 'shin', 'hand_open', 'hand_relax', 'fist', 'farmcam'], PS = {};
    /* each body piece is assembled in its own small task so a build never freezes the dancing for a whole frame */
    var slot = function () { return new Promise(function (r) { setTimeout(r, 0); }); };
    var p = Promise.all(keys.map(function (kk) { return slot().then(function () { return composePart(kk, S); }).then(function (r) { PS[kk === 'farmcam' ? 'ffarm' : kk] = RIG.mkPart(r.canvas, r.def, Q); if (r.extra) Object.keys(r.extra).forEach(function (ek) { PS[ek] = RIG.mkPart(r.extra[ek].canvas, r.extra[ek].def, Q); }); }); }))
      .then(slot).then(function () { return Promise.all([shoeParts(S), hairParts(S), skirtParts(S), accParts(S)]); })
      .then(function (z) { z.forEach(function (m) { Object.keys(m).forEach(function (kk) { PS[kk] = RIG.mkPart(m[kk].canvas, m[kk].def, Q); }); }); return PS; });
    CACHE[k] = { p: p, n: 1 }; touch(k);
    return p.then(function (set) { return { set: set, spec: S }; });
  }
  var MAXC = 220;
  function touch(k) { var i = CORDER.indexOf(k); if (i >= 0) CORDER.splice(i, 1); CORDER.push(k); while (CORDER.length > MAXC) { delete CACHE[CORDER.shift()]; } }
  /* draw a figure: x,feetY in ctx px, h = figure height px */
  function draw(ctx, set, S, o) {
    var s = o.h / 1700 * (o.useHs === false ? 1 : 1), P2 = RIG.pose(o.clip, o.t, { beat: o.beat || 0.5, ph: o.ph || 0, amp: o.amp || 1 });
    if (o.walk) { var WP = RIG.walkPose(o.walk.ph, o.walk.yaw, o.walk.k); P2 = o.walk.w < 1 ? RIG.mixPose(P2, WP, o.walk.w) : WP; }
    ctx.save(); ctx.translate(o.x, o.y); ctx.translate(0, -805 * s); ctx.scale(s, s); RIG.use(set);
    RIG.figure(ctx, { pose: P2, px: s, fronthair: true, body: S.body, legk: S.legk, sway: o.sway || 0, dbg: o.dbg, st: o.st, hold: o.hold, under: !!(S.bottom && !S.bottom.skirt && /PANTS-[1-5]$/.test(S.bottom.sheet || '')), now: o.now != null ? o.now : o.t }, o.head); ctx.restore();
  }
  function clipOf(id) { var d = byId(CATALOG.dances, id) || byId(CATALOG.dances, CATALOG.danceAlias[id]); return d ? d.clip : 'hh1'; }
  var EARN = { tasks: {"dn3": "Never get stuck on one groove.", "dn7": "Know every move this room has to offer.", "lk2": "A fresh fit, then another fresh fit.", "lk8": "A new mood, a new you. Again and again.", "dr1": "Someone behind the bar is waiting on you.", "dr3": "The third round is where the magic happens.", "sp1": "Order one of tonight's house specials.", "sp4": "Taste every house special on the menu.", "ch5": "The quiet ones never get noticed.", "ch25": "Keep the conversation loud.", "che3": "Lift your glass. More than once.", "st30": "Good things come to those who stay.", "early": "Doors open, early birds get in first.", "rwp": "Be seen under the lights.", "rww": "The crowd crowns one winner.", "t5": "Be one of the loudest five.", "lc": "Stay until the lights come up.", "reg": "Keep dancing and keep talking.", "x_barb": "Nicki will whisper a secret. Listen close.", "x_pf2": "Nicki will whisper a secret. Listen close.", "x_pink": "Nicki will whisper a secret. Listen close.", "x_gag": "Nicki will whisper a secret. Listen close."},
    items: {"citysnap": "dn3", "cowboyhat": "dn3", "heartstud": "dn3", "airtrucker": "ch5", "nightshades": "ch5", "pinkbeanie": "dr1", "durag": "dr1", "fuzzybucket": "dr1", "fedora": "lk2", "cateye": "lk2", "satinscarf": "lk2", "crystalcat": "sp1", "miniskirt": "dr3", "resortshorts": "dr3", "trini": "sp4", "puffvest": "sp1", "midiskirt": "che3", "loafers": "che3", "roman": "early", "pleated": "dn7", "slipdress": "dn7", "whitebomber": "dn7", "fphightops": "dn7", "denimskirt": "ch25", "bodycon": "ch25", "airbrushjoggers": "ch25", "varsity": "ch25", "utilitymini": "st30", "skater": "st30", "layeredcurls": "st30", "letterman": "st30", "satindress": "lk8", "harajuku": "lk8", "pinkstarboots": "lk8", "queens": "t5", "crowntrainers": "t5", "cityletterman": "rwp", "nickitee": "rwp", "heartcrown": "rww", "resortmuscle": "lc", "pinkprintcrew": "reg", "nickicrew": "reg", "barbcrystal": "x_barb", "pf2bomber": "x_pf2", "pinkprintzip": "x_pink", "gagcargos": "x_gag", "crimped": "lk2", "bubbletail": "sp4", "jellyfish": "ch5", "fulani": "ch25", "curlymullet": "dn7", "fauxhawk": "dr1", "twoblock": "che3", "angfringe": "lk8"} };
  return { CATALOG: CATALOG, EARN: EARN, init: init, build: build, spec: spec, draw: draw, clipOf: clipOf, byId: byId, hex2: hex2, lib: function () { return LIB; }, piece: function (sheet, key, v, col) { var e = lyr(sheet, key, v); if (!e) return Promise.resolve(null); return img(e.f).then(function (im) { return { e: e, im: col ? tint(im, col.ombre ? col : colArr(col), e.f) : im }; }, function () { return null; }); }, Q: function () { return Q; }, cacheSize: function () { return CORDER.length; }, setCache: function (n) { MAXC = n; } };
})();
