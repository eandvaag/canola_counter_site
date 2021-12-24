
let loss_plot_data;

let loss_svg;
let loss_xScale;
let loss_yScale;
let loss_chart_x_axis;
let loss_chart_y_axis;
let loss_margin;
let lines;

function add_training_sequence_options() {
    seq_options = ["All", "Last"];
    for (model_uuid of Object.keys(loss_records)) {
        for (seq_num of Object.keys(loss_records[model_uuid]).sort()) {
            if (!(seq_options.includes(seq_num))) {
                seq_options.push(seq_num);
            }
        }
    }


    for (seq_option of seq_options) {
        $("#sequence_combo").append($('<option>', {
            value: seq_option,
            text: seq_option
        }));
    }
    $("#sequence_combo").val(seq_options[0]);
}


function set_loss_plot_data() {

    loss_plot_data = {};

    let model_training_loss_vals = [];
    let model_validation_loss_vals = [];

    for (model_uuid of sorted_model_uuids) {

        loss_plot_data[model_uuid] = {};
        loss_plot_data[model_uuid]["training"] = {};
        loss_plot_data[model_uuid]["validation"] = {};
        loss_plot_data[model_uuid]["color"] = color_lookup[model_uuid];

        seq_nums = Object.keys(loss_records[model_uuid]).sort();
        let seq_num;
        for (let i = 0; i < seq_nums.length; i++) {

            seq_num = seq_nums[i];

            model_training_loss_vals = loss_records[model_uuid][seq_num]["training_loss"]["values"];
            model_validation_loss_vals = loss_records[model_uuid][seq_num]["validation_loss"]["values"];

            loss_plot_data[model_uuid]["training"][seq_num] = {"values": model_training_loss_vals, "breaks": []};
            loss_plot_data[model_uuid]["validation"][seq_num] = {"values": model_validation_loss_vals, "breaks": []};

            if (!("All" in loss_plot_data[model_uuid]["training"])) {
                loss_plot_data[model_uuid]["training"]["All"] = {"values": [], "breaks": []};
            }
            loss_plot_data[model_uuid]["training"]["All"]["breaks"].push(
                loss_plot_data[model_uuid]["training"]["All"]["values"].length);
            loss_plot_data[model_uuid]["training"]["All"]["values"].push(...model_training_loss_vals);
            
            if (!("All" in loss_plot_data[model_uuid]["validation"])) {
                loss_plot_data[model_uuid]["validation"]["All"] = {"values": [], "breaks": []};
            }
            loss_plot_data[model_uuid]["validation"]["All"]["breaks"].push(
                loss_plot_data[model_uuid]["validation"]["All"]["values"].length);
            loss_plot_data[model_uuid]["validation"]["All"]["values"].push(...model_validation_loss_vals);


            if (i == seq_nums.length - 1) {
                loss_plot_data[model_uuid]["training"]["Last"] = {"values": model_training_loss_vals, "breaks": []};
                loss_plot_data[model_uuid]["validation"]["Last"] = {"values": model_validation_loss_vals, "breaks": []};
            }
        }
    }
}



function create_label(str) {

    if (str.substring(str.length - 14, str.length) === "_training_loss")
        return str.substring(0, str.length - 14) + " training loss";
    else if (str.substring(str.length - 16, str.length) === "_validation_loss")
        return str.substring(0, str.length - 16) + " validation loss";
}


function get_cur_loss_plot_data() {

    let show_all = $("#loss_show_all:checked").val();
    let seq_sel = $("#sequence_combo").val();
/*
    let disp_sel = [];
    $(".disp_names:checked").each(function(i, e) { 
    for (model_uuid of sorted_model_uuids) {
        if ($("#" + model_uuid + "_label").is(":checked")) {
            disp_sel.push(model_uuid); 
        }
    }
    });*/
    let training_data = [];
    let validation_data = [];

    let model_uuid;
    let model_name;
    for (let i = 0; i < sorted_model_uuids.length; i++) {
        model_uuid = sorted_model_uuids[i];
        model_name = sorted_model_names[i];
        if ((show_all) || ($("#" + model_uuid + "_label").is(":checked"))) {
            training_data.push({
                "values": loss_plot_data[model_uuid]["training"][seq_sel]["values"],
                "breaks": loss_plot_data[model_uuid]["training"][seq_sel]["breaks"],
                "color": loss_plot_data[model_uuid]["color"],
                "line_name": model_name + "_training_loss"
            });
            validation_data.push({
                "values": loss_plot_data[model_uuid]["validation"][seq_sel]["values"],
                "breaks": loss_plot_data[model_uuid]["validation"][seq_sel]["breaks"],
                "color": loss_plot_data[model_uuid]["color"],
                "line_name": model_name + "_validation_loss"
            });
        }
    }
    return {"training_data": training_data, 
            "validation_data": validation_data};
}


function draw_loss_plot() {

    let displayed_training_data;
    let displayed_validation_data;


    cur_data = get_cur_loss_plot_data();
    displayed_training_data = cur_data["training_data"];
    displayed_validation_data = cur_data["validation_data"];



    let max_training_loss_val = 0;
    let max_validation_loss_val = 0;
    let max_epoch_val = 0;
    let model_max_training_val;
    let model_max_validation_val;
    let model_max_epoch_val;

    for (let i = 0; i < displayed_training_data.length; i++) {

        model_max_training_val = Math.max.apply(null, displayed_training_data[i]["values"]);

        if (model_max_training_val > max_training_loss_val)
            max_training_loss_val = model_max_training_val;
       
        model_max_validation_val = Math.max.apply(null, displayed_validation_data[i]["values"]);

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
        .x(function(d, i) { return loss_xScale(i); })
        .y(function(d) { return loss_yScale(d); });


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
        .x(function(d, i) { return loss_xScale(i); })
        .y(function(d) { return loss_yScale(d); });


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
