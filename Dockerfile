FROM node

COPY LICENSE LICENSE

COPY package.json package.json
RUN npm install --allow-root

ENV PORT 80
ENV MONGO_HOST mongodb
ENV MONGO_PORT 27017

COPY libs/ libs/
COPY server.js server.js

CMD ["node", "server.js"]