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
    let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);

    for (image_name of Object.keys(overlays["annotations"])) {
        count_chart_data[image_name] = {};
        for (class_name of Object.keys(job_config["arch"]["class_map"])) {
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

    let metric = $("#chart_combo").val();
    if (metric === "Count" || metric === "Count per square metre") {
        for (let i = 0; i < sorted_overlay_ids.length; i++) {
            let overlay_id = sorted_overlay_ids[i];
            for (image_name of Object.keys(overlays[overlay_id])) {
                for (annotation of overlays[overlay_id][image_name]["annotations"]) {
                    //let class_name = annotation["body"][0]["value"];
                    let class_name = annotation["body"].find(b => b.purpose == "class").value;
                    let score_el = annotation["body"].find(b => b.purpose == 'score');

                    if (!score_el || score_el.value >= slider_val) {
                        count_chart_data[image_name][class_name][i]["count"]++;
                    }

                }
            }
        }
        max_count = 0;
        for (image_name of Object.keys(count_chart_data)) {
            for (class_name of Object.keys(job_config["arch"]["class_map"])) {
                for (entry of count_chart_data[image_name][class_name]) {
                    if (metric == "Count per square metre")
                        entry.count = entry.count / metadata["images"][image_name]["area_m2"];
                        entry.count = Math.round((entry.count + Number.EPSILON) * 100) / 100
                    if (entry.count > max_count) {
                        max_count = entry.count
                    }
                }
            }
        }
    }
    else {
        let key_map = {
            "MS COCO mAP": "Image MS COCO mAP",
            "PASCAL VOC mAP": "Image PASCAL VOC mAP"
        }
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
        }
        max_count = 100;
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



    count_chart_axis.call(d3.axisTop(count_xScale).ticks(chart_width / 100).tickFormat(d3.format("d")));


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

    let chart_width = $("#count_chart").width() - 10;

    let sel_class = "plant"; //$("#class_combo").val();

    count_xScale.domain([0, max_count]);
    count_chart_axis.transition().duration(1000).call(d3.axisTop(count_xScale).ticks(chart_width / 100).tickFormat(d3.format("d")));

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