import areasData from './data/areas.json';
import eventsData from './data/events.json';
import enemiesData from './data/enemies.json';
import itemsData from './data/items.json';
import recipesData from './data/recipes.json';
import realmsData from './data/realms.json';
import zonesData from './data/zones.json';

export type DraftLootEntry = {
  itemId: string;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
};

export type DraftGuaranteedDrop = {
  itemId: string;
  quantity: number;
};

export type DraftAreaPoolEntry = {
  enemyId: string;
  weight: number;
};

export type DraftAreaActivity = {
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

export type DraftEventChoiceOutcome = {
  text: string;
  consumeItems?: boolean;
  rewards: { itemId: string; quantity: number }[];
  combat?: {
    enemyId: string;
  };
};

export type DraftEventChoice = {
  id: string;
  text: string;
  requirements?: { items?: { itemId: string; quantity: number }[] };
  outcome: DraftEventChoiceOutcome;
};

export type AdminItemDraft = {
  id: string;
  name: string;
  type: string;
  slot: string;
  rarity: string;
  value: number;
  description: string;
  damageMin: number | null;
  damageMax: number | null;
  armor: number | null;
  toolType: string;
  level: number | null;
  durability: number | null;
  maxDurability: number | null;
  effect: string;
  tags: string[];
  cropId?: string;
  loreId?: string;
};

export type AdminEnemyDraft = {
  id: string;
  name: string;
  description: string;
  level: number;
  hp: number;
  damageMin: number;
  damageMax: number;
  xp: number;
  lootTable: DraftLootEntry[];
  guaranteedDrops: DraftGuaranteedDrop[];
};

export type AdminRealmDraft = {
  id: string;
  name: string;
  description: string;
  zoneIds: string[];
  startingZoneId: string;
  startingAreaId: string;
};

export type AdminAreaDraft = {
  id: string;
  name: string;
  realmId: string;
  zoneId: string;
  description: string;
  activities: DraftAreaActivity[];
  enemyPool: DraftAreaPoolEntry[];
  encounterChance: number;
  requirements: string[];
  recommendedLevel: number;
  resourceItemIds: string[];
  connectedAreaIds: string[];
  revealText: string;
};

export type AdminZoneDraft = {
  id: string;
  realmId: string;
  name: string;
  description: string;
  areaIds: string[];
  startingAreaId: string;
};

export type AdminRecipeDraft = {
  id: string;
  name: string;
  station: string;
  ingredients: { itemId: string; quantity: number }[];
  outputs: { itemId: string; quantity: number }[];
  requirements: string[];
  requiredLevel: number;
  category: string;
};

export type AdminEventDraft = {
  id: string;
  name: string;
  areaId: string;
  activityId: string;
  description: string;
  choices: DraftEventChoice[];
};

export type AdminDrafts = {
  realms: AdminRealmDraft[];
  items: AdminItemDraft[];
  enemies: AdminEnemyDraft[];
  areas: AdminAreaDraft[];
  zones: AdminZoneDraft[];
  recipes: AdminRecipeDraft[];
  events: AdminEventDraft[];
  updatedAt: number;
};

export function createDefaultAdminDrafts(): AdminDrafts {
  const realmByZoneId = new Map(zonesData.map((zone) => [zone.id, zone.realmId]));
  const zoneById = new Map(zonesData.map((zone) => [zone.id, zone]));
  const areaById = new Map(areasData.map((area) => [area.id, area]));
  const getRealmStartingAreaId = (realm: { zoneIds?: string[]; startingZoneId?: string; startingAreaId?: string }) => {
    if (realm.startingAreaId && areaById.has(realm.startingAreaId)) {
      return realm.startingAreaId;
    }
    const startingZone = (realm.startingZoneId ? zoneById.get(realm.startingZoneId) : null) ?? null;
    if (startingZone?.startingAreaId && areaById.has(startingZone.startingAreaId)) {
      return startingZone.startingAreaId;
    }
    for (const zoneId of realm.zoneIds ?? []) {
      const zone = zoneById.get(zoneId);
      if (!zone) continue;
      if (zone.startingAreaId && areaById.has(zone.startingAreaId)) {
        return zone.startingAreaId;
      }
      const firstAreaId = zone.areaIds?.find((areaId) => areaById.has(areaId));
      if (firstAreaId) return firstAreaId;
    }
    return '';
  };
  const defaultAreaActivities: Record<string, DraftAreaActivity[]> = {
    abandoned_campsite: [
      { id: 'search_camp', label: 'Search Camp', kind: 'scripted', action: 'searchCamp', params: { itemId: 'left_behind_axe', text: 'You find a left behind axe near the torn bedroll. It may be good for knocking down some small trees.', repeatText: 'You search the camp again but find nothing useful.', onceFlag: 'verdantCampSearchCompleted' } },
      { id: 'travel_north', label: 'Travel North: Tree Line', kind: 'travel', action: 'travel', destinationAreaId: 'cluster_of_trees', params: { ambushEnemyId: 'wild_hog', ambushChance: 0.5, dropItemIds: 'raw_meat,hide' } },
      { id: 'travel_west', label: 'Travel West: Pond', kind: 'travel', action: 'travel', destinationAreaId: 'quiet_pond', params: { ambushEnemyId: 'wild_hog', ambushChance: 0.5, dropItemIds: 'raw_meat,hide' } },
      { id: 'travel_east', label: 'Travel East: Grain Fields', kind: 'travel', action: 'travel', destinationAreaId: 'field_of_grain', params: { ambushEnemyId: 'wild_hog', ambushChance: 0.5, dropItemIds: 'raw_meat,hide' } },
      { id: 'travel_south', label: 'Travel South: Mounded Hills', kind: 'travel', action: 'travel', destinationAreaId: 'broken_wagon', params: { ambushEnemyId: 'wild_hog', ambushChance: 0.5, dropItemIds: 'raw_meat,hide' } },
      { id: 'return_tower', label: 'Return to Tower', kind: 'scripted', action: 'returnToTower' }
    ],
    cluster_of_trees: [
      { id: 'harvest_tree', label: 'Harvest Tree', kind: 'scripted', action: 'harvestTree', params: { requiredItemId: 'left_behind_axe', successItemId: 'wood', successChance: 0.5, durabilityBreakChance: 0.2, breakMessage: 'The left behind axe splinters apart.', noToolMessage: 'You need something sharp enough to cut wood.' } },
      { id: 'search_woods', label: 'Search Woods', kind: 'scripted', action: 'searchWoods', eventId: '', params: { enemyId: 'spider', guaranteedDropItemId: 'spider_silk', guaranteedDropQuantity: 1 } },
      { id: 'return_camp', label: 'Return to Camp', kind: 'scripted', action: 'returnToCamp' }
    ],
    quiet_pond: [
      { id: 'fish', label: 'Fish', kind: 'scripted', action: 'fish', params: { requiredItemId: 'fishing_pole', successItemId: 'fish', successChance: 0.5, noToolMessage: 'You need a fishing pole before you can fish here.', failMessage: 'Nothing bites.', successMessage: 'You catch a fish.' } },
      { id: 'search_shore', label: 'Search Shore', kind: 'scripted', action: 'message', message: 'The shoreline is lined with smooth stones and reeds.' },
      { id: 'return_camp', label: 'Return to Camp', kind: 'scripted', action: 'returnToCamp' }
    ],
    field_of_grain: [
      { id: 'harvest_grain', label: 'Harvest Grain', kind: 'scripted', action: 'grantItem', params: { itemId: 'grain', quantity: 1, text: 'You cut a handful of grain for later.' } },
      { id: 'search_field', label: 'Search Field', kind: 'scripted', action: 'message', message: 'You comb the stalks for anything unusual.' },
      { id: 'return_camp', label: 'Return to Camp', kind: 'scripted', action: 'returnToCamp' }
    ],
    broken_wagon: [
      { id: 'explore_hills', label: 'Explore Hills', kind: 'scripted', action: 'message', message: 'You climb the mounded hills and scan the plains.' },
      { id: 'search_mounds', label: 'Search Mounds', kind: 'scripted', action: 'message', message: 'The mounded earth yields only stones and hard soil.' },
      { id: 'return_camp', label: 'Return to Camp', kind: 'scripted', action: 'returnToCamp' }
    ],
    whispering_gardens: [
      { id: 'listen', label: 'Listen Among the Blooms', kind: 'event', action: 'event', eventId: 'garden_whispers' },
      { id: 'search', label: 'Search the Terraces', kind: 'message', action: 'message', message: 'You inspect the garden terraces for clues.' },
      { id: 'leave', label: 'Leave', kind: 'leave', action: 'leave' }
    ],
    deep_woods: [
      { id: 'track', label: "Track the Old Paths", kind: 'event', action: 'event', eventId: 'lost_ranger_cache' },
      { id: 'forage', label: 'Forage Under the Canopy', kind: 'message', action: 'message', message: 'You gather bark, leaves, and dry twigs.' },
      { id: 'leave', label: 'Leave', kind: 'leave', action: 'leave' }
    ]
  };
  return {
    realms: realmsData.map((realm) => ({
      id: realm.id,
      name: realm.name,
      description: realm.description,
      zoneIds: realm.zoneIds,
      startingZoneId: realm.startingZoneId,
      startingAreaId: getRealmStartingAreaId(realm)
    })),
    items: itemsData.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      slot: (item as any).slot ?? item.type,
      rarity: (item as any).rarity ?? 'common',
      value: item.value,
      description: item.description,
      damageMin: (item as any).damageMin ?? (item as any).stats?.attack ?? null,
      damageMax: (item as any).damageMax ?? (item as any).stats?.attack ?? null,
      armor: (item as any).armor ?? (item as any).stats?.defense ?? null,
      toolType: (item as any).toolType ?? (item.type === 'tool' ? item.id : ''),
      level: (item as any).level ?? null,
      durability: (item as any).durability ?? null,
      maxDurability: (item as any).maxDurability ?? item.durability ?? null,
      effect: (item as any).effect ?? ((item as any).effects ? JSON.stringify((item as any).effects, null, 2) : ''),
      tags: (item as any).tags ?? [item.type],
      cropId: item.cropId,
      loreId: item.loreId
    })),
    enemies: enemiesData.map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      description: enemy.description,
      level: enemy.level,
      hp: (enemy as any).stats?.health ?? (enemy as any).hp ?? 1,
      damageMin: (enemy as any).stats?.damageMin ?? (enemy as any).damageMin ?? 0,
      damageMax: (enemy as any).stats?.damageMax ?? (enemy as any).damageMax ?? 0,
      xp: (enemy as any).xp ?? enemy.level * 10,
      lootTable: (enemy as any).lootTable ?? (enemy as any).loot ?? [],
      guaranteedDrops: []
    })),
    areas: areasData.map((area) => ({
      id: area.id,
      name: area.name,
      realmId: (area as any).realmId ?? realmByZoneId.get(area.zoneId) ?? '',
      zoneId: area.zoneId,
      description: area.description,
      activities: (area as any).activities ?? defaultAreaActivities[area.id] ?? [],
      enemyPool: (area as any).enemyPool ?? [],
      encounterChance: area.encounterChance ?? 0,
      requirements: (area as any).requirements ?? [],
      recommendedLevel: area.recommendedLevel,
      resourceItemIds: area.resourceItemIds,
      connectedAreaIds: area.connectedAreaIds,
      revealText: area.revealText ?? ''
    })),
    zones: zonesData.map((zone) => ({
      id: zone.id,
      realmId: zone.realmId,
      name: zone.name,
      description: zone.description,
      areaIds: zone.areaIds,
      startingAreaId: zone.startingAreaId
    })),
    recipes: recipesData.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      station: (recipe as any).station ?? recipe.category,
      ingredients: recipe.ingredients,
      outputs: (recipe as any).outputs ?? [(recipe as any).output],
      requirements: (recipe as any).requirements ?? [],
      requiredLevel: recipe.requiredLevel,
      category: (recipe as any).category ?? recipe.category
    })),
    events: eventsData.map((event) => ({
      id: event.id,
      name: event.name,
      areaId: event.areaId,
      activityId: (event as any).activityId ?? '',
      description: event.description,
      choices: event.choices
    })),
    updatedAt: Date.now()
  };
}

