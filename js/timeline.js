// this script draws a timeline and passes the year range into the bubble chart
const timelineHeight = 100;
const timelineMargin = { top: 20, right: 40, bottom: 20, left: 40 };

class Timeline {
  constructor(data) {
    this._data = data;
  }

  initVis() {
    let vis = this;

    // filter Indie & Action
    // TODO: need to change this for the dropdown menu?
    const filtered = vis._data.filter(
      (d) => d.genres.includes("Indie") && d.genres.includes("Action")
    );

    const yearlyCounts = d3.rollup(
      filtered,
      (v) => v.length,
      (d) => new Date(d.release_date).getFullYear()
    );

    // convert the map to an array, then sort it
    const yearData = Array.from(yearlyCounts, ([year, count]) => ({
      year,
      count,
    }))
      .filter((d) => !isNaN(d.year)) // removing NaN
      .filter((d) => {
        return d.year >= 2006;
      }) // removing 1997 entry since thats the only entry
      .sort((a, b) => a.year - b.year);

    // create extend with year range
    let yearRange = d3.extent(yearData, function (d) {
      return d.year;
    });

    console.log(yearData);

    // scale
    vis.timeX = d3
      .scaleLinear()
      .domain(yearRange)
      .range([timelineMargin.left, width - timelineMargin.right]);

    vis.countY = d3
      .scaleLinear()
      .domain([0, d3.max(yearData, (d) => d.count)])
      .range([timelineHeight - timelineMargin.bottom, timelineMargin.top]);

    // make timeline svg
    let timeline = d3
      .select("#timeline")
      .append("svg")
      .attr("width", width + timelineMargin.left + timelineMargin.right)
      .attr("height", timelineHeight)
      .append("g")
      .attr("transform", "translate(" + timelineMargin.right + ",0)");

    // y-axis
    timeline
      .append("g")
      .attr("transform", `translate(${timelineMargin.left},0)`)
      .call(d3.axisLeft(vis.countY).ticks(3))
      .append("text")
      .attr("x", -timelineHeight / 2)
      .attr("y", -50)
      .attr("fill", "#fff")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Number of Games");

    // make line graph
    const area = d3
      .area()
      .x((d) => vis.timeX(d.year))
      .y0(vis.countY(0)) // baseline (where the area starts)
      .y1((d) => vis.countY(d.count))
      .curve(d3.curveCardinal);
    // draw line graph
    timeline
      .append("path")
      .datum(yearData)
      .style("fill", "#058dc7")
      .attr("d", area);

    // add the brush component
    vis.brush = d3
      .brushX()
      .extent([
        [timelineMargin.left, 0],
        [width - timelineMargin.right, timelineHeight],
      ])
      .on("brush", brushed);

    // Append brush component here
    timeline
      .append("g")
      .attr("class", "x brush")
      .call(vis.brush)
      .selectAll("rect")
      .attr("y", -6)
      .attr("height", timelineHeight + 7);

    // x-axis
    timeline
      .append("g")
      .attr(
        "transform",
        `translate(0,${timelineHeight - timelineMargin.bottom})`
      )
      .call(
        d3
          .axisBottom(vis.timeX)
          .tickFormat(d3.format("d"))
          .tickSize(
            -(timelineHeight - timelineMargin.top - timelineMargin.bottom)
          )
      )
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#fff")
      .attr("text-anchor", "middle")
      .text("Year");
  }
}
