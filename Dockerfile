# OV7 OS — site, logiciel d'administration et API dans une seule image.
# Aucune dépendance npm : l'image contient Node, git (mises à jour) et tini.
FROM node:24-alpine

RUN apk add --no-cache git tini \
 && git config --system --add safe.directory /app

WORKDIR /app
COPY . .

ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data \
    REPO_DIR=/app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/public/status > /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/index.js"]
