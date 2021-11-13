

var session = require('express-session');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const xml_js_convert = require('xml-js');

const models = require('../models');


const USR_DATA_ROOT = 'usr/data/' //'/home/eaa299/Documents/work/2021/plant_detection/plant_detection/src/usr/data'





exports.sessionChecker = function(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/user');
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

    console.log("got username", req.body.username);
    console.log("got password", req.body.password);

    //res.redirect = "/";

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
                console.log("username and pass ok");
                req.session.user = user.dataValues;
                response.redirect = "/user";
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



function is_group_name_unique_for_user(username, trial_name, mission_date, dataset_name, group_name) {
    console.log("checking group_name uniqueness...");
    return models.groups.count({
        where: {
            creator: username,
            name: group_name,
            trial_name: trial_name,
            mission_date: mission_date,
            dataset_name: dataset_name
        }
    }).then(count => {
        return (count == 0);
    }).catch(error => {
        console.log(error);
    });
}




exports.get_user = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {

        return models.users.findOne({
            where : {
                username : req.session.user.username
            }
        })
        .then(user => {
            //user_data = {};

/*
            let image_set_root = path.join(USR_DATA_ROOT, "image_sets");

            let trial_names = get_subdirs(image_set_root);
            trial_names.forEach(function(trial_name) {
                let mission_dates = get_subdirs(path.join(image_set_root, trial_name));
                user_data[trial_name] = {}
                mission_dates.forEach(function(mission_date) {
                    user_data[trial_name][mission_date] = {};
                });
            });*/

            let inference_lookup_path = path.join(USR_DATA_ROOT, "records", "inference_lookup.json");
            let inference_lookup = JSON.parse(fs.readFileSync(inference_lookup_path, 'utf8'));
            let user_data = inference_lookup["inference_runs"];
/*
            for Objectinference_lookup[]


            let model_root = path.join(USR_DATA_ROOT, "models");

            let model_instance_names = get_subdirs(model_root);
            model_instance_names.forEach(function(model_instance_name) {
                let datasets = get_subdirs(path.join(model_root, model_instance_name));
                datasets.forEach(function(dataset) {
                    if (dataset !== "weights") {
                        let inference_config_path = path.join(model_root, model_instance_name, dataset, "inference_config.json");
                        let predictions_path = path.join(model_root, model_instance_name, dataset, "predictions.json");
                        if ((fs.existsSync(inference_config_path)) && (fs.existsSync(predictions_path))) {
                            let inference_config = JSON.parse(fs.readFileSync(inference_config_path, 'utf8'));
                            let trial_name = inference_config["trial_name"];
                            let mission_date = inference_config["mission_date"];
                            let dataset_name = inference_config["dataset_name"];

                            let model_predictions = JSON.parse(fs.readFileSync(predictions_path, 'utf8'));
                            let model_metrics = model_predictions["metrics"]
                            if ((trial_name in user_data) && (mission_date in user_data[trial_name])) {
                                if (!(dataset_name in user_data[trial_name][mission_date])) {
                                    user_data[trial_name][mission_date][dataset_name] = {"models": {}, "groups": {}};
                                }
                                user_data[trial_name][mission_date][dataset_name]["models"][model_instance_name] = {
                                        "prediction_dir": dataset,
                                        "model_metrics": model_metrics
                                };
                            }
                        }
                    }
                });
            });
*/
            models.groups.findAll({
                where : {
                    creator: req.session.user.username
                }
            }).then(groups => {
                for (group of groups) {

                    console.log("examining group", group.name);
                    console.log("user_saved?", group.user_saved);

                    let trial_name = group.trial_name;
                    let mission_date = group.mission_date;
                    let dataset_name = group.dataset_name;


                    if (group.user_saved) {
                        if (!("user_groups" in user_data[trial_name][mission_date][dataset_name])) {
                            user_data[trial_name][mission_date][dataset_name]["user_groups"] = {};
                        }

                        user_data[trial_name][mission_date][dataset_name]["user_groups"][group.uuid] = {
                            "group_uuid": group.uuid,
                            "group_name": group.name
                        }
                    }
                    else {
                        // Destroy any groups created by the user that were not saved 
                        models.groups.destroy({
                            where: {
                                creator: req.session.user.username,
                                uuid: group.uuid
                            }
                        }).then(() => {

                        }).catch(error => {
                            console.log(error);
                        });
                    }
                }

                //let experiments_root = path.join(USR_DATA_ROOT, "experiments");
                //let experiment_lookup_path = path.join(experiments_root, "experiment_lookup.json");
                //let inference_config = JSON.parse(fs.readFileSync(experiment_lookup_path, 'utf8'));
                
                //let group_lookup_path = path.join(USR_DATA_ROOT, "records", "group_lookup.json");
                //let group_lookup = JSON.parse(fs.readFileSync(group_lookup_path, 'utf8'));


                console.log("user_data", user_data);
                res.render("user", {username: req.session.user.username, user_data: user_data});//, group_lookup: group_lookup});
            }).catch(err => {
                console.log(err);
            });
        }).catch(err => {
            console.log("could not retrieve groups");
            console.log(err);
        });
    }
    else {
        res.redirect("/");
    }

}


