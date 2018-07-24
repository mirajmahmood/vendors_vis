var json_obj = {}
var orders = {}
var rates_hour = {}
var rates_distance = {}
var profits_km = {}
var profits_hour = {}

function fancyTimeFormat(time){   
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs.toFixed(2);
    return ret;
}

function update_json(errors, driverData){
	json_obj = driverData;
	update_table();

}
function get_drivers(divId){
	
	var base = document.getElementById(divId).querySelector("#base").value;
	var driver_url = "https://query.data.world/s/4to4mwlzrrpzhcxtv4m3spi5vlhnbn";
	draw_bar_chart("rate_comparison_chart");
	draw_view_rates(base)
	
	d3.queue()
	    .defer(d3.json, driver_url)
	    .await(update_json);
}


function update_table(divId="driver_map"){



	var table_headers_html = "<thead><tr><th>Vendor</th><th>Customer Location</th><th>Avg. Time to Customer</th><th>Cost(avg time)</th><th>Distance(km)</th><th>Cost(avg distance)</th><th>Travelling time</th><th>Number of Orders</th></tr></thead>";
	var table_body_html = "<tbody>";

	var driver_div = document.getElementById(divId).querySelector("#tables");
	driver_div.innerHTML = ""

	var cost = document.getElementById(divId).querySelector("#cost").value;
	var cost_per_min = cost/60;
	var base = document.getElementById(divId).querySelector("#base").value;
	var rate_km = document.getElementById(divId).querySelector("#rate_km").value;

	var rates_perhour_sum = 0;
	var rates_perdistance_sum = 0;
	Object.keys(json_obj).forEach(function(branch){
		var number_of_orders = 0
		var total_cost_hour = 0
		var total_cost_distance = 0
		var total_revenue = 0
		var total_time = 0
		var total_distance = 0
		var table_body_html = "<tbody>";

		Object.keys(json_obj[branch]).forEach(function(customer_location){
			var row = "";
			

			var avg_time_order = (json_obj[branch][customer_location]['time_to_customer']/json_obj[branch][customer_location]['order_num']);
			//branch
			row = "<td id='branch'>" + branch + "</td>";
			//customer location
			row += "<td id='customer_location'>" + customer_location + "</td>";
			//average basket size
			// row += "<td>" + (json_obj[branch][customer_location]['basket_size']/json_obj[branch][customer_location]['order_num']).toFixed(2) + "</td>";
			//average time to customer
			row += "<td id='avg_time_order'>" + avg_time_order.toFixed(2) + "</td>";
			//average cost per order per hour
			row += "<td id='cost_per_order_per_hour'>" + (cost_per_min*avg_time_order).toFixed(2) + "</td>";
			//distance to customer
			row += "<td id='distance_to_customer'>" + parseFloat(json_obj[branch][customer_location]['distance']/1000).toFixed(2) + "</td>";
			//cost per order per km
			row += "<td id='cost_per_order_per_km'>" + (rate_km*parseFloat(json_obj[branch][customer_location]['distance']/1000)).toFixed(2) + "</td>";
			//time travel to customer
			row += "<td id='time_travel_to_customer'>" + (json_obj[branch][customer_location]['duration']/60).toFixed(2) + "</td>";
			//number of orders
			row += "<td id='number_of_orders'>" + json_obj[branch][customer_location]['order_num'] + "</td>";

			number_of_orders += parseInt(json_obj[branch][customer_location]['order_num']);
			total_cost_hour += (cost_per_min*avg_time_order) * json_obj[branch][customer_location]['order_num'] 
			total_revenue += json_obj[branch][customer_location]['basket_size'] 
			total_time += json_obj[branch][customer_location]['time_to_customer']
			total_distance += json_obj[branch][customer_location]['distance'] * parseInt(json_obj[branch][customer_location]['order_num']);
			table_body_html += "<tr>" + row + "</tr>";
		});
		table_body_html += "</tbody>";

		var table_html = "<table id='b2c_driver_table_"+branch.split(' ').join('')+"' class='tablesorter'>" +table_headers_html + table_body_html+ "</table>";
		var driver_details = "<div id='table_details'> <h4>" ;
		var rate_perhour = ((((total_cost_hour/number_of_orders) - base)/ (total_time/number_of_orders))*60)
		var avg_distance = parseFloat((total_distance/1000)/number_of_orders)
		var rate_perdistance = ((cost * avg_distance) - base)/avg_distance


		driver_details += "Total orders from " + branch + ": "+ number_of_orders + "<br><br>" + "<br><br>"	
		driver_details += "Avg. time per order: " + (total_time/number_of_orders).toFixed(2) + "<br><br>"
		driver_details += "Cost per order (calculated by the avg time): " +(cost_per_min*(total_time/number_of_orders)).toFixed(2)+ "<br><br>"

		driver_details += "Total cost (calculated by the hour): " + total_cost_hour.toFixed(2) + "<br><br>"
		// driver_details += "Total profit: " + (total_revenue - total_cost_hour).toFixed(2) + "<br><br>"
		
		// driver_details += "Rate per hour: " +rate_perhour.toFixed(2)+ "<br><br>"
		driver_details += "<br><br>"
		driver_details += "Avg. distance per order: " + avg_distance.toFixed(2) + "<br><br>"
		driver_details += "Cost per order (calculated by distance): " +(rate_km*avg_distance).toFixed(2)+ "<br><br>"
		driver_details += "Total cost (calculated by distance): " +(rate_km*parseFloat(total_distance/1000)).toFixed(2)+ "<br><br>"
		// driver_details += "Total profit (calculated by distance): " + (total_revenue - (rate_km*parseFloat(total_distance/1000))).toFixed(2) + "<br><br>"
		
		rates_perhour_sum += rate_perhour 
		rates_perdistance_sum += rate_perdistance 
		// driver_details += (cost_hour-0.250)/orders_hour.toFixed(3)+ "<br><br>"

		driver_details += "</h4> </div>"
		
		driver_div.innerHTML += "<h3>" + branch + "</h3>"
		driver_div.innerHTML += "<div id='table_div'>" + table_html + driver_details +"</div>"+ "<br>"

		rates_distance[branch] = (rate_km*avg_distance)
		rates_hour[branch] = (cost_per_min*(total_time/number_of_orders))

		profits_km[branch] = (total_revenue - (rate_km*(parseFloat(total_distance/1000))))
		profits_hour[branch] = (total_revenue - total_cost_hour)
		orders[branch] = number_of_orders

	});

	Object.keys(json_obj).forEach(function(branch){
		$("#b2c_driver_table_"+ branch.split(' ').join('')).tablesorter(); 

	});
	document.getElementById(divId).querySelector("#rate").innerHTML = "";//"Rate (per hour): "+(rates_perhour_sum/Object.keys(json_obj).length).toFixed(2) + " KD" + "<br/><br/>" ;//+ "Rate (per km): "+(rates_perdistance_sum/Object.keys(json_obj).length).toFixed(2) + " KD"

	var value_cost = document.getElementById("cost_analysis").value;
	toggle_cost_analysis(value_cost)
	update_view_rates(base);
	

}
function toggle_cost_analysis(value){
	var heading_km = document.getElementById("cost_head_km");
	var heading_hr = document.getElementById("cost_head_hr");

	if (value == "cost"){
		heading_hr.innerText = "Cost"
		heading_km.innerText = "Cost"
		update_bar_chart(rates_distance, rates_hour);
	}
	else if(value == "profit"){
		heading_hr.innerText = "Profit"
		heading_km.innerText = "Profit"
		update_bar_chart_profits(profits_km, profits_hour);
	}
}


