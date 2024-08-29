# APeaje

Welcome to APeaje! We are building an API gateway for you to save money on your API queries as your app scales. We are still in early development, but if you'd like to contribute here are the steps to set up your dev environment.

### Test app setup: Dall-E wrapper example

1. Choose an API-dependent app to test with. If you don't have your own, you can fork the [barebones DALL-E wrapper](https://github.com/oslabs-beta/dalle-wrapper.git) we built to test our app.
2. Redirect your API calls to APeaje. By default that will be `http://localhost:3000/`
3. Launch your front-end app. With **DALL-E Wrapper** that front-end only app with webpack-dev-server from the terminal by navigating to its directory and running `npm install` then `npm start` and opening `http://localhost:8080/` in your browser.

### APeaje setup

4. Adjust the qualty configurations for how you want your queries to be transformed in config. Right now, our app includes sample configurations for DALL-E.
5. Before running **APeaje** set up a `.env` file in the root folder with `OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_KEY`. [^1]
6. To run **APeaje** from your terminal, navigate to its directory and run `npm install` and `npm start`.

If you have any questions, please reach out to us at [apeajegateway@gmail.com](mailto:apeajegateway@gmail.com).

[^1]: Our app currently only supports supabase databases set up with the query commented out in the server.js file, but we have plans to automate database setup for any postgres database.
