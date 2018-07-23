var json_obj = {}
var orders = {}
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
	
	var driver_url = "https://query.data.world/s/4to4mwlzrrpzhcxtv4m3spi5vlhnbn";
	draw_bar_chart("rate_comparison_chart");
	
	d3.queue()
	    .defer(d3.json, driver_url)
	    .await(update_json);
}


function update_table(divId="driver_map"){

	var rates_hour = {}
	var rates_distance = {}

	var table_headers_html = "<thead><tr><th>Vendor</th><th>Customer Location</th><th>Avg. Time to Customer</th><th>Cost per order(hour)</th><th>Distance(km)</th><th>Cost per order(km)</th><th>Travelling time</th><th>Number of Orders</th></tr></thead>";
	var table_body_html = "<tbody>";

	var driver_div = document.getElementById(divId).querySelector("#tables");
	driver_div.innerHTML = ""

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

		var cost = document.getElementById(divId).querySelector("#cost").value;
		var cost_per_min = cost/60;
		var base = document.getElementById(divId).querySelector("#base").value;


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
			row += "<td id='cost_per_order_per_km'>" + (cost_per_min*parseFloat(json_obj[branch][customer_location]['distance']/1000)).toFixed(2) + "</td>";
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

		driver_details += "Total orders from " + branch + ": "+ number_of_orders + "<br><br>"		
		driver_details += "Total cost: " + total_cost_hour.toFixed(2) + "<br><br>"
		driver_details += "Total profit: " + (total_revenue - total_cost_hour).toFixed(2) + "<br><br>"
		driver_details += "Avg. time per order: " + (total_time/number_of_orders).toFixed(2) + "<br><br>"
		driver_details += "Rate per hour: " +rate_perhour.toFixed(2)+ "<br><br>"
		driver_details += "<br><br>"
		driver_details += "Avg. distance per order: " + avg_distance.toFixed(2) + "<br><br>"
		driver_details += "Rate per km: " +rate_perdistance.toFixed(2)+ "<br><br>"
		rates_perhour_sum += rate_perhour 
		rates_perdistance_sum += rate_perdistance 
		// driver_details += (cost_hour-0.250)/orders_hour.toFixed(3)+ "<br><br>"

		driver_details += "</h4> </div>"
		
		driver_div.innerHTML += "<h3>" + branch + "</h3>"
		driver_div.innerHTML += "<div id='table_div'>" + table_html + driver_details +"</div>"+ "<br>"

		rates_distance[branch] = rate_perdistance  * avg_distance * number_of_orders
		rates_hour[branch] = (rate_perhour) * (total_time)
		orders[branch] = number_of_orders

	});

	Object.keys(json_obj).forEach(function(branch){
		$("#b2c_driver_table_"+ branch.split(' ').join('')).tablesorter(); 

	});
	document.getElementById(divId).querySelector("#rate").innerHTML = "Rate (per hour): "+(rates_perhour_sum/Object.keys(json_obj).length).toFixed(2) + " KD" + "<br/><br/>" + "Rate (per km): "+(rates_perdistance_sum/Object.keys(json_obj).length).toFixed(2) + " KD"
	update_bar_chart(rates_distance, rates_hour);

}

function update_input_field(value){
	document.getElementById("driver_map").querySelector("#cost").value = value;

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
	console.log(data_one, data_two)
	var jsonData = data_one
	var total_num = 0

	Object.keys(jsonData).forEach(function(key) {
		total_num += jsonData[key];
	});

	var width = 450,
		height = 500
		var z = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
	z.domain([0, Object.keys(jsonData).length]);
	var barWidth = 20;//width / d3.values(jsonData).length;
///////bar
	var num_ticks = d3.values(jsonData).length

	var x = d3.scaleLinear()
		.domain([0, d3.values(jsonData).length]).nice(num_ticks)
        .rangeRound([0, width]);

    var ticks = x.ticks(num_ticks);

    var y = d3.scaleLinear()
        .domain([0, d3.max(d3.values(jsonData))]).nice(8)
        .range([height, 0]);

    
    $("#mySVGtooltip_bar").each(function(d) {
        $(this).remove();
    });
	var tool_tip_bar = d3.tip()
		.attr("class", "d3-tip")
		.offset([0, 80])
		.html("<div id='mySVGtooltip_bar' class='driver'></div>");

	var svg_bar = 
		d3.select("#"+divId +"_hour"+" svg g").selectAll("rect")
			.remove()
			.exit()
			.data(Object.keys(jsonData))

	var g = svg_bar.enter()
			.append("rect")
			.attr("class", "bar")
	        .attr("x", (d,i) => i * barWidth + 1 )
	        .attr("y", (d, i) => y(jsonData[d]))
	        .attr("width", barWidth-1)
	        .attr("height", function(d,i) { return (height - y(jsonData[d])); })
	        .attr("id", function(d, i){
	        	
	        	return d+divId+"_hour";
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
					.text("\n Total Cost: "+jsonData[d].toFixed(2));

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 50)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Cost /hour: "+(jsonData[d]/orders[d]).toFixed(2));
					
    		
    	})
    	.on('mouseout', function(d, i) {
    		
    		d3.select(this)
    			.style("stroke-width", 0.5);

    		tool_tip_bar.hide();



    	});
    	


	var jsonData = data_two
	var total_num = 0

	Object.keys(jsonData).forEach(function(key) {
		total_num += jsonData[key];
	});

	var width = 450,
		height = 500
		var z = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
	z.domain([0, Object.keys(jsonData).length]);
	var barWidth = 20;//width / d3.values(jsonData).length;
///////bar
	var num_ticks = d3.values(jsonData).length

	var x = d3.scaleLinear()
		.domain([0, d3.values(jsonData).length]).nice(num_ticks)
        .rangeRound([0, width]);

    var ticks = x.ticks(num_ticks);

    var y = d3.scaleLinear()
        .domain([0, d3.max(d3.values(jsonData))]).nice(8)
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
			.data(Object.keys(jsonData))

	var g = svg_bar.enter()
			.append("rect")
			.attr("class", "bar")
	        .attr("x", (d,i) => i * barWidth + 1 )
	        .attr("y", (d, i) => y(jsonData[d]))
	        .attr("width", barWidth-1)
	        .attr("height", function(d,i) { return (height - y(jsonData[d])); })
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
					.text("\n Total Cost: "+jsonData[d].toFixed(2));

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 50)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 13)
					.text("\n Cost /km: "+(jsonData[d]/orders[d]).toFixed(2));
					
    		
    	})
    	.on('mouseout', function(d, i) {
    		
    		d3.select(this)
    			.style("stroke-width", 0.5);

    		tool_tip_bar.hide();



    	});
/////////

}

