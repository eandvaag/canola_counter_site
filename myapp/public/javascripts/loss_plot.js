
let training_loss_plot_data;
let validation_loss_plot_data;

let loss_svg;
let loss_xScale;
let loss_yScale;
let loss_chart_x_axis;
let loss_chart_y_axis;
let loss_margin;
let lines;


function set_loss_plot_data() {


    training_loss_plot_data = [];
    validation_loss_plot_data = [];
    max_num_epochs = 0;
    max_training_loss_val = 0;
    max_validation_loss_val = 0;

    let model_training_loss_vals = [];
    let model_validation_loss_vals = [];

    for (let i = 0; i < sorted_model_uuids.length; i++) {

        model_training_loss_vals = loss_records[sorted_model_uuids[i]]["training_loss"]["values"];
        model_validation_loss_vals = loss_records[sorted_model_uuids[i]]["validation_loss"]["values"];

        training_loss_plot_data.push({

            "model_instance_uuid": sorted_model_uuids[i],
            "model_instance_name": sorted_model_names[i],
            "color": color_lookup[sorted_model_uuids[i]],
            "line_name": sorted_model_names[i] + "_training_loss",
            "values": model_training_loss_vals.map(function(v, j) {
                return {
                    "training_loss_val": v,
                    "epoch": j
                };
            })
        });

        validation_loss_plot_data.push({

            "model_intance_uuid": sorted_model_uuids[i],
            "model_instance_name": sorted_model_names[i],
            "color": color_lookup[sorted_model_uuids[i]],
            "line_name": sorted_model_names[i] + "_validation_loss",
            "values": model_validation_loss_vals.map(function(v, j) {
                return {
                    "validation_loss_val": v,
                    "epoch": j
                }
            })
        });
    }
}


function create_label(str) {

    if (str.substring(str.length - 14, str.length) === "_training_loss")
        return str.substring(0, str.length - 14) + " training loss";
    else if (str.substring(str.length - 16, str.length) === "_validation_loss")
        return str.substring(0, str.length - 16) + " validation loss";
}


