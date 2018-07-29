var json_obj = {}
var orders = {}
var rates_hour = {}
var rates_distance = {}
var profits_km = {}
var profits_hour = {}
var speeds = {}
var rates = {}
var rate = 0
var max_cost = 1
var max_rate_cost = 0

var myMixedChart = null;
var chartData = {}

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

	var divId = "driver_map"
	var cost = document.getElementById(divId).querySelector("#cost").value;

	json_obj = driverData;
	draw_profit_chart();

	update_table();

	calculate_rates(cost);
	document.getElementById(divId).querySelector("#rate_km").value = rate.toFixed(3);

	update_total_cost(divId);
	

	

}
function get_drivers(divId){
	
	var base = document.getElementById(divId).querySelector("#base").value;
	var driver_url = "https://query.data.world/s/4to4mwlzrrpzhcxtv4m3spi5vlhnbn";
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

		driver_details += "<br><br>"
		driver_details += "Avg. distance per order: " + avg_distance.toFixed(2) + "<br><br>"
		driver_details += "Cost per order (calculated by distance): " +(rate_km*avg_distance).toFixed(2)+ "<br><br>"
		driver_details += "Total cost (calculated by distance): " +(rate_km*parseFloat(total_distance/1000)).toFixed(2)+ "<br><br>"

		rates_perhour_sum += rate_perhour 
		rates_perdistance_sum += rate_perdistance 

		driver_details += "</h4> </div>"
		
		driver_div.innerHTML += "<h3>" + branch + "</h3>"
		driver_div.innerHTML += "<div id='table_div'>" + table_html + driver_details +"</div>"+ "<br>"

		rates_distance[branch] = (rate_km*avg_distance)
		rates_hour[branch] = (cost_per_min*(total_time/number_of_orders))

		profits_km[branch] = (total_revenue - (rate_km*(parseFloat(total_distance/1000))))
		profits_hour[branch] = (total_revenue - total_cost_hour)
		orders[branch] = number_of_orders

		calculate_speed(branch);
	});

	Object.keys(json_obj).forEach(function(branch){
		$("#b2c_driver_table_"+ branch.split(' ').join('')).tablesorter(); 

	});
	document.getElementById(divId).querySelector("#rate").innerHTML = "";//"Rate (per hour): "+(rates_perhour_sum/Object.keys(json_obj).length).toFixed(2) + " KD" + "<br/><br/>" ;//+ "Rate (per km): "+(rates_perdistance_sum/Object.keys(json_obj).length).toFixed(2) + " KD"



	toggle_cost_analysis()
	update_view_rates(base);
	calculate_rates(cost);
	update_total_cost(divId);
	

}
function toggle_cost_analysis(value){

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
function draw_profit_chart(divId="driver_map", rateDivId="rate_comparison_chart"){
	var n = 19;
	var profits = [],
		total_profits_sum = 0 ;
	var number_of_orders = Array.apply(null, {length: n}).map((d,i) => 0);

	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var cost_minus_base = max_cost - base

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	Object.keys(json_obj).forEach(function(branch){
		Object.keys(json_obj[branch]).forEach(function(customer_location){
			var dist = Math.floor(json_obj[branch][customer_location]['distance']/1000)
			number_of_orders[dist] += json_obj[branch][customer_location]['order_num']
		});
	});
	
	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)

		var actual_cost = (actual_rate * distance)
		var processed_delivery_fee = 0 

		if (delivery_fee > max_cost){
			processed_delivery_fee = max_cost;
		}
		else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		}

		profits.push(((processed_delivery_fee-actual_cost)).toFixed(3));
		total_profits_sum += ((processed_delivery_fee-actual_cost)*number_of_orders[i])



	});
	

    chartData = {
      xLabels: distances, 
      datasets: [{
        type: 'line',
        label: 'Number of orders',
        borderColor: 'rgb(255, 205, 86)',
        borderWidth: 2,
        fill: false,
        data: number_of_orders,
        yAxisID: 'rate-y-axis'
      }, {
        type: 'bar',
        label: 'Profit',
        backgroundColor: 'rgb(54, 162, 235)',
        data: profits,
        yAxisID: 'profit-y-axis',
        borderColor: 'white',
        borderWidth: 2
      }]
    };
	var ctx = document.getElementById(rateDivId).querySelector("#canvas").getContext('2d');
    myMixedChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          title: {
            display: true,
            text: 'Profit vs. Number of Orders Per Distance'
          },
          legend: {
            display: true,
          },
          scales: {
            xAxes: [{
              display: true,
              scaleLabel: {
                display: true,
                labelString: 'Distance (km)'
              }
            }],
            yAxes: [{
              type: 'linear',
              position: 'left',
              display: true,
              id: 'profit-y-axis',
              scaleLabel: {
                display: true,
                labelString: 'Profit (KD)'
              },
              ticks: {
                reverse: false
              }
            },
            {
              type: 'linear',
              position: 'right',
              display: true,
              id: 'rate-y-axis',
              scaleLabel: {
                display: true,
                labelString: 'Number of orders'
              },
              ticks: {
                reverse: false
              }
            }]
          },
          tooltips: {
            mode: 'index',
            intersect: true
          }
        }
      });

    var ctx_text = document.getElementById(rateDivId).querySelector("#canvas_text").getContext('2d');

	ctx_text.fillStyle = 'red';

	ctx_text.font = '12pt Verdana';
	ctx_text.fillText('Projected profit: '+ total_profits_sum+ " KD", 50, 50);

	ctx_text.fill();
	ctx_text.stroke();
}

