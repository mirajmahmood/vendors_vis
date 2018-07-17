function lay_map(divId){

	mapboxgl.accessToken = 'pk.eyJ1Ijoibm90bWlyYWoiLCJhIjoiY2pmYzd4Nno0MXRiNzQwcTdydXNibzZtaCJ9.KwcKrFYXAQp-LqhyX-8l1Q';
	var map = new mapboxgl.Map({
	    container: divId, // container id
	    style: 'mapbox://styles/mapbox/streets-v9',
	    center: [48.02398, 29.331], // starting position
	    zoom: 11.5, // starting zoom
	    zIndex: 1
		});

	map.scrollZoom.disable()
	map.addControl(new mapboxgl.NavigationControl());

	return map
}
function change_map_data(jsonData, divId){
	var z = d3.scaleSequential(d3["interpolate" + "BuPu"]);

	z.domain([d3.min(d3.values(jsonData)), d3.max(d3.values(jsonData))])

	var svg = d3.select("#"+divId).selectAll("path")	
				.attr("fill", function(d) {
			    	if (jsonData[d.properties.name]){ 

			    		return z(jsonData[d.properties.name]) 
			    	}
			    	else 
			    		return "#fff"
			    });
}

function change_bar_data(jsonData, divId){

	var width = 1300,
		height = 600
		z = d3.scaleSequential(d3["interpolate" + "BuPu"]);

	z.domain([d3.min(d3.values(jsonData)), d3.max(d3.values(jsonData))])
	var num_ticks = d3.values(jsonData).length

	var x = d3.scaleLinear()
		.domain([0, d3.values(jsonData).length]).nice(num_ticks)
        .rangeRound([0, width]);

    var ticks = x.ticks(num_ticks);

    var y = d3.scaleLinear()
        .domain([0, d3.max(d3.values(jsonData))]).nice(8)
        .range([height, 0]);

	var svg = d3.select("#"+divId).selectAll("rect")	
				.attr("fill", function(d) {
					console.log(jsonData)
			    	if (jsonData[d]){ 

			    		return z(jsonData[d]) 
			    	}
			    	else 
			    		return "#fff"
			    })
			    .attr("x", (d,i) => x(ticks[i])/3.5)
		        .attr("y", (d, i) => (y(jsonData[d])/1.15) + 15)
		        .attr("width", 10)
		        .attr("height", function(d,i) { return ((height - y(jsonData[d]))/1.15) + 15; })
}

