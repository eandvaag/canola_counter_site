



function draw_loss_chart(loss_records) {

    let model_uuid = $("#model_combo").val();
    console.log("model_uuid", model_uuid);

    let training_loss_vals = [];
    let validation_loss_vals = [];

    console.log("loss_records",loss_records);
    let model_loss_records = loss_records[model_uuid];
    for (loss_record of model_loss_records) {
        for (training_loss_val of loss_record["training_loss"]["values"]) {
            training_loss_vals.push(training_loss_val);
        }
        for (validation_loss_val of loss_record["validation_loss"]["values"]) {
            validation_loss_vals.push(validation_loss_val);
        }
    }

    //training_loss_vals = [20, 10, 5, 1];
    //validation_loss_vals = [25, 15, 6, 2];
    
    let training_data = [{
        "values": training_loss_vals,
        "color": "#0080C0",
        "line_name": "training_loss"
    }];
    let validation_data = [{
        "values": validation_loss_vals,
        "color": "#FF4040",
        "line_name": "validation_loss"
    }];
    


    //console.log("training_loss_vals", training_loss_vals);
    //console.log("validation_loss_vals", validation_loss_vals);


    let max_training_loss_val = Math.max.apply(null, training_loss_vals);
    let max_validation_loss_val = Math.max.apply(null, validation_loss_vals);
    let max_loss_val = Math.max.apply(null, [max_training_loss_val, max_validation_loss_val]);
    let max_epoch_val = Math.max(0, training_loss_vals.length - 1);


    let chart_width = $("#loss_chart").width();
    let chart_height = $("#loss_chart").height();

    //$("#loss_chart").empty();
    $("#loss_chart").append(`<div id="loss_chart_tooltip" class="tooltip" style="z-index: 10"></div>`);
    let loss_svg = d3.select("#loss_chart")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);



    let chart_bg = d3.select("#loss_chart").select("svg").append("g");
    let chart = d3.select("#loss_chart").select("svg").append("g");

    chart_bg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", chart_width)
        .attr("height", chart_height)
        .attr("rx", 15)
        .attr("fill", "#222621");
        //.attr("stroke", "white")
        //.attr("stroke-width", 1);

        
    let loss_margin = 58;

    let loss_chart_x_axis = loss_svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (chart_height - loss_margin) + ")");
    
    let loss_chart_y_axis = loss_svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + (loss_margin + 20) + ", 0)");

    let loss_xScale = d3.scaleLinear()
                .domain([0, max_epoch_val])
                .range([loss_margin + 20, chart_width - loss_margin]);

    let loss_yScale = d3.scaleLinear()
                .domain([0, max_loss_val])
                .range([chart_height - loss_margin, loss_margin]);


    

    loss_chart_x_axis.call(d3.axisBottom(loss_xScale).ticks(chart_width / 100));

    loss_chart_y_axis.call(d3.axisLeft(loss_yScale).ticks(chart_height / 100));


    let tooltip = d3.select("#loss_chart_tooltip");

    let tip_mouseover = function(d) {
        let label = d.line_name;
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
        l.style("opacity", 0.9);
        l.attr("stroke-width", 3);
    }



    let training_line = d3.line()
        .x(function(d, i) { return loss_xScale(i); })
        .y(function(d) { return loss_yScale(d); });


    training_lines = loss_svg.selectAll("lines")
         .data(training_data)
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
         .attr("stroke-width", 3)
         .style("opacity", 0.9)
         .on("mouseover", tip_mouseover)
         .on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave);
    

    let validation_line = d3.line()
        .x(function(d, i) { return loss_xScale(i); })
        .y(function(d) { return loss_yScale(d); });


    validation_lines = loss_svg.selectAll("lines")
         .data(validation_data)
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
         .attr("stroke-width", 3)
         .style("opacity", 0.9)
         .on("mouseover", tip_mouseover)
         .on("mousemove", tip_mousemove)
         .on("mouseleave", tip_mouseleave);


    let legend_data = [{
        "text": "Training",
        "stroke-dasharray": 0,
        "stroke": "#0080C0"
    }, {
        "text": "Validation",
        "stroke-dasharray": ("8, 8"),
        "stroke": "#FF4040"
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
      .style("stroke", function(d) {
          return d["stroke"];
      });

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