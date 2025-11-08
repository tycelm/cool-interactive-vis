class Dropdown {
    constructor(data, bubbleChart, timeline) {
      this._data = data;
      this.bubbleChart = bubbleChart;
      this.timeline = timeline;
      this.selectedType = "indie";
    }
  
    initVis() {
      let vis = this;
  
      const dropdownContainer = d3.select("#chart-area")
        .insert("div", ":first-child")
        .attr("class", "dropdown-container")
        .style("margin-bottom", "20px");
  
      dropdownContainer
        .append("label")
        .attr("for", "game-type-select")
        .style("color", "#fff")
        .style("margin-right", "10px")
        .text("Select Game Type:");
  
      const dropdown = dropdownContainer
        .append("select")
        .attr("id", "game-type-select")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("background", "#2a3142")
        .style("color", "#fff")
        .style("border", "1px solid #3a4152")
        .style("cursor", "pointer")
        .on("change", function() {
          vis.selectedType = this.value;
          vis.updateVisualizations();
        });
  
      dropdown
        .selectAll("option")
        .data([
          { value: "indie", label: "Indie Games" },
          { value: "studio", label: "Studio Games (Non-Indie)" },
          { value: "compare", label: "Compare Indie vs Studio" }

        ])
        .join("option")
        .attr("value", d => d.value)
        .text(d => d.label);
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