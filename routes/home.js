const { Router } = require('express');
const User = require('../models/user');
const sha = require('../models/hash');
const router = Router();

const admin = require('firebase-admin');

const serviceAccount = require('../testaufgabe-715e5-firebase-adminsdk-mou21-62a67719b2.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

router.get('/', async (req, res) => {
	const users = await User.find({});

	res.render('index', {
		title: 'Home page',
		isIndex: true,
		users,
	});
});

router.post('/create', async (req, res) => {
	console.log(req.query, req.body, req.params);
	const { username, password, fcmtoken } = req.body;
	await User.create({
		username: username,
		password: sha(password),
		fcmtoken: fcmtoken,
	})
		.then((doc) => {
			res.json(doc);
		})
		.catch((err) => console.error(err));
});

router.get('/find', async (req, res) => {
	console.log(req.query, req.body, req.params);

	await User.findById(req.query.id)
		.then((doc) => {
			//send push
			const message = {
				notification: {
					title: '',
					body: '',
				},
				data: {
					title: '',
					body: '',
				},
			};

			const notification_options = {
				priority: 'high',
				timeToLive: 60 * 60 * 24,
			};
			admin
				.messaging()
				.sendToDevice(doc.fcmtoken, message, notification_options)
				.then((response) => {
					res.status(200).send('Notification sent successfully', response);
				})
				.catch((error) => {
					console.log(error);
				});
		})

		.catch((err) => console.error(err));
	res.redirect('/');
});

module.exports = router;
