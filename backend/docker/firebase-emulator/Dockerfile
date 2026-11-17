FROM node:22-alpine

# Firebase Emulators necessitam do Java (JRE) e Bash
RUN apk add --no-cache openjdk21-jre bash

# Instala a CLI do Firebase globalmente
RUN npm install -g firebase-tools

WORKDIR /app

COPY firebase.json storage.rules firestore.rules firestore.indexes.json ./

EXPOSE 4000 8080 9099 9199

CMD ["firebase", "emulators:start", "--project", "selpe-peruibe-dev"]
