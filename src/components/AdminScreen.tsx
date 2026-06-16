import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createBlankAreaDraft,
  createBlankEnemyDraft,
  createBlankEventDraft,
  createBlankExpeditionDraft,
  createBlankItemDraft,
  createBlankRealmDraft,
  createBlankRecipeDraft,
  createBlankZoneDraft,
  deleteAdminDraftRecord,
  exportAdminDrafts,
  getDeleteSafetyNotes,
  type AdminAreaDraft,
  type AdminDrafts,
  type AdminEnemyDraft,
  type AdminEventDraft,
  type AdminExpeditionDraft,
  type AdminItemDraft,
  type AdminRealmDraft,
  type AdminRecipeDraft,
  type AdminZoneDraft,
  type DraftAreaActivity,
  type DraftAreaPoolEntry,
  type DraftEventChoice,
  type DraftGuaranteedDrop,
  type DraftLootEntry,
  type DraftTravelRoute,
  type DraftTravelStyle,
  type DraftTravelRouteEvent
} from '../adminDrafts';

type AdminSection = 'wizard' | 'expeditions' | 'realms' | 'items' | 'enemies' | 'zones' | 'areas' | 'recipes' | 'events' | 'export';

type AdminScreenProps = {
  drafts: AdminDrafts;
  onChange: (updater: (current: AdminDrafts) => AdminDrafts) => void;
  onReset: () => void;
  onReload: () => void;
  onBack: () => void;
  onOpenNodes: () => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  syncState: 'loading' | 'ready' | 'saving' | 'error';
  syncError: string | null;
  contentStatusLabel: string;
};

const sectionMeta: Record<AdminSection, { label: string; description: string }> = {
  wizard: { label: 'Test Expedition', description: 'Generate a complete playable test expedition scaffold.' },
  expeditions: { label: 'Expedition Builder', description: 'Create and edit player-facing expeditions.' },
  realms: { label: 'Realm Builder', description: 'Create and edit realms and their zone attachments.' },
  zones: { label: 'Zone Builder', description: 'Attach areas to zones and pick each zone’s starting area.' },
  areas: { label: 'Area Builder', description: 'Edit realms, zones, travel routes, activities, encounter pools, and requirements.' },
  events: { label: 'Event Builder', description: 'Edit event text, choices, rewards, and area attachment.' },
  enemies: { label: 'Enemy Builder', description: 'Edit enemy stats, loot tables, and guaranteed drops.' },
  items: { label: 'Item Builder', description: 'Create and edit equipment, tools, materials, and consumables.' },
  recipes: { label: 'Crafting Builder', description: 'Edit crafting recipes, stations, and ingredient/output rules.' },
  export: { label: 'Expedition Export', description: 'Copy the current content state as JSON.' }
};