function update_profit_per_delivery_chart(divId="driver_map", rateDivId="rate_comparison_chart"){
	var n = 19;
	var profits = [],
		total_profits_sum = 0,
		number_of_orders = Array.apply(null, {length: n}).map((d,i) => 0)

	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var cost_minus_base = max_cost - base

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	Object.keys(json_obj).forEach(function(branch){
		Object.keys(json_obj[branch]).forEach(function(customer_location){
			var dist = Math.floor(json_obj[branch][customer_location]['distance']/1000)
			number_of_orders[dist] += json_obj[branch][customer_location]['order_num']
		});
	});

	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)

		var actual_cost = (actual_rate * distance)
		var processed_delivery_fee = 0 

		if (delivery_fee > max_cost){
			processed_delivery_fee = max_cost;
		}
		else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		}

		profits.push(((processed_delivery_fee-actual_cost)).toFixed(3));


	});


	chartData.datasets[1].data = profits
	chartData.datasets[0].data = []
	myMixedChart.options.legend.display = false
	myMixedChart.options.scales.yAxes[1].display = false
	myMixedChart.options.title.text = "Profit Per Delivery"
	myMixedChart.update();

    var ctx_text = document.getElementById(rateDivId).querySelector("#canvas_text").getContext('2d');

	ctx_text.clearRect(0,0,450,80)


}
function update_profit_per_orders_chart(divId="driver_map", rateDivId="rate_comparison_chart"){
	var n = 19;
	var profits = [],
		total_profits_sum = 0,
		number_of_orders = Array.apply(null, {length: n}).map((d,i) => 0)

	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var cost_minus_base = max_cost - base

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	Object.keys(json_obj).forEach(function(branch){
		Object.keys(json_obj[branch]).forEach(function(customer_location){
			var dist = Math.floor(json_obj[branch][customer_location]['distance']/1000)
			number_of_orders[dist] += json_obj[branch][customer_location]['order_num']
		});
	});

	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)

		var actual_cost = (actual_rate * distance)
		var processed_delivery_fee = 0 

		if (delivery_fee > max_cost){
			processed_delivery_fee = max_cost;
		}
		else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		}

		profits.push(((processed_delivery_fee-actual_cost)*number_of_orders[i]).toFixed(3));
		total_profits_sum += ((processed_delivery_fee-actual_cost)*number_of_orders[i])


	});


	chartData.datasets[1].data = profits
	chartData.datasets[0].data = number_of_orders
	myMixedChart.options.legend.display = true
	myMixedChart.options.scales.yAxes[1].display = true
	myMixedChart.options.title.text = "Profit vs Number of Orders Per Distance"
	myMixedChart.update();

    var ctx_text = document.getElementById(rateDivId).querySelector("#canvas_text").getContext('2d');

	ctx_text.clearRect(0,0,450,80)
	ctx_text.fillText('Projected profit: '+ total_profits_sum.toFixed(3)+ " KD", 20, 50);

	ctx_text.fill();
	ctx_text.stroke();

}

