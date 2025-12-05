# Azure Functions: negotiate endpoint

This Function App exposes an anonymous HTTP endpoint `/api/negotiate` that returns an Azure Web PubSub client access URL for a given hub.

## Prereqs
- Azure subscription
- Web PubSub resource (copy its Connection String)
- Node.js 18+
- (Optional) Azure Functions Core Tools for local test/deploy

## Configure in Azure
1. Create a Function App (Node 18, Consumption is fine).
2. In Function App → Configuration → Application settings, add:
   - `WebPubSubConnectionString` = <your Web PubSub connection string>
3. Deploy this folder (`functions/`) to the Function App.

## Local test (optional)
```powershell
cd functions
npm install
# Start (requires AzureWebJobsStorage; you can set it, or just deploy to Azure to test there)
# func start
```

## Deploy via VS Code
- Install "Azure Functions" extension.
- Right-click this `functions` folder → "Deploy to Function App..." → select your app.

## Endpoint
- URL: `https://<your-func-name>.azurewebsites.net/api/negotiate`
- Methods: GET/POST
- Query/body params (optional):
  - `hub`: hub name (default `lobby`)
  - `userId`: ID to associate with the connection (random guest if omitted)

## Response
```json
{ "url": "wss://.../client/hubs/<hub>?access_token=..." }
```

## Frontend env
- In Azure Static Web Apps (or local `.env`), set:
  - `VITE_NEGOTIATE_URL` = `https://<your-func-name>.azurewebsites.net/api/negotiate`
  - `VITE_PUBSUB_HUB` = `lobby` (or your chosen hub)
