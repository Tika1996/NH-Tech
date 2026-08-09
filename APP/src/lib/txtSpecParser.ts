export interface ParsedLaptopSpecs {
  fileName: string;
  brand: string;
  name: string;
  cpu: string;
  ram: string;
  ssd: string;
  gpu: string;
  screen: string;
  rawText: string;
  price?: number;
  warranty?: string;
  stock?: number;
}

export function parseLaptopTxtSpec(content: string, fileName: string = ''): ParsedLaptopSpecs {
  const lines = content.split(/\r?\n/);
  const data: Record<string, string> = {};

  for (const line of lines) {
    if (line.includes(':')) {
      const firstColon = line.indexOf(':');
      const key = line.substring(0, firstColon).trim().toLowerCase();
      const val = line.substring(firstColon + 1).trim();
      if (key && val) {
        data[key] = val;
      }
    }
  }

  // Key matching
  const marqueModele = data['marque & modèle'] || data['marque & modele'] || data['marque'] || data['modèle'] || data['modele'] || '';
  const cpuRaw = data['processeur'] || data['cpu'] || '';
  const ramRaw = data['mémoire ram'] || data['memoire ram'] || data['ram'] || '';
  const ssdRaw = data['stockage'] || data['ssd'] || data['disque'] || '';
  const gpuRaw = data['carte graphique'] || data['gpu'] || '';
  const screenRaw = data['résolution écran'] || data['résolution ecran'] || data['ecran'] || data['écran'] || '';

  // Extract brand & name
  let brand = '';
  let name = '';

  if (marqueModele) {
    const knownBrands = ['HP', 'DELL', 'LENOVO', 'ASUS', 'ACER', 'MSI', 'SAMSUNG', 'APPLE', 'RAZER', 'MICROSOFT', 'GIGABYTE', 'ALIENWARE'];
    const uppercase = marqueModele.toUpperCase();
    const foundBrand = knownBrands.find(b => uppercase.includes(b));
    if (foundBrand) {
      brand = foundBrand === 'SAMSUNG' ? 'Samsung' : foundBrand;
      // Clean company suffix
      let cleanName = marqueModele
        .replace(/SAMSUNG ELECTRONICS CO\.,? LTD\.?/gi, 'Samsung')
        .replace(/COMPUTER INC\.?/gi, '')
        .replace(/CORPORATION/gi, '')
        .trim();
      name = cleanName;
    } else {
      const split = marqueModele.split(' ');
      brand = split[0] || '';
      name = marqueModele;
    }
  }

  if (!name && fileName) {
    // Extract from filename, e.g. "20260808_Galaxy Book5 Pro.txt"
    const cleanFileName = fileName.replace(/\.txt$/i, '').replace(/^\d{8}_/, '').trim();
    name = cleanFileName;
  }

  // Clean CPU (e.g. "Intel(R) Core(TM) Ultra 7 258V @ 2.2 GHz" -> "Intel Core Ultra 7 258V @ 2.2 GHz")
  let cpu = cpuRaw
    .replace(/\(R\)/gi, '')
    .replace(/\(TM\)/gi, '')
    .trim();

  // Clean RAM (e.g. "32 GB LPDDR5 @ 8533 MHz" -> "32 GB LPDDR5 @ 8533 MHz")
  let ram = ramRaw.trim();

  // Clean SSD (e.g. "512 GB (SAMSUNG MZVL8512HELU-00BKS)" -> "512 GB")
  let ssd = ssdRaw;
  if (ssdRaw.includes('(')) {
    const mainSsd = ssdRaw.split('(')[0].trim();
    if (mainSsd) ssd = mainSsd;
  }

  // Clean GPU (e.g. "Intel(R) Arc(TM) 140V GPU (16GB)" -> "Intel Arc 140V GPU (16GB)")
  let gpu = gpuRaw
    .replace(/\(R\)/gi, '')
    .replace(/\(TM\)/gi, '')
    .trim();

  // Clean Screen
  let screen = screenRaw.trim();

  return {
    fileName,
    brand: brand || 'Samsung',
    name: name || 'Laptop High End',
    cpu,
    ram,
    ssd,
    gpu,
    screen,
    rawText: content,
    price: 0,
    warranty: '12 mois',
    stock: 1
  };
}
