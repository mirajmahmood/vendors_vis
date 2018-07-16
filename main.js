

function initialise(errors, kwtData, ordersJson, costJson){

	get_customers(kwtData, ordersJson, costJson);
	get_vendors();
	get_drivers();
	
}


d3.queue()
    .defer(d3.json, "https://query.data.world/s/dk5r7fnrj4fmvstrw2abu66sp3vtym") //kwt geospatial file
    .defer(d3.json, "https://query.data.world/s/e6tdhwkamycjnwev6mtjhvyug6om5n") //march orders
    .defer(d3.json, "https://query.data.world/s/csf6y4ljcvzy65euzk6wuocbl53foo") //march cost
    .await(initialise);