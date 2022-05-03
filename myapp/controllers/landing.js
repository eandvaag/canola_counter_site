

var session = require('express-session');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const xml_js_convert = require('xml-js');
const nat_orderBy = require('natural-orderby');
const { spawn, exec } = require('child_process');
const sanitize = require('sanitize-filename');

const models = require('../models');
const { response } = require('express');

const APP_PREFIX = '/plant_detection';
const USR_DATA_ROOT = 'usr/data/'; //'/home/eaa299/Documents/work/2021/plant_detection/plant_detection/src/usr/data'

const AsyncLock = require('async-lock');
const job_lock = new AsyncLock();

let jobs;
let active_subprocesses = {};


exports.sessionChecker = function(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect(APP_PREFIX + '/user');
    } else {
        next();
    }
}








exports.get_sign_in = function(req, res, next) {
    res.render('sign_in');
}

exports.post_sign_in = function(req, res, next) {
    let response = {};
    response.not_found = false;
    response.error = false;

    return models.users.findOne({
    where: {
        username: req.body.username,
    }
    }).then(user => {
        if (!user) {
            response.not_found = true;
            res.json(response);
        }
        else {
            if (!user.check_password(req.body.password)) {
                response.not_found = true;
                res.json(response);
            }
            else {
                req.session.user = user.dataValues;
                response.redirect = APP_PREFIX + "/home";
                res.json(response);
            }
        }
    }).catch(error => {
        response.error = true;
        res.json(response);
    });
}


function get_subdirs(dir) {
    let subdirs = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        let fpath = path.join(dir, file);
        let stat = fs.statSync(fpath);
        if (stat && stat.isDirectory()) {
            subdirs.push(file);
        }
    });
    return subdirs;
}

function fpath_exists(fpath) {
    let exists = true;
    try {
        fs.accessSync(fpath, fs.constants.F_OK);
    }
    catch (e) {
        exists = false;
    }
    return exists;
}

exports.get_transfer = function(req, res, next) {



    let image_sets_data = {};
    let display_sets_root = path.join(USR_DATA_ROOT, "runs", "display");
    //let results_root = path.join(USR_DATA_ROOT, "results");
    let farm_names = get_subdirs(display_sets_root);

    console.log("farm_names", farm_names);
    for (farm_name of farm_names) {
        image_sets_data[farm_name] = {};
        let farm_root = path.join(display_sets_root, farm_name);
        let field_names = get_subdirs(farm_root);
        console.log("field_names", field_names);

        for (field_name of field_names) {
            image_sets_data[farm_name][field_name] = [];
            let field_root = path.join(farm_root, field_name);
            let mission_dates = get_subdirs(field_root);
            console.log("mission_dates", mission_dates);

            for (mission_date of mission_dates) {
                image_sets_data[farm_name][field_name].push(mission_date);
            }
        }
    }


    res.render("transfer", {image_sets_data: image_sets_data});


}



exports.get_home = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {

        console.log("gathering image_sets data");

        let image_sets_data = {};
        let image_sets_root = path.join(USR_DATA_ROOT, "image_sets");
        let results_root = path.join(USR_DATA_ROOT, "results");
        let farm_names = get_subdirs(image_sets_root);

        console.log("farm_names", farm_names);
        for (farm_name of farm_names) {
            image_sets_data[farm_name] = {};
            let farm_root = path.join(image_sets_root, farm_name);
            let field_names = get_subdirs(farm_root);
            console.log("field_names", field_names);

            for (field_name of field_names) {
                image_sets_data[farm_name][field_name] = {};
                let field_root = path.join(farm_root, field_name);
                let mission_dates = get_subdirs(field_root);
                console.log("mission_dates", mission_dates);

                for (mission_date of mission_dates) {
                    image_sets_data[farm_name][field_name][mission_date] = [];
                    let mission_root = path.join(field_root, mission_date);
                    
                    results_dir = path.join(results_root, farm_name, field_name, mission_date);
                    if (fs.existsSync(results_dir)) {
                        let jobs = get_subdirs(results_dir);
                        image_sets_data[farm_name][field_name][mission_date] = jobs;
                    }
                    else {
                        image_sets_data[farm_name][field_name][mission_date] = [];
                    }
                }
            }
        }

        res.render("home", {image_sets_data: image_sets_data});
        
    }
    else {
        res.redirect(APP_PREFIX);
    }
}

exports.get_annotate = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {
        
        let farm_name = req.params.farm_name;
        let field_name = req.params.field_name;
        let mission_date = req.params.mission_date;

        let image_set_root = path.join(USR_DATA_ROOT, "image_sets", farm_name,
                                            field_name, mission_date);
        let image_set_data_path = path.join(image_set_root, "image_set_data.json");
        let images_dir = path.join(image_set_root, "images");
        let dzi_images_dir = path.join(image_set_root, "dzi_images");


        //let image_set_data = JSON.parse(fs.readFileSync(image_set_data_path, 'utf8'));        



        let annotations_path = path.join(image_set_root, "annotations", "annotations_w3c.json");
        



        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }

        let dzi_image_paths = [];
        for (image_name of Object.keys(annotations)) {
            let dzi_image_path = path.join(APP_PREFIX, dzi_images_dir, image_name + ".dzi");
            dzi_image_paths.push(dzi_image_path);

        }

        /*
        if (fpath_exists(annotations_path)) {
            console.log("loading annotations");

            console.log("annotations", annotations);
        }
        else {
            console.log("annotations not found");
            annotations = null;
        }*/

        

        let metadata = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date
        }

        console.log("ready to render");
        let data = {};
        data["metadata"] = metadata;
        //data["image_set_data"] = image_set_data;
        data["dzi_image_paths"] = nat_orderBy.orderBy(dzi_image_paths);
        data["annotations"] = annotations;
        res.render("annotate", {data: data});
        
    }
    else {
        res.redirect(APP_PREFIX);
    }

}

