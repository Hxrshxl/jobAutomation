$env:USE_MOCK_DATA="true"
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/pipeline/run" -Method Post -Headers @{"Content-Type"="application/json"}
$response | ConvertTo-Json -Depth 5
npx tsx testE2E.ts
