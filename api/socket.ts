import type { IncomingMessage, ServerResponse, Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import { Server as SocketIOServer } from "socket.io";
import {
  createRoom, getRoom, addPlayer, removePlayer,
  setPlayerTeam, setPlayerSpymaster, setStartingTeam,
  roomToJSON, Room,
} from "./lib/rooms";
import {
  createGame, submitClue, revealCard, passTurn,
  getClientState, Team,
} from "./lib/gameLogic";

type ServerWithIO = HTTPServer & { io?: SocketIOServer };
type SocketWithServer = NetSocket & { server: ServerWithIO };
type ResponseWithSocket = ServerResponse & { socket: SocketWithServer };

const socketToRoom = new Map<string, string>();

function broadcastRoom(io: SocketIOServer, room: Room) {
  io.to(room.code).emit("room-updated", roomToJSON(room));
}

function broadcastGame(io: SocketIOServer, room: Room) {
  if (!room.gameState) return;
  for (const player of room.players.values()) {
    const socket = io.sockets.sockets.get(player.id);
    if (!socket) continue;
    socket.emit("game-updated", getClientState(room.gameState, player.isSpymaster));
  }
}

function setupSocket(io: SocketIOServer) {
  io.on("connection", (socket) => {
    socket.on("create-room", ({ name }: { name: string }, cb: Function) => {
      if (!name?.trim()) return cb?.({ error: "الاسم مطلوب" });
      const room = createRoom(socket.id, name.trim());
      socketToRoom.set(socket.id, room.code);
      socket.join(room.code);
      cb?.({ code: room.code, room: roomToJSON(room) });
    });

    socket.on("join-room", ({ code, name }: { code: string; name: string }, cb: Function) => {
      const upperCode = code?.toUpperCase?.();
      if (!name?.trim()) return cb?.({ error: "الاسم مطلوب" });
      if (!upperCode) return cb?.({ error: "كود الغرفة مطلوب" });
      const room = getRoom(upperCode);
      if (!room) return cb?.({ error: "الغرفة مش موجودة" });
      if (room.status !== "lobby") return cb?.({ error: "اللعبة بدأت بالفعل" });
      const nameExists = Array.from(room.players.values()).some(
        (p) => p.name === name.trim() && p.id !== socket.id
      );
      if (nameExists) return cb?.({ error: "الاسم ده موجود بالفعل في الغرفة" });
      const player = addPlayer(upperCode, socket.id, name.trim());
      if (!player) return cb?.({ error: "مش قادر تنضم" });
      socketToRoom.set(socket.id, upperCode);
      socket.join(upperCode);
      cb?.({ room: roomToJSON(room) });
      broadcastRoom(io, room);
    });

    socket.on("get-room", (_data: unknown, cb: Function) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room) return cb?.({ error: "الغرفة مش موجودة" });
      const player = room.players.get(socket.id);
      cb?.({ room: roomToJSON(room) });
      if (room.gameState && player) {
        socket.emit("game-updated", getClientState(room.gameState, player.isSpymaster));
      }
    });

    socket.on("set-team", ({ team }: { team: Team }, cb: Function) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const ok = setPlayerTeam(code, socket.id, team);
      if (!ok) return cb?.({ error: "مش قادر تغير الفريق" });
      const room = getRoom(code)!;
      broadcastRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("set-spymaster", (_data: unknown, cb: Function) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const ok = setPlayerSpymaster(code, socket.id);
      if (!ok) return cb?.({ error: "مش قادر تبقى رئيس جواسيس" });
      const room = getRoom(code)!;
      broadcastRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("set-starting-team", ({ team }: { team: Team }, cb: Function) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room) return cb?.({ error: "الغرفة مش موجودة" });
      if (room.hostId !== socket.id) return cb?.({ error: "بس الهوست يقدر يغير ده" });
      setStartingTeam(code, team);
      broadcastRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("start-game", (_data: unknown, cb: Function) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room) return cb?.({ error: "الغرفة مش موجودة" });
      if (room.hostId !== socket.id) return cb?.({ error: "بس الهوست يقدر يبدأ" });
      const players = Array.from(room.players.values());
      const redTeam = players.filter((p) => p.team === "red");
      const blueTeam = players.filter((p) => p.team === "blue");
      if (redTeam.length === 0) return cb?.({ error: "الفريق الأحمر فاضي" });
      if (blueTeam.length === 0) return cb?.({ error: "الفريق الأزرق فاضي" });
      if (!redTeam.some((p) => p.isSpymaster)) return cb?.({ error: "الفريق الأحمر محتاج رئيس جواسيس" });
      if (!blueTeam.some((p) => p.isSpymaster)) return cb?.({ error: "الفريق الأزرق محتاج رئيس جواسيس" });
      room.gameState = createGame(room.startingTeam);
      room.status = "playing";
      broadcastRoom(io, room);
      broadcastGame(io, room);
      cb?.({ ok: true });
    });

    socket.on("give-clue", ({ word, count }: { word: string; count: number }, cb: Function) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: "اللعبة مش بدأت" });
      const player = room.players.get(socket.id);
      if (!player?.isSpymaster) return cb?.({ error: "بس رئيس الجواسيس يدي تلميح" });
      if (player.team !== room.gameState.currentTeam) return cb?.({ error: "مش دورك" });
      if (room.gameState.phase !== "spymaster-view") return cb?.({ error: "مش وقت التلميح" });
      if (!word?.trim()) return cb?.({ error: "اكتب كلمة" });
      room.gameState = submitClue(room.gameState, word.trim(), count);
      broadcastGame(io, room);
      cb?.({ ok: true });
    });

    socket.on("reveal-card", ({ cardId }: { cardId: number }, cb: Function) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: "اللعبة مش بدأت" });
      const player = room.players.get(socket.id);
      if (player?.isSpymaster) return cb?.({ error: "رئيس الجواسيس ما يختارش" });
      if (player?.team !== room.gameState.currentTeam) return cb?.({ error: "مش دورك" });
      if (room.gameState.phase !== "playing") return cb?.({ error: "انتظر التلميح الأول" });
      room.gameState = revealCard(room.gameState, cardId);
      if (room.gameState.phase === "game-over") room.status = "finished";
      broadcastGame(io, room);
      cb?.({ ok: true });
    });

    socket.on("pass-turn", (_data: unknown, cb: Function) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: "اللعبة مش بدأت" });
      const player = room.players.get(socket.id);
      if (player?.team !== room.gameState.currentTeam) return cb?.({ error: "مش دورك" });
      if (room.gameState.phase !== "playing") return cb?.({ error: "لازم يبدأ التلميح الأول" });
      room.gameState = passTurn(room.gameState);
      broadcastGame(io, room);
      cb?.({ ok: true });
    });

    socket.on("play-again", (_data: unknown, cb: Function) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room) return cb?.({ error: "الغرفة مش موجودة" });
      if (room.hostId !== socket.id) return cb?.({ error: "بس الهوست يقدر يعيد" });
      room.status = "lobby";
      room.gameState = null;
      for (const p of room.players.values()) p.isSpymaster = false;
      broadcastRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("disconnect", () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      socketToRoom.delete(socket.id);
      removePlayer(code, socket.id);
      const room = getRoom(code);
      if (room) broadcastRoom(io, room);
    });
  });
}

export default function handler(req: IncomingMessage, res: ResponseWithSocket) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server as any, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["polling", "websocket"],
    });
    setupSocket(io);
    res.socket.server.io = io;
  }
  res.end();
}
