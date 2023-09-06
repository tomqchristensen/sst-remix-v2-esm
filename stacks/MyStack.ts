import { Config, StackContext } from 'sst/constructs'
import { CustomRemixSite } from '../constructs/CustomRemixSite'

export function API({ stack }: StackContext) {
  const coolInjectedSstParam = new Config.Parameter(
    stack,
    'CoolInjectedSstParam',
    {
      value: 'hello from sst',
    }
  )

  const web = new CustomRemixSite(stack, 'site', {
    path: 'web',
    bind: [coolInjectedSstParam],
  })

  stack.addOutputs({
    WebURL: web.url || 'localhost',
  })
}
