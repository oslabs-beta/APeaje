import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';


const ThresholdsPieChart = () => {
    const [data, setData] = useState([]);
    const svgRef = useRef(null);

    useEffect(()=> {
        const fetchThresholds = async() => {
            try{
                const response = await fetch('/dashboard/thresholdsChart')
                const thresholds = await response.json();

                console.log('fetching thresholds', thresholds)
                
                // data for tier_name type 
                const chart = thresholds.map( row => ({
                    tier: row.tier_name,
                    thresholds : JSON.parse(row.thresholds).budget || 0, // Default to 0 if there is no budget
                }));  
                console.log('thresholds in the front-end:', thresholds, 'chart', chart);
                setData(chart)
            } catch(error) {
                console.log('error found from fetchData for thresholds')
            }
        }
        fetchThresholds()
    }, []);


    console.log('tier current data', data)

    useEffect(() => {
        if (data.length > 0) {
            const svg = d3.select(svgRef.current);
            const width = 500;
            const height = 500;
            const radius = Math.min(width, height) / 2;

            svg.attr('width', width)
               .attr('height', height);

            svg.selectAll('*').remove(); // Clear previous drawings

            const g = svg.append('g')
                         .attr('transform', `translate(${width / 2}, ${height / 2})`);

            const color = d3.scaleOrdinal(d3.schemeCategory10);

            // Create pie chart
            const pie = d3.pie()
                          .value(d => d.thresholds);

            const arc = d3.arc()
                          .innerRadius(0)
                          .outerRadius(radius);

            const arcs = pie(data);

            g.selectAll('.arc')
             .data(arcs)
             .enter()
             .append('g')
             .attr('class', 'arc')
             .append('path')
             .attr('d', arc)
             .attr('fill', (d, i) => color(i));

            // Add labels
            g.selectAll('.arc')
             .data(arcs)
             .enter()
             .append('text')
             .attr('transform', d => `translate(${arc.centroid(d)})`)
             .attr('dy', '0.35em')
             .text(d => d.data.tier_name);
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