let bubblechart, timeline, dropdown, radiussetter, filterControls;

loadData();

function loadData() {
  d3.csv("data/steam_games.csv").then((data) => {
    // init bubble chart
    bubblechart = new BubbleChart(data);

    // init timeline
    timeline = new Timeline(data);

    // init filter controls FIRST (replaces dropdown)
    filterControls = new FilterControls(data, bubblechart, timeline);
    filterControls.initVis();

    // then initialize visualizations
    bubblechart.initVis();
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
