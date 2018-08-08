var json_obj = {}
var json_gov_distances = {}
var json_comp_prices = {}

var orders = {}
var rates_hour = {}
var rates_distance = {}
var profits_km = {}
var profits_hour = {}
var speeds = {}
var rates = {}
var caps = []
var rate = 0
var rate_min = 0
var cap_vendor = 1
var max_dist = 0
var max_buy = 7

var myMixedChart_vendor = null,
	chartData_vendor = {};

var myMixedChart_vendor_tiers = null,
	chartData_vendor_tiers = {};

var myMixedChart_custom_pickup = null,
	chartData_custom_pickup = {};

var myMixedChart_custom_buy = null,
	chartData_custom_buy = {};

var myMixedChart_comp_prices = [],
	chartData_comp_prices = [];

var lower_rates = {},
	upper_rates = {},
	all_governorates = ["Al Asimah (Capital)", "Hawalli", "Farwaniya", "Mubarak Al-Kabeer", "Ahmadi", "Jahra"];

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

function calc_delivery_format(base, rate, km){
	var value = parseFloat(base) + (parseFloat(rate) * parseFloat(km))
	return (Math.ceil((value.toFixed(3) * 1000) /50 ) * 50)/1000
}

function update_json(errors, driverData, governorateData, comppricesData){
	var divId = "driver_map"
	var cost = document.getElementById(divId).querySelector("#cost").value;

	json_obj = driverData;
	json_gov_distances = governorateData;
	json_comp_prices = comppricesData;

	Object.keys(json_obj).forEach(function(branch){
	Object.keys(json_obj[branch]).forEach(function(customer_location){

		var dist = Math.round(json_obj[branch][customer_location]['distance']/1000)
		if (dist > max_dist){
				max_dist = dist
			}
		})
	})

	caps = Array.apply(0, {length: max_dist})
	Object.keys(json_obj).forEach(function(branch){
		Object.keys(json_obj[branch]).forEach(function(customer_location){

			var dist = Math.round(json_obj[branch][customer_location]['distance']/1000)
			if (dist > max_dist){
				max_dist = dist
			}
			if (caps[dist] == null){
				caps[dist] = json_obj[branch][customer_location]['cap'] + 1

			}
			else{
				caps[dist] += json_obj[branch][customer_location]['cap'] + 1
				caps[dist] = parseFloat(caps[dist]/2)
			}
			
			
		})
	});
	max_dist = Math.round(max_dist)
	caps = caps.map(
	function(d,i){
		if (d==null){
			if (i!=caps.length-1){
				if (caps[i+1]==null){

					return d3.max(caps)
				}
				return caps[i+1]
				
			}
			return d3.max(caps)
		} 
			
		return 2.5
			
	})
	draw_profit_chart_vendor();
	draw_tier_rates()
	draw_profit_chart_custom_pickup();
	draw_profit_chart_custom_buy();
	draw_profit_chart_comp_prices();
	update_table();

	calculate_rates(cost);
	document.getElementById(divId).querySelector("#rate_km").value = rate.toFixed(3);
	document.getElementById(divId).querySelector("#rate_min").value = rate_min.toFixed(3);

	var delivery_type = document.querySelector('input[name=delivery_type]:checked').value;

	if (delivery_type == "vendors"){
		update_driver_vendor(divId);
	}
	else if (delivery_type == "custom_pickup"){
		
		update_driver_custom_pickup(divId);
		update_driver_comp_prices(divId);
	}
	else if (delivery_type == "custom_buy"){
		
		update_driver_custom_buy(divId);
	}




}
function get_drivers(divId){
	
	var base = document.getElementById(divId).querySelector("#base").value;
	// var driver_url = "https://query.data.world/s/bxygz4vqkne2jwzj57nx76l2rhc6z5"; //driver json url
	var driver_url = "https://query.data.world/s/b423c52o2euc23uvpgiz2ucaaq3ad3"

	var governorate_distances_url = "https://query.data.world/s/a4qxoifnsggxisp75soku7shuamw3a"
	var competitor_prices_url = "https://query.data.world/s/xjcsoho6qnklvtl4clng3z2v3n7pt7"

	d3.queue()
	    .defer(d3.json, driver_url)
	    .defer(d3.json, governorate_distances_url)
	    .defer(d3.json, competitor_prices_url)
	    .await(update_json);
}

