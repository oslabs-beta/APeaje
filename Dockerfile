FROM node:22.4.1
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 2024
CMD ["npm","run", "server"]