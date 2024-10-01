import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const BarChart = () => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/dashboard/chart');
        const data1 = await response.json();

        console.log('data1', data1);

        // Ensure that the data is in the expected format;
        // For example, if the data needs transformation:
        const data2 = data1.map((d) => ({
          time: new Date(d.date), // Adjust based on actual data structure
          cost: Number(d.total_spent),
          requests: Number(d.number_of_requests),
        }));
        console.log('Transformed data:', data2);
        setData(data2);
      } catch (error) {
        console.log('error found from barChart fetchData');
      }
    };

    fetchData();
  }, []);

  console.log('current data', data);

  useEffect(() => {
    if (data.length === 0) return;
    const chartBox = svgRef.current;

    const svg = d3.select(chartBox);
    const width = 800;
    const height = 400;

    svg.attr('width', width).attr('height', height);
    const margin = { top: 20, right: 40, bottom: 50, left: 40 };

    svg.selectAll('*').remove(); // Clear previous contents

    console.log(
      'd3 max cost',
      d3.max(data, (d) => d.cost)
    );

    // Define scales
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.time))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    // Declare the y (vertical postio)
    const y1 = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.cost)])
      .range([height - margin.bottom, margin.top]);

    const y2 = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.requests)])
      .range([height - margin.bottom, margin.top]);

    //Define axes
    const xAxis = d3
      .axisBottom(x)
      .tickFormat(d3.timeFormat('%m-%d-%Y'))
      .tickSize(1);
    const yAxisLeft = d3.axisLeft(y1);
    const yAxisRight = d3.axisRight(y2);

  // Append horizontal grid lines
  svg.append('g')
  .attr('class', 'grid')
  .selectAll('line')
  .data(y1.ticks()) // Use the ticks of the left y-axis
  .enter()
  .append('line')
  .attr('x1', margin.left)
  .attr('x2', width - margin.right)
  .attr('y1', (d) => y1(d))
  .attr('y2', (d) => y1(d))
  .attr('stroke', '#ccc') // Color of the grid lines
  .attr('stroke-dasharray', '2,2') // Dotted line style
  .attr('stroke-opacity', 0.7); // Adjust opacity

    // Append x-axis
    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(0)')
      .style('text-anchor', 'end')

    // Append left y-axis for cost
    svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxisLeft)

      // Append label for left y-axis (Cost)
      svg.append('text')
      .attr('fill', 'skyblue')
      .attr('class','axis-label')
      .attr('x', 40)
      .attr('y', 5)
      .attr('dy', '.25em')
      .attr('text-anchor', 'end')
      .text('Cost');

    // Append right y-axis for requests
    svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${width - margin.right}, 0)`)
      .call(yAxisRight)
      .append('text')
      .attr('fill', 'skyblue')
      .attr('x', 0)
      .attr('y', 5)
      .attr('dy', '.25em')
      .attr('text-anchor', 'start')
      .text('Requests');

    // Append bars for cost
    svg
      .append('g')
      .selectAll('.bar-cost')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-cost')
      .attr('x', (d) => x(d.time))
      .attr('y', (d) => y1(d.cost))
      .attr('width', x.bandwidth() / 2)
      .attr('height', (d) => height - margin.bottom - y1(d.cost))
      .attr('fill', 'pink')
      

    // Append bars for requests
    svg
      .append('g')
      .selectAll('.bar-requests')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-requests')
      .attr('x', (d) => x(d.time) + x.bandwidth() / 2)
      .attr('y', (d) => y2(d.requests))
      .attr('width', x.bandwidth() / 2)
      .attr('height', (d) => height - margin.bottom - y2(d.requests))
      .attr('fill', 'white');
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
    <div className = "barChart">
      <h6>Cost and Number of Requests Over Time</h6>
      <svg className="bar-chart" ref={svgRef}></svg>
    </div>
  );
};

export default BarChart;
