import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface ChartData {
  time: Date;
  cost: number;
  requests: number;
}

const BarChart: React.FC = () => {
  // need to define the return type of value in array, but also the structure 
  const [data, setData] = useState<ChartData[]>([]);
  //SVGSVGElement type is part of the TypeScript DOM library, which provides type definitions for the standard DOM API, including various SVG elements.
  const svgRef = useRef<SVGSVGElement | null >(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/dashboard/chart');
        const data1 = await response.json();

        // console.log('data1', data1);

        // Ensure that the data is in the expected format;
        // For example, if the data needs transformation:
        const data2: ChartData[] = data1.map((d:any) => ({
          time: new Date(d.date), // Adjust based on actual data structure
          cost: Number(d.total_spent),
          requests: Number(d.number_of_requests),
        }));
        // console.log('Transformed data:', data2);
        setData(data2);
      } catch (error) {
        console.log('error found from barChart fetchData');
      }
    };

    fetchData();
  }, []);

  // console.log('current data', data);

  useEffect(() => {
    if (data.length === 0) return;
    const chartBox = svgRef.current;

    const svg = d3.select(chartBox);
    const width = 800;
    const height = 400;

    svg.attr('width', width).attr('height', height);
    const margin = { top: 30, right: 45, bottom: 50, left: 40 };

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
      .round(true)
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
      .attr('y', 15)
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
      .attr('y', 15)
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

  return (
    <div className = "barChartContainer">
      <h6>Cost and Number of Requests Over Time</h6>
      <svg className="barChart" ref={svgRef}></svg>
    </div>
  );
};

export default BarChart;
