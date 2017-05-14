var visualization = {
	drawPlan: function(config) {
		element = config.element,
		colors = config.colors,
		data = config.data,
		margin = { top: 20, right: 20, bottom: 30, left: 50 },
		width = 900 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom,
		xScale = d3.scaleLinear().rangeRound([0, width]),
		yScale = d3.scaleBand().rangeRound([height, 0]).padding(0.02),
		getColor = d3.scaleOrdinal(colors),
		xAxis = d3.axisBottom(xScale),
		yAxis = d3.axisLeft(yScale),
		svg = d3.select("#" + element).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var stack = d3.stack()
			.keys(data.keys)
			.offset(d3.stackOffsetNone);

		var layers = stack(data.teams);
		yScale.domain(data.teams.map(function(d) { return d.team; }));
		xScale.domain([0, d3.max(layers[layers.length - 1], function(d) { return d[1]; }) ]);
		yScale.domain(data.teams.map(function(d) { return d.team; }));	

		// create hatched pattern defs
		defs = svg.append("defs");
		var pattern = defs.selectAll("pattern")
			.data(data.keys)
			.enter().append("pattern")
			.attr("id", function(d, i) { return "diagonalHatch"+i; })
			.attr("patternUnits", "userSpaceOnUse")
			.attr("width", "7")
			.attr("height", "4")
			.attr("patternTransform", "rotate(45)");
		pattern.append("rect")
			.attr("width", "3")
			.attr("height", "4")
			.attr("transform", "translate(0,0)")
			.attr("fill", function(d, i) { return getColor(i); })
			.attr("opacity", "0.3");

		// create segment column for each level
		var layer = svg.selectAll(".layer")
			.data(layers)
			.enter().append("g")
			.attr("class", "layer")
			.style("fill", function(d, i) { return "url(#diagonalHatch" + i +")"; });

		// draw segment for each team
		layer.selectAll("rect.plan-segment")
		  .data(function(d) {return d; })
		  .enter().append("rect")
		  .attr("y", function(d) { return yScale(d.data.team); })
		  .attr("x", function(d) { return xScale(d[0]); })
		  .attr("height", yScale.bandwidth())
		  .attr("width", function(d) { return xScale(d[1]) - xScale(d[0]) });

		// draw bounding lines for each team
		layer.selectAll("rect.plan-bound")
		  .data(function(d, i) { return d; })
		  .enter().append("rect")
		  .attr("y", function(d) { return yScale(d.data.team); })
		  .attr("x", function(d) { return xScale(d[1]); })
		  .attr("height", yScale.bandwidth())
		  .attr("width", "3")
		  .attr("fill", function(d, i) { return getColor(d3.select(this.parentNode).datum().index); });

		// append y axis
		svg.append("g")
			.attr("class", "axis axis-y")
			.attr("transform", "translate(0,0)")
			.call(yAxis);	

		// append x axis
		/*svg.append("g")
			.attr("class", "axis axis-x")
			.attr("transform", "translate(0," + (height+5) + ")")
			.call(xAxis);*/
	}
}

d3.json("data/game-plan.json", function(data) {
	var plandata = data;
	colors = ["#0e6f90", "#158136", "#ec7e26", "#d82f36"];
	visualization.drawPlan({
		data: plandata,
		element: 'chart',
		colors: colors
	});
});

/*function generateChart(dataset, w, h) {
	var xScale = d3.scale.ordinal()
				.domain(d3.range(10))
				.rangeRoundBands([0, w], 0.05);

	var yScale = d3.scale.linear()
				.domain([0, d3.max(dataset, function(d) {
					var time = d.duration.split(":");
					var seconds = (time[0]) * 60 * 60 + (time[1]) * 60 + (time[2]); 
					return seconds;
				})])
				.range([0, h]);

	//Define key function, to be used when binding data
	var key = function(d) {
		return d.team;
	};

	var svg = d3.select("body")
		.append("svg")
		.attr("width", w)
		.attr("height", h);

	svg.selectAll("rect")
   .data(dataset, key)		//Bind data with custom key function
   .enter()
   .append("rect")
   .attr("x", function(d, i) {
		return xScale(i);
   })
   .attr("y", function(d) {
		var time = d.duration.split(":");
		var seconds = (time[0]) * 60 * 60 + (time[1]) * 60 + (time[2]);
		return h - yScale(seconds);
   })
   .attr("width", xScale.rangeBand())
   
   .attr("height", function(d) {
		var time = d.duration.split(":");
		var seconds = (time[0]) * 60 * 60 + (time[1]) * 60 + (time[2]);
		return yScale(seconds);
   })
   .attr("fill", function(d) {
		var colors = ["blue", "red", "yellow", "green", "orange", "pink", "purple", "aqua"];
		console.log(d.team);
		return colors[d.team];
   });
}*/