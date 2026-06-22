import type { Server, Socket } from "socket.io";
import {
  createRoom, getRoom, addPlayer, removePlayer,
  setPlayerTeam, setPlayerSpymaster, setStartingTeam,
  roomToJSON, Room,
} from "./rooms";
import {
  createGame, submitClue, revealCard, passTurn, getClientState, Team,
} from "./gameLogic";
import { logger } from "./logger";

const socketToRoom = new Map<string, string>();

function broadcastRoom(io: Server, room: Room) {
  const roomJSON = roomToJSON(room);
  io.to(room.code).emit("room-updated", roomJSON);
}

function broadcastGame(io: Server, room: Room) {
  if (!room.gameState) return;
  for (const player of room.players.values()) {
    const socket = io.sockets.sockets.get(player.id);
    if (!socket) continue;
    const clientState = getClientState(room.gameState, player.isSpymaster);
    socket.emit("game-updated", clientState);
  }
}

export function setupSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("create-room", ({ name }: { name: string }, cb) => {
      if (!name?.trim()) return cb?.({ error: "الاسم مطلوب" });
      const room = createRoom(socket.id, name.trim());
      socketToRoom.set(socket.id, room.code);
      socket.join(room.code);
      logger.info({ code: room.code, name }, "Room created");
      cb?.({ code: room.code, room: roomToJSON(room) });
    });

    socket.on("join-room", ({ code, name }: { code: string; name: string }, cb) => {
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
      logger.info({ code: upperCode, name }, "Player joined");
      cb?.({ room: roomToJSON(room) });
      broadcastRoom(io, room);
    });

    socket.on("set-team", ({ team }: { team: Team }, cb) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const ok = setPlayerTeam(code, socket.id, team);
      if (!ok) return cb?.({ error: "مش قادر تغير الفريق" });
      const room = getRoom(code)!;
      broadcastRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("set-spymaster", (_data, cb) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const ok = setPlayerSpymaster(code, socket.id);
      if (!ok) return cb?.({ error: "مش قادر تبقى رئيس جواسيس" });
      const room = getRoom(code)!;
      broadcastRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("set-starting-team", ({ team }: { team: Team }, cb) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room) return cb?.({ error: "الغرفة مش موجودة" });
      if (room.hostId !== socket.id) return cb?.({ error: "بس الهوست يقدر يغير ده" });
      setStartingTeam(code, team);
      broadcastRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("start-game", (_data, cb) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room) return cb?.({ error: "الغرفة مش موجودة" });
      if (room.hostId !== socket.id) return cb?.({ error: "بس الهوست يقدر يبدأ" });

      const players = Array.from(room.players.values());
      const redTeam = players.filter((p) => p.team === "red");
      const blueTeam = players.filter((p) => p.team === "blue");
      const redSpy = redTeam.some((p) => p.isSpymaster);
      const blueSpy = blueTeam.some((p) => p.isSpymaster);

      if (redTeam.length === 0) return cb?.({ error: "الفريق الأحمر فاضي" });
      if (blueTeam.length === 0) return cb?.({ error: "الفريق الأزرق فاضي" });
      if (!redSpy) return cb?.({ error: "الفريق الأحمر محتاج رئيس جواسيس" });
      if (!blueSpy) return cb?.({ error: "الفريق الأزرق محتاج رئيس جواسيس" });

      room.gameState = createGame(room.startingTeam);
      room.status = "playing";
      logger.info({ code }, "Game started");
      broadcastRoom(io, room);
      broadcastGame(io, room);
      cb?.({ ok: true });
    });

    socket.on("give-clue", ({ word, count }: { word: string; count: number }, cb) => {
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

    socket.on("reveal-card", ({ cardId }: { cardId: number }, cb) => {
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

    socket.on("pass-turn", (_data, cb) => {
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

    socket.on("play-again", (_data, cb) => {
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

    socket.on("get-room", (_data, cb) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return cb?.({ error: "مش في غرفة" });
      const room = getRoom(code);
      if (!room) return cb?.({ error: "الغرفة مش موجودة" });
      const player = room.players.get(socket.id);
      cb?.({ room: roomToJSON(room) });
      if (room.gameState && player) {
        const clientState = getClientState(room.gameState, player.isSpymaster);
        socket.emit("game-updated", clientState);
      }
    });

    socket.on("disconnect", () => {
      const code = socketToRoom.get(socket.id);
      logger.info({ socketId: socket.id, code }, "Socket disconnected");
      if (!code) return;
      socketToRoom.delete(socket.id);
      removePlayer(code, socket.id);
      const room = getRoom(code);
      if (room) broadcastRoom(io, room);
    });
  });
}