function update_view_rates(base, divId="view_rates"){
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
    	width = 1300,
		height = 300;

	var n = 19;
	base = max_cost - base
	x_data = Array.apply(null, {length: n}).map((d,i) => i)
	y_data = Array.apply(null, {length: n}).map((d,i) => (isFinite(base/i) ? (base/i) : 0.0))

	max_rate_cost = d3.max(y_data)

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
		.offset([0, 0])
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

function calculate_speed(branch_name){

	var dt = 0, //distance total
		ot = 0, // order total
		distance_w = 0.4, //weightage of distance
		order_w = 0.6, //weightage of orders
		branch = json_obj[branch_name]


	Object.keys(branch).forEach((d,i) => dt+= parseFloat(branch[d]['distance']))
	Object.keys(branch).forEach((d,i) => ot+= parseFloat(branch[d]['order_num']))

	var sum_speed_w = 0, //sum of weighted speed
		weight = 0,
		sum_of_weights = 0 //sum of all weighted distances and weighted orders

	Object.keys(branch).forEach(function(d, i) {
		weight = (distance_w * (parseFloat(branch[d]['distance'])/dt)) + (order_w * (parseFloat(branch[d]['order_num'])/ot))
		sum_speed_w += weight * parseFloat(branch[d]['speed'])

		sum_of_weights += weight

	})

	speeds[branch_name] = (sum_speed_w/sum_of_weights)

}
function calculate_rates(cost, divId='actual_rate'){

	var speeds_sum = 0,
		rates_sum = 0;
	Object.keys(speeds).forEach(function(branch){ 
		rates[branch] = cost/speeds[branch]
		speeds_sum += speeds[branch]
		rates_sum += rates[branch]
	})
	var avg_speed = speeds_sum/Object.keys(speeds).length

	var actual_rate = cost/avg_speed
	var rate_avgs = rates_sum/Object.keys(rates).length

	rate = actual_rate
	document.getElementById(divId).innerHTML = rate.toFixed(3)
	
}

function update_total_cost(divId="driver_map", actualDivId='preliminary_delivery_fee', processedDivId='processed_delivery_fee', profitDivId='delivery_fee_profit', actualCostDivId='actual_fee_cost'){
	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);
	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);
	var distance_km = parseFloat(document.getElementById(divId).querySelector("#distance_km").value);
	var profit = 0;

	var delivery_fee = (base) + (rate * distance_km)
	var actual_cost = (actual_rate * distance_km)

	
	document.getElementById(actualDivId).innerHTML = delivery_fee.toFixed(3)

	var processed_delivery_fee = 0 

	if (delivery_fee > max_cost){
		processed_delivery_fee = max_cost;
	}
	else{
		processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
	}

	document.getElementById(processedDivId).innerHTML = processed_delivery_fee.toFixed(3);
	document.getElementById(profitDivId).innerHTML = (processed_delivery_fee-actual_cost).toFixed(3);
	document.getElementById(actualCostDivId).innerHTML = actual_cost.toFixed(3);

	update_profit_per_orders_chart();
	
}




