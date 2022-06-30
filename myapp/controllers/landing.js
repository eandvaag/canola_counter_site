

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

const glob = require("glob");
/*
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
*/

/*
var socket_io = require('socket.io');
var io = socket_io();

io.on('connection', (socket) => {
    console.log("a user connected");
});*/


/*
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);*/

//import express from "express";
//import { createServer } from "http";
//import { Server } from "socket.io";
//import session from "express-session";
//const app = express();
//const httpServer = createServer(app);
//const io = new Server(httpServer);
/*
let socket_io = require('socket.io');
let io = socket_io();*/

const APP_PREFIX = '/plant_detection';
const USR_DATA_ROOT = path.join("usr", "data");
const USR_REQUESTS_ROOT = path.join("usr", "requests");

const ANNOTATION_LOCK_TIMEOUT = 240000; // 4 minutes
// const AsyncLock = require('async-lock');
// const job_lock = new AsyncLock();

// let jobs;
// let active_subprocesses = {};
let sockets = {};
var Mutex = require('async-mutex').Mutex;


const annotation_mutex = new Mutex();


/*
exports.sessionChecker = function(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect(APP_PREFIX + '/user');
    } else {
        next();
    }
}
*/

// scheduler();

// function scheduler() {

//     console.log("scheduler ran");
//     setTimeout(scheduler, 5000);

// }
/*
console.log("STARTING THE PYTHON PROCESS");

let scheduler = spawn("python3", ["../../plant_detection/src/scheduler.py"]);


scheduler.on('close', (code) => {
    console.log("Scheduler finished.");
    console.log("code", code);  
});

scheduler.stderr.on('data', (data) => {
    // for some reason listening on stderr is required for files to be 
    //   output correctly by the subprocess ?? 
    console.error(`scheduler stderr: ${data}`);
});
scheduler.stdout.on('data', (data) => {
    console.log(`scheduler stdout: ${data}`);
});

scheduler.on('SIGINT', function() {
    console.log('Received SIGINT signal');
});

scheduler.on('error', (error) => {
    console.log("Failed to start subprocess.");
    console.log(error);
});*/


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
            
            let farm_root = path.join(image_sets_root, farm_name);
            let field_names = get_subdirs(farm_root);
            console.log("field_names", field_names);

            for (field_name of field_names) {
                let field_root = path.join(farm_root, field_name);
                let mission_dates = get_subdirs(field_root);
                console.log("mission_dates", mission_dates);
                
                
                for (mission_date of mission_dates) {
                    let mission_root = path.join(field_root, mission_date);

                    let upload_complete_path = path.join(mission_root, "upload_complete.json");
                    if (fs.existsSync(upload_complete_path)) {

                        if (!(farm_name in image_sets_data)) {
                            image_sets_data[farm_name] = {};
                        }
                        if (!(field_name in image_sets_data[farm_name])) {
                            image_sets_data[farm_name][field_name] = []
                        }
                        image_sets_data[farm_name][field_name].push(mission_date); // = [];
                        
                        /*
                        results_dir = path.join(results_root, farm_name, field_name, mission_date);
                        if (fs.existsSync(results_dir)) {
                            let jobs = get_subdirs(results_dir);
                            image_sets_data[farm_name][field_name][mission_date] = jobs;
                        }
                        else {
                            image_sets_data[farm_name][field_name][mission_date] = [];
                        }*/
                    }

                    //else {
                        /* Upload was never completed, remove the directory */
                        //fs.rmSync(mission_root, { recursive: true, force: true });
/*
                        let missions = get_subdirs(field_dir);
                        if (missions.length == 0) {
                            fs.rmSync(field_dir, { recursive: true, force: true });
                            let fields = get_subdirs(farm_dir);
                            if (fields.length == 0) {
                                fs.rmSync(farm_dir, { recursive: true, force: true });
                            }
                        }*/
                    //}
                }
            }
        }

        let camera_specs;
        let camera_specs_path = path.join(USR_DATA_ROOT, "cameras", "cameras.json");
        try {
            camera_specs = JSON.parse(fs.readFileSync(camera_specs_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }

        res.render("home", {image_sets_data: image_sets_data, camera_specs: camera_specs});
        
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
        let image_set_dir = path.join(USR_DATA_ROOT, "image_sets", farm_name, field_name, mission_date);

        glob(path.join(image_set_dir, "images", "*"), function(error, image_paths) {
            if (error) {
                return res.redirect(APP_PREFIX);
            }

            console.log("image_paths", image_paths);
            let image_ext = image_paths[0].substring(image_paths[0].length - 4);
            console.log("image_ext", image_ext);
    
            
            let annotations_dir = path.join(image_set_dir, "annotations");
            let annotations_lock_path = path.join(annotations_dir, "lock.json")
    
            annotation_mutex.acquire()
            .then(function(release) {
                let annotations_lock;
                try {
                    annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
                }
                catch (error) {
                    release();
                    return res.redirect(APP_PREFIX);
                }
    
                let last_refresh = annotations_lock["last_refresh"];
                let cur_time = Date.now()
                if ((cur_time - last_refresh) < ANNOTATION_LOCK_TIMEOUT) {
                    release();
                    // TODO: redirect to an error page
                    return res.redirect(APP_PREFIX);
                }
                annotations_lock["last_refresh"] = Date.now();
                try {
                    fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
                }
                catch (error) {
                    release();
                    // TODO: redirect to an error page
                    return res.redirect(APP_PREFIX);
                }
                release();
    
                let annotations_path = path.join(annotations_dir, "annotations_w3c.json");
                let annotations;
                try {
                    annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
                }
                catch (error) {
                    console.log(error);
                    return res.redirect(APP_PREFIX);
                }
        
                let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
                let metadata;
                try {
                    metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
                }
                catch (error) {
                    console.log(error);
                    return res.redirect(APP_PREFIX);
                }

                let excess_green_record_path = path.join(image_set_dir, "excess_green", "record.json");
                let excess_green_record;
                try {
                    excess_green_record = JSON.parse(fs.readFileSync(excess_green_record_path, 'utf8'));
                }
                catch (error) {
                    console.log(error);
                    return res.redirect(APP_PREFIX);
                }
        
                let dzi_images_dir = path.join(image_set_dir, "dzi_images");
                let dzi_image_paths = [];
                for (image_name of Object.keys(annotations)) {
                    let dzi_image_path = path.join(APP_PREFIX, dzi_images_dir, image_name + ".dzi");
                    dzi_image_paths.push(dzi_image_path);
                }
        
                let image_set_info = {
                    "farm_name": farm_name,
                    "field_name": field_name,
                    "mission_date": mission_date,
                    "image_ext": image_ext
                }
        
                console.log("ready to render");
                let data = {};

                //let cur_weights_path = path.join(image_set_dir, "model", "weights", "best_weights.h5");
                //data["baseline_initialized"] = fs.existsSync(cur_weights_path);
                //console.log("baseline_initialized", data["baseline_initialized"]);

                data["image_set_info"] = image_set_info;
                data["metadata"] = metadata;
                data["dzi_image_paths"] = nat_orderBy.orderBy(dzi_image_paths);
                data["annotations"] = annotations;
                data["excess_green_record"] = excess_green_record;
                res.render("annotate", {data: data});
    
    
            }).catch(function(error) {
                console.log(error);
                return res.redirect(APP_PREFIX);
            });
    
    

        });
        
        
    }
    else {
        return res.redirect(APP_PREFIX);
    }

}


