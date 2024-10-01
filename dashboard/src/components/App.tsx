import React, { useState } from 'react';
import RealTimeChart from './RealTimeChart.tsx'
import '../../public/style.css'

const App = (): React.JSX.Element => {
  return(
    <>
      <h1>Dashboard</h1>
      <RealTimeChart />
  </>
  )
}


export default App;
