// this script draws a timeline and passes the year range into the bubble chart
const timelineHeight = 100;
const timelineWidth = 800;
const timelineMargin = { top: 20, right: 40, bottom: 20, left: 40 };

class Timeline {
  constructor(data) {
    this._data = data;
    this.filterType = "indie";
    this.selectedGenres = ["Action"];
    this.svg = null;
  }

  setFilter(type, genres) {
    this.filterType = type;
    this.selectedGenres = genres;
  }

  getFilteredData() {
    let vis = this;

    if (vis.filterType === "indie") {
      // Filter for Indie games (must include "Indie" genre AND all selected genres)
      return vis._data.filter((d) => {
        return (
          d.genres.includes("Indie") &&
          vis.selectedGenres.every((genre) => d.genres.includes(genre))
        );
      });
    } else {
      // Filter for Studio games (must NOT include "Indie" genre, but include all selected genres)
      return vis._data.filter((d) => {
        return (
          !d.genres.includes("Indie") &&
          vis.selectedGenres.every((genre) => d.genres.includes(genre))
        );
      });
    }
  }

  initVis() {
    let vis = this;

    // filter based on selection
    const filtered = vis.getFilteredData();

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
      .range([timelineMargin.left, timelineWidth - timelineMargin.right]);

    vis.countY = d3
      .scaleLinear()
      .domain([0, d3.max(yearData, (d) => d.count)])
      .range([timelineHeight - timelineMargin.bottom, timelineMargin.top]);

    // make timeline svg
    vis.svg = d3
      .select("#timeline")
      .append("svg")
      .attr("width", timelineWidth + timelineMargin.left + timelineMargin.right)
      .attr("height", timelineHeight)
      .append("g")
      .attr("transform", "translate(" + timelineMargin.right + ",0)");

    // y-axis
    vis.svg
      .append("g")
      .attr("class", "y-axis")
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
    vis.svg
      .append("path")
      .attr("class", "area-path")
      .datum(yearData)
      .style("fill", "#058dc7")
      .attr("d", area);

    // add the brush component
    vis.brush = d3
      .brushX()
      .extent([
        [timelineMargin.left, 0],
        [timelineWidth - timelineMargin.right, timelineHeight],
      ])
      .on("brush", brushed);

    // Append brush component here
    vis.svg
      .append("g")
      .attr("class", "x brush")
      .call(vis.brush)
      .selectAll("rect")
      .attr("y", -6)
      .attr("height", timelineHeight + 7);

    // x-axis
    vis.svg
      .append("g")
      .attr("class", "x-axis")
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
      .attr("x", timelineWidth / 2)
      .attr("y", 40)
      .attr("fill", "#fff")
      .attr("text-anchor", "middle")
      .text("Year");
  }

  updateVis() {
    let vis = this;

    // filter based on selection
    const filtered = vis.getFilteredData();

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
      .filter((d) => !isNaN(d.year))
      .filter((d) => d.year >= 2006)
      .sort((a, b) => a.year - b.year);

    // update scale domains
    let yearRange = d3.extent(yearData, (d) => d.year);
    vis.timeX.domain(yearRange);
    vis.countY.domain([0, d3.max(yearData, (d) => d.count)]);

    // update axes
    vis.svg
      .select(".y-axis")
      .transition()
      .duration(1000)
      .call(d3.axisLeft(vis.countY).ticks(3));

    vis.svg
      .select(".x-axis")
      .transition()
      .duration(1000)
      .call(
        d3
          .axisBottom(vis.timeX)
          .tickFormat(d3.format("d"))
          .tickSize(
            -(timelineHeight - timelineMargin.top - timelineMargin.bottom)
          )
      );

    // update area
    const area = d3
      .area()
      .x((d) => vis.timeX(d.year))
      .y0(vis.countY(0))
      .y1((d) => vis.countY(d.count))
      .curve(d3.curveCardinal);

    vis.svg
      .select(".area-path")
      .datum(yearData)
      .transition()
      .duration(1000)
      .attr("d", area);

    // update brush extent
    vis.brush.extent([
      [timelineMargin.left, 0],
      [timelineWidth - timelineMargin.right, timelineHeight],
    ]);

    vis.svg.select(".x.brush").call(vis.brush);
  }
}