exports.post_annotate = function(req, res, next) {

    //if (req.session.user && req.cookies.user_sid) {

    let response = {};


    let farm_name = req.params.farm_name;
    let field_name = req.params.field_name;
    let mission_date = req.params.mission_date;
    let action = req.body.action;

    let image_set_dir = path.join(USR_DATA_ROOT, "image_sets", farm_name,
                                        field_name, mission_date);


    if (action === "save_annotations") {
        let annotations_path = path.join(image_set_dir, "annotations", "annotations_w3c.json");

        try {
            fs.writeFileSync(annotations_path, req.body.annotations);
        }
        catch (error) {
            console.log(error);
            response.error = true;
            return res.json(response);
        }

        let excess_green_record_path = path.join(image_set_dir, "excess_green", "record.json");
        try {
            fs.writeFileSync(excess_green_record_path, req.body.excess_green_record);
        }
        catch (error) {
            console.log(error);
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);
    }
    else if (action === "build_map") {

        console.log(farm_name);
        console.log(field_name);
        console.log(mission_date);
        let out_dir = path.join(image_set_dir, "maps");
        let annotations_path = path.join(image_set_dir, "annotations", "annotations_w3c.json");
        let rebuild_command = "python ../../plant_detection/src/interpolate.py " + farm_name +
                                " " + field_name + " " + mission_date + " " + annotations_path + " " + out_dir;

        if (req.body.interpolation == "nearest") {
            rebuild_command = rebuild_command + " -nearest";
        }
        console.log(rebuild_command);
        let result = exec(rebuild_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);
                response.error = true;
            }
            else {
                response.error = false;
            }

            return res.json(response);
        });
    }
    else if (action === "refresh_lock_file") {

        let annotations_lock_path = path.join(image_set_dir, "annotations", "lock.json");


        annotation_mutex.acquire()
        .then(function(release) {
            let annotations_lock;
            try {
                annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read annotation lock file.";
                response.error = true;
                response.redirect = APP_PREFIX;
                return res.json(response);
            }

            annotations_lock["last_refresh"] = Date.now();

            try {
                fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
            }
            catch (error) {
                release();
                // TODO: redirect to an error page
                response.message = "Failed to write annotation lock file.";
                response.error = true;
                response.redirect = APP_PREFIX;
                return res.json(response);

            }

            // success
            release();
            response.error = false;
            return res.json(response);

        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire annotation mutex.";
            response.error = true;
            response.redirect = APP_PREFIX;
            return res.json(response);
        });


    }
    else if (action === "expired_lock_file") {

        let annotations_lock_path = path.join(image_set_dir, "annotations", "lock.json");

        annotation_mutex.acquire()
        .then(function(release) {
            let annotations_lock;
            try {
                annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read annotation lock file.";
                response.error = true;
                response.redirect = APP_PREFIX;
                return res.json(response);
            }

            annotations_lock["last_refresh"] = 0;

            try {
                fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
            }
            catch (error) {
                release();
                // TODO: redirect to an error page
                response.message = "Failed to write annotation lock file.";
                response.error = true;
                response.redirect = APP_PREFIX;
                return res.json(response);

            }

            // success
            release();
            response.error = false;
            response.redirect = APP_PREFIX + "/home";
            return res.json(response);

        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire annotation mutex.";
            response.error = true;
            response.redirect = APP_PREFIX;
            return res.json(response);
        });

    }
    else if (action === "predict") {

        let image_name = req.body.image_name;

        let request = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "image_names": [image_name],
            "save_result": false
        };
        let request_uuid = uuidv4().toString();
        
        let request_path = path.join(USR_REQUESTS_ROOT, "prediction",
                                     request_uuid + ".json");
        try {
            fs.writeFileSync(request_path, JSON.stringify(request));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create prediction request.";
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);
    }
    else if (action === "get_result") {

        //let image_name = req.body.image_name;
        let annotations_path = path.join(USR_DATA_ROOT, "image_sets",
                                farm_name, field_name, mission_date,
                                "annotations", "annotations_w3c.json")

        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            response.message = "Failed to read annotation file."
            response.error = true;
            return res.json(response);
        }

        let request = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "image_names": Object.keys(annotations),
            "save_result": true
        };
        let request_uuid = uuidv4().toString();
        
        let request_path = path.join(USR_REQUESTS_ROOT, "prediction",
                                     request_uuid + ".json");
        try {
            fs.writeFileSync(request_path, JSON.stringify(request));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create prediction request.";
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);
    }
    else if (action === "retrieve_prediction") {
        let image_name = req.body.image_name;
        let prediction_path = path.join(image_set_dir, "model", "prediction",
            "images", image_name, "predictions_w3c.json");

        
        if (fs.existsSync(prediction_path)) {

            try {
                predictions = JSON.parse(fs.readFileSync(prediction_path, 'utf8'));
                response.error = false;
                response.predictions = predictions;
                return res.json(response);
            }
            catch (error) {
                console.log(error);
                response.message = "Failed to retrieve predictions.";
                response.error = true;
                return res.json(response);
            }
        }
        else {
            console.log("No predictions exist for this image");
            response.message = "No predictions found for the current image.";
            response.error = true;
            return res.json(response);
        }

    }
    else if (action === "segment") {

        let image_name = req.body.image_name;
        let threshold = req.body.threshold;


        let segment_command = "python ../../plant_detection/src/segment.py " + farm_name + " " + field_name + " " + mission_date + 
                              " " + image_name + " " + threshold;
        let result = exec(segment_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);
                response.error = true;
            }
            else {
                response.error = false;
            }
            return res.json(response);
        });
    }

    /*
    else if (action === "restart_model") {
        
        let request = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date
        };
        let request_uuid = uuidv4().toString();
        
        let request_path = path.join(USR_REQUESTS_ROOT, "restart",
                                     request_uuid + ".json");
        try {
            fs.writeFileSync(request_path, JSON.stringify(request));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create restart request.";
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);

    }*/

    else if (action === "initialize_model") {

        let annotations_path = path.join(image_set_dir, "annotations", "annotations_w3c.json");

        try {
            fs.writeFileSync(annotations_path, req.body.annotations);
        }
        catch (error) {
            console.log(error);
            //response.error = true;
            //return res.json(response);
        }

        let initialize_request_path = path.join(image_set_dir, "model", "initialize.json")
        let initialize_request = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "annotation_guides": JSON.parse(req.body.annotation_guides)
        }
        try {
            fs.writeFileSync(initialize_request_path, JSON.stringify(initialize_request));
        }
        catch (error) {
            console.log(error);
            //response.error = true;
            //return res.json(response);
        }
        response.message = "The model is now being initialized!";
        response.error = false;
        return res.json(response);

    }
    /*
    else if (action === "crop_image") {

        let image_name = req.body.image_name;
        let coord_0 = req.body.coord_0;
        let coord_1 = req.body.coord_1;
        let coord_2 = req.body.coord_2;
        let coord_3 = req.body.coord_3;

        let image_path = "usr/data/image_sets/" + farm_name + "/" + field_name + "/" +
                          mission_date + "/segmentations/" + image_name + ".png";

        let crop_command = "python ../../plant_detection/src/crop.py " + image_path + " " + 
                            coord_0 + " " + coord_1 + " " + coord_2 + " " + coord_3;

        let result = exec(crop_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);
                response.error = true;
            }
            else {
                response.error = false;
            }
            return res.json(response);
        });

    }*/

