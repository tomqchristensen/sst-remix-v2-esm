import path from 'node:path'
import { SsrFunction } from 'sst/constructs/SsrFunction.js'
import { SsrSite } from 'sst/constructs/SsrSite.js'

/**
 * The `CustomRemixSite` construct is patched version of SST's `RemixSite` construct which allows
 * for ESM builds with a custom server.
 *
 * The construct assumes that:
 *
 * - Your Remix config uses the default `assetsBuildDirectory` ('public/build') and `publicPath`
 *   ('/build/')
 * - Your server build is in ESM format
 * - Your Lambda server handler is `<RemixAppDir>/server/lambda.handler`
 */
export class CustomRemixSite extends SsrSite {
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
      handler: path.join(this.props.path, 'server', 'lambda.handler'),
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
