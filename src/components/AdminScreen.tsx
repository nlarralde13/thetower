import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createBlankAreaDraft,
  createBlankEnemyDraft,
  createBlankEventDraft,
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
  type AdminItemDraft,
  type AdminRealmDraft,
  type AdminRecipeDraft,
  type AdminZoneDraft,
  type DraftAreaActivity,
  type DraftAreaPoolEntry,
  type DraftEventChoice,
  type DraftGuaranteedDrop,
  type DraftLootEntry
} from '../adminDrafts';

type AdminSection = 'realms' | 'items' | 'enemies' | 'zones' | 'areas' | 'recipes' | 'events' | 'export';

type AdminScreenProps = {
  drafts: AdminDrafts;
  onChange: (updater: (current: AdminDrafts) => AdminDrafts) => void;
  onReset: () => void;
  onReload: () => void;
  onBack: () => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  syncState: 'loading' | 'ready' | 'saving' | 'error';
  syncError: string | null;
  contentStatusLabel: string;
};

const sectionMeta: Record<AdminSection, { label: string; description: string }> = {
  realms: { label: 'Realm Builder', description: 'Create and edit realms and their zone attachments.' },
  zones: { label: 'Zone Builder', description: 'Attach areas to zones and pick each zone’s starting area.' },
  areas: { label: 'Area Builder', description: 'Edit realms, zones, activities, encounter pools, and requirements.' },
  events: { label: 'Event Builder', description: 'Edit event text, choices, rewards, and area attachment.' },
  enemies: { label: 'Enemy Builder', description: 'Edit enemy stats, loot tables, and guaranteed drops.' },
  items: { label: 'Item Builder', description: 'Create and edit equipment, tools, materials, and consumables.' },
  recipes: { label: 'Crafting Builder', description: 'Edit crafting recipes, stations, and ingredient/output rules.' },
  export: { label: 'Expedition Export', description: 'Copy the current content state as JSON.' }
};

export function AdminScreen(props: AdminScreenProps) {
  const [section, setSection] = useState<AdminSection>('realms');
  const [selectedIds, setSelectedIds] = useState({
    realmId: props.drafts.realms[0]?.id ?? '',
    itemId: props.drafts.items[0]?.id ?? '',
    enemyId: props.drafts.enemies[0]?.id ?? '',
    zoneId: props.drafts.zones[0]?.id ?? '',
    areaId: props.drafts.areas[0]?.id ?? '',
    recipeId: props.drafts.recipes[0]?.id ?? '',
    eventId: props.drafts.events[0]?.id ?? ''
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
  }, [props.drafts, selectedIds]);

  const exportData = exportAdminDrafts(props.drafts);
  const deleteWarnings = useMemo(() => ({
    realms: selectedIds.realmId ? getDeleteSafetyNotes(props.drafts, 'realms', selectedIds.realmId) : [],
    items: selectedIds.itemId ? getDeleteSafetyNotes(props.drafts, 'items', selectedIds.itemId) : [],
    enemies: selectedIds.enemyId ? getDeleteSafetyNotes(props.drafts, 'enemies', selectedIds.enemyId) : [],
    zones: selectedIds.zoneId ? getDeleteSafetyNotes(props.drafts, 'zones', selectedIds.zoneId) : [],
    areas: selectedIds.areaId ? getDeleteSafetyNotes(props.drafts, 'areas', selectedIds.areaId) : [],
    recipes: selectedIds.recipeId ? getDeleteSafetyNotes(props.drafts, 'recipes', selectedIds.recipeId) : [],
    events: selectedIds.eventId ? getDeleteSafetyNotes(props.drafts, 'events', selectedIds.eventId) : []
  }), [props.drafts, selectedIds]);
  const currentSelection = useMemo(() => {
    switch (section) {
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
          <h2>Build the expedition loop</h2>
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
          <button className="ghost" onClick={props.onBack}>Back to Game</button>
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
            {(['realms', 'zones', 'areas', 'events', 'enemies', 'items', 'recipes', 'export'] as AdminSection[]).map((key) => (
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
      <ActivityEditor activities={area.activities} onChange={(activities) => props.onChange({ ...area, activities })} />
      <JsonField label="Enemy Pool" value={area.enemyPool} onChange={(value) => props.onChange({ ...area, enemyPool: value as DraftAreaPoolEntry[] })} />
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
