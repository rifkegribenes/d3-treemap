// define constants
const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

// util methods
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}


// color scale
const color = d3.scaleOrdinal([
  "#9e0142", // 1
    "#3288bd", // 8
    "#e6f598", // 5
  "#d53e4f", // 2
    "#abdda4", // 6
  "#f46d43", // 3
    "#66c2a5", // 7
  "#fdae61", // 4
  "#5e4fa2"]); // 9

// add html for tooltip
d3.select("body")
  .append("div")
  .attr("id", "tooltip");

// render map
const render = (error, games) => {
  if (error) throw error;

  // initialize treemap
  const treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
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

  // add game data
  const root = d3.hierarchy(games)
    .eachBefore((d) => {
      d.data.id = (d.parent ? `${d.parent.data.id}.` : "") + d.data.name;
       })
    .sum((d) => d.value)
    .sort((a, b) => b.height - a.height || b.value - a.value);

  // find min and max values in each category
  const catMinMax = games.children.map((category) => {
    const min = d3.min(category.children, d => d.value);
    const max = d3.max(category.children, d => d.value);
    return {
      name: category.name,
      min,
      max,
      range: d3.range(min, max, (max - min) / category.children.length)
    }
  })

  // generate alpha value for each tile
  // smaller tiles within each category are lighter, larger tiles are darker
  const alphaScale = (catName) => {
    const min = catMinMax.find(catObj => catObj.name === catName).min
    const max = catMinMax.find(catObj => catObj.name === catName).max
    return d3.scaleLinear()
      .range([.8,.6])
      .domain([min, max]);
  }

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
    .attr("fill", (d) => {
      const rgb = hexToRgb(color(d.data.category));
      rgb.a = alphaScale(d.data.category)(d.data.value);
      const { r, g, b, a } = rgb;
      return `rgba(${r},${g},${b},${a})`;
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
      .attr("x", 6)
      .attr("y", (d, i) => 19 + i * 13)
      .attr("class", "cell-label")
      .text((d) => d);

  // initialize legend
  let categories = root.leaves().map((nodes) => nodes.data.category);
  categories = categories.filter((category, index, self) => self.indexOf(category) === index);

  const legend = d3.select("#legend")
  const legendWidth = legend.attr("width");
  const legendOffset = 10;
  const legendRectSize = 15;
  const legendHSpace = 150;
  const legendVSpace = 10;
  const legendTextXOffset = 3;
  const legendTextYOffset = -2;
  const legendElemsPerRow = Math.floor(legendWidth / legendHSpace);

  const legendElem = legend
    .append("g")
    .attr("transform", `translate(60, ${legendOffset})`)
    .selectAll("g")
    .data(categories)
    .enter().append("g")
    .attr("transform", (d, i) => {
      return `translate(${((i % legendElemsPerRow) * legendHSpace)}, ${
      ((Math.floor(i / legendElemsPerRow)) * legendRectSize + (legendVSpace * (Math.floor(i / legendElemsPerRow))))})`;
    })

  legendElem.append("rect")
     .attr('width', legendRectSize)
     .attr('height', legendRectSize)
     .attr('class','legend-item')
     .attr('fill', (d) => color(d));

   legendElem.append("text")
     .attr('x', legendRectSize + legendTextXOffset)
     .attr('y', legendRectSize + legendTextYOffset)
     .text((d) => d);

}

// load data
d3.queue()
    .defer(d3.json, "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json")
    .await(render);
