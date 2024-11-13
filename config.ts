const config: any = {
  database: {
    filename: 'test.db',
    verbose: console.log,
  },
  apis: {
    openai: {
      tiers: {
        A: { model: 'dall-e-3', quality: 'hd', size: '1024x1792', price: 0.12 },
        B: { model: 'dall-e-3', quality: 'hd', size: '1024x1024', price: 0.08 },
        C: {
          model: 'dall-e-3',
          quality: 'standard',
          size: '1024x1792',
          price: 0.08,
        },
        D: {
          model: 'dall-e-3',
          quality: 'standard',
          size: '1024x1024',
          price: 0.04,
        },
        E: {
          model: 'dall-e-2',
          quality: 'standard',
          size: '512x512',
          price: 0.018,
        },
        F: {
          model: 'dall-e-2',
          quality: 'standard',
          size: '256x256',
          price: 0.016,
        },
      },
      initialBudget: 1,
      thresholds: {
        A: {
          percentage: 20,
          time: { start: '22:00', end: '23:59' },
        },
        B: {
          percentage: 30,
        },
        C: {
          percentage: 20,
          time: { start: '06:00', end: '22:00' },
        },
        D: {
          percentage: 20,
        },
        E: {
          percentage: 5,
        },
        F: {
          percentage: 5,
          time: { start: '00:00', end: '06:00' },
        },
      },
    },
  },
  initialAccounts: [
    {
      type: 'username',
      username: 'owner',
      role: 'Owner',
    },
    {
      type: 'username',
      username: 'admin',
      role: 'Admin',
    },
    {
      type: 'email',
      email: 'mickster418@gmail.com',
      role: 'Admin',
    },
  ]
};

export default config;
