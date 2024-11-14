APEAJE is a query management API gateway that lets you route your LLM-powered applications to our server. With APEAJE, you can easily configure budget or time-based thresholds to optimize your LLM usage.
## Features
- **Flexible configuration:** Define your own tiers and thresholds for different LLMs.
- **Budget management:** Set budget limits and allocate resources efficiently.
- **Time-based thresholds:** Specify time ranges for each tier to optimize usage.
- **User management:** Owner, admin, and user roles for granular access control.
- **Shared container:** Route your apps to our shared container with pre-configured settings.
- **Standalone deployment:** Download and run APEAJE locally for full control over your configuration.
## Getting Started
### Shared Container
1. Contact us to get access to the shared container.
2. Configure your app to route queries to the provided endpoint.
3. Set up your account and configure your tiers and thresholds using the APEAJE dashboard.
### Standalone Deployment
1. Clone the repo:
   ```bash
   git clone https://github.com/oslabs-beta/APeaje
2. Install dependencies:
    cd apeaje
    npm install
3. Configure your settings in config.ts:
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
                // ...
            },
            initialBudget: 1,
            thresholds: {
                A: { percentage: 20, time: { start: '22:00', end: '23:59' } },
                B: { percentage: 30 },
                // ...
            },
            },
        },
        initialAccounts: [
            { type: 'username', username: 'owner', role: 'Owner' },
            { type: 'username', username: 'admin', role: 'Admin' },
            // ...
        ],
        };
4. Build and start the server:
    npm run build
    npm start
5. Access the dashboard at http://localhost:3000 to configure your tiers and thresholds.
## Configuration
APEAJE provides a flexible configuration system through the `config.ts` file. You can define:
- Database settings
- LLM tiers with associated models, quality, size, and pricing (in progress)
- Initial budget for each LLM provider
- Threshold configurations for each tier (budget percentage and time ranges)
- Initial accounts with roles (owner, admin)
### Test app setup: Dall-E wrapper example
1. Choose an API-dependent app to test with. If you don't have your own, you can fork the [barebones DALL-E wrapper](https://github.com/oslabs-beta/dalle-wrapper.git) we built to test our app.
2. Redirect your API calls to APeaje. By default that will be `http://localhost:3000/`
3. Launch your front-end app. With **DALL-E Wrapper** that front-end only app with webpack-dev-server from the terminal by navigating to its directory and running `npm install` then `npm start` and opening `http://localhost:8080/` in your browser.
## User Management
APEAJE supports role-based user management:
- **Owner:** Predetermined in the config file, has full control.
- **Admin:** Created by the owner, elevated privileges for managing tiers and thresholds.
- **User:** Can create their own accounts and configure LLM usage within set limits.
## Supported LLMs
Currently, APEAJE supports the following LLMs:
- DALL-E (all versions)
We're actively working on adding support for more LLMs. Soon, you'll be able to define your own models and tiers for practically any LLM.
## API Documentation
For detailed information on the APEAJE API and available endpoints, please refer to the [API Documentation](link-to-api-docs).
## Contributing
Contributions are welcome! Please see [CONTRIBUTING.md](link-to-contributing-md) for guidelines.
## License
APEAJE is open-source software licensed under the [MIT License](link-to-license).
## Support
For questions or support, contact us at [support@apeaje.com](mailto:support@apeaje.com) or join our [community forum](link-to-community-forum).