function update_input_field(value){
	document.getElementById("driver_map").querySelector("#cost").value = value;

}
function draw_view_rates(base, divId="view_rates"){

		var margin = {top: 20, right: 20, bottom: 30, left: 50},
	    	width = 1300,
			height = 300;

		
		var n = 19;
		x_data = Array.apply(null, {length: n}).map((d,i) => i)
		y_data = Array.apply(null, {length: n}).map((d,i) => (isFinite(base/i) ? (base/i) : 0.0))
		
		var xScale = d3.scaleLinear()
		    .domain([0, n])
		    .range([0, width])
		    .nice(); 

		
		var yScale = d3.scaleLinear()
		    .domain([d3.min(y_data), d3.max(y_data) ]) 
		    .range([height, 0]); 

		var line = d3.line()
		    .x(function(d, i){return xScale(x_data[i]) }) 
		    .y(function(d) { return yScale(d.y); }) 
		    .curve(d3.curveMonotoneX) 

		
		var dataset = d3.range(n).map(function(d, i) { 
		
			if (y_data[d]==null){
				return {
				"y": 0 
					} 
				}

			return {
				"y": parseFloat(y_data[d]) 
			} 

		})
		
		
		var svg = d3.select("#"+divId).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg.append("text")
		    .attr("id", "x_label")      
			.attr("transform",
			    "translate(" + (width/2) + " ," + 
			                   (height + margin.top+10) + ")")
			.style("text-anchor", "middle")
			.text("Kilometeres");

		svg.append("g")
		    .attr("class", "xaxis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(d3.axisBottom(xScale));

	  svg.append("text")
	  		.attr("id", "y_label") 
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x",0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Rate per km"); 


}
function draw_bar_chart(divId){
	var width = 450,
		height = 500

    	var margin = {top: 20, right: 20, bottom: 95, left: 50};
		var svg_bar = d3.select("#"+divId+"_hour").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var svg_bar = d3.select("#"+divId+"_km").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");



}

