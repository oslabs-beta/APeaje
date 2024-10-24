import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const LineChart = () => {
    const [data, setData] = useState([]);
    const svgRef = useRef(null);

    useEffect(()=> {
        const fetchData = async() => {
            try{
                const response = await fetch('dashboard/chart')
                const data1 = await response.json();

                console.log('data1', data1)
                
                // Ensure that the data is in the expected format;
                // For example, if the data needs transformation:
                const data2 = data1.map(d => ({
                    time: new Date(d.date), // Adjust based on actual data structure
                    cost: Number(d.cost),
                    requests: Number(d.requests)
                }));  
                console.log('Transformed data:', data1);
                setData(data2)
            } catch(error) {
                console.log('error found from fetchData')
            }
        }

        fetchData()

    }, []);


    console.log('current data', data)

    useEffect(() => {
        if (data.length > 0) {
            const svg = d3.select(svgRef.current);
            const width = 400;
            const height = 250;
            const margin = { top: 20, right: 30, bottom: 30, left: 40 };

            console.log('d3 max cost', d3.max(data, d => d.cost))

            // Define scales
            const xScale = d3.scaleTime()
                .domain(d3.extent(data, d => d.time))
                .range([margin.left, width - margin.right]);

            const yScaleCost = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.cost)])
                .range([height - margin.bottom, margin.top]);

            const yScaleRequests = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.requests)])
                .range([height - margin.bottom, margin.top]);

            svg.attr('width', width)
               .attr('height', height);

            svg.selectAll('*').remove(); // Clear previous drawings

            // Draw cost line
            svg.append('path')
               .datum(data)
               .attr('fill', 'none')
               .attr('stroke', 'steelblue')
               .attr('stroke-width', 1.5)
               .attr('d', d3.line()
                   .x(d => xScale(d.time))
                   .y(d => yScaleCost(d.cost))
               );

            // Draw requests line
            svg.append('path')
               .datum(data)
               .attr('fill', 'none')
               .attr('stroke', 'orange')
               .attr('stroke-width', 1.5)
               .attr('d', d3.line()
                   .x(d => xScale(d.time))
                   .y(d => yScaleRequests(d.requests))
               );

            // Add x-axis
            svg.append('g')
               .attr('transform', `translate(0, ${height - margin.bottom})`)
               .call(d3.axisBottom(xScale));

            // Add y-axis for cost
            svg.append('g')
               .attr('transform', `translate(${margin.left}, 0)`)
               .call(d3.axisLeft(yScaleCost))
               .append('text')
               .attr('fill', 'black')
               .attr('x', -margin.left)
               .attr('y', 10)
               .attr('text-anchor', 'start')
               .text('Cost');

            // Add y-axis for requests
            svg.append('g')
               .attr('transform', `translate(${width - margin.right}, 0)`)
               .call(d3.axisRight(yScaleRequests))
               .append('text')
               .attr('fill', 'black')
               .attr('x', 10)
               .attr('y', 10)
               .attr('text-anchor', 'start')
               .text('Requests');
        }
    }, [data]);

    return (
        <div className = "line-chart">
        <h6>Cost and Number of Requests Over Time</h6>
        <svg ref = {svgRef}></svg>
        </div>
    )
};

export default LineChart;