var visualization = {
	drawPlan: function(config) {
		element = config.element,
		colors = config.colors,
		plandata = config.data,
		time = config.time,
		padding = { top: 20, right: 20, bottom: 20, left: 80 },
		width = 900 - padding.left - padding.right,
		height = 400 - padding.top - padding.bottom,
		xScale = d3.scaleLinear().rangeRound([0, width]),
		yScale = d3.scaleBand().rangeRound([height, 0]).padding(0.02),
		xAxis = d3.axisBottom(xScale),
		yAxis = d3.axisLeft(yScale),
		svg = d3.select("#" + element).append("svg")
				.attr("width", width + padding.left + padding.right)
				.attr("height", height + padding.top + padding.bottom)
				.append("g")
				.attr("transform", "translate(" + padding.left + "," + padding.top + ")");

		var colors = config.colors;
		var getColor = d3.scaleOrdinal(colors);

		var stack = d3.stack()
			.keys(plandata.keys)
			.offset(d3.stackOffsetNone);

		var layers = stack(plandata.teams);

		planDomain = d3.max(layers[layers.length - 1], function(d) { return d[1]; });

		yScale.domain(plandata.teams.map(function(d) { return d.team; }));
		xScale.domain([0, planDomain]);
		yScale.domain(plandata.teams.map(function(d) { return d.team; }));	

		// create hatched pattern defs
		defs = svg.append("defs");
		var pattern = defs.selectAll("pattern")
			.data(plandata.keys)
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
		var layer = svg.selectAll(".plan-layer")
			.data(layers)
			.enter().append("g")
			.attr("class", "plan-layer")
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
		bounds = svg.append("g")
			.attr("class", "bounds");
		var boundGroups = bounds.selectAll(".bounds-layer")
			.data(layers)
			.enter().append("g")
			.attr("class", "bounds-layer")
			.style("fill", function(d, i) { return getColor(i); });
		boundGroups.selectAll("rect.plan-bound")
		  .data(function(d, i) { return d; })
		  .enter().append("rect")
		  .attr("y", function(d) { return yScale(d.data.team); })
		  .attr("x", function(d) { return xScale(d[1]); })
		  .attr("height", yScale.bandwidth())
		  .attr("width", "3");

		// append y axis
		svg.append("g")
			.attr("class", "axis axis-y")
			.attr("transform", "translate(0,0)")
			.call(yAxis);	

		// append time axis
		timeline = svg.append("line")
			.attr("class", "timeline")
			.attr("x1", xScale(time)+2)
			.attr("y1", 0)
			.attr("x2", xScale(time)+2)
			.attr("y2", height)
			.attr("stroke-width", 3);
	},
	drawData: function(config) {
		time = config.time,
		gamedata = config.data;
		
		var colors = config.colors,
			getColor = d3.scaleOrdinal(colors);

		var stack = d3.stack()
			.keys(gamedata.keys)
			.offset(d3.stackOffsetNone);

		var layers = stack(gamedata.teams);

		gameDomain = d3.max(layers[layers.length - 1], function(d) { return d[1]; });

		// TODO rescale graph when needed (gameDomain > planDomain)
		xScale.domain([0, Math.max(planDomain, gameDomain)]);

		// create segment column for each level
		var layer = svg.selectAll(".game-layer")
			.data(layers)
			.enter().append("g")
			.attr("class", "game-layer")
			.attr("fill", function(d, i) { return getColor(i); })

		// draw segment for each team
		layer.selectAll("rect.game-segment")
		  .data(function(d) {return d; })
		  .enter().append("rect")
		  .attr("y", function(d) { return yScale(d.data.team); })
		  .attr("x", function(d) {
		  	return xScale(d[0]);
		  })
		  .attr("height", yScale.bandwidth())
		  .attr("width", function(d) {
		  	// TODO better?
		  	if(isNaN(d[1])) {
		  		return xScale(time) - xScale(d[0]);
		  	}
		  	else {
		  		d3.select(this).attr("class", "game-segment-finished")
		  						.attr("opacity", "0.3");
		  		return xScale(d[1]) - xScale(d[0]);
		  	}
		  });

		// update time line
		 timeline.attr("x1", xScale(time)+2)
		 	.attr("x2", xScale(time)+2);

		// redraw bounds to top
		svg.append(function() {
		  return bounds.remove().node();
		});
	}
}

d3.json("data/game-plan.json", function(data) {
	var plandata = data,
		colors = ["#0e6f90", "#158136", "#ec7e26", "#d82f36"];
	visualization.drawPlan({
		data: plandata,
		element: 'chart',
		colors: colors,
		time: 0
	});
});

// TODO: some callback when plan is drawn?
// TODO: styles attributes to classes
// TODO: clean it and make it nice
d3.json("data/game-data.json", function(data) {
	var gamedata = data,
		colors = ["#1c89b8", "#20ac4c", "#ff9d3c", "#fc5248"];
	visualization.drawData({
		data: gamedata,
		colors: colors,
		time: gamedata.time
	});
});