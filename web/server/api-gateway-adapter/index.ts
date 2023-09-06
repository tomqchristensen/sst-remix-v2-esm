import type { AppLoadContext, ServerBuild } from '@remix-run/node'
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import {
  createRequestHandler as createRemixRequestHandler,
  readableStreamToString,
} from '@remix-run/node'

import { isBinaryType } from './binary-types'

/**
 * A function that returns the value to use as `context` in route `loader` and `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass environment/platform-specific
 * values through to your loader/action.
 */
export type GetLoadContextFunction = (
  event: APIGatewayProxyEventV2
) => Promise<AppLoadContext> | AppLoadContext

export type RequestHandler = APIGatewayProxyHandlerV2

/** Returns a request handler for AWS API Gateway that serves the response using Remix. */
export function createRequestHandler({
  build,
  getLoadContext,
  mode = process.env.NODE_ENV,
}: {
  build: ServerBuild
  getLoadContext?: GetLoadContextFunction
  mode?: string
}): RequestHandler {
  const handleRequest = createRemixRequestHandler(build, mode)

  return async (event) => {
    const request = createRemixRequest(event)
    const loadContext = await getLoadContext?.(event)

    const response = await handleRequest(request, loadContext)

    return sendRemixResponse(response)
  }
}

export function createRemixRequest(event: APIGatewayProxyEventV2): Request {
  const host = event.headers['x-forwarded-host'] || event.headers.host
  const search = event.rawQueryString.length ? `?${event.rawQueryString}` : ''
  const url = new URL(`https://${host}${event.rawPath}${search}`)
  const isFormData = event.headers['content-type']?.includes(
    'multipart/form-data'
  )
  // Note: No current way to abort these for AWS API Gateway, but Remix router expects
  // requests to contain a signal, so it can detect aborted requests
  const controller = new AbortController()
  const headers = new Headers()

  for (const [header, value] of Object.entries(event.headers)) {
    if (value) {
      headers.append(header, value)
    }
  }

  return new Request(url.href, {
    method: event.requestContext.http.method,
    headers,
    signal: controller.signal,
    body:
      event.body && event.isBase64Encoded
        ? isFormData
          ? Buffer.from(event.body, 'base64')
          : Buffer.from(event.body, 'base64').toString()
        : event.body,
  })
}

export async function sendRemixResponse(
  nodeResponse: Response
): Promise<APIGatewayProxyStructuredResultV2> {
  const cookies: string[] = []

  // AWS API Gateway will send back set-cookies outside of response headers.
  // See https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
  for (const [key, value] of nodeResponse.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      cookies.push(value)
    }
  }

  if (cookies.length) {
    nodeResponse.headers.delete('Set-Cookie')
  }

  const contentType = nodeResponse.headers.get('Content-Type')
  const isBase64Encoded = isBinaryType(contentType)
  let body: string | undefined

  if (nodeResponse.body) {
    if (isBase64Encoded) {
      body = await readableStreamToString(nodeResponse.body, 'base64')
    } else {
      body = await nodeResponse.text()
    }
  }

  return {
    statusCode: nodeResponse.status,
    headers: Object.fromEntries(nodeResponse.headers.entries()),
    cookies,
    body,
    isBase64Encoded,
  }
}
