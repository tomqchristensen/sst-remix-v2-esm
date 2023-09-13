export {
  createRequestHandler as createLambdaHandler,
  GetLoadContextFunction as GetLoadContextFnLambda,
} from './lambda'

// And then something similar for edge:
// export {
//   createRequestHandler as createEdgeHandler,
//   GetLoadContextFunction as GetLoadContextFnEdge,
// } from './edge'