function update_bar_chart(data_one, data_two, divId="rate_comparison_chart"){

	var total_num = 0

	Object.keys(data_two).forEach(function(key) {
		total_num += data_two[key];
	});

	var width = 450,
		height = 500
		var z = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
	z.domain([0, Object.keys(data_two).length]);
	var barWidth = 20;//width / d3.values(data_two).length;
///////bar
	var num_ticks = d3.values(data_two).length

	var x = d3.scaleLinear()
		.domain([0, d3.values(data_two).length]).nice(num_ticks)
        .rangeRound([0, width]);

    var ticks = x.ticks(num_ticks);

    var y = d3.scaleLinear()
        .domain([0, d3.max(d3.values(data_two).concat(d3.values(data_one)))]).nice(8)
        .range([height, 0]);

    
    $("#mySVGtooltip_bar_hour").each(function(d) {
        $(this).remove();
    });
	var tool_tip_bar_hour = d3.tip()
		.attr("class", "d3-tip")
		.offset([0, 80])
		.html("<div id='mySVGtooltip_bar_hour' class='driver'></div>");

	var svg_bar = 
		d3.select("#"+divId +"_hour"+" svg g").selectAll("rect")
			.remove()
			.exit()
			.data(Object.keys(data_two))

	var g = svg_bar.enter()
			.append("rect")
			.attr("class", "bar")
	        .attr("x", (d,i) => i * barWidth + 1 )
	        .attr("y", (d, i) => y(data_two[d]))
	        .attr("width", barWidth-1)
	        .attr("height", function(d,i) { return (height - y(data_two[d])); })
	        .attr("id", function(d, i){
	        	
	        	return d+divId+"_hour";
	        })
	        .attr("fill", function(d,i){ return z(i)})
	        .style("stroke-width", 0.5)
	        .style('stroke', "#000");

	g.call(tool_tip_bar_hour);

	g
    	.on('mouseover', function(d, i) {

    		d3.select(this)
    			.style("stroke-width", 2)
    			.style('stroke', "#000");

    	    tool_tip_bar_hour.show();
			var tool_tip_bar_w = 170,
				tool_tip_bar_h = 70;
		

			var tooltipbarSVG = d3.select("#mySVGtooltip_bar_hour")
				.append("svg")
				.attr("width", tool_tip_bar_w)
				.attr("height", tool_tip_bar_h)
				.style("background", "rgba(0, 0, 0, 0.6)")
				.style("border", "1px solid black")
				.attr("fill-opacity", "1")
				.style('z-index',3);

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 20)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Area: "+d);
					

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 35)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Cost /hour: "+data_two[d].toFixed(2));

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 50)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Total Cost: "+(data_two[d]*orders[d]).toFixed(2));
					
    		
    	})
    	.on('mouseout', function(d, i) {
    		
    		d3.select(this)
    			.style("stroke-width", 0.5);

    		tool_tip_bar_hour.hide();



    	});
    	

	var total_num = 0

	Object.keys(data_one).forEach(function(key) {
		total_num += data_one[key];
	});

	var width = 450,
		height = 500
		var z = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
	z.domain([0, Object.keys(data_one).length]);
	var barWidth = 20;//width / d3.values(data_one).length;
