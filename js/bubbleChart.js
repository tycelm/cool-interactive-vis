const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 40, right: 40, bottom: 80, left: 70 };
const tooltip = d3.select(".tooltip");

class BubbleChart {
  constructor(data) {
    this._data = data;
    this.filterType = "indie";
    this.selectedGenres = ["Action"];
  }

  setFilter(type, genres) {
    this.filterType = type;
    this.selectedGenres = genres;
  }

  getFilteredData() {
    let vis = this;

    let filtered = null;
    if (vis.filterType === "indie") {
      // Filter for Indie games (must include "Indie" genre AND all selected genres)
      filtered = vis._data.filter(d => {
        return d.genres.includes("Indie") && 
               vis.selectedGenres.every(genre => d.genres.includes(genre));
      });
    } else {
      // Filter for Studio games (must NOT include "Indie" genre, but include all selected genres)
      filtered = vis._data.filter(d => {
        return !d.genres.includes("Indie") && 
               vis.selectedGenres.every(genre => d.genres.includes(genre));
      });
    }

    return filtered.sort((a, b) => b.reviews - a.reviews);
  }

  getColorScale() {
    let vis = this;
    // Indie: dramatic purple-to-cyan with more color stops, Studio: viridis
    if (vis.filterType === "indie") {
      // Much darker purple to very bright cyan - stronger contrast
      return d3.scaleSequential(d3.interpolateRgb("#2d0052", "#00ffff")).domain([20, 100]);
    } else {
      return d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);
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

    // filter based on selection
    const filtered = vis.getFilteredData();
    console.log("Filtered rows:", filtered.length);

    vis.color = vis.getColorScale();

    // scale
    let x = d3
      .scaleLinear()
      .domain([
        -15,
        Math.min(
          d3.max(filtered, (d) => d.price),
          72
        ),
      ])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(filtered, (d) => d.positive) || 100])
      .range([height - margin.bottom, margin.top]);

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
      .attr("r", (d) => Math.sqrt(d.reviews + 1) * 0.06)
      .attr("fill", (d) => vis.color(d.positive))
      .attr("opacity", 0.8)
      .style("filter", "drop-shadow(0 0 8px rgba(100, 150, 255, 0.6))")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .style("filter", "drop-shadow(0 0 12px rgba(100, 150, 255, 0.9))");
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br>Price: ${d.price}<br>Positive: ${d.positive}%<br>Reviews: ${d.reviews}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .style("filter", "drop-shadow(0 0 8px rgba(100, 150, 255, 0.6))");
        tooltip.style("opacity", 0);
      });

    // color legend
    vis.legendGradient = svg.append("defs");
    vis.updateLegend();

    vis.legendRect = svg
      .append("rect")
      .attr("x", width / 2 - 100)
      .attr("y", height - 20)
      .attr("width", 200)
      .attr("height", 10);

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .text("Positive Percentual (%)");
  }

  updateLegend() {
    let vis = this;
    
    vis.legendGradient.selectAll("*").remove();
    
    const gradient = vis.legendGradient
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

    if (vis.legendRect) {
      vis.legendRect.style("fill", "url(#color-gradient)");
    }
  }

  updateVis(timeDomain) {
    let vis = this;

    vis.color = vis.getColorScale();
    vis.updateLegend();

    const filtered = vis.getFilteredData();

    const [min, max] = timeDomain;
    const timeFiltered = filtered.filter((d) => {
      return d.year >= min && max >= d.year;
    });
    console.log("Min:", min, "Max:", max);
    console.log("Filtered rows:", timeFiltered.length);

    let x = d3
      .scaleLinear()
      .domain([
        -15,
        Math.min(
          72,
          d3.max(timeFiltered, (d) => d.price)
        ),
      ])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([20, 100])
      .range([height - margin.bottom, margin.top]);

    vis.xAxis.transition().duration(1000).call(d3.axisBottom(x));
    vis.yAxis.transition().duration(1000).call(d3.axisLeft(y));

    const circles = svg.selectAll("circle").data(timeFiltered, (d) => d.name);
    circles.exit().transition().duration(500).attr("r", 0).remove();

    circles
      .join("circle")
      .transition()
      .duration(1000)
      .attr("cx", (d) => x(d.price))
      .attr("cy", (d) => y(d.positive))
      .attr("r", (d) => Math.sqrt(d.reviews + 1) * 0.1)
      .attr("fill", (d) => vis.color(d.positive))
      .attr("opacity", 0.8)
      .style("filter", "drop-shadow(0 0 8px rgba(100, 150, 255, 0.6))");

    svg
      .selectAll("circle")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .style("filter", "drop-shadow(0 0 12px rgba(100, 150, 255, 0.9))");
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br>Price: ${d.price}<br>Positive: ${d.positive}%<br>Reviews: ${d.reviews}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .style("filter", "drop-shadow(0 0 8px rgba(100, 150, 255, 0.6))");
        tooltip.style("opacity", 0);
      });
  }
}