exports.post_user = function(req, res, next) {

    console.log("handling post_user request");
    console.log("action is", req.body.action);
    //console.log("group_name is", req.body.group_name);

    if (req.session.user && req.cookies.user_sid) {

        let response = {};
        let username = req.session.user.username;
        let action = req.body.action;


        if (action == "get_group_data") {
            console.log("get_group_data");
            let group_key = req.body.group_key;
            let group_uuid = req.body.group_uuid;

            console.log("group_key", group_key);
            console.log("group_uuid", group_uuid);


            if (group_key == "groups") {
                console.log("fetching from group_lookup", group_key, group_uuid);
                console.log("group_uuid", group_uuid);
                let group_config_path = path.join(USR_DATA_ROOT, "groups", group_uuid + ".json");
                let group_config = JSON.parse(fs.readFileSync(group_config_path, 'utf8'));
                //return group_lookup["groups"][group_uuid];
                console.log("group_config", group_config);
                response.message = group_config;
                response.error = false;
                res.json(response);
            }
            else if (group_key == "user_groups") {

                let group_data = {};

                console.log("group_uuid", group_uuid);
                return models.groups.findOne({
                    where: { 
                        uuid: group_uuid 
                    }
                }).then(group => {

                    group_data["group_name"] = group.name;
                    group_data["group_description"] = group.description;
                    group_data["trial_name"] = group.trial_name;
                    group_data["mission_date"] = group.mission_date;
                    group_data["dataset_name"] = group.dataset_name;
                    group_data["model_names"] = (group.model_names).split(",");
                    group_data["model_uuids"] = (group.model_uuids).split(",");
                    group_data["prediction_dirnames"] = (group.prediction_dirnames).split(",");

                    console.log("sending_response");
                    console.log("group_data", group_data);
                    response.message = group_data;
                    response.error = false;
                    res.json(response);
                    //return group_data;
                }).catch(error => {
                    console.log(error);
                    response.message = "An error occurred while fetching the group details."
                    response.error = true;
                    res.json(response);
                });
            }
            else {
                response.message = "An error occurred while fetching the group details."
                response.error = true;
                res.json(response);
            }


        }

        else if (action == "submit_new_user_group") {

            let trial_name = req.body.trial_name;
            let mission_date = req.body.mission_date;
            let dataset_name = req.body.dataset_name;
            
            let group_name;
            let group_description;
            let save_group = (req.body.save_group == "true");

            if (save_group) {
                group_name = req.body.group_name;
                group_description = req.body.group_description;
                if ((group_name === "") || (group_description == "")) {
                    response.error = true;
                    response.message = "Please provide a name and description for the group.";
                    res.json(response);                    
                }
                /*
                is_group_name_unique_for_user(username, trial_name, mission_date, dataset_name, group_name)
                .then(is_unique => {
                    if (!(is_unique)) {
                        console.log("a group with the same name already exists");
                        response.error = true;
                        response.message = "Please change the name of your group. A group with the name you provided already exists for this dataset.";
                        res.json(response);
                    }*/
            }

            
            //if (is_unique) {

            let group_uuid = uuidv4();

            return models.groups.create({
                uuid: group_uuid,
                creator: username,
                name: group_name,
                description: group_description,
                user_saved: save_group,
                trial_name: trial_name,
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
                console.log("group created, redirecting");
                response.redirect = "/viewer/" + group_uuid.toString();
                res.json(response);

            }).catch(error => {
                console.log(error);
                response.error = true;
                response.message = "An error occurred while creating the group: " + error;
                res.json(response);
            });
            /*
                }
            else {
                console.log("a group with the same name already exists");
                response.error = true;
                response.message = "Please change the name of your group. A group with the name you provided already exists for this dataset.";
                res.json(response);
            }
            }).catch(error => {
                console.log(error);
                response.error = true;
                response.message = "An error occurred while creating the group: " + error;
                res.json(response);                
            });*/
        }

        else if (action == "fetch_existing_user_group") {

            return models.groups.findOne({
                where: {
                    uuid: req.body.group_uuid
                }
            }).then(group => {
                response.redirect = "/viewer/" + req.body.group_uuid;
                res.json(response);
            }).catch(error => {
                console.log(error);
                response.error = true;
                response.message = "The requested group could not be found in the database.";
                res.json(response);
            });
        }

        else if (action == "fetch_system_group") {

            /*
            return models.groups.count({
                where: {
                    uuid: req.body.group_uuid
                }
            }).then(count => {
                if (count == 0) {*/
                // Add the system group to the database

                let view_group_uuid = uuidv4();

                let trial_name = req.body.trial_name;
                let mission_date = req.body.mission_date;
                let dataset_name = req.body.dataset_name;
                let group_uuid = req.body.group_uuid;

                console.log("group_uuid", group_uuid);

                let group_config_path = path.join(USR_DATA_ROOT, "groups", group_uuid + ".json");
                let group_config = JSON.parse(fs.readFileSync(group_config_path, 'utf8'));

                console.log("group_config", group_config);
                //let model_info = group_config["model_info"][trial_name][mission_date][dataset_name];
                let model_uuids = [];
                let model_names = [];
                let model_pred_dirnames = [];
                for (m of group_config["model_info"]) {
                    for (inference_info of m["inference_info"]) {
                        if (((inference_info["trial_name"] === trial_name) &&
                             (inference_info["mission_date"] === mission_date)) &&
                             (inference_info["dataset_name"] === dataset_name)) {
                            model_uuids.push(m["model_uuid"]);
                            model_names.push(m["model_name"]);
                            model_pred_dirnames.push(inference_info["prediction_dirname"])
                        }
                    }
                }

                console.log("REPLICATIONS", group_config["variation_config"]["replications"]);

                console.log(group_config["variation_config"]["param_configs"]);
                console.log(group_config["variation_config"]["param_configs"][0]);
                console.log(group_config["variation_config"]["param_names"]);
                console.log(group_config["variation_config"]["param_names"][0]);
                let higlighted_param_config = group_config["variation_config"]["param_configs"][0];
                let highlighted_param_name = group_config["variation_config"]["param_names"][0];
                let replications = group_config["variation_config"]["replications"];
                console.log("higlighted_param_config", higlighted_param_config);
                console.log("highlighted_param_name", highlighted_param_name);

                return models.groups.create({
                    uuid: view_group_uuid,
                    creator: username,
                    name: group_config["group_name"],
                    description: group_config["group_description"],
                    user_saved: false,
                    trial_name: trial_name,
                    mission_date: mission_date,
                    dataset_name: dataset_name,
                    model_uuids: model_uuids.join(","),
                    model_names: model_names.join(","),
                    prediction_dirnames: model_pred_dirnames.join(","),
                    system_group: true,
                    highlighted_param: higlighted_param_config + "::" + highlighted_param_name,
                    replications: replications
                }).then(group => {
                    response.redirect = "/viewer/" + view_group_uuid.toString();
                    res.json(response);
                }).catch(error => {
                    console.log(error);
                    response.error = true;
                    response.message = "An error occurred while fetching the group: " + error;
                    res.json(response);
                });

/*
                }
                else {
                    response.redirect = "/viewer/" + req.body.group_uuid;
                    res.json(response);
                }
            }).catch(error => {
                console.log(error);
            });*/

        }
        else if (action == "delete_group") {

            models.groups.destroy({
                where: {
                    creator: req.session.user.username,
                    uuid: req.body.group_uuid
                }
            }).then(() => {
                response.error = false;
                res.json(response);
            }).catch(error => {
                console.log(error);
                response.error = true;
                response.message = "An error occurred while deleting the group: " + error;
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
        res.redirect("/");
    }

}

exports.get_viewer = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {

        // get the most recently created group by this user
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
                                                  group.trial_name, group.mission_date, "image_set_config.json")
            let image_set_config = JSON.parse(fs.readFileSync(image_set_config_path, 'utf8'));

            let metadata = {
                "trial_name": group.trial_name,
                "mission_date": group.mission_date,
                "dataset_name": group.dataset_name,
                "group_user_saved": group.user_saved,
                "system_group": group.system_group,
                "model_names": group.model_names.split(","),
                "model_uuids": group.model_uuids.split(","),
                "highlighted_param": group.highlighted_param,
                "replications": group.replications,
                "class_map": image_set_config["class_map"]
            };
            if (group.user_saved || group.system_group) {
                metadata["group_name"] = group.name;
                metadata["group_description"] = group.description;
            }

            let predictions = {};
            let dzi_image_paths = [];
            let annotations = {};
            let models_root = path.join(USR_DATA_ROOT, "models");

            let config_keys = [];
            let configs = {"arch": {}, "training": {}, "inference": {}};
            let loss_records = {};
            let excluded_keys = ["model_uuid", "model_name"];
            for (let i = 0; i < model_uuids.length; i++) {
                let model_uuid = model_uuids[i];
                //let entry = inference_lookup[group.trial_name][group.mission_date][group.dataset_name]["models"][model_uuid];
                
                let prediction_dirname = prediction_dirnames[i];
                let model_instance_root = path.join(models_root, model_uuid);
                let prediction_path = path.join(model_instance_root, prediction_dirname, "predictions.json");


                let model_predictions = JSON.parse(fs.readFileSync(prediction_path, 'utf8'));
                predictions[model_uuid] = model_predictions;


                let arch_config_path = path.join(model_instance_root, "arch_config.json");
                //let class_map_path = path.join(model_instance_root, "class_map.json");
                let training_config_path = path.join(model_instance_root, "training_config.json");
                let inference_config_path = path.join(model_instance_root, prediction_dirname, "inference_config.json");
                let loss_record_path = path.join(model_instance_root, "loss_record.json");

                let arch_config = JSON.parse(fs.readFileSync(arch_config_path, 'utf8'));
                //let class_map = JSON.parse(fs.readFileSync(class_map_path, 'utf8'));
                let training_config = JSON.parse(fs.readFileSync(training_config_path, 'utf8'));
                let inference_config = JSON.parse(fs.readFileSync(inference_config_path, 'utf8'));
                let loss_record = JSON.parse(fs.readFileSync(loss_record_path, 'utf8'));

                for (k of Object.keys(arch_config)) {
                    let disp_k = "arch::" + k;
                    if (config_keys.indexOf(disp_k) === -1 && excluded_keys.indexOf(k) == -1)
                        config_keys.push(disp_k);
                }
                /*
                for (k of Object.keys(class_map)) {
                    let disp_k = "class_map::" + k;
                    if (config_keys.indexOf(disp_k) === -1 && excluded_keys.indexOf(k) == -1)
                        config_keys.push(disp_k);
                }*/
                for (k of Object.keys(training_config)) {
                    let disp_k = "training::" + k;
                    if (config_keys.indexOf(disp_k) === -1 && excluded_keys.indexOf(k) == -1)
                        config_keys.push(disp_k);
                }
                for (k of Object.keys(inference_config)) {
                    let disp_k = "inference::" + k;
                    if (config_keys.indexOf(disp_k) === -1 && excluded_keys.indexOf(k) == -1)
                        config_keys.push(disp_k);
                }

                configs["arch"][model_uuid] = arch_config;
                configs["training"][model_uuid] = training_config;
                configs["inference"][model_uuid] = inference_config;
                loss_records[model_uuid] = loss_record;


                if (i == 0) {
                    for (image_name in model_predictions["image_predictions"]) {
                        let dzi_image_path = path.join('..', USR_DATA_ROOT, "image_sets", 
                                                group.trial_name, group.mission_date, 
                                                "dzi_images", image_name + ".dzi");
                        dzi_image_paths.push(dzi_image_path)


                        let xml_path = path.join(USR_DATA_ROOT, "image_sets",
                                                 group.trial_name, group.mission_date,
                                                 "images", image_name + ".xml");

                        let img_annotations = get_annotations(xml_path);
                        //console.log(img_annotated_gt);
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
        res.redirect("/");
    }

}



exports.logout = function(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
    }
    res.redirect('/');
}



function get_annotations(xml_path) {
    let class_name;
    let parsed_annotations = {"class_boxes": {}, "class_counts": {}};
    let xml = fs.readFileSync(xml_path, 'utf8');

    let annotations = JSON.parse(xml_js_convert.xml2json(xml, {compact: true, spaces: 4}));
    //console.log(Object.keys(img_annotated_gt));
    //console.log("accessing 'annotation'");
    //console.log(img_annotated_gt["annotation"]);
    //for (const [key, value] of Object.entries(img_annotated_gt)) {
    //    console.log(`${key}: ${value}`);
    //}
    for (annotation of annotations["annotation"]["object"]) {

        class_name = annotation["name"]["_text"];
        console.log("class_name", class_name);
        if (!(class_name in parsed_annotations["class_counts"])) {
            parsed_annotations["class_boxes"][class_name] = [];
            parsed_annotations["class_counts"][class_name] = 0;
        }
        //console.log(annotation);
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