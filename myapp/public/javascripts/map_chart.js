let saddlebrown = [139,  69,  19];
let greenyellow = [173, 255,  47];
let wheat = [245, 222, 179];
let forestgreen = [34, 139,  34];

function color_map(num, min_num, max_num, c1, c2) {
    let fraction = (num - min_num) / (max_num - min_num);
    let r = ((c2[0] - c1[0]) * fraction) + c1[0];
    let g = ((c2[1] - c1[1]) * fraction) + c1[1];
    let b = ((c2[2] - c1[2]) * fraction) + c1[2];

    return [r, g, b]
}


function draw_map_chart() {



    let chart_height = $("#seadragon_viewer").height();
    let chart_width = chart_height; // + 150;
    chart_height = chart_height + "px";
    chart_width = chart_width + "px";
    console.log("chart_height", chart_height);
    
    $("#seadragon_viewer").append(`<table class="transparent_table"><tr><td>` +
    `<div id="map_container" style="height: ${chart_height}; width: ${chart_width};"></div></td>` +
    `<td><div id="legend_container" style="height: ${chart_height}; width: 60px"></div></td></tr></table>`);
    //$("#seadragon_viewer").append(`<div id="map_container" style="height: ${chart_height}; width: ${chart_width}; margin: auto"></div>`);
    $("#map_container").append(`<div id="map_chart_tooltip" class="tooltip" style="z-index: 10"></div>`);














    chart_width = $("#map_container").width();
    chart_height = $("#map_container").height();


    let svg = d3.select("#map_container")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);

    let chart = d3.select("#map_container").select("svg").append("g");
        
    let margin = 100;



    let circle_data = [];
    let max_latitude = -10000;
    let min_latitude = 10000;
    let max_longitude = -10000;
    let min_longitude = 10000;
    let max_density = 0;
    for (dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path)
        image_name = image_name.substring(0, image_name.length - 4);

        let latitude = metadata["images"][image_name]["latitude"];
        let longitude = metadata["images"][image_name]["longitude"];
        let status = annotations[image_name]["status"];

        let color;
        if (status == "completed") {
            color = "#0080C0";
            let density = annotations[image_name]["annotations"].length / metadata["images"][image_name]["area_m2"];
            if (density > max_density) {
                max_density = density;
            }
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

        
    chart_x_axis = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (chart_height - (margin / 2)) + ")");

    chart_y_axis = svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + (margin / 2) + ", 0)");




    xScale = d3.scaleLinear()
        //.domain([min_longitude-0.0001, max_longitude+0.0001])
        .domain([min_longitude, max_longitude])
        .range([margin, chart_width - margin]);

    yScale = d3.scaleLinear()
        //.domain([min_latitude-0.0001, max_latitude+0.0001])
        .domain([min_latitude, max_latitude])
        .range([chart_height - margin, margin]);



    chart_x_axis.call(d3.axisBottom(xScale).ticks(chart_width / 100).tickFormat(x => `${x.toFixed(4)}`));
    chart_y_axis.call(d3.axisLeft(yScale).ticks(chart_height / 100).tickFormat(x => `${x.toFixed(4)}`));

    console.log("metadata", metadata);
    
    let timestamp = new Date().getTime();    

    let map_url = "/plant_detection/usr/data/image_sets/" + image_set_info["farm_name"] + "/" + 
    image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/maps/annotated_map.svg?t=" + timestamp;

    let image_exists = false;
    $.ajax({
        url: map_url,
        type: 'get',
        dataType: 'html',
        async: false,
        crossDomain: 'true',
        success: function(data, status) {
            image_exists = true;
        },
        error: function(result, textStatus, jqXHR) {
            image_exists = false;
        }
    });


    if (image_exists) {

        chart.selectAll("text")
             .data(["Number of Seedlings Per Square Metre"])
             .enter()
             .append("text")
             .attr("x", chart_width / 2)
             .attr("y", margin / 2)
             .attr("alignment-baseline", "central")
             .attr("text-anchor", "middle")
             .attr("font-size", "20px")
             .text(function(d) {
                 return d;
             });

        chart.append("svg:image")
            .attr("x", margin)
            .attr("y", margin)
            .attr("width", (chart_width - 2 * margin))
            .attr("height", chart_height - 2 * margin)
            .attr("xlink:href", map_url);


        let legend_svg = d3.select("#legend_container")
        .append("svg")
        .attr("width", "60px")
        .attr("height", chart_height);

        let cmap = d3.select("#legend_container").select("svg").append("g");

        let min_color = wheat;
        let max_color = forestgreen;
        let rects = [];
        max_density = Math.round(max_density)
        //let num_rects = max_density; //max_count;
        let num_rects = 1000;
        for (let i = 0; i < num_rects; i++) {
            let c = color_map((i / num_rects) * max_density, 0, max_density, min_color, max_color);
            rects.push({
                "color": "rgb(" + c[0] + ", " + c[1] + ", " + c[2] + ")"
            });
        }

        let legend_yScale = d3.scaleLinear()
            .domain([0, max_density])
            .range([chart_height - margin, margin]);


        let legend_y_axis = legend_svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + 60 + ", 0)");
        //legend_y_axis.call(d3.axisLeft(legend_yScale).ticks(chart_height / 100));

        console.log("max_density", max_density);

        legend_y_axis.call(d3.axisLeft(legend_yScale).tickValues([0, max_density]).tickFormat(d3.format("d")).tickSize(25));
        //legend_y_axis.call(g => g.select(".domain").remove());


        console.log("rects", rects);
        cmap.selectAll(".rect")
        .data(rects)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return 40;
        })
        .attr("y", function(d, i) {
            //return legend_yScale(i+1);
            return legend_yScale(((i+1) / num_rects) * max_density);
        })
        .attr("height", function(d, i) {
            //return 1; //legend_yScale(i) - legend_yScale(i+1) + 1;
            return legend_yScale((i / num_rects) * max_density) - legend_yScale(((i+1) / num_rects) * max_density) + 1;
        })
        .attr("width", 20)
        .attr("fill", function(d) {
            return d["color"];
        });

    }





    let tooltip = d3.select("#map_chart_tooltip");

    let tip_mouseover = function(d) {
        let html = "Image: " + d.image_name;
        tooltip.html(html)
            .style("opacity", 1.0)
            .style("left", (d3.event.pageX - 420) + "px")
            .style("top", (d3.event.pageY - 200) + "px");
        d3.select(this).style("cursor", "pointer"); 
    }

    /*
    let tip_mousemove = function(d) {
        tooltip.style("left", (d3.event.pageX - 420) + "px")
               .style("top", (d3.event.pageY - 200) + "px");
    }*/

    let tip_mouseleave = function(d) {
        tooltip.style("opacity", 0);
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
            return d["color"]; //color_map[d["method"]];
         })
         //.on("mouseover", tip_mouseover)
         //.on("mousemove", tip_mousemove)
         //.on("mouseleave", tip_mouseleave)

         .attr("stroke", "black")
         .attr("stroke-width", 1)

         .on("click", function(d) {
            //cur_img_name = d["image_name"];
            show_image();
            console.log("changing to", d["dzi_image_path"]);
            change_image(d["dzi_image_path"]);
            //alert("on click");
         })
         //.attr("cursor", "pointer")
         
         .on("mouseover", tip_mouseover)
         //.on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave);




}
