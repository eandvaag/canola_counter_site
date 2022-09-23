let timeline_data;
let cur_timeline_data;

let chart_height;
let chart_width;
let chart_x_axis;
let chart_y_axis;
let xScale;
let yScale;
let chart;

let chart_line = d3.line()
    .x(function(d) { return xScale(d[0]); })
    .y(function(d) { return yScale(d[1]); });



function set_timeline_data() {


    timeline_data = {}
    timeline_data["pred_count"] = [];
    timeline_data["pred_count_minus_annotated_count"] = [];
    timeline_data["percent_count_error"] = []
    timeline_data["score_quality"] = [];

    let sensor_height, sensor_width, focal_length, camera_height;
    let include_density = can_calculate_density(metadata, camera_specs);

    if (include_density) {
        let make = metadata["camera_info"]["make"];
        let model = metadata["camera_info"]["model"];

        let camera_entry = camera_specs[make][model];
        sensor_height = camera_entry["sensor_height"];
        sensor_width = camera_entry["sensor_width"];
        focal_length = camera_entry["focal_length"];
        camera_height = metadata["camera_height"];

        timeline_data["pred_density"] = [];
        timeline_data["pred_density_minus_annotated_density"] = [];
    }

    score_thresholds = [];
    for (let i = 0; i <= 100; i++) {
        score_thresholds.push(i / 100);
    }


    for (let image_name of Object.keys(annotations)) {

        let completed = ((annotations[image_name]["status"] === "completed_for_training") || (annotations[image_name]["status"] === "completed_for_testing"));
        let predicted_counts = [];
        let count_differences = [];
        let percent_count_errors = [];
        let score_qualities = [];
        let predicted_densities = [];
        let density_differences = [];
        let i = 0;
        for (let timestamp of sorted_timestamps) {

            let predicted_count = 0;
            for (let annotation of predictions[timestamp][image_name]["annotations"]) {
                let score_el = annotation["body"].find(b => b.purpose == 'score');
                if (!score_el || score_el.value >= 0.50) {
                    predicted_count++;
                }
            }



            predictions[timestamp][image_name]["annotations"].length;
            predicted_counts.push([i, predicted_count]);

            let gsd_h, gsd_w, gsd, image_height_m, image_width_m, area_m2, predicted_density;
            if (include_density) {
                gsd_h = (camera_height * sensor_height) / (focal_length * metadata["images"][image_name]["height_px"]);
                gsd_w = (camera_height * sensor_width) / (focal_length * metadata["images"][image_name]["width_px"]);     
                
                gsd = Math.min(gsd_h, gsd_w);

                image_height_m = metadata["images"][image_name]["height_px"] * gsd;
                image_width_m = metadata["images"][image_name]["width_px"] * gsd;

                area_m2 = image_width_m * image_height_m;

                predicted_density = predicted_count / area_m2;
                predicted_density = Math.round((predicted_density + Number.EPSILON) * 100) / 100;
                predicted_densities.push([i, predicted_density]);
            }

            let scores = [];
            for (let prediction of predictions[timestamp][image_name]["annotations"]) {
                let bodies = Array.isArray(prediction.body) ?
                                prediction.body : [ prediction.body ];
                let scoreTag = bodies.find(b => b.purpose == 'score');
                scores.push(parseFloat(scoreTag.value));
            }
            let histogram = d3.histogram()
                                .value(function(d) { return d; })
                                .domain([0, 1])
                                .thresholds(score_thresholds);
    
            let bins = histogram(scores);
            bins[bins.length-1].x1 = 1.01;

            let r = evaluate_scores(bins, scores);
            score_qualities.push([i, Math.round((r[0] + Number.EPSILON) * 100)]);


            

            if (completed) {
                let annotated_count = annotations[image_name]["annotations"].length;
                count_differences.push([i, predicted_count - annotated_count]);

                
                if (annotated_count != 0) {
                    let percent_count_error = Math.abs((predicted_count - annotated_count) / (annotated_count)) * 100;
                    percent_count_errors.push([i, percent_count_error]);
                }

                let annotated_density = annotated_count / area_m2;
                annotated_density = Math.round((annotated_density + Number.EPSILON) * 100) / 100;
                density_differences.push([i, predicted_density - annotated_density]);
            }
            i++;        
        }
        timeline_data["pred_count"].push({
            "image_name": image_name,
            "values": predicted_counts,
        });
        if (include_density) {
            timeline_data["pred_density"].push({
                "image_name": image_name,
                "values": predicted_densities,
            });
        }
        timeline_data["score_quality"].push({
            "image_name": image_name,
            "values": score_qualities
        });
        if (completed) {
            timeline_data["pred_count_minus_annotated_count"].push({
                "image_name": image_name,
                "values": count_differences
            });
            timeline_data["percent_count_error"].push({
                "image_name": image_name,
                "values": percent_count_errors
            });
            if (include_density) {
                timeline_data["pred_density_minus_annotated_density"].push({
                    "image_name": image_name,
                    "values": density_differences
                });
            }

        }
    }
}


