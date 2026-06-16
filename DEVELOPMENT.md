# Development Guide

## Product Direction

The core loop is moving away from direct realm/zone portal selection and toward an expedition-first structure.

The player-facing flow should become:

```text
Village -> Tower -> Expedition Board -> Select Expedition -> Travel -> Explore -> Encounter Events -> Gather Resources -> Return Home -> Progress Character -> Repeat
```

Realms, zones, areas, and events remain the underlying content model. Expeditions become the authored package that exposes that content to the player.

## Project Shape

The frontend is a React/Vite app with game state and content definitions in `src/`. The local content API lives in `server/`.

Important files:

- `src/App.tsx`: main game UI and runtime flow.
- `src/game.ts`: runtime types, content indexes, game helpers, inventory, travel, combat, and save/load helpers.
- `src/adminDrafts.ts`: admin draft types, default content normalization, runtime content conversion, serialization, and validation.
- `src/components/AdminScreen.tsx`: admin builder UI, including the Test Expedition Wizard.
- `src/components/NodesScreen.tsx`: visual expedition node editor.
- `src/useAdminDrafts.ts`: API sync hook for loading, saving, and resetting content.
- `server/index.mjs`: local API server.
- `server/content-store.mjs`: SQLite-backed content store and mirrored JSON writer.
- `src/data/*.json`: source content files.
- `src/data/expeditions.json`: first-class expedition records.

## Content Model

The world model remains layered:

```text
Realm -> Zone -> Area -> Event
```

Expected meanings:

- Realm: an entire plane of existence.
- Zone: a large region inside a realm.
- Area: a specific location inside a zone.
- Event: an interaction, encounter, discovery, combat, resource node, quest moment, or story beat.

Expeditions sit above this model. An expedition points into a realm/zone and defines the route, requirements, risks, and reward expectations.

## Expedition Model Target

An expedition currently defines:

- destination realm
- destination zone
- recommended level
- skill requirements
- quest requirements
- key or artifact requirements
- travel encounter pool
- potential rewards
- starting area or travel entry point

Return behavior is still handled by the existing Return Band/game flow rather than the expedition record itself.

Example expedition IDs/names:

- `verdant_expanse_survey`
- `deep_woods_lumber_run`
- `missing_merchant_investigation`
- `sunken_library_expedition`

## Travel Chain Target

Travel should not be instant. Selecting an expedition should produce or load a travel chain, usually 3-6 interactions long.

Travel chain examples:

```text
Abandoned Camp -> Quiet Trail -> Wild Hog Ambush -> Dropped Backpack -> Herb Patch -> Cluster of Trees
```

Travel encounters may include:

- combat
- resource nodes
- lore discoveries
- merchants
- random finds
- environmental flavor

The current travel route system already has weighted travel events, but it is still area-to-area oriented. The next architecture step is to support expedition-level travel chains.

## Requirements System Target

Activities, expeditions, recipes, and future content should share one requirements model.

Requirement categories should include:

- character level
- skill levels
- tool levels
- buildings
- quest flags
- keys
- artifacts

Examples:

- Fishing requires Fishing Skill 1 and Fishing Pole Level 1.
- Woodcutting requires Axe Level 1.
- Sunken Library Expedition requires Lore 15 and Ancient Library Key.

## Character Progression Target

Players should progress through:

- character level
- skills
- equipment
- recipes
- reputation
- homestead development

Skills should improve through use. This supports specialization by playstyle: combat, fishing, woodcutting, farming, crafting, cooking, exploration, and lore.

## Return Band Rules

Every explorer has a Tower-marked rune band.

The Return Band:

- lets the player voluntarily end an expedition
- returns the player home
- preserves inventory
- preserves discoveries
- has a cooldown
- is not treated as death

Defeat should forcibly eject the player from the realm through the Tower.

## Content Persistence

Editable content currently flows through:

1. `src/data/*.json` as source defaults.
2. `createDefaultAdminDrafts()` and `normalizeAdminDrafts()` in `src/adminDrafts.ts`.
3. `useAdminDrafts()` in `src/useAdminDrafts.ts`.
4. `/api/content` in `server/index.mjs`.
5. `.thetower-content.sqlite` plus mirrored `src/data/*.json` writes in `server/content-store.mjs`.
6. `buildRuntimeContentFromDrafts()` into live runtime content via `setRuntimeContent()`.

Mutable content kinds are currently realms, zones, areas, items, enemies, recipes, events, and expeditions.

Expeditions are now a first-class persisted content kind. The remaining structural change is to make the player flow consume expedition records instead of direct realm/zone selection.

## Admin Builder Notes

The admin builder currently starts on a Test Expedition Wizard. It creates:

- one realm
- one zone
- three linked areas
- travel routes
- area activities
- one event
- one low-level enemy
- one reward item

This is useful as a scaffold, but it should evolve into a true Expedition Builder that creates expedition records rather than only realm/zone/area records.

There is also a basic Expedition Builder section for creating and editing expedition records. Requirements, travel pool, and reward preview still use JSON fields; these should become structured controls.

Mobile admin is intentionally streamlined:

- desktop keeps the sidebar, main editor, and inspector
- mobile hides the sidebar and inspector
- mobile uses a section dropdown and compact summary chips
- mobile action buttons are arranged in a compact grid

## Test Expedition MVP Definition

A fully functional test expedition should have:

- expedition name and ID
- destination realm and zone
- recommended level
- starting area or entry point
- at least one travel chain with 3-6 interactions
- at least two explorable destination areas
- at least one non-combat activity
- at least one event activity
- at least one event with two choices
- at least one combat path
- at least one reward item
- a Return Band path home

## Recommended Next Steps

1. Replace direct realm/zone selection with an Expedition Board.

   The Tower screen should lead to available expeditions. Realm and zone can remain implementation details and metadata, but the player should choose journeys, not raw content layers.

2. Convert the Test Expedition Wizard into a true Expedition Builder workflow.

   The wizard now creates an expedition record plus supporting content. Next, it should edit existing expedition records and make the generated support content easier to inspect.

3. Build expedition-level travel chains.

   Travel chains should support 3-6 interactions before the player reaches the main destination area. Reuse the current weighted travel event ideas, but move the primary authoring surface to expeditions.

4. Implement the shared requirements system.

   Define one requirement schema and use it for expeditions, activities, recipes, and future unlocks. Start with level, skills, tools, quest flags, keys, and artifacts.

5. Add a Play Test Expedition action.

   This should reset or create a temporary character, start the selected expedition, run the travel chain, and place the player into the destination flow.

6. Replace high-risk JSON editors with structured controls.

   Start with expedition requirements, event choices, enemy pools, loot tables, and travel weighted events.

7. Expand validation.

   Validate missing IDs, unreachable areas, routes pointing to missing areas, activities referencing missing events, events referencing missing rewards/enemies, empty enemy pools with encounter chances, zones with areas omitted from `areaIds`, and expeditions with no valid return path.

8. Decide the node editor contract.

   Either make `NodesScreen` a true expedition composer that writes back to expedition travel chains and linked records, or keep it as a visualization/planning tool.

9. Add focused tests around content transforms.

   Good candidates are `buildRuntimeContentFromDrafts()`, `normalizeAdminDrafts()`, validation, generated expedition output, and future expedition availability filtering.

## Known Content Issue To Watch

Some areas can exist with a `zoneId` but not be present in the zone's `areaIds`. Those areas may appear in admin lists but not be discoverable through normal zone exploration. Validation should flag this.

This matters more under the expedition-first model because expedition availability and travel chains must not point to unreachable or orphaned content.

## Useful Commands

```bash
npm run dev
npm run api
npm run build
```

If port `3001` is already occupied, the API is probably already running. You can run only Vite on another frontend port:

```bash
./node_modules/.bin/vite --host 0.0.0.0 --port 5174
```