export function normalizeAdminDrafts(drafts: AdminDrafts): AdminDrafts {
  const defaults = createDefaultAdminDrafts();
  const mergeById = <T extends { id: string }>(entries: T[] | undefined, fallback: T[]) => {
    if (!entries) return fallback;
    const fallbackById = new Map(fallback.map((entry) => [entry.id, entry]));
    return entries.map((entry) => ({ ...(fallbackById.get(entry.id) ?? {}), ...entry }));
  };
  return {
    realms: mergeById(drafts.realms, defaults.realms),
    items: mergeById(drafts.items, defaults.items),
    enemies: mergeById(drafts.enemies, defaults.enemies),
    areas: mergeById(drafts.areas, defaults.areas),
    zones: mergeById(drafts.zones, defaults.zones),
    recipes: mergeById(drafts.recipes, defaults.recipes),
    events: mergeById(drafts.events, defaults.events),
    updatedAt: drafts.updatedAt ?? Date.now()
  };
}

export function exportAdminDrafts(drafts: AdminDrafts) {
  return {
    realms: drafts.realms,
    items: drafts.items,
    enemies: drafts.enemies,
    areas: drafts.areas,
    zones: drafts.zones,
    recipes: drafts.recipes,
    events: drafts.events
  };
}

export function serializeAdminDraftsForSourceFiles(drafts: AdminDrafts) {
  return {
    realms: drafts.realms.map((realm) => ({
      id: realm.id,
      name: realm.name,
      description: realm.description,
      zoneIds: realm.zoneIds,
      startingZoneId: realm.startingZoneId,
      startingAreaId: realm.startingAreaId
    })),
    zones: drafts.zones.map((zone) => ({
      id: zone.id,
      realmId: zone.realmId,
      name: zone.name,
      description: zone.description,
      areaIds: zone.areaIds,
      startingAreaId: zone.startingAreaId
    })),
    areas: drafts.areas.map((area) => ({
      id: area.id,
      zoneId: area.zoneId,
      name: area.name,
      description: area.description,
      recommendedLevel: area.recommendedLevel,
      enemyIds: area.enemyPool.map((entry) => entry.enemyId),
      enemyPool: area.enemyPool,
      encounterChance: area.encounterChance,
      resourceItemIds: area.resourceItemIds,
      connectedAreaIds: area.connectedAreaIds,
      revealText: area.revealText,
      activities: area.activities,
      realmId: area.realmId,
      requirements: area.requirements
    })),
    items: drafts.items.map((item) => {
      const effects = parseJsonRecord(item.effect);
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
        value: item.value,
        stackable: !['weapon', 'armor', 'tool'].includes(item.type),
        stats: {
          ...(item.damageMin != null || item.damageMax != null ? { attack: item.damageMax ?? item.damageMin ?? 0 } : {}),
          ...(item.armor != null ? { defense: item.armor } : {})
        },
        effects,
        durability: item.maxDurability ?? item.durability ?? undefined,
        cropId: item.cropId,
        loreId: item.loreId,
        slot: item.slot,
        rarity: item.rarity,
        damageMin: item.damageMin,
        damageMax: item.damageMax,
        armor: item.armor,
        toolType: item.toolType,
        level: item.level,
        maxDurability: item.maxDurability,
        effect: item.effect,
        tags: item.tags
      };
    }),
    enemies: drafts.enemies.map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      description: enemy.description,
      level: enemy.level,
      stats: {
        health: enemy.hp,
        damageMin: enemy.damageMin,
        damageMax: enemy.damageMax,
        defense: 0
      },
      loot: enemy.lootTable,
      guaranteedDrops: enemy.guaranteedDrops
    })),
    recipes: drafts.recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      category: recipe.category || recipe.station,
      station: recipe.station,
      requiredLevel: recipe.requiredLevel,
      ingredients: recipe.ingredients,
      output: recipe.outputs[0] ?? { itemId: '', quantity: 0 },
      outputs: recipe.outputs,
      requirements: recipe.requirements
    })),
    events: drafts.events.map((event) => ({
      id: event.id,
      name: event.name,
      areaId: event.areaId,
      activityId: event.activityId,
      description: event.description,
      choices: event.choices
    }))
  };
}