///////bar
	var num_ticks = d3.values(data_one).length

	var x = d3.scaleLinear()
		.domain([0, d3.values(data_one).length]).nice(num_ticks)
        .rangeRound([0, width]);

    var ticks = x.ticks(num_ticks);

    var y = d3.scaleLinear()
        .domain([0, d3.max(d3.values(data_two).concat(d3.values(data_one)))]).nice(8)
        .range([height, 0]);

    
    $("#mySVGtooltip_bar").each(function(d) {
        $(this).remove();
    });
	var tool_tip_bar = d3.tip()
		.attr("class", "d3-tip")
		.offset([0, 80])
		.html("<div id='mySVGtooltip_bar' class='driver'></div>");

	var svg_bar = 
		d3.select("#"+divId +"_km"+" svg g").selectAll("rect")
			.remove()
			.exit()
			.data(Object.keys(data_one))

	var g = svg_bar.enter()
			.append("rect")
			.attr("class", "bar")
	        .attr("x", (d,i) => i * barWidth + 1 )
	        .attr("y", (d, i) => y(data_one[d]))
	        .attr("width", barWidth-1)
	        .attr("height", function(d,i) { return (height - y(data_one[d])); })
	        .attr("id", function(d, i){
	        	
	        	return d+divId+"_km";
	        })
	        .attr("fill", function(d,i){ return z(i)})
	        .style("stroke-width", 0.5)
	        .style('stroke', "#000");

	g.call(tool_tip_bar);

	g
    	.on('mouseover', function(d, i) {

    		d3.select(this)
    			.style("stroke-width", 2)
    			.style('stroke', "#000");

    	    tool_tip_bar.show();
			var tool_tip_bar_w = 170,
				tool_tip_bar_h = 70;
		

			var tooltipbarSVG = d3.select("#mySVGtooltip_bar")
				.append("svg")
				.attr("width", tool_tip_bar_w)
				.attr("height", tool_tip_bar_h)
				.style("background", "rgba(0, 0, 0, 0.6)")
				.style("border", "1px solid black")
				.attr("fill-opacity", "1")
				.style('z-index',3);

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 20)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Area: "+d);
					

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 35)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Cost /km: "+data_one[d].toFixed(2));

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 50)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Total Cost: "+(data_one[d]*orders[d]).toFixed(2));
					
    		
    	})
    	.on('mouseout', function(d, i) {
    		
    		d3.select(this)
    			.style("stroke-width", 0.5);

    		tool_tip_bar.hide();



    	});
/////////

}

