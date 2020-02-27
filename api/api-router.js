//Imports
const bcrypt = require('bcryptjs');
const router = require('express').Router();

const jwt = require('jsonwebtoken');
const {jwtSecret} = require('../config/secrets');

const usersRouter = require('../users/users-router');
const users = require('../users/users-model');

//Routes

// | POST   | /api/register | Creates a `user` using the information sent inside the `body` of the request. **Hash the password** before saving the user to the database.                                                                                                                            |
// | POST   | /api/login    | Use the credentials sent inside the `body` to authenticate the user. On successful login, create a new JWT with the user id as the subject and send it back to the client. If login fails, respond with the correct status code and the message: 'You shall not pass!' |
// | GET    | /api/users    | If the user is logged in, respond with an array of all the users contained in the database. If the user is not logged in respond with the correct status code and the message: 'You shall not pass!'.                                                                  |

router.use('/users', restricted, checkRole('user'), usersRouter);

router.get('/hash', (req, res) => {
	const authentication = req.headers.authentication;
	const hash = bcrypt.hashSync(authentication, 8);
	res.json({originalValue: authentication, hashedValue: hash});
});

router.get('/', (req, res) => {
	res.json({message: 'Access granted'});
});

router.post('/register', (req, res) => {
	const hash = bcrypt.hashSync(req.body.password, 8);
	req.body.password = hash;
	users
		.add(req.body)
		.then(result => {
			res.status(201).json(result);
		})
		.catch(error => {
			res.status(500).json(error);
		});
});

router.post('/login', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	users
		.findBy({username})
		.first()
		.then(user => {
			if (user && bcrypt.compareSync(password, user.password)) {
				const token = generateToken(user);
				res.status(200).json({message: 'Login Success', token});
			} else {
				res.status(401).json({message: 'You shall not pass!'});
			}
		})
		.catch(error => {
			res.status(500).json(error);
		});
});

router.post('/logout', (req, res) => {
	if (req.session) {
		req.session.destroy(err => {
			if (err) {
				res.json({
					message:
						"When she calls you to go there is one thing you should know We don't have to live this way Baby, why don't you stay?"
				});
			} else {
				res.json(200).json({message: 'You will be gentle on my mind'});
			}
		});
	} else {
		res.status(200).json({
			message:
				'Whats your name whats your sign whats your birthday? You were never logged in'
		});
	}
});
//middleware
function restricted(req, res, next) {
	if (req.headers) {
		jwt.verify(req.headers, jwtSecret, (err, decodedToken) => {
			if (err) {
				res.status(401).json({message: 'Invalid Credentials'});
			} else {
				req.decodedToken = decodedToken;
				next();
			}
		});
	} else {
		res.status(400).json({message: 'No credentials provided'});
	}
}

function generateToken(user) {
	const payload = {
		subject: user.id,
		username: user.username,
		role: user.role || 'user'
	};

	const options = {
		expiresIn: '2h'
	};
	return jwt.sign(payload, jwtSecret, options);
}

function checkRole(role) {
	return (req, res, next) => {
		if (
			req.decodedToken &&
			req.decodedToken.role &&
			req.decodedToken.role.toLowerCase() === role
		) {
			next();
		} else {
			res.status(403).json({you: 'shall not pass!'});
		}
	};
}

module.exports = router;
