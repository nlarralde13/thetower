import { useEffect, useState } from 'react';
import {
  addItem,
  areaById,
  getAvailableZones,
  getDiscoveredAreas,
  backgrounds,
  createEnemyState,
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
  getZone,
  hasItems,
  homestead,
  itemCount,
  loadGame,
  newPlayer,
  realms,
  isAreaDiscovered,
  zones,
  removeItem,
  rollInt,
  saveGame,
  totalDamage,
  totalDefense,
  enemyDamageRange,
  type AreaDef,
  type CombatState,
  type EventChoiceDef,
  type EventDef,
  type GameState,
  type InventoryEntry,
  type PlayerState,
  type Screen,
  type CropPlotState,
  type EventState,
  xpToNextLevel
} from './game';

type AreaActivity = {
  id: string;
  label: string;
  kind: 'message' | 'event' | 'leave';
  message?: string;
  eventId?: string;
};

const activitiesByArea: Record<string, AreaActivity[]> = {
  quiet_pond: [
    { id: 'fish', label: 'Fish', kind: 'message', message: 'You cast a line into the still water.' },
    { id: 'search_shore', label: 'Search Shore', kind: 'message', message: 'The shore is lined with smooth stones and reeds.' },
    { id: 'gather_reeds', label: 'Gather Reeds', kind: 'message', message: 'You gather a small bundle of reeds.' },
    { id: 'leave', label: 'Leave', kind: 'leave' }
  ],
  cluster_of_trees: [
    { id: 'gather_wood', label: 'Gather Wood', kind: 'message', message: 'You collect a few dry branches.' },
    { id: 'explore', label: 'Explore', kind: 'message', message: 'The trees rustle, but nothing steps out.' },
    { id: 'rest', label: 'Rest', kind: 'message', message: 'You take a short rest in the shade.' },
    { id: 'leave', label: 'Leave', kind: 'leave' }
  ],
  field_of_grain: [
    { id: 'harvest', label: 'Harvest Grain', kind: 'message', message: 'You cut a handful of grain for later.' },
    { id: 'search', label: 'Search Field', kind: 'message', message: 'You comb the stalks for anything unusual.' },
    { id: 'explore', label: 'Explore', kind: 'message', message: 'The tall grain shifts around you.' },
    { id: 'leave', label: 'Leave', kind: 'leave' }
  ],
  abandoned_campsite: [
    { id: 'search_camp', label: 'Search Camp', kind: 'message', message: 'The campsite is long empty, but not untouched.' },
    { id: 'rest', label: 'Rest', kind: 'message', message: 'You rest beside the old fire ring.' },
    { id: 'explore', label: 'Explore', kind: 'message', message: 'You circle the camp and check its edges.' },
    { id: 'leave', label: 'Leave', kind: 'leave' }
  ],
  broken_wagon: [
    { id: 'search_wagon', label: 'Search Wagon', kind: 'event', eventId: 'roadside_wagon' },
    { id: 'investigate_tracks', label: 'Investigate Tracks', kind: 'message', message: 'Fresh tracks trail off into the grass.' },
    { id: 'explore', label: 'Explore', kind: 'message', message: 'Splintered boards creak underfoot.' },
    { id: 'leave', label: 'Leave', kind: 'leave' }
  ],
  whispering_gardens: [
    { id: 'listen', label: 'Listen Among the Blooms', kind: 'event', eventId: 'garden_whispers' },
    { id: 'search', label: 'Search the Terraces', kind: 'message', message: 'You inspect the garden terraces for clues.' },
    { id: 'leave', label: 'Leave', kind: 'leave' }
  ],
  deep_woods: [
    { id: 'track', label: 'Track the Old Paths', kind: 'event', eventId: 'lost_ranger_cache' },
    { id: 'forage', label: 'Forage Under the Canopy', kind: 'message', message: 'You gather bark, leaves, and dry twigs.' },
    { id: 'leave', label: 'Leave', kind: 'leave' }
  ]
};

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

