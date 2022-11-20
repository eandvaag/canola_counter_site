
//let score_thresholds = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];
let score_chart_data; // = {};
// let scores_max_y_bin;
let score_xScale, score_yScale;
let score_chart_x_axis, score_chart_y_axis;
let score_thresholds;
let score_histogram;

function set_score_chart_data() {

    score_thresholds = [];
    for (let i = 0; i <= 100; i++) {
        score_thresholds.push(i / 100);
    }

    score_histogram = d3.histogram()
                        .value(function(d) { return d; })
                        .domain([0, 1])
                        .thresholds(score_thresholds);
    /*
    let scores = [];
    for (let i = 0; i < predictions[cur_img_name]["scores"].length; i++) {
        scores.push(parseFloat(predictions[cur_img_name]["scores"][i]));
    }*/
    

    score_chart_data = {};



    // for (let image_name of Object.keys(annotations)) {
        
        // let scores = [];
        // if (image_name in predictions) {
        //     for (let i = 0; i < predictions[image_name]["scores"].length; i++) {
        //         scores.push()
        //     }
        //     for (let prediction of predictions[image_name]["annotations"]) {
        //         let bodies = Array.isArray(prediction.body) ?
        //                         prediction.body : [ prediction.body ];
        //         let scoreTag = bodies.find(b => b.purpose == 'score');
        //         scores.push(parseFloat(scoreTag.value));
        //     }
        // }
        score_chart_data[cur_img_name] = {};
        if (cur_img_name in predictions) {
            let navigation_type = $('#navigation_dropdown').val();
            if (navigation_type === "images") {
                score_chart_data[cur_img_name]["scores"] = predictions[cur_img_name]["scores"];
            }
            else {
                score_chart_data[cur_img_name]["scores"] = [];
                let region = annotations[cur_img_name][navigation_type][cur_region_index];
                for (let i = 0; i < predictions[cur_img_name]["boxes"].length; i++) {
                    if (box_intersects_region(predictions[cur_img_name]["boxes"][i], region)) {
                        score_chart_data[cur_img_name]["scores"].push(predictions[cur_img_name]["scores"][i]);
                    }
                }
            }
        }
        else {
            score_chart_data[cur_img_name]["scores"] = [];
        }

        // if (image_name in predictions) {

        let bins = score_histogram(score_chart_data[cur_img_name]["scores"]);
        bins[bins.length-1].x1 = 1.01;
        //bins = bins.slice(0, bins.length-1);

        // score_chart_data[cur_img_name] = {};
        score_chart_data[cur_img_name]["bins"] = bins;
        /*["bins"] = bins;
        score_chart_data[cur_img_name]["scores"] = scores;*/
        // }

    //}

}

function evaluate_scores(bins, scores) {

    let quality_score = 0;
    let bin_i_prob, bin_i_score;

    if (scores.length > 0) {

        for (let i = 0; i < bins.length; i++) {
            
            bin_i_prob = bins[i].length / scores.length;
            bin_i_score = score_thresholds[i];
            quality_score = quality_score + (bin_i_prob * (bin_i_score * bin_i_score));
        }

        //quality_score = range_map(quality_score, 0.25, 1.0, 0.0, 1.0);
        quality_score = range_map(quality_score, 0.0156, 1.0, 0.0, 1.0);
    }

    let certainty;
    if (scores.length < 10) {
        certainty = "Low";
    }
    else if (scores.length < 50) {
        certainty = "Moderate";
    }
    else {
        certainty = "High";
    }

    return [quality_score, certainty];
}


