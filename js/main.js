var visualization = {
	drawPlan: function(config) {
		element = config.element,
		colors = config.colors,
		plandata = config.data,
		time = config.time,
		padding = { top: 50, right: 20, bottom: 20, left: 80 },
		width = 1000 - padding.left - padding.right,
		height = 600 - padding.top - padding.bottom,
		timeWidth = 130,
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

		plan = svg.append("g")
			.attr("class", "plan");

		// create hatched pattern defs
		defs = plan.append("defs");
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
			.attr("opacity", "0.5");

		// create segment column for each level
		planLayers = plan.selectAll(".plan-layer")
			.data(layers)
			.enter().append("g")
			.attr("class", "plan-layer")
			.style("fill", function(d, i) { return "url(#diagonalHatch" + i +")"; });

		// draw segment for each team
		planSegments = planLayers.selectAll(".plan-segment")
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

		// append time
		timeText = svg.append("text")
			.attr("class", "time")
			.attr("x", width-timeWidth)
			.attr("y", -20)
			.text(getTimeString(time));
	},
	drawData: function(config) {
		time = config.time,
		gamedata = config.data;
		icons = config.icons;
		var colors = config.colors,
			getColor = d3.scaleOrdinal(colors);

		var stack = d3.stack()
			.keys(gamedata.keys)
			.offset(d3.stackOffsetNone);

		var layers = stack(gamedata.teams);

		gameDomain = d3.max(layers[layers.length - 1], function(d) { return d[1]; });

		// TODO rescale graph when needed (gameDomain > planDomain)
		if(!isNaN(gameDomain)) {
			xScale.domain([0, Math.max(planDomain, gameDomain)]);
		}

		// create segment column for each level
		var layer = svg.selectAll(".game-layer")
			.data(layers)
			.enter().append("g")
			.attr("class", "game-layer")
			.attr("fill", function(d, i) { return getColor(i); })

		// draw segment for each team
		var working = [];
		layer.selectAll("rect.game-segment")
		  .data(function(d) { return d; })
		  .enter().append("rect")
		  .attr("y", function(d) { return yScale(d.data.team); })
		  .attr("x", function(d) {
		  	return xScale(d[0]);
		  })
		  .attr("height", yScale.bandwidth())
		  .attr("width", function(d, i) {
		  	// TODO better?
		  	if(isNaN(d[1])) {
		  		if(working[i]) {
		  			return 0;
		  		}
		  		else {
		  			working[i] = true;
		  			return xScale(time) - xScale(d[0]);
		  		}
		  	}
		  	else {
		  		var opacity = (d.data.level == 0) ? 0 : 0.3;
		  		d3.select(this).attr("class", "game-segment-finished")
		  			.attr("opacity", "0.3");
		  		return xScale(d[1]) - xScale(d[0]);
		  	}
		  });

		// update time line
		 timeline.attr("x1", xScale(time)+2)
		 	.attr("x2", xScale(time)+2);

		// update time
		timeText.text(getTimeString(time));

		// update plan according to actual data
		this.updatePlan(layers);

		// draw events
		events = svg.append("g")
            .attr("class", "events");
        var eventLayers = events.selectAll("g.event-layer")
        	.data(gamedata.teams)
        	.enter().append("g");
        eventLayers.selectAll("text.event")
        	.data(function(d, i) { return d.events; })
        	.enter().append("text")
            .attr("x", function(d) {
            	return Math.max(0, xScale(d.time) - yScale.bandwidth()*0.5);
            })
            .attr("y", function(d) {
            	return yScale(d3.select(this.parentNode).datum().team) + yScale.bandwidth()*0.7;
            })
            .attr("fill", function(d, i) {
            	var team = d3.select(this.parentNode).datum().team,
            		data = d3.select(this.parentNode).datum(),
            		level = 0,
            		durationSum = 0;
            	//TODO black color for current ("working") level
            	gamedata.keys.forEach(function(levelKey, i) {
            		var duration = parseInt(data[levelKey]);
                    if (!duration) return;
                    durationSum += duration;
                    if (d.time <= durationSum) {
                    	// level found
                    	return;
                    }
                    level += 1;
                });
                if(level == -1) return "#000";
            	return getColor(level);
            })
            .attr("font-family","FontAwesome")
            .attr('font-size', function(d) { return yScale.bandwidth()/2; } )
  			.text(function(d) { return icons[d.type]; });

  		// move bounds to top
		bounds.raise();
	},
	updatePlan: function(layersdata) {
		// move plan to top
		plan.raise();

		var offset = [];
		var working = [];
		planSegments
			.attr("opacity", function(d,i) {
				var levelIndex = d3.select(this.parentNode).datum().index,
					teamIndex = i,
					currentData = layersdata[levelIndex][teamIndex];
				if(isNaN(currentData[1])) {
					if(working[teamIndex]) { return 0; }
					else {
						working[teamIndex] = true;
						return 1;
					}	
				}
				else { return 0; }
			})
			.attr("x", function(d, i) {
				var levelIndex = d3.select(this.parentNode).datum().index,
					teamIndex = i,
					currentData = layersdata[levelIndex][teamIndex],
					isCurrentLevel = isNaN(currentData[1]),
					x = d[0];
				if(isCurrentLevel) {
					offset[teamIndex] = currentData[0] - d[0];
					
				}
				
				if(offset[teamIndex] != undefined) {
					var shifted = x + offset[teamIndex];
					// if next level should start in past, must be shifted to present (as same as all next level)
					if(!isCurrentLevel && shifted < time) {
						offset[teamIndex] += (time - shifted);
						shifted = time;
					}
					x = shifted;
				}
				return xScale(Math.max(1,x));
			});
	}
}

