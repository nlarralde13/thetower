import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const mutableKinds = ['realms', 'zones', 'areas', 'items', 'enemies', 'recipes', 'events', 'expeditions'];
const sourceFileMap = {
  realms: 'realms.json',
  zones: 'zones.json',
  areas: 'areas.json',
  items: 'items.json',
  enemies: 'enemies.json',
  recipes: 'recipes.json',
  events: 'events.json',
  expeditions: 'expeditions.json'
};

const dbFilePath = path.join(process.cwd(), '.thetower-content.sqlite');
const dataDirectory = path.join(process.cwd(), 'src', 'data');

function readJsonFile(filename) {
  const filePath = path.join(dataDirectory, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filename, value) {
  const filePath = path.join(dataDirectory, filename);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function defaultAreaActivities() {
  return {
    abandoned_campsite: [
      {
        id: 'search_camp',
        label: 'Search Camp',
        kind: 'scripted',
        action: 'searchCamp',
        params: {
          itemId: 'left_behind_axe',
          text: 'You find a left behind axe near the torn bedroll. It may be good for knocking down some small trees.',
          repeatText: 'You search the camp again but find nothing useful.',
          onceFlag: 'verdantCampSearchCompleted'
        }
      },
      {
        id: 'travel_north',
        label: 'Travel North: Tree Line',
        kind: 'travel',
        action: 'travel',
        destinationAreaId: 'cluster_of_trees',
        params: { ambushEnemyId: 'wild_hog', ambushChance: 0.5, dropItemIds: 'raw_meat,hide' }
      },
      {
        id: 'travel_west',
        label: 'Travel West: Pond',
        kind: 'travel',
        action: 'travel',
        destinationAreaId: 'quiet_pond',
        params: { ambushEnemyId: 'wild_hog', ambushChance: 0.5, dropItemIds: 'raw_meat,hide' }
      },
      {
        id: 'travel_east',
        label: 'Travel East: Grain Fields',
        kind: 'travel',
        action: 'travel',
        destinationAreaId: 'field_of_grain',
        params: { ambushEnemyId: 'wild_hog', ambushChance: 0.5, dropItemIds: 'raw_meat,hide' }
      },
      {
        id: 'travel_south',
        label: 'Travel South: Mounded Hills',
        kind: 'travel',
        action: 'travel',
        destinationAreaId: 'broken_wagon',
        params: { ambushEnemyId: 'wild_hog', ambushChance: 0.5, dropItemIds: 'raw_meat,hide' }
      },
      { id: 'return_tower', label: 'Return to Tower', kind: 'scripted', action: 'returnToTower' }
    ],
    cluster_of_trees: [
      {
        id: 'harvest_tree',
        label: 'Harvest Tree',
        kind: 'scripted',
        action: 'harvestTree',
        params: {
          requiredItemId: 'left_behind_axe',
          successItemId: 'wood',
          successChance: 0.5,
          durabilityBreakChance: 0.2,
          breakMessage: 'The left behind axe splinters apart.',
          noToolMessage: 'You need something sharp enough to cut wood.'
        }
      },
      {
        id: 'search_woods',
        label: 'Search Woods',
        kind: 'scripted',
        action: 'searchWoods',
        params: { enemyId: 'spider', guaranteedDropItemId: 'spider_silk', guaranteedDropQuantity: 1 }
      },
      { id: 'return_camp', label: 'Return to Camp', kind: 'scripted', action: 'returnToCamp' }
    ],
    quiet_pond: [
      {
        id: 'fish',
        label: 'Fish',
        kind: 'scripted',
        action: 'fish',
        params: {
          requiredItemId: 'fishing_pole',
          successItemId: 'fish',
          successChance: 0.5,
          noToolMessage: 'You need a fishing pole before you can fish here.',
          failMessage: 'Nothing bites.',
          successMessage: 'You catch a fish.'
        }
      },
      { id: 'search_shore', label: 'Search Shore', kind: 'scripted', action: 'message', message: 'The shoreline is lined with smooth stones and reeds.' },
      { id: 'return_camp', label: 'Return to Camp', kind: 'scripted', action: 'returnToCamp' }
    ],
    field_of_grain: [
      {
        id: 'harvest_grain',
        label: 'Harvest Grain',
        kind: 'scripted',
        action: 'grantItem',
        params: { itemId: 'grain', quantity: 1, text: 'You cut a handful of grain for later.' }
      },
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
      { id: 'track', label: 'Track the Old Paths', kind: 'event', action: 'event', eventId: 'lost_ranger_cache' },
      { id: 'forage', label: 'Forage Under the Canopy', kind: 'message', action: 'message', message: 'You gather bark, leaves, and dry twigs.' },
      { id: 'leave', label: 'Leave', kind: 'leave', action: 'leave' }
    ]
  };
}

function defaultTravelStyles(destinationAreaName) {
  return [
    {
      id: 'careful',
      label: 'Travel Carefully',
      steps: 2,
      eventPool: [
        { id: 'safe_passage', label: 'Safe passage', weight: 70, kind: 'none' },
        { id: 'watchful_note', label: 'Watchful note', weight: 20, kind: 'message', message: `You keep to the edge of the road toward ${destinationAreaName}.` },
        { id: 'road_ambush', label: 'Road ambush', weight: 10, kind: 'combat', enemyId: 'wild_hog' }
      ]
    },
    {
      id: 'normal',
      label: 'Travel Normally',
      steps: 1,
      eventPool: [
        { id: 'straight_path', label: 'Straight path', weight: 55, kind: 'none' },
        { id: 'passing_thought', label: 'Passing thought', weight: 20, kind: 'message', message: `You keep moving toward ${destinationAreaName}.` },
        { id: 'roadside_attack', label: 'Roadside attack', weight: 25, kind: 'combat', enemyId: 'wild_hog' }
      ]
    },
    {
      id: 'quick',
      label: 'Travel Quickly',
      steps: 1,
      eventPool: [
        { id: 'fast_route', label: 'Fast route', weight: 40, kind: 'none' },
        { id: 'brisk_push', label: 'Brisk push', weight: 20, kind: 'message', message: `You hurry toward ${destinationAreaName}.` },
        { id: 'open_ambush', label: 'Open ambush', weight: 40, kind: 'combat', enemyId: 'wild_hog' }
      ]
    }
  ];
}

function defaultTravelRoutes(areaId, connectedAreaIds, areaNameById) {
  return connectedAreaIds.map((destinationAreaId) => {
    const destinationAreaName = areaNameById.get(destinationAreaId) ?? destinationAreaId;
    return {
      id: `travel_${areaId}_to_${destinationAreaId}`,
      destinationAreaId,
      label: `Travel to ${destinationAreaName}`,
      styles: defaultTravelStyles(destinationAreaName)
    };
  });
}

function ensureTravelRoutes(drafts) {
  const areaNameById = new Map((drafts.areas ?? []).map((area) => [area.id, area.name]));
  return {
    ...drafts,
    areas: (drafts.areas ?? []).map((area) => ({
      ...area,
      travelRoutes: area.travelRoutes?.length ? area.travelRoutes : defaultTravelRoutes(area.id, area.connectedAreaIds ?? [], areaNameById)
    }))
  };
}

function toDraftsFromSource() {
  const realms = readJsonFile(sourceFileMap.realms);
  const zones = readJsonFile(sourceFileMap.zones);
  const areas = readJsonFile(sourceFileMap.areas);
  const items = readJsonFile(sourceFileMap.items);
  const enemies = readJsonFile(sourceFileMap.enemies);
  const recipes = readJsonFile(sourceFileMap.recipes);
  const events = readJsonFile(sourceFileMap.events);
  const expeditions = readJsonFile(sourceFileMap.expeditions);
  const realmByZoneId = new Map(zones.map((zone) => [zone.id, zone.realmId]));
  const zoneById = new Map(zones.map((zone) => [zone.id, zone]));
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const activities = defaultAreaActivities();

  return {
    realms: realms.map((realm) => ({
      id: realm.id,
      name: realm.name,
      description: realm.description,
      zoneIds: realm.zoneIds ?? [],
      startingZoneId: realm.startingZoneId ?? realm.zoneIds?.[0] ?? '',
      startingAreaId:
        realm.startingAreaId ??
        zoneById.get(realm.startingZoneId ?? realm.zoneIds?.[0] ?? '')?.startingAreaId ??
        zoneById
          .get(realm.startingZoneId ?? realm.zoneIds?.[0] ?? '')
          ?.areaIds?.find((areaId) => areaById.has(areaId)) ??
        ''
    })),
    zones: zones.map((zone) => ({
      id: zone.id,
      realmId: zone.realmId ?? '',
      name: zone.name,
      description: zone.description,
      areaIds: zone.areaIds ?? [],
      startingAreaId: zone.startingAreaId ?? zone.areaIds?.[0] ?? ''
    })),
    areas: areas.map((area) => ({
      id: area.id,
      name: area.name,
      realmId: area.realmId ?? realmByZoneId.get(area.zoneId) ?? '',
      zoneId: area.zoneId,
      description: area.description,
      activities: area.activities ?? activities[area.id] ?? [],
      enemyPool: area.enemyPool ?? (Array.isArray(area.enemyIds) ? area.enemyIds.map((enemyId) => ({ enemyId, weight: 1 })) : []),
      encounterChance: area.encounterChance ?? 0,
      requirements: area.requirements ?? [],
      recommendedLevel: area.recommendedLevel ?? 1,
      resourceItemIds: area.resourceItemIds ?? [],
      connectedAreaIds: area.connectedAreaIds ?? [],
      travelRoutes: area.travelRoutes ?? defaultTravelRoutes(area.id, area.connectedAreaIds ?? [], new Map(areas.map((entry) => [entry.id, entry.name]))),
      revealText: area.revealText ?? ''
    })),
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      slot: item.slot ?? item.type,
      rarity: item.rarity ?? 'common',
      value: item.value ?? 0,
      description: item.description ?? '',
      damageMin: item.damageMin ?? item.stats?.attack ?? null,
      damageMax: item.damageMax ?? item.stats?.attack ?? null,
      armor: item.armor ?? item.stats?.defense ?? null,
      toolType: item.toolType ?? (item.type === 'tool' ? item.id : ''),
      level: item.level ?? null,
      durability: item.durability ?? null,
      maxDurability: item.maxDurability ?? item.durability ?? null,
      effect: item.effect ?? (item.effects ? JSON.stringify(item.effects, null, 2) : ''),
      tags: item.tags ?? [item.type],
      cropId: item.cropId,
      loreId: item.loreId
    })),
    enemies: enemies.map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      description: enemy.description,
      level: enemy.level ?? 1,
      hp: enemy.hp ?? enemy.stats?.health ?? 1,
      damageMin: enemy.damageMin ?? enemy.stats?.damageMin ?? 0,
      damageMax: enemy.damageMax ?? enemy.stats?.damageMax ?? 0,
      xp: enemy.xp ?? (enemy.level ?? 1) * 10,
      lootTable: enemy.lootTable ?? enemy.loot ?? [],
      guaranteedDrops: enemy.guaranteedDrops ?? []
    })),
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      station: recipe.station ?? recipe.category ?? '',
      ingredients: recipe.ingredients ?? [],
      outputs: recipe.outputs ?? (recipe.output ? [recipe.output] : []),
      requirements: recipe.requirements ?? [],
      requiredLevel: recipe.requiredLevel ?? 1,
      category: recipe.category ?? recipe.station ?? ''
    })),
    events: events.map((event) => ({
      id: event.id,
      name: event.name,
      areaId: event.areaId ?? '',
      activityId: event.activityId ?? '',
      description: event.description ?? '',
      choices: event.choices ?? []
    })),
    expeditions: expeditions.map((expedition) => ({
      id: expedition.id,
      name: expedition.name,
      description: expedition.description ?? '',
      realmId: expedition.realmId ?? '',
      zoneId: expedition.zoneId ?? '',
      startingAreaId: expedition.startingAreaId ?? '',
      recommendedLevel: expedition.recommendedLevel ?? 1,
      requirements: expedition.requirements ?? [],
      travelPool: expedition.travelPool ?? [],
      rewardPreview: expedition.rewardPreview ?? []
    })),
    updatedAt: Date.now()
  };
}

