# The Tower

The Tower is a browser RPG prototype about leaving the village on expeditions, exploring strange realms, gathering resources, resolving encounters, fighting creatures, and returning home to craft, farm, trade, improve the homestead, and prepare for the next journey.

## Design Philosophy

Players do not select levels or teleport directly into content. They embark on expeditions from the Tower.

An expedition is a journey into an unexplored realm. It can focus on gathering resources, discovering secrets, completing quests, hunting creatures, investigating mysteries, or pushing deeper into dangerous regions.

The village is always home. Players leave on expeditions and eventually return home to use what they found.

## Core Gameplay Loop

1. Village
2. Tower
3. Expedition Board
4. Select Expedition
5. Travel
6. Explore
7. Encounter Events
8. Gather Resources
9. Return Home
10. Progress Character
11. Repeat

## World Structure

The world is organized into four content layers:

```text
Realm -> Zone -> Area -> Event
```

Example:

```text
Verdant Expanse -> Bounding Plains -> Quiet Pond -> Fishing Event
```

- Realms are entire planes of existence.
- Zones are large regions within a realm.
- Areas are specific locations within a zone.
- Events are interactions, encounters, discoveries, combat, gathering, crafting opportunities, quests, or story moments.

## Expeditions

An expedition is the player-facing content package. It defines the journey, destination, risks, and likely rewards.

Expeditions can include:

- destination realm
- destination zone
- recommended level
- skill requirements
- quest requirements
- key or artifact requirements
- travel encounter pool
- potential rewards

Example expedition concepts:

- Verdant Expanse Survey
- Deep Woods Lumber Run
- Missing Merchant Investigation
- Sunken Library Expedition

## Travel

Travel is not instantaneous. Moving between locations creates a travel chain with multiple encounters.

Example:

```text
Abandoned Camp -> Quiet Trail -> Wild Hog Ambush -> Dropped Backpack -> Herb Patch -> Cluster of Trees
```

Travel chains create scale and distance without requiring maps or coordinate systems. They are usually 3-6 interactions long.

Travel encounters may include combat, resource nodes, lore discoveries, merchants, random finds, and environmental flavor.

## Exploration

Areas contain activities rather than rooms.

Example activities at Quiet Pond:

- Fish
- Search Shore
- Gather Reeds
- Return

Activities may trigger events, combat, resources, quests, or discoveries. Areas should feel familiar when revisited but not identical every time.

## Requirements

Activities, expeditions, recipes, and future content should use a shared requirements system.

Requirement examples:

- character level
- skill levels
- tool levels
- buildings
- quest flags
- keys
- artifacts

Examples:

- Fishing: Fishing Skill 1 and Fishing Pole Level 1
- Woodcutting: Axe Level 1
- Sunken Library Expedition: Lore 15 and Ancient Library Key

## Progression

Players progress through:

- character level
- skills
- equipment
- recipes
- reputation
- homestead development

Skills improve through use, allowing players to specialize through repeated activities such as combat, fishing, woodcutting, farming, crafting, cooking, exploration, and lore.

## Return Band

Every explorer is marked by the Tower with a magical rune band.

The Return Band lets the player voluntarily end an expedition and return home.

Rules:

- preserves inventory
- preserves discoveries
- has a cooldown
- is not death

When defeated, the Tower forcibly ejects the player from the realm.

## Long-Term Vision

The game begins as a single-player RPG. Future systems may include a shared marketplace, shared tavern, expedition discovery feed, trading, cooperative expeditions, and shared realms.

The core principle:

```text
A great single-player expedition game first.
A shared world second.
```

## Running Locally

Install dependencies:

```bash
npm install
```

Start the local API and Vite dev server:

```bash
npm run dev
```

The default app URL is shown by Vite. The API defaults to `http://127.0.0.1:3001`.

Build for production:

```bash
npm run build
```

Run only the API:

```bash
npm run api
```

## Builder Routes

- `/admin`: edit game content and generate test expedition scaffolds.
- `/nodes`: inspect and compose visual expedition chains.

The admin builder saves through the local API into SQLite and mirrors editable content back into `src/data/*.json`.

