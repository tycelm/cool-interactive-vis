const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 40, right: 40, bottom: 80, left: 70 };
const tooltip = d3.select(".tooltip");

class BubbleChart {
  constructor(data) {
    this._data = data;
    this.filterType = "indie"; // default to indie
  }

  setFilter(type) {
    this.filterType = type;
  }

  getFilteredData() {
    let vis = this;
    
    if (vis.filterType === "indie") {
      // Filter for Indie games (must include "Indie" genre)
      return vis._data.filter(d => d.genres.includes("Indie") && d.genres.includes("Action"));
    } else {
      // Filter for Studio games (must NOT include "Indie" genre, but include "Action")
      return vis._data.filter(d => !d.genres.includes("Indie") && d.genres.includes("Action"));
    }
  }

  initVis() {
    let vis = this;
    
    // transforming data
    vis._data.forEach((d) => {
      d.price = +d["price_initial (USD)"];
      d.positive = +d.positive_percentual;
      d.reviews = +d.total_reviews;

      // added year for custom sorting
      const date = new Date(d.release_date);
      d.year = date.getFullYear();

      d.genres = d.genres
        ? d.genres
            .replace(/[\[\]']/g, "")
            .split(",")
            .map((g) => g.trim())
        : [];
    });

    // filter based on dropdown selection
    const filtered = vis.getFilteredData();
    console.log("Filtered rows:", filtered.length);

    // scale
    let x = d3
      .scaleLinear()
      .domain([0, d3.max(filtered, (d) => d.price) || 50])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(filtered, (d) => d.positive) || 100])
      .range([height - margin.bottom, margin.top]);

    vis.color = d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);

    // axis
    vis.xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 40)
      .attr("fill", "#fff")
      .attr("text-anchor", "middle")
      .text("Price (USD)");

    vis.yAxis = svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", 30)
      .attr("fill", "#fff")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Positive Percentual (%)");

    // bubbles
    svg
      .selectAll("circle")
      .data(filtered)
      .join("circle")
      .attr("cx", (d) => x(d.price))
      .attr("cy", (d) => y(d.positive))
      .attr("r", (d) => Math.sqrt(d.reviews + 1) * 0.1)
      .attr("fill", (d) => vis.color(d.positive))
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br>Price: $${d.price}<br>Positive: ${d.positive}%<br>Reviews: ${d.reviews}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    // color
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "color-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%");

    d3.range(0, 101, 10).forEach((p) => {
      gradient
        .append("stop")
        .attr("offset", `${p}%`)
        .attr("stop-color", vis.color(p));
    });

    svg
      .append("rect")
      .attr("x", width / 2 - 100)
      .attr("y", height - 20)
      .attr("width", 200)
      .attr("height", 10)
      .style("fill", "url(#color-gradient)");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .text("Positive Percentual (%)");
  }

  updateVis(timeDomain) {
    let vis = this;

    const filtered = vis.getFilteredData();

    const [min, max] = timeDomain;
    const timeFiltered = filtered.filter((d) => {
      return d.year >= min && max >= d.year;
    });
    console.log("Min:", min, "Max:", max);
    console.log("Filtered rows:", timeFiltered.length);

    let x = d3
      .scaleLinear()
      .domain([0, d3.max(timeFiltered, (d) => d.price) || 50])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(timeFiltered, (d) => d.positive) || 100])
      .range([height - margin.bottom, margin.top]);

    vis.xAxis.transition().duration(1000).call(d3.axisBottom(x));
    vis.yAxis.transition().duration(1000).call(d3.axisLeft(y));

    const circles = svg.selectAll("circle").data(timeFiltered, (d) => d.name);
    circles.exit().transition().duration(500).attr("r", 0).remove();

    circles
      .join("circle")
      .attr("cx", (d) => x(d.price))
      .attr("cy", (d) => y(d.positive))
      .attr("r", (d) => Math.sqrt(d.reviews + 1) * 0.1)
      .attr("fill", (d) => vis.color(d.positive))
      .attr("opacity", 0.7);

    svg
      .selectAll("circle")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br>Price: $${d.price}<br>Positive: ${d.positive}%<br>Reviews: ${d.reviews}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  }
}