function get_range(line_data) {

    let cur_metric = $("#metric_combo").val();

    if (line_data.length == 0) {
        return [0, 0];
    }

    if (cur_metric === "score_quality") {
        return [0, 100];
    }

    if (cur_metric === "MS_COCO_mAP") {
        return [0, 100];
    }

    let min_val = line_data[0]["values"][0][1];
    let max_val = line_data[0]["values"][0][1];
    for (let d of line_data) {
        for (let v of d["values"]) {
            if (v[1] < min_val) {
                min_val = v[1];
            }
            if (v[1] > max_val) {
                max_val = v[1];
            }
        }
    }
    if (((cur_metric === "pred_count") || (cur_metric === "pred_density")) || (cur_metric === "percent_count_error")) {
        min_val = 0;
    }
    if ((cur_metric === "pred_count_minus_annotated_count") || (cur_metric === "pred_density_minus_annotated_density")) {
        let extreme = Math.max(Math.abs(min_val), Math.abs(max_val));
        min_val = (-1 * extreme) - 1;
        max_val = (extreme) + 1;
    }

    return [min_val, max_val];
}


function set_cur_timeline_data() {

    cur_timeline_data = {};

    let cur_status = $("#status_combo").val();

    for (let metric of Object.keys(timeline_data)) {
        cur_timeline_data[metric] = [];
        for (let d of timeline_data[metric]) {
            if ((cur_status === "all") || (annotations[d["image_name"]]["status"] === cur_status)) {
                cur_timeline_data[metric].push(d);
            }
        }
    }
}

