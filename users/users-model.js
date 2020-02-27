const db = require('../database/dbConfig.js');

module.exports = {
	add,
	find,
	findBy,
	findById
};

function find() {
	return db('users').select('id', 'username', 'password');
}

function findBy(item) {
	return db('users')
		.select('id', 'username', 'password')
		.where(item);
}

async function add(user) {
	const [id] = await db('users').insert(user);

	return findById(id);
}

function findById(id) {
	return db('users')
		.select('id', 'username')
		.where({id})
		.first();
}