exports.post_annotate = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {

    console.log("post_annotate");
    let response = {};
    /*
    console.log("req.body", req.body);

    let annotations =  JSON.parse(req.body.annotations);
    console.log(annotations);*/

    let farm_name = req.params.farm_name;
    let field_name = req.params.field_name;
    let mission_date = req.params.mission_date;

    let image_set_root = path.join(USR_DATA_ROOT, "image_sets", farm_name,
                                        field_name, mission_date);

    let annotations_path = path.join(image_set_root, "annotations", "annotations_w3c.json")


    try {
        fs.writeFileSync(annotations_path, req.body.annotations);
    }
    catch (error) {
        console.log(error);
    }

    //let image_set_data_path = path.join(image_set_root, "image_set_data.json");
    

    /*
    let image_set_data;
    try {
        image_set_data = JSON.parse(fs.readFileSync(image_set_data_path, 'utf8'));
    }
    catch (error) {
        console.log(error);
    }
    console.log("read in image_set_data", image_set_data);
    for (img_name of Object.keys(annotations)) {
        let num_annotations = annotations[img_name].length;
        let prev_status = image_set_data["images"][img_name]["status"];
        if (num_annotations == 0) {
            image_set_data["images"][img_name]["status"] = "unannotated";
        }
        else if ((num_annotations > 0) && (prev_status === "unannotated")) {
            image_set_data["images"][img_name]["status"] = "started";
        }
    }*/
    //console.log("writing image_set_data", image_set_data);
    /*
    try {
        fs.writeFileSync(image_set_data_path, req.body.image_set_data);
    }
    catch (error) {
        console.log(error);
    }*/

    response.error = false;
    //response.image_set_data = image_set_data;
    res.json(response);
    /*
    let parsed = JSON.parse(req.body);
    console.log("parsed", parsed);
    console.log("annotations", parsed["annotations"]);*/
    
    }
    else {
        res.redirect(APP_PREFIX);
    }
}

/*
exports.get_upload = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {
        res.render("upload");
    }
    else {
        res.redirect(APP_PREFIX);
    }
}
*/




exports.post_upload = function(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {


        console.log("Got to post_upload");
        let farm_name;
        let field_name;
        let mission_date;
        let first;
        let queued_filenames;
        if (req.files.length > 1) {
            farm_name = req.body.farm_name[0];
            field_name = req.body.field_name[0];
            mission_date = req.body.mission_date[0];
            //first_batch = req.body.first_batch[0];
            first = false;
            for (let i = 0; i < req.body.first.length; i++) {
                if (req.body.first[i] === "yes") {
                    first = true;
                }
            }
            queued_filenames = req.body.queued_filenames[0].split(",");
        }
        else {
            farm_name = req.body.farm_name;
            field_name = req.body.field_name;
            mission_date = req.body.mission_date;
            first = req.body.first === "yes";
            queued_filenames = req.body.queued_filenames.split(",");
        }

        console.log("contains first?", first);
        console.log("queued_filenames", queued_filenames);

        let format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
        for (file of req.files) {
            if (!(file.mimetype.startsWith('image/'))) {
                return res.status(422).json({
                    error: "One or more provided files is not an image."
                });
            }
            if (format.test(file.originalname)) {
            //if (!(file.originalname.match(/^[^a-zA-Z0-9.]+$/))) {
                return res.status(422).json({
                    error: "One or more provided filenames contains illegal characters."
                });
            }
        }

        let image_sets_root = path.join(USR_DATA_ROOT, "image_sets");
        let farm_dir = path.join(image_sets_root, farm_name);
        let field_dir = path.join(farm_dir, field_name);
        let mission_dir = path.join(field_dir, mission_date);
        let images_dir = path.join(mission_dir, "images");
        //let patches_dir = path.join(mission_dir, "patches");
        let dzi_images_dir = path.join(mission_dir, "dzi_images");
        let conversion_tmp_dir = path.join(dzi_images_dir, "conversion_tmp");
        let annotations_dir = path.join(mission_dir, "annotations");

        if (first) {
            if (fpath_exists(mission_dir)) {
                return res.status(422).json({
                    error: "The provided farm-field-mission combination already exists."
                }); 
            }
            else {
                console.log("Making the image set directories");
                fs.mkdirSync(images_dir, { recursive: true });
                fs.mkdirSync(dzi_images_dir, { recursive: true });
                fs.mkdirSync(conversion_tmp_dir, { recursive: true });
                /*fs.mkdirSync(patches_dir, { recursive: true });*/
                fs.mkdirSync(annotations_dir, { recursive: true });
    
                console.log("Making the annotations file");
                let annotations_path = path.join(annotations_dir, "annotations_w3c.json");
                let annotations = {};
                for (filename of queued_filenames) {
                    let sanitized_fname = sanitize(filename);
                    let extensionless_fname = sanitized_fname.substring(0, sanitized_fname.length-4);
                    annotations[extensionless_fname] = {
                        "status": "unannotated",
                        "annotations": []
                    };
                }
                console.log("Writing the annotations file");
                try {
                    fs.writeFileSync(annotations_path, JSON.stringify(annotations));
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
        else {
            if (!(fpath_exists(mission_dir))) {
                return res.status(422).json({
                    error: "Image set directories were not created by initial request."
                });
            }
        }
        console.log("Converting the files");
        for (file of req.files) {
            let sanitized_fname = sanitize(file.originalname);
            let extensionless_fname = sanitized_fname.substring(0, sanitized_fname.length-4);
            let extension = sanitized_fname.substring(sanitized_fname.length-4);
            let fpath = path.join(images_dir, sanitized_fname);
            try {
                fs.writeFileSync(fpath, file.buffer);
            }
            catch (error) {
                console.log(error);
            }

            let img_dzi_path = path.join(dzi_images_dir, extensionless_fname);

            let no_convert_extensions = [".jpg", ".JPG", ".png", ".PNG"];
            if (!(no_convert_extensions.includes(extension))) {
                let tmp_path = path.join(conversion_tmp_dir, extensionless_fname + ".jpg");
                let conv_cmd = "convert " + fpath + " " + tmp_path;
                let slice_cmd = "./MagickSlicer/magick-slicer.sh '" + tmp_path + "' '" + img_dzi_path + "'";
                let result = exec(conv_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                    if (error) {
                        console.log(error.stack);
                        console.log('Error code: '+error.code);
                        console.log('Signal received: '+error.signal);
                    }
                    else {
                        let result = exec(slice_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                            if (error) {
                                console.log(error.stack);
                                console.log('Error code: '+error.code);
                                console.log('Signal received: '+error.signal);                                    
                            }
                            else {
                                try {
                                    fs.unlinkSync(tmp_path);
                                }
                                catch (error) {
                                    console.log(error);
                                }
                            }
                        });

                    }
                });
            }
            else {
                let slice_cmd = "./MagickSlicer/magick-slicer.sh '" + fpath + "' '" + img_dzi_path + "'";
                let result = exec(slice_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                    if (error) {
                        console.log(error.stack);
                        console.log('Error code: '+error.code);
                        console.log('Signal received: '+error.signal);                                    
                    }
                });
            }
        }
        console.log("Sending success status");
        return res.sendStatus(200);
    }
    else {        
        res.redirect(APP_PREFIX);
    }
}
/*
exports.post_upload = function(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        let response = {};

        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;
        let image_names = req.body.image_names;

        let image_sets_root = path.join(USR_DATA_ROOT, "image_sets");
        let farm_dir = path.join(image_sets_root, farm_name);
        let field_dir = path.join(farm_dir, field_name);
        let mission_dir = path.join(field_dir, mission_date);

        if (!(fpath_exists(mission_dir))) {

            fs.mkdirSync(mission_dir, { recursive: true });

            let image_set_data_path = path.join(mission_dir, "image_set_data.json");
            let image_set_data = {};


            image_set_data["images"] = [];
            for (image_name of image_names) {
                image_set_data["images"][image_name] = {
                    "status": "not_annotated"
                };
            }

            image_set_data["class_map"] = {"plant": 0};
            image_set_data["num_classes"] = 1;
            image_set_data["annotation_counts"] = {"plant": 0};

            fs.writeFile("image_set_data.json", image_set_data, (error) => {
                if (error) {
                    // clean up, return error
                }
                else {
                    response.error = false;
                    response.message = "Image set has been successfully registered";
                    res.json(response);
                }

            });

        }
        else {
            response.error = true;
            response.message = "The provided farm-field-mission combination already exists";
            res.json(response);
        }



    }
    else {        
        res.redirect(APP_PREFIX);
    }
}
*/
/*
exports.get_train = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {
        res.render("train");
    }
    else {
        res.redirect(APP_PREFIX);
    }
}


exports.get_predict = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {
        res.render("predict");
    }
    else {
        res.redirect(APP_PREFIX);
    }
}*/

