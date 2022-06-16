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

    let chart_height = $("#seadragon_viewer").height() + "px";
    let chart_width = chart_height;


    $("#chart_container").empty();
    $("#chart_container").append(
        `<table class="transparent_table">` +
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



    chart_width = $("#map_container").width();
    chart_height = $("#map_container").height();


    let svg = d3.select("#map_container")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);

    let chart = d3.select("#map_container").select("svg").append("g");
        
    let margin = 110;



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
        if ((status === "completed_for_training") || (status === "completed_for_testing")) {
            color = "#0080C0";
            let density = annotations[image_name]["annotations"].length / metadata["images"][image_name]["area_m2"];
            if (Math.ceil(density) > max_density) {
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
    

    if (map_url !== null) {

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
            .attr("class", "map_legend axis")
            .attr("transform", "translate(" + 60 + ", 0)");

        console.log("max_density", max_density);

        legend_y_axis.call(d3.axisLeft(legend_yScale).tickValues([0, max_density]).tickFormat(d3.format("d")).tickSize(25));

        cmap.selectAll(".rect")
        .data(rects)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return 40;
        })
        .attr("y", function(d, i) {
            return legend_yScale(((i+1) / num_rects) * max_density);
        })
        .attr("height", function(d, i) {
            return legend_yScale((i / num_rects) * max_density) - legend_yScale(((i+1) / num_rects) * max_density) + 1;
        })
        .attr("width", 20)
        .attr("fill", function(d) {
            return d["color"];
        });

    }





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
            show_image(d["image_name"]);
            //change_image(d["image_name"]);
         })
         .on("mouseover", tip_mouseover)
         .on("mouseleave", tip_mouseleave);

}

