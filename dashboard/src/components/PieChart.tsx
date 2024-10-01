import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';


const PieChart = () => {
    const [data, setData] = useState([]);
    const svgRef = useRef(null);

    useEffect(()=> {
        const fetchTiers = async() => {
            try{
                const response = await fetch('/dashboard/tiers')
                const tiers = await response.json();

                console.log('fetching tiers', tiers)
                
                // data for tier_name type 
                const tierTypes = tiers.map( type => ({
                    tier_name: type.tier_name,
                    count : Number(type.count)
                }));  
                console.log('Tier types in the front-end:', tierTypes);
                setData(tierTypes)
            } catch(error) {
                console.log('error found from fetchData for tiers')
            }
        }

        fetchTiers()

    }, []);


    console.log('tier current data', data)

    useEffect(() => {
        if (data.length > 0) {
            const svg = d3.select(svgRef.current);
            const width = 400;
            const height = 250;
            const radius = Math.min(width, height) / 2;

            svg.attr('width', width)
               .attr('height', height);

            svg.selectAll('*').remove(); // Clear previous drawings

            const g = svg.append('g')
                         .attr('transform', `translate(${width / 2}, ${height / 2})`);

            const color = d3.scaleOrdinal(d3.schemeCategory10);

            // Create pie chart
            const pie = d3.pie()
                          .value(d => d.count);

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
            <h6>Tier Breakdown</h6>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default PieChart;