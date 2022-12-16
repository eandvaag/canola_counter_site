let count_chart_data;
let count_svg;
let count_xScale;
let count_yScale;
let count_chart_axis;
let count_margin;
let max_count;




function set_count_chart_data() {


    count_chart_data = {};

    let metric = $("#chart_combo").val();

    let sensor_height;
    let sensor_width;
    let focal_length;
    let camera_height;
    if (metric == "Count Per Square Metre") {
        let make = metadata["camera_info"]["make"];
        let model = metadata["camera_info"]["model"];

        let camera_entry = camera_specs[make][model];
        sensor_height = camera_entry["sensor_height"];
        sensor_width = camera_entry["sensor_width"];
        focal_length = camera_entry["focal_length"];
        camera_height = metadata["camera_height"];
    }

    /*
    let annotated_count;
    let pred_count;*/
    let slider_val = Number.parseFloat($("#confidence_slider").val());


    // count_chart_data[cur_img_name] = {};
    // count_chart_data[cur_img_name]["Annotations"] = 0
    // count_chart_data[cur_img_name]["Predictions"] = 0

    // for (let image_name of Object.keys(annotations)) {
    //     count_chart_data[image_name] = {};
    //     for (let overlay_name of ["annotation", "prediction"]) {//["Annotations", "Predictions"]) {//Object.keys(overlay_colors)) {
    //         count_chart_data[image_name][overlay_name] = 0;
    //     }
    // }
    
    /*
    let overlay_map = {
        "Annotations": annotations,
        "Predictions": predictions
    }*/
/*
    if (metric === "Count" || metric === "Count per square metre") {
        for (let overlay_name of Object.keys(overlay_colors)) {
           
            for (let i = slider_val * 100; i < score_chart_data[cur_img_name]["bins"].length; i++) {
                count_chart_data[cur_img_name][overlay_name] += score_chart_data[cur_img_name]["bins"][i];
            }
        }

        max_count = 0;

    }*/

    let navigation_type = $('#navigation_dropdown').val();
    if (metric === "Count" || metric === "Count Per Square Metre") {

        
        if (navigation_type === "images") {
            for (let image_name of Object.keys(annotations)) {
                let nav_item = image_name + "/-1";
                count_chart_data[nav_item] = {"annotation":  0, "prediction": 0};
                count_chart_data[nav_item]["annotation"] = annotations[image_name]["boxes"].length;

                if (image_name in predictions) {
                    for (let i = 0; i < predictions[image_name]["scores"].length; i++) {
                        if (predictions[image_name]["scores"][i] > slider_val) {
                            count_chart_data[nav_item]["prediction"]++;
                        }
                    }
                }
            }
        }
        else {
            for (let image_name of Object.keys(annotations)) {
                for (let i = 0; i < annotations[image_name][navigation_type].length; i++) {
                    let nav_item = image_name + "/" + i;
                    count_chart_data[nav_item] = {"annotation":  0, "prediction": 0};
                    for (let j = 0; j < annotations[image_name]["boxes"].length; j++) {
                        if (box_intersects_region(annotations[image_name]["boxes"][j], annotations[image_name][navigation_type][i])) {
                            count_chart_data[nav_item]["annotation"]++;
                        }
                    }
                    if (image_name in predictions) {
                        for (let j = 0; j < predictions[image_name]["boxes"].length; j++) {
                            if (predictions[image_name]["scores"][j] > slider_val && 
                                box_intersects_region(predictions[image_name]["boxes"][j], annotations[image_name][navigation_type][i])) {
                                    count_chart_data[nav_item]["prediction"]++;
                                    // console.log(i, predictions[image_name]["boxes"][j]);
                            }
                        }
                    }
                }
            }
            // console.log("navigation_type", navigation_type, annotations[cur_img_name][navigation_type].length);
            // console.log("COUNT CHART DATA", count_chart_data);
        }


/*

            for (let overlay_name of Object.keys(overlay_colors)) {
                if (image_name in overlay_map[overlay_name]) {
                    for (let annotation of overlay_map[overlay_name][image_name]["annotations"]) {
                    //if (image_name in overlay_map[overlay_name]) 
                    //for (let i = 0; i < overlay_map[overlay_name][image_name]["boxes"].length; i++) {
                        let score_el = annotation["body"].find(b => b.purpose == 'score');
                        if (!score_el || score_el.value >= slider_val) {
                            count_chart_data[image_name][overlay_name]++;
                        }
                    }
                }
            }
        }*/

        max_count = 0;
        for (let nav_item of Object.keys(count_chart_data)) {
            for (let overlay_name of Object.keys(count_chart_data[nav_item])) {
                let v = count_chart_data[nav_item][overlay_name];
                let image_name = nav_item.split("/")[0];
                if (metric == "Count Per Square Metre") {


                    let gsd_h = (camera_height * sensor_height) / (focal_length * metadata["images"][image_name]["height_px"]);
                    let gsd_w = (camera_height * sensor_width) / (focal_length * metadata["images"][image_name]["width_px"]);     
                    
                    let gsd = Math.min(gsd_h, gsd_w);

                    let image_height_m = metadata["images"][image_name]["height_px"] * gsd;
                    let image_width_m = metadata["images"][image_name]["width_px"] * gsd;

                    let area_m2 = image_width_m * image_height_m;

                    v = v / area_m2;
                    v = Math.round((v + Number.EPSILON) * 100) / 100;

                    count_chart_data[nav_item][overlay_name] = v;
                }
                if (v > max_count) {
                    max_count = v;
                }
            }
        }
    }

    else if (metric === "Percent Count Error") {

        max_count = 0;
        if (navigation_type === "images") {
            for (let image_name of Object.keys(annotations)) {
                let nav_item = image_name + "/-1";
                count_chart_data[nav_item] = {"annotation":  0, "prediction": 0};
                let annotated_count = annotations[image_name]["boxes"].length;


                if (image_name in predictions) {
                    let predicted_count = 0;
                    for (let i = 0; i < predictions[image_name]["scores"].length; i++) {
                        if (predictions[image_name]["scores"][i] > slider_val) {
                            predicted_count++;
                        }
                    }
                    if (annotated_count == 0) {
                        count_chart_data[nav_item]["prediction"] = 0;
                    }
                    else {
                        count_chart_data[nav_item]["prediction"] = (Math.abs((predicted_count - annotated_count) / (annotated_count)) * 100);
                    }
                }
                if (count_chart_data[nav_item]["prediction"] > max_count) {
                    max_count = count_chart_data[nav_item]["prediction"];
                }
            }
        }
        else {
            for (let image_name of Object.keys(annotations)) {
                for (let i = 0; i < annotations[image_name][navigation_type].length; i++) {
                    let nav_item = image_name + "/" + i;
                    count_chart_data[nav_item] = {"annotation":  0, "prediction": 0};
                    let annotated_count = 0;
                    for (let j = 0; j < annotations[image_name]["boxes"].length; j++) {
                        if (box_intersects_region(annotations[image_name]["boxes"][j], annotations[image_name][navigation_type][i])) {
                            annotated_count++;
                        }
                    }
                    if (image_name in predictions) {
                        let predicted_count = 0;
                        for (let j = 0; j < predictions[image_name]["boxes"].length; j++) {
                            if (predictions[image_name]["scores"][j] > slider_val && 
                                box_intersects_region(predictions[image_name]["boxes"][j], annotations[image_name][navigation_type][i])) {
                                    predicted_count++;
                            }
                        }
                        if (annotated_count == 0) {
                            count_chart_data[nav_item]["prediction"] = 0;
                        }
                        else {
                            count_chart_data[nav_item]["prediction"] = (Math.abs((predicted_count - annotated_count) / (annotated_count)) * 100);
                        }
                    }
                    if (count_chart_data[nav_item]["prediction"] > max_count) {
                        max_count = count_chart_data[nav_item]["prediction"];
                    }
                }
            }
        }
    }
    // else if (metric === "Ground Cover Percentage") {

    //     for (image_name of Object.keys(annotations)) {
    //         count_chart_data[image_name]["annotations"] = excess_green_record[image_name]["ground_cover_percentage"];
    //         count_chart_data[image_name]["predictions"] = 0;
    //     }
    //     max_count = 100;
    // }
    else {
        // let key_map = {
            // "MS COCO mAP": "Image MS COCO mAP",
            //"PASCAL VOC mAP": "Image PASCAL VOC mAP"
        // }
        if (navigation_type === "images") {
            for (let image_name of Object.keys(annotations)) {
                let image_w = metadata["images"][cur_img_name]["width_px"];
                let image_h = metadata["images"][cur_img_name]["height_px"]
                let fully_annotated_for_training = image_is_fully_annotated_for_training(
                    annotations, 
                    cur_img_name, 
                    image_w,
                    image_h
                );

                let fully_annotated_for_testing = image_is_fully_annotated_for_testing(
                    annotations, 
                    cur_img_name, 
                    image_w,
                    image_h
                );

                if (fully_annotated_for_training || fully_annotated_for_testing) {

                    let nav_item = image_name + "/-1";
                    count_chart_data[nav_item] = {"annotation":  0, "prediction": 0};
                    count_chart_data[nav_item]["annotation"] = 0;

                    let region_key;
                    if (fully_annotated_for_training) {
                        region_key = "training_regions";
                    }
                    else {
                        region_key = "test_regions";
                    }

                    for (let i = 0; i < annotations[image_name][region_key].length; i++) {
                        let region = annotations[image_name][region_key][i];
                        if ((region[0] == 0 && region[1] == 0) && 
                            (region[2] == image_h && region[3] == image_w)) {

                            count_chart_data[nav_item]["prediction"] = metrics[metric][image_name][region_key][i];
                            break;
                        }
                    }
                }
            }
        }
        else {
            for (let image_name of Object.keys(annotations)) {
                for (let i = 0; i < annotations[image_name][navigation_type].length; i++) {
                    let nav_item = image_name + "/" + i;
                    count_chart_data[nav_item] = {"annotation":  0, "prediction": 0};
                    count_chart_data[nav_item]["annotation"] = 0;
                    //if ((image_name in metrics) && (metric in metrics[image_name])) {
                    //if ((metric in metrics) && (image in metrics[metric])) {
                    count_chart_data[nav_item]["prediction"] = metrics[metric][image_name][navigation_type][i];
                    // }
                    // else {
                    //     count_chart_data[image_name]["prediction"] = 0;
                    // }
                }
            }
        }
        /*
        for (let i = 0; i < sorted_overlay_ids.length; i++) {
            let overlay_id = sorted_overlay_ids[i];
            
            if (overlay_id !== "annotations") {
                for (image_name of Object.keys(metrics[overlay_id]["image"])) {
                    if (Object.keys(metrics[overlay_id]["image"][image_name]).length > 0) {
                        count_chart_data[image_name]["plant"][i]["count"] = metrics[overlay_id]["image"][image_name][key_map[metric]].toFixed(2);
                    }
                    else {
                        count_chart_data[image_name]["plant"][i]["count"] = 0;
                    }
                }
            }
        }*/

        let max_100_metrics = [
            "AP (IoU=.50:.05:.95)", 
            "AP (IoU=.50)", 
            "AP (IoU=.75)"
        ];
        let max_1_metrics = [
            "Precision (IoU=.50, conf>.50)",
            "Recall (IoU=.50, conf>.50)",
            "Accuracy (IoU=.50, conf>.50)",
            "F1 Score (IoU=.50, conf>.50)"
        ];
        // let AP_metrics = ["AP (IoU=.50:.05:.95)", "AP (IoU=.50)", "AP (IoU=.75)"];
        // let f1_metrics = ["F1 Score (IoU=.50, conf>.50)", "F1 Score (IoU=.75, conf>.50)"];
        // let accuracy_metrics = ["Accuracy (IoU=.50, conf>.50)"];
        if (max_100_metrics.includes(metric)) {
            max_count = 100;
        }
        else if (max_1_metrics.includes(metric)) {
            max_count = 1;
        }
        else {
            max_count = 0;
            for (let nav_item of Object.keys(count_chart_data)) {
                if (count_chart_data[nav_item]["prediction"] > max_count) {
                    max_count = count_chart_data[nav_item]["prediction"];
                }
            }
        }
        // else if (accuracy_metrics.includes(metric)) {
        //     max_count = 1;
        // }


    }
}





