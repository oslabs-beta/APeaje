import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const PreviousChange = ({ currentTheme, lightTheme, chart }) => {
    const svgRef = useRef(null);

    const calculateRequests = (budget, price) => {
        return Math.floor(budget / price);
    };

    useEffect(() => {
        if (chart && chart.length > 0) {
            const svg = d3.select(svgRef.current);
            const width = 400;
            const height = 300;
            const radius = Math.min(300, height) / 2;

            svg.attr("width", width).attr("height", height);
            svg.selectAll("*").remove();

            const g = svg
                .append("g")
                .attr("transform", `translate(${150}, ${height / 2})`);

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
            <h6>Preview Breakdown</h6>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default PreviousChange;