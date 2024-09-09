import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const RealTimeChart = () => {

    const [data, setData] = useState([]);
    const svgRef = useRef(null);

    // useEffect(() => {
    //     //Connect to WebSocket server
    //     const socket = new WebSocket('ws://localhost:5500');

    //     socket.onmessage = (event) => {  // onmessage is same thing as socket.addEventListener("message", (event) = {})
    //         const newData = JSON.parse(event.data);
    //         setData((prevData) => [...prevData, newData].slice(-20));
    //         // updating previous data and keep last 20 points 
    //     }

    //     return () => socket.close();
    // }, []);
    useEffect(() => {
        const fetchData = async() => {
            try {
                const response = await fetch('http://localhost:5500/dashboard/chart')
                const data = await response.json();
                console.log('data from front-end', data)
                setData(data)

            }catch(error) {
                console.log('Unable to get data')
            }
        }

        fetchData();
    })


    return (

    <>
    <div>{data}</div>
    </>
    )

    // useEffect(() => {
    //     if(data.length > 0) {
    //         //Set up D3 chart

    //         const svg = d3.select(svgRef.current); 
    //         const width = 500;
    //         const height = 300;

    //         svg.attr('width', width)
    //             .attr('height', height);

    //         const xScale = d3.scaleTime()
    //                          .domain([d3.min(data, d => d.time), d3.max(data, d => d.time)])
    //                          .range([0, width]);

    //         const yScale = d3.scaleLinear()
    //                         .domain([0, d3.max(data, d => d.value)])
    //                         .range([height, 0]);

    //         svg.selectAll('*').remove(); // Clear previous drawings

    //         svg.append('path')
    //             .datum(data)
    //             .attr('fill', 'none')
    //             .attr('stroke', 'steelblue')
    //             .attr('stroke-width', 1.5)
    //             .attr('d', d3.line()
    //                     .x(d=> xScale(new DataTransfer(d.time)))
    //                     .y(d=> yScale(d.value))
    //             );

    //         svg.append('g')
    //             .attr('transform', `translate(0, ${height})`)
    //             .call(d3.axisBottom(xScale));
                
    //         svg.append('g')
    //         .call(d3.axisLeft(yScale));
    //     }
    // }, [data]);

    // return <svg ref = {svgRef}></svg>
};

export default RealTimeChart;