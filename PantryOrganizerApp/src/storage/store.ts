import AsyncStorage from '@react-native-async-storage/async-storage';

type Item = {
  id: string;
  name: string;
  quantity?: number;
  location?: string;
  labels?: string[] | string;
  description?: string;
  expires?: string;
  onShoppingList?: boolean;
  createdAt?: number;
  updatedAt?: number;
  [k: string]: any;
};

const STORAGE_KEY = 'PANTRY_ITEMS_V1';

let items: Item[] = [];
const subscribers = new Set<() => void>();

async function loadFromDisk() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    items = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('store.loadFromDisk error', e);
    items = [];
  }
}

async function saveToDisk() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('store.saveToDisk error', e);
  }
}

function notify() {
  subscribers.forEach((cb) => {
    try { cb(); } catch (e) { console.warn('store.subscriber error', e); }
  });
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

async function getAll(): Promise<Item[]> {
  if (!items) await loadFromDisk();
  return items.slice();
}

async function add(payload: Partial<Item>): Promise<Item> {
  if (!items) await loadFromDisk();
  const now = Date.now();
  const it: Item = {
    id: makeId(),
    name: String(payload.name || '').trim(),
    quantity: payload.quantity ?? payload.qty ?? 1,
    location: payload.location,
    labels: payload.labels,
    description: payload.description,
    expires: payload.expires,
    onShoppingList: !!payload.onShoppingList,
    createdAt: payload.createdAt ?? now,
    updatedAt: now,
    ...payload,
  };
  items.push(it);
  await saveToDisk();
  notify();
  return it;
}

async function update(patch: Partial<Item> & { id: string }): Promise<Item | null> {
  if (!items) await loadFromDisk();
  const idx = items.findIndex(i => i.id === patch.id);
  if (idx === -1) return null;
  const now = Date.now();
  items[idx] = { ...items[idx], ...patch, updatedAt: now };
  await saveToDisk();
  notify();
  return items[idx];
}

async function remove(id: string): Promise<boolean> {
  if (!items) await loadFromDisk();
  const before = items.length;
  items = items.filter(i => i.id !== id);
  const changed = items.length !== before;
  if (changed) {
    await saveToDisk();
    notify();
  }
  return changed;
}

async function clearAll(): Promise<boolean> {
  items = [];
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    notify();
    return true;
  } catch (e) {
    console.warn('store.clearAll error', e);
    return false;
  }
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return {
    remove: () => subscribers.delete(cb),
  };
}

// initialize in background
loadFromDisk().catch(e => console.warn(e));

export default {
  getAll,
  add,
  update,
  remove,
  clearAll,
  subscribe,
};