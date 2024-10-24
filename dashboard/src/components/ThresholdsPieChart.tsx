import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  BgColorsOutlined,
  CrownFilled,
  TranslationOutlined,
} from "@ant-design/icons";

const ThresholdsPieChart = () => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const response = await fetch("/dashboard/thresholdsChart");
        const thresholds = await response.json();

        console.log("fetching thresholds", thresholds);

        // data for tier_name type
        const chart = thresholds.map((row) => ({
          tier: row.tier_name,
          thresholds: JSON.parse(row.thresholds).budget || 0, // Default to 0 if there is no budget
          requestNumber: Math.floor(
            JSON.parse(row.thresholds).budget / row.cost
          ),
        }));
        console.log("thresholds in the front-end:", thresholds, "chart", chart);
        setData(chart);
      } catch (error) {
        console.log("error found from fetchData for thresholds");
      }
    };
    fetchThresholds();
  }, []);

  console.log("tier current data", data);

  useEffect(() => {
    if (data.length > 0) {
      const svg = d3.select(svgRef.current);
      const width = 700;
      const height = 400;
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
        .value((d) => d.thresholds)
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
            .text(`${d.data.tier}: $${d.data.thresholds}`);
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
        //  .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.50em")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(
          (d) => ` $${d.data.thresholds}\n
                ${d.data.requestNumber} request(s)`
        );

      // const legends = svg.append("g").attr("transform", "translate(500, 300)")
      //                     .selectAll(".legends").data(data)
      // const legend = legends.enter().append("g").classed("legends", true).attr("transform", function(d,i){return "translate(0," + (i +1) *30 + ")";});
      // legend.append("rect").attr("width", 20).attr("hegith",20).attr("fill",function(d){return color(d.data.thresholds)})
      // legend.append("text").text(function(d){return color(d.data.tier)})

      const legend = svg.append("g").attr("transform", "translate(600, 50)"); // Adjust position here

      const legends = legend
        .selectAll(".legend")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`); // Adjust vertical spacing

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
        .text((d) => d.tier);
    }
  }, [data]);

  return (
    <div className="pie-chart">
      <h6>Threshold Breakdown</h6>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ThresholdsPieChart;
