// src/p2p/node.js
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import { createOrbitDB } from '@orbitdb/core'
import { createServer } from 'http'

async function main() {
  const helia = await createHelia()
  const db = await createOrbitDB({ ipfs: helia })
  const newsDB = await db.open('nous.news.feed', { type: 'documents' })

  // HTTP API
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'GET' && req.url === '/articles') {
      const all = await newsDB.all()
      res.end(JSON.stringify(all))
      return
    }

    if (req.method === 'POST' && req.url === '/save') {
      let body = ''
      req.on('data', chunk => (body += chunk))
      req.on('end', async () => {
        const data = JSON.parse(body)
        await newsDB.put(data)
        res.end(JSON.stringify({ status: 'ok' }))
      })
      return
    }

    res.statusCode = 404
    res.end(JSON.stringify({ error: 'not found' }))
  })

  server.listen(9001, () => {
    console.log('P2P node running on http://127.0.0.1:9001')
  })
}

main()