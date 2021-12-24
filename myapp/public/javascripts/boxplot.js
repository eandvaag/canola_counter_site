let boxplot_data;
let boxplot_svg;


const boxplot_range_lookup = {
    "Confidence": [0.0, null],
    "Box Area": [0.0, null],
    "Difference in Count (Image)": [null, null],
    "Absolute Difference in Count (Image)": [0.0, null],
    "Percent Difference in Count (Image)": [0.0, null]
};


function set_boxplot_data() {
    boxplot_data = [];

    for (let i = 0; i < sorted_model_uuids.length; i++) {
        boxplot_data.push({
            "name": sorted_model_names[i],
            "metrics": predictions[sorted_model_uuids[i]]["metrics"]["boxplot"],
            "color": color_lookup[sorted_model_uuids[i]]
        });
    }

    for (let i = 0; i < ensemble_uuids.length; i++) {
        boxplot_data.push({
            "name": ensemble_names[i],
            "metrics": ensemble_predictions[ensemble_uuids[i]]["metrics"]["boxplot"],
            "color": color_lookup[ensemble_uuids[i]]
        });
    }
}





function add_boxplot_class_options() {

    $("#boxplot_class_combo").empty();

    let metric = $("#boxplot_metric_combo").val();
    console.log("metric", metric);

    let options = Object.keys(boxplot_data[0]["metrics"][metric]);

    for (option of options) {
        $("#boxplot_class_combo").append($('<option>', {
            value: option,
            text: option
        }));
    }

    $("boxplot_class_combo").val(options[0]);
}

function add_boxplot_metric_options() {
/*
    let sorting_options = Object.keys(range_lookup);
    let valid_options = [];

    for (sorting_option of sorting_options) {
        valid = true;
        for (let i = 0; i < boxplot_data.length; i++)
            if (!(sorting_option in predictions[model_uuid]["metrics"]["boxplot"])) {
                valid = false;
            }
        }
        if (valid) {
            valid_options.push(sorting_option);
        }
    }*/
    let options = Object.keys(boxplot_data[0]["metrics"]);

    for (option of options) {
        $("#boxplot_metric_combo").append($('<option>', {
            value: option,
            text: option
        }));
    }

    $("#boxplot_metric_combo").val(options[0]);
}

