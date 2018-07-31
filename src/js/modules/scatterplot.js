import * as d3 from "d3v4";
import Handlebars from "handlebars";
// https://classroom.synonym.com/calculate-trendline-2709.html

export class Scatterplot {

	constructor(data, xTag, yTag) {

		var self = this

		// Declare

		this.firstTime = true

		this.default = null

		this.database = null

		this.settings =  null

		this.trendlines =  null

		this.trendline =  null

		this.tiptext =  null

		this.target = null

		this.filter =  null

		this.cats =  null

		this.colours = ["#197caa", "#4bc6df", "#7d0068", "#dc2a7d", "#b51800", "#4e0375", "#e6711b", "#72af7e", "#298422"]

		this.categories =  null

		// Assign

		this.xTag =  xTag

		this.yTag =  yTag

		this.database = data.sheets.database;

		this.database.forEach(function(d,i){
			d.x = +d[xTag];
			d.y = +d[yTag];
		});

		this.settings = data.sheets.settings

		console.log(this.settings)

		if (this.settings[0]["title"]!='') {

			d3.select(".chartTitle").html(self.settings[0]["title"]);

		}

		if (this.settings[0].trendline=='TRUE') {

			this.trendline = true;

			this.trendlines = data.sheets.trendline;

		}

		// Set the tooltip text
		if (this.settings[0].tooltip!='' ) {

			this.tiptext = this.settings[0].tooltip

		}

		// Create the filter selectors if they have been set in the Googledoc
		if (this.settings[0].filter!='' ) {

			this.createFilters()

		}

		// Create the category selectors if they have been set in the Googledoc
		if (this.settings[0].categories!='') {

			this.createCats()

		}

		d3.select("#scatterplot_chart_data_source").html(self.settings[0].source);

		this.render()
	}

	createFilters() {

		console.log("Inside the filter function")

		var self = this

		self.filter = self.settings[0].filter

		self.default = self.settings[0].default_filter

		var filters = [];

		self.database.forEach(function(item) {

			filters.indexOf(item[self.filter]) === -1 ? filters.push(item[self.filter]) : '';

		})

		var html = '';
		
		for (var i = 0; i < filters.length; i++) {

			// Create the categories legend
			html += '<div data-filter="' + filters[i] + '" class="btn filter ' + ( (i==0) ? 'currentfilter' : '') + '">' + filters[i] + '</div>';

		}

		d3.select('#graphicContainer').html(html);


	}

	createCats() {

		var self = this

		self.cats = self.settings[0].categories;

		self.categories = [];

		var categories = [];

		self.database.forEach(function(item) {

			categories.indexOf(item[self.cats]) === -1 ? categories.push(item[self.cats]) : '';

		})

		var html = '';
		
		for (var i = 0; i < categories.length; i++) {

			// Create the catgories array
			var obj = {};
			obj["name"] = categories[i];
			obj["status"] =  true;
			obj["colour"] = self.colours[i]
			self.categories.push(obj);

			// Create the categories legend
			html += '<div class="keyDiv"><span data-cat="' + categories[i] + '" class="keyCircle" style="background: ' + self.colours[i] + '"></span>';
			html += ' <span class="keyText">' + categories[i] + '</span></div>';

		}

		d3.select('#key').html(html);

	}

