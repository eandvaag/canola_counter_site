var express = require('express');
var upload_files = require('multer')();
var router = express.Router();

let landing = require('../controllers/landing');

router.get('/', landing.get_sign_in);
router.post('/', landing.post_sign_in);
router.get('/home', landing.get_home);
router.get('/annotate/:farm_name/:field_name/:mission_date', landing.get_annotate);
router.post('/annotate/:farm_name/:field_name/:mission_date', landing.post_annotate);
router.get('/upload', landing.get_upload);
router.post('/upload', upload_files.array('source_file[]'), landing.post_upload);
router.get('/train', landing.get_train);
router.get('/predict', landing.get_predict);
router.get('/results', landing.get_results);
router.post('/results', landing.post_results);
router.get('/viewer/:group_uuid', landing.get_viewer);
router.post('/viewer/:group_uuid', landing.post_viewer);
router.get('/logout', landing.logout);

module.exports = router;