function update_view_rates(base, divId="view_rates"){
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
    	width = 1300,
		height = 300;

	var n = 19;
	base = 1- base
	x_data = Array.apply(null, {length: n}).map((d,i) => i)
	y_data = Array.apply(null, {length: n}).map((d,i) => (isFinite(base/i) ? (base/i) : 0.0))


	var dataset = d3.range(n).map(function(d, i) { 
	
		if (y_data[d]==null){
			return {
			"y": 0 
				} 
			}

		return {
			"y": parseFloat(y_data[d]) 
		} 

	})

	var svg = 
		d3.select("#"+divId +" svg g").selectAll(".line")
			.remove()
			.exit()
			.data([dataset])
		
	
	$("#"+divId +" svg g.y.axis").each(function(d) {
        $(this).remove();
    });


	var xScale = d3.scaleLinear()
	    .domain([0, n])
	    .range([0, width])
	    .nice(); 

	
	var yScale = d3.scaleLinear()
	    .domain([0, d3.max(y_data) ]) 
	    .range([height, 0]); 

	var line = d3.line()
	    .x(function(d, i){return xScale(x_data[i]) }) 
	    .y(function(d) { return yScale(d.y); })
	    .curve(d3.curveMonotoneX);


	var g = svg.enter()
			.append("path")
		    .datum(dataset) 
		    .attr("class", "line") 
		    .attr("d", line) 
		    .attr("stroke-width", "3")
			.attr("fill", "none")
			.attr("stroke", "#ffab00");

	svg.enter()
			.append("g")
			.attr("class", "y axis")
			.call(d3.axisLeft(yScale)); 
 

	$("#mySVGtooltip"+divId+"_line").each(function(d) {
        $(this).remove();
    });

	var tool_tip_line = d3.tip()
		.attr("class", "d3-tip")
		.offset([350, -20])
		.html("<div id='mySVGtooltip"+divId+"_line' class='driver'></div>");

	g.call(tool_tip_line)


	g
    	.on('mouseover', function(di, i) {
    	
			tool_tip_line.show();
			var tool_tip_line_w = 90,
				tool_tip_line_h = 45;
		

			var tooltiplineSVG = d3.select("#mySVGtooltip"+divId+"_line")
				.append("svg")
				.attr("width", tool_tip_line_w)
				.attr("height", tool_tip_line_h)
				.style("border", "1px solid black");

			tooltiplineSVG.append("text")
					.attr("x", 5)
					.attr("y", 15)
					.attr("dy", ".35em")
					.style("fill", "black")
					.style('font-size', 11)
					.text("Km:" + xScale.invert(d3.mouse(this)[0]).toFixed(2));

			tooltiplineSVG.append("text")
					.attr("x", 5)
					.attr("y", 30)
					.attr("dy", ".35em")
					.style("fill", "black")
					.style('font-size', 11)
					.text("\nRate: "+ yScale.invert(d3.mouse(this)[1]).toFixed(2));

    		
    	})
    	.on('mouseout', function(di, i) {
    		tool_tip_line.hide();
    			
    	});
}

function update_bar_chart_profits(data_one, data_two, divId="rate_comparison_chart"){

	var total_num = 0

	Object.keys(data_two).forEach(function(key) {
		total_num += data_two[key];
	});

	var width = 450,
		height = 500
		var z = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
	z.domain([0, Object.keys(data_two).length]);
	var barWidth = 20;//width / d3.values(data_two).length;
///////bar
	var num_ticks = d3.values(data_two).length

	var x = d3.scaleLinear()
		.domain([0, d3.values(data_two).length]).nice(num_ticks)
        .rangeRound([0, width]);

    var ticks = x.ticks(num_ticks);

    var y = d3.scaleLinear()
        .domain([0, d3.max(d3.values(data_two).concat(d3.values(data_one)))]).nice(8)
        .range([height, 0]);

    
    $("#mySVGtooltip_bar_hour").each(function(d) {
        $(this).remove();
    });
	var tool_tip_bar_hour = d3.tip()
		.attr("class", "d3-tip")
		.offset([0, 80])
		.html("<div id='mySVGtooltip_bar_hour' class='driver'></div>");

	var svg_bar = 
		d3.select("#"+divId +"_hour"+" svg g").selectAll("rect")
			.remove()
			.exit()
			.data(Object.keys(data_two))

	var g = svg_bar.enter()
			.append("rect")
			.attr("class", "bar")
	        .attr("x", (d,i) => i * barWidth + 1 )
	        .attr("y", (d, i) => y(data_two[d]))
	        .attr("width", barWidth-1)
	        .attr("height", function(d,i) { return (height - y(data_two[d])); })
	        .attr("id", function(d, i){
	        	
	        	return d+divId+"_hour";
	        })
	        .attr("fill", function(d,i){ return z(i)})
	        .style("stroke-width", 0.5)
	        .style('stroke', "#000");

	g.call(tool_tip_bar_hour);

	g
    	.on('mouseover', function(d, i) {

    		d3.select(this)
    			.style("stroke-width", 2)
    			.style('stroke', "#000");

    	    tool_tip_bar_hour.show();
			var tool_tip_bar_w = 170,
				tool_tip_bar_h = 70;
		

			var tooltipbarSVG = d3.select("#mySVGtooltip_bar_hour")
				.append("svg")
				.attr("width", tool_tip_bar_w)
				.attr("height", tool_tip_bar_h)
				.style("background", "rgba(0, 0, 0, 0.6)")
				.style("border", "1px solid black")
				.attr("fill-opacity", "1")
				.style('z-index',3);

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 20)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Area: "+d);
					

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 35)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Total Profit: "+data_two[d].toFixed(2));

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 50)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Profit /order: "+(data_two[d]/orders[d]).toFixed(2));
    		
    	})
    	.on('mouseout', function(d, i) {
    		
    		d3.select(this)
    			.style("stroke-width", 0.5);

    		tool_tip_bar_hour.hide();



    	});
    	

	var total_num = 0

	Object.keys(data_one).forEach(function(key) {
		total_num += data_one[key];
	});

	var width = 450,
		height = 500
		var z = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
	z.domain([0, Object.keys(data_one).length]);
	var barWidth = 20;//width / d3.values(data_one).length;
