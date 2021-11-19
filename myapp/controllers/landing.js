

var session = require('express-session');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const xml_js_convert = require('xml-js');

const models = require('../models');

const APP_PREFIX = '/plant_detection';
const USR_DATA_ROOT = 'usr/data/'; //'/home/eaa299/Documents/work/2021/plant_detection/plant_detection/src/usr/data'





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
                response.redirect = APP_PREFIX + "/user";
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



exports.get_user = function(req, res, next) {

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
                res.render("user", {username: req.session.user.username, user_data: user_data});

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

}


exports.post_user = function(req, res, next) {

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


exports.get_viewer = function(req, res, next) {

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
                "group_name": group.name,
                "group_description": group.description,
                "system_group": group.system_group,
                "model_names": group.model_names.split(","),
                "model_uuids": group.model_uuids.split(","),
                "highlighted_param": group.highlighted_param,
                "replications": group.replications,
                "class_map": image_set_config["class_map"]
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

                        let img_annotations = get_annotations(xml_path);
                        annotations[image_name] = img_annotations;
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
            data["dzi_image_paths"] = dzi_image_paths.sort();

            res.render("viewer", {data: data});

        }).catch(err => {
            console.log(err);
        });
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