// this component lets the user determine the radius range they want to view in
const rsHeight = 300;
const rsWidth = 500;
const rsMargin = { top: 20, right: 40, bottom: 20, left: 40 };

class RadiusSetter {
  constructor(bubbleChart) {
    this.bubbleChart = bubbleChart;
  }

  initVis() {
    let vis = this;

    vis.svg = d3
      .select("#radiusSetter")
      .append("svg")
      .attr("width", rsWidth + rsMargin.left + rsMargin.right)
      .attr("height", rsHeight)
      .append("g")
      .attr(
        "transform",
        "translate(" + rsMargin.left / 2 + "," + rsMargin.top * 2 + ")"
      );

    vis.svg.append("text").attr("fill", "#fff").text("Choose min radius size");

    const circleY = 100;

    const centerX = rsWidth / 2;

    // Circle positions
    const circle1X = centerX;

    const radiusMin = Math.sqrt(500 + 1) * 0.06;
    const radiusMax = Math.sqrt(50000 + 1) * 0.06;

    const sliderStartY = circleY + radiusMax + 20;

    vis.circle1 = vis.svg
      .append("circle")
      .attr("cx", circle1X)
      .attr("cy", circleY)
      .attr("r", radiusMin)
      .style("fill", "#058dc7");

    // vis.svg
    //   .append("text")
    //   .attr("fill", "#fff")
    //   .attr("x", circle2X - 20)
    //   .text("Max:");

    // vis.circle2 = vis.svg
    //   .append("circle")
    //   .attr("cx", circle2X)
    //   .attr("cy", circleY)
    //   .attr("r", radiusMax)
    //   .style("fill", "#058dc7");

    // Slider 1
    vis.svg
      .append("foreignObject")
      .attr("x", circle1X - 70)
      .attr("y", sliderStartY)
      .attr("width", 150)
      .attr("height", 50)
      .append("xhtml:input")
      .attr("type", "range")
      .attr("min", radiusMin)
      .attr("max", radiusMax)
      .attr("value", radiusMin)
      .on("input", function () {
        const newRadius = +this.value;
        vis.circle1.attr("r", newRadius);

        vis.updateBubble();
      });

    // // Slider 2
    // vis.svg
    //   .append("foreignObject")
    //   .attr("x", circle2X - 70)
    //   .attr("y", sliderStartY)
    //   .attr("width", 150)
    //   .attr("height", 50)
    //   .append("xhtml:input")
    //   .attr("type", "range")
    //   .attr("min", radiusMin)
    //   .attr("max", radiusMax)
    //   .attr("value", radiusMax)
    //   .on("input", function () {
    //     const newRadius = +this.value;
    //     vis.circle2.attr("r", newRadius);

    //     vis.updateBubble();
    //   });
  }

  updateBubble() {
    let vis = this;

    const radiusMax = Math.sqrt(1279700 + 1) * 0.06;

    const rMin = +vis.circle1.attr("r"); // min radius from slider
    const radiusExtent = [rMin, radiusMax];

    vis.bubbleChart.updateVisRadius(radiusExtent);
  }
}
