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
        this.compareMode = false;

        this.color = d3.scaleLinear()
            .domain([0, 25, 50, 75, 100])
            .range(["#ff007f", "#ff6f00", "#d4ff00", "#00fff7", "#7a00ff"]);
    }

    /* --- External setters --- */
    setCompareMode(enabled) { this.compareMode = enabled; }
    setFilter(type, genres) { this.filterType = type; this.selectedGenres = genres; }
    setRadiusExtent(ext) { this.radiusExtent = ext; }
    setTimeDomain(domain) { this.timeDomain = domain; }

    /* --- Data Filtering --- */
    getFilteredData() {
        let vis = this;

        const baseFilter = (d) =>
            vis.selectedGenres.every(g => d.genres.includes(g)) &&
            d.reviews >= 500 &&
            d.year >= vis.timeDomain[0] && d.year <= vis.timeDomain[1];

        if (vis.compareMode) {
            const indie = vis._data.filter(d =>
                d.genres.includes("Indie") && baseFilter(d)
            ).map(d => ({ ...d, category: "indie" }));

            const studio = vis._data.filter(d =>
                !d.genres.includes("Indie") && baseFilter(d)
            ).map(d => ({ ...d, category: "studio" }));

            return indie.concat(studio).sort((a, b) => b.reviews - a.reviews);
        }

        let filtered = vis._data.filter(baseFilter);

        if (vis.filterType === "indie")
            filtered = filtered.filter(d => d.genres.includes("Indie"));
        else
            filtered = filtered.filter(d => !d.genres.includes("Indie"));

        return filtered.sort((a, b) => b.reviews - a.reviews);
    }

    /* --- INIT VIS --- */
    initVis() {
        let vis = this;

        // preprocess data
        vis._data.forEach((d) => {
            d.price = +d["price_initial (USD)"];
            d.positive = +d.positive_percentual;
            d.reviews = +d.total_reviews;
            const date = new Date(d.release_date);
            d.year = date.getFullYear();
            d.genres = d.genres ? d.genres.replace(/[\[\]']/g, "").split(",").map(g => g.trim()) : [];
        });

        vis.gBackground = svg.append("g").attr("class", "background-layer");

        vis.gBubbles = svg.append("g").attr("class", "bubbles-layer");

        vis.gAxes = svg.append("g").attr("class", "axes-layer");


        vis.drawAxes();
        vis.drawBubbles();
    }

    /* ----------------------------
     * AXES (with left & right)
     * ---------------------------- */
    drawAxes() {
        let vis = this;

        // clear old axes
        vis.gAxes.selectAll("*").remove();

        const filtered = vis.getFilteredData();
        const priceMax = d3.max(filtered, d => d.price);

        // scales
        vis.xLeft = d3.scaleLinear()
            .domain([0, priceMax])
            .range([margin.left, width/2 - 20]);

        vis.xRight = d3.scaleLinear()
            .domain([0, priceMax])
            .range([width/2 + 20, width - margin.right]);

        vis.xSingle = d3.scaleLinear()
            .domain([0, priceMax])
            .range([margin.left, width - margin.right]);

        vis.y = d3.scaleLinear()
            .domain([0, 100])
            .range([height - margin.bottom, margin.top]);

        // --- LEFT Y ---
        vis.gAxes.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(vis.y));

        vis.gAxes.append("text")
            .attr("x", -height/2)
            .attr("y", 30)
            .attr("fill", "#fff")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Positive Rating (%)");

        // --- X AXES ---
        if (vis.compareMode) {
            // left x
            vis.gAxes.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(vis.xLeft).tickFormat(d => `$${d}`));

            vis.gAxes.append("text")
                .attr("x", width/4)
                .attr("y", height - margin.bottom + 40)
                .attr("fill", "#fff")
                .attr("text-anchor", "middle")
                .text("Price (USD)");

            // right x
            vis.gAxes.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(vis.xRight).tickFormat(d => `$${d}`));

            vis.gAxes.append("text")
                .attr("x", width * 3/4)
                .attr("y", height - margin.bottom + 40)
                .attr("fill", "#fff")
                .attr("text-anchor", "middle")
                .text("Price (USD)");

            // --- RIGHT Y ---
            vis.gAxes.append("g")
                .attr("transform", `translate(${vis.xRight(0)},0)`)
                .call(d3.axisLeft(vis.y));

        } else {
            // single x
            vis.gAxes.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(vis.xSingle).tickFormat(d => `$${d}`));

            vis.gAxes.append("text")
                .attr("x", width/2)
                .attr("y", height - margin.bottom + 40)
                .attr("fill", "#fff")
                .attr("text-anchor", "middle")
                .text("Price (USD)");
        }
    }


    /* ----------------------------
     * DRAW BUBBLES
     * ---------------------------- */
    drawBubbles() {
        let vis = this;

        const filtered = vis.getFilteredData();

        const rad = d3.scaleSqrt()
            .domain(d3.extent(filtered, d => d.reviews))
            .range(vis.radiusExtent);

        const getRadius = d =>
            vis.compareMode ? rad(d.reviews) * (0.5) : rad(d.reviews);

        vis.colorIndie = d3.scaleLinear()
            .domain([0, 50, 100])
            .range(["#4b82ff", "#00d4ff", "#00ff8c"]);

        vis.colorStudio = d3.scaleLinear()
            .domain([0, 50, 100])
            .range(["#ffe066", "#ff8c42", "#ff3b3b"]);


        vis.gBubbles.selectAll("*").remove(); // clear

        // helper for position
        const getX = d =>
            vis.compareMode
                ? (d.category === "indie"
                    ? vis.xLeft(d.price)
                    : vis.xRight(d.price))
                : vis.xSingle(d.price);

        const getY = d => vis.y(d.positive);

        // draw circles
        const bubbles = vis.gBubbles
            .selectAll("circle")
            .data(filtered)
            .enter()
            .append("circle")
            .attr("cx", d => getX(d) + (Math.random() * 4 - 2))
            .attr("cy", d => getY(d) + (Math.random() * 4 - 2))
            .attr("r", 0)
            // .attr("fill", d => vis.color(d.positive))
            .attr("fill", d => {
                if (!vis.compareMode) return vis.color(d.positive);

                return d.category === "indie"
                    ? vis.colorIndie(d.positive)
                    : vis.colorStudio(d.positive);
            })
            .attr("stroke", "#222")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.8);

        bubbles.transition()
            .duration(800)
            .delay((d, i) => i * 3)
            // .attr("r", d => rad(d.reviews));
            .attr("r", d => getRadius(d));


        bubbles
            .on("mouseover", (event, d) => {
                const circle = d3.select(event.currentTarget);
                circle
                    .style("filter", "drop-shadow(0 0 8px white)")
                    .attr("stroke-width", 1.5);

                const box = event.currentTarget.getBoundingClientRect();
                const tw = tooltip.node().offsetWidth;
                const th = tooltip.node().offsetHeight;
                const pad = 10;

                const xPos = box.left + box.width / 2 - tw / 2 + window.scrollX - 150;
                const yPos = box.top - th - pad + window.scrollY - 50;

                tooltip
                    .style("left", `${xPos}px`)
                    .style("top", `${yPos}px`)
                    .style("opacity", 1)
                    .html(`
                    <strong>${d.name}</strong><br>
                    Price: $${d.price}<br>
                    Positive: ${d.positive}%<br>
                    Reviews: ${d.reviews}
                `);
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget)
                    .style("filter", "none")
                    .attr("stroke-width", 0.5);
                tooltip.style("opacity", 0);
            });
    }

    /* ----------------------------
     * Tooltip helpers
     * ---------------------------- */
    showTooltip(event, d) {
        const box = event.currentTarget.getBoundingClientRect();
        const tw = tooltip.node().offsetWidth;
        const th = tooltip.node().offsetHeight;

        tooltip
            .style("left", box.left + window.scrollX - tw/2 + "px")
            .style("top", box.top + window.scrollY - th - 15 + "px")
            .style("opacity", 1)
            .html(`
                <strong>${d.name}</strong><br>
                Price: $${d.price}<br>
                Positive: ${d.positive}%<br>
                Reviews: ${d.reviews}
            `);
    }

    hideTooltip() {
        tooltip.style("opacity", 0);
    }

    /* ----------------------------
     * Redraw (on filter update)
     * ---------------------------- */
    redrawBubbles() {
        let vis = this;

        const filtered = vis.getFilteredData();

        // redraw axes smoothly
        vis.drawAxes();

        // --- scales ---
        const rad = d3.scaleSqrt()
            .domain(d3.extent(filtered, d => d.reviews))
            .range(vis.radiusExtent);

        const getRadius = d =>
            vis.compareMode ? rad(d.reviews) * 0.5 : rad(d.reviews);

        const getX = d =>
            vis.compareMode
                ? (d.category === "indie"
                    ? vis.xLeft(d.price)
                    : vis.xRight(d.price))
                : vis.xSingle(d.price);

        const getY = d => vis.y(d.positive);

        // color scale
        const getColor = d => {
            if (!vis.compareMode) return vis.color(d.positive);

            return d.category === "indie"
                ? vis.colorIndie(d.positive)
                : vis.colorStudio(d.positive);
        };

        // ---------- JOIN ----------
        const circles = vis.gBubbles
            .selectAll("circle")
            .data(filtered, d => d.name);


        // ---------- EXIT ----------
        circles.exit()
            .transition()
            .duration(400)
            .attr("r", 0)
            .remove();


        // ---------- ENTER ----------
        const enter = circles.enter()
            .append("circle")
            .attr("cx", d => getX(d) + (Math.random() * 4 - 2))
            .attr("cy", d => getY(d) + (Math.random() * 4 - 2))
            .attr("r", 0)
            .attr("fill", getColor)
            .attr("stroke", "#222")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.8);


        // ---------- UPDATE + ENTER MERGE ----------
        enter.merge(circles)
            .transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("cx", d => getX(d))
            .attr("cy", d => getY(d))
            .attr("r", d => getRadius(d))
            .attr("fill", getColor);


        // ---------- Tooltip handlers ----------
        vis.gBubbles.selectAll("circle")
            .on("mouseover", (event, d) => {
                const circle = d3.select(event.currentTarget);
                circle.style("filter", "drop-shadow(0 0 8px white)")
                    .attr("stroke-width", 1.5);

                const box = event.currentTarget.getBoundingClientRect();
                const tw = tooltip.node().offsetWidth;
                const th = tooltip.node().offsetHeight;

                tooltip
                    .style("left", `${box.left + box.width/2 - tw/2}px`)
                    .style("top", `${box.top - th - 15}px`)
                    .style("opacity", 1)
                    .html(`
                    <strong>${d.name}</strong><br>
                    Price: $${d.price}<br>
                    Positive: ${d.positive}%<br>
                    Reviews: ${d.reviews}
                `);
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

    updateVisRadius(ext) {
        this.setRadiusExtent(ext);
        this.redrawBubbles();
    }
}
