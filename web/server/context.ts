import type { GetLoadContextFunction as GetLoadContextFnExpress } from '@remix-run/express'

import type { GetLoadContextFunction as GetLoadContextFnApiGateway } from './api-gateway-adapter'

type Context = ReturnType<typeof getLoadContext>

declare module '@remix-run/node' {
  interface AppLoadContext extends Context {}
}

const getLoadContext = () => {
  return {
    coolServerValue: 'hello from custom server',
  }
}

export const getLoadContextExpress: GetLoadContextFnExpress = async (
  req,
  res
) => getLoadContext()

export const getLoadContextApiGateway: GetLoadContextFnApiGateway = async (
  event
) => getLoadContext()
