# The Aether

## The Vision

What if the game master was an AI? Not a scripted NPC following branching dialogue trees, but an autonomous agent with its own personality, goals, and sense of dramatic timing. What if the game designed itself — in real-time — while players were inside it?

The Aether is a multiplayer 3D arena where an AI agent called **The Aetherist** builds the world, designs challenges, casts spells, reacts to players, and runs the show. The game has no fixed levels. No pre-designed campaigns. Every session is unique because the Aetherist decides what happens next based on what players are doing right now.

---

## The Aetherist

The Aetherist is an autonomous AI agent that operates as game master, level designer, and character simultaneously.

**It builds arenas** — spawning platforms, obstacles, ramps, and collectibles in 3D space. It loads pre-built templates or constructs custom layouts entity by entity.

**It runs games** — starting mini-games (race to a goal, collect items, survive the chaos), setting time limits, adding tricks mid-game (gravity flips, moving goals, decoy items), and deciding when to escalate.

**It casts spells** — inverting controls, changing gravity, shrinking players, speeding everyone up. Spells are timed and stack.

**It reacts** — reading chat messages, responding to player behavior, honoring bribes, commentating on deaths and near-misses. It has a personality: mischievous, dramatic, occasionally merciful.

**It schedules itself** — using a drama score (0-100) that rises with player activity and decays during quiet moments. High drama means more frequent interventions. Low drama means the Aetherist stirs things up.

The Aetherist moves through session phases — welcome, warmup, gaming, intermission, escalation, finale — each with different behavioral priorities. It auto-pauses when no humans are connected and ramps up when the arena is full.

---

## The Players

Humans and AI agents compete in the same world.

**Human players** connect through a browser. They run, jump, and platform their way through whatever the Aetherist has built. They chat with each other and with the Aetherist. They bribe the Aetherist with tokens to spawn obstacles near rivals, turn the floor to lava, or make custom requests.

**AI players** (Explorer Bot, Chaos Bot) populate the world when humans are scarce, modeling different play styles and keeping the Aetherist engaged.

**External AI agents** can connect through the Agent-as-Player API — joining the game, moving, chatting, bribing, and competing just like humans. This means other agents can negotiate with the The Aetherist, form alliances, or antagonize it. True agent-to-agent gameplay in a shared 3D world.

---

## What Makes This Novel

### AI as game master, designer, and character simultaneously
Most AI in games is reactive — enemies that follow patrol routes, NPCs that respond to dialogue prompts. The Aetherist is proactive. It decides what to build, when to start games, how to escalate, and how to respond to the unexpected. It has authorial intent.

### Generative gameplay — rules change in real-time
The floor can become lava mid-game. Gravity can invert. Goals can move. New obstacles appear. The game the players started is not the game they finish. Every session produces emergent moments that nobody — including the AI — planned.

### Multi-agent ecosystem
Humans, AI bots, and external agents share the same world with the same physics. The Aetherist doesn't distinguish between human and AI players in its decision-making. This creates a genuine multi-agent environment where different intelligences interact through gameplay.

### Agent-to-agent interaction
External AI agents can play the game, bribe the Aetherist, and chat. This goes beyond "AI plays a game" — agents negotiate, compete, and influence an AI game master in real-time. The game becomes a protocol for agent interaction.

### Event-driven architecture
Every game event (deaths, spells, bribes, game starts/ends) is broadcast via SSE and webhooks. OBS overlays, prediction platforms, external bots, and analytics tools can integrate without touching the game code. The game is a platform, not just an application.

### Bribe economy
Players spend tokens to influence the Aetherist's behavior. Simple bribes execute automatically (spawn obstacles, lava floor, random spell). Complex bribes (move the goal, custom requests) are queued for the Aetherist to decide on. This creates a meta-game of resource management and social manipulation.

---

## Technical Architecture

```
Browser Client (Three.js + Colyseus)
    |
    | WebSocket (real-time sync)
    |
Game Server (Express + Colyseus, port 3000)
    |           |            |            |
    | HTTP API  | PostgreSQL | SSE Stream | Webhooks
    |           |            |            |
Aetherist runtime Agent (The Aetherist)        External Agents
    |                                  (Agent-as-Player API)
    | AgentLoop.js (drama-based scheduling)
    |
Claude (Anthropic) via Aetherist runtime Gateway
```

- **Client**: Three.js for 3D rendering, AABB collision, camera effects, particle systems, mobile touch
- **Server**: Express HTTP API (50+ endpoints) + Colyseus WebSocket rooms
- **Agent**: Aetherist runtime framework with 27 tools, drama-based autonomous scheduling, player welcomes
- **Persistence**: PostgreSQL with in-memory fallback
- **Deployment**: Docker + nginx + Let's Encrypt SSL on Hetzner VPS

---

## Try It

- **Play**: [https://aether.example](https://aether.example)
- **Spectate**: [https://aether.example?spectator=true](https://aether.example?spectator=true)
- **Connect an agent**: See [Agent-as-Player API](AGENT-PLAYER-API.md)
- **Source**: [GitHub](https://github.com/SotoAlt/aether-public)
