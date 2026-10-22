// C · DATA — Adapter : deux sources de mesures hétérogènes, un seul contrat.
//
// Contrat attendu par le reste de QueenBee (contexte « Santé des colonies ») :
//   Mesure = { hiveId: string, at: string ISO 8601 (UTC), poidsKg: number, temperatureC: number, source: string }

// --- Source 1 : trames capteurs déjà décodées (format 6.5 du cahier des charges) — NON modifiable
export class CapteurLoRaSource {
  async trames() {
    return [
      { hive_id: 'SN-CASA-014', site_id: 'SN-CASA', timestamp: '2027-03-14T08:15:00Z', weight_kg: 34.2, temp_internal_c: 34.8 },
      { hive_id: 'SN-CASA-015', site_id: 'SN-CASA', timestamp: '2027-03-14T08:30:00Z', weight_kg: 29.9, temp_internal_c: 35.1 },
    ];
  }
}

// --- Source 2 : anciens relevés papier numérisés (CSV) — NON modifiable
// colonnes : ruche ; date « JJ/MM/AAAA HH:MM » (heure UTC) ; poids en GRAMMES ; température en °F
export class ReleveManuelSource {
  async lignes() {
    return [
      'CM-BAF-003;13/03/2027 07:00;41850;93.2',
      'CM-BAF-004;13/03/2027 07:20;;95.0', // poids manquant : ligne inexploitable
      'CM-BAF-005;14/03/2027 09:05;38100;94.1',
    ];
  }
}

// --- Adaptateurs
// C-Data.1 : LoRaAdapter — traduit les trames capteurs vers le contrat Mesure (source: 'capteur')
export class LoRaAdapter {
  constructor(source) { this.source = source; }
  async mesures() {
    const trames = await this.source.trames();
    return trames.map(t => ({
      hiveId: t.hive_id,
      at: new Date(t.timestamp).toISOString(), // normalisation ISO 8601 UTC (avec millisecondes)
      poidsKg: t.weight_kg,
      temperatureC: t.temp_internal_c,
      source: 'capteur',
    }));
  }
}

// C-Data.2 : ReleveManuelAdapter — découpe la ligne CSV et convertit
//   - la date « JJ/MM/AAAA HH:MM » (UTC) en ISO 8601
//   - les grammes en kilogrammes, les °F en °C arrondis au dixième : (F − 32) × 5 / 9
//   - ignore les lignes incomplètes ou illisibles (qualité des données) ; source: 'releve-manuel'
const FORMAT_DATE = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;

function dateReleveEnIso(texte) {
  const m = FORMAT_DATE.exec(texte);
  if (!m) return null;
  const [, jj, mm, aaaa, hh, mi] = m.map(Number);
  const d = new Date(Date.UTC(aaaa, mm - 1, jj, hh, mi));
  // refuse les dates impossibles (ex. 31/02) que Date.UTC « corrigerait » silencieusement
  if (d.getUTCDate() !== jj || d.getUTCMonth() !== mm - 1) return null;
  return d.toISOString();
}

const nombre = texte => (texte === '' ? NaN : Number(texte));

export class ReleveManuelAdapter {
  constructor(source) { this.source = source; }
  async mesures() {
    const lignes = await this.source.lignes();
    return lignes.map(ligne => this.#convertir(ligne)).filter(m => m !== null);
  }
  #convertir(ligne) {
    const champs = ligne.split(';').map(c => c.trim());
    if (champs.length !== 4) return null;
    const [ruche, date, grammes, fahrenheit] = champs;
    const at = dateReleveEnIso(date);
    const g = nombre(grammes);
    const f = nombre(fahrenheit);
    if (!ruche || !at || !Number.isFinite(g) || !Number.isFinite(f)) return null; // ligne écartée
    return {
      hiveId: ruche,
      at,
      poidsKg: g / 1000,
      temperatureC: Math.round(((f - 32) * 5) / 9 * 10) / 10,
      source: 'releve-manuel',
    };
  }
}

// --- Client : ne connaît que le contrat Mesure (fourni)
export async function toutesLesMesures(adaptateurs) {
  const lots = await Promise.all(adaptateurs.map(a => a.mesures()));
  return lots.flat().sort((a, b) => a.at.localeCompare(b.at));
}
