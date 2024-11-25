import React, { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'antd';
import * as d3 from 'd3';

interface ThresholdsPieChartProps {
  currentTheme: string;
  lightTheme: string;
  selectedApi?: string;
  standalone?: boolean;
}

const ThresholdsPieChart: React.FC<ThresholdsPieChartProps> = ({
  currentTheme,
  lightTheme,
  selectedApi = 'openai',
  standalone = true
}) => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  const calculateRequests = (budget: number, price: number) => {
    return Math.floor(budget / price);
  };

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const response = await fetch(
          standalone
            ? '/dashboard/thresholdsChart'
            : `/dashboard/thresholdsChart?apiName=${selectedApi}`
        );
        const thresholds = await response.json();
        const chart = thresholds.map((row) => {
          const thresholdData = JSON.parse(row.thresholds || '{}');
          return {
            name: row.tier_name,
            thresholdPercent: thresholdData.percentage || 0,
            requestCount: row.request_count || 0,
            initialAmount: { budget: 10 },
          };
        });
        setData(chart);
      } catch (error) {
        console.log('error fetching thresholds data');
      }
    };
    fetchThresholds();
  }, [selectedApi, standalone]);

  useEffect(() => {
    if (data.length > 0) {
      const svg = d3.select(svgRef.current);
      const width = 465;
      const height = 250;
      const radius = Math.min(width, height) / 2;

      svg.attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

      svg.selectAll('*').remove();

      const g = svg
        .append('g')
        .attr('transform', `translate(${width / 3}, ${height / 2})`);

      const colorScheme = {
        A: '#ffcdd2',
        B: '#bbdefb',
        C: '#c8e6c9',
        D: '#e1bee7',
        E: '#ffe0b2',
        F: '#d5d5d5',
      };

      const color = d3
        .scaleOrdinal()
        .domain(Object.keys(colorScheme))
        .range(Object.values(colorScheme));

      const pie = d3
        .pie()
        .sort(null)
        .value((d) => d.thresholdPercent);

      const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(radius - 10);

      const arcs = pie(data);

      const arcGroup = g
        .selectAll('.arc')
        .data(arcs)
        .enter()
        .append('g')
        .attr('class', 'arc');

      arcGroup
        .append('path')
        .attr('d', arc)
        .style('fill', (d) => color(d.data.name))
        .style('stroke', 'white')
        .style('stroke-width', '2');

      arcGroup
        .append('text')
        .attr('transform', (d) => `translate(${arc.centroid(d)})`)
        .attr('dy', '.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#000')
        .text((d) => d.data.name);

      const legend = svg.append('g').attr('transform', `translate(${300}, 20)`);

      data.forEach((d, i) => {
        const legendRow = legend
          .append('g')
          .attr('transform', `translate(0, ${i * 20})`);

        legendRow
          .append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .style('fill', color(d.name));

        const budget = d.initialAmount.budget * (d.thresholdPercent / 100);
        const requests = calculateRequests(budget, 0.12);

        legendRow
          .append('text')
          .attr('x', 20)
          .attr('y', 12)
          .style('font-size', '12px')
          .style('fill', currentTheme === lightTheme ? '#000' : '#FFF')
          .style('border', `1px ${currentTheme === lightTheme ? '#FFF' : '#000'} solid`)
          .text(`$${budget.toFixed(2)} (${requests} req(s))`);
      });

      arcGroup
        .select('path')
        .transition()
        .duration(750)
        .attrTween('d', function (d) {
          const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return function (t) {
            return arc(interpolate(t));
          };
        });
    }
  }, [data, currentTheme, lightTheme]);

  return (
    <Row>
      <Col span={24}>
        <div className='pie-chart'>
          <h6 className='center'>
            {standalone ? 'Threshold Breakdown' : `${selectedApi} Thresholds`}
          </h6>
          <svg
            ref={svgRef}
            style={{
              width: '100%',
              minWidth: '465px',
              height: '250px'
            }}
          />
        </div>
      </Col>
    </Row>
  );
};

export default ThresholdsPieChart;