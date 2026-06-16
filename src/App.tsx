import { useEffect, useState } from 'react';
import {
  addItem,
  getAvailableAreas,
  getAvailableZones,
  getDiscoveredAreas,
  backgrounds,
  createEnemyStateWithContext,
  createNewGame,
  cropById,
  discoverArea,
  getArea,
  getBackground,
  getCrop,
  getEnemy,
  getEvent,
  getItem,
  getRealm,
  getRealmStartLocation,
  getZone,
  hasItems,
  homestead,
  itemCount,
  loadGame,
  newPlayer,
  realms,
  recipes,
  isAreaDiscovered,
  zones,
  removeItem,
  rollInt,
  normalizeGameState,
  saveGame,
  setRuntimeContent,
  totalDamage,
  totalDefense,
  enemyDamageRange,
  type AreaDef,
  type AreaActivityDef,
  type CombatState,
  type EventChoiceDef,
  type EventDef,
  type GameState,
  type InventoryEntry,
  type PlayerState,
  type Screen,
  type CropPlotState,
  type EventState,
  type RecipeDef,
  xpToNextLevel
} from './game';
import { AdminScreen } from './components/AdminScreen';
import { buildRuntimeContentFromDrafts } from './adminDrafts';
import { useAdminDrafts } from './useAdminDrafts';
import { useAppPathname } from './useAppPathname';
import { useThemeMode } from './useThemeMode';

