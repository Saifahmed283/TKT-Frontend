import http from 'node:http'

const host = '127.0.0.1'
const port = Number(process.env.TKT_MOCK_API_PORT ?? 4174)

const server = http.createServer((req, res) => {
  res.writeHead(401, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(JSON.stringify({
    error: {
      code: 'UNAUTHENTICATED',
      message: 'No active guest session in the frontend preview.',
    },
    data: null,
  }))
})

server.listen(port, host, () => {
  console.log(`TKT guest API mock listening on http://${host}:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
