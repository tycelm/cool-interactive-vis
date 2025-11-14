class FilterControls {
    constructor(data, bubbleChart, timeline) {
        this._data = data;
        this.bubbleChart = bubbleChart;
        this.timeline = timeline;
        this.selectedType = "indie";
        this.selectedGenres = ["Action"];
        this.availableGenres = [];
    }

    initVis() {
        let vis = this;

        vis.availableGenres = [
            "Action",
            "Adventure",
            "Casual",
            "Racing",
            "RPG",
            "Simulation",
            "Strategy"
        ];

        const controlsContainer = d3
            .select("#chart-area")
            .insert("div", ":first-child")
            .attr("class", "controls-container")
            .style("margin-bottom", "20px")
            .style("padding", "20px")
            .style("background", "#1f2733")
            .style("border-radius", "12px")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("align-items", "flex-start")
            .style("gap", "40px");

        const leftCol = controlsContainer
            .append("div")
            .attr("class", "controls-left")
            .style("flex", "1");

        controlsContainer
            .append("div")
            .attr("id", "radiusSetter")
            .attr("class", "radius-panel")
            .style("flex", "0 0 320px");

        const dropdownContainer = leftCol
            .append("div")
            .style("margin-bottom", "20px");

        dropdownContainer
            .append("label")
            .attr("for", "game-type-select")
            .style("color", "#fff")
            .style("font-weight", "bold")
            .style("margin-right", "10px")
            .text("Game Type:");

        const dropdown = dropdownContainer
            .append("select")
            .attr("id", "game-type-select")
            .style("padding", "5px 10px")
            .style("border-radius", "5px")
            .style("background", "#2a3142")
            .style("color", "#fff")
            .style("border", "1px solid #3a4152")
            .style("cursor", "pointer")
            .on("change", function () {
                vis.selectedType = this.value;
                vis.updateVisualizations();
            });

        dropdown
            .selectAll("option")
            .data([
                { value: "indie", label: "Indie Games" },
                { value: "studio", label: "Studio Games (Non-Indie)" }
            ])
            .join("option")
            .attr("value", (d) => d.value)
            .text((d) => d.label);

        const compareMini = dropdownContainer
            .append("label")
            .style("margin-left", "20px")
            .style("color", "#fff")
            .style("font-size", "13px")
            .style("cursor", "pointer")
            .style("display", "inline-flex")
            .style("align-items", "center");

        compareMini.append("input")
            .attr("type", "checkbox")
            .attr("id", "compare-mini")
            .style("margin-right", "10px")
            .on("change", function() {
                vis.compareMode = this.checked;
                vis.updateVisualizations();
            });

        compareMini.append("span").text("Compare");

        const genreContainer = leftCol.append("div")
            .style("margin-top", "20px");

        genreContainer
            .append("label")
            .style("color", "#fff")
            .style("font-weight", "bold")
            .style("font-size", "15px")
            .style("letter-spacing", "0.3px")
            .style("display", "block")
            .style("margin-bottom", "10px")
            .text("Select Genres:");

        const checkboxGrid = genreContainer
            .append("div")
            .style("margin-top", "20px")
            .style("display", "grid")
            .style("grid-template-columns", "repeat(3, 2fr)")
            .style("row-gap", "20px")
            .style("column-gap", "30px")
            .style("max-width", "380px");

        vis.availableGenres.forEach((genre) => {
            const label = checkboxGrid
                .append("label")
                .style("color", "#e8e8e8")
                .style("cursor", "pointer")
                .style("display", "flex")
                .style("align-items", "center")
                .style("font-size", "14px")
                .style("transition", "color 0.2s ease");

            label.on("mouseover", () => label.style("color", "#00ffff"))
                .on("mouseout", () => label.style("color", "#e8e8e8"));

            label.append("input")
                .attr("type", "checkbox")
                .attr("class", "genre-checkbox")
                .attr("value", genre)
                .property("checked", genre === "Action")
                .style("margin-right", "6px")
                .on("change", function () {
                    vis.updateGenreSelection();
                });

            label.append("span").text(genre);
        });
    }

    updateGenreSelection() {
        let vis = this;

        vis.selectedGenres = [];
        d3.selectAll(".genre-checkbox").each(function () {
            if (d3.select(this).property("checked")) {
                vis.selectedGenres.push(d3.select(this).attr("value"));
            }
        });

        if (vis.selectedGenres.length === 0) {
            alert("Please select at least one genre");
            return;
        }

        vis.updateVisualizations();
    }

    updateVisualizations() {
        let vis = this;

        vis.bubbleChart.setFilter(vis.selectedType, vis.selectedGenres);
        vis.bubbleChart.setCompareMode(vis.compareMode);
        vis.timeline.setFilter(vis.selectedType, vis.selectedGenres);
        vis.timeline.updateVis();

        const brushSelection = d3.brushSelection(d3.select(".brush").node());
        if (brushSelection) {
            vis.bubbleChart.updateVis(brushSelection.map(vis.timeline.timeX.invert));
        } else {
            const yearRange = d3.extent(vis._data, (d) => {
                const date = new Date(d.release_date);
                return date.getFullYear();
            });
            vis.bubbleChart.updateVis(yearRange);
        }
    }

    getSelectedType() {
        return this.selectedType;
    }

    getSelectedGenres() {
        return this.selectedGenres;
    }
}