function draw_boxplot() {

    let sel_metric = $("#boxplot_metric_combo").val();
    let sel_class = $("#boxplot_class_combo").val();

    let div = $('#boxplot');

    let div_width = $("#left_container").width();
    //let max_div_height = "295px";
    //let min_div_height = 
    let div_height = $('#boxplot').height();

    if (boxplot_svg) {
        boxplot_svg.remove();
    }

    let rect = $('#boxplot').get(0).getBoundingClientRect();
    let chart_x = rect["x"];
    let chart_y = rect["y"];

    margin = 58;

    /*
    if (metadata["dataset_is_annotated"]) {
        num_bars = sorted_model_uuids.length + ensemble_uuids.length + 1;
    }
    */
    //else {
    let num_boxes = sorted_model_uuids.length + ensemble_uuids.length;
    //}
    let range = boxplot_range_lookup[sel_metric]
    let range_min = range[0];
    let range_max = range[1];
    for (let i = 0; i < boxplot_data.length; i++) {
        model_min = boxplot_data[i]["metrics"][sel_metric][sel_class]["range_min"];
        model_max = boxplot_data[i]["metrics"][sel_metric][sel_class]["range_max"];

        if (range_min === null || model_min < range_min) {
            range_min = model_min;
        }
        if (range_max === null || model_max > range_max) {
            range_max = model_max;
        }
    }

    if (range_min === null) range_min = 0;
    if (range_max === null) range_max = 0;

    let chart_width = div_width;
    let min_box_size_lmt = 30;
    let chart_height = Math.max(div_height, min_box_size_lmt * num_boxes) - 10;


    boxplot_svg = d3.select("#boxplot")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);

    let chart = d3.select("#boxplot").select("svg").append("g");

    
    boxplot_axis = boxplot_svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(" + margin + "," + (0.8 * margin) + ")");
    

    boxplot_xScale = d3.scaleLinear()
                .domain([range_min, range_max])
                .range([2 * margin, chart_width - 2 * margin]);

    boxplot_yScale = d3.scaleLinear()
                .domain([0, num_boxes])
                .range([margin, chart_height]);


    boxplot_axis.call(d3.axisTop(boxplot_xScale).ticks(chart_width / 100));

    let width_divider;
    if (num_boxes < 5) {
        width_divider = 2.75;
    }
    else {
        width_divider = 1.65;
    }

    chart.selectAll("text")
         .data(boxplot_data)
         .enter()
         .append("text")
         .attr("class", "chart_text")
         .attr("x", function(d, i) {
            return margin * 2.9;
         })
         .attr("y", function(d, i) {
            return boxplot_yScale(i) + ((chart_height / (width_divider * num_boxes)) / 2);
         })
         .attr("alignment-baseline", "central")
         .attr("text-anchor", "end")
         .attr("font-size", "16px") //(chart_width / 50).toString() + "px")
         .text(function(d) { return d.name; })
         .style("cursor", "default");

    console.log("boxplot_data", boxplot_data);


    chart.selectAll("horizontal_lines")
         .data(boxplot_data)
         .enter()
         .append("line")
         .attr("x1", function(d) {
            //return (3 * margin) + boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]);
            return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]) + margin;
         })
         .attr("x2", function(d) {
            //return (3 * margin) + boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]);// - 2 * margin;
            return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]) + margin;
         })
         .attr("y1", function(d, i) {
            return boxplot_yScale(i) + ((chart_height / (width_divider * num_boxes)) / 2);
         })
         .attr("y2", function(d, i) {
            return boxplot_yScale(i) + ((chart_height / (width_divider * num_boxes)) / 2);
         })
         .attr("stroke", "white")
         .attr("stroke-width", "1");



    chart.selectAll(".bar")
         .data(boxplot_data)
         .enter()
         .append("rect")
         .attr("class", "bar")
         .attr("x", function(d, i) {
            //return 3 * count_margin;
            return boxplot_xScale(d["metrics"][sel_metric][sel_class]["q1"]) + margin;
            //return boxplot_xScale(d["metrics"][sel_metric][sel_class]["q1"]) - 2 * margin;
            //return boxplot_xScale(d["metrics"][sel_metric][sel_class]["q1"]);
         })
         .attr("y", function(d, i) {
            return boxplot_yScale(i);
         })
         .attr("width", function(d) {
            return (boxplot_xScale(d["metrics"][sel_metric][sel_class]["q3"]) - 
                    boxplot_xScale(d["metrics"][sel_metric][sel_class]["q1"]));// - (2 * margin);
         })
         .attr("height", function(d) {
            return chart_height / (width_divider * num_boxes);
         })
         .attr("fill", function(d) {
            return d.color;
         })
         //.on("mouseover", tip_mouseover)
         //.on("mousemove", tip_mousemove)
         //.on("mouseleave", tip_mouseleave)
         .attr("stroke", "white")
         .attr("stroke-width", "1");


    chart.selectAll("vertical_lines")
         .data(boxplot_data)
         .enter()
         .append("line")
         .attr("x1", function(d) {
            //return (3 * margin) + boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]);
            //return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]) + margin;
            return boxplot_xScale(d["metrics"][sel_metric][sel_class]["q2"]) + margin;
         })
         .attr("x2", function(d) {
            //return (3 * margin) + boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]);// - 2 * margin;
            //return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]) + margin;
            return boxplot_xScale(d["metrics"][sel_metric][sel_class]["q2"]) + margin;
         })
         .attr("y1", function(d, i) {
            return boxplot_yScale(i);
         })
         .attr("y2", function(d, i) {
            return boxplot_yScale(i) + ((chart_height / (width_divider * num_boxes)));
         })
         .attr("stroke", "white")
         .attr("stroke-width", "1");


    let spacing = ((chart_height / (width_divider * num_boxes))) / 4;
    chart.selectAll("vertical_lines")
         .data(boxplot_data)
         .enter()
         .append("line")
         .attr("x1", function(d) {
            //return (3 * margin) + boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]);
            //return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]) + margin;
            return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]) + margin;
         })
         .attr("x2", function(d) {
            //return (3 * margin) + boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]);// - 2 * margin;
            //return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]) + margin;
            return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]) + margin;
         })
         .attr("y1", function(d, i) {
            return boxplot_yScale(i) + spacing;
         })
         .attr("y2", function(d, i) {
            return boxplot_yScale(i) + ((chart_height / (width_divider * num_boxes))) - spacing;
         })
         .attr("stroke", "white")
         .attr("stroke-width", "1");

    chart.selectAll("vertical_lines")
         .data(boxplot_data)
         .enter()
         .append("line")
         .attr("x1", function(d) {
            //return (3 * margin) + boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]);
            //return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_min"]) + margin;
            return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]) + margin;
         })
         .attr("x2", function(d) {
            //return (3 * margin) + boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]);// - 2 * margin;
            //return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]) + margin;
            return boxplot_xScale(d["metrics"][sel_metric][sel_class]["range_max"]) + margin;
         })
         .attr("y1", function(d, i) {
            return boxplot_yScale(i) + spacing;
         })
         .attr("y2", function(d, i) {
            return boxplot_yScale(i) + ((chart_height / (width_divider * num_boxes))) - spacing;
         })
         .attr("stroke", "white")
         .attr("stroke-width", "1");

}