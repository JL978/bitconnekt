class Game {
	deck = buildDeck(3, 35);
	token_down = 0;
	card_up;

	is_over = false;

	constructor(players) {
		this._players = players || [];
		this._isWaiting = false;
		this._turn = 0;
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

		this._players.map((player, index) => (player.turn = this._turn === index));
	}

	next_turn() {
		if (this.turn === this.players.length - 1) {
			this.turn = 0;
		} else {
			this.turn += 1;
		}
		this._players.map((player, index) => (player.turn = this._turn === index));
		console.log(this._players);
	}

	deal_card() {
		if (this.deck !== 0) {
			this.card_up = this.deck.pop();
		} else {
			this.game_over = true;
		}
	}

	player_pass(id) {
		const [currentPlayer] = this._players.filter((player) => player.id === id);
		currentPlayer.pass();
		this.token_down += 1;
		this.next_turn();
	}

	player_take(id) {
		const [currentPlayer] = this._players.filter((player) => player.id === id);
		currentPlayer.take_card(this.card_up);
		currentPlayer.take_token(this.token_down);
		this.token_down = 0;
		this.next_turn();
		this.deal_card();
	}

	get_winner() {
		const winner = [];
		for (player of this.players) {
			if (winner.length === 0) {
				winner.push(player);
			} else {
				const current = winner[0].score();
				if (current > player.score()) {
					winner.splice(0, arr.length);
					winner.push(player);
				} else if (current === player.score()) {
					winner.push(player);
				}
			}
		}
		return winner;
	}

	set isWaiting(bool) {
		this._isWaiting = bool;
	}

	get deck() {
		return this.deck;
	}

	get players() {
		return this._players;
	}

	set players(arr) {
		this._players = arr;
	}

	get turn() {
		return this._turn;
	}

	set turn(num) {
		this._turn = num;
	}

	get is_over() {
		return this.is_over;
	}
}

function buildDeck(start, stop) {
	let arr = new Array();
	for (let i = start; i <= stop; i++) {
		arr.push(i);
	}
	return arr;
}

// const game = new Game();
// game.shuffle_deck();
// console.log(game.deck);
// console.log(game.is_over);

module.exports = Game;
