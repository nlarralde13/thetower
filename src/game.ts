import backgroundsData from './data/backgrounds.json';
import realmsData from './data/realms.json';
import zonesData from './data/zones.json';
import areasData from './data/areas.json';
import itemsData from './data/items.json';
import enemiesData from './data/enemies.json';
import cropsData from './data/crops.json';
import recipesData from './data/recipes.json';
import eventsData from './data/events.json';
import homesteadData from './data/homestead.json';

export type Screen =
  | 'character-creation'
  | 'village'
  | 'tower'
  | 'zone-select'
  | 'area-select'
  | 'exploration'
  | 'event'
  | 'combat'
  | 'homestead'
  | 'character';

export type ItemDef = {
  id: string;
  name: string;
  type: string;
  description: string;
  value: number;
  stackable: boolean;
  stats?: Record<string, number>;
  effects?: Record<string, number>;
  cropId?: string;
  loreId?: string;
};

export type BackgroundDef = {
  id: string;
  name: string;
  description: string;
  startingItems: string[];
  bonuses: Record<string, number>;
};

export type RealmDef = {
  id: string;
  name: string;
  description: string;
  zoneIds: string[];
  startingZoneId: string;
};

export type ZoneDef = {
  id: string;
  realmId: string;
  name: string;
  description: string;
  areaIds: string[];
  startingAreaId: string;
};

export type AreaDef = {
  id: string;
  zoneId: string;
  name: string;
  description: string;
  recommendedLevel: number;
  enemyIds: string[];
  enemyPool?: { enemyId: string; weight: number }[];
  encounterChance?: number;
  resourceItemIds: string[];
  connectedAreaIds: string[];
  revealText?: string;
};

export type EnemyLoot = {
  itemId: string;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
};

export type EnemyDef = {
  id: string;
  name: string;
  description: string;
  level: number;
  stats: {
    health: number;
    damageMin: number;
    damageMax: number;
    defense: number;
  };
  loot: EnemyLoot[];
};

export type CropDef = {
  id: string;
  name: string;
  seedItemId: string;
  harvestItemId: string;
  growthCycles: number;
  waterPerCycle: number;
  harvestQuantity: { min: number; max: number };
};

export type RecipeDef = {
  id: string;
  name: string;
  category: string;
  requiredLevel: number;
  ingredients: { itemId: string; quantity: number }[];
  output: { itemId: string; quantity: number };
};

export type EventDef = {
  id: string;
  name: string;
  areaId: string;
  description: string;
  choices: EventChoiceDef[];
};

export type EventChoiceDef = {
  id: string;
  text: string;
  requirements?: { items?: { itemId: string; quantity: number }[] };
  outcome: {
    text: string;
    consumeItems?: boolean;
    rewards: { itemId: string; quantity: number }[];
    combat?: {
      enemyId: string;
    };
  };
};

export type HomesteadDef = {
  id: string;
  name: string;
  description: string;
  startingPlots: number;
  maxPlots: number;
  startingStorageSlots: number;
  facilities: {
    id: string;
    name: string;
    description: string;
    startingLevel: number;
    maxLevel: number;
    unlocks: string[];
  }[];
};

export type InventoryEntry = {
  itemId: string;
  quantity: number;
};

export type CropPlotState = {
  slotId: string;
  cropId: string | null;
  plantedAt: number | null;
  readyAt: number | null;
  quantity: number;
};

export type PlayerState = {
  name: string;
  backgroundId: string;
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  skills: Record<string, number>;
  inventory: InventoryEntry[];
  equipment: {
    weaponId: string | null;
    armorId: string | null;
  };
  location: {
    realmId: string;
    zoneId: string;
    areaId: string;
  };
  discoveredAreaIds: string[];
  homestead: {
    plots: CropPlotState[];
  };
};

export type CombatState = {
  enemyId: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyGuard: boolean;
  playerGuard: boolean;
  log: string[];
  loot: InventoryEntry[];
};

export type EventState = {
  eventId: string;
  areaId: string;
  choiceId?: string;
  resultText?: string;
};

export type GameState = {
  screen: Screen;
  message: string;
  selectedRealmId: string;
  selectedZoneId: string;
  selectedAreaId: string;
  pendingEvent: EventState | null;
  combat: CombatState | null;
  player: PlayerState | null;
  returnBand: {
    unlocked: boolean;
    cooldownSeconds: number;
    lastUsedAt: number;
  };
  lastSavedAt: number;
};

