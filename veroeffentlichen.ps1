# Veröffentlicht die App: holt Änderungen vom anderen PC, erhöht die Versionsnummer,
# speichert alles in Git und lädt es zu GitHub hoch. Danach wartet es, bis die neue Version online ist.
# Start: Doppelklick auf "Veröffentlichen.cmd"
param([string]$Nachricht = "", [switch]$OhnePause)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$adresse = "https://stefanreinhart.github.io/italienisch/"

function Ende([int]$code) {
  if (-not $OhnePause) { Write-Host ""; Read-Host "Fertig - Enter drücken zum Schließen" | Out-Null }
  exit $code
}
function Fehler([string]$text) {
  Write-Host ""
  Write-Host "FEHLER: $text" -ForegroundColor Red
  Ende 1
}
function GitOk { & git @args; if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') ist fehlgeschlagen." } }

try {
  Write-Host "=== Italienisch-App veröffentlichen ===" -ForegroundColor Green

  # Anonyme GitHub-Adresse sicherstellen (wichtig auf einem neu eingerichteten PC)
  if ((git config --local user.email) -notlike "*noreply.github.com") {
    git config --local user.name "StefanReinhart"
    git config --local user.email "154806245+StefanReinhart@users.noreply.github.com"
  }

  Write-Host "1/5 Hole den neuesten Stand von GitHub (z. B. vom anderen PC) ..."
  GitOk pull --rebase --autostash --quiet

  if (-not (git status --porcelain)) {
    Write-Host ""
    Write-Host "Es gibt keine Änderungen - nichts zu veröffentlichen." -ForegroundColor Yellow
    Ende 0
  }
  Write-Host "    Geänderte Dateien:"
  git status --short | ForEach-Object { Write-Host "      $_" }

  Write-Host "2/5 Prüfe die Datendateien ..."
  foreach ($datei in Get-ChildItem "data\*.js") {
    $inhalt = [IO.File]::ReadAllText($datei.FullName, $utf8)
    $backticks = ([regex]::Matches($inhalt, '`')).Count
    if ($backticks % 2 -ne 0) { Fehler ("In $($datei.Name) fehlt ein Backtick " + '(`)' + " - ein Themenblock ist nicht richtig geschlossen.") }
    $ohneTexte = ($inhalt -replace '`[^`]*`', '') -replace '"(?:[^"\\]|\\.)*"', '' -replace '(?m)//.*$', ''
    foreach ($paar in @(@('{', '}'), @('[', ']'), @('(', ')'))) {
      $auf = ([regex]::Matches($ohneTexte, [regex]::Escape($paar[0]))).Count
      $zu  = ([regex]::Matches($ohneTexte, [regex]::Escape($paar[1]))).Count
      if ($auf -ne $zu) { Fehler "In $($datei.Name) passen die Klammern $($paar[0]) $($paar[1]) nicht zusammen ($auf öffnende, $zu schließende)." }
    }
  }

  Write-Host "3/5 Erhöhe die Versionsnummer ..."
  $sw = [IO.File]::ReadAllText("$PSScriptRoot\sw.js", $utf8)
  $m = [regex]::Match($sw, 'italienisch-v(\d+)')
  if (-not $m.Success) { Fehler "Versionsnummer in sw.js nicht gefunden." }
  $neu = [int]$m.Groups[1].Value + 1
  [IO.File]::WriteAllText("$PSScriptRoot\sw.js", ($sw -replace 'italienisch-v\d+', "italienisch-v$neu"), $utf8)
  $app = [IO.File]::ReadAllText("$PSScriptRoot\app.js", $utf8)
  [IO.File]::WriteAllText("$PSScriptRoot\app.js", ($app -replace 'Version \d+ · Vorlesen', "Version $neu · Vorlesen"), $utf8)
  Write-Host "    Neue Version: $neu"

  if (-not $Nachricht) { $Nachricht = Read-Host "4/5 Was hast du geändert? (kurz, oder einfach Enter)" } else { Write-Host "4/5 Beschreibung: $Nachricht" }
  if (-not $Nachricht) { $Nachricht = "Inhalte aktualisiert" }
  GitOk add -A
  GitOk commit --quiet -m "Version ${neu}: $Nachricht"

  Write-Host "5/5 Lade zu GitHub hoch ..."
  GitOk push --quiet

  Write-Host ""
  Write-Host "Hochgeladen. Warte, bis die neue Version online ist (meist 1-2 Minuten) ..."
  $online = $false
  for ($i = 0; $i -lt 30 -and -not $online; $i++) {
    Start-Sleep -Seconds 10
    try {
      $r = Invoke-WebRequest -Uri "${adresse}sw.js?t=$(Get-Random)" -UseBasicParsing -TimeoutSec 15
      if ($r.Content -match "italienisch-v$neu\b") { $online = $true }
    } catch { }
    Write-Host "." -NoNewline
  }
  Write-Host ""
  if ($online) {
    Write-Host "FERTIG: Version $neu ist online." -ForegroundColor Green
    Write-Host "Auf dem Handy: App öffnen, ganz schließen, wieder öffnen."
  } else {
    Write-Host "Hochgeladen, aber noch nicht online sichtbar. Das kann ein paar Minuten dauern - einfach später auf dem Handy prüfen." -ForegroundColor Yellow
  }
  Ende 0
}
catch {
  Fehler "$($_.Exception.Message)`nTipp: Wenn es um Anmeldung geht, öffnet sich evtl. ein GitHub-Anmeldefenster. Sonst Claude fragen."
}
