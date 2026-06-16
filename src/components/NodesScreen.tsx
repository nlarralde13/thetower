import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  type AdminAreaDraft,
  type AdminDrafts,
  type AdminEnemyDraft,
  type AdminEventDraft,
  type DraftTravelRoute
} from '../adminDrafts';

type NodeKind = 'area' | 'travel' | 'event' | 'encounter' | 'note';

type ExpeditionNode = {
  id: string;
  kind: NodeKind;
  title: string;
  summary: string;
  sourceType: string;
  sourceId: string;
  weight: number;
  enabled: boolean;
  meta: Record<string, string | number | boolean | null>;
};

type ZoneChainDraft = {
  zoneId: string;
  title: string;
  nodes: ExpeditionNode[];
  selectedNodeId: string;
  updatedAt: number;
};

type ChainStore = Record<string, ZoneChainDraft>;

const STORAGE_KEY = 'thetower-node-chains-v1';
const NODE_WIDTH = 260;
const NODE_HEIGHT = 168;
const NODE_GAP_X = 90;
const NODE_GAP_Y = 76;
const GRAPH_PADDING = 32;
const GRAPH_COLUMNS = 3;

function loadChainStore(): ChainStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ChainStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveChainStore(store: ChainStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function createId(prefix: string, existingIds: string[]) {
  let index = 1;
  let id = `${prefix}_${index}`;
  while (existingIds.includes(id)) {
    index += 1;
    id = `${prefix}_${index}`;
  }
  return id;
}

function summarizeRoute(route: DraftTravelRoute) {
  return route.styles
    .map((style) => `${style.label} ${style.steps} step${style.steps === 1 ? '' : 's'}`)
    .join(' · ');
}

function findArea(drafts: AdminDrafts, areaId: string) {
  return drafts.areas.find((area) => area.id === areaId) ?? null;
}

function findEnemy(drafts: AdminDrafts, enemyId: string) {
  return drafts.enemies.find((enemy) => enemy.id === enemyId) ?? null;
}

function getZoneChainTitle(zoneName: string) {
  return `${zoneName} Expedition`;
}

function createAreaNode(area: AdminAreaDraft): ExpeditionNode {
  return {
    id: `area_${area.id}`,
    kind: 'area',
    title: area.name,
    summary: area.description,
    sourceType: 'area',
    sourceId: area.id,
    weight: 100,
    enabled: true,
    meta: {
      areaId: area.id,
      zoneId: area.zoneId,
      realmId: area.realmId,
      recommendedLevel: area.recommendedLevel
    }
  };
}

function createTravelNode(route: DraftTravelRoute, fromArea: AdminAreaDraft, destinationArea: AdminAreaDraft | null): ExpeditionNode {
  return {
    id: `travel_${route.id}`,
    kind: 'travel',
    title: route.label,
    summary: `${fromArea.name} to ${destinationArea?.name ?? route.destinationAreaId}`,
    sourceType: 'travel',
    sourceId: route.id,
    weight: 90,
    enabled: true,
    meta: {
      fromAreaId: fromArea.id,
      destinationAreaId: route.destinationAreaId,
      routeId: route.id,
      styles: route.styles.length
    }
  };
}

function createEventNode(event: AdminEventDraft, area: AdminAreaDraft | null): ExpeditionNode {
  return {
    id: `event_${event.id}`,
    kind: 'event',
    title: event.name,
    summary: event.description,
    sourceType: 'event',
    sourceId: event.id,
    weight: 80,
    enabled: true,
    meta: {
      areaId: area?.id ?? event.areaId,
      eventId: event.id,
      choices: event.choices.length
    }
  };
}

function createEncounterNode(area: AdminAreaDraft, enemy: AdminEnemyDraft, weight: number): ExpeditionNode {
  return {
    id: `encounter_${area.id}_${enemy.id}`,
    kind: 'encounter',
    title: `${enemy.name} Encounter`,
    summary: `${area.name} · weight ${weight}`,
    sourceType: 'encounter',
    sourceId: `${area.id}:${enemy.id}`,
    weight,
    enabled: true,
    meta: {
      areaId: area.id,
      enemyId: enemy.id,
      enemyLevel: enemy.level
    }
  };
}

function createNoteNode() {
  return {
    id: 'note_1',
    kind: 'note' as const,
    title: 'Note',
    summary: 'Write a custom beat for this chain.',
    sourceType: 'note',
    sourceId: 'note',
    weight: 50,
    enabled: true,
    meta: {}
  };
}

function seedChainForZone(zoneId: string, drafts: AdminDrafts): ZoneChainDraft {
  const zone = drafts.zones.find((entry) => entry.id === zoneId) ?? drafts.zones[0] ?? null;
  const zoneAreas = drafts.areas.filter((area) => area.zoneId === zoneId);
  const startArea = drafts.areas.find((area) => area.id === zone?.startingAreaId) ?? zoneAreas[0] ?? null;
  const nodes = startArea ? [createAreaNode(startArea)] : [];
  return {
    zoneId,
    title: zone ? getZoneChainTitle(zone.name) : 'Expedition Chain',
    nodes,
    selectedNodeId: nodes[0]?.id ?? '',
    updatedAt: Date.now()
  };
}

function insertNode(chain: ZoneChainDraft, node: ExpeditionNode, afterNodeId?: string) {
  const next = [...chain.nodes];
  const nextNode = {
    ...node,
    id: createId(node.id, next.map((entry) => entry.id))
  };
  const insertAt = afterNodeId ? Math.max(0, next.findIndex((entry) => entry.id === afterNodeId) + 1) : next.length;
  next.splice(insertAt, 0, nextNode);
  return {
    ...chain,
    nodes: next,
    selectedNodeId: nextNode.id,
    updatedAt: Date.now()
  };
}

function updateNode(chain: ZoneChainDraft, nodeId: string, updater: (node: ExpeditionNode) => ExpeditionNode) {
  return {
    ...chain,
    nodes: chain.nodes.map((node) => (node.id === nodeId ? updater(node) : node)),
    updatedAt: Date.now()
  };
}

function removeNode(chain: ZoneChainDraft, nodeId: string) {
  const nodes = chain.nodes.filter((node) => node.id !== nodeId);
  return {
    ...chain,
    nodes,
    selectedNodeId: chain.selectedNodeId === nodeId ? nodes[0]?.id ?? '' : chain.selectedNodeId,
    updatedAt: Date.now()
  };
}

function moveNode(chain: ZoneChainDraft, nodeId: string, delta: number) {
  const index = chain.nodes.findIndex((node) => node.id === nodeId);
  if (index < 0) return chain;
  const target = index + delta;
  if (target < 0 || target >= chain.nodes.length) return chain;
  const nodes = [...chain.nodes];
  const [node] = nodes.splice(index, 1);
  nodes.splice(target, 0, node);
  return { ...chain, nodes, updatedAt: Date.now() };
}

function getNodePosition(index: number) {
  const row = Math.floor(index / GRAPH_COLUMNS);
  const isOddRow = row % 2 === 1;
  const column = index % GRAPH_COLUMNS;
  const visualColumn = isOddRow ? GRAPH_COLUMNS - column - 1 : column;
  return {
    x: GRAPH_PADDING + visualColumn * (NODE_WIDTH + NODE_GAP_X),
    y: GRAPH_PADDING + row * (NODE_HEIGHT + NODE_GAP_Y)
  };
}

function getGraphSize(nodeCount: number) {
  const rows = Math.max(1, Math.ceil(nodeCount / GRAPH_COLUMNS));
  return {
    width: GRAPH_PADDING * 2 + GRAPH_COLUMNS * NODE_WIDTH + (GRAPH_COLUMNS - 1) * NODE_GAP_X,
    height: GRAPH_PADDING * 2 + rows * NODE_HEIGHT + (rows - 1) * NODE_GAP_Y
  };
}

function getNodeStyle(index: number): CSSProperties {
  const position = getNodePosition(index);
  return {
    left: position.x,
    top: position.y,
    width: NODE_WIDTH,
    minHeight: NODE_HEIGHT
  };
}

export function NodesScreen(props: {
  drafts: AdminDrafts;
  syncState: 'loading' | 'ready' | 'saving' | 'error';
  syncError: string | null;
  contentStatusLabel: string;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onBackToGame: () => void;
  onBackToAdmin: () => void;
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(props.drafts.zones[0]?.id ?? '');
  const [store, setStore] = useState<ChainStore>(() => loadChainStore());

  useEffect(() => {
    saveChainStore(store);
  }, [store]);

  useEffect(() => {
    if (!props.drafts.zones.some((zone) => zone.id === selectedZoneId)) {
      setSelectedZoneId(props.drafts.zones[0]?.id ?? '');
    }
  }, [props.drafts.zones, selectedZoneId]);

  useEffect(() => {
    if (!selectedZoneId) return;
    setStore((current) => {
      if (current[selectedZoneId]) return current;
      const zone = props.drafts.zones.find((entry) => entry.id === selectedZoneId) ?? props.drafts.zones[0] ?? null;
      if (!zone) return current;
      return {
        ...current,
        [selectedZoneId]: seedChainForZone(selectedZoneId, props.drafts)
      };
    });
  }, [props.drafts, selectedZoneId]);

  const activeZone = props.drafts.zones.find((zone) => zone.id === selectedZoneId) ?? props.drafts.zones[0] ?? null;
  const activeChain = (selectedZoneId && store[selectedZoneId]) || (activeZone ? seedChainForZone(activeZone.id, props.drafts) : null);

  const zoneAreas = useMemo(() => props.drafts.areas.filter((area) => area.zoneId === activeZone?.id), [activeZone?.id, props.drafts.areas]);
  const areaIds = new Set(zoneAreas.map((area) => area.id));
  const zoneEvents = props.drafts.events.filter((event) => areaIds.has(event.areaId));
  const zoneRoutes = zoneAreas.flatMap((area) => (area.travelRoutes?.length ? area.travelRoutes : []));
  const zoneEncounters = zoneAreas.flatMap((area) =>
    area.enemyPool.flatMap((entry) => {
      const enemy = findEnemy(props.drafts, entry.enemyId);
      return enemy ? [createEncounterNode(area, enemy, entry.weight)] : [];
    })
  );
  const selectedNode =
    activeChain?.nodes.find((node) => node.id === activeChain.selectedNodeId) ??
    activeChain?.nodes[0] ??
    null;
  const graphSize = getGraphSize(activeChain?.nodes.length ?? 0);

  const updateActiveChain = (updater: (chain: ZoneChainDraft) => ZoneChainDraft) => {
    if (!activeZone) return;
    setStore((current) => {
      const chain = current[activeZone.id] ?? seedChainForZone(activeZone.id, props.drafts);
      return {
        ...current,
        [activeZone.id]: updater(chain)
      };
    });
  };

  const addNode = (node: ExpeditionNode) => {
    if (!activeChain) return;
    updateActiveChain((chain) => insertNode(chain, node, chain.selectedNodeId || undefined));
  };

  const addStartNode = () => {
    if (!activeZone) return;
    const startArea =
      props.drafts.areas.find((area) => area.id === activeZone.startingAreaId && area.zoneId === activeZone.id) ??
      zoneAreas[0] ??
      null;
    if (!startArea) return;
    addNode(createAreaNode(startArea));
  };

  const addAreaNode = (area: AdminAreaDraft) => addNode(createAreaNode(area));
  const addRouteNode = (route: DraftTravelRoute) => {
    const origin = findArea(props.drafts, zoneAreas.find((area) => area.travelRoutes?.some((entry) => entry.id === route.id))?.id ?? '') ?? zoneAreas[0] ?? null;
    const destination = findArea(props.drafts, route.destinationAreaId);
    if (!origin) return;
    addNode(createTravelNode(route, origin, destination));
  };
  const addEventNode = (event: AdminEventDraft) => {
    addNode(createEventNode(event, findArea(props.drafts, event.areaId)));
  };
  const addEncounterNode = (area: AdminAreaDraft, entry: { enemyId: string; weight: number }) => {
    const enemy = findEnemy(props.drafts, entry.enemyId);
    if (!enemy) return;
    addNode(createEncounterNode(area, enemy, entry.weight));
  };

  const exportText = JSON.stringify(activeChain, null, 2);

  return (
    <section className="nodes-page">
      <header className="nodes-header">
        <div className="stack">
          <span className="eyebrow">Node Editor</span>
          <h1>Expedition Nodes</h1>
          <div className="muted">Compose area, road, event, and encounter chains from the DB-backed content.</div>
          <div className="muted">Sync state: {props.syncState}{props.syncError ? ` · ${props.syncError}` : ''}</div>
          <div className="muted">{props.contentStatusLabel}</div>
        </div>
        <div className="nodes-header-actions">
          <button className="ghost compact" onClick={props.onToggleTheme} aria-pressed={props.themeMode === 'dark'}>
            <span className="eyebrow">Theme</span>
            <strong>{props.themeMode === 'dark' ? 'Dark mode' : 'Light mode'}</strong>
          </button>
          <button className="secondary" onClick={props.onBackToAdmin}>Back to Builder</button>
          <button className="secondary" onClick={props.onBackToGame}>Back to Game</button>
        </div>
      </header>

      <div className="nodes-layout">
        <aside className="nodes-tools">
          <div className="stack">
            <div className="section-heading">
              <span className="eyebrow">Tools</span>
              <h2>Zone Palette</h2>
            </div>
            <label className="field">
              <span>Zone</span>
              <select value={selectedZoneId} onChange={(event) => setSelectedZoneId(event.target.value)}>
                {props.drafts.zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </label>
            <div className="card nodes-summary">
              <strong>{activeZone?.name ?? 'No zone selected'}</strong>
              <div className="muted">{activeZone?.description ?? 'Pick a zone to build an expedition chain.'}</div>
              <div className="chips">
                <span className="chip">{zoneAreas.length} areas</span>
                <span className="chip">{zoneEvents.length} events</span>
                <span className="chip">{zoneRoutes.length} roads</span>
                <span className="chip">{zoneEncounters.length} encounters</span>
              </div>
            </div>
            <div className="nodes-tool-group">
              <div className="label-row">
                <span>Areas</span>
                <button className="ghost compact" onClick={addStartNode}>Add Start</button>
              </div>
              <div className="nodes-source-list">
                {zoneAreas.map((area) => (
                  <button key={area.id} className="card nodes-source-button" onClick={() => addAreaNode(area)}>
                    <strong>{area.name}</strong>
                    <div className="muted">{area.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="nodes-tool-group">
              <div className="label-row">
                <span>Roads</span>
                <span className="muted">Travel routes</span>
              </div>
              <div className="nodes-source-list">
                {zoneRoutes.length > 0 ? (
                  zoneRoutes.map((route) => {
                    const origin = zoneAreas.find((area) => area.travelRoutes?.some((entry) => entry.id === route.id)) ?? null;
                    const destination = findArea(props.drafts, route.destinationAreaId);
                    return (
                      <button key={route.id} className="card nodes-source-button" onClick={() => addRouteNode(route)}>
                        <strong>{route.label}</strong>
                        <div className="muted">{origin?.name ?? 'Unknown origin'} to {destination?.name ?? route.destinationAreaId}</div>
                        <div className="muted">{summarizeRoute(route)}</div>
                      </button>
                    );
                  })
                ) : (
                  <div className="card"><strong>No routes found</strong></div>
                )}
              </div>
            </div>
            <div className="nodes-tool-group">
              <div className="label-row">
                <span>Events</span>
                <span className="muted">Area events</span>
              </div>
              <div className="nodes-source-list">
                {zoneEvents.length > 0 ? (
                  zoneEvents.map((event) => {
                    const area = findArea(props.drafts, event.areaId);
                    return (
                      <button key={event.id} className="card nodes-source-button" onClick={() => addEventNode(event)}>
                        <strong>{event.name}</strong>
                        <div className="muted">{area?.name ?? event.areaId}</div>
                        <div className="muted">{event.description}</div>
                      </button>
                    );
                  })
                ) : (
                  <div className="card"><strong>No events in zone</strong></div>
                )}
              </div>
            </div>
            <div className="nodes-tool-group">
              <div className="label-row">
                <span>Encounters</span>
                <span className="muted">Area enemy pools</span>
              </div>
              <div className="nodes-source-list">
                {zoneEncounters.length > 0 ? (
                  zoneAreas.map((area) => (
                    <div key={area.id} className="stack">
                      {area.enemyPool.map((entry) => {
                        const enemy = findEnemy(props.drafts, entry.enemyId);
                        if (!enemy) return null;
                        return (
                          <button key={`${area.id}:${entry.enemyId}`} className="card nodes-source-button" onClick={() => addEncounterNode(area, entry)}>
                            <strong>{enemy.name}</strong>
                            <div className="muted">{area.name}</div>
                            <div className="muted">Weight {entry.weight}</div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="card"><strong>No encounters in zone</strong></div>
                )}
              </div>
            </div>
            <div className="nodes-tool-group">
              <div className="label-row">
                <span>Manual</span>
                <span className="muted">Custom notes</span>
              </div>
              <button className="card nodes-source-button" onClick={() => addNode(createNoteNode())}>
                <strong>Add Note</strong>
                <div className="muted">Insert a manual beat into the chain.</div>
              </button>
            </div>
          </div>
        </aside>

        <main className="nodes-canvas">
          <div className="label-row">
            <span>Chain</span>
            <div className="nodes-canvas-actions">
              <button className="ghost compact" onClick={() => activeZone && setStore((current) => ({ ...current, [activeZone.id]: seedChainForZone(activeZone.id, props.drafts) }))}>
                Reset Zone
              </button>
              <button className="ghost compact" onClick={() => navigator.clipboard.writeText(exportText)}>Copy JSON</button>
            </div>
          </div>
          {activeChain ? (
            <div className="nodes-graph-scroll">
              <div className="nodes-graph" style={{ width: graphSize.width, height: graphSize.height }}>
                <svg className="nodes-edges" viewBox={`0 0 ${graphSize.width} ${graphSize.height}`} aria-hidden="true">
                  <defs>
                    <marker id="nodes-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                  </defs>
                  {activeChain.nodes.slice(0, -1).map((node, index) => {
                    const start = getNodePosition(index);
                    const end = getNodePosition(index + 1);
                    const startX = start.x + NODE_WIDTH / 2;
                    const startY = start.y + NODE_HEIGHT / 2;
                    const endX = end.x + NODE_WIDTH / 2;
                    const endY = end.y + NODE_HEIGHT / 2;
                    const controlX = startX + (endX - startX) / 2;
                    return (
                      <path
                        key={`${node.id}-edge`}
                        className="nodes-edge"
                        d={`M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`}
                        markerEnd="url(#nodes-arrow)"
                      />
                    );
                  })}
                </svg>
                {activeChain.nodes.map((node, index) => (
                  <div
                    key={node.id}
                    className={node.id === activeChain.selectedNodeId ? 'card nodes-node selected' : 'card nodes-node'}
                    style={getNodeStyle(index)}
                    onClick={() => updateActiveChain((chain) => ({ ...chain, selectedNodeId: node.id, updatedAt: Date.now() }))}
                  >
                    <div className="nodes-node-top">
                      <span className={`chip nodes-kind nodes-kind-${node.kind}`}>{node.kind}</span>
                      <span className="muted">Weight {node.weight}</span>
                    </div>
                    <strong>{node.title}</strong>
                    <div className="muted">{node.summary}</div>
                    <div className="muted">{node.sourceType}: {node.sourceId}</div>
                    <div className="nodes-node-actions">
                      <button className="ghost compact" type="button" onClick={(event) => { event.stopPropagation(); updateActiveChain((chain) => ({ ...chain, selectedNodeId: node.id })); }}>Select</button>
                      <button className="ghost compact" type="button" onClick={(event) => { event.stopPropagation(); updateActiveChain((chain) => moveNode(chain, node.id, -1)); }}>Up</button>
                      <button className="ghost compact" type="button" onClick={(event) => { event.stopPropagation(); updateActiveChain((chain) => moveNode(chain, node.id, 1)); }}>Down</button>
                      <button className="ghost compact danger" type="button" onClick={(event) => { event.stopPropagation(); updateActiveChain((chain) => removeNode(chain, node.id)); }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card"><strong>No zone chain available.</strong></div>
          )}
        </main>

        <aside className="nodes-inspector">
          <div className="stack">
            <div className="section-heading">
              <span className="eyebrow">Inspector</span>
              <h2>{selectedNode?.title ?? 'No node selected'}</h2>
            </div>
            {selectedNode ? (
              <>
                <label className="field">
                  <span>Title</span>
                  <input
                    value={selectedNode.title}
                    onChange={(event) => updateActiveChain((chain) => updateNode(chain, selectedNode.id, (node) => ({ ...node, title: event.target.value })))}
                  />
                </label>
                <label className="field">
                  <span>Summary</span>
                  <textarea
                    rows={5}
                    value={selectedNode.summary}
                    onChange={(event) => updateActiveChain((chain) => updateNode(chain, selectedNode.id, (node) => ({ ...node, summary: event.target.value })))}
                  />
                </label>
                <label className="field">
                  <span>Weight</span>
                  <input
                    type="number"
                    value={selectedNode.weight}
                    onChange={(event) => updateActiveChain((chain) => updateNode(chain, selectedNode.id, (node) => ({ ...node, weight: Number(event.target.value) || 0 })))}
                  />
                </label>
                <label className="field">
                  <span>Enabled</span>
                  <select
                    value={selectedNode.enabled ? 'true' : 'false'}
                    onChange={(event) => updateActiveChain((chain) => updateNode(chain, selectedNode.id, (node) => ({ ...node, enabled: event.target.value === 'true' })))}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </label>
                <div className="card">
                  <strong>Source</strong>
                  <div className="muted">{selectedNode.sourceType}</div>
                  <div className="muted">{selectedNode.sourceId}</div>
                  <pre className="nodes-json">{JSON.stringify(selectedNode.meta, null, 2)}</pre>
                </div>
              </>
            ) : (
              <div className="card">
                <strong>Select a node</strong>
                <div className="muted">Click a node in the chain to inspect or edit it.</div>
              </div>
            )}
            <div className="card">
              <strong>Chain JSON</strong>
              <div className="muted">This is the local draft representation for the selected zone.</div>
              <textarea className="nodes-json" readOnly value={exportText} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
