let pie_path;
let radius;
let arc;

//var pie_color = d3.scale.category20();

function draw_ground_cover_chart() {

    let chart_width = $("#ground_cover_chart").width(); // - 5;
    let chart_height = $('#ground_cover_chart').height(); // - 5;

    radius = Math.min(chart_width, chart_height) / 2; // - 10;

    arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);


    let ground_cover_svg = d3.select("#ground_cover_chart")
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);

    pie_path = ground_cover_svg
        .append("g")
        .attr("transform", "translate(" + chart_width / 2 + "," + chart_height / 2 + ")");

    let colors = ["#45633d", "#ffffff"];

    let pie = d3.pie()
                .value(function(d) { return d.value; }).sort(null);

    let ground_cover_percentage = excess_green_record[cur_img_name]["ground_cover_percentage"]
    let data = [ground_cover_percentage, 100 - ground_cover_percentage];

    let data_ready = pie(d3.entries(data));


    pie_path.selectAll("path")
       .data(data_ready)
       .enter()
       .append("path")

        .attr("fill", function(d, i) { return colors[i]; })
        .attr("d", arc)
        .each(function(d) { this._current = d; }); 
        //.each(function (d) {
        //    this._current = d;
        //}); // store the initial angles;
        //.attr("stroke", "black")
        //.style("stroke-width", "2px")
        //.style("opacity", 0.7);

}


function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return arc(i(t));
    };
}



function update_ground_cover_chart() {



    //let chart_width = $("#count_chart").width() - 10;

    //let sel_class = "plant"; //$("#class_combo").val();

    //count_xScale.domain([0, max_count]);
    //count_chart_axis.transition().duration(250).call(d3.axisTop(count_xScale).ticks(chart_width / 100)); //.tickFormat(d3.format("d")));

    // let chart_width = $("#ground_cover_chart").width() - 10;
    // let chart_height = $('#ground_cover_chart').height() - 10;

    // let radius = Math.min(chart_width, chart_height) / 2; // - 10;


    let ground_cover_percentage = excess_green_record[cur_img_name]["ground_cover_percentage"]
    let data = [ground_cover_percentage, 100 - ground_cover_percentage];

    let pie = d3.pie()
                .value(function(d) { return d.value; }).sort(null);

    
    let data_ready = pie(d3.entries(data));

    let colors = ["#45633d", "#ffffff"];

    pie_path.selectAll("path")
       .data(data_ready)
       .transition()
       .duration(250)
       .attrTween("d", arcTween);
       //.attr("d", d3.arc()
       //     .innerRadius(0)
       //     .outerRadius(radius)
       // )
       //.enter()
       //.append("path")
       /*
       .attr("d", d3.arc()
            .innerRadius(0)
            .outerRadius(radius)
        )*/
        /*
        .attr("fill", function(d, i) { return colors[i]; })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7);*/
/*
    d3.selectAll("pie")
        .data(data_ready) //[sel_class])
        .transition()
        .duration(250)
        .attr("d", d3.arc()
            .innerRadius(0)
            .outerRadius(radius)
        );*/
    /*
        .attr("x", function(d, i) {
            return 3 * count_margin;
        })
        .attr("width", function(d) {
            return count_xScale(count_chart_data[cur_img_name][d]) - 2 * count_margin;
        });*/
}