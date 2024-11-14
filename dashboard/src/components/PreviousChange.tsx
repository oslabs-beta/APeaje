import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  BgColorsOutlined,
  CrownFilled,
  TranslationOutlined,
} from "@ant-design/icons";
interface PreviousChangeProps {
  chart: {
    name: string;
    value: number;
    initialAmount: { budget:number} // need an conditional where this is existing value or newInput
    thresholdPercent: number;
  }[] // array of object
  , currentTheme: string,
  lightTheme: string
}

const PreviousChange: React.FC<PreviousChangeProps> = ({ currentTheme, lightTheme, chart }) => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  

 useEffect(()=> {
  setData(chart);
 }, [chart])


 console.log("tier previous data", chart);


  //   const fetchThresholds = async () => {
  //     try {
  //       const response = await fetch("/dashboard/thresholdsChart");
  //       const thresholds = await response.json();

  //       console.log("fetching thresholds", thresholds);

  //       // data for tier_name type
  //       const chart = thresholds.map((row) => ({
  //         tier: row.tier_name,
  //         thresholds: JSON.parse(row.thresholds).percentage || 0, // Default to 0 if there is no budget
  //         requestNumber: Math.floor(
  //           JSON.parse(row.thresholds).percentage / row.cost
  //         ),
  //       }));
  //       console.log("thresholds in the front-end:", thresholds, "chart", chart);
  //       setData(chart);
  //     } catch (error) {
  //       console.log("error found from fetchData for thresholds");
  //     }
  //   };
  //   useEffect(() => {
  //   fetchThresholds();
  // }, []);

  /*
0:{name: 'A', initialAmount: {…}, value: 0.2, thresholdPercent: 10}
1:{name: 'B', initialAmount: {…}, value: 0.6, thresholdPercent: 30}
2:{name: 'C', initialAmount: {…}, value: 1.2, thresholdPercent: 60}
3:{name: 'D', initialAmount: {…}, value: 0, thresholdPercent: 0}
4:{name: 'E', initialAmount: {…}, value: 0, thresholdPercent: 0}
5:{name: 'F', initialAmount: {…}, value: 0, thresholdPercent: 0}
length
: 
6
  */

  useEffect(() => {
    if (data.length > 0) {
      const svg = d3.select(svgRef.current);
      const width = 500;
      const height = 300;
      const radius = Math.min(width, height) / 2;

      svg.attr("width", width).attr("height", height);

      svg.selectAll("*").remove(); // Clear previous drawings

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      const color = d3.scaleOrdinal(d3.schemePastel1);

      // Create pie chart
      const pie = d3
        .pie()
        .sort(null)
        .value((d) => d.thresholdPercent)
        .padAngle(0.03);

      const arc = d3.arc().innerRadius(0).outerRadius(radius);

      const arcs = pie(data);

      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "lightsteelblue")
        .style("padding", "5px")
        .style("border-radius", "5px");

      const arcGroups = g
        .selectAll("arc")
        .data(arcs)
        .enter()
        .append("g")
        .attr("class", "arc");

      arcGroups
        .append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => color(i))
        .on("mouseover", (event, d) => {
          tooltip
            .style("visibility", "visible")
            .text(`${d.data.name}: $${d.data.thresholdAmount}`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", () => {
          tooltip.style("visibility", "hidden");
        });

      // Add labels
      g.selectAll("arc")
        .data(arcs)
        .enter()
        .append("text")
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.50em")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text((d) => d.data.name);

      const legend = svg.append("g").attr("transform", "translate(400, 10)"); // Adjust position here

      const legends = legend
        .selectAll(".legend")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${i * 15})`); // Adjust vertical spacing

      legends
        .append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", (d, i) => color(i));

      legends
        .append("text")
        .attr("x", 25)
        .attr("y", 9)
        .attr("dy", "0.35em") // Center text vertically
        .text((d) =>`$${d.thresholdAmount}`)
        .attr("fill", currentTheme === lightTheme ? "#000" : "#FFF");
    }
  }, [data, currentTheme, lightTheme]);

  return (
    <div className="pie-chart">
      <h6>Preview Breakdown</h6>
      <svg ref={svgRef}></svg>
    </div>
  );
};
export default PreviousChange;
