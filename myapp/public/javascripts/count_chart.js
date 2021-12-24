let count_chart_data;
let count_svg;
let count_xScale;
let count_yScale;
let count_chart_axis;
let count_margin;
let max_count;





function set_count_chart_data() {


    count_chart_data = {};
    
    let annotated_count;
    let pred_count;
    for (image_name of Object.keys(predictions[Object.keys(predictions)[0]]["image_predictions"])) {

        count_chart_data[image_name] = {};
        
        for (class_name of Object.keys(metadata["class_map"])) {


            count_chart_data[image_name][class_name] = [];

            if (metadata["dataset_is_annotated"]) {
                if (class_name in annotations[image_name]["class_counts"]) {
                    annotated_count = annotations[image_name]["class_counts"][class_name];
                }
                else {
                    annotated_count = 0;
                }
                count_chart_data[image_name][class_name].push({
                    name: "Annotations",
                    count: annotated_count,
                    color: color_lookup["Annotations"]
                });
            }


            for (let i = 0; i < sorted_model_uuids.length; i++) {

                if (class_name in predictions[sorted_model_uuids[i]]["image_predictions"][image_name]["pred_class_counts"]) {
                    pred_count = predictions[sorted_model_uuids[i]]["image_predictions"][image_name]["pred_class_counts"][class_name];
                }
                else {
                    pred_count = 0;
                }

                count_chart_data[image_name][class_name].push({
                    name: sorted_model_names[i],
                    count: pred_count,
                    color: color_lookup[sorted_model_uuids[i]]
                });
            }

            for (let i = 0; i < ensemble_uuids.length; i++) {

                if (class_name in ensemble_predictions[ensemble_uuids[i]]["image_predictions"][image_name]["pred_class_counts"]) {
                    pred_count = ensemble_predictions[ensemble_uuids[i]]["image_predictions"][image_name]["pred_class_counts"][class_name];
                }
                else {
                    pred_count = 0;
                }

                count_chart_data[image_name][class_name].push({
                    name: ensemble_names[i],
                    count: pred_count,
                    color: color_lookup[ensemble_uuids[i]]
                });

            }
        }
    }

    max_count = 0;
    for (img_name of Object.keys(count_chart_data)) {
        for (class_name of Object.keys(metadata["class_map"])) {
            for (entry of count_chart_data[img_name][class_name]) {
                if (entry.count > max_count) {
                    max_count = entry.count
                }
            }
        }
    }
}


function draw_count_chart() {

    let div = $('#count_chart');

    let div_width = $("#left_container").width();
    let div_height = $('#count_chart').height();

    if (count_svg) {
        count_svg.remove();
    }

    let rect = $('#count_chart').get(0).getBoundingClientRect();
    let chart_x = rect["x"];
    let chart_y = rect["y"];

    count_margin = 58;

    let num_bars;
    if (metadata["dataset_is_annotated"]) {
        num_bars = sorted_model_uuids.length + ensemble_uuids.length + 1;
    }
    else {
        num_bars = sorted_model_uuids.length + ensemble_uuids.length;
    }

    let chart_width = div_width;
    let min_bar_size_lmt = 30;
    let chart_height = Math.max(div_height, min_bar_size_lmt * num_bars) - 10;


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
                .range([2 * count_margin, chart_width - 2 * count_margin]);

    count_yScale = d3.scaleLinear()
                .domain([0, num_bars])
                .range([count_margin, chart_height]);



    count_chart_axis.call(d3.axisTop(count_xScale).ticks(chart_width / 100));


    let tooltip = d3.select("#count_chart_tooltip");

    let tip_mouseover = function(d) {
        let html = d.count;
        tooltip.html(html)
               .style("opacity", 1.0);
    }

    let tip_mousemove = function(d) {
        tooltip.style("left", (d3.event.pageX+20) + "px")
               .style("top", (d3.event.pageY) + "px");
    }

    let tip_mouseleave = function(d) {
        tooltip.style("opacity", 0);
    }

    let sel_class = $("#class_combo").val();

    chart.selectAll("text")
         .data(count_chart_data[cur_img_name][sel_class])
         .enter()
         .append("text")
         .attr("class", "chart_text")
         .attr("x", function(d, i) {
            return count_margin * 2.9;
         })
         .attr("y", function(d, i) {
            return count_yScale(i) + ((chart_height / (1.65 * num_bars)) / 2);
         })
         .attr("alignment-baseline", "central")
         .attr("text-anchor", "end")
         .attr("font-size", "16px") //(chart_width / 50).toString() + "px")
         .text(function(d) { return d.name; })
         .style("cursor", "default");


    chart.selectAll(".bar")
         .data(count_chart_data[cur_img_name][sel_class])
         .enter()
         .append("rect")
         .attr("class", "bar")
         .attr("id", function (d, i) { return "rect" + i; })
         .attr("x", function(d, i) {
            return 3 * count_margin;
         })
         .attr("y", function(d, i) {
            return count_yScale(i);
         })
         .attr("width", function(d) {
            return count_xScale(d.count) - 2 * count_margin;
         })
         .attr("height", function(d) {
            return chart_height / (1.65 * num_bars);
         })
         .attr("fill", function(d) {
            return d.color;
         })
         .on("mouseover", tip_mouseover)
         .on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave)
         .attr("stroke", "white")
         .attr("stroke-width", "1");
}




function update_count_chart() {

    let sel_class = $("#class_combo").val();
    // console.log("count_chart_data", count_chart_data);
    // console.log("cur_img_name", cur_img_name);
    // console.log("sel_class", sel_class);

    d3.selectAll(".bar")
        .data(count_chart_data[cur_img_name][sel_class])
        .transition()
        .duration(1000)
        .attr("x", function(d, i) {
            return 3 * count_margin;
        })
        .attr("width", function(d) {
            return count_xScale(d.count) - 2 * count_margin;
        });
}