var express = require('express');
var router = express.Router();

let landing = require('../controllers/landing');

router.get('/', landing.get_sign_in);
router.post('/', landing.post_sign_in);
router.get('/user', landing.get_user);
router.post('/user', landing.post_user);
router.get('/viewer/:group_uuid', landing.get_viewer);
router.get('/logout', landing.logout);

module.exports = router;
