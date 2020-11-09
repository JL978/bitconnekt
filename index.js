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
const io = socketio(server, { cors: true, origins: "*" });

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

const isMod = (player_id, room_id) => {
	const room = waitRooms.get(room_id);
	const [requester] = room.filter((player) => player.id === player_id);
	return requester.role === "Moderator";
};

const numPlayersInWaitRoom = (room_id) => {
	waitRooms.get(room_id).length;
};

io.on("connection", (socket) => {
	console.log("connected");
	//Main menu request -> Making a new room
	socket.on("newRoom", ({ name }) => {
		new Promise(makeRoom)
			.then((room_id) => {
				console.log(room_id);
				const player = new Player(socket.id, name, "Moderator", 0);
				joinWaitRooms(player, room_id);
				socket.join(room_id);
				socket.emit("newRoomCreated", { room_id });
			})
			.catch((error) => {
				console.log(error);
				socket.emit(
					"errorMessage",
					"Oops the server couldn't create a new room right now, please try again"
				);
			});
	});

	//Main menu request -> Joining a waiting room
	socket.on("joining", ({ room_id, name }) => {
		//check if room exist
		if (waitRooms.has(room_id)) {
			const numPlayers = numPlayersInWaitRoom(room_id);
			//Check if room is full (max 4 players)
			if (numPlayers < 5) {
				const player = new Player(socket.id, name, "Peasant", numPlayers);
				joinWaitRooms(player, room_id);
				socket.join(room_id);
				socket.emit("joined");
				socket.to(room_id).emit("new_player", player.name);
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

	//Request from a moderator to start a game
	socket.on("start", ({ room_id }) => {
		if (isMod(socket.id, room_id)) {
			if (numPlayersInWaitRoom(room_id) > 3) {
				joinPlayRooms(room_id);
				io.in(room_id).emit("startGame");
			} else {
				socket.emit(
					"errorMessage",
					"You need at least 3 players to start playing"
				);
			}
		}
	});

	//Request from a moderator to re-start a game
	socket.on("restart", ({ room_id }) => {
		if (isMod(socket.id, room_id)) {
			io.in(room_id).emit("restartGame");
		}
	});

	// socket.on("kick", ({room_id, player_id}) => {
	// 	const id = socket.id
	// 	const room = waitRooms.get(room_id) || playRooms.get(room_id)
	// 	const [requester] = room.filter(player => player.id === id)
	// 	if (requester.role === "Moderator"){
	// 		joinPlayRooms(room_id)
	// 	}
	// })

	//Listener event for each move and emit different events depending on the state of the game
	socket.on("move", ({ room_id, move }) => {
		const player_id = socket.id;
		const game = playRooms.get(room_id);

		switch (move) {
			case "PASS":
				game.player_pass(player_id);
				socket.to(room_id).emit("pass", player_id);
				break;
			case "TAKE":
				game.player_take(player_id);
				socket.to(room_id).emit("take", player_id);
				break;
		}

		game.deal_card();

		if (game.is_over()) {
			socket.to(room_id).emit("gameOver");
		} else {
			socket.to(room_id).emit("gameUpdate");
		}
	});

	//On disconnect event
	// socket.on("disconnecting", () => {
	// 	socket.to(room_id).emit("playerLeft", socket.id);
	// 	//Get all the rooms that the socket is currently subscribed to
	// 	const currentRooms = Object.keys(socket.rooms);

	// 	//In this game an object can only have 2 rooms max so we check for that
	// 	if (currentRooms.length === 2) {
	// 		//The game room is always the second element of the list
	// 		const room_id = currentRooms[1];
	// 		const num = getRoomPlayersNum(room);
	// 		//If one then no one is left so we remove the room from the mapping
	// 		if (num === 1) {
	// 			rooms.delete(room);
	// 		}
	// 		//If 2 then there is one person left so we remove the socket leaving from the player list and
	// 		//emit a waiting event to the other person
	// 		if (num === 2) {
	// 			currentRoom = rooms.get(room);
	// 			currentRoom.players = currentRoom.players.filter(
	// 				(player) => player.id !== socket.id
	// 			);
	// 			io.to(room).emit("waiting");
	// 		}
	// 	}
	// });
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
