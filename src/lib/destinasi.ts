export const DEFAULT_SINGKATAN = [
  'I',
  'B',
  'D',
  'KW',
  'PM',
  'TGT',
  'TI',
  'M',
  'T',
  'ABN',
  'AP',
  'PB',
  'CT',
  'MU',
  'GI',
  'WI',
  'J',
  'WB',
  'DK',
  'KKG',
  'RS',
  'ATV',
  'OT',
  'Pick up',
  'Drop off',
];

export const SINGKATAN_TOOLTIPS: Record<string, string> = {
  'I': 'Kawah Ijen',
  'B': 'TN Baluran',
  'D': 'De Djawatan',
  'KW': 'Kawah Wurung',
  'PM': 'Pulau Merah',
  'TGT': 'Teluk Hijau',
  'TI': 'Gandrung Terakota',
  'M': 'P. Menjangan',
  'T': 'P. Tabuhan',
  'ABN': 'Bangsring Underwater',
  'AP': 'TN Alas Purwo',
  'PB': 'Pantai Boom',
  'CT': 'City Tour',
  'MU': 'Muara Mbaduk',
  'GI': 'G-Land Plengkung',
  'WI': 'Wisata Osing Kemiren',
  'J': 'Air Terjun Jagir',
  'WB': 'Waduk Bajulmati',
  'DK': 'Desa Kemiren',
  'KKG': 'Kampung Kopi',
  'RS': 'Pantai Rajegwesi',
  'ATV': 'ATV Adventure',
  'OT': 'Open Trip Point',
  'Pick up': 'Penjemputan',
  'Drop off': 'Pengantaran',
};

export const HOTEL_OPTIONS = [
  'Luminor',
  'Illira',
  'Santika',
  'Ketapang Indah',
  'Solong',
  'Dialoog',
  'Aston',
  'El Royale',
  'Kokoon',
  'Grand Harvest',
  'Teras Ijen',
  'Votel Manyar',
  'Harmony Homestay',
  'Sultan GH',
  'Winstar',
];

export interface PaketGroup {
  label: string;
  options: string[];
}

export const DEFAULT_PAKET_GROUPS: PaketGroup[] = [
  {
    label: 'Paket 1 Hari (One Day Tour)',
    options: [
      '1D I',
      '1D I, B',
      '1D D, B',
      '1D KW',
      '1D PM',
      '1D AP',
      '1D M, T',
      '1D M, B',
      '1D I, KW',
      '1D I, D',
      '1D B',
      '1D PB',
      '1D KW, B',
      '1D TI',
      '1D B, D, PM',
      '1D Z',
    ],
  },
  {
    label: 'Paket Menginap (2 Hari 1 Malam)',
    options: ['2H1M A', '2H1M B', '2H1M C', '2H1M D', '2H1M Z'],
  },
  {
    label: 'Paket Menginap (3 Hari 2 Malam & 4 Hari)',
    options: ['3H2M A', '3H2M B', '3H2M Z', '4H3M'],
  },
  {
    label: 'Open Trip / Sharing',
    options: [
      'OT I',
      'OT MT',
      'OT DB',
      'OT PM',
      'OT D',
      'OT B',
      'OT TI',
      'OT IB',
      'OT 3E',
      'Lainnya',
    ],
  },
];

export const STORAGE_KEY_CUSTOM_SINGKATAN = 'tripbwi_custom_singkatan';

export function getStoredSingkatan(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SINGKATAN);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredSingkatan(list: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_SINGKATAN, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save custom singkatan:', e);
  }
}

export const STORAGE_KEY_CUSTOM_PAKET = 'tripbwi_custom_paket';

export function getStoredPaket(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PAKET);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredPaket(list: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_PAKET, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save custom paket:', e);
  }
}
