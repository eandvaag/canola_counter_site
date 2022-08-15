const path = require('path');
const fs = require('fs');

const socket_io = require('socket.io');
const glob = require('glob');
const io = socket_io();

/*var socket_api = {};

socket_api.io = io;*/


const USR_DATA_ROOT = 'usr/data/';

let socket_lookup = {};

io.on('connection', function(socket) {
	console.log('A user connected');

    socket.on("join_message", (key) => {
        console.log(key);
        socket_lookup[key] = socket.id;

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

        //io.to(socket_lookup[key]).emit("status_change", status)

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

            console.log("checking socket lookup", socket_lookup);
            if (key in socket_lookup) {
                console.log("emitting");
                let socket_id = socket_lookup[key];
                console.log("sending to socket_id", socket_id);
        
                io.to(socket_lookup[key]).emit("status_change", status);
                
                //io.emit("status_change");
                
            }

        });
    });



}

exports.post_notification = function(req, res, next) {

    console.log("got notification");
    console.log(req.body);

    let username = req.body.username;
    let farm_name = req.body.farm_name;
    let field_name = req.body.field_name;
    let mission_date = req.body.mission_date;

    let key = username + "/" + farm_name + "/" + field_name + "/" + mission_date;

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
