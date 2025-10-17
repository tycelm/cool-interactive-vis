const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 40, right: 40, bottom: 60, left: 70 };
const tooltip = d3.select(".tooltip");

d3.csv("data/steam_games.csv").then((data) => {
  //if data inside directory, then use directory_name/steam......
  // transforming data
  data.forEach((d) => {
    d.price = +d["price_initial (USD)"];
    d.positive = +d.positive_percentual;
    d.reviews = +d.total_reviews;
    d.genres = d.genres
      ? d.genres
          .replace(/[\[\]']/g, "")
          .split(",")
          .map((g) => g.trim())
      : [];
  });

  // filter Indie & Action
  const filtered = data.filter(
    (d) => d.genres.includes("Indie") && d.genres.includes("Action")
  );
  console.log("Filtered rows:", filtered.length);

  // scale
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(filtered, (d) => d.price) || 50])
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(filtered, (d) => d.positive) || 100])
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);

  // axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "#333")
    .attr("text-anchor", "middle")
    .text("Price (USD)");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .append("text")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("fill", "#333")
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
    .attr("fill", (d) => color(d.positive))
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
      .attr("stop-color", color(p));
  });

  svg
    .append("rect")
    .attr("x", width / 2 - 100)
    .attr("y", height - 30)
    .attr("width", 200)
    .attr("height", 10)
    .style("fill", "url(#color-gradient)");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 35)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "#333")
    .text("Positive Percentual (%)");
});
