import { json, type LoaderArgs, type MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Config } from 'sst/node/config'

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ]
}

export const loader = async (args: LoaderArgs) => {
  return json({
    fromContext: args.context.coolServerValue,
    fromSst: Config.CoolInjectedSstParam,
  })
}

export default function Index() {
  const { fromContext, fromSst } = useLoaderData<typeof loader>()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
      <h1>Welcome to Remix</h1>
      <div>Value from server context: {fromContext}</div>
      <div>Value from SST Config module: {fromSst}</div>
    </div>
  )
}
