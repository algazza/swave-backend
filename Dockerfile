FROM oven/bun:1.3.3-alpine
RUN addgroup app && adduser app -S -G app app
WORKDIR /app

COPY package.json bun.lockb ./

RUN bun install

COPY . .

RUN chown -R app:app /app
USER app

RUN bunx --bun prisma generate

EXPOSE 5500

CMD ["bun", "run", "dev"]