/*
    }
    else {
        res.cookie_expired = true;
        response.redirect = APP_PREFIX;
        return res.json(response);
    }*/
}




function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function remove_image_set(farm_name, field_name, mission_date) {

    let farm_dir = path.join(USR_DATA_ROOT, "image_sets", farm_name);
    let field_dir = path.join(farm_dir, field_name);
    let mission_dir = path.join(field_dir, mission_date);

    if (fs.existsSync(mission_dir)) {
        fs.rmSync(mission_dir, { recursive: true, force: true });
    }
    if (fs.existsSync(field_dir)) {
        let missions = get_subdirs(field_dir);
        if (missions.length == 0) {
            fs.rmSync(field_dir, { recursive: true, force: true });
        }
    }
    if (fs.existsSync(farm_dir)) {
        let fields = get_subdirs(farm_dir);
        if (fields.length == 0) {
            fs.rmSync(farm_dir, { recursive: true, force: true });
        }
    }
}


exports.post_upload = function(req, res, next) {
    //if (req.session.user && req.cookies.user_sid) {


    let farm_name;
    let field_name;
    let mission_date;
    let first;
    let last;
    let queued_filenames;
    let flight_height;
    let sent_response = false;
    if (req.files.length > 1) {
        farm_name = req.body.farm_name[0];
        field_name = req.body.field_name[0];
        mission_date = req.body.mission_date[0];
        //first_batch = req.body.first_batch[0];
        first = false;
        last = false;
        queued_filenames = req.body.queued_filenames[0].split(",");
        flight_height = req.body.flight_height[0];
        let num_sent;
        for (let i = 0; i < req.body.num_sent.length; i++) {
            num_sent = parseInt(req.body.num_sent[i])
            console.log("num_sent", num_sent);
            if (num_sent == 1) {
                first = true;
            }
            if (num_sent == queued_filenames.length) {
                last = true;
            }
        }
        
    }
    else {
        farm_name = req.body.farm_name;
        field_name = req.body.field_name;
        mission_date = req.body.mission_date;
        queued_filenames = req.body.queued_filenames.split(",");
        first = parseInt(req.body.num_sent) == 1;
        last = parseInt(req.body.num_sent) == queued_filenames.length;
        flight_height = req.body.flight_height;
    }
    console.log(req.body.num_sent);

    console.log("contains first?", first);
    console.log("queued_filenames", queued_filenames);

    let format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
    for (file of req.files) {
        if (!(file.mimetype.startsWith('image/'))) {
            remove_image_set(farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "One or more provided files is not an image."
                });
            }
        }
        if (format.test(file.originalname)) {
        //if (!(file.originalname.match(/^[^a-zA-Z0-9.]+$/))) {
            remove_image_set(farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "One or more provided filenames contains illegal characters."
                });
            }
        }
    }


    let image_sets_root = path.join(USR_DATA_ROOT, "image_sets");
    let farm_dir = path.join(image_sets_root, farm_name);
    let field_dir = path.join(farm_dir, field_name);
    let mission_dir = path.join(field_dir, mission_date);
    let images_dir = path.join(mission_dir, "images");
    //let patches_dir = path.join(mission_dir, "patches");
    let dzi_images_dir = path.join(mission_dir, "dzi_images");
    //let segmentations_dir = path.join(mission_dir, "segmentations");
    let conversion_tmp_dir = path.join(dzi_images_dir, "conversion_tmp");
    let annotations_dir = path.join(mission_dir, "annotations");
    let metadata_dir = path.join(mission_dir, "metadata");
    
    let patches_dir = path.join(mission_dir, "patches");
    let excess_green_dir = path.join(mission_dir, "excess_green");

    let model_dir = path.join(mission_dir, "model");
    let training_dir = path.join(model_dir, "training");
    let prediction_dir = path.join(model_dir, "prediction");
    let weights_dir = path.join(model_dir, "weights");
    let results_dir = path.join(model_dir, "results");


    
    if (first) {
        console.log("checking components");
        let id_components = [farm_name, field_name, mission_date];
        for (id_component of id_components) {
            if (format.test(id_component)) {
                if (!sent_response) {
                    sent_response = true;
                    remove_image_set(farm_name, field_name, mission_date);
                    return res.status(422).json({
                        error: "The provided farm, field, or mission date contains illegal characters."
                    });
                }
            }
        }
        if (fpath_exists(mission_dir)) {
            remove_image_set(farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "The provided farm-field-mission combination already exists."
                });
            }
        }
        else {
            console.log("Making the image set directories");
            fs.mkdirSync(images_dir, { recursive: true });
            fs.mkdirSync(dzi_images_dir, { recursive: true });
            //fs.mkdirSync(segmentations_dir, { recursive: true });
            fs.mkdirSync(conversion_tmp_dir, { recursive: true });
            fs.mkdirSync(annotations_dir, { recursive: true });
            fs.mkdirSync(metadata_dir, { recursive: true });
            fs.mkdirSync(patches_dir, { recursive: true });
            fs.mkdirSync(excess_green_dir, { recursive: true });
            fs.mkdirSync(model_dir, { recursive: true });
            fs.mkdirSync(training_dir, { recursive: true });
            fs.mkdirSync(prediction_dir, { recursive: true });
            fs.mkdirSync(weights_dir, { recursive: true });
            fs.mkdirSync(results_dir, { recursive: true});

            /*
            console.log("Copying initial model weights");
            let source_weights_path = path.join(USR_DATA_ROOT, "weights", "default_weights.h5");
            let best_weights_path = path.join(weights_dir, "best_weights.h5");
            let cur_weights_path = path.join(weights_dir, "cur_weights.h5");
            try {
                fs.copyFileSync(source_weights_path, best_weights_path);
            }
            catch (error) {
                console.log("Error occurred while copying weights", error);
                remove_image_set(farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred while copying weights."
                    });
                }
            }
            try {
                fs.copyFileSync(source_weights_path, cur_weights_path);
            }
            catch (error) {
                console.log("Error occurred while copying weights", error);
                remove_image_set(farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred while copying weights."
                    });
                }
            }*/

            let status = {
                "status": "uninitialized", //"idle",
                "num_images_fully_trained_on": 0,
                "update_num": 0
            };
            let status_path = path.join(model_dir, "status.json");
            try {
                fs.writeFileSync(status_path, JSON.stringify(status));
            }
            catch (error) {
                console.log(error);
                remove_image_set(farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred when writing status file."
                    });
                }
            }


            console.log("Making the annotations file");
            let annotations_path = path.join(annotations_dir, "annotations_w3c.json");
            let annotations = {};
            for (filename of queued_filenames) {
                let sanitized_fname = sanitize(filename);
                let extensionless_fname = sanitized_fname.substring(0, sanitized_fname.length-4);
                annotations[extensionless_fname] = {
                    "status": "unannotated",
                    //"available_for_training": false,
                    "annotations": []
                };
            }
            console.log("Writing the annotations file");
            try {
                fs.writeFileSync(annotations_path, JSON.stringify(annotations));
            }
            catch (error) {
                console.log(error);
                remove_image_set(farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred when writing annotations file."
                    });
                }
            }
            let annotations_lock_path = path.join(annotations_dir, "lock.json")
            let annotations_lock = {
                "last_refresh": 0
            };
            try {
                fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
            }
            catch (error) {
                console.log(error);
                remove_image_set(farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred when writing annotations lock file."
                    });
                }
            }

            let loss_record_path = path.join(training_dir, "loss_record.json")
            let loss_record = {
                "training_loss": { "values": [],
                                   "best": 100000000,
                                   "epochs_since_improvement": 100000000}, 
                "validation_loss": {"values": [],
                                    "best": 100000000,
                                    "epochs_since_improvement": 100000000},
                "num_training_images": 0
            }
            try {
                fs.writeFileSync(loss_record_path, JSON.stringify(loss_record));
            }
            catch (error) {
                console.log(error);
                remove_image_set(farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred when writing loss record."
                    });
                }
            }
        }
    }
    else {
        if (!(fpath_exists(mission_dir))) {
            remove_image_set(farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "Image set directories were not created by initial request."
                });
            }
        }
    }
    console.log("Converting the files");
    for (file of req.files) {
        let sanitized_fname = sanitize(file.originalname);
        let extensionless_fname = sanitized_fname.substring(0, sanitized_fname.length-4);
        if (extensionless_fname.length > 50) {
            remove_image_set(farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "One or more filenames exceeds maximum allowed length of 50 characters."
                });
            }
        }



        let extension = sanitized_fname.substring(sanitized_fname.length-4);
        let fpath = path.join(images_dir, sanitized_fname);
        try {
            fs.writeFileSync(fpath, file.buffer);
        }
        catch (error) {
            console.log(error);
            remove_image_set(farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "Error occurred when writing image file."
                });
            }
        }

        let img_dzi_path = path.join(dzi_images_dir, extensionless_fname);

        let no_convert_extensions = [".jpg", ".JPG", ".png", ".PNG"];
        if (!(no_convert_extensions.includes(extension))) {
            let tmp_path = path.join(conversion_tmp_dir, extensionless_fname + ".jpg");
            let conv_cmd = "convert " + fpath + " " + tmp_path;
            let slice_cmd = "./MagickSlicer/magick-slicer.sh '" + tmp_path + "' '" + img_dzi_path + "'";
            let result = exec(conv_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                if (error) {
                    /*
                    fs.rmSync(mission_dir, { recursive: true, force: true });
                    let missions = get_subdirs(field_dir);
                    if (missions.length == 0) {
                        fs.rmSync(field_dir, { recursive: true, force: true });
                        let fields = get_subdirs(farm_dir);
                        if (fields.length == 0) {
                            fs.rmSync(farm_dir, { recursive: true, force: true });
                        }
                    }*/

                    console.log(error.stack);
                    console.log('Error code: '+error.code);
                    console.log('Signal received: '+error.signal);

                    remove_image_set(farm_name, field_name, mission_date);
                    if (!sent_response) {
                        sent_response = true;
                        return res.status(422).json({
                            error: "Error occurred during image conversion process."
                        });
                    }
                }
                else {
                    let result = exec(slice_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                        if (error) {
                            console.log(error.stack);
                            console.log('Error code: '+error.code);
                            console.log('Signal received: '+error.signal);
                            /*
                            fs.rmSync(mission_dir, { recursive: true, force: true });
                            let missions = get_subdirs(field_dir);
                            if (missions.length == 0) {
                                fs.rmSync(field_dir, { recursive: true, force: true });
                                let fields = get_subdirs(farm_dir);
                                if (fields.length == 0) {
                                    fs.rmSync(farm_dir, { recursive: true, force: true });
                                }
                            }*/

                            remove_image_set(farm_name, field_name, mission_date);
                            if (!sent_response) {
                                sent_response = true;
                                return res.status(422).json({
                                    error: "Error occurred during image conversion process."
                                });
                            }
                        }
                        else {
                            try {
                                fs.unlinkSync(tmp_path);
                            }
                            catch (error) {
                                console.log(error);
                                /*
                                fs.rmSync(mission_dir, { recursive: true, force: true });
                                let missions = get_subdirs(field_dir);
                                if (missions.length == 0) {
                                    fs.rmSync(field_dir, { recursive: true, force: true });
                                    let fields = get_subdirs(farm_dir);
                                    if (fields.length == 0) {
                                        fs.rmSync(farm_dir, { recursive: true, force: true });
                                    }
                                }*/

                                remove_image_set(farm_name, field_name, mission_date);
                                if (!sent_response) {
                                    sent_response = true;
                                    return res.status(422).json({
                                        error: "Error occurred during image conversion process."
                                    });
                                }
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
                    /*
                    fs.rmSync(mission_dir, { recursive: true, force: true });
                    let missions = get_subdirs(field_dir);
                    if (missions.length == 0) {
                        fs.rmSync(field_dir, { recursive: true, force: true });
                        let fields = get_subdirs(farm_dir);
                        if (fields.length == 0) {
                            fs.rmSync(farm_dir, { recursive: true, force: true });
                        }
                    }*/

                    console.log(error.stack);
                    console.log('Error code: '+error.code);
                    console.log('Signal received: '+error.signal);
                    remove_image_set(farm_name, field_name, mission_date);
                    if (!sent_response) {
                        sent_response = true;
                        return res.status(422).json({
                            error: "Error occurred during image conversion process."
                        });
                    }
                }
            });
        }

        let exg_command = "python ../../plant_detection/src/excess_green.py " + mission_dir + " " + extensionless_fname;
        //console.log("Creating excess green images...")
        //console.log(exg_command);
        let result = exec(exg_command, {shell: "/bin/bash"}, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);   

                remove_image_set(farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred during creation of excess green image."
                    });
                }
            }
        });

        
    }


    if (last) {
        console.log("Collecting metadata...");
        console.log("flight_height", flight_height);
        let metadata_command = "python ../../plant_detection/src/metadata.py " + mission_dir;
        if (isNumeric(flight_height)) {
            numeric_flight_height = parseFloat(flight_height);
            if (numeric_flight_height < 0.1 || numeric_flight_height > 100) {
                remove_image_set(farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Provided flight height is invalid."
                    });
                }

            }
            metadata_command = metadata_command + " --flight_height " + flight_height;
        }
        console.log(metadata_command);
        let result = exec(metadata_command, {shell: "/bin/bash"}, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);   

                remove_image_set(farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred during metadata extraction."
                    });
                }
            }
            else {

                console.log("Writing upload_complete file...");
                let upload_complete = {}
                let upload_complete_path = path.join(mission_dir, "upload_complete.json");

                try {
                    fs.writeFileSync(upload_complete_path, JSON.stringify(upload_complete));
                }
                catch (error) {
                    console.log(error);
                    remove_image_set(farm_name, field_name, mission_date);
                    if (!sent_response) {
                        sent_response = true;
                        return res.status(422).json({
                            error: "Error occurred when writing upload completion record."
                        });
                    }
                }

                console.log("Sending final success status");
                if (!sent_response) {
                    sent_response = true;
                    return res.sendStatus(200);
                }



                /*
                let excess_green_record = {};
                console.log("Consolidating excess green records...");
                glob(path.join(mission_dir, "excess_green", "*_record.json"), function(error, image_paths) {
                    if (error) {
                        if (!sent_response) {
                            sent_response = true;
                            return res.status(422).json({
                                error: "Error occurred while reading excess green records."
                            });
                        }
                    }
                    for (image_path of image_paths) {
                        let fname = path.basename(image_path);
                        let image_name = fname.substring(0, fname.length - "_record.json".length);
                        try {
                            image_record = JSON.parse(fs.readFileSync(image_path, 'utf8'));
                        }
                        catch (error) {
                            if (!sent_response) {
                                sent_response = true;
                                return res.status(422).json({
                                    error: "Error occurred while reading excess green records."
                                });
                            }
                        }
                        excess_green_record[image_name] = image_record;
                        try {
                            fs.unlinkSync(image_path);
                        }
                        catch (error) {
                            if (!sent_response) {
                                sent_response = true;
                                return res.status(422).json({
                                    error: "Error occurred while reading excess green records."
                                });
                            }
                        }
                    }
                    let excess_green_record_path = path.join(mission_dir, "excess_green", "record.json");
                    try {
                        fs.writeFileSync(excess_green_record_path, JSON.stringify(excess_green_record));
                    }
                    catch (error) {
                        if (!sent_response) {
                            sent_response = true;
                            return res.status(422).json({
                                error: "Error occurred while writing excess green record."
                            });
                        }
                    }*/


                //});
            }
        });

    }
    else {
        console.log("Sending success status");
        if (!sent_response) {
            sent_response = true;
            return res.sendStatus(200);
        }
    }
}

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


