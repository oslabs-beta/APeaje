/*const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const { default: test } = require('node:test');
const dashboardController = require('./controller/dashboardController')

const app = express();
app.use(express.json());
//app.use(express.static(path.resolve(__dirname,'dashboard/public')));

app.use(express.static(path.resolve(__dirname, 'dist')));
app.use(cors());
<<<<<<<< HEAD:server/server.js
const openaiApiKey = process.env.OPENAI_API_KEY;
========

app.get('/', (req, res) => {
  res.status(200).send('mainpage')
});

type chartType = {
  time: string,
  cost: number,
  requests: number
}[]
const chartTest: chartType = [
  { "time": "2024-01-01T00:00:00Z", "cost": 10, "requests": 100 },
  { "time": "2024-01-02T00:00:00Z", "cost": 20, "requests": 150 },
  { "time": "2024-01-03T00:00:00Z", "cost": 15, "requests": 120 },
  { "time": "2024-01-04T00:00:00Z", "cost": 30, "requests": 180 }
]


app.get('/dashboard/chart', (req, res) => {
  res.status(200).send(chartTest)
} )
app.get('/dashboard', (req, res) => {
  res.status(200).sendFile(path.resolve(__dirname, './dashboard/public/dash.html'))
});


const openaiApiKey: (string | undefined) = process.env.OPENAI_API_KEY;
>>>>>>>> 8ed9da1acf1334fbbc9fa78d142434f1fe6f2d12:server3.ts

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

<<<<<<<< HEAD:server/server.js
app.get('/', (req, res) => {
  res.status(200).send('mainpage');
});

const chartTest = [
  { time: '2024-01-01T00:00:00Z', cost: 10, requests: 100 },
  { time: '2024-01-02T00:00:00Z', cost: 20, requests: 150 },
  { time: '2024-01-03T00:00:00Z', cost: 15, requests: 120 },
  { time: '2024-01-04T00:00:00Z', cost: 30, requests: 180 },
];

app.get('/dashboard/chart', (req, res, next) => {
  res.locals.db = supabase;
  next();
},
  dashboardController.lineGraph,
  (req, res) => {
    res.status(200).send(res.locals.data);
  }
)


app.get('/dashboard', (req, res) => {
  res
    .status(200)
    .sendFile(path.resolve(__dirname, '../dashboard/public/dash.html'));
});

// test config for dalle only
const config = {
  high: { size: '1024x1024', cost: 20 },
  mid: { size: '512x512', cost: 10 },
  low: { size: '256x256', cost: 5 },
========
type configType = {
  [name: string]: {model: string, quality: string, size: string, price: number}
}

const config: configType = {
  A: { model: 'dall-e-3', quality: 'hd', size: '1024x1792', price: 0.0120 },
  B: { model: 'dall-e-3', quality: 'hd', size: '1024x1024', price: 0.0080 },
  C: { model: 'dall-e-3', quality: 'Standard', size: '1024x1792', price: 0.0080 },
  D: { model: 'dall-e-3', quality: 'Standard', size: '1024x1024', price: 0.0040 },
  E: { model: 'dall-e-2', quality: 'Standard', size: '512x512', price: 0.0018 },
  F: { model: 'dall-e-2', quality: 'Standard', size: '256x256', price: 0.0016 }
>>>>>>>> 8ed9da1acf1334fbbc9fa78d142434f1fe6f2d12:server3.ts
};

app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;

  // test for time of day
<<<<<<<< HEAD:server/server.js
  const hour = new Date().getHours();
  let selectedConfig = config.mid; // default to mid

========
  const hour: number = new Date().getHours();
  let selectedConfig = config.A; // default to mid
  
>>>>>>>> 8ed9da1acf1334fbbc9fa78d142434f1fe6f2d12:server3.ts
  if (hour >= 22 || hour < 6) {
    selectedConfig = config.B; // low for night hours?
  } else if (hour >= 10 && hour < 18) {
    selectedConfig = config.C; // high hours
  }

  try {
    const openaiResponse = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          n: 1,
          size: selectedConfig.size,
        }),
      }
    );

    const openaiData = await openaiResponse.json();

    // sotre in db
<<<<<<<< HEAD:server/server.js
    const { data, error } = await supabase.from('queries').insert({
      prompt: prompt,
      model_version: selectedConfig.size,
      cost: selectedConfig.cost,
    });
========
    const { data, error } = await supabase
      .from('queries')
      .insert({
        prompt: prompt,
        model_version: selectedConfig.size,
        cost: selectedConfig.price,
      });
>>>>>>>> 8ed9da1acf1334fbbc9fa78d142434f1fe6f2d12:server3.ts

    if (error) throw error;

    res.json({ imageUrl: openaiData.data[0].url });
  } catch (error) {
    console.error('Error:', error);
    res
      .status(500)
      .json({ error: 'error occurred while generating the image' });
  }
});

/**
 * 404 handler
 */
/*
app.get('*', (req, res) => {
  console.log('error finding url');
  res.status(404).send('Not Found');
});
*/

/**
 * Global error handler
 */
/*
app.use((err, req, res, next) => {
  console.log(err);
  console.log('hit global error');

  res.status(500).send({ error: err });
});

*/
/*
const PORT: (string | 5500) = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
*/
/*"CREATE TABLE queries (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    cost INTEGER NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);"
*/