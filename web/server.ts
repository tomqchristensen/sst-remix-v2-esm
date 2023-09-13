import type { ServerBuild } from '@remix-run/node'
import { installGlobals } from '@remix-run/node'
import { createLambdaHandler } from '@sst/remix'
import sourceMapSupport from 'source-map-support'

type Context = {
  db: () => string // imagine this is the db connection
}

const getLoadContext = (): Context => {
  return {
    db: () => 'i am your db connection'
  }
} 

declare module '@remix-run/node' {
  interface AppLoadContext extends Context {}
}


sourceMapSupport.install()
installGlobals()

const build = (await import('./build/index.js')) as unknown as ServerBuild

export const handler = createLambdaHandler({
  build,
  mode: build.mode,
  getLoadContext,
})