function App() {
  const [state, setState] = useState<GameState>(() => loadGame() ?? createNewGame());
  const [nameDraft, setNameDraft] = useState('');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(backgrounds[0]?.id ?? 'farmer');
  const [, setClockTick] = useState(0);

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

  const player = state.player;
  const selectedRealm = getRealm(state.selectedRealmId) ?? realms[0];
  const selectedZone = getZone(state.selectedZoneId) ?? getAvailableZones(selectedRealm.id)[0] ?? zones[0];
  const selectedArea = getArea(state.selectedAreaId) ?? areaById.get(selectedZone.startingAreaId) ?? null;
  const currentArea = player && selectedArea && isAreaDiscovered(player, selectedArea.id) ? selectedArea : null;

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
    const nextZoneId = realm.startingZoneId;
    const nextZone = getZone(nextZoneId) ?? getAvailableZones(realm.id)[0];
    if (!nextZone) return;
    commit((current) => ({
      ...current,
      selectedRealmId: realmId,
      selectedZoneId: nextZone.id,
      selectedAreaId: nextZone.startingAreaId,
      screen: 'zone-select',
      message: `Selected ${realm.name}.`
    }));
  };

  const selectZone = (zoneId: string) => {
    const zone = getZone(zoneId);
    if (!zone) return;
    commit((current) => ({
      ...current,
      selectedRealmId: zone.realmId,
      selectedZoneId: zoneId,
      selectedAreaId: zone.startingAreaId,
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
    const activity = activitiesByArea[currentArea?.id ?? '']?.find((entry) => entry.id === activityId);
    if (!activity) return;
    const area = currentArea;
    const encounterChance = area?.encounterChance ?? 0;
    const encounterPool = area ? getAreaPool(area) : [];
    if (activity.kind !== 'leave' && area && encounterPool.length > 0 && Math.random() < encounterChance) {
      const encounter = weightedPick(encounterPool);
      if (encounter?.enemyId) {
        startCombat(encounter.enemyId);
        return;
      }
    }
    if (activity.kind === 'leave') {
      commit((current) => ({ ...current, screen: 'area-select', message: `Leaving ${currentArea?.name ?? 'the area'}.` }));
      return;
    }
    if (activity.kind === 'event' && activity.eventId) {
      const event = getEvent(activity.eventId);
      if (!event) return;
      commit((current) => ({
        ...current,
        pendingEvent: { eventId: event.id, areaId: currentArea!.id },
        screen: 'event',
        message: activity.label
      }));
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
      commit((current) => ({
        ...current,
        player: nextPlayer,
        combat: createEnemyState(choice.outcome.combat!.enemyId),
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

  const startCombat = (enemyId: string) => {
    commit((current) => ({
      ...current,
      combat: createEnemyState(enemyId),
      screen: 'combat',
      message: 'An enemy closes in.'
    }));
  };

  const returnToExploration = (nextState: Partial<GameState> & { message: string }) => {
    commit((current) => ({
      ...current,
      ...nextState,
      combat: null,
      pendingEvent: null,
      screen: 'exploration'
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
        returnToExploration({ message: 'You escape back into the area.' });
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
      const loot = rollLoot(enemy);
      const totalLoot = loot.reduce((inventory, entry) => addItem(inventory, entry.itemId, entry.quantity), player.inventory);
      player.inventory = totalLoot;
      player.xp += 8 + enemy.level * 4;
      levelUpPlayer(player);
      returnToExploration({ player, message: `${enemy.name} falls.` });
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title">
          <div className="eyebrow">The Tower</div>
          <h1>Verdant Expanse</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost compact" onClick={useReturnBand} disabled={returnBandStatus.disabled || !state.player}>
            <span className="eyebrow">Return Band</span>
            <strong>{returnBandStatus.label}</strong>
          </button>
          <button className="ghost" onClick={resetGame}>Reset</button>
        </div>
      </header>

      <main className="panel">
        <StatusBar player={state.player} message={state.message} />
        <Breadcrumbs
          realm={selectedRealm}
          zone={selectedZone}
          area={currentArea}
          onRealmClick={goToTower}
          onZoneClick={goToZoneSelect}
          onAreaClick={goToAreaSelect}
        />

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
          <VillageScreen onEnterTower={enterTower} onHomestead={goHomestead} onCharacter={goCharacter} />
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
            activities={activitiesByArea[currentArea.id] ?? []}
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

        {screen === 'homestead' && state.player && (
          <HomesteadScreen
            player={state.player}
            onBack={goVillage}
            onPlant={plantSeed}
            onHarvest={harvestPlot}
          />
        )}

        {screen === 'character' && state.player && (
          <CharacterScreen player={state.player} onBack={goVillage} onEquip={equipItem} />
        )}
      </main>
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

function Breadcrumbs(props: {
  realm: typeof realms[number];
  zone: NonNullable<ReturnType<typeof getZone>>;
  area: AreaDef | null;
  onRealmClick: () => void;
  onZoneClick: () => void;
  onAreaClick: () => void;
}) {
  return (
    <section className="breadcrumb-card" aria-label="Location breadcrumb">
      <div className="breadcrumb-trail">
        <button className="breadcrumb-link" onClick={props.onRealmClick}>{props.realm.name}</button>
        <span className="breadcrumb-separator">›</span>
        <button className="breadcrumb-link" onClick={props.onZoneClick}>{props.zone.name}</button>
        <span className="breadcrumb-separator">›</span>
        <button className="breadcrumb-link" onClick={props.onAreaClick} disabled={!props.area}>
          {props.area?.name ?? 'Undiscovered'}
        </button>
      </div>
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

function VillageScreen(props: { onEnterTower: () => void; onHomestead: () => void; onCharacter: () => void }) {
  return (
    <section className="stack">
      <h2>Village</h2>
      <button className="primary" onClick={props.onEnterTower}>Enter Tower</button>
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
  activities: AreaActivity[];
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
      <div className="stack">
        <strong>Inventory</strong>
        {props.player.inventory.map((entry) => {
          const item = getItem(entry.itemId);
          return (
            <button key={entry.itemId} className="card" onClick={() => props.onEquip(entry.itemId)}>
              <strong>{item?.name ?? entry.itemId}</strong>
              <div className="muted">x{entry.quantity} · {item?.type ?? 'unknown'}</div>
            </button>
          );
        })}
      </div>
      <button className="ghost" onClick={props.onBack}>Back</button>
    </section>
  );
}

function rollLoot(enemy: NonNullable<ReturnType<typeof getEnemy>>) {
  return enemy.loot.flatMap((drop) => {
    if (Math.random() > drop.chance) return [];
    return [
      {
        itemId: drop.itemId,
        quantity: rollInt(drop.minQuantity, drop.maxQuantity)
      }
    ];
  });
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
