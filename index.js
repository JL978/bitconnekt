//utilities functions and classes
const randId = require("./utils/random");

const cors = require("cors");
//set up express server
const express = require("express");
const http = require("http");
const socketio = require("socket.io");

const PORT = process.env.PORT || 4000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const Game = require("./Classes/Game");
const Player = require("./Classes/Player");

app.use(cors());

//Store the room ids mapping to the room property object
//The room property object looks like this {roomid:str, players:Array(2)}
const playRooms = new Map();
const waitRooms = new Map();

//Promise function to make sure room id is unique
const makeRoom = (resolve) => {
	var newRoom = randId(8);
	while (waitRooms.has(newRoom) || playRooms.has(newRoom)) {
		newRoom = randId(8);
	}
	waitRooms.set(newRoom, []);
	resolve(newRoom);
};

//Put the newly joined player into a room's player list
const joinWaitRooms = (player, room_id) => {
	waitRooms.get(room_id).push(player);
};

const joinPlayRooms = (room_id) => {
	const playerList = waitRooms.get(room_id);
	waitRooms.delete(room_id);
	playRooms.set(room_id, Game(playerList));
};

io.on("connection", (socket) => {
	//Main menu request -> Making a new room
	socket.on("newRoom", ({ name }) => {
		new Promise(makeRoom)
			.then((room_id) => {
				const player = new Player(0, name, "Moderator");
				joinWaitRooms(player, room_id);
				socket.emit("newRoomCreated", room);
			})
			.catch((error) => {
				socket.emit(
					"errorMessage",
					"Oops the server couldn't create a new room right now, please try again"
				);
			});
	});

	//Main menu request -> Joining a waiting room
	socket.on("joining", ({ room_id, name }) => {
		if (waitRooms.has(room_id)) {
			if (waitRooms.get(room_id).length < 5) {
				const player = new Player(
					waitRooms.get(room_id).length,
					name,
					"Peasant"
				);
				joinWaitRooms(player, room_id);
				socket.emit("joined");
			} else {
				socket.emit(
					"errorMessage",
					"The room you are trying to join is currently full"
				);
			}
		} else {
			socket.emit("errorMessage", "No room with that id found");
		}
	});

	//Request from a moderator
	socket.on("start", { room_id });

	//Listener event for each move and emit different events depending on the state of the game
	socket.on("move", ({ room, piece, index }) => {
		currentBoard = rooms.get(room).board;
		currentBoard.move(index, piece);

		if (currentBoard.checkWinner(piece)) {
			io.to(room).emit("winner", {
				gameState: currentBoard.game,
				id: socket.id,
			});
		} else if (currentBoard.checkDraw()) {
			io.to(room).emit("draw", { gameState: currentBoard.game });
		} else {
			currentBoard.switchTurn();
			io.to(room).emit("update", {
				gameState: currentBoard.game,
				turn: currentBoard.turn,
			});
		}
	});

	//Listener event for a new game
	socket.on("playAgainRequest", (room) => {
		currentRoom = rooms.get(room);
		currentRoom.board.reset();
		//Reassign new piece so a player can't always go first
		pieceAssignment(room);
		currentPlayers = currentRoom.players;
		for (const player of currentPlayers) {
			io.to(player.id).emit("pieceAssignment", {
				piece: player.piece,
				id: player.id,
			});
		}

		io.to(room).emit("restart", {
			gameState: currentRoom.board.game,
			turn: currentRoom.board.turn,
		});
	});

	//On disconnect event
	socket.on("disconnecting", () => {
		//Get all the rooms that the socket is currently subscribed to
		const currentRooms = Object.keys(socket.rooms);
		//In this game an object can only have 2 rooms max so we check for that
		if (currentRooms.length === 2) {
			//The game room is always the second element of the list
			const room = currentRooms[1];
			const num = getRoomPlayersNum(room);
			//If one then no one is left so we remove the room from the mapping
			if (num === 1) {
				rooms.delete(room);
			}
			//If 2 then there is one person left so we remove the socket leaving from the player list and
			//emit a waiting event to the other person
			if (num === 2) {
				currentRoom = rooms.get(room);
				currentRoom.players = currentRoom.players.filter(
					(player) => player.id !== socket.id
				);
				io.to(room).emit("waiting");
			}
		}
	});
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