export function buildRuntimeContentFromDrafts(drafts: AdminDrafts) {
  return {
    realms: drafts.realms.map((realm) => ({
      id: realm.id,
      name: realm.name,
      description: realm.description,
      zoneIds: realm.zoneIds,
      startingZoneId: realm.startingZoneId,
      startingAreaId: realm.startingAreaId
    })),
    areas: drafts.areas.map((area) => ({
      id: area.id,
      zoneId: area.zoneId,
      name: area.name,
      description: area.description,
      recommendedLevel: area.recommendedLevel,
      enemyIds: area.enemyPool.map((entry) => entry.enemyId),
      enemyPool: area.enemyPool.length ? area.enemyPool : undefined,
      encounterChance: area.encounterChance,
      resourceItemIds: area.resourceItemIds,
      connectedAreaIds: area.connectedAreaIds,
      revealText: area.revealText,
      activities: area.activities
    })),
    zones: drafts.zones.map((zone) => ({ ...zone })),
    items: drafts.items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      description: item.description,
      value: item.value,
      stackable: !['weapon', 'armor', 'tool'].includes(item.type),
      durability: item.maxDurability ?? item.durability ?? undefined,
      stats: {
        ...(item.damageMin != null || item.damageMax != null ? { attack: item.damageMax ?? item.damageMin ?? 0 } : {}),
        ...(item.armor != null ? { defense: item.armor } : {})
      },
      effects: parseJsonRecord(item.effect),
      cropId: item.cropId,
      loreId: item.loreId
    })),
    enemies: drafts.enemies.map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      description: enemy.description,
      level: enemy.level,
      stats: {
        health: enemy.hp,
        damageMin: enemy.damageMin,
        damageMax: enemy.damageMax,
        defense: 0
      },
      loot: enemy.lootTable,
      guaranteedDrops: enemy.guaranteedDrops
    })),
    recipes: drafts.recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      requiredLevel: recipe.requiredLevel,
      ingredients: recipe.ingredients,
      output: recipe.outputs[0] ?? { itemId: '', quantity: 0 }
    })),
    events: drafts.events.map((event) => ({ ...event }))
  };
}

