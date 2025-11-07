const rsHeight = 140;
const rsWidth = 260;
const rsMargin = { top: 10, right: 10, bottom: 10, left: 10 };

class RadiusSetter {
    constructor(bubbleChart) {
        this.bubbleChart = bubbleChart;
    }

    initVis() {
        let vis = this;

        const container = d3.select("#radiusSetter");

        container
            .append("h3")
            .text("Choose Min Radius Size")
            .style("color", "#fff")
            .style("font-family", "'Orbitron', sans-serif")
            .style("font-size", "14px")
            .style("margin", "0 0 10px 0")
            .style("text-align", "center");

        container
            .style("background", "rgba(10, 20, 40, 0.8)")
            .style("border-radius", "16px")
            .style("padding", "16px 18px")
            .style("box-shadow", "0 0 18px rgba(0, 255, 255, 0.12)");

        const svg = container
            .append("svg")
            .attr("width", rsWidth + rsMargin.left + rsMargin.right)
            .attr("height", rsHeight + rsMargin.top + rsMargin.bottom);

        vis.svg = svg
            .append("g")
            .attr("transform", "translate(" + rsMargin.left + "," + rsMargin.top + ")");

        const centerX = rsWidth / 2;
        const circleY = 45;

        const radiusMin = Math.sqrt(500 + 1) * 0.06;
        const radiusMax = Math.sqrt(50000 + 1) * 0.06;

        vis.circle1 = vis.svg
            .append("circle")
            .attr("cx", centerX)
            .attr("cy", circleY)
            .attr("r", radiusMin)
            .style("fill", "#00bfff")
            .style("opacity", 0.9)
            .style("filter", "drop-shadow(0 0 10px rgba(0,255,255,0.7))");

        const sliderY = circleY + radiusMax + 12;

        // slider
        vis.svg
            .append("foreignObject")
            .attr("x", centerX - 80)
            .attr("y", sliderY)
            .attr("width", 160)
            .attr("height", 40)
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
    }

    updateBubble() {
        let vis = this;

        const radiusMax = Math.sqrt(1279700 + 1) * 0.06;
        const rMin = +vis.circle1.attr("r"); // slider 设定的最小半径
        const radiusExtent = [rMin, radiusMax];

        vis.bubbleChart.setRadiusExtent(radiusExtent);
        vis.bubbleChart.updateVisRadius(radiusExtent);

    }
}
