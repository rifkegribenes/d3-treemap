// define constants
const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

const color = d3.scaleOrdinal(["#d53e4f","#fc8d59","#fee08b","#ffffbf","#e6f598","#99d594","#3288bd"]);
const colorRgb = d3.scaleOrdinal([
  { r: 213, g: 62, b: 79, a: 1 },
  { r: 252, g: 141, b: 89, a: 1 },
  { r: 254, g: 224, b: 139, a: 1 },
  { r: 255, g: 255, b: 191, a: 1 },
  { r: 230, g: 245, b: 152, a: 1 },
  { r: 153, g: 213, b: 148, a: 1 },
  { r: 50,  g: 136, b: 189, a: 1 }
  ]);

const format = d3.format(",d");

// add html for tooltip
d3.select("body")
  .append("div")
  .attr("id", "tooltip");

// render map
const render = (error, movies) => {
  if (error) throw error;

  console.log(movies);

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
      .html(() => `<span class="tip-name">${d.data.name}</span><br><span class="tip-mass">$${format(d.data.value)}</span>`);
  }

  // hide tooltip
  const hideTip = () => {
    d3.select("#tooltip")
      .style("visibility", "hidden")
  }

  // add movie data
  const root = d3.hierarchy(movies)
    .eachBefore((d) => {
      // console.log(d);
      d.data.id = (d.parent ? `${d.parent.data.id}.` : "") + d.data.name;
      // console.log(d.data.id);
       })
    .sum((d) => d.value)
    .sort((a, b) => b.height - a.height || b.value - a.value);

  // find min and max values in each category
  const catMinMax = movies.children.map((category) => {
    console.log(category);
    const min = d3.min(category.children, d => d.value);
    const max = d3.max(category.children, d => d.value);
    return {
      name: category.name,
      min,
      max,
      range: d3.range(min, max, (max - min) / category.children.length)
    }
  })
  console.log(catMinMax);

  const alphaScale = (catName) => {
    const min = catMinMax.find(catObj => catObj.name === catName).min
    const max = catMinMax.find(catObj => catObj.name === catName).max
    return d3.scaleLinear()
      .range([.7,1])
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
    .attr("data-area", (d) => {
      console.log(`width: ${d.x1 - d.x0}`);
      console.log(`height: ${d.y1 - d.y0}`);
      console.log(`area: ${(d.x1 - d.x0)*(d.y1 - d.y0)}`);
      console.log(`value: ${d.data.value}`);
    })
    .attr("fill", (d) => {
      const rgb = colorRgb(d.data.category);
      rgb.a = alphaScale(d.data.category)(d.data.value);
      const { r, g, b, a } = rgb;
      return `rgba(${r},${g},${b},${a})`;

      // return color(d.data.category);
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

  // initialize legend

  let categories = root.leaves().map((nodes) => nodes.data.category);
  categories = categories.filter((category, index, self) => self.indexOf(category)===index);

  const legend = d3.select("#legend")
  const legendWidth = legend.attr("width");
  const LEGEND_OFFSET = 10;
  const LEGEND_RECT_SIZE = 15;
  const LEGEND_H_SPACING = 150;
  const LEGEND_V_SPACING = 10;
  const LEGEND_TEXT_X_OFFSET = 3;
  const LEGEND_TEXT_Y_OFFSET = -2;
  const legendElemsPerRow = Math.floor(legendWidth/LEGEND_H_SPACING);

  const legendElem = legend
    .append("g")
    .attr("transform", "translate(60," + LEGEND_OFFSET + ")")
    .selectAll("g")
    .data(categories)
    .enter().append("g")
    .attr("transform", function(d, i) {
      return 'translate(' +
      ((i%legendElemsPerRow)*LEGEND_H_SPACING) + ',' +
      ((Math.floor(i/legendElemsPerRow))*LEGEND_RECT_SIZE + (LEGEND_V_SPACING*(Math.floor(i/legendElemsPerRow)))) + ')';
    })

  legendElem.append("rect")
     .attr('width', LEGEND_RECT_SIZE)
     .attr('height', LEGEND_RECT_SIZE)
     .attr('class','legend-item')
     .attr('fill', function(d){
       return color(d);
     })

   legendElem.append("text")
     .attr('x', LEGEND_RECT_SIZE + LEGEND_TEXT_X_OFFSET)
     .attr('y', LEGEND_RECT_SIZE + LEGEND_TEXT_Y_OFFSET)
     .text(function(d) { return d; });


}

// load data
d3.queue()
    .defer(d3.json, "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json")
    .await(render);