function draw_timeline_chart() {


    set_cur_timeline_data();


    $("#loader").hide();
    $("#error").hide();
    $("#timeline_chart").hide();

    $("#timeline_chart").empty();
    

    let cur_metric = $("#metric_combo").val();

    let line_data;
    if ((cur_metric === "MS_COCO_mAP") && ((mAP_calculation_state === "started") || (mAP_calculation_state === "error"))) {
        line_data = cur_timeline_data["pred_count"]; // draw the lines even though they are not the right values
        if (mAP_calculation_state === "started") {
            $("#error").hide();
            $("#timeline_chart").hide();
            $("#loader").show();
        }
        else if (mAP_calculation_state === "error") {
            $("#loader").hide();
            $("#timeline_chart").hide();
            $("#error_message").html("An error occurred while calculating the MS COCO mAP values.");
            $("#error").show();
        }
    }
    else {
        line_data = cur_timeline_data[cur_metric];
        $("#loader").hide();
        $("#error").hide();
        $("#timeline_chart").show();    
    }



    $("#timeline_chart").append(`<div id="timeline_chart_tooltip" class="tooltip" style="z-index: 10"></div>`);

    chart_width = $("#timeline_chart").width();
    chart_height = $("#timeline_chart").height();

    let svg = d3.select("#timeline_chart")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);

    let margin = 58;

    chart = d3.select("#timeline_chart").select("svg").append("g");

    chart_x_axis = svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (chart_height - margin) + ")");
    
    chart_y_axis = svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + (1.5 * margin) + ", 0)");


    let range = get_range(line_data);

    xScale = d3.scaleLinear()
                .domain([0, Object.keys(predictions).length - 1])
                .range([margin * 2, chart_width - margin]);

    yScale = d3.scaleLinear()
                .domain(range)
                .range([chart_height - margin, margin]);

    let result_indices = [];
    for (let i = 0; i < sorted_timestamps.length; i++) {
        result_indices.push(i);
    }
    chart_x_axis.call(d3.axisBottom(xScale).tickValues(result_indices)
                                           .tickFormat((d, i) => (i+1).toString()));
    
    
    
    //.ticks(chart_width / 100));
    chart_y_axis.call(d3.axisLeft(yScale).ticks(5)); //chart_height / 100));


    let tooltip = d3.select("#timeline_chart_tooltip");

    let tip_mouseover = function(d) {
        let label = d.image_name;
        tooltip.html("Image: " + label)
               .style("opacity", 1.0);

        let l = d3.select("#line_" + d.image_name);
        l.style("opacity", 1.0);
        l.attr("stroke-width", 4);
    }

    let tip_mousemove = function(d) {
        tooltip.style("left", (d3.event.pageX+20) + "px")
               .style("top", (d3.event.pageY) + "px");
    }

    let tip_mouseleave = function(d) {
        tooltip.style("opacity", 0);
        let l = d3.select("#line_" + d.image_name);
        l.style("opacity", 0.9);
        l.attr("stroke-width", 2);
    }


    chart.selectAll("path")
        .data(line_data)
        .enter()
        .append("path")
        .attr("id", function(d) {
            return "line_" + d.image_name;
         })
        .attr("d", function(d) { 
            return chart_line(d["values"]);
        })
        .attr("stroke", function(d) {
            let status = annotations[d["image_name"]]["status"];
            if (status === "unannotated") {
                return "white";
            }
            else {
                return status_color[status];
            }
        })
        .attr("stroke-linecap", "round")
        //.attr("stroke-dasharray", (8,8))
        .attr("fill", "none") //;function(d) {
        //     return "red"; //status_color[annotations[d["image_name"]]["status"]];
        // }) //"none")
        .attr("stroke-width", 2)
        .style("opacity", 0.9)
        .on("mouseover", tip_mouseover)
        .on("mousemove", tip_mousemove)
        .on("mouseleave", tip_mouseleave);



    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", ((chart_width / 2)))
        .attr("y", chart_height - 15)
        .text("Result Index");

    svg.append("text")
        .attr("id", "y_axis_text")
        .attr("text-anchor", "middle")
        .attr("x", - (chart_height / 2) - 20)
        .attr("y", (margin / 2) - 10)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .html(metric_text_lookup[cur_metric]);


    if ((cur_metric === "pred_count_minus_annotated_count") || (cur_metric === "pred_density_minus_annotated_density")) {
        chart.append("path")
        .attr("id", "zero_line")
        .attr("d", function(d) { 
            return chart_line([[0, 0], [sorted_timestamps.length-1, 0]]);
        })
        .attr("stroke-linecap", "round")
        .attr("stroke", "white")
        .attr("stroke-dasharray", (5,5))
        .attr("fill", "none") //;function(d) {
        //     return "red"; //status_color[annotations[d["image_name"]]["status"]];
        // }) //"none")
        .attr("stroke-width", 2)
        .style("opacity", 0.9)
    }

}


function update_timeline_chart() {

    let cur_metric = $("#metric_combo").val();

    set_cur_timeline_data();

    if (cur_metric === "MS_COCO_mAP") {
        if (mAP_calculation_state === "started") {
            $("#error").hide();
            $("#timeline_chart").hide();
            $("#loader").show();
            return;
        }
        else if (mAP_calculation_state === "error") {
            $("#loader").hide();
            $("#timeline_chart").hide();
            $("#error_message").html("An error occurred while calculating the MS COCO mAP values.");
            $("#error").show();
            return;
        }
    }
    $("#loader").hide();
    $("#error").hide();
    $("#timeline_chart").show();

    d3.select("#zero_line").remove();
    d3.select("#y_axis_text").html(metric_text_lookup[cur_metric]);

    let range = get_range(cur_timeline_data[cur_metric]);
    yScale.domain(range);
    chart_y_axis.transition().duration(250).call(d3.axisLeft(yScale).ticks(5));


    d3.selectAll("path")
         .data(cur_timeline_data[cur_metric])
         .transition()
         .duration(250)
         .attr("d", function(d) { 
            return chart_line(d["values"]);
        });




    if ((cur_metric === "pred_count_minus_annotated_count") || (cur_metric === "pred_density_minus_annotated_density")) {
        chart.append("path")
            .attr("id", "zero_line")
            .attr("d", function(d) { 
                return chart_line([[0, 0], [sorted_timestamps.length-1, 0]]);
            })
            .attr("stroke-linecap", "round")
            .attr("stroke", "white")
            .attr("stroke-dasharray", (5,5))
            .attr("fill", "none") //;function(d) {
            //     return "red"; //status_color[annotations[d["image_name"]]["status"]];
            // }) //"none")
            .attr("stroke-width", 2)
            .style("opacity", 0.9)
    }
}