export function AdminScreen(props: AdminScreenProps) {
  const [section, setSection] = useState<AdminSection>('wizard');
  const [selectedIds, setSelectedIds] = useState({
    realmId: props.drafts.realms[0]?.id ?? '',
    itemId: props.drafts.items[0]?.id ?? '',
    enemyId: props.drafts.enemies[0]?.id ?? '',
    zoneId: props.drafts.zones[0]?.id ?? '',
    areaId: props.drafts.areas[0]?.id ?? '',
    recipeId: props.drafts.recipes[0]?.id ?? '',
    eventId: props.drafts.events[0]?.id ?? '',
    expeditionId: props.drafts.expeditions[0]?.id ?? ''
  });

  useEffect(() => {
    if (!props.drafts.realms.some((entry) => entry.id === selectedIds.realmId)) {
      setSelectedIds((current) => ({ ...current, realmId: props.drafts.realms[0]?.id ?? '' }));
    }
    if (!props.drafts.items.some((entry) => entry.id === selectedIds.itemId)) {
      setSelectedIds((current) => ({ ...current, itemId: props.drafts.items[0]?.id ?? '' }));
    }
    if (!props.drafts.enemies.some((entry) => entry.id === selectedIds.enemyId)) {
      setSelectedIds((current) => ({ ...current, enemyId: props.drafts.enemies[0]?.id ?? '' }));
    }
    if (!props.drafts.zones.some((entry) => entry.id === selectedIds.zoneId)) {
      setSelectedIds((current) => ({ ...current, zoneId: props.drafts.zones[0]?.id ?? '' }));
    }
    if (!props.drafts.areas.some((entry) => entry.id === selectedIds.areaId)) {
      setSelectedIds((current) => ({ ...current, areaId: props.drafts.areas[0]?.id ?? '' }));
    }
    if (!props.drafts.recipes.some((entry) => entry.id === selectedIds.recipeId)) {
      setSelectedIds((current) => ({ ...current, recipeId: props.drafts.recipes[0]?.id ?? '' }));
    }
    if (!props.drafts.events.some((entry) => entry.id === selectedIds.eventId)) {
      setSelectedIds((current) => ({ ...current, eventId: props.drafts.events[0]?.id ?? '' }));
    }
    if (!props.drafts.expeditions.some((entry) => entry.id === selectedIds.expeditionId)) {
      setSelectedIds((current) => ({ ...current, expeditionId: props.drafts.expeditions[0]?.id ?? '' }));
    }
  }, [props.drafts, selectedIds]);

  const exportData = exportAdminDrafts(props.drafts);
  const deleteWarnings = useMemo(() => ({
    realms: selectedIds.realmId ? getDeleteSafetyNotes(props.drafts, 'realms', selectedIds.realmId) : [],
    items: selectedIds.itemId ? getDeleteSafetyNotes(props.drafts, 'items', selectedIds.itemId) : [],
    enemies: selectedIds.enemyId ? getDeleteSafetyNotes(props.drafts, 'enemies', selectedIds.enemyId) : [],
    zones: selectedIds.zoneId ? getDeleteSafetyNotes(props.drafts, 'zones', selectedIds.zoneId) : [],
    areas: selectedIds.areaId ? getDeleteSafetyNotes(props.drafts, 'areas', selectedIds.areaId) : [],
    recipes: selectedIds.recipeId ? getDeleteSafetyNotes(props.drafts, 'recipes', selectedIds.recipeId) : [],
    events: selectedIds.eventId ? getDeleteSafetyNotes(props.drafts, 'events', selectedIds.eventId) : [],
    expeditions: selectedIds.expeditionId ? getDeleteSafetyNotes(props.drafts, 'expeditions', selectedIds.expeditionId) : []
  }), [props.drafts, selectedIds]);
  const currentSelection = useMemo(() => {
    switch (section) {
      case 'expeditions':
        return props.drafts.expeditions.find((entry) => entry.id === selectedIds.expeditionId) ?? props.drafts.expeditions[0] ?? null;
      case 'realms':
        return props.drafts.realms.find((entry) => entry.id === selectedIds.realmId) ?? props.drafts.realms[0] ?? null;
      case 'items':
        return props.drafts.items.find((entry) => entry.id === selectedIds.itemId) ?? props.drafts.items[0] ?? null;
      case 'enemies':
        return props.drafts.enemies.find((entry) => entry.id === selectedIds.enemyId) ?? props.drafts.enemies[0] ?? null;
      case 'zones':
        return props.drafts.zones.find((entry) => entry.id === selectedIds.zoneId) ?? props.drafts.zones[0] ?? null;
      case 'areas':
        return props.drafts.areas.find((entry) => entry.id === selectedIds.areaId) ?? props.drafts.areas[0] ?? null;
      case 'recipes':
        return props.drafts.recipes.find((entry) => entry.id === selectedIds.recipeId) ?? props.drafts.recipes[0] ?? null;
      case 'events':
        return props.drafts.events.find((entry) => entry.id === selectedIds.eventId) ?? props.drafts.events[0] ?? null;
      default:
        return null;
    }
  }, [props.drafts, section, selectedIds]);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div className="stack">
          <span className="eyebrow">Expedition Builder</span>
          <h2>Expedition Builder</h2>
          <div className="muted">Content edits save to the local API, SQLite database, and mirrored <code>src/data/*.json</code> files.</div>
          <div className="muted">Sync state: {props.syncState}{props.syncError ? ` · ${props.syncError}` : ''}</div>
        </div>
        <div className="admin-page-actions">
          <button className="ghost compact" onClick={props.onToggleTheme} aria-pressed={props.themeMode === 'dark'}>
            <span className="eyebrow">Theme</span>
            <strong>{props.themeMode === 'dark' ? 'Dark mode' : 'Light mode'}</strong>
          </button>
          <button className="secondary" onClick={props.onReset}>Reset Content</button>
          <button className="secondary" onClick={props.onReload} disabled={props.syncState === 'saving'}>
            Reload Content
          </button>
          <div className="admin-sync-status muted">{props.contentStatusLabel}</div>
          <button className="secondary" onClick={props.onOpenNodes}>Node Editor</button>
          <button className="ghost" onClick={props.onBack}>Back to Game</button>
        </div>
      </div>

      <div className="admin-mobile-controls">
        <label className="field admin-mobile-section">
          <span>Section</span>
          <select value={section} onChange={(event) => setSection(event.target.value as AdminSection)}>
            {(['wizard', 'expeditions', 'realms', 'zones', 'areas', 'events', 'enemies', 'items', 'recipes', 'export'] as AdminSection[]).map((key) => (
              <option key={key} value={key}>{sectionMeta[key].label}</option>
            ))}
          </select>
        </label>
        <div className="admin-mobile-summary">
          <span className="chip">{props.contentStatusLabel}</span>
          <span className="chip">{props.drafts.realms.length} realms</span>
          <span className="chip">{props.drafts.zones.length} zones</span>
          <span className="chip">{props.drafts.areas.length} areas</span>
          <span className="chip">{props.drafts.events.length} events</span>
          <span className="chip">{props.drafts.expeditions.length} expeditions</span>
        </div>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="card admin-note">
            <strong>Content Database</strong>
            <div className="muted">
              This is a local-dev content tool backed by the API, SQLite, and mirrored source JSON files.
            </div>
          </div>

          <div className="admin-section-nav">
            {(['wizard', 'expeditions', 'realms', 'zones', 'areas', 'events', 'enemies', 'items', 'recipes', 'export'] as AdminSection[]).map((key) => (
              <button
                key={key}
                className={section === key ? 'card selected admin-nav-button' : 'card admin-nav-button'}
                onClick={() => setSection(key)}
              >
                <strong>{sectionMeta[key].label}</strong>
                <div className="muted">{sectionMeta[key].description}</div>
              </button>
            ))}
          </div>

          <div className="card">
            <strong>Current Counts</strong>
            <div className="admin-counts">
              <span>Realms {props.drafts.realms.length}</span>
              <span>Items {props.drafts.items.length}</span>
              <span>Enemies {props.drafts.enemies.length}</span>
              <span>Zones {props.drafts.zones.length}</span>
              <span>Areas {props.drafts.areas.length}</span>
              <span>Recipes {props.drafts.recipes.length}</span>
              <span>Events {props.drafts.events.length}</span>
              <span>Expeditions {props.drafts.expeditions.length}</span>
            </div>
          </div>

          {currentSelection ? (
            <div className="card">
              <strong>Selected Record</strong>
              <div className="muted">Id: {currentSelection.id}</div>
              <div className="muted">Section: {sectionMeta[section].label}</div>
            </div>
          ) : (
            <div className="card">
              <strong>Selected Record</strong>
              <div className="muted">No record selected.</div>
            </div>
          )}
        </aside>

        <section className="admin-main">
          {section === 'wizard' && (
            <TestExpeditionWizard
              drafts={props.drafts}
              onCreate={(result) => {
                props.onChange((current) => addTestExpeditionToDrafts(current, result));
                setSelectedIds((current) => ({
                  ...current,
                  expeditionId: result.expedition.id,
                  realmId: result.realm.id,
                  zoneId: result.zone.id,
                  areaId: result.areas[0]?.id ?? current.areaId,
                  eventId: result.event.id,
                  enemyId: result.enemy.id,
                  itemId: result.rewardItem.id
                }));
                setSection('areas');
              }}
            />
          )}

          {section === 'expeditions' && (
            <EditableWorkspace
              title="Expedition Builder"
              description="Create and edit player-facing journeys that point into realm, zone, area, travel, and reward content."
              entries={props.drafts.expeditions}
              selectedId={selectedIds.expeditionId}
              selectedEntry={props.drafts.expeditions.find((entry) => entry.id === selectedIds.expeditionId) ?? null}
              onSelect={(expeditionId) => setSelectedIds((current) => ({ ...current, expeditionId }))}
              onCreate={() => {
                const next = createBlankExpeditionDraft(props.drafts.expeditions.map((entry) => entry.id));
                props.onChange((current) => ({ ...current, expeditions: [...current.expeditions, next], updatedAt: Date.now() }));
                setSelectedIds((current) => ({ ...current, expeditionId: next.id }));
              }}
              onSave={(updated) => props.onChange((current) => ({
                ...current,
                expeditions: current.expeditions.map((entry) => (entry.id === updated.id ? updated : entry)),
                updatedAt: Date.now()
              }))}
              onDelete={(expedition) => {
                props.onChange((current) => deleteAdminDraftRecord(current, 'expeditions', expedition.id));
                setSelectedIds((current) => ({ ...current, expeditionId: props.drafts.expeditions.find((entry) => entry.id !== expedition.id)?.id ?? '' }));
              }}
              deleteWarnings={deleteWarnings.expeditions}
              renderListItem={(entry) => `${entry.name} · level ${entry.recommendedLevel}`}
              renderEditor={(expedition, onChange) => (
                <ExpeditionEditor
                  expedition={expedition as AdminExpeditionDraft}
                  realmOptions={props.drafts.realms.map((realm) => ({ value: realm.id, label: realm.name }))}
                  zoneOptions={props.drafts.zones.map((zone) => ({ value: zone.id, label: zone.name, realmId: zone.realmId }))}
                  areaOptions={props.drafts.areas.map((area) => ({ value: area.id, label: area.name, zoneId: area.zoneId }))}
                  onChange={onChange}
                />
              )}
            />
          )}

          {section === 'realms' && (
            <EditableWorkspace
              title="Realm Builder"
              description="Create and edit realms, then attach zones to them."
              entries={props.drafts.realms}
              selectedId={selectedIds.realmId}
              selectedEntry={props.drafts.realms.find((entry) => entry.id === selectedIds.realmId) ?? null}
              onSelect={(realmId) => setSelectedIds((current) => ({ ...current, realmId }))}
              onCreate={() => {
                const next = createBlankRealmDraft(props.drafts.realms.map((entry) => entry.id));
                props.onChange((current) => ({ ...current, realms: [...current.realms, next], updatedAt: Date.now() }));
                setSelectedIds((current) => ({ ...current, realmId: next.id }));
              }}
              onSave={(updated) => props.onChange((current) => ({
                ...current,
                realms: current.realms.map((entry) => (entry.id === updated.id ? updated : entry)),
                updatedAt: Date.now()
              }))}
              onDelete={(realm) => {
                props.onChange((current) => deleteAdminDraftRecord(current, 'realms', realm.id));
                setSelectedIds((current) => ({ ...current, realmId: props.drafts.realms.find((entry) => entry.id !== realm.id)?.id ?? '' }));
              }}
              renderListItem={(entry) => `${entry.name} · ${entry.zoneIds.length} zones`}
              renderEditor={(realm, onChange) => (
                <RealmEditor
                  realm={realm as AdminRealmDraft}
                  zoneOptions={props.drafts.zones.map((zone) => ({ value: zone.id, label: zone.name, startingAreaId: zone.startingAreaId }))}
                  areaOptions={props.drafts.areas.map((area) => ({ value: area.id, label: area.name, zoneId: area.zoneId }))}
                  onChange={onChange}
                />
              )}
            />
          )}

          {section === 'items' && (
            <EditableWorkspace
              title="Item Builder"
              description="Create and edit item records."
              entries={props.drafts.items}
              selectedId={selectedIds.itemId}
              selectedEntry={props.drafts.items.find((entry) => entry.id === selectedIds.itemId) ?? null}
              onSelect={(itemId) => setSelectedIds((current) => ({ ...current, itemId }))}
              onCreate={() => {
                const next = createBlankItemDraft(props.drafts.items.map((entry) => entry.id));
                props.onChange((current) => ({ ...current, items: [...current.items, next], updatedAt: Date.now() }));
                setSelectedIds((current) => ({ ...current, itemId: next.id }));
              }}
              onSave={(updated) => props.onChange((current) => ({
                ...current,
                items: current.items.map((entry) => (entry.id === updated.id ? updated : entry)),
                updatedAt: Date.now()
              }))}
              onDelete={(item) => {
                props.onChange((current) => deleteAdminDraftRecord(current, 'items', item.id));
                setSelectedIds((current) => ({ ...current, itemId: props.drafts.items.find((entry) => entry.id !== item.id)?.id ?? '' }));
              }}
              renderListItem={(entry) => `${entry.name} · ${entry.type || 'unset'}`}
              renderEditor={(item, onChange) => <ItemEditor item={item as AdminItemDraft} onChange={onChange} />}
            />
          )}

          {section === 'enemies' && (
            <EditableWorkspace
              title="Enemy Builder"
              description="Create and edit enemy records."
              entries={props.drafts.enemies}
              selectedId={selectedIds.enemyId}
              selectedEntry={props.drafts.enemies.find((entry) => entry.id === selectedIds.enemyId) ?? null}
              onSelect={(enemyId) => setSelectedIds((current) => ({ ...current, enemyId }))}
              onCreate={() => {
                const next = createBlankEnemyDraft(props.drafts.enemies.map((entry) => entry.id));
                props.onChange((current) => ({ ...current, enemies: [...current.enemies, next], updatedAt: Date.now() }));
                setSelectedIds((current) => ({ ...current, enemyId: next.id }));
              }}
              onSave={(updated) => props.onChange((current) => ({
                ...current,
                enemies: current.enemies.map((entry) => (entry.id === updated.id ? updated : entry)),
                updatedAt: Date.now()
              }))}
              onDelete={(enemy) => {
                props.onChange((current) => deleteAdminDraftRecord(current, 'enemies', enemy.id));
                setSelectedIds((current) => ({ ...current, enemyId: props.drafts.enemies.find((entry) => entry.id !== enemy.id)?.id ?? '' }));
              }}
              renderListItem={(entry) => `${entry.name} · level ${entry.level}`}
              renderEditor={(enemy, onChange) => <EnemyEditor enemy={enemy as AdminEnemyDraft} onChange={onChange} />}
            />
          )}

          {section === 'zones' && (
            <EditableWorkspace
              title="Zone Builder"
              description="Attach areas to zones and choose the zone start."
              entries={props.drafts.zones}
              selectedId={selectedIds.zoneId}
              selectedEntry={props.drafts.zones.find((entry) => entry.id === selectedIds.zoneId) ?? null}
              onSelect={(zoneId) => setSelectedIds((current) => ({ ...current, zoneId }))}
              onCreate={() => {
                const next = createBlankZoneDraft(props.drafts.zones.map((entry) => entry.id));
                props.onChange((current) => ({ ...current, zones: [...current.zones, next], updatedAt: Date.now() }));
                setSelectedIds((current) => ({ ...current, zoneId: next.id }));
              }}
              onSave={(updated) => props.onChange((current) => ({
                ...current,
                zones: current.zones.map((entry) => (entry.id === updated.id ? updated : entry)),
                updatedAt: Date.now()
              }))}
              onDelete={(zone) => {
                props.onChange((current) => deleteAdminDraftRecord(current, 'zones', zone.id));
                setSelectedIds((current) => ({ ...current, zoneId: props.drafts.zones.find((entry) => entry.id !== zone.id)?.id ?? '' }));
              }}
              renderListItem={(entry) => `${entry.name} · ${entry.realmId || 'no realm'} · ${entry.areaIds.length} areas`}
              renderEditor={(zone, onChange) => (
                <ZoneEditor
                  zone={zone as AdminZoneDraft}
                  realmOptions={props.drafts.realms.map((realm) => ({ value: realm.id, label: realm.name }))}
                  areaOptions={props.drafts.areas.map((area) => ({ value: area.id, label: area.name }))}
                  onChange={onChange}
                />
              )}
            />
          )}

          {section === 'areas' && (
            <EditableWorkspace
              title="Area Builder"
              description="Create and edit area records."
              entries={props.drafts.areas}
              selectedId={selectedIds.areaId}
              selectedEntry={props.drafts.areas.find((entry) => entry.id === selectedIds.areaId) ?? null}
              onSelect={(areaId) => setSelectedIds((current) => ({ ...current, areaId }))}
              onCreate={() => {
                const next = createBlankAreaDraft(props.drafts.areas.map((entry) => entry.id));
                props.onChange((current) => ({ ...current, areas: [...current.areas, next], updatedAt: Date.now() }));
                setSelectedIds((current) => ({ ...current, areaId: next.id }));
              }}
              onSave={(updated) => props.onChange((current) => ({
                ...current,
                areas: current.areas.map((entry) => (entry.id === updated.id ? updated : entry)),
                updatedAt: Date.now()
              }))}
              onDelete={(area) => {
                props.onChange((current) => deleteAdminDraftRecord(current, 'areas', area.id));
                setSelectedIds((current) => ({ ...current, areaId: props.drafts.areas.find((entry) => entry.id !== area.id)?.id ?? '' }));
              }}
              renderListItem={(entry) => `${entry.name} · ${entry.zoneId || 'no zone'}`}
              renderEditor={(area, onChange) => (
                <AreaEditor
                  area={area as AdminAreaDraft}
                  realmOptions={props.drafts.realms.map((realm) => ({ value: realm.id, label: realm.name }))}
                  zoneOptions={props.drafts.zones.map((zone) => ({ value: zone.id, label: zone.name }))}
                  areaOptions={props.drafts.areas.map((entry) => ({ value: entry.id, label: entry.name, zoneId: entry.zoneId }))}
                  onChange={onChange}
                />
              )}
            />
          )}

          {section === 'recipes' && (
            <EditableWorkspace
              title="Crafting Builder"
              description="Create and edit recipe records."
              entries={props.drafts.recipes}
              selectedId={selectedIds.recipeId}
              selectedEntry={props.drafts.recipes.find((entry) => entry.id === selectedIds.recipeId) ?? null}
              onSelect={(recipeId) => setSelectedIds((current) => ({ ...current, recipeId }))}
              onCreate={() => {
                const next = createBlankRecipeDraft(props.drafts.recipes.map((entry) => entry.id));
                props.onChange((current) => ({ ...current, recipes: [...current.recipes, next], updatedAt: Date.now() }));
                setSelectedIds((current) => ({ ...current, recipeId: next.id }));
              }}
              onSave={(updated) => props.onChange((current) => ({
                ...current,
                recipes: current.recipes.map((entry) => (entry.id === updated.id ? updated : entry)),
                updatedAt: Date.now()
              }))}
              onDelete={(recipe) => {
                props.onChange((current) => deleteAdminDraftRecord(current, 'recipes', recipe.id));
                setSelectedIds((current) => ({ ...current, recipeId: props.drafts.recipes.find((entry) => entry.id !== recipe.id)?.id ?? '' }));
              }}
              renderListItem={(entry) => `${entry.name} · ${entry.station || 'no station'}`}
              renderEditor={(recipe, onChange) => <RecipeEditor recipe={recipe as AdminRecipeDraft} onChange={onChange} />}
            />
          )}

          {section === 'events' && (
            <EditableWorkspace
              title="Event Builder"
              description="Attach events to areas and describe their branching choices."
              entries={props.drafts.events}
              selectedId={selectedIds.eventId}
              selectedEntry={props.drafts.events.find((entry) => entry.id === selectedIds.eventId) ?? null}
              onSelect={(eventId) => setSelectedIds((current) => ({ ...current, eventId }))}
              onCreate={() => {
                const next = createBlankEventDraft(props.drafts.events.map((entry) => entry.id));
                props.onChange((current) => ({ ...current, events: [...current.events, next], updatedAt: Date.now() }));
                setSelectedIds((current) => ({ ...current, eventId: next.id }));
              }}
              onSave={(updated) => props.onChange((current) => ({
                ...current,
                events: current.events.map((entry) => (entry.id === updated.id ? updated : entry)),
                updatedAt: Date.now()
              }))}
              onDelete={(event) => {
                props.onChange((current) => deleteAdminDraftRecord(current, 'events', event.id));
                setSelectedIds((current) => ({ ...current, eventId: props.drafts.events.find((entry) => entry.id !== event.id)?.id ?? '' }));
              }}
              renderListItem={(entry) => `${entry.name} · ${entry.areaId || 'no area'}`}
              renderEditor={(event, onChange) => (
                <EventEditor
                  event={event as AdminEventDraft}
                  areaOptions={props.drafts.areas.map((area) => ({ value: area.id, label: area.name }))}
                  onChange={onChange}
                />
              )}
            />
          )}

          {section === 'export' && <ExportSection exportData={exportData} />}
        </section>

        <aside className="admin-inspector">
          <div className="card">
            <strong>Inspector</strong>
            <div className="muted">{sectionMeta[section].description}</div>
          </div>
          {currentSelection ? (
            <div className="card">
              <div className="label-row">
                <span>Live Draft JSON</span>
                <span className="muted">{currentSelection.id}</span>
              </div>
              <textarea className="admin-json inspector-json" readOnly value={JSON.stringify(currentSelection, null, 2)} />
            </div>
          ) : (
            <div className="card">
              <strong>Layout Notes</strong>
              <div className="muted">
                The event editor is a placeholder for now. Future work should make realm, zone, area, and activity attachments data-driven.
              </div>
            </div>
          )}
          <div className="card">
            <strong>Future Wiring</strong>
            <div className="muted">
              This panel is intentionally local-only so it can later connect to file export/import, backend persistence, or a content database.
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

type TestExpeditionWizardDraft = {
  name: string;
  realmName: string;
  zoneName: string;
  startingAreaName: string;
  resourceAreaName: string;
  eventAreaName: string;
  rewardItemName: string;
  enemyName: string;
};

type TestExpeditionBuildResult = {
  realm: AdminRealmDraft;
  zone: AdminZoneDraft;
  areas: AdminAreaDraft[];
  event: AdminEventDraft;
  enemy: AdminEnemyDraft;
  rewardItem: AdminItemDraft;
  expedition: AdminExpeditionDraft;
};

function slugifyId(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || fallback;
}

function uniqueId(base: string, existingIds: string[]) {
  const existing = new Set(existingIds);
  let candidate = base;
  let suffix = 2;
  while (existing.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  existingIds.push(candidate);
  return candidate;
}

function makeTravelEventPool(enemyId: string, destinationName: string): DraftTravelRouteEvent[] {
  return [
    { id: 'safe_passage', label: 'Safe passage', weight: 70, kind: 'none' },
    { id: 'road_note', label: 'Road note', weight: 20, kind: 'message', message: `The route toward ${destinationName} stays clear for now.` },
    { id: 'test_ambush', label: 'Test ambush', weight: 10, kind: 'combat', enemyId }
  ];
}

function makeTravelRoute(fromAreaId: string, destinationArea: AdminAreaDraft, enemyId: string): DraftTravelRoute {
  return {
    id: `travel_${fromAreaId}_to_${destinationArea.id}`,
    destinationAreaId: destinationArea.id,
    label: `Travel to ${destinationArea.name}`,
    styles: [
      {
        id: 'careful',
        label: 'Travel Carefully',
        steps: 2,
        eventPool: makeTravelEventPool(enemyId, destinationArea.name).map((entry) =>
          entry.kind === 'combat' ? { ...entry, weight: 5 } : entry
        )
      },
      {
        id: 'normal',
        label: 'Travel Normally',
        steps: 1,
        eventPool: makeTravelEventPool(enemyId, destinationArea.name)
      },
      {
        id: 'quick',
        label: 'Travel Quickly',
        steps: 1,
        eventPool: makeTravelEventPool(enemyId, destinationArea.name).map((entry) =>
          entry.kind === 'combat' ? { ...entry, weight: 30 } : entry
        )
      }
    ]
  };
}

function createTestExpedition(drafts: AdminDrafts, values: TestExpeditionWizardDraft): TestExpeditionBuildResult {
  const realmIds = drafts.realms.map((entry) => entry.id);
  const zoneIds = drafts.zones.map((entry) => entry.id);
  const areaIds = drafts.areas.map((entry) => entry.id);
  const itemIds = drafts.items.map((entry) => entry.id);
  const enemyIds = drafts.enemies.map((entry) => entry.id);
  const eventIds = drafts.events.map((entry) => entry.id);
  const base = slugifyId(values.name, 'test_expedition');

  const realmId = uniqueId(`${base}_realm`, realmIds);
  const zoneId = uniqueId(`${base}_zone`, zoneIds);
  const startAreaId = uniqueId(`${base}_start`, areaIds);
  const resourceAreaId = uniqueId(`${base}_field`, areaIds);
  const eventAreaId = uniqueId(`${base}_ruins`, areaIds);
  const rewardItemId = uniqueId(`${base}_token`, itemIds);
  const enemyId = uniqueId(`${base}_sentinel`, enemyIds);
  const eventId = uniqueId(`${base}_choice`, eventIds);
  const expeditionId = uniqueId(`${base}_expedition`, drafts.expeditions.map((entry) => entry.id));

  const rewardItem: AdminItemDraft = {
    id: rewardItemId,
    name: values.rewardItemName,
    type: 'material',
    slot: '',
    rarity: 'common',
    value: 1,
    description: `A reward item created for ${values.name}.`,
    damageMin: null,
    damageMax: null,
    armor: null,
    toolType: '',
    level: null,
    durability: null,
    maxDurability: null,
    effect: '',
    tags: ['test', 'reward']
  };

  const enemy: AdminEnemyDraft = {
    id: enemyId,
    name: values.enemyName,
    description: `A low-risk combat check for ${values.name}.`,
    level: 1,
    hp: 8,
    damageMin: 1,
    damageMax: 2,
    xp: 8,
    lootTable: [{ itemId: rewardItemId, chance: 0.5, minQuantity: 1, maxQuantity: 1 }],
    guaranteedDrops: []
  };

  const startArea: AdminAreaDraft = {
    id: startAreaId,
    name: values.startingAreaName,
    realmId,
    zoneId,
    description: `The starting point for ${values.name}.`,
    activities: [
      { id: 'inspect_start', label: 'Inspect the Area', kind: 'scripted', action: 'message', message: 'The expedition route is ready for a basic play test.' },
      { id: 'travel_resource', label: `Travel to ${values.resourceAreaName}`, kind: 'travel', action: 'travel', destinationAreaId: resourceAreaId, params: { ambushChance: 0, ambushEnemyId: enemyId } },
      { id: 'travel_event', label: `Travel to ${values.eventAreaName}`, kind: 'travel', action: 'travel', destinationAreaId: eventAreaId, params: { ambushChance: 0, ambushEnemyId: enemyId } },
      { id: 'return_tower', label: 'Return to Tower', kind: 'scripted', action: 'returnToTower' }
    ],
    enemyPool: [{ enemyId, weight: 100 }],
    encounterChance: 0.1,
    requirements: [],
    recommendedLevel: 1,
    resourceItemIds: [rewardItemId],
    connectedAreaIds: [resourceAreaId, eventAreaId],
    travelRoutes: [],
    revealText: `You enter ${values.startingAreaName}.`
  };

  const resourceArea: AdminAreaDraft = {
    id: resourceAreaId,
    name: values.resourceAreaName,
    realmId,
    zoneId,
    description: `A simple resource stop for ${values.name}.`,
    activities: [
      { id: 'collect_reward', label: `Collect ${values.rewardItemName}`, kind: 'scripted', action: 'grantItem', params: { itemId: rewardItemId, quantity: 1, text: `You collect ${values.rewardItemName}.` } },
      { id: 'return_start', label: `Return to ${values.startingAreaName}`, kind: 'travel', action: 'travel', destinationAreaId: startAreaId, params: { ambushChance: 0, ambushEnemyId: enemyId } }
    ],
    enemyPool: [{ enemyId, weight: 100 }],
    encounterChance: 0.15,
    requirements: [],
    recommendedLevel: 1,
    resourceItemIds: [rewardItemId],
    connectedAreaIds: [startAreaId],
    travelRoutes: [],
    revealText: `You discover ${values.resourceAreaName}.`
  };

  const eventArea: AdminAreaDraft = {
    id: eventAreaId,
    name: values.eventAreaName,
    realmId,
    zoneId,
    description: `A choice encounter location for ${values.name}.`,
    activities: [
      { id: 'test_event', label: 'Investigate the Marker', kind: 'event', action: 'event', eventId },
      { id: 'return_start', label: `Return to ${values.startingAreaName}`, kind: 'travel', action: 'travel', destinationAreaId: startAreaId, params: { ambushChance: 0, ambushEnemyId: enemyId } }
    ],
    enemyPool: [{ enemyId, weight: 100 }],
    encounterChance: 0.15,
    requirements: [],
    recommendedLevel: 1,
    resourceItemIds: [rewardItemId],
    connectedAreaIds: [startAreaId],
    travelRoutes: [],
    revealText: `You discover ${values.eventAreaName}.`
  };

  const areas = [startArea, resourceArea, eventArea].map((area) => {
    const destinations = area.connectedAreaIds
      .map((areaId) => [startArea, resourceArea, eventArea].find((entry) => entry.id === areaId))
      .filter((entry): entry is AdminAreaDraft => !!entry);
    return {
      ...area,
      travelRoutes: destinations.map((destination) => makeTravelRoute(area.id, destination, enemyId))
    };
  });

  const event: AdminEventDraft = {
    id: eventId,
    name: `${values.name} Choice`,
    areaId: eventAreaId,
    activityId: 'test_event',
    description: 'A compact branch used to verify event rewards and combat outcomes.',
    choices: [
      {
        id: 'take_reward',
        text: `Take ${values.rewardItemName}`,
        outcome: {
          text: `You secure ${values.rewardItemName}.`,
          rewards: [{ itemId: rewardItemId, quantity: 1 }]
        }
      },
      {
        id: 'challenge_guardian',
        text: `Challenge ${values.enemyName}`,
        outcome: {
          text: `${values.enemyName} steps forward.`,
          rewards: [],
          combat: { enemyId }
        }
      }
    ]
  };

  const zone: AdminZoneDraft = {
    id: zoneId,
    realmId,
    name: values.zoneName,
    description: `A generated zone for ${values.name}.`,
    areaIds: areas.map((area) => area.id),
    startingAreaId: startAreaId
  };

  const realm: AdminRealmDraft = {
    id: realmId,
    name: values.realmName,
    description: `A generated realm for ${values.name}.`,
    zoneIds: [zoneId],
    startingZoneId: zoneId,
    startingAreaId: startAreaId
  };

  const expedition: AdminExpeditionDraft = {
    id: expeditionId,
    name: values.name,
    description: `A generated expedition scaffold for ${values.realmName}.`,
    realmId,
    zoneId,
    startingAreaId: startAreaId,
    recommendedLevel: 1,
    requirements: [],
    travelPool: [
      { id: 'safe_approach', label: 'Safe Approach', weight: 70, kind: 'message', message: `You make steady progress toward ${values.startingAreaName}.` },
      { id: 'supply_find', label: 'Supply Find', weight: 20, kind: 'reward', message: `You find ${values.rewardItemName} beside the route.`, rewards: [{ itemId: rewardItemId, quantity: 1 }] },
      { id: 'route_guardian', label: `${values.enemyName} Contact`, weight: 10, kind: 'combat', enemyId }
    ],
    rewardPreview: [{ itemId: rewardItemId, quantity: 1 }]
  };

  return { realm, zone, areas, event, enemy, rewardItem, expedition };
}

function addTestExpeditionToDrafts(drafts: AdminDrafts, result: TestExpeditionBuildResult): AdminDrafts {
  return {
    ...drafts,
    realms: [...drafts.realms, result.realm],
    zones: [...drafts.zones, result.zone],
    areas: [...drafts.areas, ...result.areas],
    events: [...drafts.events, result.event],
    enemies: [...drafts.enemies, result.enemy],
    items: [...drafts.items, result.rewardItem],
    expeditions: [...drafts.expeditions, result.expedition],
    updatedAt: Date.now()
  };
}

function TestExpeditionWizard(props: {
  drafts: AdminDrafts;
  onCreate: (result: TestExpeditionBuildResult) => void;
}) {
  const [values, setValues] = useState<TestExpeditionWizardDraft>({
    name: 'Test Expedition',
    realmName: 'Test Realm',
    zoneName: 'Test Zone',
    startingAreaName: 'Test Camp',
    resourceAreaName: 'Supply Field',
    eventAreaName: 'Old Marker',
    rewardItemName: 'Test Token',
    enemyName: 'Training Sentinel'
  });
  const [preview, setPreview] = useState<TestExpeditionBuildResult | null>(null);

  const updateValue = (key: keyof TestExpeditionWizardDraft, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setPreview(null);
  };
  const canCreate = Object.values(values).every((value) => value.trim().length > 0);
  const nextPreview = preview ?? createTestExpedition(props.drafts, values);

  return (
    <div className="stack admin-builder">
      <div className="card">
        <strong>Test Expedition Wizard</strong>
        <div className="muted">Create a playable scaffold with one realm, one zone, three linked areas, one event, one enemy, and one reward item.</div>
      </div>
      <div className="admin-builder-grid">
        <div className="admin-list-pane">
          <div className="card">
            <strong>Generated Content</strong>
            <div className="muted">The wizard appends new records and selects the starting area after creation.</div>
          </div>
          <div className="card">
            <strong>{nextPreview.realm.name}</strong>
            <div className="muted">{nextPreview.zone.name}</div>
            <div className="chips">
              <span className="chip">{nextPreview.areas.length} areas</span>
              <span className="chip">1 event</span>
              <span className="chip">1 enemy</span>
              <span className="chip">1 item</span>
            </div>
          </div>
          {nextPreview.areas.map((area) => (
            <div key={area.id} className="card">
              <strong>{area.name}</strong>
              <div className="muted">{area.id}</div>
              <div className="muted">{area.activities.length} activities · {area.travelRoutes.length} routes</div>
            </div>
          ))}
        </div>
        <div className="admin-editor">
          <div className="stack">
            <TextField label="Expedition Name" value={values.name} onChange={(value) => updateValue('name', value)} />
            <TextField label="Realm Name" value={values.realmName} onChange={(value) => updateValue('realmName', value)} />
            <TextField label="Zone Name" value={values.zoneName} onChange={(value) => updateValue('zoneName', value)} />
            <TextField label="Starting Area" value={values.startingAreaName} onChange={(value) => updateValue('startingAreaName', value)} />
            <TextField label="Resource Area" value={values.resourceAreaName} onChange={(value) => updateValue('resourceAreaName', value)} />
            <TextField label="Event Area" value={values.eventAreaName} onChange={(value) => updateValue('eventAreaName', value)} />
            <TextField label="Reward Item" value={values.rewardItemName} onChange={(value) => updateValue('rewardItemName', value)} />
            <TextField label="Enemy" value={values.enemyName} onChange={(value) => updateValue('enemyName', value)} />
            <div className="admin-actions">
              <button className="secondary" type="button" onClick={() => setPreview(createTestExpedition(props.drafts, values))} disabled={!canCreate}>
                Refresh Preview
              </button>
              <button className="primary" type="button" onClick={() => props.onCreate(createTestExpedition(props.drafts, values))} disabled={!canCreate}>
                Create Test Expedition
              </button>
            </div>
            <div className="card">
              <strong>Preview JSON</strong>
              <textarea className="admin-json" readOnly value={JSON.stringify(nextPreview, null, 2)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableWorkspace<T extends { id: string }>(props: {
  title: string;
  description: string;
  entries: T[];
  selectedId: string;
  selectedEntry: T | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onSave: (value: T) => void;
  onDelete?: (value: T) => void;
  deleteWarnings?: string[];
  renderListItem: (entry: T) => string;
  renderEditor: (draft: T, onChange: (value: T) => void) => ReactNode;
}) {
  const [draft, setDraft] = useState<T | null>(() => cloneDraft(props.selectedEntry));
  const [deleteNotice, setDeleteNotice] = useState<string[] | null>(null);

  useEffect(() => {
    setDraft(cloneDraft(props.selectedEntry));
    setDeleteNotice(null);
  }, [props.selectedEntry]);

  const dirty = !!draft && !!props.selectedEntry && JSON.stringify(draft) !== JSON.stringify(props.selectedEntry);
  const canSave = !!draft && !!props.selectedEntry && dirty;

  return (
    <div className="stack admin-builder">
      <div className="card">
        <strong>{props.title}</strong>
        <div className="muted">{props.description}</div>
      </div>
      <div className="admin-builder-grid">
        <div className="admin-list-pane">
          <div className="card admin-list-header">
            <strong>Draft Records</strong>
            <div className="muted">Choose a record to edit.</div>
          </div>
          <div className="admin-list">
            {props.entries.length > 0 ? (
              props.entries.map((entry) => (
                <button
                  key={entry.id}
                  className={entry.id === props.selectedId ? 'card selected admin-list-item' : 'card admin-list-item'}
                  onClick={() => props.onSelect(entry.id)}
                >
                  <strong>{entry.id}</strong>
                  <div className="muted">{props.renderListItem(entry)}</div>
                </button>
              ))
            ) : (
              <div className="card">
                <strong>No entries yet</strong>
                <div className="muted">Create the first record.</div>
              </div>
            )}
          </div>
          <button className="primary" onClick={props.onCreate}>New Record</button>
        </div>
        <div className="admin-editor">
          <div className="card">
            <div className="label-row">
              <span>Editor</span>
              <span className="muted">{dirty ? 'Unsaved changes' : 'Saved'}</span>
            </div>
            <div className="muted">Edit locally, then save back to the API and mirrored source files.</div>
          </div>
          {draft ? (
            <div className="stack">
              {props.renderEditor(draft, setDraft)}
              {deleteNotice?.length ? (
                <div className="card warning-card">
                  <strong>Delete blocked</strong>
                  <div className="muted">This record cannot be deleted until these issues are resolved:</div>
                  <ul className="warning-list">
                    {deleteNotice.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="admin-actions">
                <button className="primary" onClick={() => props.onSave(draft)} disabled={!canSave}>
                  Save Changes
                </button>
                <button className="secondary" onClick={() => setDraft(cloneDraft(props.selectedEntry))} disabled={!props.selectedEntry}>
                  Revert
                </button>
                {props.onDelete && props.selectedEntry ? (
                  <button
                    className="danger"
                    type="button"
                    onClick={() => {
                      const warnings = props.deleteWarnings ?? [];
                      if (warnings.length) {
                        setDeleteNotice(warnings);
                        return;
                      }
                      const confirmed = window.confirm(`Delete ${props.selectedEntry?.id}? This cannot be undone.`);
                      if (!confirmed) return;
                      setDeleteNotice(null);
                      props.onDelete?.(props.selectedEntry as T);
                    }}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="card">
              <strong>No record selected</strong>
              <div className="muted">Pick an entry from the list or create a new one.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cloneDraft<T>(value: T | null): T | null {
  return value == null ? null : structuredClone(value);
}

function ExpeditionEditor(props: {
  expedition: AdminExpeditionDraft;
  realmOptions: { value: string; label: string }[];
  zoneOptions: { value: string; label: string; realmId: string }[];
  areaOptions: { value: string; label: string; zoneId: string }[];
  onChange: (expedition: AdminExpeditionDraft) => void;
}) {
  const expedition = props.expedition;
  const zoneOptions = props.zoneOptions.filter((zone) => !expedition.realmId || zone.realmId === expedition.realmId);
  const areaOptions = props.areaOptions.filter((area) => !expedition.zoneId || area.zoneId === expedition.zoneId);
  const handleRealmChange = (realmId: string) => {
    const nextZone = props.zoneOptions.find((zone) => zone.realmId === realmId);
    const nextArea = nextZone ? props.areaOptions.find((area) => area.zoneId === nextZone.value) : null;
    props.onChange({
      ...expedition,
      realmId,
      zoneId: nextZone?.value ?? '',
      startingAreaId: nextArea?.value ?? ''
    });
  };
  const handleZoneChange = (zoneId: string) => {
    const nextZone = props.zoneOptions.find((zone) => zone.value === zoneId);
    const nextArea = props.areaOptions.find((area) => area.zoneId === zoneId);
    props.onChange({
      ...expedition,
      realmId: nextZone?.realmId ?? expedition.realmId,
      zoneId,
      startingAreaId: nextArea?.value ?? ''
    });
  };

  return (
    <div className="stack">
      <h3>Expedition Details</h3>
      <TextField label="Id" value={expedition.id} onChange={(value) => props.onChange({ ...expedition, id: value })} />
      <TextField label="Name" value={expedition.name} onChange={(value) => props.onChange({ ...expedition, name: value })} />
      <TextAreaField label="Description" value={expedition.description} onChange={(value) => props.onChange({ ...expedition, description: value })} />
      <SelectField
        label="Destination Realm"
        value={expedition.realmId}
        options={[{ value: '', label: 'Choose realm' }, ...props.realmOptions]}
        onChange={handleRealmChange}
      />
      <SelectField
        label="Destination Zone"
        value={expedition.zoneId}
        options={[{ value: '', label: 'Choose zone' }, ...zoneOptions]}
        onChange={handleZoneChange}
      />
      <SelectField
        label="Starting Area"
        value={expedition.startingAreaId}
        options={[{ value: '', label: 'Choose area' }, ...areaOptions]}
        onChange={(value) => props.onChange({ ...expedition, startingAreaId: value })}
      />
      <NumberField
        label="Recommended Level"
        value={expedition.recommendedLevel}
        onChange={(value) => props.onChange({ ...expedition, recommendedLevel: value ?? 1 })}
      />
      <JsonField label="Requirements" value={expedition.requirements} onChange={(value) => props.onChange({ ...expedition, requirements: value as AdminExpeditionDraft['requirements'] })} />
      <JsonField label="Travel Pool" value={expedition.travelPool} onChange={(value) => props.onChange({ ...expedition, travelPool: value as AdminExpeditionDraft['travelPool'] })} />
      <JsonField label="Reward Preview" value={expedition.rewardPreview} onChange={(value) => props.onChange({ ...expedition, rewardPreview: value as AdminExpeditionDraft['rewardPreview'] })} />
    </div>
  );
}

function ItemEditor(props: {
  item: AdminItemDraft;
  onChange: (item: AdminItemDraft) => void;
}) {
  const item = props.item;
  return (
    <div className="stack">
      <h3>Item Details</h3>
      <TextField label="Id" value={item.id} onChange={(value) => props.onChange({ ...item, id: value })} />
      <TextField label="Name" value={item.name} onChange={(value) => props.onChange({ ...item, name: value })} />
      <TextField label="Type" value={item.type} onChange={(value) => props.onChange({ ...item, type: value })} />
      <TextField label="Slot" value={item.slot} onChange={(value) => props.onChange({ ...item, slot: value })} />
      <TextField label="Rarity" value={item.rarity} onChange={(value) => props.onChange({ ...item, rarity: value })} />
      <NumberField label="Value" value={item.value} onChange={(value) => props.onChange({ ...item, value: value ?? 0 })} />
      <TextAreaField label="Description" value={item.description} onChange={(value) => props.onChange({ ...item, description: value })} />
      <NumberField label="Damage Min" value={item.damageMin} onChange={(value) => props.onChange({ ...item, damageMin: value })} />
      <NumberField label="Damage Max" value={item.damageMax} onChange={(value) => props.onChange({ ...item, damageMax: value })} />
      <NumberField label="Armor" value={item.armor} onChange={(value) => props.onChange({ ...item, armor: value })} />
      <TextField label="Tool Type" value={item.toolType} onChange={(value) => props.onChange({ ...item, toolType: value })} />
      <NumberField label="Level" value={item.level} onChange={(value) => props.onChange({ ...item, level: value })} />
      <NumberField label="Durability" value={item.durability} onChange={(value) => props.onChange({ ...item, durability: value })} />
      <NumberField label="Max Durability" value={item.maxDurability} onChange={(value) => props.onChange({ ...item, maxDurability: value })} />
      <TextAreaField label="Effect" value={item.effect} onChange={(value) => props.onChange({ ...item, effect: value })} />
      <TextField
        label="Tags"
        value={item.tags.join(', ')}
        onChange={(value) => props.onChange({ ...item, tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })}
      />
    </div>
  );
}

function EnemyEditor(props: {
  enemy: AdminEnemyDraft;
  onChange: (enemy: AdminEnemyDraft) => void;
}) {
  const enemy = props.enemy;
  return (
    <div className="stack">
      <h3>Enemy Details</h3>
      <TextField label="Id" value={enemy.id} onChange={(value) => props.onChange({ ...enemy, id: value })} />
      <TextField label="Name" value={enemy.name} onChange={(value) => props.onChange({ ...enemy, name: value })} />
      <TextAreaField label="Description" value={enemy.description} onChange={(value) => props.onChange({ ...enemy, description: value })} />
      <NumberField label="Level" value={enemy.level} onChange={(value) => props.onChange({ ...enemy, level: value ?? 0 })} />
      <NumberField label="HP" value={enemy.hp} onChange={(value) => props.onChange({ ...enemy, hp: value ?? 0 })} />
      <NumberField label="Damage Min" value={enemy.damageMin} onChange={(value) => props.onChange({ ...enemy, damageMin: value ?? 0 })} />
      <NumberField label="Damage Max" value={enemy.damageMax} onChange={(value) => props.onChange({ ...enemy, damageMax: value ?? 0 })} />
      <NumberField label="XP" value={enemy.xp} onChange={(value) => props.onChange({ ...enemy, xp: value ?? 0 })} />
      <JsonField label="Loot Table" value={enemy.lootTable} onChange={(value) => props.onChange({ ...enemy, lootTable: value as DraftLootEntry[] })} />
      <JsonField
        label="Guaranteed Drops"
        value={enemy.guaranteedDrops}
        onChange={(value) => props.onChange({ ...enemy, guaranteedDrops: value as DraftGuaranteedDrop[] })}
      />
    </div>
  );
}

function AreaEditor(props: {
  area: AdminAreaDraft;
  realmOptions: { value: string; label: string }[];
  zoneOptions: { value: string; label: string }[];
  areaOptions: { value: string; label: string; zoneId: string }[];
  onChange: (area: AdminAreaDraft) => void;
}) {
  const area = props.area;
  return (
    <div className="stack">
      <h3>Area Details</h3>
      <TextField label="Id" value={area.id} onChange={(value) => props.onChange({ ...area, id: value })} />
      <TextField label="Name" value={area.name} onChange={(value) => props.onChange({ ...area, name: value })} />
      <SelectField
        label="Realm"
        value={area.realmId}
        options={[{ value: '', label: 'Unassigned' }, ...props.realmOptions]}
        onChange={(value) => props.onChange({ ...area, realmId: value })}
      />
      <SelectField
        label="Zone"
        value={area.zoneId}
        options={[{ value: '', label: 'Unassigned' }, ...props.zoneOptions]}
        onChange={(value) => props.onChange({ ...area, zoneId: value })}
      />
      <TextAreaField label="Description" value={area.description} onChange={(value) => props.onChange({ ...area, description: value })} />
      <NumberField label="Encounter Chance" value={area.encounterChance} onChange={(value) => props.onChange({ ...area, encounterChance: value ?? 0 })} />
      <NumberField label="Recommended Level" value={area.recommendedLevel} onChange={(value) => props.onChange({ ...area, recommendedLevel: value ?? 0 })} />
      <TextField
        label="Requirements"
        value={area.requirements.join(', ')}
        onChange={(value) => props.onChange({ ...area, requirements: value.split(',').map((entry) => entry.trim()).filter(Boolean) })}
      />
      <TextField
        label="Connected Areas"
        value={area.connectedAreaIds.join(', ')}
        onChange={(value) => props.onChange({ ...area, connectedAreaIds: value.split(',').map((entry) => entry.trim()).filter(Boolean) })}
      />
      <TextField
        label="Resource Items"
        value={area.resourceItemIds.join(', ')}
        onChange={(value) => props.onChange({ ...area, resourceItemIds: value.split(',').map((entry) => entry.trim()).filter(Boolean) })}
      />
      <TextAreaField label="Reveal Text" value={area.revealText} onChange={(value) => props.onChange({ ...area, revealText: value })} />
      <TravelRouteEditor
        routes={area.travelRoutes}
        areaOptions={props.areaOptions.filter((option) => option.value !== area.id)}
        onChange={(travelRoutes) => props.onChange({ ...area, travelRoutes })}
      />
      <ActivityEditor activities={area.activities} onChange={(activities) => props.onChange({ ...area, activities })} />
      <JsonField label="Enemy Pool" value={area.enemyPool} onChange={(value) => props.onChange({ ...area, enemyPool: value as DraftAreaPoolEntry[] })} />
    </div>
  );
}

function createBlankTravelStyle(style: DraftTravelStyle['id'], destinationAreaName = 'destination'): DraftTravelStyle {
  const labels: Record<DraftTravelStyle['id'], string> = {
    careful: 'Travel Carefully',
    normal: 'Travel Normally',
    quick: 'Travel Quickly'
  };
  const basePools: Record<DraftTravelStyle['id'], DraftTravelRouteEvent[]> = {
    careful: [
      { id: 'safe_passage', label: 'Safe passage', weight: 70, kind: 'none' },
      { id: 'watchful_note', label: 'Watchful note', weight: 20, kind: 'message', message: `You keep to the edge of the road toward ${destinationAreaName}.` },
      { id: 'road_ambush', label: 'Road ambush', weight: 10, kind: 'combat', enemyId: 'wild_hog' }
    ],
    normal: [
      { id: 'straight_path', label: 'Straight path', weight: 55, kind: 'none' },
      { id: 'passing_thought', label: 'Passing thought', weight: 20, kind: 'message', message: `You keep moving toward ${destinationAreaName}.` },
      { id: 'roadside_attack', label: 'Roadside attack', weight: 25, kind: 'combat', enemyId: 'wild_hog' }
    ],
    quick: [
      { id: 'fast_route', label: 'Fast route', weight: 40, kind: 'none' },
      { id: 'brisk_push', label: 'Brisk push', weight: 20, kind: 'message', message: `You hurry toward ${destinationAreaName}.` },
      { id: 'open_ambush', label: 'Open ambush', weight: 40, kind: 'combat', enemyId: 'wild_hog' }
    ]
  };
  return {
    id: style,
    label: labels[style],
    steps: style === 'careful' ? 2 : 1,
    eventPool: basePools[style]
  };
}

function createBlankTravelRoute(existingIds: string[], areaOptions: { value: string; label: string; zoneId: string }[]): DraftTravelRoute {
  const destination = areaOptions[0];
  const destinationName = destination?.label ?? 'destination';
  return {
    id: `travel_route_${existingIds.length + 1}`,
    destinationAreaId: destination?.value ?? '',
    label: `Travel to ${destinationName}`,
    styles: [
      createBlankTravelStyle('careful', destinationName),
      createBlankTravelStyle('normal', destinationName),
      createBlankTravelStyle('quick', destinationName)
    ]
  };
}

function TravelRouteEditor(props: {
  routes: DraftTravelRoute[];
  areaOptions: { value: string; label: string; zoneId: string }[];
  onChange: (routes: DraftTravelRoute[]) => void;
}) {
  const routes = props.routes ?? [];
  const updateRoute = (index: number, updater: (current: DraftTravelRoute) => DraftTravelRoute) => {
    props.onChange(routes.map((route, routeIndex) => (routeIndex === index ? updater(route) : route)));
  };
  const addRoute = () => {
    props.onChange([...routes, createBlankTravelRoute(routes.map((route) => route.id), props.areaOptions)]);
  };
  const removeRoute = (index: number) => {
    props.onChange(routes.filter((_, routeIndex) => routeIndex !== index));
  };

  return (
    <div className="stack">
      <div className="label-row">
        <span>Travel Routes</span>
        <button className="ghost compact" type="button" onClick={addRoute}>Add Route</button>
      </div>
      {routes.length > 0 ? (
        routes.map((route, index) => {
          const destinationName = props.areaOptions.find((option) => option.value === route.destinationAreaId)?.label ?? route.destinationAreaId ?? 'Unassigned';
          return (
            <div key={route.id} className="card activity-card">
              <div className="label-row">
                <strong>{route.label || route.id}</strong>
                <button className="ghost compact" type="button" onClick={() => removeRoute(index)}>Remove</button>
              </div>
              <TextField label="Id" value={route.id} onChange={(value) => updateRoute(index, (current) => ({ ...current, id: value }))} />
              <TextField label="Label" value={route.label} onChange={(value) => updateRoute(index, (current) => ({ ...current, label: value }))} />
              <SelectField
                label="Destination"
                value={route.destinationAreaId}
                options={[{ value: '', label: 'Choose area' }, ...props.areaOptions]}
                onChange={(value) => {
                  const destinationName = props.areaOptions.find((option) => option.value === value)?.label ?? value ?? 'destination';
                  updateRoute(index, (current) => ({
                    ...current,
                    destinationAreaId: value,
                    styles: current.styles.map((style) => createBlankTravelStyle(style.id, destinationName))
                  }));
                }}
              />
              <div className="muted">Destination: {destinationName}</div>
              <TravelStyleEditor
                styles={route.styles}
                destinationName={destinationName}
                onChange={(styles) => updateRoute(index, (current) => ({ ...current, styles }))}
              />
            </div>
          );
        })
      ) : (
        <div className="card">
          <strong>No travel routes yet</strong>
          <div className="muted">Add travel routes to turn area links into a short encounter chain.</div>
        </div>
      )}
    </div>
  );
}

function TravelStyleEditor(props: {
  styles: DraftTravelStyle[];
  destinationName: string;
  onChange: (styles: DraftTravelStyle[]) => void;
}) {
  const styles = props.styles?.length ? props.styles : (['careful', 'normal', 'quick'] as const).map((styleId) => createBlankTravelStyle(styleId, props.destinationName));
  return (
    <div className="stack">
      {styles.map((style, index) => {
        return (
          <div key={style.id} className="card">
            <strong>{style.label}</strong>
            <NumberField
              label="Steps"
              value={style.steps}
              onChange={(value) => props.onChange(styles.map((entry, entryIndex) => (entryIndex === index ? { ...entry, steps: value ?? entry.steps } : entry)))}
            />
            <JsonField
              label="Weighted Events"
              value={style.eventPool}
              onChange={(value) => props.onChange(styles.map((entry, entryIndex) => (entryIndex === index ? { ...entry, eventPool: value as DraftTravelRouteEvent[] } : entry)))}
            />
          </div>
        );
      })}
    </div>
  );
}

function RealmEditor(props: {
  realm: AdminRealmDraft;
  zoneOptions: { value: string; label: string; startingAreaId: string }[];
  areaOptions: { value: string; label: string; zoneId: string }[];
  onChange: (realm: AdminRealmDraft) => void;
}) {
  const realm = props.realm;
  const allowedAreaOptions = props.areaOptions.filter((option) => !realm.zoneIds.length || realm.zoneIds.includes(option.zoneId));
  const handleStartingZoneChange = (zoneId: string) => {
    const zone = props.zoneOptions.find((option) => option.value === zoneId);
    if (!zone) {
      props.onChange({ ...realm, startingZoneId: zoneId, startingAreaId: '' });
      return;
    }
    const zoneArea = props.areaOptions.find((option) => option.zoneId === zoneId && option.value === zone.startingAreaId) ?? props.areaOptions.find((option) => option.zoneId === zoneId);
    props.onChange({
      ...realm,
      startingZoneId: zoneId,
      startingAreaId: zoneArea?.value ?? ''
    });
  };
  const handleStartingAreaChange = (areaId: string) => {
    const area = props.areaOptions.find((option) => option.value === areaId);
    props.onChange({
      ...realm,
      startingAreaId: areaId,
      startingZoneId: area?.zoneId ?? realm.startingZoneId
    });
  };
  return (
    <div className="stack">
      <h3>Realm Details</h3>
      <TextField label="Id" value={realm.id} onChange={(value) => props.onChange({ ...realm, id: value })} />
      <TextField label="Name" value={realm.name} onChange={(value) => props.onChange({ ...realm, name: value })} />
      <TextAreaField label="Description" value={realm.description} onChange={(value) => props.onChange({ ...realm, description: value })} />
      <TextField
        label="Zone IDs"
        value={realm.zoneIds.join(', ')}
        onChange={(value) => props.onChange({ ...realm, zoneIds: value.split(',').map((entry) => entry.trim()).filter(Boolean) })}
      />
      <SelectField
        label="Starting Zone"
        value={realm.startingZoneId}
        options={[{ value: '', label: 'Choose zone' }, ...props.zoneOptions]}
        onChange={handleStartingZoneChange}
      />
      <SelectField
        label="Starting Area"
        value={realm.startingAreaId}
        options={[{ value: '', label: 'Choose area' }, ...allowedAreaOptions]}
        onChange={handleStartingAreaChange}
      />
    </div>
  );
}

function ZoneEditor(props: {
  zone: AdminZoneDraft;
  realmOptions: { value: string; label: string }[];
  areaOptions: { value: string; label: string }[];
  onChange: (zone: AdminZoneDraft) => void;
}) {
  const zone = props.zone;
  return (
    <div className="stack">
      <h3>Zone Details</h3>
      <TextField label="Id" value={zone.id} onChange={(value) => props.onChange({ ...zone, id: value })} />
      <TextField label="Name" value={zone.name} onChange={(value) => props.onChange({ ...zone, name: value })} />
      <SelectField label="Realm" value={zone.realmId} options={[{ value: '', label: 'Unassigned' }, ...props.realmOptions]} onChange={(value) => props.onChange({ ...zone, realmId: value })} />
      <TextAreaField label="Description" value={zone.description} onChange={(value) => props.onChange({ ...zone, description: value })} />
      <TextField
        label="Area IDs"
        value={zone.areaIds.join(', ')}
        onChange={(value) => props.onChange({ ...zone, areaIds: value.split(',').map((entry) => entry.trim()).filter(Boolean) })}
      />
      <SelectField label="Starting Area" value={zone.startingAreaId} options={[{ value: '', label: 'Choose area' }, ...props.areaOptions]} onChange={(value) => props.onChange({ ...zone, startingAreaId: value })} />
    </div>
  );
}

function EventEditor(props: {
  event: AdminEventDraft;
  areaOptions: { value: string; label: string }[];
  onChange: (event: AdminEventDraft) => void;
}) {
  const event = props.event;
  return (
    <div className="stack">
      <h3>Event Details</h3>
      <TextField label="Id" value={event.id} onChange={(value) => props.onChange({ ...event, id: value })} />
      <TextField label="Name" value={event.name} onChange={(value) => props.onChange({ ...event, name: value })} />
      <SelectField label="Area" value={event.areaId} options={[{ value: '', label: 'Unassigned' }, ...props.areaOptions]} onChange={(value) => props.onChange({ ...event, areaId: value })} />
      <TextField label="Activity Id" value={event.activityId} onChange={(value) => props.onChange({ ...event, activityId: value })} />
      <TextAreaField label="Description" value={event.description} onChange={(value) => props.onChange({ ...event, description: value })} />
      <JsonField label="Choices" value={event.choices} onChange={(value) => props.onChange({ ...event, choices: value as DraftEventChoice[] })} />
    </div>
  );
}

function RecipeEditor(props: {
  recipe: AdminRecipeDraft;
  onChange: (recipe: AdminRecipeDraft) => void;
}) {
  const recipe = props.recipe;
  return (
    <div className="stack">
      <h3>Recipe Details</h3>
      <TextField label="Id" value={recipe.id} onChange={(value) => props.onChange({ ...recipe, id: value })} />
      <TextField label="Name" value={recipe.name} onChange={(value) => props.onChange({ ...recipe, name: value })} />
      <TextField label="Station" value={recipe.station} onChange={(value) => props.onChange({ ...recipe, station: value })} />
      <TextField label="Category" value={recipe.category} onChange={(value) => props.onChange({ ...recipe, category: value })} />
      <NumberField label="Required Level" value={recipe.requiredLevel} onChange={(value) => props.onChange({ ...recipe, requiredLevel: value ?? 0 })} />
      <JsonField label="Ingredients" value={recipe.ingredients} onChange={(value) => props.onChange({ ...recipe, ingredients: value as { itemId: string; quantity: number }[] })} />
      <JsonField label="Outputs" value={recipe.outputs} onChange={(value) => props.onChange({ ...recipe, outputs: value as { itemId: string; quantity: number }[] })} />
      <TextField label="Requirements" value={recipe.requirements.join(', ')} onChange={(value) => props.onChange({ ...recipe, requirements: value.split(',').map((entry) => entry.trim()).filter(Boolean) })} />
    </div>
  );
}

function ActivityEditor(props: {
  activities: DraftAreaActivity[];
  onChange: (activities: DraftAreaActivity[]) => void;
}) {
  const activities = props.activities;
  const updateActivity = (index: number, updater: (current: DraftAreaActivity) => DraftAreaActivity) => {
    props.onChange(activities.map((activity, activityIndex) => (activityIndex === index ? updater(activity) : activity)));
  };
  const addActivity = () => {
    props.onChange([
      ...activities,
      { id: `activity_${activities.length + 1}`, label: 'New Activity', kind: 'scripted', action: 'message', message: '', params: {} }
    ]);
  };
  const removeActivity = (index: number) => {
    props.onChange(activities.filter((_, activityIndex) => activityIndex !== index));
  };

  return (
    <div className="stack">
      <div className="label-row">
        <span>Activities</span>
        <button className="ghost compact" type="button" onClick={addActivity}>Add Activity</button>
      </div>
      {activities.length > 0 ? (
        activities.map((activity, index) => (
          <div key={activity.id} className="card activity-card">
            <div className="label-row">
              <strong>{activity.label || activity.id}</strong>
              <button className="ghost compact" type="button" onClick={() => removeActivity(index)}>Remove</button>
            </div>
            <TextField label="Id" value={activity.id} onChange={(value) => updateActivity(index, (current) => ({ ...current, id: value }))} />
            <TextField label="Label" value={activity.label} onChange={(value) => updateActivity(index, (current) => ({ ...current, label: value }))} />
            <SelectField
              label="Kind"
              value={activity.kind}
              options={[
                { value: 'scripted', label: 'Scripted' },
                { value: 'travel', label: 'Travel' },
                { value: 'event', label: 'Event' },
                { value: 'message', label: 'Message' },
                { value: 'leave', label: 'Leave' }
              ]}
              onChange={(value) => updateActivity(index, (current) => ({ ...current, kind: value }))}
            />
            <SelectField
              label="Action"
              value={activity.action}
              options={[
                { value: 'searchCamp', label: 'Search Camp' },
                { value: 'travel', label: 'Travel' },
                { value: 'returnToTower', label: 'Return to Tower' },
                { value: 'returnToCamp', label: 'Return to Camp' },
                { value: 'harvestTree', label: 'Harvest Tree' },
                { value: 'searchWoods', label: 'Search Woods' },
                { value: 'fish', label: 'Fish' },
                { value: 'grantItem', label: 'Grant Item' },
                { value: 'message', label: 'Message' },
                { value: 'event', label: 'Event' },
                { value: 'leave', label: 'Leave' }
              ]}
              onChange={(value) => updateActivity(index, (current) => ({ ...current, action: value }))}
            />
            <TextField label="Message" value={activity.message ?? ''} onChange={(value) => updateActivity(index, (current) => ({ ...current, message: value }))} />
            <TextField label="Destination Area" value={activity.destinationAreaId ?? ''} onChange={(value) => updateActivity(index, (current) => ({ ...current, destinationAreaId: value }))} />
            <TextField label="Event Id" value={activity.eventId ?? ''} onChange={(value) => updateActivity(index, (current) => ({ ...current, eventId: value }))} />
            <TextField label="Script Id" value={activity.scriptId ?? ''} onChange={(value) => updateActivity(index, (current) => ({ ...current, scriptId: value }))} />
            <JsonField label="Params" value={activity.params ?? {}} onChange={(value) => updateActivity(index, (current) => ({ ...current, params: value as Record<string, string | number | boolean | null> }))} />
          </div>
        ))
      ) : (
        <div className="card">
          <strong>No activities yet</strong>
          <div className="muted">Add activities to define what the player can do in this area.</div>
        </div>
      )}
    </div>
  );
}

function ExportSection(props: { exportData: ReturnType<typeof exportAdminDrafts> }) {
  return (
    <div className="stack">
      <div className="card">
        <strong>Expedition Export</strong>
        <div className="muted">Copy the current content state into a file or paste it into future import tooling.</div>
      </div>
      <ExportBlock label="Realms" value={props.exportData.realms} />
      <ExportBlock label="Items" value={props.exportData.items} />
      <ExportBlock label="Enemies" value={props.exportData.enemies} />
      <ExportBlock label="Zones" value={props.exportData.zones} />
      <ExportBlock label="Areas" value={props.exportData.areas} />
      <ExportBlock label="Recipes" value={props.exportData.recipes} />
      <ExportBlock label="Events" value={props.exportData.events} />
      <ExportBlock label="Expeditions" value={props.exportData.expeditions} />
    </div>
  );
}

function ExportBlock(props: { label: string; value: unknown }) {
  const text = JSON.stringify(props.value, null, 2);
  return (
    <div className="card">
      <div className="label-row">
        <span>{props.label}</span>
        <button className="ghost compact" onClick={() => navigator.clipboard.writeText(text)}>Copy JSON</button>
      </div>
      <textarea className="admin-json" readOnly value={text} />
    </div>
  );
}

function TextField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  );
}

function SelectField(props: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <select value={props.value} onChange={(event) => props.onChange(event.target.value)}>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField(props: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        type="number"
        value={props.value ?? ''}
        onChange={(event) => {
          const next = event.target.value;
          props.onChange(next === '' ? null : Number(next));
        }}
      />
    </label>
  );
}

function TextAreaField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <textarea rows={4} value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  );
}

function JsonField(props: { label: string; value: unknown; onChange: (value: unknown) => void }) {
  const [text, setText] = useState(JSON.stringify(props.value ?? [], null, 2));
  const [error, setError] = useState('');

  useEffect(() => {
    setText(JSON.stringify(props.value ?? [], null, 2));
    setError('');
  }, [props.value]);

  const apply = () => {
    try {
      props.onChange(JSON.parse(text));
      setError('');
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <label className="field">
      <span>{props.label}</span>
      <textarea rows={6} value={text} onChange={(event) => setText(event.target.value)} onBlur={apply} />
      <div className="label-row">
        <span className="muted">Edit as JSON</span>
        <button className="ghost compact" type="button" onClick={apply}>Apply</button>
      </div>
      {error ? <div className="muted">{error}</div> : null}
    </label>
  );
}
