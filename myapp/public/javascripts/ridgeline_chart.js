let ridgeline_svg; // = {};

let ridgeline_xScale;
let ridgeline_chart_x_axis;

//let ridgeline_yScale;
let ridgeline_chart_y_axis;
let yName;

let all_bins;



// let MAX_ALLOWED_NAME_WIDTH = 300;

function show_ridgeline_modal() {
    //show_modal_message("Confidence Distributions",
    //`<div id="ridgeline_loader" class="loader"></div>`);
     //function1(function() {
     //delay(1000).then(() => {
     show_modal_message("Confidence Distributions",
     `<table>` +
         `<tr>` +
             `<td>` +
                 `<div class="header2">Sort By</div>` +
             `</td>` +
             `<td>` +
                 `<select id="ridgeline_sort_combo" style="width: 200px; margin-left: 10px" class="nonfixed_dropdown">` +
                    `<option value="quality_score" selected>Quality Score</option>` +
                    `<option value="image_name">Image Name</option>` +
                 `</select>` +
             `</td>` +
         `</tr>` +
     `</table>` +
 
     `<div style="width: 850px; text-align: center">` +
 
         `<div style="width: 800px; height: 500px" class="scrollable_area">` +
             `<div id="ridgeline_chart" style="margin: 0 auto; border: none; width: 775px; height: 450px">` +
                // `<div id="ridgeline_chart_tooltip" class="tooltip" style="z-index: 10"></div>` +
             `</div>` +
         `</div>` +
     `</div>` 
     , modal_width=850, display=true); //false);
 
     $("#ridgeline_sort_combo").change(function() {
         draw_ridgeline_chart();
     });
     //$("#modal").css("display", "block");
     draw_ridgeline_chart();
 //});
 
 
 }