export const backgrounds = backgroundsData as unknown as BackgroundDef[];
export const realms = realmsData as RealmDef[];
export const zones = zonesData as ZoneDef[];
export const areas = areasData as AreaDef[];
export const items = itemsData as ItemDef[];
export const enemies = enemiesData as EnemyDef[];
export const crops = cropsData as CropDef[];
export const recipes = recipesData as RecipeDef[];
export const events = eventsData as EventDef[];
export const homestead = homesteadData as HomesteadDef;

export const STORAGE_KEY = 'tower-rpg-save-v1';

export const itemById = new Map(items.map((item) => [item.id, item]));
export const backgroundById = new Map(backgrounds.map((item) => [item.id, item]));
export const realmById = new Map(realms.map((item) => [item.id, item]));
export const zoneById = new Map(zones.map((item) => [item.id, item]));
export const areaById = new Map(areas.map((item) => [item.id, item]));
export const enemyById = new Map(enemies.map((item) => [item.id, item]));
export const cropById = new Map(crops.map((item) => [item.id, item]));
export const recipeById = new Map(recipes.map((item) => [item.id, item]));
export const eventById = new Map(events.map((item) => [item.id, item]));

export const getItem = (itemId: string) => itemById.get(itemId);
export const getBackground = (backgroundId: string) => backgroundById.get(backgroundId);
export const getArea = (areaId: string) => areaById.get(areaId);
export const getZone = (zoneId: string) => zoneById.get(zoneId);
export const getEnemy = (enemyId: string) => enemyById.get(enemyId);
export const getCrop = (cropId: string) => cropById.get(cropId);
export const getEvent = (eventId: string) => eventById.get(eventId);
export const getRealm = (realmId: string) => realmById.get(realmId);

export function createNewGame(): GameState {
  const realm = realms[0];
  const zone = zoneById.get(realm.startingZoneId) ?? zones[0];
  const area = areaById.get(zone.startingAreaId) ?? areas[0];
  return {
    screen: 'character-creation',
    message: 'Create your character.',
    selectedRealmId: realm.id,
    selectedZoneId: zone.id,
    selectedAreaId: area.id,
    pendingEvent: null,
    combat: null,
    player: null,
    returnBand: {
      unlocked: false,
      cooldownSeconds: 300,
      lastUsedAt: 0
    },
    lastSavedAt: Date.now()
  };
}

export function newPlayer(name: string, backgroundId: string): PlayerState {
  const background = backgroundById.get(backgroundId) ?? backgrounds[0];
  const realm = realmById.get('verdant_expanse') ?? realms[0];
  const zone = zoneById.get(realm.startingZoneId) ?? zones[0];
  const baseStats = {
    strength: 1,
    dexterity: 1,
    endurance: 1,
    intellect: 1,
    luck: 1,
    crafting: 0,
    farming: 0,
    combat: 0,
    resilience: 0,
    lore: 0,
    focus: 0
  };
  const skills = { ...baseStats, ...background.bonuses };
  const inventory = background.startingItems.map((itemId) => ({ itemId, quantity: 1 }));
  const weaponId = background.startingItems.find((itemId) => getItem(itemId)?.type === 'weapon') ?? null;
  const armorId = background.startingItems.find((itemId) => getItem(itemId)?.type === 'armor') ?? null;
  return {
    name,
    backgroundId,
    hp: 24 + (skills.endurance ?? 0) * 2,
    maxHp: 24 + (skills.endurance ?? 0) * 2,
    xp: 0,
    level: 1,
    skills,
    inventory,
    equipment: {
      weaponId,
      armorId
    },
    location: {
      realmId: realm.id,
      zoneId: zone.id,
      areaId: zone.startingAreaId
    },
    discoveredAreaIds: [],
    homestead: {
      plots: [
        { slotId: 'plot-1', cropId: null, plantedAt: null, readyAt: null, quantity: 0 },
        { slotId: 'plot-2', cropId: null, plantedAt: null, readyAt: null, quantity: 0 }
      ]
    }
  };
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function addItem(inventory: InventoryEntry[], itemId: string, quantity: number) {
  const next = clone(inventory);
  const existing = next.find((entry) => entry.itemId === itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    next.push({ itemId, quantity });
  }
  return next.filter((entry) => entry.quantity > 0);
}

export function removeItem(inventory: InventoryEntry[], itemId: string, quantity: number) {
  const next = clone(inventory);
  const existing = next.find((entry) => entry.itemId === itemId);
  if (!existing) return next;
  existing.quantity -= quantity;
  return next.filter((entry) => entry.quantity > 0);
}

export function hasItems(inventory: InventoryEntry[], itemId: string, quantity: number) {
  return inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0 >= quantity;
}

export function itemCount(inventory: InventoryEntry[], itemId: string) {
  return inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
}

export function totalDamage(player: PlayerState) {
  const weapon = player.equipment.weaponId ? getItem(player.equipment.weaponId) : null;
  return 2 + (weapon?.stats?.attack ?? 0) + (player.skills.combat ?? 0);
}

export function totalDefense(player: PlayerState) {
  const armor = player.equipment.armorId ? getItem(player.equipment.armorId) : null;
  return 1 + (armor?.stats?.defense ?? 0) + Math.floor((player.skills.endurance ?? 0) / 2);
}

export function xpToNextLevel(level: number) {
  return 20 + (level - 1) * 15;
}

export function roll<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function rollInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function saveGame(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeGameState(JSON.parse(raw) as GameState);
  } catch {
    return null;
  }
}

