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
const rooms = new Map();

//Promise function to make sure room id is unique
const makeRoom = (resolve) => {
	var newRoom = randId(8);
	while (rooms.has(newRoom)) {
		newRoom = randId(8);
	}
	rooms.set(newRoom, new Game());
	resolve(newRoom);
};

//Put the newly joined player into a room's player list
const joinRoom = (player, room_id) => {
	rooms.get(room_id).players.push(player);
};

const getPlayers = (room_id) => {
	const players = rooms.get(room_id).players;
	return players;
};

const isMod = (player_id, room_id) => {
	const room = rooms.get(room_id);
	const [requester] = room.players.filter((player) => player.id === player_id);
	return requester.role === "Moderator";
};

const getNumPlayers = (room_id) => {
	return rooms.get(room_id).players.length;
};

io.on("connection", (socket) => {
	//Main menu request -> Making a new room
	socket.on("newRoom", ({ name }) => {
		new Promise(makeRoom)
			.then((room_id) => {
				socket.emit("redirect", { name, room_id });
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
	socket.on("joinRequest", ({ name, room_id }) => {
		//check if room exist
		if (rooms.has(room_id)) {
			const numPlayers = getNumPlayers(room_id);
			//Check if room is full (max 4 players)
			if (numPlayers < 4) {
				socket.emit("redirect", { name, room_id });
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

	//Wait room request -> after users are redirected to the wait room
	socket.on("joinRoom", ({ name, room_id }) => {
		if (rooms.has(room_id)) {
			const player_id = socket.id;

			const numPlayers = getNumPlayers(room_id);
			const role = numPlayers === 0 ? "Moderator" : "Peasant";
			const player = new Player(player_id, name, role, numPlayers);

			joinRoom(player, room_id);
			const players = getPlayers(room_id);

			socket.join(room_id);
			socket.emit("roomJoined", { socket_id: player_id, players });
			socket.to(room_id).emit("newPlayer", { players });
		} else {
			socket.emit("errorRedirect");
		}
	});

	//Request from a moderator to start a game
	socket.on("start", ({ room_id }) => {
		const numPlayers = getNumPlayers(room_id);
		if (isMod(socket.id, room_id)) {
			if (numPlayers > 2) {
				game = rooms.get(room_id);
				game.shuffle_player();
				game.deal_card();
				io.in(room_id).emit("startGame", game);
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
			game = rooms.get(room_id);
			game.clear();
			io.in(room_id).emit("restartGame", game);
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
		const game = rooms.get(room_id);

		switch (move) {
			case "PASS":
				game.player_pass(player_id);
				break;
			case "TAKE":
				game.player_take(player_id);
				break;
		}

		if (game.is_over) {
			const winner = game.get_winner();
			io.in(room_id).emit("gameOver", { winner, game });
		} else {
			io.in(room_id).emit("gameUpdate", game);
		}
	});

	socket.on("disconnecting", () => {
		//Get all the rooms that the socket is currently subscribed to
		const currentRooms = Array.from(socket.rooms);

		//If the object has 2 rooms, it means that it is currently subscribed to a room other than itself
		if (currentRooms.length === 2) {
			//The game room is always the second element of the list
			const room_id = currentRooms[1];

			const num = getNumPlayers(room_id);
			//If one then no one is left so we remove the room from the mapping
			if (num === 1) {
				rooms.delete(room_id);
			}
			//If 2 then there is one person left so we remove the socket leaving from the player list and
			//emit a waiting event to the other person
			else {
				game = rooms.get(room_id);
				const [playerLeaving] = game.players.filter(
					(player) => player.id === socket.id
				);
				const players = game.players.filter(
					(player) => player.id !== socket.id
				);
				if (playerLeaving.role === "Moderator") {
					players[0].role = "Moderator";
				}
				game.players = players;
				game.clear();

				io.in(room_id).emit("playerLeft", { playerLeaving, players });
			}
		}
	});
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