function draw_loss_plot() {

    let displayed_training_data = [];
    let displayed_validation_data = [];

    if ($("#loss_show_all:checked").val()) {
        displayed_training_data = training_loss_plot_data;
        displayed_validation_data = validation_loss_plot_data;
    }
    else {

        let displayed_uuids = [];
        $(".disp_names:checked").each(function(i, e) {
            if ($(this).val() !== "Annotations")
                displayed_uuids.push($(this).val());
        });

        for (let i = 0; i < training_loss_plot_data.length; i++) {
            if (displayed_uuids.includes(training_loss_plot_data[i]["model_instance_uuid"])) {
                displayed_training_data.push(training_loss_plot_data[i]);
                displayed_validation_data.push(validation_loss_plot_data[i]);
            }
        }

    }


    let max_training_loss_val = 0;
    let max_validation_loss_val = 0;
    let max_epoch_val = 0;
    let model_max_training_val;
    let model_max_validation_val;
    let model_max_epoch_val;

    for (let i = 0; i < displayed_training_data.length; i++) {

        model_max_training_val = Math.max.apply(null, displayed_training_data[i]["values"].map(function(val) {
            return val["training_loss_val"];
        }));
        if (model_max_training_val > max_training_loss_val)
            max_training_loss_val = model_max_training_val;
        model_max_validation_val = Math.max.apply(null, displayed_validation_data[i]["values"].map(function(val) {
            return val["validation_loss_val"];
        }));
        if (model_max_validation_val > max_validation_loss_val)
            max_validation_loss_val = model_max_validation_val;        
        model_max_epoch_val = displayed_training_data[i]["values"].length - 1;
        if (model_max_epoch_val > max_epoch_val)
            max_epoch_val = model_max_epoch_val;
    }
    
    let max_loss_val = Math.max.apply(null, [max_training_loss_val, max_validation_loss_val]);


    let div = $('#loss_plot');

    let div_width = $("#loss_container").width();
    let div_height = $('#loss_plot').height();


    div.css("height", div_height);
    div.css("width", div_width);

    if (loss_svg) {
        loss_svg.remove();
    }

    let rect = $('#loss_plot').get(0).getBoundingClientRect();
    let chart_x = rect["x"];
    let chart_y = rect["y"];

    loss_margin = 58;

    let chart_width = div_width;
    let chart_height = div_height;

    loss_svg = d3.select("#loss_plot")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);


    let chart_bg = d3.select("#loss_plot").select("svg").append("g");
    let chart = d3.select("#loss_plot").select("svg").append("g");

    chart_bg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", chart_width)
        .attr("height", chart_height)
        .attr("rx", 15)
        .attr("fill", "#222621")
        .attr("stroke", "white")
        .attr("stroke-width", 1);

    

    loss_chart_x_axis = loss_svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (chart_height - loss_margin) + ")");
    
    loss_chart_y_axis = loss_svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + (loss_margin + 20) + ", 0)");

    loss_xScale = d3.scaleLinear()
                .domain([0, max_epoch_val])
                .range([loss_margin + 20, chart_width - loss_margin]);

    loss_yScale = d3.scaleLinear()
                .domain([0, max_loss_val])
                .range([chart_height - loss_margin, loss_margin]);


    loss_chart_x_axis.call(d3.axisBottom(loss_xScale).ticks(chart_width / 100));

    loss_chart_y_axis.call(d3.axisLeft(loss_yScale).ticks(chart_height / 100));


    let tooltip = d3.select("#loss_plot_tooltip");

    let tip_mouseover = function(d) {
        let label = create_label(d.line_name);
        tooltip.html(label)
               .style("opacity", 1.0);

        let l = d3.select("#" + d.line_name);
        l.style("opacity", 1.0);
        l.attr("stroke-width", 5);
    }

    let tip_mousemove = function(d) {
        tooltip.style("left", (d3.event.pageX+20) + "px")
               .style("top", (d3.event.pageY) + "px");
    }

    let tip_mouseleave = function(d) {
        tooltip.style("opacity", 0);
        let l = d3.select("#" + d.line_name);
        l.style("opacity", 0.8);
        l.attr("stroke-width", 2);
    }



    let training_line = d3.line()
        .x(function(d) { return loss_xScale(d["epoch"]); })
        .y(function(d) { return loss_yScale(d["training_loss_val"]); });


    training_lines = loss_svg.selectAll("lines")
         .data(displayed_training_data)
         .enter()
         .append("g");

    training_lines.append("path")
         .attr("id", function(d) {
            return d.line_name;
         })
         .attr("d", function(d) { 
            return training_line(d["values"]);
         })
         .attr("stroke", function(d) {
            return d["color"];
         })
         .attr("stroke-linecap", "round")
         .attr("stroke-dasharray", 0)
         .attr("fill", "none")
         .attr("stroke-width", 2)
         .style("opacity", 0.8)
         .on("mouseover", tip_mouseover)
         .on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave);
    


    let validation_line = d3.line()
        .x(function(d) { return loss_xScale(d["epoch"]); })
        .y(function(d) { return loss_yScale(d["validation_loss_val"]); });


    validation_lines = loss_svg.selectAll("lines")
         .data(displayed_validation_data)
         .enter()
         .append("g")
         .attr("class", "line_cls");

    validation_lines.append("path")
         .attr("id", function(d) {
            return d.line_name;
         })
         .attr("d", function(d) { 
            return validation_line(d["values"]);
         })
         .attr("stroke", function(d) {
            return d["color"];
         })
         .attr("stroke-linecap", "round")
         .attr("stroke-dasharray", ("8, 8"))
         .attr("fill", "none")
         .attr("stroke-width", 2)
         .style("opacity", 0.8)
         .on("mouseover", tip_mouseover)
         .on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave);


    let legend_data = [{
        "text": "Training",
        "stroke-dasharray": 0
    }, {
        "text": "Validation",
        "stroke-dasharray": ("8, 8")
    }];

    let legend = loss_svg.selectAll(".legend")
                         .data(legend_data)
                         .enter()
                         .append("g")
                         .attr("class", "legend")
                         .attr("transform", function(d, i) { return "translate(-25," + (45 + i*25) + ")"; });
    

    legend.append("line")
      .attr("x1", chart_width - 68)
      .attr("x2", chart_width - 28)
      .attr("y1", 10)
      .attr("y2", 10)
      .style("stroke-dasharray", function(d) {
        return d["stroke-dasharray"];
      })
      .attr("stroke-width", 2)
      .style("stroke", "white");

    legend.append("text")
      .attr("x", chart_width - 84)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d["text"]; });



    loss_svg.append("text")
       .attr("transform",
             "translate(" + (chart_width / 2) + " ," + 
                            (chart_height + (-18)) + ")")

       .style("text-anchor", "middle")
       .text("Epoch");

    loss_svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 18)
            .attr("x", 0 - (chart_height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Loss Value");
}
