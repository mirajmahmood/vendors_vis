
function plot_graph(kwtData, jsonData, divId){
	var total_num = 0

	Object.keys(jsonData).forEach(function(key) {
		total_num += jsonData[key];
	});



	var width = 1300,
		height = 600
		z = d3.scaleSequential(d3["interpolate" + "BuPu"]);

	z.domain([d3.min(d3.values(jsonData)), d3.max(d3.values(jsonData))])
	

	mapboxgl.accessToken = 'pk.eyJ1Ijoibm90bWlyYWoiLCJhIjoiY2pmYzd4Nno0MXRiNzQwcTdydXNibzZtaCJ9.KwcKrFYXAQp-LqhyX-8l1Q';
		var map = new mapboxgl.Map({
	    container: divId, // container id
	    style: 'mapbox://styles/mapbox/streets-v9',
	    center: [48.02398, 29.331], // starting position
	    zoom: 11.5 // starting zoom
		});

	map.scrollZoom.disable()
	map.addControl(new mapboxgl.NavigationControl());

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
		.html("<div id='mySVGtooltip"+divId+"'></div>");

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

	var svg_bar = d3.select("#"+divId+"_bar").append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g");
	
	var tool_tip_bar = d3.tip()
		.attr("class", "d3-tip")
		.offset([0, 40])
		.html("<div id='mySVGtooltip"+divId+"_bar' class='customer'></div>");

	svg_bar.call(tool_tip_bar);
	
	var g = svg_bar.selectAll(".bar").data(Object.keys(jsonData))
			.enter().append("rect")
	        .attr("x", (d,i) => x(ticks[i])/3.5)
	        .attr("y", (d, i) => (y(jsonData[d])/1.15) + 15)
	        .attr("width", 10)
	        .attr("height", function(d,i) { return ((height - y(jsonData[d]))/1.15) + 30; })
	        .attr("class", "bar")
	        .attr("id", function(d, i){
	        	console.log(ticks[i]);
	        	return d+divId;
	        })
	        .attr("fill", function(d,i){ return z(jsonData[d])})
	        .style("stroke-width", 0.5)
	        .style('stroke', "#000");

console.log("here")

	svg_bar.selectAll("rect")
    	.on('mouseover', function(d, i) {
    		
    		d3.select(this)
    			.style("stroke-width", 2)
    			.style('stroke', "#000");

    	    tool_tip_bar.show(d,  document.getElementById(d+divId));
			var tool_tip_bar_w = 170,
				tool_tip_bar_h = 70;
		

			var tooltipbarSVG = d3.select("#mySVGtooltip"+divId+"_bar")
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
						

							var tooltipbarSVG = d3.select("#mySVGtooltip"+divId+"_bar")
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
function get_customers(kwtData, ordersJson, costJson){

	plot_graph(kwtData, ordersJson, "customers");
	plot_graph(kwtData, costJson, "customers_cost");
	create_temporal_graph("customers_order_time", months_customer_data['March']['temporal']);
	//create_customer_table("customers_table");
}

function get_customer_month(month){
	var urls = months_customer_data[month]
	var kwtData_url = "https://query.data.world/s/dk5r7fnrj4fmvstrw2abu66sp3vtym"
	d3.json(kwtData_url, function(errors, kwtData){
		d3.json(urls['cost'], function(errors, costJson){
			d3.json(urls['orders'], function(errors, ordersJson){
				
				document.getElementById("customers").innerHTML = "";
				document.getElementById("customers_cost").innerHTML = "";
				document.getElementById("customers_bar").innerHTML = "";
				document.getElementById("customers_cost_bar").innerHTML = "";
				document.getElementById("customers_order_time").innerHTML = "";

				$(".customer").each(function(d) {
	                $(this).remove();
	            });
				plot_graph(kwtData, ordersJson, "customers");
				plot_graph(kwtData, costJson, "customers_cost");
				create_temporal_graph("customers_order_time", months_customer_data[month]['temporal']);
				//create_customer_table("customers_table");
			})
		})
	})
	
}

function create_temporal_graph(divId, temporal_url){
	
	d3.json(temporal_url, function(errors, jsonData){
		
	
		// set the dimensions and margins of the graph
		var margin = {top: 20, right: 20, bottom: 30, left: 50},
	    	width = 1300,
			height = 300;

		// The number of datapoints
		var n = 24;

		// 5. X scale will use the index of our data
		var xScale = d3.scaleLinear()
		    .domain([1, n]) // input
		    .range([0, width]); // output

		
		var yScale = d3.scaleLinear()
		    .domain([d3.min(d3.values(jsonData)), d3.max(d3.values(jsonData))]) // input 
		    .range([height, 0]); // output 

		// 7. d3's line generator
		var line = d3.line()
		    .x(function(d, i) { return xScale(i+1); }) // set the x values for the line generator
		    .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
		    .curve(d3.curveMonotoneX) // apply smoothing to the line

		// 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
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
	
	
		// 1. Add the SVG to the page and employ #2
		var svg = d3.select("#"+divId).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// 3. Call the x axis in a group tag

		// text label for the x axis
		svg.append("text")             
		  .attr("transform",
		        "translate(" + (width/2) + " ," + 
		                       (height + margin.top+10) + ")")
		  .style("text-anchor", "middle")
		  .text("Hours");

		svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom
		// text label for the y axis
	  svg.append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 0 - margin.left)
	      .attr("x",0 - (height / 2))
	      .attr("dy", "1em")
	      .style("text-anchor", "middle")
	      .text("Num of Orders"); 
		// 4. Call the y axis in a group tag
		svg.append("g")
		    .attr("class", "y axis")
		    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

		// 9. Append the path, bind the data, and call the line generator 
		svg.append("path")
		    .datum(dataset) // 10. Binds data to the line 
		    .attr("class", "line") // Assign a class for styling 
		    .attr("d", line) // 11. Calls the line generator 
		    .attr("stroke-width", "3")
			.attr("fill", "none")
			.attr("stroke", "#ffab00");

		
		});
}
// function create_customer_table(divId, ordersJson, costJson){
// 	function tabulate(ordersJson, costJson, columns){
// 	    var table = d3.select("body").append("table")
// 	            .attr("style", "margin-left: 200px")
// 	            .style("border-collapse", "collapse")// <= Add this line in
// 	            .style("border", "2px black solid"), // <= Add this line in
// 	        thead = table.append("thead"),
// 	        tbody = table.append("tbody");

// 	    // append the header row
// 	    thead.append("tr")
// 	        .selectAll("th")
// 	        .data(columns)
// 	        .enter()
// 	        .append("th")
// 	            .text(function(column) { return column; });

// 	    // create a row for each object in the data
// 	    var rows = tbody.selectAll("tr")
// 	        .data(Object.keys(ordersJson))
// 	        .enter()
// 	        .append("tr");

// 	    // create a cell in each row for each column
// 	    var cells = rows.selectAll("td")
// 	        .data(function(row) {
// 	            return columns.map(function(column) {
// 	                return {column: column, value: row[column]};
// 	            });
// 	        })
// 	        .enter()
// 	        .append("td")
// 	        .attr("style", "font-family: Courier") // sets the font style
// 	            .html(function(d) { return d.value; });
	    
// 	    return table;
// 	}

// 	// render the table
// 	var peopleTable = tabulate(ordersJson, costJson, ["Area", "Number of Orders", "Total Cost"]);

// 	peopleTable.selectAll("tbody tr") 
// 	        .sort(function(a, b) {
// 	                return d3.descending(a.close, b.close);
// 	        });

// 	peopleTable.selectAll("thead th")
// 	        .text(function(column) {
// 	                return column.charAt(0).toUpperCase()+column.substr(1);
// 	        });


// }