/*
exports.get_results_dep = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {

        return models.users.findOne({
            where : {
                username : req.session.user.username
            }
        })
        .then(user => {

            let inference_lookup_path = path.join(USR_DATA_ROOT, "records", "inference_lookup.json");
            let inference_lookup = JSON.parse(fs.readFileSync(inference_lookup_path, 'utf8'));
            let user_data = inference_lookup["inference_runs"];

            models.groups.destroy({
                where: {
                    creator: req.session.user.username,
                }
            }).then(() => {
                res.render("results", {username: req.session.user.username, user_data: user_data});

            }).catch(error => {
                console.log(error);
            });

        }).catch(error => {
            console.log(error);
        });
    }
    else {
        res.redirect(APP_PREFIX);
    }

}*/

/*
exports.post_results_dep = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {

        let response = {};
        let username = req.session.user.username;
        let action = req.body.action;

        if (action == "view_user_group") {

            let farm_name = req.body.farm_name;
            let field_name = req.body.field_name;
            let mission_date = req.body.mission_date;
            let dataset_name = req.body.dataset_name;

            let group_uuid = uuidv4();

            return models.groups.create({
                uuid: group_uuid,
                creator: username,
                name: null,
                description: null,
                farm_name: farm_name,
                field_name: field_name,
                mission_date: mission_date,
                dataset_name: dataset_name,
                model_uuids: req.body.model_uuids,
                model_names: req.body.model_names,
                prediction_dirnames: req.body.prediction_dirnames,
                system_group: false,
                highlighted_param: null,
                replications: null
            })
            .then(group => {
                response.error = false;
                response.redirect = APP_PREFIX + "/viewer/" + group_uuid.toString();
                res.json(response);

            }).catch(error => {
                console.log(error);
                response.error = true;
                response.message = "An error occurred while creating the group: " + error;
                res.json(response);
            });
        }

        else if (action == "view_system_group") {

            let view_group_uuid = uuidv4();

            let farm_name = req.body.farm_name;
            let field_name = req.body.field_name;
            let mission_date = req.body.mission_date;
            let dataset_name = req.body.dataset_name;
            let group_uuid = req.body.group_uuid;

            let group_config_path = path.join(USR_DATA_ROOT, "groups", group_uuid + ".json");
            let group_config = JSON.parse(fs.readFileSync(group_config_path, 'utf8'));

            let inference_lookup_path = path.join(USR_DATA_ROOT, "records", "inference_lookup.json");
            let inference_lookup = JSON.parse(fs.readFileSync(inference_lookup_path, 'utf8'));
            let d = inference_lookup["inference_runs"][farm_name][field_name][mission_date][dataset_name];
            
            let model_uuids = [];
            let model_names = [];
            let prediction_dirnames = [];

            for (model_uuid of Object.keys(d)) {
                model_entry = d[model_uuid];
                if (model_entry["group_uuid"] === group_uuid) {
                    model_uuids.push(model_entry["model_uuid"]);
                    model_names.push(model_entry["model_name"]);
                    prediction_dirnames.push(model_entry["prediction_dirname"]);
                }
            }

            let replications = group_config["replications"];
            let highlighted_param;
            let highlighted_param_config;
            let highlighted_param_name;
            if ("variation_config" in group_config) {
                highlighted_param_config = group_config["variation_config"]["param_configs"][0];
                highlighted_param_name = group_config["variation_config"]["param_names"][0];
                highlighted_param = highlighted_param_config + "::" + highlighted_param_name;
            }
            else {
                highlighted_param = null;
            }

            return models.groups.create({
                uuid: view_group_uuid,
                creator: username,
                name: group_config["group_name"],
                description: group_config["group_description"],
                farm_name: farm_name,
                field_name: field_name,
                mission_date: mission_date,
                dataset_name: dataset_name,
                model_uuids: model_uuids.join(","),
                model_names: model_names.join(","),
                prediction_dirnames: prediction_dirnames.join(","),
                system_group: true,
                highlighted_param: highlighted_param,
                replications: replications
            }).then(group => {
                response.error = false;
                response.redirect = APP_PREFIX + "/viewer/" + view_group_uuid.toString();
                res.json(response);
            }).catch(error => {
                console.log(error);
                response.error = true;
                response.message = "An error occurred while fetching the group: " + error;
                res.json(response);
            });
        }
        else {
            response.error = true;
            response.message = "Unknown action requested: " + action;
            res.json(response);
        }

    }
    else {        
        res.redirect(APP_PREFIX);
    }

}
*/
function dataset_is_annotated(dataset_name) {
    return (dataset_name !== "all");
}