function parseJsonRecord(text: string) {
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text) as Record<string, number>;
  } catch {
    return undefined;
  }
}

export function cloneDrafts<T>(value: T): T {
  return structuredClone(value);
}

export function createDraftId(prefix: string, existingIds: string[]) {
  let suffix = 1;
  let candidate = `${prefix}_${suffix}`;
  while (existingIds.includes(candidate)) {
    suffix += 1;
    candidate = `${prefix}_${suffix}`;
  }
  return candidate;
}

export function createBlankItemDraft(existingIds: string[]): AdminItemDraft {
  return {
    id: createDraftId('new_item', existingIds),
    name: 'New Item',
    type: 'material',
    slot: '',
    rarity: 'common',
    value: 0,
    description: '',
    damageMin: null,
    damageMax: null,
    armor: null,
    toolType: '',
    level: null,
    durability: null,
    maxDurability: null,
    effect: '',
    tags: []
  };
}

export function createBlankEnemyDraft(existingIds: string[]): AdminEnemyDraft {
  return {
    id: createDraftId('new_enemy', existingIds),
    name: 'New Enemy',
    description: '',
    level: 1,
    hp: 10,
    damageMin: 1,
    damageMax: 2,
    xp: 10,
    lootTable: [],
    guaranteedDrops: []
  };
}