function openDatabase(SQL) {
  fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
  if (fs.existsSync(dbFilePath)) {
    return new SQL.Database(fs.readFileSync(dbFilePath));
  }
  return new SQL.Database();
}

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      kind TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
}

function persistDatabase(db) {
  fs.writeFileSync(dbFilePath, Buffer.from(db.export()));
}

function readCollection(db, kind) {
  const stmt = db.prepare('SELECT data FROM collections WHERE kind = ?');
  try {
    const row = stmt.getAsObject([kind]);
    return row.data ? JSON.parse(row.data) : null;
  } finally {
    stmt.free();
  }
}

function readStoredDrafts(db) {
  const next = {};
  for (const kind of mutableKinds) {
    next[kind] = readCollection(db, kind);
  }
  return next;
}

function writeSourceFiles(drafts) {
  for (const kind of mutableKinds) {
    writeJsonFile(sourceFileMap[kind], drafts[kind] ?? []);
  }
}

function upsertCollections(db, drafts) {
  const now = Date.now();
  const insert = db.prepare('INSERT OR REPLACE INTO collections (kind, data, updatedAt) VALUES (?, ?, ?)');
  const deleteStatement = db.prepare('DELETE FROM collections WHERE kind = ?');
  try {
    db.exec('BEGIN');
    for (const kind of mutableKinds) {
      deleteStatement.run([kind]);
      insert.run([kind, JSON.stringify(drafts[kind] ?? []), now]);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    insert.free();
    deleteStatement.free();
  }
  persistDatabase(db);
  writeSourceFiles(drafts);
}

function seedDatabaseIfNeeded(db) {
  const countStmt = db.prepare('SELECT COUNT(*) AS count FROM collections');
  try {
    const row = countStmt.getAsObject();
    if ((row.count ?? 0) > 0) return;
    const seeded = toDraftsFromSource();
    upsertCollections(db, seeded);
  } finally {
    countStmt.free();
  }
}

export async function createContentStore() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
  });
  const db = openDatabase(SQL);
  ensureSchema(db);
  seedDatabaseIfNeeded(db);

  return {
    loadContent() {
      const dbDrafts = readStoredDrafts(db);
      const sourceDrafts = toDraftsFromSource();
      const merged = { updatedAt: Date.now() };
      for (const kind of mutableKinds) {
        merged[kind] = dbDrafts[kind] !== null ? dbDrafts[kind] : sourceDrafts[kind];
      }
      return ensureTravelRoutes(merged);
    },
    replaceContent(drafts) {
      const normalized = ensureTravelRoutes(drafts);
      upsertCollections(db, normalized);
      return {
        ...normalized,
        updatedAt: Date.now()
      };
    },
    resetContent() {
      const drafts = ensureTravelRoutes(toDraftsFromSource());
      upsertCollections(db, drafts);
      return {
        ...drafts,
        updatedAt: Date.now()
      };
    }
  };
}
