import type { ServerBuild } from '@remix-run/node'
import { installGlobals } from '@remix-run/node'
import { createRequestHandler } from 'server/api-gateway-adapter'
import sourceMapSupport from 'source-map-support'

import { getLoadContextApiGateway as getLoadContext } from './context'

sourceMapSupport.install()
installGlobals()

// Ideally we would extract the import path to a common module and share it between
// the local dev server file and the lambda server file, however due to the way
// bundlers handle dynamic imports, the import path typically must be a static string.
const build = (await import('../build/index.js')) as unknown as ServerBuild

export const handler = createRequestHandler({
  build,
  mode: build.mode,
  getLoadContext,
})
