const path = require('path');
const fs = require('fs');

const socket_io = require('socket.io');
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

        let [farm_name, field_name, mission_date] = key.split("/");

        let status_path = path.join(USR_DATA_ROOT, "image_sets", farm_name, field_name, mission_date, "model", "status.json");
        let status;
        try {
            status = JSON.parse(fs.readFileSync(status_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }

        io.to(socket_lookup[key]).emit("status_change", status)

    });
});



exports.post_notification = function(req, res, next) {

    console.log("got notification");
    console.log(req.body);

    
    let farm_name = req.body.farm_name;
    let field_name = req.body.field_name;
    let mission_date = req.body.mission_date;

    let key = farm_name + "/" + field_name + "/" + mission_date;

    /*
    let status_path = path.join(USR_DATA_ROOT, "image_sets", farm_name, field_name, mission_date, "model", "status.json");
    let status;
    try {
        status = JSON.parse(fs.readFileSync(status_path, 'utf8'));
    }
    catch (error) {
        console.log(error);
    }*/

    console.log("checking socket lookup", socket_lookup);
    if (key in socket_lookup) {
        console.log("emitting");
        let socket_id = socket_lookup[key];
        console.log("sending to socket_id", socket_id);
        io.to(socket_lookup[key]).emit("status_change", req.body);
        //io.emit("status_change");
    }


    let response = {};
    response.message = "received";
    return res.json(response);
}

module.exports.io = io;
