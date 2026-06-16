import backgroundsData from './data/backgrounds.json';
import realmsData from './data/realms.json';
import zonesData from './data/zones.json';
import areasData from './data/areas.json';
import itemsData from './data/items.json';
import enemiesData from './data/enemies.json';
import cropsData from './data/crops.json';
import recipesData from './data/recipes.json';
import eventsData from './data/events.json';
import expeditionsData from './data/expeditions.json';
import homesteadData from './data/homestead.json';

export type Screen =
  | 'character-creation'
  | 'village'
  | 'tower'
  | 'zone-select'
  | 'area-select'
  | 'travel'
  | 'exploration'
  | 'event'
  | 'combat'
  | 'crafting'
  | 'admin'
  | 'homestead'
  | 'character';

export type ItemDef = {
  id: string;
  name: string;
  type: string;
  description: string;
  value: number;
  stackable: boolean;
  durability?: number;
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
  startingAreaId: string;
};

export type ZoneDef = {
  id: string;
  realmId: string;
  name: string;
  description: string;
  areaIds: string[];
  startingAreaId: string;
};

export type AreaActivityDef = {
  id: string;
  label: string;
  kind: string;
  action: string;
  message?: string;
  eventId?: string;
  destinationAreaId?: string;
  scriptId?: string;
  params?: Record<string, string | number | boolean | null>;
};

export type TravelStyleId = 'careful' | 'normal' | 'quick';

export type TravelRouteEventDef = {
  id: string;
  label: string;
  weight: number;
  kind: 'none' | 'message' | 'reward' | 'combat';
  message?: string;
  enemyId?: string;
  rewards?: { itemId: string; quantity: number }[];
};

export type TravelStyleDef = {
  id: TravelStyleId;
  label: string;
  steps: number;
  eventPool: TravelRouteEventDef[];
};