function update_input_field(value){
	document.getElementById("driver_map").querySelector("#cost").value = value;
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
			row += "<td id='cost_per_order_per_hour'>" + (cost_per_min*avg_time_order).toFixed(3) + "</td>";
			//distance to customer
			row += "<td id='distance_to_customer'>" + parseFloat(json_obj[branch][customer_location]['distance']/1000).toFixed(2) + "</td>";
			//cost per order per km
			row += "<td id='cost_per_order_per_km'>" + (rate_km*parseFloat(json_obj[branch][customer_location]['distance']/1000)).toFixed(3) + "</td>";
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

	
	calculate_rates(cost);

	var delivery_type = document.querySelector('input[name=delivery_type]:checked').value;

	if (delivery_type == "vendors"){
		update_driver_vendor(divId);
		update_tier_rates(divId);
	}
	else if (delivery_type == "custom_pickup"){
		
		update_driver_custom_pickup(divId);
		update_driver_comp_prices(divId);
	}
	else if (delivery_type == "custom_buy"){
		
		update_driver_custom_buy(divId);
	}
	
	

}

function draw_profit_chart_vendor(divId="driver_map", rateDivId="rate_comparison_chart", capDivId='cap'){
	var n = max_dist;
	var profits = [],
		total_profits_sum = 0 ;
	var number_of_orders = Array.apply(null, {length: n}).map((d,i) => 0);

	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	Object.keys(json_obj).forEach(function(branch){
		Object.keys(json_obj[branch]).forEach(function(customer_location){
			var dist = Math.round(json_obj[branch][customer_location]['distance']/1000)
			number_of_orders[dist] += json_obj[branch][customer_location]['order_num']
		});
	});
	
	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)

		var actual_cost = (actual_rate * distance)
		var processed_delivery_fee = 0 

		if (delivery_fee > cap_vendor){
			processed_delivery_fee = cap_vendor;
		}
		else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		}

		profits.push(((processed_delivery_fee-actual_cost)).toFixed(3));
		total_profits_sum += ((processed_delivery_fee-actual_cost)*number_of_orders[i])

	});
	

    chartData_vendor = {
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
    myMixedChart_vendor = new Chart(ctx, {
        type: 'bar',
        data: chartData_vendor,
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

function update_profit_per_delivery_chart(divId="driver_map", rateDivId="rate_comparison_chart", capDivId='cap'){
	var n = max_dist;
	var profits = [],
		total_profits_sum = 0;

	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)

		var actual_cost = (actual_rate * distance)
		var processed_delivery_fee = 0 

		if (delivery_fee > cap_vendor){
			processed_delivery_fee = cap_vendor;
		}
		else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		}

		profits.push(((processed_delivery_fee-actual_cost)).toFixed(3));


	});


	chartData_vendor.datasets[1].data = profits
	chartData_vendor.datasets[0].data = []
	myMixedChart_vendor.options.legend.display = false
	myMixedChart_vendor.options.scales.yAxes[1].display = false
	myMixedChart_vendor.options.title.text = "Profit Per Delivery"
	myMixedChart_vendor.update();

    var ctx_text = document.getElementById(rateDivId).querySelector("#canvas_text").getContext('2d');

	ctx_text.clearRect(0,0,450,80)


}
function update_profit_per_orders_chart(divId="driver_map", rateDivId="rate_comparison_chart"){
	var n = max_dist;
	var profits = [],
		total_profits_sum = 0,
		number_of_orders = Array.apply(null, {length: n}).map((d,i) => 0)

	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	Object.keys(json_obj).forEach(function(branch){
		Object.keys(json_obj[branch]).forEach(function(customer_location){
			var dist = Math.round(json_obj[branch][customer_location]['distance']/1000)
			number_of_orders[dist] += json_obj[branch][customer_location]['order_num']
		});
	});

	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)

		var actual_cost = (actual_rate * distance)
		var processed_delivery_fee = 0 

		if (delivery_fee > cap_vendor){
			processed_delivery_fee = cap_vendor;
		}
		else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		}

		profits.push(((processed_delivery_fee-actual_cost)*number_of_orders[i]).toFixed(3));
		total_profits_sum += ((processed_delivery_fee-actual_cost)*number_of_orders[i])


	});


	chartData_vendor.datasets[1].data = profits
	chartData_vendor.datasets[0].data = number_of_orders
	myMixedChart_vendor.options.legend.display = true
	myMixedChart_vendor.options.scales.yAxes[1].display = true
	myMixedChart_vendor.options.title.text = "Profit vs Number of Orders Per Distance"
	myMixedChart_vendor.update();

    var ctx_text = document.getElementById(rateDivId).querySelector("#canvas_text").getContext('2d');

	ctx_text.clearRect(0,0,450,80)
	ctx_text.fillText('Projected profit: '+ total_profits_sum.toFixed(3)+ " KD", 20, 50);

	ctx_text.fill();
	ctx_text.stroke();

}

