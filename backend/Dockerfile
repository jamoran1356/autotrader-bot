FROM node:20-alpine

WORKDIR /app
RUN corepack enable

COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY backend ./

EXPOSE 3001

CMD ["sh", "-c", "pnpm prisma migrate deploy || pnpm prisma db push; pnpm start"]