function get_dict_keys(d, prefix="", root=true) {

    let keys = [];

    let r_keys;
    for (k of Object.keys(d)) {
        if (d[k].constructor == Object) {
            if (root) {
                r_keys = get_dict_keys(d[k], prefix + k, false);
            } else {
                r_keys = get_dict_keys(d[k], prefix + "/" + k, false);
            }
            keys.push(...r_keys);
        } 
        else {
            if (root)
                keys.push(prefix + k);
            else
                keys.push(prefix + "/" + k);
        }
    }
    return keys;
}

/*
exports.get_viewer_dep = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {

        return models.groups.findOne({
            where: { 
                uuid: req.params.group_uuid
            }
        })
        .then(group => {
            let model_uuids = group.model_uuids.split(",");
            let prediction_dirnames = group.prediction_dirnames.split(",");
            let inference_lookup_path = path.join(USR_DATA_ROOT, "records", "inference_lookup.json");
            let inference_lookup = JSON.parse(fs.readFileSync(inference_lookup_path, 'utf8'));

            let image_set_config_path = path.join(USR_DATA_ROOT, "image_sets", 
                                                  group.farm_name, group.field_name, group.mission_date, "image_set_config.json")
            let image_set_config = JSON.parse(fs.readFileSync(image_set_config_path, 'utf8'));

            let metadata = {
                "farm_name": group.farm_name,
                "field_name": group.field_name,
                "mission_date": group.mission_date,
                "dataset_name": group.dataset_name,
                "dataset_is_annotated": dataset_is_annotated(group.dataset_name),
                "group_name": group.name,
                "group_description": group.description,
                "system_group": group.system_group,
                "model_names": group.model_names.split(","),
                "model_uuids": group.model_uuids.split(","),
                "highlighted_param": group.highlighted_param,
                "replications": group.replications,
                "class_map": image_set_config["class_map"],
                "prediction_dirnames": prediction_dirnames
            };

            let predictions = {};
            let dzi_image_paths = [];
            let annotations = {};
            let models_root = path.join(USR_DATA_ROOT, "models");

            let config_keys = [];
            let configs = {"arch": {}, "training": {}, "inference": {}};
            let loss_records = {};
            let excluded_keys = ["model_uuid", "model_name"];
            let seq_num;
            let loss_record_path;
            let loss_record;
            let loss_record_names;
            for (let i = 0; i < model_uuids.length; i++) {
                let model_uuid = model_uuids[i];
                let prediction_dirname = prediction_dirnames[i];
                let model_instance_root = path.join(models_root, model_uuid);
                let prediction_path = path.join(model_instance_root, "predictions", prediction_dirname, "predictions.json");


                let model_predictions = JSON.parse(fs.readFileSync(prediction_path, 'utf8'));
                predictions[model_uuid] = model_predictions;


                let arch_config_path = path.join(model_instance_root, "arch_config.json");
                let training_config_path = path.join(model_instance_root, "training_config.json");
                let inference_config_path = path.join(model_instance_root, "inference_config.json");

                let loss_record_dir = path.join(model_instance_root, "loss_records");

                loss_records[model_uuid] = {};
                loss_record_names = fs.readdirSync(loss_record_dir);
                loss_record_names.forEach(loss_record_name => {
                    seq_num = parseInt(loss_record_name.substring(0, loss_record_name.length - 5));
                    loss_record_path = path.join(loss_record_dir, loss_record_name);
                    loss_record = JSON.parse(fs.readFileSync(loss_record_path, 'utf8'));
                    loss_records[model_uuid][seq_num] = loss_record;
                });


                let arch_config = JSON.parse(fs.readFileSync(arch_config_path, 'utf8'));
                let training_config = JSON.parse(fs.readFileSync(training_config_path, 'utf8'));
                let inference_config = JSON.parse(fs.readFileSync(inference_config_path, 'utf8'));

                let arch_keys = get_dict_keys(arch_config, "arch::");
                let training_keys = get_dict_keys(training_config, "training::");
                let inference_keys = get_dict_keys(inference_config, "inference::");

                for (arch_key of arch_keys) {
                    if (config_keys.indexOf(arch_key) === -1)
                        config_keys.push(arch_key);
                }
                for (training_key of training_keys) {
                    if (config_keys.indexOf(training_key) === -1)
                        config_keys.push(training_key);
                }
                for (inference_key of inference_keys) {
                    if (config_keys.indexOf(inference_key) === -1)
                        config_keys.push(inference_key);
                }                

                configs["arch"][model_uuid] = arch_config;
                configs["training"][model_uuid] = training_config;
                configs["inference"][model_uuid] = inference_config;

                if (i == 0) {
                    for (image_name in model_predictions["image_predictions"]) {
                        let dzi_image_path = path.join(APP_PREFIX, USR_DATA_ROOT, "image_sets", 
                                                group.farm_name, group.field_name, group.mission_date, 
                                                "dzi_images", image_name + ".dzi");
                        dzi_image_paths.push(dzi_image_path);


                        let xml_path = path.join(USR_DATA_ROOT, "image_sets",
                                                 group.farm_name, group.field_name, group.mission_date,
                                                 "images", image_name + ".xml");

                        //path.exists(xml_path, function(exists) {
                        let exists = true;
                        try {
                            fs.accessSync(xml_path, fs.constants.F_OK);
                        }
                        catch (e) {
                            exists = false;
                        }

                        if (exists) {
                            let img_annotations = get_annotations(xml_path);
                            annotations[image_name] = img_annotations;
                        }
                        //});
                    }
                }
            }

            let data = {};
            data["metadata"] = metadata;
            data["annotations"] = annotations;
            data["predictions"] = predictions;
            data["configs"] = configs;
            data["config_keys"] = config_keys;
            data["loss_records"] = loss_records;
            data["dzi_image_paths"] = nat_orderBy.orderBy(dzi_image_paths);

            res.render("viewer", {data: data});

        }).catch(err => {
            console.log(err);
        });
    }
    else {
        res.redirect(APP_PREFIX);
    }

}
exports.post_viewer_dep = function(req, res, next) {
    console.log("got to post viewer");
    
    if (req.session.user && req.cookies.user_sid) {

        let response = {};
        console.log("generating ensemble uuid");
        
        let ensemble_uuid = uuidv4().toString();

        //let ensemble_uuid = req.body.ensemble_uuid;
        let ensemble_req = {
            "request_type": "ensemble_predictions",
            "request_args": {
                "ensemble_uuid": ensemble_uuid,
                "model_uuids": req.body.model_uuids.split(","),
                "prediction_dirnames": req.body.prediction_dirnames.split(","),
                "ensemble_method": req.body.ensemble_method,
                "inter_group_iou_thresh": parseFloat(req.body.inter_group_iou_thresh),
                "intra_group_iou_thresh": parseFloat(req.body.intra_group_iou_thresh)
            }
        }

        console.log("ensemble_req", ensemble_req);

        let ensemble_dir = path.join(USR_DATA_ROOT, "ensembles", ensemble_uuid);

        console.log("creating ensemble dir");
        fs.mkdir(ensemble_dir, (error) => {

            if (error) {
                response.error = true;
                response.message = "An error occurred while creating the ensemble.";
                res.json(response);
            }

            else {
                let ensemble_req_path = path.join(ensemble_dir, "request.json");

                console.log("writing request");
                fs.writeFile(ensemble_req_path, JSON.stringify(ensemble_req), (error) => {

                    if (error) {
                        fs.rmdir(ensemble_dir, { recursive: true, }, (error) => {
                            response.error = true;
                            response.message = "An error occurred while saving the ensemble request.";
                            res.json(response);
                        });
                    }

                    else {
                        let cmd = "python3 ../../plant_detection/src/main.py " + ensemble_req_path;

                        console.log("creating ensemble");
                        const result = exec(cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {

                            if (error) {       
                                console.log(error.stack);
                                console.log('Error code: '+error.code);
                                console.log('Signal received: '+error.signal);

                                fs.rmdir(ensemble_dir, { recursive: true, }, (error) => {
                                    response.error = true;
                                    response.message = "An error occurred while generating the ensemble.";
                                    res.json(response);
                                });
                            }
                            else {
                                let ensemble_predictions_path = path.join(ensemble_dir, "predictions.json");

                                console.log("reading ensemble results");
                                fs.readFile(ensemble_predictions_path, "utf8", (error, data) => {

                                    if (error) {
                                        response.error = true;
                                        response.message = "An error occurred while retrieving the ensemble.";
                                        res.json(response);
                                    }
                                    else {
                                        console.log("destroying ensemble dir");
                                        fs.rmdir(ensemble_dir, { recursive: true, }, (error) => {

                                            if (error) {
                                                response.error = true;
                                                response.message = "An error occurred during clean-up of the ensemble.";
                                                res.json(response);
                                            }
                                            else {
                                                let ensemble_predictions = JSON.parse(data);
                                                response.error = false;
                                                response.ensemble_uuid = ensemble_uuid;
                                                response.predictions = ensemble_predictions;
                                                response.request = ensemble_req;
                                                res.json(response);

                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    else {
        res.redirect(APP_PREFIX);
    }
}
*/

