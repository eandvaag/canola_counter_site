
let metrics_plot_data;

let metrics_svg;
let metrics_xScale;
let metrics_yScale;
let metrics_chart_x_axis;
let metrics_chart_y_axis;
let metrics_margin;


const range_lookup = {
    "Image Mean Abs. Diff. in Count": [0.0, null],
    "Image Mean Sq. Diff. in Count": [0.0, null],
    "Image R Squared": [null, 1.0],
    "Image PASCAL VOC mAP": [0.0, 1.0],
    "Image MS COCO mAP": [0.0, 1.0],
    "Patch Mean Abs. Diff. in Count": [0.0, null],
    "Patch Mean Sq. Diff. in Count": [0.0, null],
    "Patch R Squared": [null, 1.0],
    "Total Inference Time (s)": [0.0, null],
    "Per-Image Inference Time (s)": [0.0, null],
    "Per-Patch Inference Time (s)": [0.0, null]     
};


function get_data_range(sel_metric, sel_cls) {

    let range = range_lookup[sel_metric];

    lower_range = range[0];
    upper_range = range[1];

    if (lower_range == null) {
        lower_range = d3.min(metrics_plot_data, function(d) { return d["metrics"][sel_metric][sel_cls]; });
    }
    if (upper_range == null) {
        upper_range = d3.max(metrics_plot_data, function(d) { return d["metrics"][sel_metric][sel_cls]; });
    }

    return [lower_range, upper_range];
}


function add_axis_class_options(axis_combo_id, axis_cls_combo_id) {

    $(axis_cls_combo_id).empty();

    let axis_metric = $(axis_combo_id).val();

    let options = Object.keys(metrics_plot_data[0]["metrics"][axis_metric]);

    for (option of options) {
        $(axis_cls_combo_id).append($('<option>', {
            value: option,
            text: option
        }));
    }

    $(axis_cls_combo_id).val(options[0]);
}

function add_axis_options(sel_metric) {

    let sorting_options = Object.keys(range_lookup);

    for (sorting_option of sorting_options) {
        $("#y_axis_combo").append($('<option>', {
            value: sorting_option,
            text: sorting_option
        }));
        $("#x_axis_combo").append($('<option>', {
            value: sorting_option,
            text: sorting_option
        }));

    }

    $("#y_axis_combo").val(sorting_options[0]);
    $("#x_axis_combo").val(sorting_options[sorting_options.length - 1]);

}





function set_metrics_plot_data() {


    metrics_plot_data = []

    for (let i = 0; i < sorted_model_uuids.length; i++) {

        metrics_plot_data.push({
            "model_name": sorted_model_names[i],
            "metrics": predictions[sorted_model_uuids[i]]["metrics"],
            "color": color_lookup[sorted_model_uuids[i]]
        });
    }

}