function draw_tier_rates(divId="driver_map", rateDivId='tier_rates'){

	var n = max_dist;

	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);
	var cap_value = cap_vendor;

	var all_costs = [],
		delivery_fees = [];

	distances.forEach(function(d, i){
		all_costs.push(actual_rate*d);
		df = calc_delivery_format(base, rate, d)
		delivery_fees.push(df);
	})
	var tier1_value = 0.5
	var tier2_value = 0.75
	var non_partner_value = 1

	var tier1 = Array.apply(null, {length: n}).map((d,i) => all_costs[i]< tier1_value? 3:null)
	var tier2 = Array.apply(null, {length: n}).map((d,i) => all_costs[i]< tier2_value? 5:null)
	var non_partner = Array.apply(null, {length: n}).map((d,i) => all_costs[i] < non_partner_value? 7:null)

	var tier1_saves = Array.apply(null, {length: n}).map((d,i) => ((delivery_fees[i] >= tier1_value) && (all_costs[i]< tier1_value))? 2.5:null)
	var tier2_saves = Array.apply(null, {length: n}).map((d,i) => ((delivery_fees[i] >= tier2_value) && (all_costs[i]< tier2_value))? 4.5:null)
	var non_partner_saves = Array.apply(null, {length: n}).map((d,i) => ((delivery_fees[i] >= non_partner_value) && (all_costs[i]< non_partner_value))? 6.5:null)
	var colour_helper = Chart.helpers.color;

    chartData_vendor_tiers = {
      labels: distances, 
      datasets: [{
        label: 'Tier 1',
        borderColor: '#F78297',
        borderWidth: 2,
        fill: false,
        data: tier1,
        //yAxisID: 'tier1-y-axis'
      },
      {
        label: 'Tier 2',
        borderColor: '#50B4D0',
        borderWidth: 2,
        fill: false,
        data: tier2,
        //yAxisID: 'tier2-y-axis'
      },
      {
        label: 'Non Partner',
        borderColor: '#174733',
        borderWidth: 2,
        fill: false,
        data: non_partner,
        //yAxisID: 'non_partner-y-axis'
      },
      {
        label: 'Tier1 saves',
        borderColor: colour_helper('rgb(247,130,151)').alpha(0.5).rgbString(),
        borderWidth: 2,
        fill: false,
        data: tier1_saves,
        //yAxisID: 'non_partner-y-axis'
      },
      {
        label: 'Tier2 saves',
        borderColor: colour_helper('rgb(80,180,208)').alpha(0.5).rgbString(),
        borderWidth: 2,
        fill: false,
        data: tier2_saves,
        //yAxisID: 'non_partner-y-axis'
      },
      {
        label: 'Non partner saves',
        borderColor: colour_helper('rgb(23,71,51)').alpha(0.5).rgbString(),
        borderWidth: 2,
        fill: false,
        data: non_partner_saves,
        //yAxisID: 'non_partner-y-axis'
      }]

    };
  
	var ctx = document.getElementById(rateDivId).querySelector("#canvas_vendor_tiers").getContext('2d');
    myMixedChart_vendor_tiers = new Chart(ctx, {
        type: 'line',
        data: chartData_vendor_tiers,
        options: {
        	tooltips: {
			callbacks: {

				label: function(item, d){
							let label_text = d.datasets[item.datasetIndex].label

							return "Cost: "+all_costs[item.datasetIndex]+", "+ "Delivery fee: "+delivery_fees[item.datasetIndex]
					}
				}
		}, 
        	scales: {
        	  gridLines: true,
	          yAxes: [{
	          	display: false,
	            ticks: {
	              beginAtZero: true,
	              max: 10
		        }
		      }],
		      xAxes: {
		      	scaleLabel: {
                  display: true,
                  labelString: 'Distance (km)'
                }
		      }
			},
          responsive: true,
          legend: {
            position: 'right',
            labels: {
                    boxWidth: 1,
                    usePointStyle: false,
					filter: function(item, chart) {
						return !item.text.includes('saves');
					}
				
                }
          },
          title: {
            display: true,
            text: 'Vendors'
          }
        }
      });


}
function update_tier_rates(divId="driver_map", rateDivId='tier_rates'){
	var n = max_dist;

	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);
	var cap_value = cap_vendor;

	var all_costs = [],
		delivery_fees = [],
		all_profits = [];

	var tier1_value = 0.5
	var tier2_value = 0.75
	var non_partner_value = 1

	distances.forEach(function(d, i){
		all_costs.push((actual_rate*d).toFixed(3));
		
		delivery_fees.push(calc_delivery_format(base, rate, d));

		all_profits.push((delivery_fees[i] - all_costs[i]).toFixed(3));
	})
	var tier1 = Array.apply(null, {length: n}).map((d,i) => all_costs[i]< tier1_value? 3:null)
	var tier2 = Array.apply(null, {length: n}).map((d,i) => all_costs[i]< tier2_value? 5:null)
	var non_partner = Array.apply(null, {length: n}).map((d,i) => all_costs[i] < non_partner_value? 7:null)

	var tier1_saves = Array.apply(null, {length: n}).map((d,i) => ((delivery_fees[i] >= tier1_value) && (all_costs[i]< tier1_value))? 2.5:null)
	var tier2_saves = Array.apply(null, {length: n}).map((d,i) => ((delivery_fees[i] >= tier2_value) && (all_costs[i]< tier2_value))? 4.5:null)
	var non_partner_saves = Array.apply(null, {length: n}).map((d,i) => ((delivery_fees[i] >= non_partner_value) && (all_costs[i]< non_partner_value))? 6.5:null)

 	myMixedChart_vendor_tiers['options']['tooltips']['callbacks']['label'] = 
 		function(item, d){
				let label_text = d.datasets[item.datasetIndex].label

				return "Cost: "+all_costs[item.datasetIndex]+", "+ "Delivery fee: "+delivery_fees[item.datasetIndex]+", "+ "Profit: "+all_profits[item.datasetIndex]
			}


	chartData_vendor_tiers.datasets[0].data = tier1
	chartData_vendor_tiers.datasets[1].data = tier2
	chartData_vendor_tiers.datasets[2].data = non_partner
	chartData_vendor_tiers.datasets[3].data = tier1_saves
	chartData_vendor_tiers.datasets[4].data = tier2_saves
	chartData_vendor_tiers.datasets[5].data = non_partner_saves
	//chartData_custom_pickup.datasets[2].data = dist_from_cap
	myMixedChart_vendor_tiers.update();
	




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
function calculate_rates(cost, divId='actual_rate', rateMinDivId="rate_per_minute"){

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
	rate_min = cost/60
	document.getElementById(divId).innerHTML = rate.toFixed(3)
	document.getElementById(rateMinDivId).innerHTML = rate_min.toFixed(3)
}