/*

exports.get_results = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {
        console.log("gathering results data");

        let results_data = {};
        let results_root = path.join(USR_DATA_ROOT, "results");
        let farm_names = get_subdirs(results_root);

        console.log("farm_names", farm_names);
        for (farm_name of farm_names) {
            results_data[farm_name] = {};
            let farm_root = path.join(results_root, farm_name);
            let field_names = get_subdirs(farm_root);
            console.log("field_names", field_names);

            for (field_name of field_names) {
                results_data[farm_name][field_name] = {};
                let field_root = path.join(farm_root, field_name);
                let mission_dates = get_subdirs(field_root);
                console.log("mission_dates", mission_dates);

                for (mission_date of mission_dates) {
                    results_data[farm_name][field_name][mission_date] = [];
                    let mission_root = path.join(field_root, mission_date);
                    let groups = get_subdirs(mission_root);

                    
                    for (group of groups) {
                        results_data[farm_name][field_name][mission_date].push(group);
                        
                        group_parts = group.split("_");
                        group_uuid = group_parts[group_parts.length-1];
                        group_name = group.substring(0, group.length-group_uuid.length-1);
                        results_data[farm_name][field_name][mission_date][group_uuid] = group_name;
                    }
                }
                


                
                for (mission_date of mission_dates) {
                    
                    console.log("Checking", mission_date);
                    let mission_date_root = path.join(field_root, mission_date);
                    let image_set_config_path = path.join(mission_date_root, "image_set_config.json");
                    let exists = true;
                    try {
                        fs.accessSync(image_set_config_path, fs.constants.F_OK);
                    }
                    catch (e) {
                        exists = false;
                    }

                    if (exists) {
                        let image_set_config = JSON.parse(fs.readFileSync(image_set_config_path, 'utf8'));
                        image_sets_data[farm_name][field_name][mission_date] = image_set_config;
                    }
                }
            }
        }

        res.render("results", {results_data: results_data});

    }
    else {
        res.redirect(APP_PREFIX);
    }
}*/