	labelizer(text) {

		var text = text.replace(/_/g, ' ');

		return text.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});

	}

	render() {

		var self = this

		var isMobile;
		var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		isMobile = (windowWidth < 610) ? true : false ;

		var width = document.querySelector("#graphicContainer").getBoundingClientRect().width;
		var height = (isMobile) ? width*0.7 : width*0.5;		

		var margin = {top: 20, right: 20, bottom: 35, left: 50},
		width = width - margin.left - margin.right,
	    height = height - margin.top - margin.bottom;

	    // Filter the data if the filter value has been set in the Googledoc
	    if (self.filter!=null) {
		    self.target = self.database.filter(function(d) {
		    	return d[self.filter] == self.default
			});
	    } else {
	    	self.target = self.database;
	    }

	    d3.select("#graphicContainer svg").remove();

		// setup x 
		var xValue = function(d) { return d[self.xTag];}, // data -> value
		    x = d3.scaleLinear().range([0, width]), // value -> display
		    xMap = function(d) { return x(xValue(d));}, // data -> display
		    xAxis = d3.axisBottom(x) //d3.svg.axis().scale(x).orient("bottom");

		// setup y
		var yValue = function(d) { return d[self.yTag];}, // data -> value
		    y = d3.scaleLinear().range([height, 0]), // value -> display
		    yMap = function(d) { return y(yValue(d));}, // data -> display
		    yAxis = d3.axisLeft(y); //d3.svg.axis().scale(y).orient("left");

		var svg = d3.select("#graphicContainer").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// Get the values for the X Axis using all the values from the database (This means you can flip between categories and compare values on the same axis)
		var xRange = self.database.map(function (d) { return parseFloat(d[self.xTag]); });
		
		// Set the X axis min value
		var xMin = d3.min(xRange);
		
		// Set the X axis max value
		var xMax = d3.max(xRange);

		// Get the full range
		var yRange = self.database.map(function (d) { return parseFloat(d[self.yTag]); });

		// Add a 5% buffer on either side of the X axis min max values
		var xLabels = self.bufferize(xMin,xMax);
		
		// Set the Y axis min value
		var yMin = Math.round(d3.min(self.database, function(d) { return parseFloat(d[self.yTag])}));

		if (yMin < 5) {
			yMin = 0
		}

		// Set the Y axis max value
		var yMax = Math.round(d3.max(self.database, function(d) { return parseFloat(d[self.yTag])}));

		// Add a 5% buffer on either side of the Y axis min max values
		var yLabels = self.bufferize(yMin,yMax);

		x.domain(xLabels);

		y.domain(yLabels);

		var tooltip = d3.select("body").append("div")
		    .attr("class", "tipster")
		    .style("position", "absolute")
		    .style("background-color", "white")
		    .style("opacity", 0);

		// x-axis
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("class", "label")
			.attr("x", width)
			.attr("y", 35)
			.style("text-anchor", "end")
			.text("Percentage of electorate who voted yes");

		// y-axis
		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("class", "label")
			.attr("transform", "rotate(-90)")
			.attr("y", -50)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			//.text(self.labelizer(self.yTag));

		// draw dots
		svg.selectAll(".dot")
		  	.data(self.target)
			.enter().append("circle")
			.attr("class", function(d) { return "dot " + d.state})
			.attr("r", 3.5)
			.attr("cx", xMap)
			.attr("cy", yMap)
			.style("fill", function(d) { return (self.cats==null) ? '#4bc6df' : self.colorize(d.state)})
			.on("mouseover", function(d) {

				if (self.tiptext!=null) {
					tooltip.transition()
						.duration(200)
					   	.style("opacity", .9);

					tooltip.html( self.tipster(d) )
					   .style("left",  self.tooltip(d3.event.pageX, width) + "px")
					   .style("top", ((isMobile) ? height / 2 : d3.event.pageY + 10) + "px")
				}

			})
			.on("mouseout", function(d) {

				if (self.tiptext!=null) {
				  tooltip.transition()
				       .duration(500)
				       .style("opacity", 0);
				}

			})
			.transition()
			.delay(250)
			.style("display", function(d) { return (self.cats==null) ? 1 : self.opacitize(d.state)})


		    if (self.filter!=null) {
				// Handle the filter clicks
				d3.selectAll(".filter").on("click", self.filters);
		    }

		    if (self.cats!=null) {
				// Handle catgeoriy switch
				d3.selectAll(".keyCircle").on("click", self.stated);
		    }

		    // Add the trendline if it has been specified
		    if (self.trendline) {

				var trendline = self.trendlines.filter(function(value) {

					return value.trendline == self.default

				});

				if (trendline.length==0) {

					trendline = self.trendlines.filter(function(value) {

						return value.trendline == 'default'

					});

				}

				var x1 = parseFloat(trendline[0].min_x)
				var y1 = parseFloat(trendline[0].min_y)
				var x2 = parseFloat(trendline[0].max_x)
				var y2 = parseFloat(trendline[0].max_y)

				var trendData = [[x1,y1,x2,y2]];
				var trendline = svg.selectAll(".trendline")
					.data(trendData);

				trendline.enter()
					.append("line")
					.attr("class", "trendline")
					.attr("x1", function(d) { return x(d[0]); })
					.attr("y1", function(d) { return y(d[1]); })
					.attr("x2", function(d) { return x(d[2]); })
					.attr("y2", function(d) { return y(d[3]); })
					.attr("stroke", "black")
					.attr("stroke-width", 1)
					.style("opacity", 1)
					.style("stroke-dasharray", ("3, 3"))

		    } else {

		    	var lg = self.calcLinear(self.database, "x", "y", d3.min(self.database, function(d){ return d.x}), d3.min(self.database, function(d){ return d.x}));

			    svg.append("line")
			        .attr("class", "regression")
			        .attr("x1", x(lg.ptA.x))
			        .attr("y1", y(lg.ptA.y))
			        .attr("x2", x(lg.ptB.x))
			        .attr("y2", y(lg.ptB.y));


		    }


	}

	calcLinear(data, x, y, minX, minY){

		//console.log(data, x, y, minX, minY)
      /////////
      //SLOPE//
      /////////

      // Let n = the number of data points
      var n = data.length;

      // Get just the points
      var pts = [];
      data.forEach(function(d,i){
        var obj = {};
        obj.x = d[x];
        obj.y = d[y];
        obj.mult = obj.x*obj.y;
        pts.push(obj);
      });

      // Let a equal n times the summation of all x-values multiplied by their corresponding y-values
      // Let b equal the sum of all x-values times the sum of all y-values
      // Let c equal n times the sum of all squared x-values
      // Let d equal the squared sum of all x-values
      var sum = 0;
      var xSum = 0;
      var ySum = 0;
      var sumSq = 0;
      pts.forEach(function(pt){
        sum = sum + pt.mult;
        xSum = xSum + pt.x;
        ySum = ySum + pt.y;
        sumSq = sumSq + (pt.x * pt.x);
      });
      var a = sum * n;
      var b = xSum * ySum;
      var c = sumSq * n;
      var d = xSum * xSum;

      // Plug the values that you calculated for a, b, c, and d into the following equation to calculate the slope
      // slope = m = (a - b) / (c - d)
      var m = (a - b) / (c - d);

      /////////////
      //INTERCEPT//
      /////////////

      // Let e equal the sum of all y-values
      var e = ySum;

      // Let f equal the slope times the sum of all x-values
      var f = m * xSum;

      // Plug the values you have calculated for e and f into the following equation for the y-intercept
      // y-intercept = b = (e - f) / n
      var b = (e - f) / n;

			// Print the equation below the chart
			//document.getElementsByClassName("equation")[0].innerHTML = "y = " + m + "x + " + b;
			//document.getElementsByClassName("equation")[1].innerHTML = "x = ( y - " + b + " ) / " + m;

      // return an object of two points
      // each point is an object with an x and y coordinate
      return {
        ptA : {
          x: minX,
          y: m * minX + b
        },
        ptB : {
          y: minY,
          x: (minY - b) / m
        }
      }

    }


	bufferize(min, max) {

		var buffer = (max - min) / 100 * 5

		return [(min - buffer), (max + buffer)]

	}

	tipster(d) {

		var self = this

		var template = Handlebars.compile(self.tiptext);
		var html = template(d);
		return html

	}

	tooltip(pos, width) {

		var self = this

		if (width < 500) {

			return (width / 2) - 100

		} else {

			return ((pos > width / 2) ? pos  - 235 : pos + 5 )

		}

	}

	stated() {

		var self = this

		var currElement = d3.select(this);

		var cat = currElement.attr("data-cat");

		var activeClass = "greyedOut";

		var alreadyIsActive = d3.select(this).classed(activeClass);

		d3.select(this).classed(activeClass, !alreadyIsActive);

		// Target the circles for a specific cat
		var currCircles = d3.selectAll("#graphicContainer .dot." + cat);

		// Target the trendline for a specific cat
		var trendline = d3.selectAll("#graphicContainer .trendline." + cat);

		(alreadyIsActive) ?  currCircles.style('display','block') : currCircles.style('display', 'none') ;

		(alreadyIsActive) ? trendline.style('opacity', 0.7) : trendline.style('opacity', 0) ;

		self.categories.filter(function(value) {
			if (value.name == cat) {
				value.status = alreadyIsActive
			}
		})

	}

	filters() {

		var self = this

		var currElement = d3.select(this);
		self.default = currElement.attr("data-filter");
		var activeClass = "currentfilter";
		d3.selectAll(".filter").classed(activeClass, false);
		var alreadyIsActive = d3.select(this).classed(activeClass);
		d3.select(this).classed(activeClass, !alreadyIsActive);
		self.render();

	}

	colorize(state) {

		var target = self.categories.filter(function(value){
			return value.name == state
		})

		return target[0].colour
	
	}

	opacitize(state) {

		var target = self.categories.filter(function(value){
			return value.name == state
		})

		return (target[0].status) ? 'block' : 'none'

	}


}