///////bar
	var num_ticks = d3.values(data_one).length

	var x = d3.scaleLinear()
		.domain([0, d3.values(data_one).length]).nice(num_ticks)
        .rangeRound([0, width]);

    var ticks = x.ticks(num_ticks);

    var y = d3.scaleLinear()
        .domain([0, d3.max(d3.values(data_two).concat(d3.values(data_one)))]).nice(8)
        .range([height, 0]);

    
    $("#mySVGtooltip_bar").each(function(d) {
        $(this).remove();
    });
	var tool_tip_bar = d3.tip()
		.attr("class", "d3-tip")
		.offset([0, 80])
		.html("<div id='mySVGtooltip_bar' class='driver'></div>");

	var svg_bar = 
		d3.select("#"+divId +"_km"+" svg g").selectAll("rect")
			.remove()
			.exit()
			.data(Object.keys(data_one))

	var g = svg_bar.enter()
			.append("rect")
			.attr("class", "bar")
	        .attr("x", (d,i) => i * barWidth + 1 )
	        .attr("y", (d, i) => y(data_one[d]))
	        .attr("width", barWidth-1)
	        .attr("height", function(d,i) { return (height - y(data_one[d])); })
	        .attr("id", function(d, i){
	        	
	        	return d+divId+"_km";
	        })
	        .attr("fill", function(d,i){ return z(i)})
	        .style("stroke-width", 0.5)
	        .style('stroke', "#000");

	g.call(tool_tip_bar);

	g
    	.on('mouseover', function(d, i) {

    		d3.select(this)
    			.style("stroke-width", 2)
    			.style('stroke', "#000");

    	    tool_tip_bar.show();
			var tool_tip_bar_w = 170,
				tool_tip_bar_h = 70;
		

			var tooltipbarSVG = d3.select("#mySVGtooltip_bar")
				.append("svg")
				.attr("width", tool_tip_bar_w)
				.attr("height", tool_tip_bar_h)
				.style("background", "rgba(0, 0, 0, 0.6)")
				.style("border", "1px solid black")
				.attr("fill-opacity", "1")
				.style('z-index',3);

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 20)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Area: "+d);
					

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 35)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Total Profit: "+data_one[d].toFixed(2));

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 50)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Profit /order: "+(data_one[d]/orders[d]).toFixed(2));

					
    		
    	})
    	.on('mouseout', function(d, i) {
    		
    		d3.select(this)
    			.style("stroke-width", 0.5);

    		tool_tip_bar.hide();



    	});
/////////

}

