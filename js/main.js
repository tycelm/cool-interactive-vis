let bubblechart, timeline, dropdown, radiussetter;

loadData();

function loadData() {
  d3.csv("data/steam_games.csv").then((data) => {
    // init bubble chart
    bubblechart = new BubbleChart(data);
    bubblechart.initVis();

    // init timeline
    timeline = new Timeline(data);
    timeline.initVis();

    // init dropdown
    dropdown = new Dropdown(data, bubblechart, timeline);
    dropdown.initVis();

    // init radius setter
    radiussetter = new RadiusSetter(bubblechart);
    radiussetter.initVis();
  });
}

function brushed() {
  // Get the extent of the current brush
  let selection = d3.brushSelection(d3.select(".brush").node());

  bubblechart.updateVis(selection.map(timeline.timeX.invert));
}
