# Example: SST with Remix V2, ESM and a custom server

This example uses a custom `RemixSite` construct (see `./constructs/CustomRemixSite.ts`) to deploy a Remix V2 site with ESM and a custom server.

- The `CustomRemixSite` construct assumes that:
    - Your Remix config uses the default `assetsBuildDirectory` (i.e. `public/build`) and `publicPath` (i.e. `/build/`)
    - Your server build is in ESM format
    - Your Lambda server handler is located at `<RemixAppDir>/server/lambda.handler`
- The edge handler for the `CustomRemixSite` construct has not been implemented. I think it would be trivial to do, I just haven't had any need for it yet
- In the Remix folder (`./web`), you will find a `server` directory which contains the following:
    - `api-gateway-adapter/**`: A slightly modified version of Remix's official AWS Architect adapter which can be used to handle requests from / responses to API Gateway (i.e. a Lambda function)
    - `context.ts`: A utility file for declaring server context to inject into loaders / actions
    - `dev.ts`: Copy-pasted express dev server from Remix's manual server template
    - `lambda.ts`: Lambda request handler

When you run `pnpm dev` in the Remix folder, you're running the local dev server (i.e. `dev.ts`) with `sst bind`. When you deploy the site to AWS, it'll run the lambda handler (i.e. `lambda.ts`).

In either case, bound things like `Config` parameters, `Bucket` names etc. will be available within your server and your actions / loaders. You can verify this by:

- Running `pnpm dev` and opening `localhost:3000` locally. You should see both a value from the server context and a value from SST's `Config` module passed onto the client via the loader in `web/app/routes/_index.tsx`.
- Deploying the site to AWS by adding `dev: { deploy: true }` to the `CustomRemixSite` config in `stacks/MyStack.ts`. Once deployed, open the Cloudfront URL displayed in the console - you should see exactly the same output you see when running the local dev server.
