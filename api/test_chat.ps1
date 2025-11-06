# PowerShell script to test the AI Nutrition Coach chat endpoint

$body = @{
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    message = "Hello! Can you help me with my nutrition?"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Sending chat request to AI Nutrition Coach..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/chat" -Method Post -Headers $headers -Body $body

    Write-Host "SUCCESS! Agent Response:" -ForegroundColor Green
    Write-Host ""
    Write-Host $response.response -ForegroundColor White
    Write-Host ""
    Write-Host "Token Usage:" -ForegroundColor Yellow
    Write-Host "  Input tokens: $($response.usage.input_tokens)"
    Write-Host "  Output tokens: $($response.usage.output_tokens)"
    Write-Host "  Total tokens: $($response.usage.total_tokens)"

} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Response Details:" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
}