export function createBlankRealmDraft(existingIds: string[]): AdminRealmDraft {
  return {
    id: createDraftId('new_realm', existingIds),
    name: 'New Realm',
    description: '',
    zoneIds: [],
    startingZoneId: '',
    startingAreaId: ''
  };
}

export function createBlankAreaDraft(existingIds: string[]): AdminAreaDraft {
  return {
    id: createDraftId('new_area', existingIds),
    name: 'New Area',
    realmId: '',
    zoneId: '',
    description: '',
    activities: [],
    enemyPool: [],
    encounterChance: 0,
    requirements: [],
    recommendedLevel: 1,
    resourceItemIds: [],
    connectedAreaIds: [],
    revealText: ''
  };
}

export function createBlankZoneDraft(existingIds: string[]): AdminZoneDraft {
  return {
    id: createDraftId('new_zone', existingIds),
    realmId: '',
    name: 'New Zone',
    description: '',
    areaIds: [],
    startingAreaId: ''
  };
}

export function createBlankRecipeDraft(existingIds: string[]): AdminRecipeDraft {
  return {
    id: createDraftId('new_recipe', existingIds),
    name: 'New Recipe',
    station: '',
    ingredients: [],
    outputs: [],
    requirements: [],
    requiredLevel: 1,
    category: ''
  };
}

export function createBlankEventDraft(existingIds: string[]): AdminEventDraft {
  return {
    id: createDraftId('new_event', existingIds),
    name: 'New Event',
    areaId: '',
    activityId: '',
    description: '',
    choices: []
  };
}