exports.post_home = function(req, res, next) {

    //if (req.session.user && req.cookies.user_sid) {
    let action = req.body.action;
    let response = {};
    if (action === "delete_image_set") {
        
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;

        let mission_dir = path.join(USR_DATA_ROOT, "image_sets", farm_name, field_name, mission_date);

        let annotations_lock_path = path.join(mission_dir, "annotations", "lock.json");

        console.log("acquiring annotation mutex");
        annotation_mutex.acquire()
        .then(function(release) {
            let annotations_lock;
            try {
                annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read annotation lock file.";
                response.error = true;
                return res.json(response);
            }

            let last_refresh = annotations_lock["last_refresh"];
            let cur_time = Date.now();
            if ((cur_time - last_refresh) < ANNOTATION_LOCK_TIMEOUT) {
                release();
                console.log("Annotation file is currently locked");
                response.message = "The image set cannot be deleted since the corresponding annotation file is currently in use. Please try again later.";
                response.error = true;
                return res.json(response);
            }

            // success
            release();
            response.error = false;


            console.log("reading annotations file");
            
            let annotations_path = path.join(mission_dir, "annotations", "annotations_w3c.json");
            let annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
            console.log("checking number of annotations");
            let total_annotations = 0;
            for (image_name of Object.keys(annotations)) {
                total_annotations += annotations[image_name]["annotations"].length;
            }
            if (total_annotations !== 0) {
                response.error = true;
                response.message = "Cannot delete an image set with annotations."
                return res.json(response);
            }
            else {
                console.log("no annotations found, deleting image set");

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

                let results_mission_dir = path.join(USR_DATA_ROOT, "results", farm_name, field_name, mission_date);
                if (fs.existsSync(results_mission_dir)) {
                    fs.rmSync(results_mission_dir, { recursive: true, force: true });
                    let results_field_dir = path.join(USR_DATA_ROOT, "results", farm_name, field_name);
                    let results_missions = get_subdirs(results_field_dir);
                    if (results_missions.length == 0) {
                        fs.rmSync(results_field_dir, { recursive: true, force: true });
                        let results_farm_dir = path.join(USR_DATA_ROOT, "results", farm_name);
                        let results_fields = get_subdirs(results_farm_dir);
                        if (results_fields.length == 0) {
                            fs.rmSync(results_farm_dir, { recursive: true, force: true });
                        }
                    }
                }
                

                response.error = false;
                response.redirect = APP_PREFIX + "/home";
                return res.json(response);
            }
        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire annotation mutex.";
            response.error = true;
            return res.json(response);
        });
    }
    else if (action === "annotate_image_set") {

        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;

        let mission_dir = path.join(USR_DATA_ROOT, "image_sets", farm_name, field_name, mission_date);
        let annotations_dir = path.join(mission_dir, "annotations");
        let annotations_lock_path = path.join(annotations_dir, "lock.json")

        //annotations_lock.acquire(anno_lock_key, function() {
        console.log("acquiring annotation mutex");
        annotation_mutex.acquire()
        .then(function(release) {
            let annotations_lock;
            try {
                annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read annotation lock file.";
                response.error = true;
                return res.json(response);
            }

            let last_refresh = annotations_lock["last_refresh"];
            let cur_time = Date.now();
            if ((cur_time - last_refresh) < ANNOTATION_LOCK_TIMEOUT) {
                release();
                console.log("Annotation file is currently locked");
                response.message = "The requested annotation file is currently in use. Please try again later.";
                response.error = true;
                return res.json(response);
            }

            // success
            release();
            response.error = false;
            response.redirect = APP_PREFIX + "/annotate/" + farm_name + "/" +
                            field_name + "/" + mission_date;
            return res.json(response);

        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire annotation mutex.";
            response.error = true;
            return res.json(response);
        });





    }
    else if (action === "fetch_results") {
       
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;
        
        results_dir = path.join(USR_DATA_ROOT, "image_sets",
                                 farm_name, field_name, mission_date, "model", "results");

        let results = get_subdirs(results_dir);
        response.results = results;
        response.error = false;
        return res.json(response);

    }
    // else if (action === "manage_jobs_request") {
    //     response.redirect = APP_PREFIX + "/manage";
    //     res.json(response);
    
    // }
    // else if (action === "submit_training_request") {

        

    //     let job_uuid = uuidv4().toString();
    //     let farm_name = req.body.farm_name;
    //     let field_name = req.body.field_name;
    //     let mission_date = req.body.mission_date;
    //     let job_name = req.body.job_name;

    //     let format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
    //     if (format.test(job_name)) {
    //         response.error = true;
    //         response.message = "Group name contains illegal characters.";
    //         res.json(response);
    //     }
    //     else {


            
    //         let job_manager_path = path.join(USR_DATA_ROOT, "jobs", "jobs.json");
    //         let job_config_path = path.join(USR_DATA_ROOT, "jobs", job_uuid + ".json");
    //         let job_config = {
    //             "job_uuid": job_uuid,
    //             "job_name": job_name,
    //             "target_farm_name": farm_name,
    //             "target_field_name": field_name,
    //             "target_mission_date": mission_date,
    //             "source_construction_params": {
    //                 "method": "even_subset",
    //                 "size": 5000
    //             }
    //         }


            
    //         //let jobs = JSON.parse(fs.readFileSync(jobs_path, 'utf8'));

    //         job_lock.acquire(jobs, function() {
                
                
    //             jobs = JSON.parse(fs.readFileSync(job_manager_path, 'utf8'));

    //             if (jobs["num_active_jobs"] >= jobs["max_jobs"]) {
    //             //if (false) {
                    
    //                 //throw new Error("Maximum number of active jobs reached");
    //                 response.error = true;
    //                 response.message = "Too many active jobs.";
    //             }
    //             else {
    //                 //let jobs = {"num_active_jobs": 0, "active_jobs": []};
    //                 jobs["num_active_jobs"] += 1;
    //                 jobs["active_jobs"].push(job_uuid);
    //                 try {
    //                     fs.writeFileSync(job_manager_path, JSON.stringify(jobs));
    //                     fs.writeFileSync(job_config_path, JSON.stringify(job_config));
    //                     response.error = false;
    //                     response.message = "Starting to run job.";
    //                 }
    //                 catch (error) {
    //                     console.log("error occurred");
    //                     console.log(error);
    //                     response.error = true;
    //                     response.message = "File I/O error occurred.";
    //                 }

    //             }
    //         }).catch(function(error) {
    //             console.log(error.message);
    //             response.message = "Failed to acquire jobs lock.";
    //             response.error = true;
    //             res.json(response);
    //         });
    //         if (!(response.error)) {

    //             let subprocess = spawn("python3", ["../../plant_detection/src/main.py", 
    //                                     job_uuid]);

    //             console.log("adding subprocess");
    //             job_lock.acquire(active_subprocesses, function() {
    //                 active_subprocesses[job_uuid] = subprocess.pid;
    //                 console.log("Active subprocesses", active_subprocesses);
    //             }).catch(function(error) {
    //                 console.log(error.message);
    //                 response.message = "Failed to acquire active_subprocesses lock.";
    //                 response.error = true;
    //                 res.json(response);
    //             });


    //             //let subprocess = spawn("sleep", ["15"]);
    //             subprocess.on('close', (code) => {
    //                 console.log("Process finished.");
    //                 console.log("code", code);


    //                 //let jobs_path = path.join("usr", "jobs", "jobs.json");
    //                 //let jobs = JSON.parse(fs.readFileSync(jobs_path, 'utf8'));
    //                 job_lock.acquire(jobs, function() {
    //                     jobs = JSON.parse(fs.readFileSync(job_manager_path, 'utf8'));
    //                     jobs["num_active_jobs"] -= 1;
    //                     let index = jobs["active_jobs"].indexOf(job_uuid);
    //                     if (index > -1) {
    //                         jobs["active_jobs"].splice(index, 1); // 2nd parameter means remove one item only
    //                     }
    //                     try {
    //                         fs.writeFileSync(job_manager_path, JSON.stringify(jobs));
    //                     }
    //                     catch (error) {
    //                         console.log(error);
    //                     }
                    
    //                 }).catch(function(error) {
    //                     console.log(error);
    //                 });

    //                 job_lock.acquire(active_subprocesses, function() {
    //                     delete active_subprocesses[job_uuid];
    //                 }).catch(function(error) {
    //                     console.log(error);
    //                 });
                    
    //             })
                
    //             subprocess.stderr.on('data', (data) => {
    //                 /* for some reason listening on stderr is required for files to be 
    //                     output correctly by the subprocess ?? */
    //                 console.error(`subprocess stderr: ${data}`);
    //             });
    //             subprocess.stdout.on('data', (data) => {
    //                 console.log(`subprocess stdout: ${data}`);
    //             });

    //             subprocess.on('SIGINT', function() {
    //                 console.log('Received SIGINT signal');
    //                 job_lock.acquire(jobs, function() {
    //                     delete active_subprocesses[job_uuid];
    //                 }).catch(function(error) {
    //                     console.log(error);
    //                 });
    //             });
            
    //             subprocess.on('error', (err) => {
    //                 console.log("Failed to start subprocess.");
    //                 job_lock.acquire(jobs, function() {
    //                     jobs = JSON.parse(fs.readFileSync(job_manager_path, 'utf8'));
    //                     jobs["num_active_jobs"] -= 1;
    //                     let index = jobs["active_jobs"].indexOf(job_uuid);
    //                     if (index > -1) {
    //                         jobs["active_jobs"].splice(index, 1); // 2nd parameter means remove one item only
    //                     }
    //                     try {
    //                         fs.writeFileSync(job_manager_path, JSON.stringify(jobs));
    //                     }
    //                     catch (error) {
    //                         console.log(error);
    //                     }
                        
    //                 }).catch(function(error) {
    //                     console.log(error);
    //                 });
                    

    //                 job_lock.acquire(active_subprocesses, function() {
    //                     delete active_subprocesses[job_uuid];
    //                 }).catch(function(error) {
    //                     console.log(error);
    //                 });
    //             });

    //             res.json(response);
    //         }
    //         else {
    //             res.json(response);
    //         }
    //     }
    // }
    else {
        console.log("invalid action", action);
        response.message = "Invalid action specified.";
        response.error = true;
        return res.json(response);
    }
    /*
    }
    else {
        res.cookie_expired = true;
        response.redirect = APP_PREFIX;
        return res.json(response);
    }*/

}
exports.get_viewer_dep = function(req, res, next) {
    
    if (req.session.user && req.cookies.user_sid) {
        
        let farm_name = req.params.farm_name;
        let field_name = req.params.field_name;
        let mission_date = req.params.mission_date;
        let job_uuid = req.params.timestamp;

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
        let metadata_path = path.join(image_set_root, "metadata", "metadata.json");
        let metadata;
        try {
            metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }



        overlays["annotations"] = annotations;

        
        let dzi_images_dir = path.join(image_set_root, "dzi_images");

        let dzi_image_paths = [];
        for (image_name of Object.keys(annotations)) {
            let dzi_image_path = path.join(APP_PREFIX, dzi_images_dir, image_name + ".dzi");
            dzi_image_paths.push(dzi_image_path);

        }

        let image_set_info = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date
        }

        let data = {};
        data["image_set_info"] = image_set_info;
        data["job_config"] = job_config;
        data["overlays"] = overlays;
        data["metadata"] = metadata;
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

exports.get_viewer = function(req, res, next) {
    
    if (req.session.user && req.cookies.user_sid) {
        
        let farm_name = req.params.farm_name;
        let field_name = req.params.field_name;
        let mission_date = req.params.mission_date;
        let timestamp = req.params.timestamp;

        /*
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

        }*/

        let image_set_dir = path.join(USR_DATA_ROOT, "image_sets",
                                      farm_name, field_name, mission_date);

        let sel_results_dir = path.join(image_set_dir, "model", "results", timestamp);

        //let annotations_path = path.join(image_set_dir, "annotations", "annotations_w3c.json");
        let annotations_path = path.join(sel_results_dir, "annotations_w3c.json")
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }
        let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
        let metadata;
        try {
            metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }
        let predictions_path = path.join(sel_results_dir, "predictions_w3c.json")
        let predictions;
        try {
            predictions = JSON.parse(fs.readFileSync(predictions_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }
        let metrics_path = path.join(sel_results_dir, "metrics.json");
        let metrics;
        try {
            metrics = JSON.parse(fs.readFileSync(metrics_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }
        let excess_green_record_path = path.join(sel_results_dir, "excess_green_record.json");
        let excess_green_record;
        try {
            excess_green_record = JSON.parse(fs.readFileSync(excess_green_record_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }

        //overlays["annotations"] = annotations;

        
        let dzi_images_dir = path.join(image_set_dir, "dzi_images");

        let dzi_image_paths = [];
        for (image_name of Object.keys(annotations)) {
            let dzi_image_path = path.join(APP_PREFIX, dzi_images_dir, image_name + ".dzi");
            dzi_image_paths.push(dzi_image_path);

        }

        let image_set_info = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "timestamp": timestamp
        };



        let data = {};

        data["image_set_info"] = image_set_info;
        //data["job_config"] = job_config;
        //data["overlays"] = overlays;
        data["annotations"] = annotations;
        data["predictions"] = predictions;
        data["metadata"] = metadata;
        //data["predictions"] = predictions;
        data["excess_green_record"] = excess_green_record;
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


    //if (req.session.user && req.cookies.user_sid) {

    let response = {};
    console.log(req.params);

    //let job_uuid = req.params.job_uuid;
    let farm_name = req.params.farm_name;
    let field_name = req.params.field_name;
    let mission_date = req.params.mission_date;
    let timestamp = req.params.timestamp;
    let action = req.body.action;


    if (action == "build_map") {

        console.log(farm_name);
        console.log(field_name);
        console.log(mission_date);

        //let model_uuid = req.body.model_uuid;

        
        
        let model_results_dir = path.join(USR_DATA_ROOT, "image_sets", farm_name, field_name, mission_date,
                                          "model", "results", timestamp);
        let annotations_path = path.join(model_results_dir, "annotations_w3c.json");
        let pred_path = path.join(model_results_dir, "predictions_w3c.json");
        let out_dir = path.join(model_results_dir, "maps");
        //let pred_path = path.join(USR_DATA_ROOT, "results", farm_name, field_name, mission_date,
        //                            job_uuid, model_uuid, "predictions.json");
        //let out_dir = path.join(USR_DATA_ROOT, "results", farm_name, field_name, mission_date,
        //                            job_uuid, model_uuid, "maps");

        let rebuild_command = "python ../../plant_detection/src/interpolate.py " + farm_name +
                                " " + field_name + " " + mission_date + " " + annotations_path + " " +
                                out_dir + " -p " + pred_path;

        if (req.body.interpolation == "nearest") {
            rebuild_command = rebuild_command + " -nearest";
        }
        if (req.body.pred_image_status == "completed") {
            rebuild_command = rebuild_command + " -completed_only";
        }
        if (req.body.comparison_type == "diff") {
            rebuild_command = rebuild_command + " -diff";
        }
        console.log(rebuild_command);
        let result = exec(rebuild_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);
                response.error = true;
            }
            else {
                response.error = false;
            }
            return res.json(response);
        });
    }
    /*
    }
    else {
        res.cookie_expired = true;
        response.redirect = APP_PREFIX;
        return res.json(response);
    }*/
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
        // TODO: FIX
        res.redirect(APP_PREFIX);
    }

}

exports.logout = function(req, res, next) {
    console.log("got to logout");
    if (req.session.user && req.cookies.user_sid) {
        console.log("clearing cookies");
        res.clearCookie('user_sid');
        console.log("done clearing cookies");
    }
    console.log("redirecting");
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