function update_driver_vendor(divId="driver_map", actualDivId='preliminary_delivery_fee', processedDivId='processed_delivery_fee', profitDivId='delivery_fee_profit', actualCostDivId='actual_fee_cost', capDivId='cap'){
	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);
	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);
	var distance_km = parseFloat(document.getElementById(divId).querySelector("#distance_km").value);
	var profit = 0;

	var delivery_fee = (base) + (rate * distance_km)
	var actual_cost = (actual_rate * distance_km)

	
	document.getElementById(actualDivId).innerHTML = delivery_fee.toFixed(3)

	var processed_delivery_fee = 0 

	if (delivery_fee > cap_vendor){
		processed_delivery_fee = cap_vendor;
	}
	else{
		processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
	}

	document.getElementById(processedDivId).innerHTML = processed_delivery_fee.toFixed(3);
	document.getElementById(profitDivId).innerHTML = (processed_delivery_fee-actual_cost).toFixed(3);
	document.getElementById(actualCostDivId).innerHTML = actual_cost.toFixed(3);

	var element = document.getElementById("update_rate_comparison_chart");
	if (element.value == "profit_per_delivery"){
		update_profit_per_orders_chart();
	}
	else if (element.value == "profit_per_orders"){
		
		update_profit_per_delivery_chart();
	}

	document.getElementById(capDivId).innerHTML = cap_vendor.toFixed(3);
	
}