const storageAreaSlots = ['plot-1', 'plot-2', 'shed-1', 'kitchen-1', 'empty-5', 'empty-6', 'empty-7', 'empty-8', 'empty-9'];
function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`;
}

function weightedPick<T extends { weight: number }>(entries: T[]) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1] ?? null;
}

function getAreaPool(area: NonNullable<ReturnType<typeof getArea>>) {
  if (area.enemyPool?.length) return area.enemyPool;
  return area.enemyIds.map((enemyId) => ({ enemyId, weight: 1 }));
}

function getDiscoveryMessage(area: NonNullable<ReturnType<typeof getArea>>) {
  if (area.revealText) return area.revealText;
  return `You discover ${area.name}.`;
}

function getReturnBandStatus(returnBand: GameState['returnBand']) {
  if (!returnBand.unlocked) {
    return { label: 'Return Band locked', ready: false, disabled: true };
  }
  const elapsed = Math.floor((Date.now() - returnBand.lastUsedAt) / 1000);
  const remaining = returnBand.cooldownSeconds - elapsed;
  if (remaining <= 0 || returnBand.lastUsedAt === 0) {
    return { label: 'Return Band ready', ready: true, disabled: false };
  }
  return {
    label: `Return Band recharging: ${formatDuration(remaining)}`,
    ready: false,
    disabled: true
  };
}

function formatInventoryEntry(entry: InventoryEntry) {
  const item = getItem(entry.itemId);
  const details = [item?.description].filter(Boolean);
  if (entry.maxDurability != null && entry.durability != null) {
    details.push(`Durability ${entry.durability}/${entry.maxDurability}`);
  }
  return {
    name: item?.name ?? entry.itemId,
    quantity: entry.quantity,
    type: item?.type ?? 'unknown',
    details
  };
}

function getRecipeMissingIngredients(recipe: RecipeDef, inventory: InventoryEntry[]) {
  return recipe.ingredients
    .map((ingredient) => {
      const available = itemCount(inventory, ingredient.itemId);
      return {
        ...ingredient,
        available,
        missing: Math.max(0, ingredient.quantity - available)
      };
    })
    .filter((ingredient) => ingredient.missing > 0);
}

function App() {
  const [state, setState] = useState<GameState>(() => {
    const loaded = loadGame() ?? createNewGame();
    return loaded.screen === 'admin' ? { ...loaded, screen: 'village' } : loaded;
  });
  const [nameDraft, setNameDraft] = useState('');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(backgrounds[0]?.id ?? 'farmer');
  const [craftingOrigin, setCraftingOrigin] = useState<'village' | 'character'>('village');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    drafts: adminDrafts,
    setDrafts: setAdminDrafts,
    resetDrafts: resetAdminDrafts,
    refreshDrafts: refreshAdminDrafts,
    syncState: adminSyncState,
    error: adminSyncError,
    contentStatusLabel: adminContentStatusLabel
  } = useAdminDrafts();
  const { navigate, isAdminRoute } = useAppPathname();
  const { theme, isDark, toggleTheme } = useThemeMode();
  const [, setClockTick] = useState(0);

  useEffect(() => {
    setRuntimeContent(buildRuntimeContentFromDrafts(adminDrafts));
    setState((current) => normalizeGameState(current));
  }, [adminDrafts]);

  useEffect(() => {
    if (state.player) saveGame(state);
  }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTick((value) => value + 1);
      setState((current) => {
        if (!current.player) return current;
        const next = updateCropTimers(current);
        if (next !== current) saveGame(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!state.player && state.screen !== 'character-creation') {
      setState((current) => ({ ...current, screen: 'character-creation' }));
    }
  }, [state.player, state.screen]);

  useEffect(() => {
    if (!isAdminRoute) return;
    if (state.screen === 'admin') {
      setState((current) => ({ ...current, screen: 'village' }));
    }
  }, [isAdminRoute, state.screen]);

  const player = state.player;
  const selectedRealm = getRealm(state.selectedRealmId) ?? realms[0] ?? null;
  const selectedZone =
    getZone(state.selectedZoneId) ??
    (selectedRealm ? getAvailableZones(selectedRealm.id)[0] : null) ??
    zones[0] ??
    null;
  const selectedArea =
    getArea(state.selectedAreaId) ??
    (selectedZone ? getArea(selectedZone.startingAreaId) ?? getAvailableAreas(selectedZone.id)[0] : null) ??
    null;
  const currentArea = player && selectedArea && isAreaDiscovered(player, selectedArea.id) ? selectedArea : null;
  const currentStatus = player
    ? {
        name: player.name,
        level: player.level,
        hp: `${player.hp}/${player.maxHp}`,
        mp: `${player.mp}/${player.maxMp}`
      }
    : null;

  const commit = (updater: (current: GameState) => GameState) => {
    setState((current) => {
      const next = updater(current);
      saveGame(next);
      return next;
    });
  };

  const startGame = () => {
    if (!nameDraft.trim()) return;
    commit((current) => ({
      ...current,
      player: newPlayer(nameDraft.trim(), selectedBackgroundId),
      returnBand: {
        ...current.returnBand,
        unlocked: true
      },
      screen: 'village',
      message: 'Welcome to the village.',
      pendingEvent: null,
      combat: null
    }));
  };

  const goVillage = () => commit((current) => ({ ...current, screen: 'village', message: 'Back in the village.' }));

  const goHomestead = () => commit((current) => ({ ...current, screen: 'homestead', message: 'You head to the homestead.' }));

  const goCharacter = () => commit((current) => ({ ...current, screen: 'character', message: 'Character sheet open.' }));

  const enterTower = () =>
    commit((current) => ({
      ...current,
      screen: 'tower',
      message: 'The Tower rises before you.',
      returnBand: {
        ...current.returnBand,
        unlocked: true
      }
    }));

  const selectRealm = (realmId: string) => {
    const realm = getRealm(realmId);
    if (!realm) return;
    const start = getRealmStartLocation(realm.id);
    const nextZone = start?.zone ?? getAvailableZones(realm.id)[0];
    const nextArea = start?.area ?? (nextZone ? getArea(nextZone.startingAreaId) ?? getAvailableAreas(nextZone.id)[0] ?? null : null);
    if (!nextZone || !nextArea) return;
    commit((current) => ({
      ...current,
      selectedRealmId: realmId,
      selectedZoneId: nextZone.id,
      selectedAreaId: nextArea.id,
      screen: 'zone-select',
      message: `Selected ${realm.name}.`
    }));
  };

  const selectZone = (zoneId: string) => {
    const zone = getZone(zoneId);
    if (!zone) return;
    const nextArea = getArea(zone.startingAreaId) ?? getAvailableAreas(zone.id)[0] ?? null;
    commit((current) => ({
      ...current,
      selectedRealmId: zone.realmId,
      selectedZoneId: zoneId,
      selectedAreaId: nextArea?.id ?? '',
      screen: 'area-select',
      message: `Selected ${zone.name}.`
    }));
  };

  const selectArea = (areaId: string) => {
    const area = getArea(areaId);
    if (!area) return;
    if (!state.player || !isAreaDiscovered(state.player, areaId)) return;
    const zone = getZone(area.zoneId);
    const realm = zone ? getRealm(zone.realmId) : undefined;
    commit((current) => ({
      ...current,
      selectedRealmId: realm?.id ?? current.selectedRealmId,
      selectedZoneId: zone?.id ?? current.selectedZoneId,
      selectedAreaId: areaId,
      player: current.player
        ? {
            ...current.player,
            location: {
              realmId: realm?.id ?? current.selectedRealmId,
              zoneId: zone?.id ?? current.selectedZoneId,
              areaId
            }
          }
        : current.player,
      screen: 'exploration',
      message: 'Exploring the area.'
      }));
  };

  const placePlayerInArea = (areaId: string, message: string) => {
    const area = getArea(areaId);
    if (!area || !state.player) return;
    const zone = getZone(area.zoneId);
    const realm = zone ? getRealm(zone.realmId) : undefined;
    commit((current) => {
      const nextPlayer = current.player
        ? discoverArea(current.player, area.id)
        : current.player;
      return {
        ...current,
        selectedRealmId: realm?.id ?? current.selectedRealmId,
        selectedZoneId: zone?.id ?? current.selectedZoneId,
        selectedAreaId: area.id,
        player: nextPlayer
          ? {
              ...nextPlayer,
              location: {
                realmId: realm?.id ?? current.selectedRealmId,
                zoneId: zone?.id ?? current.selectedZoneId,
                areaId: area.id
              }
            }
          : nextPlayer,
        screen: 'exploration',
        pendingEvent: null,
        combat: null,
        message
      };
    });
  };

  const beginCombat = (enemyId: string, returnAreaId: string, loot: InventoryEntry[] = []) => {
    commit((current) => ({
      ...current,
      combat: createEnemyStateWithContext(enemyId, { loot, returnAreaId }),
      screen: 'combat',
      message: 'An enemy closes in.'
    }));
  };

  const executeActivityAction = (activity: AreaActivityDef, areaId: string) => {
    if (!state.player) return false;
    const params = activity.params ?? {};
    const getText = (key: string, fallback = '') => {
      const value = params[key];
      return typeof value === 'string' ? value : fallback;
    };
    const getNumber = (key: string, fallback = 0) => {
      const value = params[key];
      return typeof value === 'number' ? value : fallback;
    };

    const nextMessage = (message: string) => {
      commit((current) => ({ ...current, message }));
    };

    const updatePlayer = (updater: (player: PlayerState) => PlayerState, message: string) => {
      commit((current) => ({
        ...current,
        player: current.player ? updater(current.player) : current.player,
        message
      }));
    };

    switch (activity.action) {
      case 'searchCamp': {
        const onceFlag = getText('onceFlag', 'verdantCampSearchCompleted');
        const text = getText('text', activity.message ?? 'You find something useful.');
        const repeatText = getText('repeatText', 'You search the camp again but find nothing useful.');
        const itemId = getText('itemId', '');
        const alreadyDone = !!state.player.scriptedFlags[onceFlag];
        if (alreadyDone) {
          nextMessage(repeatText);
          return true;
        }
        updatePlayer((player) => ({
          ...player,
          inventory: itemId && itemCount(player.inventory, itemId) <= 0 ? addItem(player.inventory, itemId, 1) : player.inventory,
          scriptedFlags: { ...player.scriptedFlags, [onceFlag]: true }
        }), text);
        return true;
      }
      case 'travel': {
        const destinationAreaId = activity.destinationAreaId ?? getText('destinationAreaId', '');
        if (!destinationAreaId) return false;
        const ambushEnemyId = getText('ambushEnemyId', 'wild_hog');
        const ambushChance = getNumber('ambushChance', 0.5);
        const lootItems = getText('dropItemIds', '')
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean);
        const loot = lootItems.map((itemId) => ({ itemId, quantity: 1 }));
        if (Math.random() < ambushChance) {
          beginCombat(ambushEnemyId, destinationAreaId, loot);
          return true;
        }
        placePlayerInArea(destinationAreaId, 'You travel on.');
        return true;
      }
      case 'returnToTower':
        commit((current) => ({
          ...current,
          screen: 'tower',
          pendingEvent: null,
          combat: null,
          message: 'You return to the Tower from the camp.'
        }));
        return true;
      case 'returnToCamp':
        placePlayerInArea('abandoned_campsite', 'You return to the camp.');
        return true;
      case 'harvestTree': {
        const requiredItemId = getText('requiredItemId', 'left_behind_axe');
        const successItemId = getText('successItemId', 'wood');
        const successChance = getNumber('successChance', 0.5);
        const durabilityBreakChance = getNumber('durabilityBreakChance', 0.2);
        const noToolMessage = getText('noToolMessage', 'You need something sharp enough to cut wood.');
        const breakMessage = getText('breakMessage', 'The tool breaks apart.');
        if (itemCount(state.player.inventory, requiredItemId) <= 0) {
          nextMessage(noToolMessage);
          return true;
        }
        let nextInventory = [...state.player.inventory];
        let message = 'You strip a little wood from the tree line.';
        if (Math.random() < successChance) {
          nextInventory = addItem(nextInventory, successItemId, 1);
          message = 'You cut down a small tree and collect wood.';
        }
        if (Math.random() < durabilityBreakChance) {
          nextInventory = nextInventory
            .map((entry) => {
              if (entry.itemId !== requiredItemId || entry.durability == null || entry.maxDurability == null) return entry;
              const durability = entry.durability - 1;
              if (durability <= 0) return null;
              return { ...entry, durability };
            })
            .filter((entry): entry is InventoryEntry => !!entry);
          if (!nextInventory.some((entry) => entry.itemId === requiredItemId)) {
            message = breakMessage;
          }
        }
        updatePlayer((player) => ({ ...player, inventory: nextInventory }), message);
        return true;
      }
      case 'searchWoods': {
        const enemyId = getText('enemyId', 'spider');
        const guaranteedDropItemId = getText('guaranteedDropItemId', 'spider_silk');
        const guaranteedDropQuantity = getNumber('guaranteedDropQuantity', 1);
        beginCombat(enemyId, areaId, [{ itemId: guaranteedDropItemId, quantity: guaranteedDropQuantity }]);
        return true;
      }
      case 'fish': {
        const requiredItemId = getText('requiredItemId', 'fishing_pole');
        const successItemId = getText('successItemId', 'fish');
        const successChance = getNumber('successChance', 0.5);
        const noToolMessage = getText('noToolMessage', 'You need a fishing pole before you can fish here.');
        const successMessage = getText('successMessage', 'You catch a fish.');
        const failMessage = getText('failMessage', 'Nothing bites.');
        if (itemCount(state.player.inventory, requiredItemId) <= 0) {
          nextMessage(noToolMessage);
          return true;
        }
        if (Math.random() < successChance) {
          updatePlayer((player) => ({ ...player, inventory: addItem(player.inventory, successItemId, 1) }), successMessage);
          return true;
        }
        nextMessage(failMessage);
        return true;
      }
      case 'grantItem': {
        const itemId = getText('itemId', '');
        if (!itemId) return false;
        const quantity = getNumber('quantity', 1);
        const message = getText('text', `You receive ${itemId}.`);
        updatePlayer((player) => ({ ...player, inventory: addItem(player.inventory, itemId, quantity) }), message);
        return true;
      }
      case 'message':
        nextMessage(activity.message ?? getText('text', activity.label));
        return true;
      case 'event': {
        const eventId = activity.eventId ?? getText('eventId', '');
        const event = getEvent(eventId);
        if (!event) return false;
        commit((current) => ({
          ...current,
          pendingEvent: { eventId: event.id, areaId },
          screen: 'event',
          message: activity.label
        }));
        return true;
      }
      case 'leave':
        commit((current) => ({ ...current, screen: 'area-select', message: `Leaving ${currentArea?.name ?? 'the area'}.` }));
        return true;
      default:
        return false;
    }
  };

  const exploreZone = () => {
    if (!state.player) return;
    const zone = selectedZone;
    const undiscoveredAreas = zone.areaIds.filter((areaId) => !state.player!.discoveredAreaIds.includes(areaId));
    if (!undiscoveredAreas.length) {
      commit((current) => ({
        ...current,
        message: 'You have discovered the major landmarks of this zone.'
      }));
      return;
    }

    const explorationChance = Math.min(0.85, 0.45 + (state.player.skills.exploration ?? 0) * 0.05);
    if (Math.random() > explorationChance) {
      commit((current) => ({
        ...current,
        message: 'You search the zone, but no new landmark stands out.'
      }));
      return;
    }

    const areaId = undiscoveredAreas[Math.floor(Math.random() * undiscoveredAreas.length)];
    const area = getArea(areaId);
    if (!area) return;

    commit((current) => {
      const nextPlayer = current.player ? discoverArea(current.player, area.id) : current.player;
      return {
        ...current,
        selectedAreaId: area.id,
        selectedRealmId: zone.realmId,
        player: nextPlayer
          ? {
              ...nextPlayer,
              location: {
                realmId: zone.realmId,
                zoneId: zone.id,
                areaId: area.id
              }
            }
          : nextPlayer,
        message: getDiscoveryMessage(area)
      };
    });
  };

  const runActivity = (activityId: string) => {
    const activity = currentArea?.activities?.find((entry) => entry.id === activityId);
    if (!activity) return;
    const area = currentArea;
    if (area && executeActivityAction(activity, area.id)) return;
    const encounterChance = area?.encounterChance ?? 0;
    const encounterPool = area ? getAreaPool(area) : [];
    if (activity.kind !== 'leave' && area && encounterPool.length > 0 && Math.random() < encounterChance) {
      const encounter = weightedPick(encounterPool);
      if (encounter?.enemyId) {
        beginCombat(encounter.enemyId, area.id);
        return;
      }
    }
    if (activity.kind === 'leave') {
      commit((current) => ({ ...current, screen: 'area-select', message: `Leaving ${currentArea?.name ?? 'the area'}.` }));
      return;
    }
    commit((current) => ({ ...current, message: activity.message ?? activity.label }));
  };

  const resolveEventChoice = (choice: EventChoiceDef) => {
    if (!state.player || !state.pendingEvent) return;
    const event = getEvent(state.pendingEvent.eventId);
    if (!event) return;
    if (choice.requirements?.items) {
      const missing = choice.requirements.items.some((required) => !hasItems(state.player!.inventory, required.itemId, required.quantity));
      if (missing) {
        commit((current) => ({ ...current, message: 'You do not have the required items.' }));
        return;
      }
    }
    const playerAfterCosts = choice.requirements?.items && choice.outcome.consumeItems
      ? choice.requirements.items.reduce(
          (inventory, required) => removeItem(inventory, required.itemId, required.quantity),
          state.player.inventory
        )
      : state.player.inventory;
    const rewardedInventory = choice.outcome.rewards.reduce(
      (inventory, reward) => addItem(inventory, reward.itemId, reward.quantity),
      playerAfterCosts
    );
    const nextPlayer = { ...state.player, inventory: rewardedInventory };
    if (choice.outcome.combat) {
      const pendingAreaId = state.pendingEvent.areaId;
      commit((current) => ({
        ...current,
        player: nextPlayer,
        combat: createEnemyStateWithContext(choice.outcome.combat!.enemyId, {
          returnAreaId: pendingAreaId
        }),
        screen: 'combat',
        pendingEvent: null,
        message: 'Combat begins.'
      }));
      return;
    }
    commit((current) => ({
      ...current,
      player: nextPlayer,
      pendingEvent: null,
      screen: 'exploration',
      message: choice.outcome.text
    }));
  };

  const combatAction = (action: 'attack' | 'defend' | 'run') => {
    if (!state.player || !state.combat) return;
    const enemy = getEnemy(state.combat.enemyId);
    if (!enemy) return;

    let player = { ...state.player };
    let combat = { ...state.combat };
    const log = [...combat.log];
    let playerGuard = false;
    let enemyGuard = false;

    const playerAttack = totalDamage(player) + rollInt(0, 2);
    const { min: enemyMin, max: enemyMax } = enemyDamageRange(enemy.id);
    const enemyAttack = rollInt(enemyMin, enemyMax);

    if (action === 'run') {
      if (Math.random() < 0.5) {
        placePlayerInArea(state.combat.returnAreaId ?? state.player.location.areaId, 'You escape back into the area.');
        return;
      } else {
        log.push('You fail to escape.');
        player.hp = Math.max(0, player.hp - Math.max(1, enemyAttack - totalDefense(player)));
      }
    } else if (action === 'defend') {
      playerGuard = true;
      log.push('You brace for impact.');
    } else {
      const damage = Math.max(1, playerAttack - enemy.stats.defense - (combat.enemyGuard ? 1 : 0));
      combat.enemyHp = Math.max(0, combat.enemyHp - damage);
      log.push(`You strike for ${damage}.`);
    }

    if (combat.enemyHp > 0) {
      const enemyDamage = Math.max(1, enemyAttack - totalDefense(player) - (playerGuard ? 2 : 0));
      player.hp = Math.max(0, player.hp - enemyDamage);
      log.push(`${enemy.name} hits for ${enemyDamage}.`);
    }

    if (combat.enemyHp <= 0) {
      const loot = [...combat.loot, ...rollLoot(enemy)];
      const totalLoot = loot.reduce((inventory, entry) => addItem(inventory, entry.itemId, entry.quantity), player.inventory);
      player.inventory = totalLoot;
      player.xp += 8 + enemy.level * 4;
      levelUpPlayer(player);
      const returnAreaId = combat.returnAreaId ?? player.location.areaId;
      const returnArea = getArea(returnAreaId);
      const returnZone = returnArea ? getZone(returnArea.zoneId) : null;
      const returnRealm = returnZone ? getRealm(returnZone.realmId) : null;
      const nextPlayer = discoverArea(
        {
          ...player,
          location: {
            realmId: returnRealm?.id ?? state.selectedRealmId,
            zoneId: returnZone?.id ?? state.selectedZoneId,
            areaId: returnAreaId
          }
        },
        returnAreaId
      );
      commit((current) => ({
        ...current,
        player: nextPlayer,
        selectedAreaId: returnAreaId,
        selectedZoneId: returnZone?.id ?? current.selectedZoneId,
        selectedRealmId: returnRealm?.id ?? current.selectedRealmId,
        combat: null,
        pendingEvent: null,
        screen: 'exploration',
        message: `${enemy.name} falls.`
      }));
      return;
    }

    if (player.hp <= 0) {
      commit((current) => ({
        ...current,
        player: { ...player, hp: 1 },
        combat: null,
        screen: 'village',
        message: 'The Tower rejects you.'
      }));
      return;
    }

    combat = { ...combat, log, playerGuard, enemyGuard };
    commit((current) => ({ ...current, player, combat }));
  };

  const equipItem = (itemId: string) => {
    if (!state.player) return;
    const item = getItem(itemId);
    if (!item) return;
    if (item.type !== 'weapon' && item.type !== 'armor') {
      commit((current) => ({ ...current, message: 'That item cannot be equipped.' }));
      return;
    }
    const next = { ...state.player, equipment: { ...state.player.equipment } };
    if (item.type === 'weapon') next.equipment.weaponId = itemId;
    if (item.type === 'armor') next.equipment.armorId = itemId;
    commit((current) => ({ ...current, player: next, message: `${item.name} equipped.` }));
  };

  const plantSeed = (slotIndex: number, cropId: string) => {
    if (!state.player) return;
    const crop = cropById.get(cropId);
    if (!crop) return;
    const seedCount = itemCount(state.player.inventory, crop.seedItemId);
    if (seedCount <= 0) return;
    const readyAt = Date.now() + crop.growthCycles * 60 * 1000;
    const quantity = rollInt(crop.harvestQuantity.min, crop.harvestQuantity.max);
    const plots = [...state.player.homestead.plots];
    plots[slotIndex] = {
      slotId: plots[slotIndex]?.slotId ?? `plot-${slotIndex + 1}`,
      cropId: crop.id,
      plantedAt: Date.now(),
      readyAt,
      quantity
    };
    commit((current) => ({
      ...current,
      player: {
        ...state.player!,
        inventory: removeItem(state.player!.inventory, crop.seedItemId, 1),
        homestead: { plots }
      },
      message: `Planted ${crop.name}.`
    }));
  };

  const harvestPlot = (slotIndex: number) => {
    if (!state.player) return;
    const plot = state.player.homestead.plots[slotIndex];
    if (!plot?.cropId || !plot.readyAt || Date.now() < plot.readyAt) return;
    const crop = getCrop(plot.cropId);
    if (!crop) return;
    const plots = [...state.player.homestead.plots];
    plots[slotIndex] = { ...plot, cropId: null, plantedAt: null, readyAt: null, quantity: 0 };
    commit((current) => ({
      ...current,
      player: {
        ...state.player!,
        inventory: addItem(state.player!.inventory, crop.harvestItemId, plot.quantity || 1),
        homestead: { plots }
      },
      message: `Harvested ${crop.name}.`
    }));
  };

  const openCrafting = (origin: 'village' | 'character') => {
    setCraftingOrigin(origin);
    commit((current) => ({
      ...current,
      screen: 'crafting',
      message: 'Crafting menu open.'
    }));
  };

  const closeCrafting = () => {
    commit((current) => ({
      ...current,
      screen: craftingOrigin,
      message: craftingOrigin === 'character' ? 'Character sheet open.' : 'Back in the village.'
    }));
  };

  const craftRecipe = (recipeId: string) => {
    if (!state.player) return;
    const recipe = recipes.find((entry) => entry.id === recipeId);
    if (!recipe) return;
    if (state.player.level < recipe.requiredLevel) {
      commit((current) => ({ ...current, message: `You need to be level ${recipe.requiredLevel} to craft this.` }));
      return;
    }
    if (recipe.ingredients.some((ingredient) => !hasItems(state.player!.inventory, ingredient.itemId, ingredient.quantity))) {
      commit((current) => ({ ...current, message: 'You lack the required ingredients.' }));
      return;
    }
    const nextInventory = recipe.ingredients.reduce(
      (inventory, ingredient) => removeItem(inventory, ingredient.itemId, ingredient.quantity),
      state.player.inventory
    );
    const craftedInventory = addItem(nextInventory, recipe.output.itemId, recipe.output.quantity);
    commit((current) => ({
      ...current,
      player: {
        ...state.player!,
        inventory: craftedInventory
      },
      message: `Crafted ${getItem(recipe.output.itemId)?.name ?? recipe.output.itemId}.`
    }));
  };

  const resetGame = () => {
    localStorage.removeItem('tower-rpg-save-v1');
    setNameDraft('');
    setSelectedBackgroundId(backgrounds[0]?.id ?? 'farmer');
    setState(createNewGame());
  };

  const goToTower = () => commit((current) => ({ ...current, screen: 'tower' }));
  const goToZoneSelect = () => commit((current) => ({ ...current, screen: 'zone-select' }));
  const goToAreaSelect = () => commit((current) => ({ ...current, screen: 'area-select' }));
  const returnBandStatus = getReturnBandStatus(state.returnBand);
  const useReturnBand = () => {
    if (!state.player || !returnBandStatus.ready) return;
    commit((current) => ({
      ...current,
      screen: 'tower',
      combat: null,
      pendingEvent: null,
      message: 'The Return Band pulls you back to the Tower.',
      returnBand: {
        ...current.returnBand,
        unlocked: true,
        lastUsedAt: Date.now()
      }
    }));
  };

  const screen = state.screen;
  const showAdminRoute = isAdminRoute;
  const goGameHome = () => navigate('/');
  const goSettings = () => setSettingsOpen((current) => !current);

  return (
    <div className={showAdminRoute ? 'app-shell admin-app-shell' : 'app-shell'}>
      {showAdminRoute ? (
        <main className="admin-route-shell">
          <AdminScreen
            drafts={adminDrafts}
            onChange={setAdminDrafts}
            onReset={resetAdminDrafts}
            onReload={refreshAdminDrafts}
            onBack={goGameHome}
            themeMode={theme}
            onToggleTheme={toggleTheme}
            syncState={adminSyncState}
            syncError={adminSyncError}
            contentStatusLabel={adminContentStatusLabel}
          />
        </main>
      ) : (
        <>
          <header className="topbar">
            <div className="topbar-title">
              <div className="eyebrow">The Tower</div>
              <h1>Verdant Expanse</h1>
            </div>
            <div className="topbar-status">
              <div className="topbar-character">
                <strong>{currentStatus?.name ?? 'No character'}</strong>
                <div className="muted">
                  Level {currentStatus?.level ?? 0} · HP {currentStatus?.hp ?? '--'} · MP {currentStatus?.mp ?? '--'}
                </div>
              </div>
              <div className="topbar-actions">
                <span className={state.player ? 'login-pill online' : 'login-pill'}>
                  {state.player ? 'Logged In' : 'Guest'}
                </span>
                <div className="settings-wrap">
                  <button className="ghost compact settings-button" onClick={goSettings} aria-expanded={settingsOpen}>
                    <span className="eyebrow">Settings</span>
                    <strong>{settingsOpen ? 'Open' : 'Menu'}</strong>
                  </button>
                  {settingsOpen && (
                    <div className="settings-menu card">
                      <button className="ghost" onClick={() => { toggleTheme(); setSettingsOpen(false); }} aria-pressed={isDark}>
                        {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                      </button>
                      <button className="ghost" onClick={() => { useReturnBand(); setSettingsOpen(false); }} disabled={returnBandStatus.disabled || !state.player}>
                        Return Band
                      </button>
                      <button className="ghost" onClick={() => { resetGame(); setSettingsOpen(false); }}>Reset Game</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="panel">
            <StatusBar player={state.player} message={state.message} />

            {screen === 'character-creation' && (
              <CharacterCreation
                nameDraft={nameDraft}
                setNameDraft={setNameDraft}
                backgrounds={backgrounds}
                selectedBackgroundId={selectedBackgroundId}
                setSelectedBackgroundId={setSelectedBackgroundId}
                onStart={startGame}
              />
            )}

            {screen === 'village' && (
            <VillageScreen
              onEnterTower={enterTower}
              onHomestead={goHomestead}
              onCharacter={goCharacter}
              onCrafting={() => openCrafting('village')}
            />
            )}

            {screen === 'tower' && (
              <TowerScreen realms={realms} onSelectRealm={selectRealm} onBack={goVillage} />
            )}

            {screen === 'zone-select' && selectedRealm && (
              <ZoneSelectScreen
                realm={selectedRealm}
                zones={getAvailableZones(selectedRealm.id)}
                onSelectZone={selectZone}
                onBack={() => commit((current) => ({ ...current, screen: 'tower' }))}
              />
            )}

            {screen === 'area-select' && selectedZone && (
              <AreaSelectScreen
                zone={selectedZone}
                player={state.player}
                onSelectArea={selectArea}
                onExploreZone={exploreZone}
                onBack={() => commit((current) => ({ ...current, screen: 'zone-select' }))}
              />
            )}

            {screen === 'exploration' && currentArea && (
        <ExplorationScreen
            area={currentArea}
            activities={currentArea.activities ?? []}
            onRunActivity={runActivity}
            onBack={() => commit((current) => ({ ...current, screen: 'area-select' }))}
          />
            )}

            {screen === 'event' && state.pendingEvent && currentArea && (
              <EventScreen
                event={getEvent(state.pendingEvent.eventId)!}
                onChoice={resolveEventChoice}
                onBack={() => commit((current) => ({ ...current, screen: 'exploration', pendingEvent: null }))}
              />
            )}

            {screen === 'combat' && state.combat && state.player && (
              <CombatScreen
                player={state.player}
                combat={state.combat}
                enemy={getEnemy(state.combat.enemyId)!}
                onAction={combatAction}
              />
            )}

            {screen === 'crafting' && state.player && (
              <CraftingScreen
                player={state.player}
                onCraft={craftRecipe}
                onBack={closeCrafting}
              />
            )}

            {screen === 'homestead' && state.player && (
              <HomesteadScreen
                player={state.player}
                onBack={goVillage}
                onPlant={plantSeed}
                onHarvest={harvestPlot}
              />
            )}

            {screen === 'character' && state.player && (
              <CharacterScreen
                player={state.player}
                onBack={goVillage}
                onCrafting={() => openCrafting('character')}
                onEquip={equipItem}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

function StatusBar({ player, message }: { player: PlayerState | null; message: string }) {
  return (
    <section className="status">
      <div>{player ? `${player.name} · HP ${player.hp}/${player.maxHp} · XP ${player.xp}` : 'No character created yet'}</div>
      <div className="muted">{message}</div>
    </section>
  );
}

function CharacterCreation(props: {
  nameDraft: string;
  setNameDraft: (value: string) => void;
  backgrounds: typeof backgrounds;
  selectedBackgroundId: string;
  setSelectedBackgroundId: (value: string) => void;
  onStart: () => void;
}) {
  return (
    <section className="stack">
      <h2>Character Creation</h2>
      <label className="field">
        <span>Name</span>
        <input value={props.nameDraft} onChange={(e) => props.setNameDraft(e.target.value)} placeholder="Your name" />
      </label>
      <div className="stack">
        <div className="label-row">
          <span>Background</span>
        </div>
        {props.backgrounds.map((background) => (
          <button
            key={background.id}
            className={background.id === props.selectedBackgroundId ? 'card selected' : 'card'}
            onClick={() => props.setSelectedBackgroundId(background.id)}
          >
            <strong>{background.name}</strong>
            <div className="muted">{background.description}</div>
            <div className="chips">
              {Object.entries(background.bonuses).map(([skill, value]) => (
                <span key={skill} className="chip">
                  {skill} +{value}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      <button className="primary" onClick={props.onStart} disabled={!props.nameDraft.trim()}>
        Start
      </button>
    </section>
  );
}

function VillageScreen(props: {
  onEnterTower: () => void;
  onHomestead: () => void;
  onCharacter: () => void;
  onCrafting: () => void;
}) {
  return (
    <section className="stack">
      <h2>Village</h2>
      <button className="primary" onClick={props.onEnterTower}>Enter Tower</button>
      <button className="secondary" onClick={props.onCrafting}>Crafting</button>
      <button className="secondary" onClick={props.onHomestead}>Homestead</button>
      <button className="secondary" onClick={props.onCharacter}>Character</button>
    </section>
  );
}

function TowerScreen(props: { realms: typeof realms; onSelectRealm: (id: string) => void; onBack: () => void }) {
  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Realm Select</span>
        <h2>Tower</h2>
      </div>
      {props.realms.map((realm) => (
        <button key={realm.id} className="card" onClick={() => props.onSelectRealm(realm.id)}>
          <span className="eyebrow">Realm</span>
          <strong>{realm.name}</strong>
          <div className="muted">{realm.description}</div>
        </button>
      ))}
      <button className="ghost" onClick={props.onBack}>Back</button>
    </section>
  );
}

function ZoneSelectScreen(props: {
  realm: typeof realms[number];
  zones: NonNullable<ReturnType<typeof getAvailableZones>>;
  onSelectZone: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Zone Select</span>
        <h2>{props.realm.name}</h2>
      </div>
      <div className="card">
        <strong>{props.realm.name}</strong>
        <div className="muted">{props.realm.description}</div>
      </div>
      {props.zones.map((zone) => (
        <button key={zone.id} className="card" onClick={() => props.onSelectZone(zone.id)}>
          <span className="eyebrow">Zone</span>
          <strong>{zone.name}</strong>
          <div className="muted">{zone.description}</div>
        </button>
      ))}
      <button className="ghost" onClick={props.onBack}>Back</button>
    </section>
  );
}

function AreaSelectScreen(props: {
  zone: NonNullable<ReturnType<typeof getZone>>;
  player: PlayerState | null;
  onSelectArea: (id: string) => void;
  onExploreZone: () => void;
  onBack: () => void;
}) {
  const discoveredAreas = getDiscoveredAreas(props.player, props.zone.id);
  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Zone</span>
        <h2>{props.zone.name}</h2>
      </div>
      <div className="card">
        <strong>{props.zone.name}</strong>
        <div className="muted">{props.zone.description}</div>
      </div>
      <button className="primary" onClick={props.onExploreZone}>Explore Zone</button>
      <div className="stack">
        <div className="label-row">
          <span>Discovered Areas</span>
        </div>
        {discoveredAreas.length > 0 ? (
          discoveredAreas.map((area) => (
            <button key={area.id} className="card" onClick={() => props.onSelectArea(area.id)}>
              <strong>{area.name}</strong>
              <div className="muted">{area.description}</div>
            </button>
          ))
        ) : (
          <div className="card">
            <strong>No landmarks discovered yet</strong>
            <div className="muted">Explore the zone to reveal places to visit.</div>
          </div>
        )}
      </div>
      <button className="ghost" onClick={props.onBack}>Back</button>
    </section>
  );
}

function ExplorationScreen(props: {
  area: AreaDef;
  activities: AreaActivityDef[];
  onRunActivity: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Area</span>
        <h2>{props.area.name}</h2>
      </div>
      <p className="muted">{props.area.description}</p>
      <div className="stack">
        <div className="label-row"><span>Activities</span></div>
        {props.activities.map((activity) => (
          <button key={activity.id} className="secondary" onClick={() => props.onRunActivity(activity.id)}>
            {activity.label}
          </button>
        ))}
      </div>
      <button className="ghost" onClick={props.onBack}>Back</button>
    </section>
  );
}

function EventScreen(props: { event: EventDef; onChoice: (choice: EventChoiceDef) => void; onBack: () => void }) {
  return (
    <section className="stack">
      <h2>{props.event.name}</h2>
      <p className="muted">{props.event.description}</p>
      {props.event.choices.map((choice) => (
        <button key={choice.id} className="card" onClick={() => props.onChoice(choice)}>
          <strong>{choice.text}</strong>
          <div className="muted">{choice.outcome.text}</div>
        </button>
      ))}
      <button className="ghost" onClick={props.onBack}>Back</button>
    </section>
  );
}

function CombatScreen(props: {
  player: PlayerState;
  combat: CombatState;
  enemy: NonNullable<ReturnType<typeof getEnemy>>;
  onAction: (action: 'attack' | 'defend' | 'run') => void;
}) {
  return (
    <section className="stack">
      <h2>Combat</h2>
      <div className="card">
        <strong>{props.enemy.name}</strong>
        <div className="muted">HP {props.combat.enemyHp}/{props.combat.enemyMaxHp}</div>
      </div>
      <div className="card">
        <strong>{props.player.name}</strong>
        <div className="muted">HP {props.player.hp}/{props.player.maxHp}</div>
      </div>
      <button className="primary" onClick={() => props.onAction('attack')}>Attack</button>
      <button className="secondary" onClick={() => props.onAction('defend')}>Defend</button>
      <button className="ghost" onClick={() => props.onAction('run')}>Run</button>
      <div className="card log">
        {props.combat.log.slice(-5).map((entry, index) => (
          <div key={`${entry}-${index}`}>{entry}</div>
        ))}
      </div>
    </section>
  );
}

function HomesteadScreen(props: {
  player: PlayerState;
  onBack: () => void;
  onPlant: (slotIndex: number, cropId: string) => void;
  onHarvest: (slotIndex: number) => void;
}) {
  const cropSeeds = props.player.inventory
    .filter((entry) => getItem(entry.itemId)?.type === 'seed')
    .flatMap((entry) => Array.from({ length: entry.quantity }, () => entry.itemId));

  return (
    <section className="stack">
      <h2>Homestead</h2>
      <div className="grid3">
        {storageAreaSlots.map((slotId, index) => {
          if (index < 2) {
            const plot = props.player.homestead.plots[index];
            const crop = plot?.cropId ? getCrop(plot.cropId) : null;
            const ready = !!plot?.readyAt && Date.now() >= plot.readyAt;
            return (
              <div key={slotId} className="card plot">
                <strong>{crop?.name ?? `Crop Plot ${index + 1}`}</strong>
                <div className="muted">
                  {crop ? (ready ? 'Ready to harvest' : 'Growing') : 'Empty'}
                </div>
                {!crop && cropSeeds.map((seedId) => {
                  const seed = getItem(seedId);
                  const cropId = seed?.cropId;
                  if (!cropId) return null;
                  return (
                    <button key={seedId} className="secondary compact" onClick={() => props.onPlant(index, cropId)}>
                      Plant {cropById.get(cropId)?.name ?? cropId}
                    </button>
                  );
                })}
                {crop && ready && <button className="primary compact" onClick={() => props.onHarvest(index)}>Harvest</button>}
              </div>
            );
          }
          if (index === 2) {
            return <div key={slotId} className="card plot"><strong>Shed</strong><div className="muted">Storage and materials</div></div>;
          }
          if (index === 3) {
            return <div key={slotId} className="card plot"><strong>Kitchen</strong><div className="muted">Cooking and preparation</div></div>;
          }
          return <div key={slotId} className="card plot empty"><strong>Empty</strong></div>;
        })}
      </div>
      <button className="ghost" onClick={props.onBack}>Back</button>
    </section>
  );
}

function CharacterScreen(props: {
  player: PlayerState;
  onBack: () => void;
  onCrafting: () => void;
  onEquip: (itemId: string) => void;
}) {
  const background = getBackground(props.player.backgroundId);
  return (
    <section className="stack">
      <h2>Character</h2>
      <div className="card">
        <strong>{props.player.name}</strong>
        <div className="muted">{background?.name ?? props.player.backgroundId}</div>
        <div className="muted">HP {props.player.hp}/{props.player.maxHp}</div>
        <div className="muted">XP {props.player.xp} / {xpToNextLevel(props.player.level)}</div>
      </div>
      <div className="card">
        <strong>Skills</strong>
        <div className="chips">
          {Object.entries(props.player.skills).map(([skill, value]) => (
            <span key={skill} className="chip">{skill} {value}</span>
          ))}
        </div>
      </div>
      <div className="card">
        <strong>Equipment</strong>
        <div className="muted">Weapon: {props.player.equipment.weaponId ? getItem(props.player.equipment.weaponId)?.name : 'None'}</div>
        <div className="muted">Armor: {props.player.equipment.armorId ? getItem(props.player.equipment.armorId)?.name : 'None'}</div>
      </div>
      <button className="secondary" onClick={props.onCrafting}>Crafting</button>
      <div className="stack">
        <strong>Inventory</strong>
        {props.player.inventory.map((entry) => {
          const item = formatInventoryEntry(entry);
          return (
            <button key={entry.itemId} className="card" onClick={() => props.onEquip(entry.itemId)}>
              <strong>{item.name}</strong>
              <div className="muted">x{item.quantity} · {item.type}</div>
              {item.details.map((detail) => (
                <div key={detail} className="muted">{detail}</div>
              ))}
            </button>
          );
        })}
      </div>
      <button className="ghost" onClick={props.onBack}>Back</button>
    </section>
  );
}

function CraftingScreen(props: {
  player: PlayerState;
  onCraft: (recipeId: string) => void;
  onBack: () => void;
}) {
  return (
    <section className="stack">
      <h2>Crafting</h2>
      {recipes.map((recipe) => {
        const missing = getRecipeMissingIngredients(recipe, props.player.inventory);
        const canCraft = missing.length === 0 && props.player.level >= recipe.requiredLevel;
        return (
          <button key={recipe.id} className="card" onClick={() => props.onCraft(recipe.id)} disabled={!canCraft}>
            <strong>{recipe.name}</strong>
            <div className="muted">Produces {recipe.output.itemId} x{recipe.output.quantity}</div>
            <div className="muted">Requires level {recipe.requiredLevel}</div>
            <div className="muted">
              Requires {recipe.ingredients.map((ingredient) => `${ingredient.itemId} x${ingredient.quantity}`).join(', ')}
            </div>
            {missing.length > 0 ? (
              <div className="muted">
                Missing {missing.map((ingredient) => `${ingredient.itemId} x${ingredient.missing}`).join(', ')}
              </div>
            ) : (
              <div className="muted">Ready to craft</div>
            )}
          </button>
        );
      })}
      <button className="ghost" onClick={props.onBack}>Back</button>
    </section>
  );
}

function rollLoot(enemy: NonNullable<ReturnType<typeof getEnemy>>) {
  const guaranteed = enemy.guaranteedDrops ?? [];
  return [
    ...guaranteed,
    ...enemy.loot.flatMap((drop) => {
    if (Math.random() > drop.chance) return [];
    return [
      {
        itemId: drop.itemId,
        quantity: rollInt(drop.minQuantity, drop.maxQuantity)
      }
    ];
  })
  ];
}

function levelUpPlayer(player: PlayerState) {
  while (player.xp >= xpToNextLevel(player.level)) {
    player.xp -= xpToNextLevel(player.level);
    player.level += 1;
    player.maxHp += 4;
    player.hp = player.maxHp;
  }
}

function updateCropTimers(state: GameState) {
  if (!state.player) return state;
  const plots = state.player.homestead.plots;
  let changed = false;
  const nextPlots = plots.map((plot) => {
    if (!plot.cropId || !plot.readyAt) return plot;
    if (Date.now() < plot.readyAt) return plot;
    if (plot.quantity <= 0) return plot;
    return { ...plot };
  });
  changed = JSON.stringify(nextPlots) !== JSON.stringify(plots);
  if (!changed) return state;
  return {
    ...state,
    player: {
      ...state.player,
      homestead: { plots: nextPlots }
    }
  };
}

export default App;
