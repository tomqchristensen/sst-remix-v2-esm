import { Config, StackContext } from 'sst/constructs'
import { RemixSite } from '../constructs/RemixSite'

export function API({ stack }: StackContext) {
  const coolInjectedSstParam = new Config.Parameter(
    stack,
    'CoolInjectedSstParam',
    {
      value: 'hello from sst',
    }
  )

  const web = new RemixSite(stack, 'site', {
    path: 'web',
    bind: [coolInjectedSstParam],
    lambdaHandler: 'server.handler',
    edgeHandler: '<not implemented>',
  })

  stack.addOutputs({
    WebURL: web.url || 'localhost',
  })
}
