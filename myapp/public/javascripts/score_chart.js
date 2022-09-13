
//let score_thresholds = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];
let score_chart_data = {};
// let scores_max_y_bin;
let score_xScale, score_yScale;
let score_chart_x_axis, score_chart_y_axis;
let score_thresholds;

function set_score_chart_data() {

    score_thresholds = [];
    for (let i = 0; i <= 100; i++) {
        score_thresholds.push(i / 100);
    }
    //console.log(score_thresholds);

    // scores_max_y_bin = 0;
    score_chart_data = {};

    for (image_name of Object.keys(annotations)) {
        
        let scores = [];
        if (image_name in predictions) {
            for (prediction of predictions[image_name]["annotations"]) {
                let bodies = Array.isArray(prediction.body) ?
                                prediction.body : [ prediction.body ];
                let scoreTag = bodies.find(b => b.purpose == 'score');
                scores.push(parseFloat(scoreTag.value));
            }
        }

        let histogram = d3.histogram()
        .value(function(d) { return d; })
        .domain([0, 1])
        .thresholds(score_thresholds);

        let bins = histogram(scores);
        console.log("BINS", bins);
        bins[bins.length-1].x1 = 1.01;
        //bins = bins.slice(0, bins.length-1);
        //console.log("SLICED BINS", bins);


        score_chart_data[image_name] = {};
        score_chart_data[image_name]["bins"] = bins;
        score_chart_data[image_name]["scores"] = scores;

        // image_max_y_bin = d3.max(bins, function(d) { return d.length / scores.length; });

        // if (image_max_y_bin > scores_max_y_bin) {
        //     scores_max_y_bin = image_max_y_bin;
        // }

    }

}

function evaluate_scores(bins, scores) {

    let quality_score = 0;
    let bin_i_prob, bin_i_score;
    // console.log("bins.length", bins.length);
    // console.log("score_thresholds.length", score_thresholds.length);
    for (let i = 0; i < bins.length; i++) {
        
        bin_i_prob = bins[i].length / scores.length
        bin_i_score = score_thresholds[i];
        console.log("i, bin_i_prob, bin_i_score", i, bin_i_prob, bin_i_score);
        quality_score = quality_score + (bin_i_prob * (bin_i_score * bin_i_score));
    }
    // console.log("quality_score", quality_score);

    //quality_score = range_map(quality_score, 0.25, 1.0, 0.0, 1.0);
    quality_score = range_map(quality_score, 0.0156, 1.0, 0.0, 1.0);

    let certainty;
    if (scores.length < 10) {
        certainty = "low";
    }
    else if (scores.length < 50) {
        certainty = "moderate";
    }
    else {
        certainty = "high";
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


    let chart_width = $("#score_chart").width(); // - 10;
    let chart_height = $("#score_chart").height(); // - 10;

    let margin_top = 10;
    let margin_right = 10;
    let margin_bottom = 20;
    let margin_left = 35;

    let width = chart_width - margin_left - margin_right;
    let height = chart_height - margin_top - margin_bottom;

    score_svg = d3.select("#score_chart")
                    .append("svg")
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


    console.log(score_xScale.ticks(20));

    /*
    score_svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    */

    // let histogram = d3.histogram()
    //                   .value(function(d) { return d; })
    //                   .domain(score_xScale.domain())
    //                   .thresholds(score_xScale.ticks(20));

    //let bins = histogram(scores);

    let bins = score_chart_data[cur_img_name]["bins"];
    let scores = score_chart_data[cur_img_name]["scores"];

    let ret = evaluate_scores(bins, scores);
    let quality_score =  Math.round((ret[0] + Number.EPSILON) * 100);
    let certainty = ret[1];

    $("#quality_score").html(quality_score + "% (" + certainty + " certainty)");

    console.log("bins", bins);
    console.log("scores", scores);

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
            .style("fill", "#FF4040")  //function(d){ if(d.x0<140){return "orange"} else {return "#69b3a2"}})
            // .attr("stroke", "white")
            // .attr("stroke-width", "0.5");
    
    
    let slider_val = parseFloat($("#confidence_slider").val()).toFixed(2);
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

    $("#quality_score").html(quality_score + "% (" + certainty + " certainty)");

    //count_xScale.domain([0, max_count]);
    score_yScale.domain([0, d3.max(bins, function(d) { return d.length; })]);

    score_chart_y_axis.transition().duration(250).call(d3.axisLeft(score_yScale).ticks(4)); //.ticks(chart_width / 100)); //.tickFormat(d3.format("d")));


    console.log("update_bins", bins);
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
    let slider_val = parseFloat($("#confidence_slider").val()).toFixed(2);
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