/*d3.json("data/game-plan.json", function(data) {
	var plandata = data,
		colors = ["#0e6f90", "#158136", "#ec7e26", "#d82f36"];
	visualization.drawPlan({
		data: plandata,
		element: 'chart',
		colors: colors,
		time: 0
	});
});
*/

// TODO: some callback when plan is drawn?
// TODO: styles attributes to classes
// TODO: clean it and make it nice

// the lowest time as the game start
var startTime = 0;
d3.csv("data/user_events_log.csv",
	function(d, i) {
		var datetime = new Date(d.datetime),
			timestamp = datetime.getTime()/1000;
		if((i == 0) || (d.event == "Game started" && parseInt(d.level) == 1 && startTime > timestamp)) {
			startTime = timestamp;
		}
		return {
			"team" : d.uco,
			"event" : d.event,
			"level" : parseInt(d.level),
			"time" : getSeconds(d.time),
			"timestamp" : timestamp
		};
	}, function(data) {
		// TODO time plan for each level?
		var levelTimePlan = 1000;

		var gamedataset = [],
			plandataset = [],
			// stores levels keys for use in d3.stack, in format "level + index" or "start" for start of the game
			levels = ["start"],
			// to get the highest time as current time
			time =  0,
			// map for keys (team id) to game/plan datasets, because datasets must be arrays to use in d3.stack
			teamsMap = {};
		data.forEach(function(d) {
			var eventTime = Math.max(0, d.timestamp - startTime),
				levelKey = "level" + d.level
				type = null;

			// if the team is not in dataset yet, it is added to game/plan datasets and map
			if(teamsMap[d.team] == null) {
				teamsMap[d.team] = gamedataset.length;
				gamedataset[teamsMap[d.team]] = {};
				gamedataset[teamsMap[d.team]]["team"] = d.team;
				gamedataset[teamsMap[d.team]]["events"] = [];

				plandataset[teamsMap[d.team]] = {};
				plandataset[teamsMap[d.team]]["team"] = d.team;
				plandataset[teamsMap[d.team]]["start"] = 0;
			}

			// delete possibly recorded higher levels from some previous game
			var tmpLevel = d.level+1;
			while((gamedataset[teamsMap[d.team]]["level" + tmpLevel] != undefined) && (tmpLevel < levels.length)) {
				delete gamedataset[teamsMap[d.team]]["level" + tmpLevel];
				console.log(gamedataset[teamsMap[d.team]]);
				tmpLevel++;
				console.log(tmpLevel-1);
			}

			// add level to levels array, if it does not contain it
			if(levels.indexOf(levelKey)  == -1) levels.push(levelKey);

			if(time < d.timestamp) time = d.timestamp;

			// according to type of event, add it to events array of the team and/or store the time of level end
			switch(d.event) {
				case "Game started":
					// start at 0 time, not added to structure
					type = null;
					if(d.level == 1) {
						//if the first level started, save start of game as level 0 end
						gamedataset[teamsMap[d.team]]["start"] = eventTime;
					}
					break;
				case "Returned from help level":
					type = "solution";
					break;
				case "Correct flag submited":
					type = null;
					// level is finished, save the time (shifted by start time)
					gamedataset[teamsMap[d.team]][levelKey] = d.time;
					break;
				case "Level cowardly skipped":
					type = "skip";
					// level is finished, save the time
					gamedataset[teamsMap[d.team]][levelKey] = d.time;
					break;
				default:
					if(d.event.substr(0,4) == 'Hint')
						type = "hint";
					else type = null;
					break;
			}

			if(type != null) {
				var event = {
					"type" : type,
					"name" : d.event,
					"time" : eventTime
				}
				gamedataset[teamsMap[d.team]]["events"].push(event);
			}		
		});

		plandataset.forEach(function(team) {
			levels.forEach(function(level) {
				team[level] = (level != "start") ? levelTimePlan : 0;
			});
		});
		

		var game = {
			"time" : time - startTime,
			"keys" : levels,
			"teams" : gamedataset
		}

		var plan = {
			"keys" : levels,
			"teams" : plandataset
		}
		console.log(JSON.stringify(game));
		console.log(JSON.stringify(plan));
		// level 0 transparent color, other modulo i (transparent exlude)
		var gamedata = game,
			gameColors = ["transparent", "#1c89b8", "#20ac4c", "#ff9d3c", "#fc5248"],
			icons = { "hint" : "\uf111", "solution" : "\uf00c", "skip" : "\uf00d" };
		// level 0 transparent color, other modulo i (transparent exlude)
		var plandata = plan,
			planColors = ["transparent", "#0e6f90", "#158136", "#ec7e26", "#d82f36"];

		visualization.drawPlan({
			data: plandata,
			element: 'chart',
			colors: planColors,
			time: 0,
		});
		visualization.drawData({
			data: gamedata,
			colors: gameColors,
			icons: icons,
			time: gamedata.time
		});
	}
);

function getTimeString(seconds) {
	var date = new Date(null);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8)
}

function getSeconds(timeString) {
	var s = timeString.split(':');
	return (+s[0]) * 3600 + (+s[1]) * 60 + (+s[2]); 
}