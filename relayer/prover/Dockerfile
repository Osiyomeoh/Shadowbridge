FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . /app
# include circom build outputs
COPY ../../contracts/midnight/circuits/build /app/contracts/midnight/circuits/build

RUN npm run build

ENV PROVER_PORT=4001
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

