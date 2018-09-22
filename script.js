// define constants
const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

const fader = (color) => d3.interpolateRgb(color, "#fff")(0.2);
// const color = d3.scaleThreshold();
const color = d3.scaleOrdinal(d3.schemeCategory20.map(fader));
const format = d3.format(",d");

// add html for tooltip
d3.select("body")
  .append("div")
  .attr("id", "tooltip");

// render map
const render = (error, movies) => {
  if (error) throw error;

  console.log(movies);

  // initialize legend
  // ...
  // ...

  // initialize treemap
  const treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(1);

  // show tooltip
  const showTip = (d) => {
    d3.select("#tooltip")
      .style("visibility", "visible")
      .style("top", `${d3.event.pageY}px`)
      .style("left", `${d3.event.pageX + 20}px`)
      .attr("data-value", () => d.data.value)
      .html(() => `<span class="tip-name">${d.data.name}</span><br><span class="tip-mass">${d.data.value}</span>`);
  }

  // hide tooltip
  const hideTip = () => {
    d3.select("#tooltip")
      .style("visibility", "hidden")
  }

  const sumBySize = (d) => d.value;

  // add county data
  const root = d3.hierarchy(movies)
    .eachBefore((d) => {
      // console.log(d);
      d.data.id = (d.parent ? `${d.parent.data.id}.` : "") + d.data.name;
      // console.log(d.data.id);
       })
    .sum(sumBySize)
    .sort((a, b) => b.height - a.height || b.value - a.value);

  treemap(root);

  const cell = svg.selectAll("g")
    .data(root.leaves())
    .enter().append("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  cell.append("rect")
    .attr("id", (d) => d.data.id)
    .attr("class", "tile")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("data-area", (d) => {
      console.log(`width: ${d.x1 - d.x0}`);
      console.log(`height: ${d.y1 - d.y0}`);
      console.log(`area: ${(d.x1 - d.x0)*(d.y1 - d.y0)}`);
      console.log(`value: ${d.data.value}`);
    })
    .attr("fill", (d) => {
      console.log(`d.parent.data.id: ${d.parent.data.id}`);
      console.log(`color: ${color(d.parent.data.id)}`);
      color(d.parent.data.id)
    })
    .attr("data-name", (d) => d.data.name)
    .attr("data-category", (d) => d.data.category)
    .attr("data-value", (d) => d.data.value)
        // add tooltips
    .on('mouseover', (d) => showTip(d))
    .on('mouseout', () => hideTip());

  cell.append("clipPath")
    .attr("id", (d) => `clip-${d.data.id}`)
    .append("use")
      .attr("xlink:href", (d) => `#${d.data.id}`);

  cell.append("text")
    .attr("clip-path", (d) => `url(#clip-${d.data.id})`)
    .selectAll("tspan")
      .data((d) => d.data.name.split(/(?=[A-Z][^A-Z])/g))
    .enter().append("tspan")
      .attr("x", 4)
      .attr("y", (d, i) => 13 + i * 10)
      .text((d) => d);

  cell.append("title")
      .text((d) => `${d.data.id}\n${format(d.value)}`)


}

// load data
d3.queue()
    .defer(d3.json, "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json")
    .await(render);
