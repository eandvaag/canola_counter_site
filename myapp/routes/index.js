var express = require('express');
var upload_files = require('multer')();
var router = express.Router();

let landing = require('../controllers/landing');
let socket_api = require("../socket_api");

router.get('/', landing.get_sign_in);
router.post('/', landing.post_sign_in);
router.get('/home', landing.get_home);
router.post('/home', landing.post_home);
router.get('/annotate/:farm_name/:field_name/:mission_date', landing.get_annotate);
router.post('/annotate/:farm_name/:field_name/:mission_date', landing.post_annotate);
//router.get('/upload', landing.get_upload);
router.post('/upload', upload_files.array('source_file[]'), landing.post_upload);
//router.get('/train', landing.get_train);
//router.get('/predict', landing.get_predict);
router.get('/manage', landing.get_manage);
router.post('/manage', landing.post_manage);
//router.get('/results', landing.get_results);

//router.get('/viewer/:job_uuid/:farm_name/:field_name/:mission_date', landing.get_viewer);
//router.post('/viewer/:job_uuid/:farm_name/:field_name/:mission_date', landing.post_viewer);

router.get('/viewer/:farm_name/:field_name/:mission_date/:timestamp', landing.get_viewer);
router.post('/viewer/:farm_name/:field_name/:mission_date/:timestamp', landing.post_viewer);



router.get('/transfer', landing.get_transfer);

router.get('/logout', landing.logout);

router.post('/notification', socket_api.post_notification);

module.exports = router;
