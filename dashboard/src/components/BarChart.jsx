import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const BarChart = () => {
    const [data, setData] = useState([]);
    const svgRef = useRef(null);

    useEffect(()=> {
        const fetchData = async() => {
            try{
                const response = await fetch('http://localhost:5500/dashboard/chart')
                const data1 = await response.json();

                console.log('data1', data1)
                
                // Ensure that the data is in the expected format;
                // For example, if the data needs transformation:
                const data2 = data1.map(d => ({
                    time: new Date(d.time), // Adjust based on actual data structure
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
        if (data.length === 0) return ;

            const svg = d3.select(svgRef.current);
            const width = 300;
            const height = 150;
            const margin = { top: 20, right: 0, bottom: 30, left: 40 };

            svg.selectAll("*").remove(); // Clear previous contents

            console.log('d3 max cost', d3.max(data, d => d.cost))

            // Define scales
            const x = d3.scaleBand()
                .domain(data.map( d => d.time))
                .range([margin.left, width - margin.right])
                .padding(0.1);

            

            // Declare the y (vertical postio)
            const y1 = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.cost)])
                .range([height - margin.bottom, margin.top]);

            const y2 = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.requests)])
                .range([height - margin.bottom, margin.top]);


            //Define axes
            const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y")).tickSize(0);
            const yAxisLeft = d3.axisLeft(y1);
            const yAxisRight = d3.axisRight(y2);

             // Append x-axis
        svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis)
        .selectAll("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Append left y-axis for cost
    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxisLeft)
        .append("text")
        .attr("fill", "#000")
        .attr("x", -50)
        .attr("y", -40)
        .attr("dy", ".25em")
        .attr("text-anchor", "end")
        .text("Cost");

    // Append right y-axis for requests
    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${width - margin.right}, 0)`)
        .call(yAxisRight)
        .append("text")
        .attr("fill", "#000")
        .attr("x", 50)
        .attr("y", -40)
        .attr("dy", ".25em")
        .attr("text-anchor", "end")
        .text("Requests");

    // Append bars for cost
    svg.append("g")
        .selectAll(".bar-cost")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar-cost")
        .attr("x", d => x(d.time))
        .attr("y", d => y1(d.cost))
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => height - margin.bottom - y1(d.cost))
        .attr("fill", "pink");

    // Append bars for requests
    svg.append("g")
        .selectAll(".bar-requests")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar-requests")
        .attr("x", d => x(d.time) + x.bandwidth() / 2)
        .attr("y", d => y2(d.requests))
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => height - margin.bottom - y2(d.requests))
        .attr("fill", "orange");
    }, [data]);

            // Create SVG Container

            // d3.create("svg")
            //     .attr("viewBox", [0,0,width,height])
            //     .attr("style", `max-width: ${width}px; height: auto; font: 10px san-serif; overflow: visible;`);

            
            // // Create a bar for each time. 
            // const bar = svg.append("g")
            //             .attr("fill", "yellow")
            //             .selectAll("rect")
            //             .data(data)
            //             .join("rect")
            //                 .style("mix-blend-mode", "multiply") // Darker color when bars overlaps during the transition.
            //                 .attr("x", d=> x(d.time))
            //                 .attr("y", d=> y(d.requests))
            //                 .attr("height", d=> y(0) - y(d.requests))
            //                 .attr("width", x.bandwidth());


            


            // Create the axes.
            // const gx = svg.append("g") // use call method to apply a functino , axisLeft(y) creates a left-oriented axis based on the y scale.
            //     .attr("transfrom", `translate(0,${height - margin.bottom})`)
            //     .call(d3.axisLeft(y).tickFormat((y) => (y * 100).toFixed())) // tickFormat func, formats the tick labels on the axis
            //     .call(g=> g.select(".domain").remove()) // .domain class line that represents the axis line and removing it to style the axis without the default line


            // Return the chart, with an update function that takes as input a domain
            // comparator and transitions the x axis and bar positions accordingly.

            // return Object.assign(svg.node(), {
            //     update(order) {
            //         x.domain(data.sort(order).map(d => d.time));

            //         const t= svg.transition()
            //         .duration(750);

            //         bar.data(data, d=> d.requests) // change to x-axis which is time?
            //         .order()
            //         .transition(t)
            //         .delay((d,i)=> i * 20)
            //         .attr("x", d => x(d.time));

            //         gx.transition(t)
            //         .call(xAxis)
            //         .selectAll(".tick")
            //         .delay((d,i) => i * 20);
        //         }
        //     });
        // }
    // }, [data]);

    return (
        <>
        <h2>BAR CHART Cost and Number of Requests Over Time</h2>
        <svg ref = {svgRef}></svg>
        </>
    )

}

export default BarChart