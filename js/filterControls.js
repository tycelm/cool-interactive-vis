class FilterControls {
  constructor(data, bubbleChart, timeline) {
    this._data = data;
    this.bubbleChart = bubbleChart;
    this.timeline = timeline;
    this.selectedType = "indie";
  }

  initVis() {
    let vis = this;

    const controlsContainer = d3.select("#chart-area")
      .insert("div", ":first-child")
      .attr("class", "controls-container")
      .style("margin-bottom", "20px")
      .style("padding", "20px")
      .style("background", "#1f2733")
      .style("border-radius", "8px")
      .style("text-align", "left");

    // Indie/Studio toggle
    const toggleContainer = controlsContainer
      .append("div");

    toggleContainer
      .append("label")
      .style("color", "#fff")
      .style("font-weight", "bold")
      .style("margin-right", "15px")
      .text("Game Type:");

    const toggleGroup = toggleContainer
      .append("span");

    ["indie", "studio"].forEach(type => {
      const label = toggleGroup
        .append("label")
        .style("color", "#fff")
        .style("margin-right", "20px")
        .style("cursor", "pointer");

      label
        .append("input")
        .attr("type", "radio")
        .attr("name", "game-type")
        .attr("value", type)
        .property("checked", type === "indie")
        .style("margin-right", "5px")
        .on("change", function() {
          vis.selectedType = this.value;
          vis.updateVisualizations();
        });

      label.append("span")
        .text(type === "indie" ? "Indie Games" : "Studio Games");
    });
  }

  updateVisualizations() {
    let vis = this;
    
    vis.bubbleChart.setFilter(vis.selectedType);
    vis.timeline.setFilter(vis.selectedType);
    
    vis.timeline.updateVis();
    
    const brushSelection = d3.brushSelection(d3.select(".brush").node());
    if (brushSelection) {
      vis.bubbleChart.updateVis(brushSelection.map(vis.timeline.timeX.invert));
    } else {
      const yearRange = d3.extent(vis._data, d => {
        const date = new Date(d.release_date);
        return date.getFullYear();
      });
      vis.bubbleChart.updateVis(yearRange);
    }
  }

  getSelectedType() {
    return this.selectedType;
  }
}