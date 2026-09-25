FROM oven/bun:1.3.3-alpine
RUN addgroup app && adduser app -S -G app app
WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install

COPY . .

RUN bunx --bun prisma generate

RUN chown -R app:app /app
USER app

EXPOSE 5500

CMD ["bun", "run", "dev"]