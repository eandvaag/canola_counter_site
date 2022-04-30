let chart_width;
let chart_height;
let chart_x_axis;
let chart_y_axis;
let xScale;
let yScale;
let circle_data;
let line_data;

let max_vals = {
    "MS COCO mAP": 100,
    "PASCAL VOC mAP": 100,
    "Image R Squared": 1.0,
    "Patch R Squared": 1.0,
};

let color_map = {
    "direct": "#c25b44",
    "even_subset": "#4472c2",
    "graph_subset": "#44c26a"
}

let text_map = {
    "direct": "Direct method",
    "even_subset": "Even subset method",
    "graph_subset": "Graph subset method",
}

let method_order = ["direct", "even_subset", "graph_subset"];

let chart_line = d3.line()
    .x(function(d) { return xScale(d[0]); })
    .y(function(d) { return yScale(d[1]); });


function get_range(metric) {

    let max_val;
    if (metric in max_vals) {
        max_val = max_vals[metric];
    }
    else {
        max_val = -100000;
        for (method of Object.keys(results["results"])) {
            let vals = results["results"][method][metric];
            for (val of vals) {
                if (val > max_val) {
                    max_val = val;
                }
            }
        } 
    }

    return [0, max_val];

}



function draw_transfer_chart() {

    console.log("draw transfer chart");

    chart_width = $("#transfer_chart").width();
    chart_height = $("#transfer_chart").height();

    let sel_metric = $("#metric_combo").val();
    let dataset_sizes = results["dataset_sizes"];
    
    //$("#transfer_chart").append(`<div id="loss_chart_tooltip" class="tooltip" style="z-index: 10"></div>`);
    

    let svg = d3.select("#transfer_chart")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);


    let chart_bg = d3.select("#transfer_chart").select("svg").append("g");
    let chart = d3.select("#transfer_chart").select("svg").append("g");

    chart_bg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", chart_width)
        .attr("height", chart_height)
        .attr("rx", 0)
        .attr("fill", "#222621")
        .attr("stroke", "white")
        .attr("stroke-width", 2);

        
    let margin = 58;

    chart_x_axis = svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (chart_height - margin) + ")");
    
    chart_y_axis = svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + (margin + 20) + ", 0)");

    xScale = d3.scaleLinear()
                .domain([0, dataset_sizes[dataset_sizes.length-1]])
                .range([margin + 20, chart_width - margin]);

    yScale = d3.scaleLinear()
                .domain(get_range(sel_metric))
                .range([chart_height - margin, margin + 60]);


    

    chart_x_axis.call(d3.axisBottom(xScale).ticks(chart_width / 100));

    chart_y_axis.call(d3.axisLeft(yScale).ticks(chart_height / 100));

    circle_data = [];
    line_data = [];
    for (method of Object.keys(results["results"])) {
        let i = 0;
        let line = {
            "values": [],
            "method": method
        };
        for (val of results["results"][method][sel_metric]) {
            let x = results["dataset_sizes"][i];
            let y = val;
            circle_data.push({
                "x": x,
                "y": y,
                "method": method
            });
            line["values"].push([x, y])
            i++;
        }
        line_data.push(line);
    }
    console.log("circle_data", circle_data)

 /*
    chart_lines = svg.selectAll("lines")
        .data(line_data)
        .enter()
        .append("g");*/
 
        chart.selectAll("path")
        .data(line_data)
        .enter()
        .append("path")
  // chart_lines.append("path")
       //.attr("id", function(d) {
       //     return d.line_name;
       //  })
       .attr("d", function(d) { 
           return chart_line(d["values"]);
       })
       .attr("stroke", function(d) {
           return color_map[d["method"]];
       })
       .attr("stroke-linecap", "round")
       .attr("stroke-dasharray", (8,8))
       .attr("fill", "none")
       .attr("stroke-width", 3)
       .style("opacity", 0.9)


    chart.selectAll("circle")
         .data(circle_data)
         .enter()
         .append("circle")
         .attr("cx", function(d) {
            return xScale(d["x"]);
         })
         .attr("cy", function(d) {
            return yScale(d["y"]);
         })
         .attr("r", 7)
         .attr("fill", function(d) {
            return color_map[d["method"]];
         })
         //.on("mouseover", tip_mouseover)
         //.on("mousemove", tip_mousemove)
         //.on("mouseleave", tip_mouseleave)
         .attr("stroke", "white")
         .attr("stroke-width", 1);


    let legend_data = [];
    for (method of method_order) {
        legend_data.push({
            "text": text_map[method],
            "stroke": color_map[method],
            "stroke-dasharray": (8, 8)
        });
    }
    
    let legend = svg.selectAll(".legend")
                             .data(legend_data)
                             .enter()
                             .append("g")
                             .attr("class", "legend")
                             .attr("transform", function(d, i) { return "translate(-15," + (25 + i*25) + ")"; });
        
    
    legend.append("line")
        .attr("x1", chart_width - 68)
        .attr("x2", chart_width - 28)
        .attr("y1", 10)
        .attr("y2", 10)
        .style("stroke-dasharray", function(d) {
        return d["stroke-dasharray"];
        })
        .attr("stroke-width", 2)
        .style("stroke", function(d) {
            return d["stroke"];
        });

    legend.append("text")
        .attr("x", chart_width - 84)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d["text"]; });
    

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", ((chart_width / 2)))
        .attr("y", chart_height - 15)
        .text("Dataset Size");

    svg.append("text")
        .attr("id", "yAxis_text")
        .attr("text-anchor", "middle")
        .attr("x", - (chart_height / 2))
        .attr("y", margin / 2)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(sel_metric);

}


function update_transfer_chart() {
    console.log("update transfer chart");

    let sel_metric = $("#metric_combo").val();

    yScale.domain(get_range(sel_metric));
    chart_y_axis.transition().duration(1000).call(d3.axisLeft(yScale).ticks(chart_height / 100));



    circle_data = [];
    line_data = [];
    for (method of Object.keys(results["results"])) {
        let i = 0;
        let line = {
            "values": [],
            "method": method
        };
        for (val of results["results"][method][sel_metric]) {
            let x = results["dataset_sizes"][i];
            let y = val;
            circle_data.push({
                "x": x,
                "y": y,
                "method": method
            });
            line["values"].push([x, y])
            i++;
        }
        line_data.push(line);
    }

    d3.selectAll("path")
         .data(line_data)
         .transition()
         .duration(1000)
         .attr("d", function(d) { 
            return chart_line(d["values"]);
        });

    d3.selectAll("circle")
        .data(circle_data)
        .transition()
        .duration(1000)
         .attr("cx", function(d) {
            return xScale(d["x"]);
         })
         .attr("cy", function(d) {
            return yScale(d["y"]);
         });

    d3.select("#yAxis_text").text(sel_metric);

}