function plot_graph(kwtData, jsonData, divId, map){
	var total_num = 0

	Object.keys(jsonData).forEach(function(key) {
		total_num += jsonData[key];
	});


	var width = 1300,
		height = 600
		z = d3.scaleSequential(d3["interpolate" + "BuPu"]);

	z.domain([d3.min(d3.values(jsonData)), d3.max(d3.values(jsonData))])
	var center = map.getCenter();
	var zoom = map.getZoom();
	var scale = (512) * 0.5 / Math.PI * Math.pow(2, zoom);
	
	var projection = d3.geoConicConformal().rotate([-48.02398, 29.331]).center([center['lng'], center['lat']]).fitSize([width, height], kwtData);
						
	var path = d3.geoPath().projection(projection);
	var map_container = map.getCanvasContainer();

	var svg = d3.select(map_container).append("svg")
	  .attr("width", width)
	  .attr("height", height)
	  .style('position','absolute')
	  .style('z-index',1);

	svg.selectAll("path")
	    .data(kwtData.features) 
	    .enter().append("path")
	    .attr("d", path)
	    .attr("fill", function(d) {
	    	if (jsonData[d.properties.name]){ 

	    		return z(jsonData[d.properties.name]) 
	    	}
	    	else 
	    		return "#fff"
	    })
	    .attr("fill-opacity", "0.6")
	    .attr("stroke", "#000")
	    .attr("stroke-width", "0.6")
	
	var tool_tip = d3.tip()
		.attr("class", "d3-tip")
		.offset([0, 40])
		.html("<div id='mySVGtooltip'></div>");

	svg.call(tool_tip);
	
	render_overlay();
	map.on("viewreset", function() {
        render_overlay()
    })

    map.on("move", function() {
        render_overlay()
    })
    map.on("movestart", function() {
        render_overlay()
    })
///////bar
	var num_ticks = d3.values(jsonData).length

	var x = d3.scaleLinear()
		.domain([0, d3.values(jsonData).length]).nice(num_ticks)
        .rangeRound([0, width]);

    var ticks = x.ticks(num_ticks);

    var y = d3.scaleLinear()
        .domain([0, d3.max(d3.values(jsonData))]).nice(8)
        .range([height, 0]);

	var svg_bar = d3.select("#customer_bar").append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g");
	
	var tool_tip_bar = d3.tip()
		.attr("class", "d3-tip")
		.offset([0, -180])
		.html("<div id='mySVGtooltip_bar' class='customer'></div>");

	svg_bar.call(tool_tip_bar);
	
	var g = svg_bar.selectAll(".bar").data(Object.keys(jsonData))
			.enter().append("rect")
	        .attr("x", (d,i) => x(ticks[i])/3.5)
	        .attr("y", (d, i) => (y(jsonData[d])/1.15) + 15)
	        .attr("width", 10)
	        .attr("height", function(d,i) { return ((height - y(jsonData[d]))/1.15) + 30; })
	        .attr("class", "bar")
	        .attr("id", function(d, i){
	        	
	        	return d+divId;
	        })
	        .attr("fill", function(d,i){ return z(jsonData[d])})
	        .style("stroke-width", 0.5)
	        .style('stroke', "#000");



	svg_bar.selectAll("rect")
    	.on('mouseover', function(d, i) {
    		console.log(d+divId)
    		d3.select(this)
    			.style("stroke-width", 2)
    			.style('stroke', "#000");

    	    tool_tip_bar.show(d,  document.getElementById(d+divId));
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
					.style('font-size', 15)
					.text("\n Area: "+d);
					

			tooltipbarSVG.append("text")
					.attr("x", 5)
					.attr("y", 40)
					.attr("dy", ".35em")
					.style("fill", "white")
					.style('font-size', 15)
					.text("\n Percentage cut: "+((jsonData[d]/total_num) * 100).toFixed(2)+"%");
			
			
			svg.selectAll("path")
			    .attr("fill-opacity", function(di){
			    	if(d==di.properties.name){
			    		
			    		return 1
			    	}
			    	else
			    		return 0.6})

			    .attr("stroke-width", function(di){
			    	if(d==di.properties.name){
			    		
			    		return "2"
			    	}
			    	else
			    		return "0.6"})
			    

    		
    	})
    	.on('mouseout', function(d, i) {
    		
    		d3.select(this)
    			.style("stroke-width", 0.5);

    		tool_tip_bar.hide();

    		svg.selectAll("path")
			    .attr("fill-opacity", function(di){
			    	return 0.6
			    })

			    .attr("stroke-width", function(di){
			    	return "0.6"
			    })

    	});
    	

/////////

	svg.selectAll("path")
    	.on('mouseover', function(di, i) {
    		
    		d3.select(this)
	    		.attr("fill-opacity", 1)
			    .attr("stroke-width", "2")

    		svg_bar.selectAll("rect")
    				.style("stroke-width", function(d){
    					if (d == di.properties.name){

    						tool_tip_bar.show(d,  document.getElementById(d+divId));
							var tool_tip_bar_w = 170,
								tool_tip_bar_h = 70;
						

							var tooltipbarSVG = d3.select("#mySVGtooltip_bar")
								.append("svg")
								.attr("width", tool_tip_bar_w)
								.attr("height", tool_tip_bar_h)
								.style("background", "rgba(0, 0, 0, 0.6)")
								.style("border", "1px solid black")
								.attr("fill-opacity", "2")
								.style('z-index',3);

							tooltipbarSVG.append("text")
									.attr("x", 5)
									.attr("y", 20)
									.attr("dy", ".35em")
									.style("fill", "white")
									.style('font-size', 15)
									.text("\n Area: "+d);
									

							tooltipbarSVG.append("text")
									.attr("x", 5)
									.attr("y", 40)
									.attr("dy", ".35em")
									.style("fill", "white")
									.style('font-size', 15)
									.text("\n Percentage cut: "+((jsonData[d]/total_num) * 100).toFixed(2)+"%");

							return 2
    					}
    					else{
    						return 0.5
    					}
    				})

    	})
    	.on('mouseout', function(d, i) {
    		
    		d3.select(this)
    			.attr("fill-opacity", 0.6)
			    .attr("stroke-width", "0.6")

			tool_tip_bar.hide();
			svg_bar.selectAll("rect")
    				.style("stroke-width", function(d){
    					return 0.5
    				})
    	});
	function render_overlay(){

	    function projectPoint(lng, lat) {
	        let point = map.project(new mapboxgl.LngLat(lng, lat));
	        this.stream.point(point.x, point.y);
	    }

	    transform = d3.geoTransform({point:projectPoint});
	    path = d3.geoPath().projection(transform);
	    svg.selectAll("path")
	    	.attr("d", path);
	}


}

