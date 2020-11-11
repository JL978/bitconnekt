class Player {
	cards = [];
	tokens = 11;
	score = 0;

	constructor(id, name, role) {
		this._id = id;
		this._name = name;
		this._role = role;
		this._turn = false;
	}

	pass() {
		if (this.tokens !== 0) {
			this.tokens -= 1;
		}
		//Handle case where there are no tokens left (maybe front-end logic)
	}

	take(card, tokens) {
		this.cards.push(card);
		this.cards.sort((a, b) => a - b);

		this.tokens += tokens;
		this.calculate_score();
	}

	calculate_score() {
		let prev;
		let total = 0;
		for (let i = 0; i < this.cards.length; i++) {
			const current_card = this.cards[i];
			if (prev !== current_card - 1) {
				total += current_card;
			}
			prev = current_card;
		}
		this.score = total - this.tokens;
	}

	reset() {
		this.cards = [];
		this.tokens = 11;
		this.score = 0;
		this.turn = false;
	}

	set score(num) {
		this._score = num;
	}

	get score() {
		return this._score;
	}

	set id(num) {
		this._id = num;
	}

	get id() {
		return this._id;
	}

	get tokens() {
		return this.tokens;
	}

	get name() {
		return this._name;
	}

	set name(newName) {
		this._name = newName;
	}

	get role() {
		return this._role;
	}
	set role(role) {
		this._role = role;
	}

	get position() {
		return this._position;
	}

	set position(num) {
		this._position = num;
	}

	get turn() {
		return this._turn;
	}
	set turn(bool) {
		this._turn = bool;
	}

	get score() {
		return this.score;
	}
}

module.exports = Player;
