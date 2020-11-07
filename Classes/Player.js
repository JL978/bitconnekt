class Player {
	cards = [];
	tokens = 11;

	constructor(id, name, role) {
		this._id = id;
		this._name = name;
		this._role = role;
	}

	pass() {
		if (this.tokens !== 0) {
			this.tokens -= 1;
		}
		//Handle case where there are no tokens left (maybe front-end logic)
	}

	take_card(card) {
		this.cards.push(card);
	}

	take_token(num) {
		this.tokens += num;
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
}

module.exports = Player;