function create_temporal_graph(divId, temporal_url){
	
	d3.json(temporal_url, function(errors, jsonData){
		
		var margin = {top: 20, right: 20, bottom: 30, left: 50},
	    	width = 1300,
			height = 300;

		
		var n = 24;
		x_data = Array.apply(null, {length: n}).map((d,i) => i+1)
		
		var parseTime = d3.timeParse("%H");

		var xScale = d3.scaleTime()
		    .domain(d3.extent(x_data, function(d) { return parseTime(d) }))
		    .range([0, width])
		    .nice(); 

		
		var yScale = d3.scaleLinear()
		    .domain([d3.min(d3.values(jsonData)), d3.max(d3.values(jsonData))]) 
		    .range([height, 0]); 

		var line = d3.line()
		    .x(function(d, i){return xScale(parseTime(x_data[i])) }) 
		    .y(function(d) { return yScale(d.y); }) 
		    .curve(d3.curveMonotoneX) 

		
		var dataset = d3.range(n).map(function(d, i) { 
		
			if (jsonData[d]==null){
				return {
				"y": 0 
					} 
				}

			return {
				"y": parseInt(jsonData[d]) 
			} 

		})
	
		
		var svg = d3.select("#"+divId).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg.append("text")             
		  .attr("transform",
		        "translate(" + (width/2) + " ," + 
		                       (height + margin.top+10) + ")")
		  .style("text-anchor", "middle")
		  .text("Hours");

		svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(d3.axisBottom(xScale)
    			.tickFormat(d3.timeFormat('%H:%M')));

	  svg.append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 0 - margin.left)
	      .attr("x",0 - (height / 2))
	      .attr("dy", "1em")
	      .style("text-anchor", "middle")
	      .text("Num of Orders"); 
		svg.append("g")
		    .attr("class", "y axis")
		    .call(d3.axisLeft(yScale)); 

		svg.append("path")
		    .datum(dataset) 
		    .attr("class", "line") 
		    .attr("d", line) 
		    .attr("stroke-width", "3")
			.attr("fill", "none")
			.attr("stroke", "#ffab00");

		var tool_tip_line = d3.tip()
			.attr("class", "d3-tip")
			.offset([0, 40])
			.html("<div id='mySVGtooltip"+divId+"_line' class='customer'></div>");

		var focus = svg.append("g")
			  .attr("class", "focus")
			  .style("display", "none");

		focus.append("circle")
		  .attr("r", 4.5);

		focus.append("text")
		  .attr("x", 9)
		  .attr("dy", ".35em");

		svg.selectAll(".line").call(tool_tip_line)

		var formatDate = d3.timeFormat("%H:%M")

		svg.selectAll(".line")
	    	.on('mouseover', function(di, i) {
	    		var time = xScale.invert(d3.mouse(this)[0])
	    		console.log(formatDate(time));
	    		console.log(yScale.invert(d3.mouse(this)[1]));
				tool_tip_line.show();
					var tool_tip_line_w = 100,
						tool_tip_line_h = 50;
				

					var tooltiplineSVG = d3.select("#mySVGtooltip"+divId+"_line")
						.append("svg")
						.attr("width", tool_tip_line_w)
						.attr("height", tool_tip_line_h);

					tooltiplineSVG.append("text")
							.attr("x", 5)
							.attr("y", 20)
							.attr("dy", ".35em")
							.style("fill", "black")
							.style('font-size', 11)
							.text("\nTime:"+formatDate(time));

					tooltiplineSVG.append("text")
							.attr("x", 5)
							.attr("y", 30)
							.attr("dy", ".35em")
							.style("fill", "black")
							.style('font-size', 11)
							.text("\nOrders: "+yScale.invert(d3.mouse(this)[1]).toFixed(1));



	    		
	    	});

		});

	


}

function get_customer_month(month){
	var urls = months_customer_data[month]
	var kwtData_url = "https://query.data.world/s/dk5r7fnrj4fmvstrw2abu66sp3vtym"
	d3.json(kwtData_url, function(errors, kwtData){
		d3.json(urls['cost'], function(errors, costJson){
			d3.json(urls['orders'], function(errors, ordersJson){
				
				document.getElementById("order_num").innerHTML = "";
				document.getElementById("total_revenue").innerHTML = "";

				document.getElementById("order_num_bar").innerHTML = "";
				document.getElementById("total_revenue_bar").innerHTML = "";

				document.getElementById("customers_order_time").innerHTML = "";

				$(".customer").each(function(d) {
	                $(this).remove();
	            });
				plot_graph(kwtData, ordersJson, "order_num");
				plot_graph(kwtData, costJson, "total_revenue");
				create_temporal_graph("customers_order_time", months_customer_data[month]['temporal']);
			})
		})
	})
	
}

function get_customers(kwtData, ordersJson, costJson){

	var map = lay_map("customer_heat_map");
	plot_graph(kwtData, ordersJson, "customer", map);
	//plot_graph(kwtData, costJson, "total_revenue", map);
	create_temporal_graph("customers_order_time", months_customer_data['March']['temporal']);
}



