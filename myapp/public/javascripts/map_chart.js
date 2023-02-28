
let map_chart_tile_size;

let saddlebrown = [139,  69,  19];
let greenyellow = [173, 255,  47];
let wheat = [245, 222, 179];
let forestgreen = [34, 139,  34];

let map_zoom_bounds = null;

function color_map(num, min_num, max_num, c1, c2) {
    let fraction = (num - min_num) / (max_num - min_num);
    let r = ((c2[0] - c1[0]) * fraction) + c1[0];
    let g = ((c2[1] - c1[1]) * fraction) + c1[1];
    let b = ((c2[2] - c1[2]) * fraction) + c1[2];

    return [r, g, b]
}


function draw_map_chart() {

    let margin = 110;
    let circle_data = [];
    let max_latitude = -10000;
    let min_latitude = 10000;
    let max_longitude = -10000;
    let min_longitude = 10000;

    if (metadata["is_ortho"] !== "yes") {


        // let max_density = 0;
        for (let dzi_image_path of dzi_image_paths) {
            let image_name = basename(dzi_image_path)
            image_name = image_name.substring(0, image_name.length - 4);

            let latitude = metadata["images"][image_name]["latitude"];
            let longitude = metadata["images"][image_name]["longitude"];
            let image_width_px = metadata["images"][image_name]["width_px"];
            let image_height_px = metadata["images"][image_name]["height_px"];
            // let status = annotations[image_name]["status"];


            let color;
            //if (image_is_fully_annotated(annotations, image_name, image_width_px, image_height_px)) { //((status === "completed_for_training") || (status === "completed_for_testing")) {
            //    color = "#0080C0";

                // let gsd_h = (camera_height * sensor_height) / (focal_length * metadata["images"][image_name]["height_px"]);
                // let gsd_w = (camera_height * sensor_width) / (focal_length * metadata["images"][image_name]["width_px"]);     
                
                // let gsd = Math.min(gsd_h, gsd_w);

                // let image_height_m = metadata["images"][image_name]["height_px"] * gsd;
                // let image_width_m = metadata["images"][image_name]["width_px"] * gsd;

                // let area_m2 = image_width_m * image_height_m;


                // let density = annotations[image_name]["annotations"].length / area_m2;
                // if (Math.ceil(density) > max_density) {
                //     max_density = density;
                // }
            //}
            if (image_is_fully_annotated_for_training(annotations, image_name, image_width_px, image_height_px)) {
                color = overlay_appearance["colors"]["training_region"];
            }
            else if (image_is_fully_annotated_for_testing(annotations, image_name, image_width_px, image_height_px)) {
                color = overlay_appearance["colors"]["test_region"];
            }
            else {
                color = "white";
            }

            circle_data.push({
                "latitude": latitude,
                "longitude": longitude,
                "color": color,
                "image_name": image_name,
                "dzi_image_path": dzi_image_path
            });

            if (latitude < min_latitude) {
                min_latitude = latitude;
            }
            if (latitude > max_latitude) {
                max_latitude = latitude;
            }
            if (longitude < min_longitude) {
                min_longitude = longitude;
            }
            if (longitude > max_longitude) {
                max_longitude = longitude;
            }
        }
    }

    let ratio;
    if (metadata["is_ortho"] === "yes") {
        ratio = (metadata["images"][Object.keys(annotations)[0]]["width_px"] / metadata["images"][Object.keys(annotations)[0]]["height_px"]);
    }
    else {
        ratio = ((max_longitude - min_longitude) / (max_latitude - min_latitude));
    }

    let max_image_height = ($("#seadragon_viewer").height() - 4) - (2 * margin);
    let max_image_width;
    if ($("#image_view_container").is(":visible")) {
        // console.log("image_view_container is visible");
        // console.log($("#image_view_container").width());
        // console.log($("#left_panel").width());
        max_image_width = ($("#image_view_container").width() - (2 * $("#left_panel").width())) - (2 * margin); //($("#seadragon_viewer").width() - 4) - (2 * margin);
    }
    else {
        // console.log("image_view_container is not visible");
        max_image_width = ($("#map_view_container").width() - (2 * $("#map_builder_controls_container").width())) - (2 * margin); //($("#seadragon_viewer").width() - 4) - (2 * margin);
    }
    

    let image_height = max_image_height;
    let image_width = image_height * ratio;
    if (image_width > max_image_width) {
        image_width = max_image_width;
        image_height = image_width * (1 / ratio);
    }

    // let image_height = max_image_height;
    // let image_width = max_image_width;

    chart_height = Math.max(image_height + (2 * margin), 500);
    chart_width = Math.max(image_width + (2 * margin), 500);

    console.log("chart_height", chart_height);
    console.log("chart_width", chart_width);
    // chart_height = max_image_height + (2 * margin);
    // chart_width = max_image_width + (2 * margin);
 

    chart_height = chart_height + "px";
    chart_width = chart_width + "px";



    $("#chart_container").empty();
    $("#chart_container").append(
        `<table>` +
            `<tr>` +
                `<td>` +
                    `<div id="map_container" style="height: ${chart_height}; width: ${chart_width};">` +
                        `<div id="map_chart_tooltip" class="tooltip"></div>` +
                    `</div>` +
                `</td>` +
                `<td>` +
                    `<div id="legend_container" style="height: ${chart_height}; width: 60px"></div>` +
                `</td>` +
            `</tr>` +
        `</table>`
    );


    // let make = metadata["camera_info"]["make"];
    // let model = metadata["camera_info"]["model"];

    // let camera_entry = camera_specs[make][model];
    // let sensor_height = camera_entry["sensor_height"];
    // let sensor_width = camera_entry["sensor_width"];
    // let focal_length = camera_entry["focal_length"];

    // let camera_height = metadata["camera_height"];



    chart_width = $("#map_container").width();
    chart_height = $("#map_container").height();


    let svg = d3.select("#map_container")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);

    let chart = d3.select("#map_container").select("svg").append("g");
        

    if (metadata["is_ortho"] !== "yes") {


        // let max_latitude = -10000;
        // let min_latitude = 10000;
        // let max_longitude = -10000;
        // let min_longitude = 10000;
        // // let max_density = 0;
        // for (let dzi_image_path of dzi_image_paths) {
        //     let image_name = basename(dzi_image_path)
        //     image_name = image_name.substring(0, image_name.length - 4);

        //     let latitude = metadata["images"][image_name]["latitude"];
        //     let longitude = metadata["images"][image_name]["longitude"];
        //     let image_width_px = metadata["images"][image_name]["width_px"];
        //     let image_height_px = metadata["images"][image_name]["height_px"];
        //     // let status = annotations[image_name]["status"];


        //     let color;
        //     //if (image_is_fully_annotated(annotations, image_name, image_width_px, image_height_px)) { //((status === "completed_for_training") || (status === "completed_for_testing")) {
        //     //    color = "#0080C0";

        //         // let gsd_h = (camera_height * sensor_height) / (focal_length * metadata["images"][image_name]["height_px"]);
        //         // let gsd_w = (camera_height * sensor_width) / (focal_length * metadata["images"][image_name]["width_px"]);     
                
        //         // let gsd = Math.min(gsd_h, gsd_w);

        //         // let image_height_m = metadata["images"][image_name]["height_px"] * gsd;
        //         // let image_width_m = metadata["images"][image_name]["width_px"] * gsd;

        //         // let area_m2 = image_width_m * image_height_m;


        //         // let density = annotations[image_name]["annotations"].length / area_m2;
        //         // if (Math.ceil(density) > max_density) {
        //         //     max_density = density;
        //         // }
        //     //}
        //     if (image_is_fully_annotated_for_training(annotations, image_name, image_width_px, image_height_px)) {
        //         color = overlay_appearance["colors"]["training_region"];
        //     }
        //     else if (image_is_fully_annotated_for_testing(annotations, image_name, image_width_px, image_height_px)) {
        //         color = overlay_appearance["colors"]["test_region"];
        //     }
        //     else {
        //         color = "white";
        //     }

        //     circle_data.push({
        //         "latitude": latitude,
        //         "longitude": longitude,
        //         "color": color,
        //         "image_name": image_name,
        //         "dzi_image_path": dzi_image_path
        //     });

        //     if (latitude < min_latitude) {
        //         min_latitude = latitude;
        //     }
        //     if (latitude > max_latitude) {
        //         max_latitude = latitude;
        //     }
        //     if (longitude < min_longitude) {
        //         min_longitude = longitude;
        //     }
        //     if (longitude > max_longitude) {
        //         max_longitude = longitude;
        //     }
        // }

            
        chart_x_axis = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (chart_height - (margin / 2)) + ")");

        chart_y_axis = svg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + (margin / 2) + ", 0)");




        xScale = d3.scaleLinear()
            .domain([min_longitude, max_longitude])
            .range([margin, chart_width - margin]);

        yScale = d3.scaleLinear()
            .domain([min_latitude, max_latitude])
            .range([chart_height - margin, margin]);


        chart_x_axis.call(d3.axisBottom(xScale).tickValues([min_longitude, max_longitude]).tickFormat(x => `${x.toFixed(4)}`));
        chart_y_axis.call(d3.axisLeft(yScale).tickValues([min_latitude, max_latitude]).tickFormat(x => `${x.toFixed(4)}`));



        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", - (chart_height / 2))
            .attr("y", (margin / 2) - 30)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("Latitude");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", ((chart_width / 2)))
            .attr("y", chart_height - (margin / 2) + 30)
            .text("Longitude");
    }
    

    if (map_url !== null) {
        let interpolated_value;
        if ($("input[name=interpolated_value_radio]").length == 0) {
            interpolated_value = "obj_density";
        }
        else {
            interpolated_value = $("input[name=interpolated_value_radio]:checked").val();
        }
        

        let object_name = metadata["object_name"];
        let pieces = object_name.split("_");
        let cap_pieces = pieces.map(capitalizeFirstLetter);
        cap_pieces[cap_pieces.length - 1] = cap_pieces[cap_pieces.length - 1] + "s";
        let objects_str = cap_pieces.join(" ");

        let chart_title, chart_title_2;
        if (interpolated_value === "obj_density") {
            chart_title = "Number of Predicted " + objects_str + " Per Square Metre";
            chart_title_2 = "";
        }
        else if (interpolated_value === "perc_veg") {
            chart_title = "Percentage of Pixels Classified As Vegetation";
            chart_title_2 = "";
        }
        else if (interpolated_value === "perc_veg_obj") {
            chart_title = "Percentage of Pixels Located Inside";
            chart_title_2 = "Predicted Boxes and Classified As Vegetation";
        }
        else if (interpolated_value === "perc_veg_non_obj") {
            chart_title = "Percentage of Pixels Located Outside";
            chart_title_2 = "Predicted Boxes and Classified As Vegetation";
        }


        chart.selectAll("text")
             .data([chart_title, chart_title_2])
             .enter()
             .append("text")
             .attr("x", chart_width / 2)
             .attr("y", function(d, i) { return (margin / 2) + (i * 20); })
             .attr("alignment-baseline", "central")
             .attr("text-anchor", "middle")
             .attr("font-size", "18px")
             .text(function(d) {
                 return d;
             });
/*
        chart.selectAll("text")
             .data([chart_title_2])
             .enter()
             .append("text")
             .attr("x", chart_width / 2)
             .attr("y", (margin / 2))
             .attr("alignment-baseline", "central")
             .attr("text-anchor", "middle")
             .attr("font-size", "18px")
             .text(function(d) {
                 return d;
             });*/

        chart.append("svg:image")
            .attr("id", "svg_map")
            .attr("x", margin)
            .attr("y", margin)
            .attr("width", chart_width- 2 * margin)
            .attr("height", chart_height - 2 * margin)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", map_url);

        let vmin;
        let vmax;
        if (min_max_rec !== null) {
            vmin = min_max_rec["vmin"];
            vmax = min_max_rec["vmax"];
            let legend_svg = d3.select("#legend_container")
            .append("svg")
            .attr("width", "60px")
            .attr("height", chart_height);

            let cmap = d3.select("#legend_container").select("svg").append("g");

            let min_color = wheat;
            let max_color = forestgreen;
            let rects = [];
            
            let num_rects = 1000;
            for (let i = 0; i < num_rects; i++) {

                let v = range_map(i, 0, num_rects, vmin, vmax);
                let c = color_map(v, vmin, vmax, min_color, max_color);
                //let c = color_map((i / num_rects) * max_density, 0, max_density, min_color, max_color);
                rects.push({
                    "color": "rgb(" + c[0] + ", " + c[1] + ", " + c[2] + ")",
                    "v": v
                });
            }

            let legend_yScale = d3.scaleLinear()
                //.domain([0, max_density])
                .domain([vmin, vmax])
                .range([chart_height - margin, margin]);


            let legend_y_axis = legend_svg.append("g")
                .attr("class", "map_legend axis")
                .attr("transform", "translate(" + 70 + ", 0)");

            //legend_y_axis.call(d3.axisLeft(legend_yScale).tickValues([0, max_density]).tickFormat(d3.format("d")).tickSize(25));
            //let disp_vmin;
            //let disp_vmax;
            if (interpolated_value === "obj_density") {
                //disp_vmin = vmin;
                //disp_vmax = vmax;
                custom_tickformat = d3.format("d")


            }
            else {
                //disp_vmin = "%" + vmin;
                //disp_vmax = "%" + vmax;
                custom_tickformat = function(d, i) { return "%" + d; } //.tickFormat((d, i) => ['0.25', '0.5', '0.75', '1'][i]));
            }
            legend_y_axis.call(d3.axisLeft(legend_yScale).tickValues([vmin, vmax]).tickFormat(custom_tickformat).tickSize(25));

            cmap.selectAll(".rect")
            .data(rects)
            .enter()
            .append("rect")
            .attr("x", function(d) {
                return 50;
            })
            // .attr("y", function(d, i) {
            //     return legend_yScale(((i+1) / num_rects) * max_density);
            // })
            // .attr("height", function(d, i) {
            //     return legend_yScale((i / num_rects) * max_density) - legend_yScale(((i+1) / num_rects) * max_density) + 1;
            // })
            .attr("y", function(d, i) {
                //return legend_yScale(i+1);
                //return legend_yScale(((i+1) / num_rects) * vmax);
                return legend_yScale(d.v);
            })
            .attr("height", function(d, i) {
                //return 1; //legend_yScale(i) - legend_yScale(i+1) + 1;
                //return legend_yScale((i / num_rects) * vmax) - legend_yScale(((i+1) / num_rects) * vmax) + 1;
                if (i == num_rects -1) {
                    return (legend_yScale(d.v) - legend_yScale(vmax)) + 1;
                }
                else {
                    return (legend_yScale(d.v) - legend_yScale(rects[i+1]["v"])) + 1;
                }
            })


            .attr("width", 20)
            .attr("fill", function(d) {
                return d["color"];
            });

        }


        if (metadata["is_ortho"] === "yes") {
            $("#svg_map").css("cursor", "pointer");
            $("#svg_map").click(function(event) {
    
                let image_x = event.pageX - $(this).offset().left;
                let image_y = event.pageY - $(this).offset().top;
                event.stopPropagation();

                // if ((can_calculate_density(metadata, camera_specs)) && (gsd == null)) {
                //     gsd = get_gsd();
                // }
                
                let image_name = Object.keys(annotations)[0];
                let image_height_px = metadata["images"][image_name]["height_px"];
                let image_width_px = metadata["images"][image_name]["width_px"];
                /*
                let make = metadata["camera_info"]["make"];
                let model = metadata["camera_info"]["model"];
                let camera_entry = camera_specs[make][model];
            
                let camera_height = metadata["camera_height"];
                let sensor_height = camera_entry["sensor_height"];
                let sensor_width = camera_entry["sensor_width"];
                let focal_length = camera_entry["focal_length"];
                let raw_image_height_px = camera_entry["image_height_px"];
                let raw_image_width_px = camera_entry["image_width_px"];
            
            
                let gsd_h = (camera_height * sensor_heidght) / (focal_length * raw_image_height_px);
                let gsd_w = (camera_height * sensor_width) / (focal_length * raw_image_width_px);
            
                let gsd = Math.min(gsd_h, gsd_w);*/
            
                let image_height_m = image_height_px * gsd;
                let image_width_m = image_width_px * gsd;
    
                let num_y_tiles = Math.round(image_height_m / map_chart_tile_size);
                let num_x_tiles = Math.round(image_width_m / map_chart_tile_size);
    
                let tile_height_m = image_height_m / num_y_tiles;
                let tile_width_m = image_width_m / num_x_tiles;
    
                let tile_height_svg = ((chart_height - 2 * margin) / image_height_m) * tile_height_m;
                let tile_index_y = Math.floor(image_y / tile_height_svg);
    
                let tile_width_svg = ((chart_width - 2 * margin) / image_width_m) * tile_width_m;
                let tile_index_x = Math.floor(image_x / tile_width_svg);
    
                let tile_width_px = image_width_px / num_x_tiles;
                let tile_height_px = image_height_px / num_y_tiles;
    
                let zoom_region = [
                    Math.round(tile_index_y * tile_height_px),
                    Math.round(tile_index_x * tile_width_px),
                    Math.round((tile_index_y + 1) * tile_height_px),
                    Math.round((tile_index_x + 1) * tile_width_px),
                ];
    
                $("#navigation_dropdown").val("images");
                $("#active_layer_table").css("opacity", 1.0);
                $("input:radio[name=edit_layer_radio]").prop("disabled", false);
                $("#show_segmentation_button").show();
    
    
    
                // let content_size = viewer.world.getItemAt(0).getContentSize();
                // let image_w = content_size.x;
                // let image_h = content_size.y;
    
                let hw_ratio = image_height_px / image_width_px;
                let viewport_bounds = [
                    zoom_region[1] / image_width_px,
                    (zoom_region[0] / image_height_px) * hw_ratio,
                    (zoom_region[3] - zoom_region[1]) / image_width_px,
                    ((zoom_region[2] - zoom_region[0]) / image_height_px) * hw_ratio
                ];
    
                map_zoom_bounds = [
                    viewport_bounds[0],
                    viewport_bounds[1],
                    viewport_bounds[2],
                    viewport_bounds[3]
                ];
    
                create_navigation_table();
                update_count_combo(true);
                cur_region_index = -1;
                show_image(image_name);
    
            });
        }


    }




    if (metadata["is_ortho"] !== "yes") {

        let tooltip = d3.select("#map_chart_tooltip");

        let tip_mouseover = function(d) {

            $("#map_chart_tooltip").show();
            let html = "Image: " + d.image_name;

            tooltip.html(html);
            let tooltip_width = $("#map_chart_tooltip").width();
            tooltip.style("opacity", 1.0)
                .style("left", (d3.event.pageX - (tooltip_width / 2)) + "px")
                .style("top", (d3.event.pageY - 40) + "px");
            d3.select(this).style("cursor", "pointer"); 
        }

        let tip_mouseleave = function(d) {
            tooltip.style("opacity", 0);
            $("#map_chart_tooltip").hide();
            d3.select(this).style("cursor", "default"); 
        }

        chart.selectAll("circle")
            .data(circle_data)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return xScale(d["longitude"]);
            })
            .attr("cy", function(d) {
                return yScale(d["latitude"]);
            })
            .attr("r", 5)
            .attr("fill", function(d) {
                return d["color"];
            })
            .attr("stroke", "black")
            .attr("stroke-width", 1)

            .on("click", function(d) {

                $("#navigation_dropdown").val("images");
                $("#active_layer_table").css("opacity", 1.0);
                $("input:radio[name=edit_layer_radio]").prop("disabled", false);
                $("#show_segmentation_button").show();
                // if (cur_panel === "segmentation") {
                //     viewer = null;
                // }
                create_navigation_table();
                update_count_combo(true);
                // cur_panel = "annotation";
                cur_region_index = -1;
                show_image(d["image_name"]);


                //show_image(d["image_name"]);
                //change_image(d["image_name"]);
            })
            .on("mouseover", tip_mouseover)
            .on("mouseleave", tip_mouseleave);
    }

}

