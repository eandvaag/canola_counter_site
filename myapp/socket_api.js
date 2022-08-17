const path = require('path');
const fs = require('fs');

const socket_io = require('socket.io');
const glob = require('glob');
const io = socket_io();

/*var socket_api = {};

socket_api.io = io;*/


const USR_DATA_ROOT = 'usr/data/';


let workspace_key_to_id = {};
let home_key_to_ids = {};
let home_id_to_key = {};
// let socket_key_to_ids = {};
// let socket_id_to_key = {};

io.on('connection', function(socket) {
	console.log('A user connected');

    socket.on("join_annotate", (key) => {
        console.log("join_annotate from", key);
        // let socket_id = (socket.id).toString();

        workspace_key_to_id[key] = socket.id;

        // if (!(key in socket_key_to_ids)) {
        //     socket_key_to_ids[key] = [];
        // }
        // socket_key_to_ids[key].push(socket_id);
        // socket_id_to_key[socket_id] = key;

        // console.log("updated socket_key_to_ids", socket_key_to_ids);
        // console.log("updated socket_id_to_key", socket_id_to_key);

        let [username, farm_name, field_name, mission_date] = key.split("/");

        let status_path = path.join(USR_DATA_ROOT, username, "image_sets", farm_name, field_name, mission_date, "model", "status.json");
        let status;
        try {
            status = JSON.parse(fs.readFileSync(status_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }

        emit_status_change(username, farm_name, field_name, mission_date, status);

    });

    socket.on("join_home", (username) => {
        console.log("join_home from", username);
        if (!(username in home_key_to_ids)) {
            home_key_to_ids[username] = [];
        }
        home_key_to_ids[username].push(socket.id);
        home_id_to_key[socket.id] = username;

        console.log("updated home_key_to_ids", home_key_to_ids);
        console.log("updated home_id_to_key", home_id_to_key);
    });


    socket.on("disconnect", (reason) => {

        console.log("a user disconnected");

        // let socket_id = (socket.id).toString();
        if (socket.id in home_id_to_key) {
            
            let key = home_id_to_key[socket.id];
            delete home_id_to_key[socket.id];
            //let socket_ids = socket_key_to_ids[key];

            if (key in home_key_to_ids) {
                let index = home_key_to_ids[key].indexOf(socket.id);
                home_key_to_ids[key].splice(index, 1);

                if (home_key_to_ids[key].length == 0) {
                    delete home_key_to_ids[key];
                }

            }
        }

        console.log("updated home_key_to_ids", home_key_to_ids);
        console.log("updated home_id_to_key", home_id_to_key);
    });
});

function emit_status_change(username, farm_name, field_name, mission_date, status) {

    let key = username + "/" + farm_name + "/" + field_name + "/" + mission_date;

    let training_dir = path.join("usr", "data", username, "image_sets",
                                    farm_name, field_name, mission_date, "model", "training");

    let prediction_dir = path.join("usr", "data", username, "image_sets",
                                        farm_name, field_name, mission_date, "model", "prediction");
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

            
            if (key in workspace_key_to_id) {
                let socket_id = workspace_key_to_id[key];
                io.to(socket_id).emit("status_change", status);
            }
            // if (key in socket_key_to_ids) {
            //     console.log("emitting");
            //     let socket_ids = socket_key_to_ids[key];
            //     for (socket_id of socket_ids) {
            //         console.log("sending to socket_id", socket_id);
            //         io.to(socket_id).emit("status_change", status);
            //     }
                
            //     //io.emit("status_change");
            // }

        });
    });
}

exports.post_results_notification = function(req, res, next) {
    let username = req.body.username;
    let farm_name = req.body.farm_name;
    let field_name = req.body.field_name;
    let mission_date = req.body.mission_date; 
    
    console.log("results update occurred, sending to sockets");
    console.log(username, farm_name, field_name, mission_date);

    console.log("home_key_to_ids", home_key_to_ids);
    console.log("home_id_to_key", home_id_to_key);

    let key = username;

    if (key in home_key_to_ids) {

        let socket_ids = home_key_to_ids[key];
        for (socket_id of socket_ids) {
            console.log("sending to socket_id", socket_id);
            io.to(socket_id).emit("results_change", {farm_name, field_name, mission_date});
        }
    }

    let response = {};
    response.message = "received";
    return res.json(response);
}


exports.post_upload_notification = function(req, res, next) {
    let username = req.body.username;
    let farm_name = req.body.farm_name;
    let field_name = req.body.field_name;
    let mission_date = req.body.mission_date;   

    console.log("upload update occurred, sending to sockets");
    console.log(username, farm_name, field_name, mission_date);

    console.log("home_key_to_ids", home_key_to_ids);
    console.log("home_id_to_key", home_id_to_key);

    let key = username;

    if (key in home_key_to_ids) {

        let socket_ids = home_key_to_ids[key];
        for (socket_id of socket_ids) {
            console.log("sending to socket_id", socket_id);
            io.to(socket_id).emit("upload_change", {farm_name, field_name, mission_date});
        }
    }

    let response = {};
    response.message = "received";
    return res.json(response);
}


exports.post_status_notification = function(req, res, next) {

    console.log("got notification");
    console.log(req.body);

    let username = req.body.username;
    let farm_name = req.body.farm_name;
    let field_name = req.body.field_name;
    let mission_date = req.body.mission_date;

    /*
    let status_path = path.join(USR_DATA_ROOT, "image_sets", farm_name, field_name, mission_date, "model", "status.json");
    let status;
    try {
        status = JSON.parse(fs.readFileSync(status_path, 'utf8'));
    }
    catch (error) {
        console.log(error);
    }*/
    emit_status_change(username, farm_name, field_name, mission_date, req.body);


    let response = {};
    response.message = "received";
    return res.json(response);
}

module.exports.io = io;
