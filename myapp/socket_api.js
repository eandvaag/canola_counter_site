const path = require('path');
const fs = require('fs');
const glob = require('glob');

const socket_io = require('socket.io');
const io = socket_io({
    "path": "/plant_detection/socket.io"
});

// import { Server } from "socket.io";
// const io = new Server();

/*var socket_api = {};

socket_api.io = io;*/


const USR_DATA_ROOT = 'usr/data/';


//let workspace_key_to_id = {};
let workspace_id_to_key = {};
//let home_key_to_ids = {};
let home_id_to_key = {};
// let socket_key_to_ids = {};
// let socket_id_to_key = {};

io.on('connection', function(socket) {
	console.log('A user connected');

    socket.on("join_annotate", (key) => {
        console.log("join_annotate from", key);
        // let socket_id = (socket.id).toString();

        //workspace_key_to_id[key] = socket.id;

        let occupied = false;
        for (let socket_id of Object.keys(workspace_id_to_key)) {
            if (workspace_id_to_key[socket_id] === key) {
                occupied = true;
                break;
            }
        }
        if (occupied) {
            io.to(socket.id).emit("workspace_occupied", {});
        }
        else {
            workspace_id_to_key[socket.id] = key;

            //console.log("updated workspace_key_to_id", workspace_key_to_id);
            console.log("updated workspace_id_to_key", workspace_id_to_key);

            // if (!(key in socket_key_to_ids)) {
            //     socket_key_to_ids[key] = [];
            // }
            // socket_key_to_ids[key].push(socket_id);
            // socket_id_to_key[socket_id] = key;

            // console.log("updated socket_key_to_ids", socket_key_to_ids);
            // console.log("updated socket_id_to_key", socket_id_to_key);

            let [username, farm_name, field_name, mission_date] = key.split("/");

            // let status_path = path.join(USR_DATA_ROOT, username, "image_sets", farm_name, field_name, mission_date, "model", "status.json");
            // let status;
            // try {
            //     status = JSON.parse(fs.readFileSync(status_path, 'utf8'));
            // }
            // catch (error) {
            //     console.log(error);
            // }
            let scheduler_status_path = path.join("usr", "shared", "scheduler_status.json")
            let scheduler_status;
            try {
                scheduler_status = JSON.parse(fs.readFileSync(scheduler_status_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
            }

            emit_image_set_status(username, farm_name, field_name, mission_date);
            emit_scheduler_status(scheduler_status);
        }

    });

    socket.on("join_home", (username) => {
        console.log("join_home from", username);
        //if (!(username in home_key_to_ids)) {
        //    home_key_to_ids[username] = [];
        //}
        //home_key_to_ids[username].push(socket.id);
        home_id_to_key[socket.id] = username;

        //console.log("updated home_key_to_ids", home_key_to_ids);
        console.log("updated home_id_to_key", home_id_to_key);
    });


    socket.on("disconnect", (reason) => {

        

        // let socket_id = (socket.id).toString();
        if (socket.id in home_id_to_key) {
            console.log("user disconnected from home");
            
            //let key = home_id_to_key[socket.id];
            delete home_id_to_key[socket.id];
            //let socket_ids = socket_key_to_ids[key];

            /*
            if (key in home_key_to_ids) {
                let index = home_key_to_ids[key].indexOf(socket.id);
                home_key_to_ids[key].splice(index, 1);

                if (home_key_to_ids[key].length == 0) {
                    delete home_key_to_ids[key];
                }
            }*/

            //console.log("updated home_key_to_ids", home_key_to_ids);
            console.log("updated home_id_to_key", home_id_to_key);
        }
        else if (socket.id in workspace_id_to_key) {
            console.log("user disconnected from workspace");

            //let key = workspace_id_to_key[socket.id];
            delete workspace_id_to_key[socket.id];
            //delete workspace_key_to_id[key];

            //console.log("updated workspace_key_to_id", workspace_key_to_id);
            console.log("updated workspace_id_to_key", workspace_id_to_key);
        }


    });
});

function emit_image_set_status(username, farm_name, field_name, mission_date) {
    let key = username + "/" + farm_name + "/" + field_name + "/" + mission_date;


    let sel_socket_id = null;
    for (let socket_id of Object.keys(workspace_id_to_key)) {
        if (workspace_id_to_key[socket_id] === key) {
            sel_socket_id = socket_id;
            break;
        }
    }
    if (sel_socket_id !== null) {

        //if ((key in workspace_key_to_id) && (workspace_key_to_id[key] !== "tmp_hold")) {
        //let socket_id = workspace_key_to_id[key];

        let image_set_dir = path.join("usr", "data", username, "image_sets",
                                        farm_name, field_name, mission_date);
        let model_dir = path.join(image_set_dir, "model");

        let status;
        let status_path = path.join(model_dir, "status.json");
        try {
            status = JSON.parse(fs.readFileSync(status_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }

        let training_dir = path.join(model_dir, "training");
        let prediction_dir = path.join(model_dir, "prediction");

        let num_outstanding;
        glob(path.join(prediction_dir, "image_requests", "*"), function(error, image_prediction_paths) {
            if (error) {
                console.log(error);
            }
            num_outstanding = image_prediction_paths.length;
            glob(path.join(prediction_dir, "image_set_requests", "pending", "*"), function(error, image_set_prediction_paths) {
                if (error) {
                    console.log(error);
                }
                num_outstanding = num_outstanding + image_set_prediction_paths.length;

                if (num_outstanding > 0) {
                    status["outstanding_prediction_requests"] = "True";
                }
                else {
                    status["outstanding_prediction_requests"] = "False";
                }

                status["usr_training_blocked"] = "True";
                let block_file_path = path.join(training_dir, "usr_block.json");
                try {
                    fs.accessSync(block_file_path, fs.constants.F_OK);
                }
                catch (e) {
                    status["usr_training_blocked"] = "False";
                }

                status["sys_training_blocked"] = "True";
                block_file_path = path.join(training_dir, "sys_block.json");
                try {
                    fs.accessSync(block_file_path, fs.constants.F_OK);
                }
                catch (e) {
                    status["sys_training_blocked"] = "False";
                }
                    
                io.to(sel_socket_id).emit("image_set_status_change", status);

            });
        });
    }
}

function emit_scheduler_status(status) {



    let username = status["username"];
    let farm_name = status["farm_name"];
    let field_name = status["field_name"];
    let mission_date = status["mission_date"];

    //let affected_key = username + "/" + farm_name + "/" + field_name + "/" + mission_date;

    emit_image_set_status(username, farm_name, field_name, mission_date);
    for (let socket_id of Object.keys(workspace_id_to_key)) {
        io.to(socket_id).emit("scheduler_status_change", status);
    }

    /*
    for (key of Object.keys(workspace_key_to_id)) {
        let socket_id = workspace_key_to_id[key];
        if (socket_id !== "tmp_hold") {
            io.to(socket_id).emit("scheduler_status_change", status);
        }
    }*/
}

exports.post_results_notification = function(req, res, next) {
    let username = req.body.username;
    let farm_name = req.body.farm_name;
    let field_name = req.body.field_name;
    let mission_date = req.body.mission_date;
    
    results_notification(username, farm_name, field_name, mission_date);

    let response = {};
    response.message = "received";
    return res.json(response);
    
}

function results_notification(username, farm_name, field_name, mission_date) {

    console.log("results update occurred, sending to sockets");
    console.log(username, farm_name, field_name, mission_date);

    //console.log("home_key_to_ids", home_key_to_ids);
    console.log("home_id_to_key", home_id_to_key);

    let key = username;

    for (let socket_id of Object.keys(home_id_to_key)) {
        if (home_id_to_key[socket_id] === key) {
            io.to(socket_id).emit("results_change", {farm_name, field_name, mission_date});
        }
    }

    /*
    if (key in home_key_to_ids) {

        let socket_ids = home_key_to_ids[key];
        for (let socket_id of socket_ids) {
            io.to(socket_id).emit("results_change", {farm_name, field_name, mission_date});
        }
    }*/
}



exports.post_upload_notification = function(req, res, next) {
    let username = req.body.username;
    let farm_name = req.body.farm_name;
    let field_name = req.body.field_name;
    let mission_date = req.body.mission_date;

    console.log("upload update occurred, sending to sockets");
    console.log(username, farm_name, field_name, mission_date);

    //console.log("home_key_to_ids", home_key_to_ids);
    console.log("home_id_to_key", home_id_to_key);

    let key = username;

    for (let socket_id of Object.keys(home_id_to_key)) {
        if (home_id_to_key[socket_id] === key) {
            io.to(socket_id).emit("upload_change", {farm_name, field_name, mission_date});
        }
    }
    /*
    if (key in home_key_to_ids) {

        let socket_ids = home_key_to_ids[key];
        for (let socket_id of socket_ids) {
            io.to(socket_id).emit("upload_change", {farm_name, field_name, mission_date});
        }
    }*/
    let response = {};
    response.message = "received";
    return res.json(response);
}


exports.post_status_notification = function(req, res, next) {

    emit_scheduler_status(req.body);

    let response = {};
    response.message = "received";
    return res.json(response);
}

module.exports.io = io;
module.exports.workspace_id_to_key = workspace_id_to_key;
module.exports.results_notification = results_notification;