export function normalizeGameState(state: GameState): GameState {
  const realm = realmById.get(state.selectedRealmId) ?? realms[0];
  const selectedArea = areaById.get(state.selectedAreaId);
  const selectedZone =
    zoneById.get(state.selectedZoneId) ??
    (selectedArea ? zoneById.get(selectedArea.zoneId) : undefined) ??
    zoneById.get(realm.startingZoneId) ??
    zones[0];
  const area =
    selectedArea && selectedArea.zoneId === selectedZone.id
      ? selectedArea
      : areaById.get(selectedZone.startingAreaId) ?? areas[0];
  const discoveredAreaIds = Array.from(
    new Set([
      ...(state.player?.discoveredAreaIds ?? []),
      ...(['exploration', 'combat', 'event'].includes(state.screen) ? [area.id] : [])
    ])
  ).filter((areaId) => !!areaById.get(areaId));

  return {
    ...state,
    selectedRealmId: realm.id,
    selectedZoneId: selectedZone.id,
    selectedAreaId: area.id,
    returnBand: state.returnBand ?? {
      unlocked: !!state.player,
      cooldownSeconds: 300,
      lastUsedAt: 0
    },
    player: state.player
      ? {
          ...state.player,
          location: {
            realmId: realm.id,
            zoneId: selectedZone.id,
            areaId: area.id
          },
          discoveredAreaIds
        }
      : state.player
  };
}

export function formatInventory(inventory: InventoryEntry[]) {
  return inventory.map((entry) => {
    const item = getItem(entry.itemId);
    return `${item?.name ?? entry.itemId} x${entry.quantity}`;
  });
}

export function getAvailableZones(realmId: string) {
  return zones.filter((zone) => zone.realmId === realmId);
}

export function getAvailableAreas(zoneId: string) {
  return areas.filter((area) => area.zoneId === zoneId);
}

export function isAreaDiscovered(player: PlayerState | null, areaId: string) {
  return !!player?.discoveredAreaIds.includes(areaId);
}

export function getDiscoveredAreas(player: PlayerState | null, zoneId: string) {
  if (!player) return [];
  return getAvailableAreas(zoneId).filter((area) => player.discoveredAreaIds.includes(area.id));
}

export function discoverArea(player: PlayerState, areaId: string) {
  if (player.discoveredAreaIds.includes(areaId)) return player;
  return {
    ...player,
    discoveredAreaIds: [...player.discoveredAreaIds, areaId]
  };
}

export function getAreaEvents(areaId: string) {
  return events.filter((event) => event.areaId === areaId);
}

export function createEnemyState(enemyId: string) {
  const enemy = getEnemy(enemyId);
  if (!enemy) {
    throw new Error(`Unknown enemy: ${enemyId}`);
  }
  return {
    enemyId,
    enemyHp: enemy.stats.health,
    enemyMaxHp: enemy.stats.health,
    enemyGuard: false,
    playerGuard: false,
    log: [`${enemy.name} appears.`],
    loot: [] as InventoryEntry[]
  } satisfies CombatState;
}

export function enemyDamageRange(enemyId: string) {
  const enemy = getEnemy(enemyId);
  if (!enemy) return { min: 0, max: 0 };
  return { min: enemy.stats.damageMin, max: enemy.stats.damageMax };
}
