

const config : any = {
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
        budget: [
          { threshold: 80, tier: 'A' },
          { threshold: 50, tier: 'B' },
          { threshold: 30, tier: 'C' },
          { threshold: 10, tier: 'D' },
          { threshold: 5, tier: 'E' },
          { threshold: 0, tier: 'F' }
        ],
        time: [
            { start: 22, end: 24, tier: 'A' },
            { start: 6, end: 22, tier: 'C' },
            { start: 0, end: 6, tier: 'F' }
        ]
      }
    }
  }
};

export default config;