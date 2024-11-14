import React, { useEffect, useRef, useState } from "react";
import { Col, Row } from 'antd';
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

  const calculateRequests = (budget, price) => {
    return Math.floor(budget / price);
  }
  
    const fetchThresholds = async () => {
      try {
        const response = await fetch("/dashboard/thresholdsChart");
        const thresholds = await response.json();

        console.log("fetching thresholds", thresholds);

        // data for tier_name type
        const chart = thresholds.map((row) => ({
          tier: row.tier_name,
          thresholds: JSON.parse(row.thresholds).percentage || 0, // Default to 0 if there is no budget
          requestNumber: Math.floor(
            JSON.parse(row.thresholds).percentage / row.cost
          ),
        }));
        console.log("thresholds in the front-end:", thresholds, "chart", chart);
        setData(chart);
      } catch (error) {
        console.log("error found from fetchData for thresholds");
      }
    };
    useEffect(() => {
    fetchThresholds();
  }, []);

  console.log("tier current data", data);

  useEffect(() => {
    if (chart && chart.length > 0) {
        const svg = d3.select(svgRef.current);
        const width = 465;
        const height = 250;
        const radius = Math.min(width, height) / 2;

      svg.attr("viewBox",`0 0 ${width} ${height}`);

      svg.selectAll("*").remove(); // Clear previous drawings

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 3}, ${height / 2})`);

      const colorScheme = {
        'A': '#ffcdd2',
        'B': '#bbdefb',
        'C': '#c8e6c9',
        'D': '#e1bee7',
        'E': '#ffe0b2',
        'F': '#f5f5f5'
    };
    const color = d3.scaleOrdinal()
    .domain(Object.keys(colorScheme))
    .range(Object.values(colorScheme));

const pie = d3.pie()
    .sort(null)
    .value(d => d.thresholdPercent);

const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius - 10);

const arcs = pie(chart);

const arcGroup = g.selectAll(".arc")
    .data(arcs)
    .enter()
    .append("g")
    .attr("class", "arc");

arcGroup.append("path")
    .attr("d", arc)
    .style("fill", d => color(d.data.name))
    .style("stroke", "white")
    .style("stroke-width", "2");

arcGroup.append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("dy", ".35em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#000")
    .text(d => d.data.name);

const legend = svg.append("g")
    .attr("transform", `translate(${300}, 20)`);

chart.forEach((d, i) => {
    const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", color(d.name));

    const budget = d.initialAmount.budget * (d.thresholdPercent / 100);
    const requests = calculateRequests(budget, 0.12); // Using 0.12 as the price per request

    legendRow.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .style("font-size", "12px")
        .style("fill", "#FFF")
        .text(`$${budget.toFixed(2)} (${requests} req(s))`);
});
}
}, [chart, currentTheme, lightTheme]);

  return (    
    <div className="pie-chart">
      <h6 className="center">Preview Breakdown</h6>
      <svg ref={svgRef}></svg>
    </div>
  );
};
export default PreviousChange;