export function getExpeditionValidationIssues(drafts: AdminDrafts) {
  const issues: string[] = [];
  if (!drafts.realms.length) issues.push('At least one realm must remain.');
  if (!drafts.zones.length) issues.push('At least one zone must remain.');
  if (!drafts.areas.length) issues.push('At least one area must remain.');

  for (const realm of drafts.realms) {
    if (!realm.zoneIds.some((zoneId) => drafts.zones.some((zone) => zone.id === zoneId))) {
      issues.push(`Realm ${realm.name} needs at least one attached zone.`);
    }
    const startingZone = drafts.zones.find((zone) => zone.id === realm.startingZoneId);
    if (!startingZone || !(startingZone.realmId === realm.id || realm.zoneIds.includes(startingZone.id))) {
      issues.push(`Realm ${realm.name} needs a valid starting zone.`);
    }
    const startingArea = drafts.areas.find((area) => area.id === realm.startingAreaId);
    if (!startingArea) {
      issues.push(`Realm ${realm.name} needs a valid starting area.`);
      continue;
    }
    if (!startingZone || startingArea.zoneId !== startingZone.id) {
      issues.push(`Realm ${realm.name} starting area must belong to the starting zone.`);
    }
  }

  for (const zone of drafts.zones) {
    const zoneAreas = drafts.areas.filter((area) => area.zoneId === zone.id);
    if (!zoneAreas.length) {
      issues.push(`Zone ${zone.name} needs at least one area.`);
    }
    const startingArea = drafts.areas.find((area) => area.id === zone.startingAreaId);
    if (!startingArea || startingArea.zoneId !== zone.id) {
      issues.push(`Zone ${zone.name} needs a valid starting area.`);
    }
  }

  return Array.from(new Set(issues));
}

export function getDeleteSafetyNotes(drafts: AdminDrafts, kind: 'realms' | 'zones' | 'areas' | 'events' | 'enemies' | 'items' | 'recipes', id: string) {
  const next = deleteAdminDraftRecord(drafts, kind, id);
  return getExpeditionValidationIssues(next);
}

