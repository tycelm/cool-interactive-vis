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
        this.radiusExtent = [Math.sqrt(500 + 1) * 0.06, Math.sqrt(1279700 + 1) * 0.06];
        this.timeDomain = [2006, 2025];
    }

    setFilter(type, genres) {
        this.filterType = type;
        this.selectedGenres = genres;
    }

    setRadiusExtent(extent) {
        this.radiusExtent = extent;
    }

    setTimeDomain(domain) {
        this.timeDomain = domain;
    }

    getFilteredData() {
        let vis = this;
        let filtered = vis._data
            .filter((d) => d.genres.includes("Action"))
            .filter((d) => d.reviews >= 500)
            .filter((d) => d.year >= vis.timeDomain[0] && d.year <= vis.timeDomain[1]);

        if (vis.filterType === "indie") {
            filtered = filtered.filter(
                (d) =>
                    d.genres.includes("Indie") &&
                    vis.selectedGenres.every((genre) => d.genres.includes(genre))
            );
        } else {
            filtered = filtered.filter(
                (d) =>
                    !d.genres.includes("Indie") &&
                    vis.selectedGenres.every((genre) => d.genres.includes(genre))
            );
        }

        return filtered.sort((a, b) => b.reviews - a.reviews);
    }

    getColorScale() {
        let vis = this;
        if (vis.filterType === "indie") {
            return d3.scaleSequential(d3.interpolateRgb("#2d0052", "#00ffff")).domain([20, 100]);
        } else {
            return d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);
        }
    }

    initVis() {
        let vis = this;

        vis._data.forEach((d) => {
            d.price = +d["price_initial (USD)"];
            d.positive = +d.positive_percentual;
            d.reviews = +d.total_reviews;
            const date = new Date(d.release_date);
            d.year = date.getFullYear();
            d.genres = d.genres ? d.genres.replace(/[\[\]']/g, "").split(",").map((g) => g.trim()) : [];
        });

        const filtered = vis.getFilteredData();

        vis.gBackground = svg.append("g").attr("class", "background-layer");
        vis.gBubbles = svg.append("g").attr("class", "bubbles-layer");
        vis.gAxes = svg.append("g").attr("class", "axes-layer");

        const priceExtent = d3.extent(filtered, (d) => d.price);
        const x = d3.scaleLinear().domain([Math.max(0, priceExtent[0]), priceExtent[1]]).nice().range([margin.left, width - margin.right]);
        const y = d3.scaleLinear()
            .domain([0, 100])
            .nice()
            .range([height - margin.bottom, margin.top]);

        vis.gBackground.append("g")
            .attr("class", "y-grid")
            .attr("transform", `translate(${margin.left},0)`)
            .call(
                d3.axisLeft(y)
                    .tickSize(- (width - margin.left - margin.right))
                    .tickFormat("")
            )
            .selectAll("line")
            .attr("stroke", "#aaa")
            .attr("stroke-opacity", 0.15)
            .attr("shape-rendering", "crispEdges");

        vis.gBackground.select(".y-grid .domain").remove();


        const neonCandy = ["#ff007f", "#ff6f00", "#d4ff00", "#00fff7", "#7a00ff"];
        vis.color = d3.scaleLinear().domain([0, 25, 50, 75, 100]).range(neonCandy);

        const bubbles = vis.gBubbles
            .selectAll("circle")
            .data(filtered)
            .join("circle")
            .attr("cx", (d) => x(d.price) + (Math.random() * 4 - 2))
            .attr("cy", (d) => y(d.positive) + (Math.random() * 4 - 2))
            .attr("r", 0)
            .attr("fill", (d) => vis.color(d.positive))
            .attr("stroke", "#222")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.8);

        bubbles.transition()
            .duration(800)
            .delay((d, i) => i * 3)
            .attr("r", (d) => {
                const radiusScale = d3.scaleSqrt()
                    .domain(d3.extent(filtered, (d) => d.reviews))
                    .range(vis.radiusExtent);
                return radiusScale(d.reviews);
            });

        bubbles.on("mouseover", (event, d) => {
                const circle = d3.select(event.currentTarget);
                circle.style("filter", "drop-shadow(0 0 8px white)").attr("stroke-width", 1.5);

                const circleBox = event.currentTarget.getBoundingClientRect();

                const tooltipWidth = tooltip.node().offsetWidth;
                const tooltipHeight = tooltip.node().offsetHeight;
                const padding = 10;

                const xPos = circleBox.left + circleBox.width / 2 - tooltipWidth / 2 + window.scrollX - 150;
                const yPos = circleBox.top - tooltipHeight - padding + window.scrollY - 50;

                tooltip
                    .style("left", `${xPos}px`)
                    .style("top", `${yPos}px`)
                    .style("opacity", 1)
                    .html(
                        `<strong>${d.name}</strong><br>
            Price: $${d.price}<br>
            Positive: ${d.positive}%<br>
            Reviews: ${d.reviews}`
                    );
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget)
                    .style("filter", "none")
                    .attr("stroke-width", 0.5);
                tooltip.style("opacity", 0);
            });

        vis.xAxis = vis.gAxes.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat((d) => `$${d}`));
        vis.gAxes.append("text").attr("x", width / 2).attr("y", height - margin.bottom + 40).attr("fill", "#fff").attr("text-anchor", "middle").text("Price (USD)");
        vis.yAxis = vis.gAxes.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
        vis.gAxes.append("text").attr("x", -height / 2).attr("y", 30).attr("fill", "#fff").attr("text-anchor", "middle").attr("transform", "rotate(-90)").text("Positive Rating (%)");
        vis.gAxes.raise();
    }

    redrawBubbles() {
        let vis = this;
        const filtered = vis.getFilteredData();
        const x = d3.scaleLinear().domain([0, Math.min(72, d3.max(filtered, (d) => d.price))]).range([margin.left, width - margin.right]);
        const y = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);
        const radiusScale = d3.scaleSqrt().domain(d3.extent(filtered, (d) => d.reviews)).range(vis.radiusExtent);

        vis.xAxis.transition().duration(600).call(d3.axisBottom(x));
        vis.yAxis.transition().duration(600).call(d3.axisLeft(y));

        const circles = vis.gBubbles.selectAll("circle").data(filtered, (d) => d.name);

        circles.exit().transition().duration(400).attr("r", 0).remove();

        circles.enter()
            .append("circle")
            .attr("cx", (d) => x(d.price))
            .attr("cy", (d) => y(d.positive))
            .attr("r", 0)
            .attr("fill", (d) => vis.color(d.positive))
            .attr("stroke", "#222")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.8)
            .merge(circles)
            .transition()
            .duration(600)
            .attr("cx", (d) => x(d.price))
            .attr("cy", (d) => y(d.positive))
            .attr("r", (d) => radiusScale(d.reviews));

        vis.gAxes.raise();
        svg.selectAll("circle").on("mouseover", (event, d) => {
            const circle = d3.select(event.currentTarget);
            circle.style("filter", "drop-shadow(0 0 8px white)").attr("stroke-width", 1.5);

            const circleBox = event.currentTarget.getBoundingClientRect();

            const tooltipWidth = tooltip.node().offsetWidth;
            const tooltipHeight = tooltip.node().offsetHeight;
            const padding = 10;

            const xPos = circleBox.left + circleBox.width / 2 - tooltipWidth / 2 + window.scrollX - 150;
            const yPos = circleBox.top - tooltipHeight - padding + window.scrollY - 50;

            tooltip
                .style("left", `${xPos}px`)
                .style("top", `${yPos}px`)
                .style("opacity", 1)
                .html(
                    `<strong>${d.name}</strong><br>
            Price: $${d.price}<br>
            Positive: ${d.positive}%<br>
            Reviews: ${d.reviews}`
                );
        })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget)
                    .style("filter", "none")
                    .attr("stroke-width", 0.5);
                tooltip.style("opacity", 0);
            });
    }

    updateVis(timeDomain) {
        this.setTimeDomain(timeDomain);
        this.redrawBubbles();
    }

    updateVisRadius(radiusExtent) {
        this.setRadiusExtent(radiusExtent);
        this.redrawBubbles();
    }
}