export type TravelRouteDef = {
  id: string;
  destinationAreaId: string;
  label: string;
  styles: TravelStyleDef[];
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
  travelRoutes?: TravelRouteDef[];
  revealText?: string;
  activities?: AreaActivityDef[];
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
  guaranteedDrops?: { itemId: string; quantity: number }[];
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
  activityId?: string;
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

export type RequirementDef = {
  kind: 'level' | 'skill' | 'item' | 'tool' | 'building' | 'questFlag' | 'key' | 'artifact';
  id?: string;
  value?: number;
  quantity?: number;
  label?: string;
};

export type ExpeditionDef = {
  id: string;
  name: string;
  description: string;
  realmId: string;
  zoneId: string;
  startingAreaId: string;
  recommendedLevel: number;
  requirements: RequirementDef[];
  travelPool: TravelRouteEventDef[];
  rewardPreview: { itemId: string; quantity: number }[];
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
  durability?: number;
  maxDurability?: number;
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
  mp: number;
  maxMp: number;
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
  scriptedFlags: {
    [key: string]: boolean | undefined;
    verdantCampSearchCompleted: boolean;
  };
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
  returnAreaId?: string;
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
  pendingTravel: {
    fromAreaId: string;
    toAreaId: string;
  } | null;
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

export type RuntimeContent = {
  backgrounds?: BackgroundDef[];
  realms?: RealmDef[];
  zones?: ZoneDef[];
  areas?: AreaDef[];
  items?: ItemDef[];
  enemies?: EnemyDef[];
  crops?: CropDef[];
  recipes?: RecipeDef[];
  events?: EventDef[];
  expeditions?: ExpeditionDef[];
  homestead?: HomesteadDef;
};

export let backgrounds = backgroundsData as unknown as BackgroundDef[];
export let realms = realmsData as unknown as RealmDef[];
export let zones = zonesData as unknown as ZoneDef[];
export let areas = areasData as unknown as AreaDef[];
export let items = itemsData as unknown as ItemDef[];
export let enemies = enemiesData as unknown as EnemyDef[];
export let crops = cropsData as CropDef[];
export let recipes = recipesData as unknown as RecipeDef[];
export let events = eventsData as unknown as EventDef[];
export let expeditions = expeditionsData as unknown as ExpeditionDef[];
export let homestead = homesteadData as HomesteadDef;

export const STORAGE_KEY = 'tower-rpg-save-v1';

export let itemById = new Map(items.map((item) => [item.id, item]));
export let backgroundById = new Map(backgrounds.map((item) => [item.id, item]));
export let realmById = new Map(realms.map((item) => [item.id, item]));
export let zoneById = new Map(zones.map((item) => [item.id, item]));
export let areaById = new Map(areas.map((item) => [item.id, item]));
export let enemyById = new Map(enemies.map((item) => [item.id, item]));
export let cropById = new Map(crops.map((item) => [item.id, item]));
export let recipeById = new Map(recipes.map((item) => [item.id, item]));
export let eventById = new Map(events.map((item) => [item.id, item]));
export let expeditionById = new Map(expeditions.map((item) => [item.id, item]));

function rebuildContentIndexes() {
  itemById = new Map(items.map((item) => [item.id, item]));
  backgroundById = new Map(backgrounds.map((item) => [item.id, item]));
  realmById = new Map(realms.map((item) => [item.id, item]));
  zoneById = new Map(zones.map((item) => [item.id, item]));
  areaById = new Map(areas.map((item) => [item.id, item]));
  enemyById = new Map(enemies.map((item) => [item.id, item]));
  cropById = new Map(crops.map((item) => [item.id, item]));
  recipeById = new Map(recipes.map((item) => [item.id, item]));
  eventById = new Map(events.map((item) => [item.id, item]));
  expeditionById = new Map(expeditions.map((item) => [item.id, item]));
}

export function setRuntimeContent(content: RuntimeContent) {
  if (content.backgrounds) backgrounds = content.backgrounds;
  if (content.realms) realms = content.realms;
  if (content.zones) zones = content.zones;
  if (content.areas) areas = content.areas;
  if (content.items) items = content.items;
  if (content.enemies) enemies = content.enemies;
  if (content.crops) crops = content.crops;
  if (content.recipes) recipes = content.recipes;
  if (content.events) events = content.events;
  if (content.expeditions) expeditions = content.expeditions;
  if (content.homestead) homestead = content.homestead;
  rebuildContentIndexes();
}

export const getItem = (itemId: string) => itemById.get(itemId);
export const getBackground = (backgroundId: string) => backgroundById.get(backgroundId);
export const getArea = (areaId: string) => areaById.get(areaId);
export const getZone = (zoneId: string) => zoneById.get(zoneId);
export const getEnemy = (enemyId: string) => enemyById.get(enemyId);
export const getCrop = (cropId: string) => cropById.get(cropId);
export const getEvent = (eventId: string) => eventById.get(eventId);
export const getRealm = (realmId: string) => realmById.get(realmId);
export const getExpedition = (expeditionId: string) => expeditionById.get(expeditionId);

export function getRealmStartLocation(realmId: string) {
  const realm = realmById.get(realmId) ?? realms[0] ?? null;
  if (!realm) return null;
  const startArea = realm.startingAreaId ? areaById.get(realm.startingAreaId) ?? null : null;
  const startZone =
    (startArea ? zoneById.get(startArea.zoneId) ?? null : null) ??
    (realm.startingZoneId ? zoneById.get(realm.startingZoneId) ?? null : null) ??
    getAvailableZones(realm.id)[0] ??
    zones[0] ??
    null;
  const area =
    startArea && startZone && startArea.zoneId === startZone.id
      ? startArea
      : (startZone ? areaById.get(startZone.startingAreaId) ?? getAvailableAreas(startZone.id)[0] ?? areas[0] ?? null : null);
  return {
    realm,
    zone: startZone,
    area
  };
}

export function createNewGame(): GameState {
  const realm = realms[0] ?? null;
  const start = realm ? getRealmStartLocation(realm.id) : null;
  const zone = start?.zone ?? zones[0] ?? null;
  const area = start?.area ?? (zone ? areaById.get(zone.startingAreaId) ?? getAvailableAreas(zone.id)[0] ?? areas[0] ?? null : areas[0] ?? null);
  return {
    screen: 'character-creation',
    message: 'Create your character.',
    selectedRealmId: realm?.id ?? '',
    selectedZoneId: zone?.id ?? '',
    selectedAreaId: area?.id ?? '',
    pendingTravel: null,
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
  const realm = realmById.get('verdant_expanse') ?? realms[0] ?? null;
  const start = realm ? getRealmStartLocation(realm.id) : null;
  const zone = start?.zone ?? zones[0] ?? null;
  const area = start?.area ?? (zone ? areaById.get(zone.startingAreaId) ?? getAvailableAreas(zone.id)[0] ?? areas[0] ?? null : areas[0] ?? null);
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
    mp: 10 + (skills.focus ?? 0) * 2,
    maxMp: 10 + (skills.focus ?? 0) * 2,
    xp: 0,
    level: 1,
    skills,
    inventory,
    equipment: {
      weaponId,
      armorId
    },
    location: {
      realmId: realm?.id ?? '',
      zoneId: zone?.id ?? '',
      areaId: area?.id ?? ''
    },
    discoveredAreaIds: area?.id ? [area.id] : [],
    scriptedFlags: {
      verdantCampSearchCompleted: false
    },
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

export function createInventoryEntry(itemId: string, quantity: number): InventoryEntry {
  const item = getItem(itemId);
  if (item?.durability && quantity === 1) {
    return {
      itemId,
      quantity,
      durability: item.durability,
      maxDurability: item.durability
    };
  }
  return { itemId, quantity };
}

export function addItem(inventory: InventoryEntry[], itemId: string, quantity: number) {
  const next = clone(inventory);
  const item = getItem(itemId);
  const existing = next.find((entry) => entry.itemId === itemId);
  if (existing) {
    if (item && item.stackable === false) {
      return next.filter((entry) => entry.quantity > 0);
    }
    existing.quantity += quantity;
  } else {
    next.push(createInventoryEntry(itemId, quantity));
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
  const realm = realmById.get(state.selectedRealmId) ?? realms[0] ?? null;
  const selectedArea = areaById.get(state.selectedAreaId);
  const realmStart = realm ? getRealmStartLocation(realm.id) : null;
  const fallbackZone = zones[0] ?? null;
  const selectedZone =
    zoneById.get(state.selectedZoneId) ??
    (selectedArea ? zoneById.get(selectedArea.zoneId) : undefined) ??
    realmStart?.zone ??
    fallbackZone;
  const area =
    selectedZone && selectedArea && selectedArea.zoneId === selectedZone.id
      ? selectedArea
      : selectedZone && realmStart?.area && realmStart.area.zoneId === selectedZone.id
        ? realmStart.area
      : selectedZone
        ? areaById.get(selectedZone.startingAreaId) ?? getAvailableAreas(selectedZone.id)[0] ?? areas[0] ?? null
        : areas[0] ?? null;
  const discoveredAreaIds = Array.from(
    new Set([
      ...(state.player?.discoveredAreaIds ?? []),
      ...(state.player ? [state.player.location.areaId] : []),
      ...(['exploration', 'combat', 'event'].includes(state.screen) && area?.id ? [area.id] : [])
    ])
  ).filter((areaId) => !!areaById.get(areaId));

  return {
    ...state,
    selectedRealmId: realm?.id ?? '',
    selectedZoneId: selectedZone?.id ?? '',
    selectedAreaId: area?.id ?? '',
    pendingTravel: state.pendingTravel
      ? {
          fromAreaId: areaById.get(state.pendingTravel.fromAreaId)?.id ?? '',
          toAreaId: areaById.get(state.pendingTravel.toAreaId)?.id ?? ''
        }
      : null,
    returnBand: state.returnBand ?? {
      unlocked: !!state.player,
      cooldownSeconds: 300,
      lastUsedAt: 0
    },
    player: state.player
      ? {
          ...state.player,
          mp: state.player.mp ?? 10 + (state.player.skills.focus ?? 0) * 2,
          maxMp: state.player.maxMp ?? 10 + (state.player.skills.focus ?? 0) * 2,
          location: {
            realmId: realm?.id ?? '',
            zoneId: selectedZone?.id ?? '',
            areaId: area?.id ?? ''
          },
          discoveredAreaIds,
          scriptedFlags: {
            ...state.player.scriptedFlags,
            verdantCampSearchCompleted: state.player.scriptedFlags?.verdantCampSearchCompleted ?? false
          }
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
  const realm = realmById.get(realmId);
  const byRealm = zones.filter((zone) => zone.realmId === realmId);
  if (!realm?.zoneIds?.length) return byRealm;
  const byId = realm.zoneIds.map((zoneId) => getZone(zoneId)).filter((zone): zone is ZoneDef => !!zone);
  const seen = new Set<string>();
  return [...byId, ...byRealm].filter((zone) => {
    if (seen.has(zone.id)) return false;
    seen.add(zone.id);
    return true;
  });
}

export function getAvailableAreas(zoneId: string) {
  const zone = getZone(zoneId);
  const byZone = areas.filter((area) => area.zoneId === zoneId);
  if (!zone?.areaIds?.length) return byZone;
  const byId = zone.areaIds.map((areaId) => getArea(areaId)).filter((area): area is AreaDef => !!area);
  const seen = new Set<string>();
  return [...byId, ...byZone].filter((area) => {
    if (seen.has(area.id)) return false;
    seen.add(area.id);
    return true;
  });
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

export function getTravelRoutes(areaId: string): TravelRouteDef[] {
  const area = getArea(areaId);
  if (!area) return [];
  if (area.travelRoutes?.length) return area.travelRoutes;
  return area.connectedAreaIds.map((destinationAreaId) => {
    const destinationName = getArea(destinationAreaId)?.name ?? destinationAreaId;
    const styles: TravelStyleDef[] = [
      {
        id: 'careful',
        label: 'Travel Carefully',
        steps: 2,
        eventPool: [
          { id: 'quiet_path', label: 'Quiet path', weight: 70, kind: 'none' },
          { id: 'watchful_step', label: 'Watchful step', weight: 20, kind: 'message', message: 'You move slowly and keep to cover.' },
          { id: 'hostile_contact', label: 'Hostile contact', weight: 10, kind: 'combat', enemyId: 'wild_hog' }
        ]
      },
      {
        id: 'normal',
        label: 'Travel Normally',
        steps: 1,
        eventPool: [
          { id: 'clear_travel', label: 'Clear travel', weight: 55, kind: 'none' },
          { id: 'uneasy_feeling', label: 'Uneasy feeling', weight: 20, kind: 'message', message: 'The road feels empty, but not safe.' },
          { id: 'roadside_attack', label: 'Roadside attack', weight: 25, kind: 'combat', enemyId: 'wild_hog' }
        ]
      },
      {
        id: 'quick',
        label: 'Travel Quickly',
        steps: 1,
        eventPool: [
          { id: 'fast_pass', label: 'Fast pass', weight: 40, kind: 'none' },
          { id: 'dust_and_noise', label: 'Dust and noise', weight: 20, kind: 'message', message: 'You push through the road at a brisk pace.' },
          { id: 'open_ambush', label: 'Open ambush', weight: 40, kind: 'combat', enemyId: 'wild_hog' }
        ]
      }
    ];
    return {
      id: `travel_${area.id}_to_${destinationAreaId}`,
      destinationAreaId,
      label: `Travel to ${destinationName}`,
      styles
    };
  });
}

export function getTravelRoute(fromAreaId: string, toAreaId: string) {
  return getTravelRoutes(fromAreaId).find((route) => route.destinationAreaId === toAreaId) ?? null;
}

export function getAreaEvents(areaId: string) {
  return events.filter((event) => event.areaId === areaId);
}

export function createEnemyState(enemyId: string) {
  return createEnemyStateWithContext(enemyId);
}

export function createEnemyStateWithContext(
  enemyId: string,
  context?: { loot?: InventoryEntry[]; returnAreaId?: string }
) {
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
    loot: context?.loot ?? [],
    returnAreaId: context?.returnAreaId
  } satisfies CombatState;
}

export function enemyDamageRange(enemyId: string) {
  const enemy = getEnemy(enemyId);
  if (!enemy) return { min: 0, max: 0 };
  return { min: enemy.stats.damageMin, max: enemy.stats.damageMax };
}