function draw_count_chart() {

    let cur_nav_item = cur_img_name + "/" + cur_region_index;
    

    let chart_width = $("#count_chart").width(); // - 10;
    let chart_height = $('#count_chart').height(); // - 10;

    //let chart_width = 270;

    count_margin = 30;


    let num_bars = 2; //Object.keys(overlay_colors).length;

    $("#count_chart").empty();
    $("#count_chart").append(`<div id="count_chart_tooltip" class="tooltip" style="z-index: 10"></div>`);


    count_svg = d3.select("#count_chart")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);

    let chart = d3.select("#count_chart").select("svg").append("g");


    count_chart_axis = count_svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(" + count_margin + "," + (0.8 * count_margin) + ")");
    

    count_xScale = d3.scaleLinear()
                .domain([0, max_count])
                .range([2.5 * count_margin, chart_width - 1.8 * count_margin]);

    count_yScale = d3.scaleLinear()
                .domain([0, num_bars])
                .range([count_margin, chart_height]);



    count_chart_axis.call(d3.axisTop(count_xScale).ticks(chart_width / 100).tickFormat(d3.format("d")));


    let tooltip = d3.select("#count_chart_tooltip");

    let tip_mouseover = function(d) {
        let cur_nav_item = cur_img_name + "/" + cur_region_index;
        //let metric = $("#chart_combo").val();
        let disp_val = count_chart_data[cur_nav_item][d];
        if (!(Number.isInteger(disp_val))) { //metric !== "Count") {
            disp_val = disp_val.toFixed(2);
        }
        let html = numberWithCommas(disp_val);

        tooltip.html(html)
               .style("opacity", 1.0);
        d3.select(this).style("cursor", "default"); 
    }

    let tip_mousemove = function(d) {
        tooltip.style("left", (d3.event.pageX+20) + "px")
               .style("top", (d3.event.pageY) + "px");
        d3.select(this).style("cursor", "default"); 

    }

    let tip_mouseleave = function(d) {
        tooltip.style("opacity", 0);
    }

    //let sel_class = "plant"; //$("#class_combo").val();

    chart.selectAll("text")
         .data(["Annotated", "Predicted"]) //count_chart_data[cur_img_name])) //[sel_class])
         .enter()
         .append("text")
         .attr("class", "chart_text")
         .attr("x", function(d, i) {
            return count_margin * 3; //2.75;
         })
         .attr("y", function(d, i) {
            return count_margin + 30 * i + 12; //count_yScale(i) + ((chart_height / (1.65 * num_bars)) / 2);
         })
         .attr("alignment-baseline", "central")
         .attr("text-anchor", "end")
         .attr("font-size", "16px") //(chart_width / 50).toString() + "px")
         .text(function(d) { return d; })
         .style("cursor", "default");

    


    chart.selectAll(".bar")
         .data(Object.keys(count_chart_data[cur_nav_item]))
         .enter()
         .append("rect")
         .attr("class", "bar")
         .attr("id", function (d, i) { return "rect" + i; })
         .attr("x", function(d, i) {
            return 3.5 * count_margin;
         })
         .attr("y", function(d, i) {
            return count_margin + 30 * i; //count_yScale(i);
         })
         .attr("width", function(d) {
            return count_xScale(count_chart_data[cur_nav_item][d]) - 2.5 * count_margin;
         })
         .attr("height", function(d) {
            return 25; //chart_height / (1.65 * num_bars);
         })
         .attr("fill", function(d) {
            return overlay_appearance["colors"][d]; //d.color;
         })
         .on("mouseover", tip_mouseover)
         .on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave)
         .attr("stroke", "white")
         .attr("stroke-width", "0.75");
}


function update_count_chart() {

    let chart_width = $("#count_chart").width(); // - 10;

    //let sel_class = "plant"; //$("#class_combo").val();
    let cur_nav_item = cur_img_name + "/" + cur_region_index;

    count_xScale.domain([0, max_count]);
    count_chart_axis.transition().duration(250).call(d3.axisTop(count_xScale).ticks(chart_width / 100)); //.tickFormat(d3.format("d")));

    d3.selectAll(".bar")
        .data(Object.keys(count_chart_data[cur_nav_item])) //[sel_class])
        .transition()
        .duration(250)
        // .attr("x", function(d, i) {
        //     return 3 * count_margin;
        // })
        .attr("width", function(d) {
            return count_xScale(count_chart_data[cur_nav_item][d]) - 2.5 * count_margin;
        });
}
