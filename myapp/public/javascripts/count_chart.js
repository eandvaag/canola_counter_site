let count_chart_data;
let count_svg;
let count_xScale;
let count_yScale;
let count_chart_axis;
let count_margin;
let max_count;




function set_count_chart_data() {


    count_chart_data = {};
    
    /*
    let annotated_count;
    let pred_count;*/


    for (image_name of Object.keys(overlays["annotations"])) {
        count_chart_data[image_name] = {};
        for (class_name of Object.keys(group_config["arch_config"]["class_map"])) {
            count_chart_data[image_name][class_name] = [];
            for (let i = 0; i < sorted_overlay_ids.length; i++) {

                count_chart_data[image_name][class_name].push({
                    name: sorted_overlay_names[i],
                    count: 0,
                    color: overlay_colors[sorted_overlay_names[i]]
                });
            }
        }
    }


    for (let i = 0; i < sorted_overlay_ids.length; i++) {
        let overlay_id = sorted_overlay_ids[i];
        for (image_name of Object.keys(overlays[overlay_id])) {
            for (annotation of overlays[overlay_id][image_name]["annotations"]) {
                let class_name = annotation["body"][0]["value"];
                count_chart_data[image_name][class_name][i]["count"]++;
            }
        }
    }
    /*

    //for (overlay_name of Object.keys(overlays)) {
    for (let i = 0; i < sorted_overlay_ids.length; i++) {
        count_chart_data[overlay_name] = {};

        for (image_name of Object.keys(overlays[overlay_name])) {
            count_chart_data[overlay_name][image_name] = {};
            for (annotation of overlays[overlay_name][image_name]) {
                let class_name = annotation["body"][0]["value"];
                if (!(class_name in count_chart_data[overlay_name][image_name])) {
                    //count_chart_data[overlay_name][image_name][class_name] = 1;


                    count_chart_data.push({
                        name: sorted_overlay_names[i],
                        count: 0,
                        color: color_lookup[sorted_overlay_names[i]]
                    });

                }
                else {
                    //count_chart_data[overlay_name][image_name][class_name]++;
                    count_chart_data.push({
                        name: sorted_overlay_names[i],
                        count: 0,
                        color: color_lookup[sorted_overlay_names[i]]
                    });

                }
            }
        }
    }




        //predictions[Object.keys(predictions)[0]]["image_predictions"])) {

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
*/
            /*
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
    }*/

    max_count = 0;
    for (image_name of Object.keys(count_chart_data)) {
        for (class_name of Object.keys(group_config["arch_config"]["class_map"])) {
            for (entry of count_chart_data[image_name][class_name]) {
                if (entry.count > max_count) {
                    max_count = entry.count
                }
            }
        }
    }
}





function draw_count_chart() {
    

    let chart_width = $("#count_chart").width() - 10;
    let chart_height = $('#count_chart').height() - 10;


    count_margin = 30;

    let num_bars = Object.keys(overlays).length;


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
                .range([2 * count_margin, chart_width - 1.5 * count_margin]);

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

    let sel_class = "plant"; //$("#class_combo").val();

    console.log("count_chart_data", count_chart_data);
    console.log("cur_img_name", cur_img_name);
    chart.selectAll("text")
         .data(count_chart_data[cur_img_name][sel_class])
         .enter()
         .append("text")
         .attr("class", "chart_text")
         .attr("x", function(d, i) {
            return count_margin * 2.9;
         })
         .attr("y", function(d, i) {
            return count_margin + 30 * i + 15; //count_yScale(i) + ((chart_height / (1.65 * num_bars)) / 2);
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
            return count_margin + 30 * i; //count_yScale(i);
         })
         .attr("width", function(d) {
            return count_xScale(d.count) - 2 * count_margin;
         })
         .attr("height", function(d) {
            return 25; //chart_height / (1.65 * num_bars);
         })
         .attr("fill", function(d) {
            return d.color;
         })
         .on("mouseover", tip_mouseover)
         .on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave)
         .attr("stroke", "white")
         .attr("stroke-width", "0.75");
}


function update_count_chart() {

    let sel_class = "plant"; //$("#class_combo").val();

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

function zero_count_chart() {

    let sel_class = "plant"; //$("#class_combo").val();

    let data = [];
    for (overlay of Object.keys(overlays)) {
        data.push(0);
    }

    d3.selectAll(".bar")
        .data(data)
        .transition()
        .duration(1000)
        .attr("x", function(d, i) {
            return 3 * count_margin;
        })
        .attr("width", function(d) {
            return count_xScale(d) - 2 * count_margin;
        });

}