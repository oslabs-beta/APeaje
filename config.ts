const config: any = {
  database: {
    filename: 'apeaje.db',
    verbose: console.log,
  },
  apis: {
    openai: {
      tiers: {
        initialBudget: 10,
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
      thresholds: {
        A: {
          percentage: 1,
          time: { start: '22:00', end: '23:59' },
        },
        B: {
          percentage: 8,
        },
        C: {
          percentage: 1,
          time: { start: '06:00', end: '22:00' },
        },
        D: {
          percentage: 20,
        },
        E: {
          percentage: 30,
        },
        F: {
          percentage: 40,
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
  ],
};

export default config;