function draw_metrics_plot() {

    let x_axis_metric = $("#x_axis_combo").val();
    let y_axis_metric = $("#y_axis_combo").val();

    let x_axis_cls = $("#x_axis_cls_combo").val();
    let y_axis_cls = $("#y_axis_cls_combo").val();

    let div = $('#metrics_plot');

    let div_width = $("#metrics_container").width();
    let div_height = $('#metrics_plot').height();

    div.css("height", div_height);
    div.css("width", div_width);

    if (metrics_svg) {
        metrics_svg.remove();
    }

    let rect = $('#metrics_plot').get(0).getBoundingClientRect();
    let chart_x = rect["x"];
    let chart_y = rect["y"];

    metrics_margin = 58;

    let chart_width = div_width;
    let chart_height = div_height;

    metrics_svg = d3.select("#metrics_plot")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);


    let chart_bg = d3.select("#metrics_plot").select("svg").append("g");
    let chart = d3.select("#metrics_plot").select("svg").append("g");

    chart_bg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", chart_width)
        .attr("height", chart_height)
        .attr("rx", 15)
        .attr("fill", "#222621")
        .attr("stroke", "white")
        .attr("stroke-width", 1);


    metrics_chart_x_axis = metrics_svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (chart_height - metrics_margin) + ")");
    
    metrics_chart_y_axis = metrics_svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + (metrics_margin + 20) + ", 0)");


    metrics_xScale = d3.scaleLinear()
                .domain(get_data_range(x_axis_metric, x_axis_cls))
                .range([metrics_margin + 20, chart_width - metrics_margin]);

    metrics_yScale = d3.scaleLinear()
                .domain(get_data_range(y_axis_metric, y_axis_cls))
                .range([chart_height - metrics_margin, metrics_margin]);


    metrics_chart_x_axis.call(d3.axisBottom(metrics_xScale).ticks(chart_width / 100));

    metrics_chart_y_axis.call(d3.axisLeft(metrics_yScale).ticks(chart_height / 100));


    let tooltip = d3.select("#metrics_plot_tooltip");

    let tip_mouseover = function(d) {
        let html = d.model_name;
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

    chart.selectAll("circle")
         .data(metrics_plot_data)
         .enter()
         .append("circle")
         .attr("cx", function(d) {
            return metrics_xScale(d["metrics"][x_axis_metric][x_axis_cls]);
         })
         .attr("cy", function(d) {
            return metrics_yScale(d["metrics"][y_axis_metric][y_axis_cls]);
         })
         .attr("r", 7)
         .attr("fill", function(d) {
            return d["color"];
         })
         .on("mouseover", tip_mouseover)
         .on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave)
         .attr("stroke", "white")
         .attr("stroke-width", 1);


    metrics_svg.append("text")
       .attr("class", "axis_label")
       .attr("transform",
             "translate(" + (chart_width / 2) + " ," + 
                            (chart_height + (-18)) + ")")

       .style("text-anchor", "middle")
       .text(x_axis_metric);

    metrics_svg.append("text")
            .attr("class", "axis_label")
            .attr("transform", "rotate(-90)")
            .attr("y", 18)
            .attr("x", 0 - (chart_height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(y_axis_metric);
}


function update_metrics_plot() {

    let div = $('#metrics_plot');

    let div_width = $("#metrics_container").width();
    let div_height = $('#metrics_plot').height();

    div.css("height", div_height);
    div.css("width", div_width);

    let chart_width = div_width;
    let chart_height = div_height;

    let x_axis_metric = $("#x_axis_combo").val();
    let y_axis_metric = $("#y_axis_combo").val();
    let x_axis_cls = $("#x_axis_cls_combo").val();
    let y_axis_cls = $("#y_axis_cls_combo").val();


    metrics_xScale.domain(get_data_range(x_axis_metric, x_axis_cls));
    metrics_chart_x_axis.transition().duration(1000).call(d3.axisBottom(metrics_xScale).ticks(chart_width / 100));

    metrics_yScale.domain(get_data_range(y_axis_metric, y_axis_cls));
    metrics_chart_y_axis.transition().duration(1000).call(d3.axisLeft(metrics_yScale).ticks(chart_height / 100));


    d3.selectAll("circle")
        .data(metrics_plot_data)
        .transition()
        .duration(1000)
         .attr("cx", function(d) {
            return metrics_xScale(d["metrics"][x_axis_metric][x_axis_cls]);
         })
         .attr("cy", function(d) {
            return metrics_yScale(d["metrics"][y_axis_metric][y_axis_cls]);
         });


    d3.selectAll("text.axis_label").remove();

    metrics_svg.append("text")
        .attr("class", "axis_label")
        .attr("transform",
             "translate(" + (chart_width / 2) + " ," + 
                            (chart_height + (-18)) + ")")

        .style("text-anchor", "middle")
        .text(x_axis_metric);

    metrics_svg.append("text")
            .attr("class", "axis_label")
            .attr("transform", "rotate(-90)")
            .attr("y", 18)
            .attr("x", 0 - (chart_height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(y_axis_metric);
}