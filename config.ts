const config: any = {
  database: {
    filename: 'test.db',
    verbose: console.log
  },
  apis: {
    openai: {
      tiers: {
        A: { model: 'dall-e-3', quality: 'hd', size: '1024x1792', price: 0.120 },
        B: { model: 'dall-e-3', quality: 'hd', size: '1024x1024', price: 0.080 },
        C: { model: 'dall-e-3', quality: 'standard', size: '1024x1792', price: 0.080 },
        D: { model: 'dall-e-3', quality: 'standard', size: '1024x1024', price: 0.040 },
        E: { model: 'dall-e-2', quality: 'standard', size: '512x512', price: 0.018 },
        F: { model: 'dall-e-2', quality: 'standard', size: '256x256', price: 0.016 }
      },
      initialBudget: 0.2,
      thresholds: {
        "A": {
          budget: 80,
          time: { start: "22:00", end: "23:59" }
        },
        "B": {
          budget: 50
        },
        "C": {
          budget: 30,
          time: { start: "06:00", end: "22:00" }
        },
        "D": {
          budget: 10
        },
        "E": {
          budget: 5
        },
        "F": {
          budget: 0,
          time: { start: "00:00", end: "06:00" }
        }
      }
    }
  }
};

export default config;