// Lightweight association persistence for Tridium dataset-to-node mapping
// Stores associations in localStorage under 'tridiumAssociations'

export type AssociationMap = Record<string, string>; // datasetId -> nodeId

const STORAGE_KEY = 'tridiumAssociations';

function load(): AssociationMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as AssociationMap;
  } catch {}
  return {};
}

function save(map: AssociationMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export const TridiumAssociationService = {
  getMappings(): AssociationMap {
    return load();
  },
  getNodeIdForDataset(datasetId: string): string | undefined {
    const map = load();
    return map[datasetId];
  },
  setMapping(datasetId: string, nodeId: string) {
    const map = load();
    map[datasetId] = nodeId;
    save(map);
  },
  removeMapping(datasetId: string) {
    const map = load();
    delete map[datasetId];
    save(map);
  },
  clear() {
    save({});
  }
};

