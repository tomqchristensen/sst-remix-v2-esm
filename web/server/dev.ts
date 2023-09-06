import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'
import {
  createRequestHandler,
  GetLoadContextFunction,
  RequestHandler,
} from '@remix-run/express'
import { broadcastDevReady, installGlobals, ServerBuild } from '@remix-run/node'
import chokidar from 'chokidar'
import compression from 'compression'
import express from 'express'
import morgan from 'morgan'
import sourceMapSupport from 'source-map-support'

import { getLoadContextExpress as getLoadContext } from './context'

sourceMapSupport.install()
installGlobals()

const BUILD_PATH = path.resolve('build/index.js')
const initialBuild = await reimportServer()

const app = express()

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

// Remix fingerprints its assets so we can cache forever.
app.use(
  '/build',
  express.static('public/build', { immutable: true, maxAge: '1y' })
)

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }))

app.use(morgan('tiny'))

app.all(
  '*',
  process.env.NODE_ENV === 'development'
    ? createDevRequestHandler(initialBuild, getLoadContext)
    : createRequestHandler({
        build: initialBuild,
        mode: initialBuild.mode,
        getLoadContext,
      })
)

const port = process.env.PORT || 3000
app.listen(port, async () => {
  console.log(`Express server listening on port ${port}`)

  if (process.env.NODE_ENV === 'development') {
    broadcastDevReady(initialBuild)
  }
})

async function reimportServer(): Promise<ServerBuild> {
  const stat = fs.statSync(BUILD_PATH)

  // convert build path to URL for Windows compatibility with dynamic `import`
  const BUILD_URL = url.pathToFileURL(BUILD_PATH).href

  // use a timestamp query parameter to bust the import cache
  return import(BUILD_URL + '?t=' + stat.mtimeMs)
}

function createDevRequestHandler(
  initialBuild: ServerBuild,
  getLoadContext: GetLoadContextFunction
): RequestHandler {
  let build = initialBuild
  async function handleServerUpdate() {
    // 1. re-import the server build
    build = await reimportServer()
    // 2. tell Remix that this app server is now up-to-date and ready
    broadcastDevReady(build)
  }
  chokidar
    .watch(BUILD_PATH, { ignoreInitial: true })
    .on('add', handleServerUpdate)
    .on('change', handleServerUpdate)

  // wrap request handler to make sure its recreated with the latest build for every request
  return async (req, res, next) => {
    try {
      return createRequestHandler({
        build,
        mode: 'development',
        getLoadContext,
      })(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
