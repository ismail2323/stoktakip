export const MARKALAR = ["Toyota", "Mitsubishi", "Hyundai", "Mercedes", "Diğer"] as const;

export const MARKA_MODELLERI: Record<string, string[]> = {
  Toyota: [
    "Corolla",
    "Yaris",
    "Auris",
    "Camry",
    "C-HR",
    "RAV4",
    "Hilux",
    "Land Cruiser",
    "Avensis",
    "Proace",
  ],
  Mitsubishi: [
    "Lancer",
    "Colt",
    "ASX",
    "Outlander",
    "Space Star",
    "L200",
    "Pajero",
    "Eclipse Cross",
    "Carisma",
  ],
  Hyundai: [
    "i10",
    "i20",
    "i30",
    "Accent",
    "Elantra",
    "Tucson",
    "Santa Fe",
    "Kona",
    "Bayon",
    "Getz",
  ],
  Mercedes: [
    "A Serisi",
    "B Serisi",
    "C Serisi",
    "E Serisi",
    "S Serisi",
    "CLA",
    "GLA",
    "GLC",
    "Vito",
    "Sprinter",
  ],
  Diğer: [],
};

export function modelleriGetir(marka: string): string[] {
  return MARKA_MODELLERI[marka] ?? [];
}