exports.post_home = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {
        let action = req.body.action;
        let response = {};
        if (action === "delete_image_set") {

            /* KEEP THIS OUT FOR NOW */
            /*
            let farm_name = req.body.farm_name;
            let field_name = req.body.field_name;
            let mission_date = req.body.mission_date;

            let mission_dir = path.join(USR_DATA_ROOT, "image_sets", farm_name, field_name, mission_date);
            fs.rmSync(mission_dir, { recursive: true, force: true });
            let field_dir = path.join(USR_DATA_ROOT, "image_sets", farm_name, field_name);
            let missions = get_subdirs(field_dir);
            if (missions.length == 0) {
                fs.rmSync(field_dir, { recursive: true, force: true });
                let farm_dir = path.join(USR_DATA_ROOT, "image_sets", farm_name);
                let fields = get_subdirs(farm_dir);
                if (fields.length == 0) {
                    fs.rmSync(farm_dir, { recursive: true, force: true });
                }
            }
            */

            response.error = false;
            response.redirect = APP_PREFIX + "/home";
            res.json(response);
        }
        else if (action === "view_job") {
            let job_uuid = req.body.job_uuid;        
            let farm_name = req.body.farm_name;
            let field_name = req.body.field_name;
            let mission_date = req.body.mission_date;
            response.error = false;
            response.redirect = APP_PREFIX + "/viewer/" + job_uuid + "/" + 
                                farm_name + "/" + field_name + "/" + mission_date;
            res.json(response);
        }
        else if (action === "manage_jobs_request") {
            response.redirect = APP_PREFIX + "/manage";
            res.json(response);
        
        }
        else if (action === "submit_training_request") {

            

            let job_uuid = uuidv4().toString();
            let farm_name = req.body.farm_name;
            let field_name = req.body.field_name;
            let mission_date = req.body.mission_date;
            let job_name = req.body.job_name;

            let format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
            if (format.test(job_name)) {
                response.error = true;
                response.message = "Group name contains illegal characters.";
                res.json(response);
            }
            else {


                
                let job_manager_path = path.join(USR_DATA_ROOT, "jobs", "jobs.json");
                let job_config_path = path.join(USR_DATA_ROOT, "jobs", job_uuid + ".json");
                let job_config = {
                    "job_uuid": job_uuid,
                    "job_name": job_name,
                    "target_farm_name": farm_name,
                    "target_field_name": field_name,
                    "target_mission_date": mission_date,
                    "source_construction_params": {
                        "method": "even_subset",
                        "size": 5000
                    }
                }


                
                //let jobs = JSON.parse(fs.readFileSync(jobs_path, 'utf8'));

                job_lock.acquire(jobs, function() {
                    
                    
                    jobs = JSON.parse(fs.readFileSync(job_manager_path, 'utf8'));

                    if (jobs["num_active_jobs"] >= jobs["max_jobs"]) {
                    //if (false) {
                        
                        //throw new Error("Maximum number of active jobs reached");
                        response.error = true;
                        response.message = "Too many active jobs.";
                    }
                    else {
                        //let jobs = {"num_active_jobs": 0, "active_jobs": []};
                        jobs["num_active_jobs"] += 1;
                        jobs["active_jobs"].push(job_uuid);
                        try {
                            fs.writeFileSync(job_manager_path, JSON.stringify(jobs));
                            fs.writeFileSync(job_config_path, JSON.stringify(job_config));
                            response.error = false;
                            response.message = "Starting to run job.";
                        }
                        catch (error) {
                            console.log("error occurred");
                            console.log(error);
                            response.error = true;
                            response.message = "File I/O error occurred.";
                        }

                    }
                }).catch(function(error) {
                    console.log(error.message);
                    response.message = "Failed to acquire jobs lock.";
                    response.error = true;
                    res.json(response);
                });
                if (!(response.error)) {

                    let subprocess = spawn("python3", ["../../plant_detection/src/main.py", 
                                            job_uuid]);

                    console.log("adding subprocess");
                    job_lock.acquire(active_subprocesses, function() {
                        active_subprocesses[job_uuid] = subprocess.pid;
                        console.log("Active subprocesses", active_subprocesses);
                    }).catch(function(error) {
                        console.log(error.message);
                        response.message = "Failed to acquire active_subprocesses lock.";
                        response.error = true;
                        res.json(response);
                    });


                    //let subprocess = spawn("sleep", ["15"]);
                    subprocess.on('close', (code) => {
                        console.log("Process finished.");
                        console.log("code", code);


                        //let jobs_path = path.join("usr", "jobs", "jobs.json");
                        //let jobs = JSON.parse(fs.readFileSync(jobs_path, 'utf8'));
                        job_lock.acquire(jobs, function() {
                            jobs = JSON.parse(fs.readFileSync(job_manager_path, 'utf8'));
                            jobs["num_active_jobs"] -= 1;
                            let index = jobs["active_jobs"].indexOf(job_uuid);
                            if (index > -1) {
                                jobs["active_jobs"].splice(index, 1); // 2nd parameter means remove one item only
                            }
                            try {
                                fs.writeFileSync(job_manager_path, JSON.stringify(jobs));
                            }
                            catch (error) {
                                console.log(error);
                            }
                        
                        }).catch(function(error) {
                            console.log(error);
                        });

                        job_lock.acquire(active_subprocesses, function() {
                            delete active_subprocesses[job_uuid];
                        }).catch(function(error) {
                            console.log(error);
                        });
                        
                    })
                    
                    subprocess.stderr.on('data', (data) => {
                        /* for some reason listening on stderr is required for files to be 
                            output correctly by the subprocess ?? */
                        console.error(`subprocess stderr: ${data}`);
                    });
                    subprocess.stdout.on('data', (data) => {
                        console.log(`subprocess stdout: ${data}`);
                    });

                    subprocess.on('SIGINT', function() {
                        console.log('Received SIGINT signal');
                        job_lock.acquire(jobs, function() {
                            delete active_subprocesses[job_uuid];
                        }).catch(function(error) {
                            console.log(error);
                        });
                    });
                
                    subprocess.on('error', (err) => {
                        console.log("Failed to start subprocess.");
                        job_lock.acquire(jobs, function() {
                            jobs = JSON.parse(fs.readFileSync(job_manager_path, 'utf8'));
                            jobs["num_active_jobs"] -= 1;
                            let index = jobs["active_jobs"].indexOf(job_uuid);
                            if (index > -1) {
                                jobs["active_jobs"].splice(index, 1); // 2nd parameter means remove one item only
                            }
                            try {
                                fs.writeFileSync(job_manager_path, JSON.stringify(jobs));
                            }
                            catch (error) {
                                console.log(error);
                            }
                            
                        }).catch(function(error) {
                            console.log(error);
                        });
                        

                        job_lock.acquire(active_subprocesses, function() {
                            delete active_subprocesses[job_uuid];
                        }).catch(function(error) {
                            console.log(error);
                        });
                    });

                    res.json(response);
                }
                else {
                    res.json(response);
                }
            }
        }
        else {
            console.log("invalid action", action);
            response.message = "Invalid action specified.";
            response.error = true;
            res.json(response);
        }
    }
    else {
        res.redirect(APP_PREFIX);
    }

}
exports.get_viewer = function(req, res, next) {
    
    if (req.session.user && req.cookies.user_sid) {
        let job_uuid = req.params.job_uuid;
        let farm_name = req.params.farm_name;
        let field_name = req.params.field_name;
        let mission_date = req.params.mission_date;

        let job_config;
        let job_config_path = path.join(USR_DATA_ROOT, "jobs", job_uuid + ".json");
        try {
            job_config = JSON.parse(fs.readFileSync(job_config_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }

        let predictions = {};
        let metrics = {};
        let overlays = {};

        let results_dirname = job_uuid;
        let results_dir = path.join(USR_DATA_ROOT, "results", 
                                    farm_name, field_name, mission_date, results_dirname);

        for (model_info of job_config["model_info"]) {
            let model_uuid = model_info["model_uuid"];
            let model_name = model_info["model_name"];

            let model_dir = path.join(results_dir, model_uuid);
            let predictions_path = path.join(model_dir, "predictions.json");
            let metrics_path = path.join(model_dir, "metrics.json");
            let predictions_w3c_path = path.join(model_dir, "annotations.json");
            /*
            let model_predictions;
            try {
                model_predictions = JSON.parse(fs.readFileSync(predictions_path, 'utf8'));
                predictions[model_uuid] = model_predictions;
            }
            catch (error) {
                console.log(error);
            }*/
            
            let model_metrics;
            try {
                model_metrics = JSON.parse(fs.readFileSync(metrics_path, 'utf8'));
                metrics[model_uuid] = model_metrics;
            }
            catch (error) {
                console.log(error);
            }

            try {
                model_predictions_w3c = JSON.parse(fs.readFileSync(predictions_w3c_path, 'utf8'));
                overlays[model_uuid] = model_predictions_w3c;
            }
            catch (error) {
                console.log(error);
            }

        }
        let image_set_root = path.join(USR_DATA_ROOT, "image_sets",
                                      farm_name, field_name, mission_date);
        let annotations_path = path.join(image_set_root, "annotations", "annotations_w3c.json");
        
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }

        overlays["annotations"] = annotations

        
        let dzi_images_dir = path.join(image_set_root, "dzi_images");

        let dzi_image_paths = [];
        for (image_name of Object.keys(annotations)) {
            let dzi_image_path = path.join(APP_PREFIX, dzi_images_dir, image_name + ".dzi");
            dzi_image_paths.push(dzi_image_path);

        }

        let metadata = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date
        }

        let data = {};
        data["metadata"] = metadata;
        data["job_config"] = job_config;
        data["overlays"] = overlays;
        //data["predictions"] = predictions;
        data["metrics"] = metrics;
        data["dzi_dir"] = path.join(APP_PREFIX, dzi_images_dir);
        data["dzi_image_paths"] = nat_orderBy.orderBy(dzi_image_paths);

        res.render("viewer", {"data": data});
    }
    
    else {
        res.redirect(APP_PREFIX);
    }
}
exports.post_viewer = function(req, res, next) {

}

