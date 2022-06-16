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

    //for (image_name of Object.keys(overlays["annotations"])) {

    for (image_name of Object.keys(annotations)) {
        count_chart_data[image_name] = {};
        for (const [overlay_name, overlay] of Object.entries(overlays)) {
            count_chart_data[image_name][overlay_name] = 0;
        }
    }

    let metric = $("#chart_combo").val();
    //console.log("cur_metric", metric);
    if (metric === "Count" || metric === "Count per square metre") {
        for (image_name of Object.keys(annotations)) {
            for (const [overlay_name, overlay] of Object.entries(overlays)) {
                //console.log(overlay);
                for (annotation of overlay["overlays"][image_name]["annotations"]) {
                    let score_el = annotation["body"].find(b => b.purpose == 'score');
                    if (!score_el || score_el.value >= slider_val) {
                        count_chart_data[image_name][overlay_name]++;
                    }
                }
            }
        }

        max_count = 0;
        for (image_name of Object.keys(annotations)) {
            //for (class_name of Object.keys(job_config["arch"]["class_map"])) {
            for (overlay_name of Object.keys(count_chart_data[image_name])) {
                let v = count_chart_data[image_name][overlay_name];
                if (metric == "Count per square metre")
                    v = v / metadata["images"][image_name]["area_m2"];
                    v = Math.round((v + Number.EPSILON) * 100) / 100;
                    count_chart_data[image_name][overlay_name] = v;
                if (v > max_count) {
                    max_count = v;
                }
            }
        }
    }
    else if (metric === "Ground Cover Percentage") {

        for (image_name of Object.keys(annotations)) {
            count_chart_data[image_name]["annotations"] = excess_green_record[image_name]["ground_cover_percentage"];
            count_chart_data[image_name]["predictions"] = 0;
        }
        max_count = 100;
    }
    else {
        let key_map = {
            "MS COCO mAP": "Image MS COCO mAP",
            "PASCAL VOC mAP": "Image PASCAL VOC mAP"
        }
        for (image_name of Object.keys(annotations)) {
            count_chart_data[image_name]["annotations"] = 0;
            if (image_name in metrics) {
                count_chart_data[image_name]["predictions"] = metrics[image_name][key_map[metric]].toFixed(2);
            }
            else {
                count_chart_data[image_name]["predictions"] = 0;
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
        max_count = 100;
    }
    console.log("max_count", max_count);
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
        let html = count_chart_data[cur_img_name][d];
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

    //let sel_class = "plant"; //$("#class_combo").val();

    //console.log("count_chart_data", count_chart_data);
    //console.log("cur_img_name", cur_img_name);
    chart.selectAll("text")
         .data(Object.keys(count_chart_data[cur_img_name])) //[sel_class])
         .enter()
         .append("text")
         .attr("class", "chart_text")
         .attr("x", function(d, i) {
            return count_margin * 2.75;
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
         .data(Object.keys(count_chart_data[cur_img_name]))
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
            return count_xScale(count_chart_data[cur_img_name][d]) - 2 * count_margin;
         })
         .attr("height", function(d) {
            return 25; //chart_height / (1.65 * num_bars);
         })
         .attr("fill", function(d) {
            return overlays[d]["color"]; //d.color;
         })
         .on("mouseover", tip_mouseover)
         .on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave)
         .attr("stroke", "white")
         .attr("stroke-width", "0.75");
}


function update_count_chart() {

    let chart_width = $("#count_chart").width() - 10;

    //let sel_class = "plant"; //$("#class_combo").val();

    count_xScale.domain([0, max_count]);
    count_chart_axis.transition().duration(250).call(d3.axisTop(count_xScale).ticks(chart_width / 100)); //.tickFormat(d3.format("d")));

    d3.selectAll(".bar")
        .data(Object.keys(count_chart_data[cur_img_name])) //[sel_class])
        .transition()
        .duration(250)
        .attr("x", function(d, i) {
            return 3 * count_margin;
        })
        .attr("width", function(d) {
            return count_xScale(count_chart_data[cur_img_name][d]) - 2 * count_margin;
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