function update_driver_custom_pickup(divId="driver_map", actualDivId='preliminary_delivery_fee', processedDivId='processed_delivery_fee', profitDivId='delivery_fee_profit', actualCostDivId='actual_fee_cost', capDivId='cap'){
	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);
	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);
	var distance_km = parseFloat(document.getElementById(divId).querySelector("#distance_km").value);
	var profit = 0,
		cap_value = parseFloat(document.getElementById(divId).querySelector("#cap_value_custom").value);

	var delivery_fee = (base) + (rate * distance_km)
	var actual_cost = (actual_rate * distance_km)

	
	document.getElementById(actualDivId).innerHTML = delivery_fee.toFixed(3)

	var processed_delivery_fee = 0 

	// distance_km_cap = Math.round(distance_km)
	// if (distance_km_cap > caps.length-1){
	// 	cap_value = caps.slice(-1)[0]
	// }
	// else{
	// 	cap_value = caps[distance_km_cap]
	// }
	if (delivery_fee > cap_value){
		processed_delivery_fee = (Math.floor((cap_value.toFixed(3) * 1000) /50 ) * 50)/1000
	}
	else{
		processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
	}

	document.getElementById(processedDivId).innerHTML = processed_delivery_fee.toFixed(3);
	document.getElementById(profitDivId).innerHTML = (processed_delivery_fee-actual_cost).toFixed(3);
	document.getElementById(actualCostDivId).innerHTML = actual_cost.toFixed(3);
	document.getElementById(capDivId).innerHTML = cap_value.toFixed(3);

	update_custom_pickup_profit_per_delivery_chart();


}
function update_custom_pickup_profit_per_delivery_chart(divId="driver_map", rateDivId="custom_pickup_rate_comparison_chart", capDivId='cap'){
	var n = max_dist;
	var profits = [];
	var dist_from_cap = [];
	var delivery_costs = [];
	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);
	var cap_value = parseFloat(document.getElementById(divId).querySelector("#cap_value_custom").value);

	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)
		var actual_cost = (actual_rate * distance)
		var processed_delivery_fee = 0 

		// distance_km_cap = Math.round(distance)
		// if (distance_km_cap > caps.length-1){
		// 	cap_value = caps.slice(-1)[0]
		// }
		// else{
		// 	cap_value = caps[distance_km_cap]
		// }
		if (delivery_fee > cap_value){
			processed_delivery_fee = (Math.floor((cap_value.toFixed(3) * 1000) /50 ) * 50)/1000
		}
		else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		}

		var profit = processed_delivery_fee - actual_cost
		profits.push(profit.toFixed(3))

		delivery_costs.push(actual_cost.toFixed(3))

		// dist_from_cap.push((cap_value-processed_delivery_fee ).toFixed(3))

	})

	chartData_custom_pickup.datasets[0].data = delivery_costs
	chartData_custom_pickup.datasets[1].data = profits
	//chartData_custom_pickup.datasets[2].data = dist_from_cap
	myMixedChart_custom_pickup.update();


}