function draw_score_chart() {

    // let scores = [];
    // for (prediction of predictions[cur_img_name]["annotations"]) {
    //     let bodies = Array.isArray(prediction.body) ?
    //                     prediction.body : [ prediction.body ];
    //     let scoreTag = bodies.find(b => b.purpose == 'score');
    //     scores.push(parseFloat(scoreTag.value));
    // }

    $("#score_chart").empty();

    let chart_width = $("#score_chart").width(); // - 10;
    let chart_height = $("#score_chart").height(); // - 10;

    let margin_top = 10;
    let margin_right = 0;
    let margin_bottom = 20;
    let margin_left = 45;

    let width = chart_width - margin_left - margin_right;
    let height = chart_height - margin_top - margin_bottom;

    score_svg = d3.select("#score_chart")
                    .append("svg")
                    .attr("id", "score_chart_svg")
                    .attr("width", chart_width)
                    .attr("height", chart_height)
                    .append("g")
                    .attr("transform",
                      "translate(" + margin_left + "," + margin_top + ")");

    // let width = chart_width - 2 * margin;
    // let height = chart_height - 2 * margin;

    score_xScale = d3.scaleLinear()
                        .domain([0.25, 1.01])
                        .range([0, width]);

    score_chart_x_axis = score_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");
    
    score_chart_x_axis.call(d3.axisBottom(score_xScale).tickSizeOuter(0).tickValues([0.25, 0.5, 0.75, 1.0]) //.tickFormat(d3.format("d"))); //x => `${x.toFixed(2)}`));
    .tickFormat((d, i) => ['0.25', '0.5', '0.75', '1'][i])); 


    let bins = score_chart_data[cur_img_name]["bins"];
    let scores = score_chart_data[cur_img_name]["scores"];

    let ret = evaluate_scores(bins, scores);
    let quality_score =  Math.round((ret[0] + Number.EPSILON) * 100);
    let certainty = ret[1];

    $("#quality_score").html(quality_score + "% (" + certainty + " Certainty)");

    score_yScale = d3.scaleLinear()
                .range([height, 0]);
    //y.domain([0, 1]);

    score_yScale.domain([0, d3.max(bins, function(d) { return d.length; })]);
    //score_yScale.domain([0, scores_max_y_bin]); //d3.max(bins, function(d) { return d.length / scores.length; })]);

    score_chart_y_axis = score_svg.append("g")
                                .attr("class", "y axis");
                                //.call(d3.axisLeft(y));
    score_chart_y_axis.call(d3.axisLeft(score_yScale).ticks(4));


    score_svg.selectAll(".score_rect")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "score_rect")
            .attr("x", 1)
            .attr("transform", function(d) { 
                //let y_trans = scores.length > 0 ? score_yScale(d.length / scores.length) : height;
                let y_trans = scores.length > 0 ? score_yScale(d.length) : height;
                // if (scores.length == 0) {
                //     y_trans = 0;
                // }
                // else {
                //     y_trans = score_yScale(d.length / scores.length)
                // }
                return "translate(" + score_xScale(d.x0) + "," + y_trans + ")"; 
            }) 
            //    return "translate(" + score_xScale(d.x0) + "," + score_yScale(d.length / scores.length) + ")"; })
            .attr("width", function(d) { return score_xScale(d.x1) - score_xScale(d.x0) - 0.2 ; })
            .attr("height", function(d) { 
                //let y_trans = scores.length > 0 ? score_yScale(d.length / scores.length) : height;
                let y_trans = scores.length > 0 ? score_yScale(d.length) : height;
                // if (scores.length == 0) {
                //     return height;
                // }
                // else {
                //     return height - (score_yScale(d.length / scores.length)); 
                // }
                return height - y_trans;
            })
            //    return height - (score_yScale(d.length / scores.length)); })
            .style("fill", overlay_colors["prediction"])  //function(d){ if(d.x0<140){return "orange"} else {return "#69b3a2"}})
            // .attr("stroke", "white")
            // .attr("stroke-width", "0.5");
    
    
    let slider_val = parseFloat($("#confidence_slider").val()); //.toFixed(2);
    score_svg
        .append("line")
        .attr("class", "score_line")
        .attr("x1", score_xScale(slider_val) )
        .attr("x2", score_xScale(slider_val) )
        .attr("y1", 0)
        .attr("y2", height) //scores_max_y_bin))
        .attr("stroke", "white")
        .attr("stroke-dasharray", "4")

}


function update_score_chart() {

    let chart_width = $("#score_chart").width(); // - 5;
    let chart_height = $('#score_chart').height(); // - 5;

    let margin_top = 10;
    let margin_right = 10;
    let margin_bottom = 20;
    let margin_left = 35;

    let width = chart_width - margin_left - margin_right;
    let height = chart_height - margin_top - margin_bottom;

    let bins = score_chart_data[cur_img_name]["bins"];
    let scores = score_chart_data[cur_img_name]["scores"];


    let ret = evaluate_scores(bins, scores);
    let quality_score =  Math.round((ret[0] + Number.EPSILON) * 100);
    let certainty = ret[1];

    $("#quality_score").html(quality_score + "% (" + certainty + " Certainty)");

    //count_xScale.domain([0, max_count]);
    score_yScale.domain([0, d3.max(bins, function(d) { return d.length; })]);

    score_chart_y_axis.transition().duration(250).call(d3.axisLeft(score_yScale).ticks(4)); //.ticks(chart_width / 100)); //.tickFormat(d3.format("d")));

    d3.selectAll(".score_rect")
        .data(bins)
        .transition()
        .duration(250)
        .attr("transform", function(d) { 
            //let y_trans = scores.length > 0 ? score_yScale(d.length / scores.length) : height;
            let y_trans = scores.length > 0 ? score_yScale(d.length) : height;
            // if (scores.length == 0) {
            //     y_trans = 0;
            // }
            // else {
            //     y_trans = score_yScale(d.length / scores.length)
            // }
            return "translate(" + score_xScale(d.x0) + "," + y_trans + ")"; 
        })
        .attr("height", function(d) {
            //let y_trans = scores.length > 0 ? score_yScale(d.length / scores.length) : height;
            let y_trans = scores.length > 0 ? score_yScale(d.length) : height;
            // if (scores.length == 0) {
            //     return height;
            // }
            // else {
            return height - y_trans; //(score_yScale(d.length / scores.length)); 
            //}
        });
        
        // .attr("x", function(d, i) {
        //     return 3 * count_margin;
        // })
        // .attr("width", function(d) {
        //     return count_xScale(count_chart_data[cur_img_name][d]) - 2 * count_margin;
        // });
    let slider_val = parseFloat($("#confidence_slider").val()); //.toFixed(2);
    d3.selectAll(".score_line")
        .data([slider_val])
        .transition()
        .duration(250)
        .attr("x1", score_xScale(slider_val) )
        .attr("x2", score_xScale(slider_val) );
        // .attr("y1", score_yScale(0))
        // .attr("y2", score_yScale(scores_max_y_bin));
        // .attr("stroke", "white")
        // .attr("stroke-dasharray", "4")
}