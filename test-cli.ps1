# Simple PowerShell script to send messages to Clippy Web
# Usage: .\test-cli.ps1 "Your message here"

param(
    [Parameter(Mandatory=$true, Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$Message
)

$ApiUrl = "http://localhost:3000/api/clippy"
$Text = $Message -join " "

if ([string]::IsNullOrWhiteSpace($Text)) {
    Write-Host "🎯 Clippy CLI - Send messages to your web interface!" -ForegroundColor Yellow
    Write-Host "📝 Usage: .\test-cli.ps1 `"Your message here`"" -ForegroundColor White
    Write-Host "💻 Make sure http://localhost:3000 is open in your browser" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📚 Examples:" -ForegroundColor Green
    Write-Host "  .\test-cli.ps1 `"Hello from PowerShell!`"" -ForegroundColor Gray
    Write-Host "  .\test-cli.ps1 `"This is a test message`"" -ForegroundColor Gray
    Write-Host "  .\test-cli.ps1 `"Real-time streaming works!`"" -ForegroundColor Gray
    exit 1
}

Write-Host "📤 Sending: `"$Text`"" -ForegroundColor Yellow

try {
    $Body = @{
        text = $Text
    } | ConvertTo-Json

    $Response = Invoke-RestMethod -Uri $ApiUrl -Method POST -ContentType "application/json" -Body $Body
    
    Write-Host "✅ Message sent successfully!" -ForegroundColor Green
    Write-Host "📡 Active connections: $($Response.connections)" -ForegroundColor Cyan
    exit 0
}
catch {
    Write-Host "❌ Failed to send message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure your Next.js server is running on http://localhost:3000" -ForegroundColor Yellow
    exit 1
}