export function deleteAdminDraftRecord(drafts: AdminDrafts, kind: 'realms' | 'zones' | 'areas' | 'events' | 'enemies' | 'items' | 'recipes', id: string): AdminDrafts {
  const next = cloneDrafts(drafts);
  switch (kind) {
    case 'realms': {
      next.realms = next.realms.filter((realm) => realm.id !== id);
      next.zones = next.zones.map((zone) => (zone.realmId === id ? { ...zone, realmId: '' } : zone));
      next.areas = next.areas.map((area) => (area.realmId === id ? { ...area, realmId: '' } : area));
      break;
    }
    case 'zones': {
      const removedZoneAreaIds = next.areas.filter((area) => area.zoneId === id).map((area) => area.id);
      next.zones = next.zones.filter((zone) => zone.id !== id);
      next.realms = next.realms.map((realm) => {
        const startingAreaInRemovedZone = removedZoneAreaIds.includes(realm.startingAreaId);
        if (!realm.zoneIds.includes(id) && realm.startingZoneId !== id && !startingAreaInRemovedZone) return realm;
        const nextZoneIds = realm.zoneIds.filter((zoneId) => zoneId !== id);
        const fallbackZone = nextZoneIds
          .map((zoneId) => next.zones.find((zone) => zone.id === zoneId))
          .find((zone): zone is AdminZoneDraft => !!zone);
        const nextStartingZoneId = realm.startingZoneId === id || startingAreaInRemovedZone ? fallbackZone?.id ?? '' : realm.startingZoneId;
        const nextStartingAreaId = realm.startingZoneId === id || startingAreaInRemovedZone || realm.startingAreaId === ''
          ? resolveZoneStartingAreaId(next, nextStartingZoneId)
          : realm.startingAreaId;
        return {
          ...realm,
          zoneIds: nextZoneIds,
          startingZoneId: nextStartingZoneId,
          startingAreaId: nextStartingAreaId
        };
      });
      next.areas = next.areas.map((area) => (area.zoneId === id ? { ...area, zoneId: '', realmId: '' } : area));
      break;
    }
    case 'areas': {
      next.areas = next.areas.filter((area) => area.id !== id);
      next.zones = next.zones.map((zone) => {
        const hasRemovedArea = zone.areaIds.includes(id);
        const startingAreaMissing = zone.startingAreaId === id || (!zone.startingAreaId ? false : !next.areas.some((area) => area.id === zone.startingAreaId));
        if (!hasRemovedArea && !startingAreaMissing) return zone;
        const remainingAreaIds = zone.areaIds.filter((areaId) => areaId !== id);
        const nextStartingAreaId = startingAreaMissing ? remainingAreaIds[0] ?? '' : zone.startingAreaId;
        return {
          ...zone,
          areaIds: remainingAreaIds,
          startingAreaId: nextStartingAreaId
        };
      });
      next.realms = next.realms.map((realm) => {
        if (realm.startingAreaId !== id) return realm;
        const replacement = resolveRealmStartingAreaId(next, realm.id);
        const replacementZone = replacement ? next.areas.find((area) => area.id === replacement)?.zoneId ?? '' : '';
        return {
          ...realm,
          startingAreaId: replacement,
          startingZoneId: replacementZone || realm.startingZoneId
        };
      });
      next.events = next.events.map((event) => (event.areaId === id ? { ...event, areaId: '' } : event));
      next.areas = next.areas.map((area) => ({
        ...area,
        connectedAreaIds: area.connectedAreaIds.filter((connectedId) => connectedId !== id),
        activities: area.activities.map((activity) => {
          if (activity.destinationAreaId === id) {
            return { ...activity, destinationAreaId: '' };
          }
          const nextParams = activity.params ? { ...activity.params } : undefined;
          if (nextParams && nextParams.destinationAreaId === id) {
            nextParams.destinationAreaId = '';
            return { ...activity, params: nextParams };
          }
          return activity;
        })
      }));
      break;
    }
    case 'events': {
      next.events = next.events.filter((event) => event.id !== id);
      next.areas = next.areas.map((area) => ({
        ...area,
        activities: area.activities.map((activity) => (activity.eventId === id ? { ...activity, eventId: '' } : activity))
      }));
      break;
    }
    case 'enemies': {
      next.enemies = next.enemies.filter((enemy) => enemy.id !== id);
      next.areas = next.areas.map((area) => ({
        ...area,
        enemyPool: area.enemyPool.filter((entry) => entry.enemyId !== id)
      }));
      next.events = next.events.map((event) => ({
        ...event,
        choices: event.choices.map((choice) =>
          choice.outcome.combat?.enemyId === id
            ? { ...choice, outcome: { ...choice.outcome, combat: undefined } }
            : choice
        )
      }));
      break;
    }
    case 'items': {
      next.items = next.items.filter((item) => item.id !== id);
      next.areas = next.areas.map((area) => ({
        ...area,
        resourceItemIds: area.resourceItemIds.filter((itemId) => itemId !== id)
      }));
      next.enemies = next.enemies.map((enemy) => ({
        ...enemy,
        lootTable: enemy.lootTable.filter((entry) => entry.itemId !== id),
        guaranteedDrops: enemy.guaranteedDrops.filter((entry) => entry.itemId !== id)
      }));
      next.recipes = next.recipes.map((recipe) => ({
        ...recipe,
        ingredients: recipe.ingredients.filter((ingredient) => ingredient.itemId !== id),
        outputs: recipe.outputs.filter((output) => output.itemId !== id)
      }));
      break;
    }
    case 'recipes': {
      next.recipes = next.recipes.filter((recipe) => recipe.id !== id);
      break;
    }
  }
  next.updatedAt = Date.now();
  return next;
}

function resolveZoneStartingAreaId(drafts: AdminDrafts, zoneId: string) {
  const zone = drafts.zones.find((entry) => entry.id === zoneId);
  if (!zone) return '';
  if (zone.startingAreaId && drafts.areas.some((area) => area.id === zone.startingAreaId)) {
    return zone.startingAreaId;
  }
  const zoneArea = zone.areaIds
    .map((areaId) => drafts.areas.find((area) => area.id === areaId))
    .find((area): area is AdminAreaDraft => !!area);
  return zoneArea?.id ?? '';
}

function resolveRealmStartingAreaId(drafts: AdminDrafts, realmId: string) {
  const realm = drafts.realms.find((entry) => entry.id === realmId);
  if (!realm) return '';
  if (realm.startingAreaId && drafts.areas.some((area) => area.id === realm.startingAreaId)) {
    return realm.startingAreaId;
  }
  for (const zoneId of realm.zoneIds) {
    const areaId = resolveZoneStartingAreaId(drafts, zoneId);
    if (areaId) return areaId;
  }
  return '';
}
