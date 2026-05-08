while ($true) {
    python scripts/gps_replay.py --vehicles 1 --interval 4
    Write-Host "--- replaying again ---"
    Start-Sleep -Seconds 1
}