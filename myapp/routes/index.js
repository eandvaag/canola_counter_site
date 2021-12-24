var express = require('express');
var router = express.Router();

let landing = require('../controllers/landing');

router.get('/', landing.get_sign_in);
router.post('/', landing.post_sign_in);
router.get('/home', landing.get_home);
router.get('/upload', landing.get_upload);
router.get('/train', landing.get_train);
router.get('/predict', landing.get_predict);
router.get('/results', landing.get_results);
router.post('/results', landing.post_results);
router.get('/viewer/:group_uuid', landing.get_viewer);
router.post('/viewer/:group_uuid', landing.post_viewer);
router.get('/logout', landing.logout);

module.exports = router;
