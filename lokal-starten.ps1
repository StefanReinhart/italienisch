# Startet die App zum Ausprobieren auf diesem PC: http://localhost:8765
# Ausführen: Rechtsklick → "Mit PowerShell ausführen". Beenden: Fenster schließen.
param([switch]$OhneBrowser)
$port = 8765
$ordner = $PSScriptRoot
$typen = @{ ".html"="text/html; charset=utf-8"; ".js"="text/javascript; charset=utf-8"; ".css"="text/css; charset=utf-8";
            ".png"="image/png"; ".webmanifest"="application/manifest+json"; ".json"="application/json"; ".md"="text/plain; charset=utf-8" }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "App läuft: http://localhost:$port  (Fenster schließen zum Beenden)"
if (-not $OhneBrowser) { try { Start-Process "http://localhost:$port" } catch {} }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $pfad = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($pfad -eq "") { $pfad = "index.html" }
  $datei = [System.IO.Path]::GetFullPath((Join-Path $ordner $pfad))
  if ($datei.StartsWith($ordner) -and (Test-Path $datei -PathType Leaf)) {
    $bytes = [System.IO.File]::ReadAllBytes($datei)
    $ext = [System.IO.Path]::GetExtension($datei).ToLower()
    $ctx.Response.ContentType = $(if ($typen[$ext]) { $typen[$ext] } else { "application/octet-stream" })
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.Headers.Add("Cache-Control", "no-cache")
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $ctx.Response.StatusCode = 404 }
  $ctx.Response.Close()
}
