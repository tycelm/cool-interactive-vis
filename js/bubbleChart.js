const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 40, right: 40, bottom: 80, left: 70 };
const tooltip = d3.select(".tooltip");

class BubbleChart {
  constructor(data) {
    this._data = data;
    this.filterType = "indie";
  }

  setFilter(type) {
    this.filterType = type;
  }

  getFilteredData() {
    let vis = this;
    let filtered = vis._data
      .filter((d) => d.genres.includes("Action"))
      .filter((d) => d.reviews >= 500);
    if (vis.filterType === "indie") {
      filtered = filtered.filter((d) => d.genres.includes("Indie"));
    } else {
      filtered = filtered.filter((d) => !d.genres.includes("Indie"));
    }
    // 小气泡在上层
    return filtered.sort((a, b) => b.reviews - a.reviews);
  }

  initVis() {
    let vis = this;

    // 数据清理
    vis._data.forEach((d) => {
      d.price = +d["price_initial (USD)"];
      d.positive = +d.positive_percentual;
      d.reviews = +d.total_reviews;
      const date = new Date(d.release_date);
      d.year = date.getFullYear();
      d.genres = d.genres
        ? d.genres
            .replace(/[\[\]']/g, "")
            .split(",")
            .map((g) => g.trim())
        : [];
    });

    const filtered = vis.getFilteredData();

    // 尺度
    const x = d3
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
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    // 新配色：Turbo更亮
    // 霓虹糖系渐变（亮粉 → 橙 → 柠檬绿 → 蓝青 → 紫）
    const neonCandy = [
      "#ff007f", // electric pink
      "#ff6f00", // neon orange
      "#d4ff00", // lime yellow
      "#00fff7", // cyan
      "#7a00ff", // violet
    ];

    vis.color = d3.scaleLinear().domain([0, 25, 50, 75, 100]).range(neonCandy);

    // 坐标轴
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
      .text("Positive Rating (%)");

    // 绘制气泡
    const circles = svg
      .selectAll("circle")
      .data(filtered)
      .join("circle")
      .attr("cx", (d) => x(d.price) + (Math.random() * 4 - 2)) // jitter
      .attr("cy", (d) => y(d.positive) + (Math.random() * 4 - 2))
      .attr("r", 0)
      .attr("fill", (d) => vis.color(d.positive))
      .attr("stroke", "#222")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br>
                 Price: $${d.price}<br>
                 Positive: ${d.positive}%<br>
                 Reviews: ${d.reviews}`
          )
          .style("left", event.pageX - 70 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX - 70 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr("stroke-width", 0.5);
        tooltip.style("opacity", 0);
      });

    // 动画出现
    circles
      .transition()
      .delay((d, i) => i * 3)
      .duration(600)
      .attr("r", (d) => Math.sqrt(d.reviews + 1) * 0.06);

    // 颜色图例
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
      .text("Positive Rating (%)");
  }

  updateVis(timeDomain) {
    let vis = this;
    const filtered = vis
      .getFilteredData()
      .filter((d) => d.year >= timeDomain[0] && d.year <= timeDomain[1]);

    const x = d3
      .scaleLinear()
      .domain([
        -15,
        Math.min(
          72,
          d3.max(filtered, (d) => d.price)
        ),
      ])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    vis.xAxis.transition().duration(800).call(d3.axisBottom(x));
    vis.yAxis.transition().duration(800).call(d3.axisLeft(y));

    const circles = svg.selectAll("circle").data(filtered, (d) => d.name);

    circles.exit().transition().duration(400).attr("r", 0).remove();

    circles
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.price))
      .attr("cy", (d) => y(d.positive))
      .attr("r", 0)
      .attr("fill", (d) => vis.color(d.positive))
      .style("filter", (d) => `drop-shadow(0 0 6px ${vis.color(d.positive)})`)
      .attr("opacity", 0.9)
      .attr("stroke", "#222")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.8)
      .transition()
      .duration(600)
      .attr("r", (d) => Math.sqrt(d.reviews + 1) * 0.1);

    // tooltip 重新绑定
    svg
      .selectAll("circle")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br>
                 Price: $${d.price}<br>
                 Positive: ${d.positive}%<br>
                 Reviews: ${d.reviews}`
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
        d3.select(event.currentTarget).attr("stroke-width", 0.5);
        tooltip.style("opacity", 0);
      });
  }

  updateVisRadius(radiusExtent) {
    let vis = this;

    const filtered = vis.getFilteredData();

    const reviewsExtent = d3.extent(filtered, (d) => d.reviews);
    const radiusScale = d3
      .scaleSqrt()
      .domain(reviewsExtent)
      .range(radiusExtent);

    const circles = svg.selectAll("circle").data(filtered, (d) => d.name);

    circles.exit().transition().duration(400).attr("r", 0).remove();

    circles
      .transition()
      .duration(600)
      .attr("r", (d) => radiusScale(d.reviews));

    svg
      .selectAll("circle")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br>
                 Price: $${d.price}<br>
                 Positive: ${d.positive}%<br>
                 Reviews: ${d.reviews}`
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
        d3.select(event.currentTarget).attr("stroke-width", 0.5);
        tooltip.style("opacity", 0);
      });
  }
}
