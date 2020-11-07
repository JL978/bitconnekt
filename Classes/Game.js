class Game {
	deck = buildDeck(3, 35);
	players = [];
	token_down = 0;
	card_up;
	turn = 0;
	game_over = false;

	constructor(players) {
		this.players = players;
		this.shuffle_deck();
		this.shuffle_player();
	}

	shuffle_deck() {
		for (let i = this.deck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			let temp = this.deck[i];
			this.deck[i] = this.deck[j];
			this.deck[j] = temp;
		}
	}

	shuffle_player() {
		if (this.players.length === 0) return;

		for (let i = this.players.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			let temp = this.players[i];
			this.players[i] = this.players[j];
			this.players[j] = temp;
		}

		this.players = this.players.map((player, index) => (player.id = index));
		this.players();
	}

	next_turn() {
		if (this.turn === this.players.length - 1) {
			this.turn = 0;
		} else {
			this.turn += 1;
		}
	}

	deal_card() {
		if (this.deck !== 0) {
			this.card_up = this.deck.pop();
		} else {
			this.game_over = true;
		}
	}

	player_pass(id) {
		this.players[id].pass();
		this.token_down += 1;
	}

	player_take(id) {
		this.players[id].take_card(card_up);
		this.players[id].take_token(token_down);
		this.token_down = 0;
	}

	get deck() {
		return this.deck;
	}

	get players() {
		return this.players;
	}

	get turn() {
		return this.turn;
	}
}

function buildDeck(start, stop) {
	let arr = new Array();
	for (let i = start; i <= stop; i++) {
		arr.push(i);
	}
	return arr;
}

const game = new Game();
game.shuffle_deck();
console.log(game.deck);

module.exports = Game;