function draw_profit_chart_custom_pickup(divId="driver_map", rateDivId="custom_pickup_rate_comparison_chart", capDivId='cap'){
	var n = max_dist;
	var profits = [];
	var dist_from_cap = [];
	var delivery_costs = [];
	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);
	var cap_value = parseFloat(document.getElementById(divId).querySelector("#cap_value_custom").value);

	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)

		var actual_cost = (actual_rate * distance)
		var processed_delivery_fee = 0 

		// distance_km_cap = Math.round(distance)
		// if (distance_km_cap > caps.length-1){
		// 	cap_value = caps.slice(-1)[0]
		// }
		// else{
		// 	cap_value = caps[distance_km_cap]
		// }
		if (delivery_fee > cap_value){
			processed_delivery_fee = (Math.ceil((cap_value.toFixed(3) * 1000) /50 ) * 50)/1000
		}
		else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		}
		var profit = (processed_delivery_fee - actual_cost)
		profits.push(profit).toFixed(3)

		delivery_costs.push(processed_delivery_fee - profit).toFixed(3)

		dist_from_cap.push((cap_value-(processed_delivery_fee)).toFixed(3))
	});
	

    chartData_custom_pickup = {
      xLabels: distances, 
      datasets: [{
        type: 'bar',
        label: 'Actual cost',
        backgroundColor: 'rgb(139,0,0)',
        data: delivery_costs,
        yAxisID: 'profit-y-axis',
        borderColor: 'white',
        borderWidth: 2
      },
      {
        type: 'bar',
        label: 'Profit',
        backgroundColor: 'rgb(55,192,203)',
        data: profits,
        yAxisID: 'profit-y-axis',
        borderColor: 'white',
        borderWidth: 2
      },
      // {
      //   type: 'bar',
      //   label: 'Distance from cap',
      //   backgroundColor: 'rgb(115,212,135)',
      //   data: dist_from_cap,
      //   yAxisID: 'profit-y-axis',
      //   borderColor: 'white',
      //   borderWidth: 2
      // }
      ]
    };
	var ctx = document.getElementById(rateDivId).querySelector("#canvas_custom_pickup").getContext('2d');
    myMixedChart_custom_pickup = new Chart(ctx, {
        type: 'bar',
        data: chartData_custom_pickup,
        options: {
          responsive: true,
          title: {
            display: true,
            text: 'Profit Per Delivery'
          },
          legend: {
            display: true,
          },
          scales: {
            xAxes: [{
              display: true,
              stacked: true, 
              scaleLabel: {
                display: true,
                labelString: 'Distance (km)'
              }
            }],
            yAxes: [{
              type: 'linear',
              position: 'left',
              display: true,
              stacked: true,
              id: 'profit-y-axis',
              scaleLabel: {
                display: true,
                labelString: 'Delivery fee (KD)'
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

}


function update_driver_custom_buy(divId="driver_map", actualDivId='preliminary_delivery_fee', processedDivId='processed_delivery_fee', profitDivId='delivery_fee_profit', actualCostDivId='actual_fee_cost', capDivId='cap'){
	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);
	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);
	var distance_km = parseFloat(document.getElementById(divId).querySelector("#distance_km").value);
	var profit = 0;
	var rate_min = parseFloat(document.getElementById(divId).querySelector("#rate_min").value);
	var actual_rate_min = parseFloat(document.getElementById(divId).querySelector("#rate_per_minute").innerHTML);
	var minutes = parseFloat(document.getElementById(divId).querySelector("#minutes").value);
	
	var delivery_fee = (base) + (rate * distance_km)// + (rate_min * minutes)
	var actual_cost = (actual_rate * distance_km)// + (actual_rate_min * minutes)
	var processed_delivery_fee = 0 
	
	document.getElementById(actualDivId).innerHTML = delivery_fee.toFixed(3)

	var processed_delivery_fee = 0 

	// if (delivery_fee > max_buy){
	// 	processed_delivery_fee = max_buy;
	// }
	// else{
		processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
	// }


	document.getElementById(processedDivId).innerHTML = processed_delivery_fee.toFixed(3);
	document.getElementById(profitDivId).innerHTML = (processed_delivery_fee-actual_cost).toFixed(3);
	document.getElementById(actualCostDivId).innerHTML = actual_cost.toFixed(3);
	document.getElementById(capDivId).innerHTML = max_buy.toFixed(3);

	update_custom_buy_profit_per_delivery_chart();


}
function update_custom_buy_profit_per_delivery_chart(divId="driver_map", rateDivId="custom_buy_rate_comparison_chart", capDivId='cap'){
	var n = max_dist;
	var profits = [];
	var dist_from_cap = [];
	var delivery_costs = [];
	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	var rate_min = parseFloat(document.getElementById(divId).querySelector("#rate_min").value);
	var actual_rate_min = parseFloat(document.getElementById(divId).querySelector("#rate_per_minute").innerHTML);

	var minutes = parseFloat(document.getElementById(divId).querySelector("#minutes").value);
	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)// + (rate_min * minutes)
		var actual_cost = (actual_rate * distance)// + (actual_rate_min * minutes)
		var processed_delivery_fee = 0 


		// if (delivery_fee > max_buy){
		// 	processed_delivery_fee = max_buy;
		// }
		// else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		// }

		var profit = processed_delivery_fee - actual_cost
		

		delivery_costs.push(actual_cost.toFixed(3))
		profits.push(profit.toFixed(3))

	})

	chartData_custom_buy.datasets[0].data = delivery_costs
	chartData_custom_buy.datasets[1].data = profits
	myMixedChart_custom_buy.update();

}

function draw_profit_chart_custom_buy(divId="driver_map", rateDivId="custom_buy_rate_comparison_chart", capDivId='cap'){
	var n = max_dist;
	var profits = [];
	var delivery_costs = [];
	var distances = Array.apply(null, {length: n}).map((d,i) => i)

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	var rate_min = parseFloat(document.getElementById(divId).querySelector("#rate_min").value);
	var actual_rate_min = parseFloat(document.getElementById(divId).querySelector("#rate_per_minute").innerHTML);

	var minutes = parseFloat(document.getElementById(divId).querySelector("#minutes").value);

	distances.forEach(function(distance, i){

		var delivery_fee = (base) + (rate * distance)// + (rate_min * minutes)

		var actual_cost = (actual_rate * distance)// + (actual_rate_min * minutes)
		var processed_delivery_fee = 0 

		// if (delivery_fee > max_buy){
		// 	processed_delivery_fee = max_buy;
		// }
		// else{
			processed_delivery_fee = (Math.ceil((delivery_fee.toFixed(3) * 1000) /50 ) * 50)/1000
		// }

		var profit = (processed_delivery_fee - actual_cost)
		profits.push(profit).toFixed(3)

		delivery_costs.push(processed_delivery_fee - profit).toFixed(3)

	});
	

    chartData_custom_buy = {
      xLabels: distances, 
      datasets: [{
        type: 'bar',
        label: 'Actual cost',
        backgroundColor: 'rgb(139,0,0)',
        data: delivery_costs,
        yAxisID: 'profit-y-axis',
        borderColor: 'white',
        borderWidth: 2
      },
      {
        type: 'bar',
        label: 'Profit',
        backgroundColor: 'rgb(55,192,203)',
        data: profits,
        yAxisID: 'profit-y-axis',
        borderColor: 'white',
        borderWidth: 2
      }]
    };
	var ctx = document.getElementById(rateDivId).querySelector("#canvas_custom_buy").getContext('2d');
    myMixedChart_custom_buy = new Chart(ctx, {
        type: 'bar',
        data: chartData_custom_buy,
        options: {
          responsive: true,
          title: {
            display: true,
            text: 'Profit Per Delivery'
          },
          legend: {
            display: true,
          },
          scales: {
            xAxes: [{
              display: true,
              stacked: true, 
              scaleLabel: {
                display: true,
                labelString: 'Distance (km)'
              }
            }],
            yAxes: [{
              type: 'linear',
              position: 'left',
              display: true,
              stacked: true,
              id: 'profit-y-axis',
              scaleLabel: {
                display: true,
                labelString: 'Delivery fee (KD)'
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
}


function update_driver_comp_prices(divId="driver_map", actualDivId='preliminary_delivery_fee', processedDivId='processed_delivery_fee', profitDivId='delivery_fee_profit', actualCostDivId='actual_fee_cost', capDivId='cap'){


	// document.getElementById(processedDivId).innerHTML = processed_delivery_fee.toFixed(3);
	// document.getElementById(profitDivId).innerHTML = (processed_delivery_fee-actual_cost).toFixed(3);
	// document.getElementById(actualCostDivId).innerHTML = actual_cost.toFixed(3);
	// document.getElementById(capDivId).innerHTML = max_buy.toFixed(3);

	update_comp_prices_profit_per_delivery_chart();


}

function update_comp_prices_profit_per_delivery_chart(divId="driver_map", rateDivId="custom_pickupz_rate_comparison_chart", capDivId='cap'){

	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	var cap_value = parseFloat(document.getElementById(divId).querySelector("#cap_value_custom").value);

	lower_rates['Mashkor'] = all_governorates.map(s =>
		all_governorates.map(d => 
			( calc_delivery_format(base, rate, json_gov_distances[s][d]['lower']['distance']) > cap_value ? cap_value : calc_delivery_format(base, rate, json_gov_distances[s][d]['lower']['distance']))

			)
		)

	upper_rates['Mashkor'] = all_governorates.map((s, si) =>
		all_governorates.map((d, di)=> 
			( 
				
				calc_delivery_format(base, rate, json_gov_distances[s][d]['upper']['distance']) > cap_value 
					? 
					cap_value - lower_rates['Mashkor'][si][di] : 
					calc_delivery_format(base, rate, json_gov_distances[s][d]['upper']['distance']) - calc_delivery_format(base, rate, json_gov_distances[s][d]['lower']['distance'])
			)

			)
		)


	all_governorates.forEach(function(source, i){
		chartData_comp_prices[i].datasets[0].data = lower_rates['Mashkor'][i]
		chartData_comp_prices[i].datasets[4].data = upper_rates['Mashkor'][i]
		myMixedChart_comp_prices[i].update();

	})
	

}

function draw_profit_chart_comp_prices(divId="driver_map", rateDivId="custom_pickup_rate_comparison_chart", capDivId='cap'){

	var n = 6
	var base = parseFloat(document.getElementById(divId).querySelector("#base").value);

	var rate = parseFloat(document.getElementById(divId).querySelector("#rate_km").value);
	var actual_rate = parseFloat(document.getElementById(divId).querySelector("#actual_rate").innerHTML);

	var colour_helper = Chart.helpers.color;

	var colours = {
		'mashkor': 'rgb(48,217,196)',
		'quick_del': 'rgb(110,76,105)',
		'porter_ex': 'rgb(37,96,110)',
		'del_ex': 'rgb(106,98,35)'
	}
	lower_rates = {
		'Mashkor': all_governorates.map(s =>
				all_governorates.map(d => calc_delivery_format(base, rate, json_gov_distances[s][d]['lower']['distance']))
			),
		'Quick Del': all_governorates.map(s =>
				all_governorates.map(d => json_comp_prices[s][d]['quick_del']['lower'])
			), 
		'Porter': all_governorates.map(s =>
				all_governorates.map(d => json_comp_prices[s][d]['porter_ex']['lower'])
			),
		'Del Ex': all_governorates.map(s =>
			all_governorates.map(d => json_comp_prices[s][d]['del_ex']['lower'])
			)
	}
	upper_rates = {
		'Mashkor': all_governorates.map(s =>
				all_governorates.map(d => (calc_delivery_format(base, rate, json_gov_distances[s][d]['upper']['distance']) - calc_delivery_format(base, rate, json_gov_distances[s][d]['lower']['distance'])))
			),
		'Quick Del': all_governorates.map(s =>
				all_governorates.map(d => json_comp_prices[s][d]['quick_del']['upper'] - json_comp_prices[s][d]['quick_del']['lower'])
			), 
		'Porter': all_governorates.map(s =>
				all_governorates.map(d => json_comp_prices[s][d]['porter_ex']['upper'] - json_comp_prices[s][d]['porter_ex']['lower'])
			),
		'Del Ex': all_governorates.map(s =>
			all_governorates.map(d => json_comp_prices[s][d]['del_ex']['upper'] - json_comp_prices[s][d]['del_ex']['lower'])
			)
	}

	all_governorates.forEach(function(source, i){

			chartData_comp_prices[i] = {
		      labels: all_governorates,
		      datasets: [{
		        label: 'Mashkor',
		        backgroundColor: colours['mashkor'],
		        borderWidth: 1,
		        stack: 'Stack 1',
		        data: lower_rates['Mashkor'][i],
		      }, {
		        label: 'Quick Del',
		        backgroundColor: colours['quick_del'],
		        stack: 'Stack 2',
		        data: lower_rates['Quick Del'][i],
		        
		      }, {
		        label: 'Porter',
		        backgroundColor: colours['porter_ex'],
		        stack: 'Stack 3',
		        data: lower_rates['Porter'][i],
		      }, {
		        label: 'Del Ex',
		        backgroundColor: colours['del_ex'],
		        stack: 'Stack 4',
		        data: lower_rates['Del Ex'][i],
		      },
		      {
		        label: 'Mashkor (Upper)',
		        backgroundColor: colour_helper(colours['mashkor']).alpha(0.5).rgbString(),
		        stack: 'Stack 1',
		        data: upper_rates['Mashkor'][i],
		      },
		      {
		        label: 'Quick Del (Upper)',
		        backgroundColor: colour_helper(colours['quick_del']).alpha(0.5).rgbString(),
		        stack: 'Stack 2',
		        data: upper_rates['Quick Del'][i],
		      },
		      {
		        label: 'Porter (Upper)',
		        backgroundColor: colour_helper(colours['porter_ex']).alpha(0.5).rgbString(),
		        stack: 'Stack 3',
		        data: upper_rates['Porter'][i],
		      },
		      {
		        label: 'Del Ex (Upper)',
		        backgroundColor: colour_helper(colours['del_ex']).alpha(0.5).rgbString(),
		        stack: 'Stack 4',
		        data: upper_rates['Del Ex'][i],
		      }]
		    };
		    
			var ctx = document.getElementById(rateDivId).querySelector("#canvas_comp_prices"+String(i)).getContext('2d');
		    myMixedChart_comp_prices[i] = new Chart(ctx, {     
		    	type: 'horizontalBar',
		        data: chartData_comp_prices[i],
		        options: {
		        	tooltips: {
		        		mode: 'nearest',
		        		callbacks: {
		        			label: function(item, d){
			        					let label_text = d.datasets[item.datasetIndex].label

			        					if (! label_text.includes('Upper')){
			        						return label_text+" (Lower): "+	item.xLabel;
			        					}
			        					else{
			        						source = i
			        						dest = all_governorates.indexOf(item.yLabel)
			        						return label_text+": "+(parseFloat(lower_rates[label_text.replace(" (Upper)", "")][source][dest]) + parseFloat(upper_rates[label_text.replace(" (Upper)", "")][source][dest])).toFixed(2);
			        					}
		        					
		        				}
		        			}
		        		

		        	}, 
		        	legend: {
		        		position: 'right',
		        		labels: {
		        			filter: function(item, chart) {
		        				return !item.text.includes('Upper');
		        			}
		        		}
		        	},
		        	elements: {
		            rectangle: {
		            	borderWidth: 0,
		            }
		          },
		          scales: {
			            xAxes: [{
			              display: true,
			              stacked: true,
			              scaleLabel: {
			                display: true,
			                labelString: 'Price (kd)'
			              }
			            }],
			            yAxes: [{
			            	stacked: true,
			            }],
			            
			        },
					responsive: true,
					title: {
					display: true,
					text: source+' Governorate Prices'
					}
		        }
		      });
		})

    
}
