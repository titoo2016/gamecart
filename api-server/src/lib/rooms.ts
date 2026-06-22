import { ServerGameState, Team } from "./gameLogic";

export interface RoomPlayer {
  id: string;
  name: string;
  team: Team | null;
  isSpymaster: boolean;
  isHost: boolean;
  connected: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  players: Map<string, RoomPlayer>;
  gameState: ServerGameState | null;
  status: "lobby" | "playing" | "finished";
  startingTeam: Team;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

export function createRoom(hostId: string, hostName: string): Room {
  const code = generateCode();
  const host: RoomPlayer = {
    id: hostId,
    name: hostName,
    team: "red",
    isSpymaster: false,
    isHost: true,
    connected: true,
  };
  const room: Room = {
    code,
    hostId,
    players: new Map([[hostId, host]]),
    gameState: null,
    status: "lobby",
    startingTeam: "red",
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function addPlayer(code: string, playerId: string, name: string): RoomPlayer | null {
  const room = rooms.get(code);
  if (!room || room.status !== "lobby") return null;
  const player: RoomPlayer = {
    id: playerId,
    name,
    team: "blue",
    isSpymaster: false,
    isHost: false,
    connected: true,
  };
  room.players.set(playerId, player);
  return player;
}

export function removePlayer(code: string, playerId: string): void {
  const room = rooms.get(code);
  if (!room) return;
  const player = room.players.get(playerId);
  if (!player) return;

  if (room.status === "playing") {
    player.connected = false;
  } else {
    room.players.delete(playerId);
    if (room.players.size === 0) {
      rooms.delete(code);
      return;
    }
    if (playerId === room.hostId) {
      const next = room.players.values().next().value;
      if (next) {
        next.isHost = true;
        room.hostId = next.id;
      }
    }
  }
}

export function setPlayerTeam(code: string, playerId: string, team: Team): boolean {
  const room = rooms.get(code);
  const player = room?.players.get(playerId);
  if (!player || room?.status !== "lobby") return false;
  player.team = team;
  return true;
}

export function setPlayerSpymaster(code: string, playerId: string): boolean {
  const room = rooms.get(code);
  if (!room || room.status !== "lobby") return false;
  const player = room.players.get(playerId);
  if (!player || !player.team) return false;
  for (const p of room.players.values()) {
    if (p.team === player.team) p.isSpymaster = false;
  }
  player.isSpymaster = true;
  return true;
}

export function setStartingTeam(code: string, team: Team): void {
  const room = rooms.get(code);
  if (room) room.startingTeam = team;
}

export function roomToJSON(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    startingTeam: room.startingTeam,
    players: Array.from(room.players.values()),
  };
}

export function reconnectPlayer(code: string, playerId: string): boolean {
  const room = rooms.get(code);
  const player = room?.players.get(playerId);
  if (!player) return false;
  player.connected = true;
  return true;
}