exports.get_manage = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {
        
        let job_configs = {};
        let jobs_dir = path.join(USR_DATA_ROOT, "jobs");
        let list = fs.readdirSync(jobs_dir);
        list.forEach(function(file) {
            console.log("file", file);
            if (file !== "jobs.json") {
                job_config = JSON.parse(fs.readFileSync(path.join(jobs_dir, file), 'utf8'));
                job_configs[job_config["job_uuid"]] = job_config;
            }
        });


        // job_configs.sort(function(a, b) {
        //     let keyA = new Date(a.start_time);
        //     let keyB = new Date(b.start_time);

        //     if (keyA < keyB) return -1;
        //     if (keyA > keyB) return 1;
        //     return 0;
        // });


        res.render("manage", {job_configs: job_configs});

    }
    else {
        res.redirect(APP_PREFIX);
    }
}

exports.post_manage = function(req, res, next) {
    
    
    if (req.session.user && req.cookies.user_sid) {
        
        let response = {};
        let action = req.body.action;
        if (action === "refresh") {
            let loss_records = {};
            if (req.body.model_uuids !== "") {
                let model_uuids = req.body.model_uuids.split(",");
                for (model_uuid of model_uuids) {
                    loss_records_dir = path.join(USR_DATA_ROOT, "models", model_uuid, "loss_records");

                    loss_records[model_uuid] = [];
                    if (fs.existsSync(loss_records_dir)) {
                        let list = fs.readdirSync(loss_records_dir);
                        list.sort();
                        list.forEach(function(file) {
                            loss_record = JSON.parse(fs.readFileSync(path.join(loss_records_dir, file), 'utf8'));
                            loss_records[model_uuid].push(loss_record);
                        });
                    }
                }
            }

            let job_configs = {};
            let jobs_dir = path.join(USR_DATA_ROOT, "jobs");
            let list = fs.readdirSync(jobs_dir);
            list.forEach(function(file) {
                if (file !== "jobs.json") {
                    job_config = JSON.parse(fs.readFileSync(path.join(jobs_dir, file), 'utf8'));
                    job_configs[job_config["job_uuid"]] = job_config;
                }
            });

            response.error = false;
            response.loss_records = JSON.stringify(loss_records);
            response.job_configs = JSON.stringify(job_configs);
            res.json(response);
        }
        else if (action === "stop_job") {
            let job_uuid = req.body.job_uuid;

            job_lock.acquire(active_subprocesses, function() {
                let subprocess_pid = active_subprocesses[job_uuid];
                process.kill(subprocess_pid, 'SIGINT');
            }).catch(function(error) {
                console.log(error);
            });
            response.error = false;
            res.json(response);
        }
        else if (action === "destroy_job") {
            let job_uuid = req.body.job_uuid;

            let job_config_path = path.join(USR_DATA_ROOT, "jobs", job_uuid + ".json");
            job_config = JSON.parse(fs.readFileSync(job_config_path, 'utf8'));
            if ("inference_config" in job_config && "image_sets" in job_config["inference_config"]) {
                for (image_set of job_config["inference_config"]["image_sets"]) {
                    let farm_name = image_set["farm_name"];
                    let field_name = image_set["field_name"];
                    let mission_date = image_set["mission_date"];
                    results_dir = path.join(USR_DATA_ROOT, "results", farm_name, field_name, mission_date, job_uuid);
                    if (fs.existsSync(results_dir)) {
                        fs.rmSync(results_dir, { recursive: true, force: true });
                    }
                }
            }
            if ("model_info" in job_config) {
                for (model_info of job_config["model_info"]) {
                    let model_uuid = model_info["model_uuid"];
                    let model_dir = path.join(USR_DATA_ROOT, "models", model_uuid);
                    if (fs.existsSync(model_dir)) {
                        fs.rmSync(model_dir, { recursive: true, force: true });
                    }
                }
            }
            try {
                fs.unlinkSync(job_config_path);
            }
            catch (error) {
                console.log(error);
            }
            response.error = false;
            res.json(response);

        }
        else {
            console.log("invalid action", action)
            response.error = true;
            res.json(response);
        }
        
    }
    else {
        res.redirect(APP_PREFIX);
    }

}

exports.logout = function(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
    }
    res.redirect(APP_PREFIX);
}



function get_annotations(xml_path) {
    let class_name;
    let parsed_annotations = {"class_boxes": {}, "class_counts": {}};
    let xml = fs.readFileSync(xml_path, 'utf8');

    let annotations = JSON.parse(xml_js_convert.xml2json(xml, {compact: true, spaces: 4}));

    for (annotation of annotations["annotation"]["object"]) {

        class_name = annotation["name"]["_text"];
        if (!(class_name in parsed_annotations["class_counts"])) {
            parsed_annotations["class_boxes"][class_name] = [];
            parsed_annotations["class_counts"][class_name] = 0;
        }
        parsed_annotations["class_boxes"][class_name].push([
            parseInt(annotation["bndbox"]["ymin"]["_text"]),
            parseInt(annotation["bndbox"]["xmin"]["_text"]),
            parseInt(annotation["bndbox"]["ymax"]["_text"]),
            parseInt(annotation["bndbox"]["xmax"]["_text"]),
        ]);
        parsed_annotations["class_counts"][class_name] = parsed_annotations["class_counts"][class_name] + 1;
    }


    return parsed_annotations;
}