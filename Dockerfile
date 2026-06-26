# ─── Development ────────────────────────────────────────────────────────────
FROM node:22-alpine AS dev
WORKDIR /app

COPY package*.json ./
RUN npm install

# Source is mounted as a volume at runtime — do not COPY here
EXPOSE 3000
CMD ["npx", "next", "dev", "--hostname", "0.0.0.0"]
