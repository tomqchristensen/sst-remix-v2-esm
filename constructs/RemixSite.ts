import path from 'node:path'
import { SsrFunction } from 'sst/constructs/SsrFunction.js'
import { SsrSite, SsrSiteProps } from 'sst/constructs/SsrSite.js'
import { Construct } from 'constructs'

interface RemixSiteProps extends SsrSiteProps {
  lambdaHandler: string // probably want both of these to be optional
  edgeHandler: string
}

export class RemixSite extends SsrSite {
  private lambdaHandler: string
  private edgeHandler: string

  constructor(
    scope: Construct,
    id: string,
    { lambdaHandler, edgeHandler, ...ssrSiteProps }: RemixSiteProps
  ) {
    super(scope, id, ssrSiteProps)
    this.lambdaHandler = lambdaHandler
    this.edgeHandler = edgeHandler
  }

  protected initBuildConfig() {
    return {
      typesPath: '.',
      serverBuildOutputFile: 'build/index.js',
      clientBuildOutputDir: 'public',
      clientBuildVersionedSubDir: 'build',
    }
  }

  protected createFunctionForRegional() {
    const {
      runtime,
      timeout,
      memorySize,
      permissions,
      environment,
      bind,
      nodejs,
      cdk,
    } = this.props

    return new SsrFunction(this, `ServerFunction`, {
      description: 'Server handler for Remix',
      handler: path.join(this.props.path, this.lambdaHandler),
      runtime,
      memorySize,
      timeout,
      nodejs: {
        format: 'esm',
        ...nodejs,
      },
      bind,
      environment,
      permissions,
      ...cdk?.server,
    })
  }

  protected createFunctionForEdge() {
    // Do something similar for edge with `this.edgeHandler`
    throw new Error('Edge function for CustomRemixSite not implemented')
    return {} as any
  }

  public getConstructMetadata() {
    return {
      type: 'CustomRemixSite' as const,
      ...this.getConstructMetadataBase(),
    }
  }
}