function draw_ridgeline_chart() {
    //console.log("draw_ridgeline");
    $("#ridgeline_chart").empty();
    // $("#ridgeline_chart").append(
    //     `<div id="ridgeline_loader" class="loader"></div>`
    // );
    //$("#ridgeline_chart").append(`<div id="ridgeline_chart_tooltip" class="tooltip" style="z-index: 10"></div>`);
    // $("#modal").css("display", "block");

    // $("#modal_message").empty();
    // $("#modal_message").append(
    // `<table>` +
    //     `<tr>` +
    //         `<td>` +
    //             `<div class="header2">Sort By</div>` +
    //         `</td>` +
    //         `<td>` +
    //             `<select id="ridgeline_sort_combo" style="width: 200px; margin-left: 10px" class="nonfixed_dropdown">` +
    //                 `<option value="image_name">Image Name</option>` +
    //                 `<option value="quality_score">Quality Score</option>` +
    //             `</select>` +
    //         `</td>` +
    //     `</tr>` +
    // `</table>` +

    // `<div style="width: 850px; text-align: center">` +

    //     `<div style="width: 800px; height: 500px" class="scrollable_area">` +
    //         `<div id="ridgeline_chart" style="margin: 0 auto; border: none; width: 775px; height: 450px"></div>` +
    //     `</div>` +
    // `</div>` );

    let image_names;
    let image_name_to_quality = {};

    let image_qualities = [];
    for (let image_name of Object.keys(predictions)) {
        let scores = predictions[image_name]["scores"];
        let bins = score_histogram(scores);
        bins[bins.length-1].x1 = 1.00;
        let quality_score = evaluate_scores(bins, scores)[0];
        image_qualities.push([image_name, quality_score]);
        image_name_to_quality[image_name] = quality_score;
    }

    //console.log("image_name_to_quality", image_name_to_quality);

    image_qualities.sort((a, b) => {
        if (a[1] < b[1]) {
            return -1;
        }
        if (a[1] > b[1]) {
            return 1;
        }
        return 0;
    });
        // console.log("image_qualities", image_qualities);
    if ($("#ridgeline_sort_combo").val() === "image_name") {
        image_names = natsort(Object.keys(predictions)); //.slice(0, 3);
    }
    else {
        image_names = [];
        for (let i = 0; i < image_qualities.length; i++) {
            image_names.push(image_qualities[i][0]);
        }

    }

    let ticks = [];
    for (let i = 20; i <= 105; i += 0.1 ) {
        ticks.push(i);
    }

    let kde = kernelDensityEstimator(kernelEpanechnikov(1.0), ticks); //ridgeline_xScale.ticks(1000));

    let all_density = [];
    for (let image_name of image_names) {
        if (predictions[image_name]["scores"].length == 0) {
            let density_vals = [];
            for (let i = 20; i <= 105; i += 0.1 ) {
                density_vals.push([i, 0]);
            }
            all_density.push({image_name, density: density_vals}); //[[20, 0], [20.1, 0.001], [104.9, 0.001], [105, 0]]})
        }
        else {
            let scores = []
            for (let score of predictions[image_name]["scores"]) {
                scores.push(score * 100); //Math.round((score + Number.EPSILON) * 100));
            }
            // let bins = score_histogram(predictions[image_name]["scores"]);
            // bins[bins.length-1].x1 = 1.00;
            // let kde_scores = [];
            // for (let i = 0; i < bins.length; i++) {
            //     for (let j = 0; j < Math.round(((bins[i].length / predictions[image_name]["scores"].length) * 100)); j++) {
            //         kde_scores.push(bins[i].x1 * 100);
            //     }
            // }
            // console.log("kde_scores", kde_scores);


            let density = kde(scores); //predictions[image_name]["scores"]); //predictions.map(function(d) { return d[image_name]["scores"]}));
            all_density.push({image_name: image_name, density: density});
        }
    }

    let max_density = 0;
    for (let density of all_density) {
        for (let i = 0; i < density.density.length; i++) {
            if (density.density[i][1] > max_density) {
                max_density = density.density[i][1];
            }
        }
    }




    //console.log("calculated densities");
    //$("#ridgeline_chart").empty();








    //let max_name_width = get_max_name_width(image_names, "normal 12px sans-serif"); //"sans-serif 12px")
    let disp_image_names = [];
    for (let image_name of image_names) {
        if (image_name.length > 25) {
            disp_image_names.push(image_name.substring(0, 10) + "..." + image_name.substring(image_name.length-10, image_name.length));
        }
        else {
            disp_image_names.push(image_name);
        }
    }
    let max_name_width = get_max_name_width(disp_image_names, "normal 12px sans-serif");


    // if (max_name_width > MAX_ALLOWED_NAME_WIDTH) {
    //     disp_image_names = []
    //     for (let image_name of image_names) {
    //         disp_image_names.push(image_name.substring(0, 10) + "..." + image_name.substring(image_name.length-10, image_name.length));
    //     }
    //     //disp_image_names = short_names;
    //     max_name_width = get_max_name_width(disp_image_names, "normal 12px sans-serif");
    // }
    // else {
    //     disp_image_names = image_names;
    // }

    


    
    let margin_top = 60;
    let margin_right = 60;
    let margin_bottom = 40;
    let margin_left = max_name_width + 20;


    let min_row_spacing = 40;

    let new_chart_height = Math.max(image_names.length * min_row_spacing, 350);

    $("#ridgeline_chart").height(new_chart_height);
    // console.log("new_chart_height", new_chart_height);

    let chart_width = $("#ridgeline_chart").width(); // - 10;
    let chart_height = $("#ridgeline_chart").height(); // - 10;

    let width = chart_width - margin_left - margin_right;
    let height = chart_height - margin_top - margin_bottom;

    ridgeline_svg = d3.select("#ridgeline_chart")
                    .append("svg")
                    .attr("id", "ridgeline_chart_svg")
                    .attr("width", chart_width)
                    .attr("height", chart_height)
                    .append("g")
                    .attr("transform",
                    "translate(" + margin_left + "," + margin_top + ")");


    ridgeline_xScale = d3.scaleLinear()
                    .domain([20, 105]) //0.25, 1.0]) //1.0]) //1.01])
                    .range([0, width]);

    ridgeline_chart_x_axis = ridgeline_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height  + ")");

    //if (i == image_names.length-1) {
    ridgeline_chart_x_axis.call(d3.axisBottom(ridgeline_xScale).tickSizeOuter(0)
    .tickValues([25, 50, 75, 100]) //[0.25, 0.5, 0.75, 1.0]) //.tickFormat(d3.format("d"))); //x => `${x.toFixed(2)}`));
    .tickFormat((d, i) => ['0.25', '0.5', '0.75', '1'][i]));
    //}

    let max_scores_length = 0;
    for (let image_name of image_names) {
        if (predictions[image_name]["scores"].length > max_scores_length) {
            max_scores_length = predictions[image_name]["scores"].length;
        }
    }














    // console.log("max_scores_length", max_scores_length);


                            // .domain([0, 2.9])
                            // .range([height, 0]);
    // let image_names = natsort(Object.keys(annotations)).slice(0, 4); //3);

    // for (let i = 0; i < image_names.length; i++) {
        
    //     let image_name = image_names[i];
    //     let bins = score_histogram(predictions[image_name]["scores"]);
    //     bins[bins.length-1].x1 = 1.00;
    //     let num_predictions = predictions[image_name]["scores"].length;
    //     console.log("bins", bins);

        
    //     let svg_height = (chart_height / image_names.length);
    //     let svg_top = margin_top + (svg_height) * i;
    //     let svg_bottom = svg_top + svg_height;
    //     let occ_svg_top = svg_height + 10;
    //     let occ_svg_height = svg_height - 20;


    //     ridgeline_svg = d3.select("#ridgeline_chart")
    //                     .append("svg")
    //                     .attr("id", "ridgeline_chart_svg")
    //                     .attr("width", chart_width)
    //                     .attr("height", svg_height)
    //                     .append("g")
    //                     .attr("transform",
    //                     "translate(" + margin_left + "," + 0 + ")");

    //     ridgeline_xScale = d3.scaleLinear()
    //                     .domain([0.25, 1.0]) //0.25, 1.0]) //1.0]) //1.01])
    //                     .range([0, width]);

    //     ridgeline_chart_x_axis = ridgeline_svg.append("g")
    //         .attr("class", "x axis")
    //         .attr("transform", "translate(0," + occ_svg_height  + ")");

    //     if (i == image_names.length-1) {
    //     ridgeline_chart_x_axis.call(d3.axisBottom(ridgeline_xScale).tickSizeOuter(0)
    //     .tickValues([0.25, 0.50, 0.75, 1.0]) //[0.25, 0.5, 0.75, 1.0]) //.tickFormat(d3.format("d"))); //x => `${x.toFixed(2)}`));
    //     .tickFormat((d, i) => ['0.25', '0.5', '0.75', '1'][i]));
    //     }

    //     ridgeline_yScale = d3.scaleLinear()
    //                 .range([occ_svg_height, 10])
    //                 .domain([0, d3.max(bins, function(d) { return d.length; })]);

    //     ridgeline_chart_y_axis = ridgeline_svg.append("g")
    //                 .attr("class", "y axis");            
    //     ridgeline_chart_y_axis.call(d3.axisLeft(ridgeline_yScale).ticks(1));

    //     // ridgeline_yScale = d3.scaleLinear()
    //     //                     .domain([0, 0.4])
    //     //                     .range([height, 0]);

    //     // yName = d3.scaleBand()
    //     //         .domain(image_names)
    //     //         .range([0, height])
    //     //         .paddingInner(1);

    //     // ridgeline_chart_y_axis = ridgeline_svg.append("g")
    //     //     .attr("class", "y axis")
            
    //     // ridgeline_chart_y_axis.call(d3.axisLeft(yName));

    //     // all_bins = [];
    //     // for (let image_name of image_names) {
    //     //     let bins = score_histogram(predictions[image_name]["scores"]);
    //     //     bins[bins.length-1].x1 = 1.00;
    //     //     for (let bin of bins) {
    //     //         all_bins.push({
    //     //             "image_name": image_name,
    //     //             "bin": bin
    //     //         });
    //     //     }
    //     // }




    //     ridgeline_svg.selectAll(".score_rect")
    //         .data(bins)
    //         .enter()
    //         .append("rect")
    //         .attr("class", "score_rect")
    //         //.attr("x", 1)
    //         .attr("transform", function(d) { 
    //             //let y_trans = scores.length > 0 ? score_yScale(d.length / scores.length) : height;
    //             let y_trans = num_predictions > 0 ? ridgeline_yScale(d.length) : occ_svg_height;
    //             // if (scores.length == 0) {
    //             //     y_trans = 0;
    //             // }
    //             // else {
    //             //     y_trans = score_yScale(d.length / scores.length)
    //             // }
    //             return "translate(" + ridgeline_xScale(d.x0) + "," + y_trans + ")"; 
    //         }) 
    //         //    return "translate(" + score_xScale(d.x0) + "," + score_yScale(d.length / scores.length) + ")"; })
    //         .attr("width", function(d) { return ridgeline_xScale(d.x1) - ridgeline_xScale(d.x0) - 0.02 ; })
    //         .attr("height", function(d) { 
    //             //let y_trans = scores.length > 0 ? score_yScale(d.length / scores.length) : height;
    //             let y_trans = num_predictions > 0 ? ridgeline_yScale(d.length) : occ_svg_height;
    //             // if (scores.length == 0) {
    //             //     return height;
    //             // }
    //             // else {
    //             //     return height - (score_yScale(d.length / scores.length)); 
    //             // }
    //             return occ_svg_height - y_trans;
    //         })
    //         //    return height - (score_yScale(d.length / scores.length)); })
    //         .style("fill", overlay_appearance["colors"]["prediction"]);  //function(d){ if(d.x0<140){return "orange"} else {return "#69b3a2"}})
    //         // .attr("stroke", "white")
    //         // .attr("stroke-width", "0.5");


    // }

    



    yName = d3.scaleBand()
            .domain(image_names)
            .range([0, height])
            .paddingInner(1);

    ridgeline_chart_y_axis = ridgeline_svg.append("g")
        .attr("class", "y axis")
        
    ridgeline_chart_y_axis.call(d3.axisLeft(yName)
    .tickValues(image_names) //[0.25, 0.5, 0.75, 1.0]) //.tickFormat(d3.format("d"))); //x => `${x.toFixed(2)}`));
    .tickFormat((d, i) => disp_image_names[i]));
    
    //);

    // let max_num_predictions = 0;
    // for (let image_name of Object.keys(predictions)) {
    //     if (predictions[image_name]["boxes"].length > max_num_predictions) {
    //         max_num_predictions = predictions[image_name]["boxes"].length;
    //     }
    // }


    //console.log("max_density", max_density);
    ridgeline_yScale = d3.scaleLinear()
                        .domain([0, max_density]) //max_scores_length * 0.001])
                        .range([min_row_spacing*1.5, 0]);


    //$("#ridgeline_loader").remove();

    let ridgeline_chart = d3.select("#ridgeline_chart").select("svg").append("g");

    ridgeline_chart.selectAll("text")
        .data(image_names) //count_chart_data[cur_img_name])) //[sel_class])
        .enter()
        .append("text")
        .attr("class", "chart_text")
        .attr("x", function(d, i) {
            return chart_width - margin_right + 3; //0; //2.75;
        })
        .attr("y", function(d, i) {
            
            return yName(d) + (1.5*min_row_spacing) - 1; // count_margin + 30 * i + 12; //count_yScale(i) + ((chart_height / (1.65 * num_bars)) / 2);
        })
        .attr("alignment-baseline", "central")
        .attr("text-anchor", "start")
        .attr("font-size", "14px") //(chart_width / 50).toString() + "px")
        //.attr("fill", "red")
        //.attr("font-weight", 12)
        // .attr("stroke", "#ddccbb")
        // .attr("stroke-width", 1)
        //.attr("stroke-width", 0.1)
        .text(function(d) { 
        //     console.log("d", d);
        //     console.log("image_name_to_quality[d]", image_name_to_quality[d]);
            return Math.round((image_name_to_quality[d] + Number.EPSILON) * 100) + "%"; //(Math.ceil(image_name_to_quality[d] * 100) / 100).toFixed(2); 
        })
        .style("cursor", "default");

    
    ridgeline_svg.selectAll("areas")
        .data(all_density)
        .enter()
        .append("path")
        .attr("class", "chart_area")
        .attr("transform", function(d) {
            return ("translate(0," + (yName(d.image_name) - (1.5*min_row_spacing)) + ")" );
        })
        .datum(function(d) {
            return d.density;
        })
        .attr("fill", overlay_appearance["colors"]["prediction"])
        // .attr("opacity", function(d, i) {
        //     //console.log(d.image_name);
        //     return range_map(predictions[image_names[i]]["boxes"].length, 0, max_num_predictions, 0.5, 1.0);
        // })
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("d", //function(d, i) {
            //console.log("i", i);
            //if (predictions[image_names[i]]["scores"].length > 0) {
            //return 
            d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return ridgeline_xScale(d[0]); })
            .y(function(d) { return ridgeline_yScale(d[1]); })
           //}
        )
        //.attr("opacity", 0.8);
        .attr("cursor", "pointer")
        .on("mouseover", handleMouseOver)
        // .on("mousemove", handleMouseMove)
        .on("mouseout", handleMouseOut)
        .on("click", function(d, i) {
            //console.log("click", d, i);
            $("#navigation_dropdown").val("images").change();
            change_image(image_names[i] + "/-1");
            close_modal();
         });

    
    // let tooltip = d3.select("#ridgeline_chart_tooltip");

    ridgeline_svg.selectAll(".y.axis .tick").style("cursor", "pointer");
    ridgeline_svg.selectAll(".y.axis .tick").on("mouseover", function(d, i) { 
        ridgeline_svg.selectAll(".chart_area")
        .filter(function(e, j) { return i == j; })
        .attr("fill", "white");
        //$(tick_element).children('text').css("font-weight", "normal");
        //$(chart_element).css("fill", "white");
        //d3.select(this).attr("fill", "white");
        $(this).children('text').css("font-weight", "bold"); 
    });
    ridgeline_svg.selectAll(".y.axis .tick").on("mouseout", function(d, i) { 
        ridgeline_svg.selectAll(".chart_area")
        .filter(function(e, j) { return i == j; })
        .attr("fill", overlay_appearance["colors"]["prediction"]);
        
        
        $(this).children('text').css("font-weight", "normal"); 
    });
    ridgeline_svg.selectAll(".y.axis .tick").on("click", function(d, i) { 
        $("#navigation_dropdown").val("images").change();
        change_image(image_names[i] + "/-1");
        close_modal();
    });
        
    //     console.log(d, i); });
    //console.log("all_density", all_density);




    function handleMouseOver(d, i) {
        d3.select(this).attr("fill", "white");

        // ridgeline_svg.selectAll(".y.axis .tick")
        // .filter(function(e, j) { return i == j; })
        // .attr("font-weight", "bold");

        let tick_element = ridgeline_svg.selectAll(".y.axis .tick")._groups[0][i];
        $(tick_element).children('text').css("font-weight", "bold");
        // console.log(ridgeline_svg.selectAll(".y.axis .tick")._groups[0][i]);
        //children('text').css("font-weight", "bold");

        // ridgeline_svg.selectAll(".y.axis .tick").



        // ridgeline_chart.selectAll("text")
        //     .filter(function(d){ return image_names[i]==d;} )
        //     .text("test");

        // let html = "No. Predictions: " + predictions[image_names[i]]["boxes"].length;
        // console.log(html);
        // tooltip.html(html)
        //         .style("opacity", 1.0);

    }

    // function handleMouseMove(d) {
    //     tooltip.style("left", (d3.event.pageX+20) + "px")
    //            .style("top", (d3.event.pageY) + "px");
    //     //d3.select(this).style("cursor", "default"); 

    // }


    function handleMouseOut(d, i) {
        d3.select(this).attr("fill", overlay_appearance["colors"]["prediction"]);

        // ridgeline_svg.selectAll(".y.axis .tick")
        // .filter(function(e, j) { return i == j; })
        // .attr("font-weight", "normal");
        let tick_element = ridgeline_svg.selectAll(".y.axis .tick")._groups[0][i];
        $(tick_element).children('text').css("font-weight", "normal");
        // tooltip.style("opacity", 0);

    }

}


// This is what I need to compute kernel density estimation
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
        });
    };
}
function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}
  