# Adventure Game Code Test Script
Write-Host "=== Adventure Game Code Test Summary ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Project Structure Check ===" -ForegroundColor Yellow
Write-Host "Checking if all required directories exist:"

$dirs = @("js/game", "js/ui", "js/utils", "css", "glb/assets", "glb/character", "glb/map")
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "✓ $dir exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $dir missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Asset Files Check ===" -ForegroundColor Yellow
Write-Host "Checking if all asset files exist:"

$assets = @(
    "glb/assets/grass/grass.glb",
    "glb/assets/bush/bush.glb", 
    "glb/assets/rock/rock.glb",
    "glb/assets/tree/tree.glb",
    "glb/assets/campfire/campfire.glb",
    "glb/map/map.glb",
    "glb/character/character.glb"
)

foreach ($asset in $assets) {
    if (Test-Path $asset) {
        Write-Host "✓ $asset exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $asset missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== JavaScript Files Check ===" -ForegroundColor Yellow
Write-Host "Checking if all JavaScript files exist:"

$js_files = @(
    "js/main.js",
    "js/game/World.js", 
    "js/game/Player.js",
    "js/game/BiomeAssets.js",
    "js/game/Biomes.js",
    "js/ui/Interface.js",
    "js/utils/Controls.js",
    "js/utils/Camera.js"
)

foreach ($js_file in $js_files) {
    if (Test-Path $js_file) {
        Write-Host "✓ $js_file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $js_file missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Path Analysis ===" -ForegroundColor Yellow
Write-Host "Checking for any remaining incorrect asset paths:"

$treesCheck = Select-String -Path "js\**\*.js" -Pattern "assets/trees/" -ErrorAction SilentlyContinue
if ($treesCheck) {
    Write-Host "✗ Found incorrect 'trees' path (should be 'tree')" -ForegroundColor Red
    $treesCheck | ForEach-Object { Write-Host "  $($_.Filename):$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Red }
} else {
    Write-Host "✓ No incorrect 'trees' paths found" -ForegroundColor Green
}

$rocksCheck = Select-String -Path "js\**\*.js" -Pattern "assets/rocks/" -ErrorAction SilentlyContinue
if ($rocksCheck) {
    Write-Host "✗ Found incorrect 'rocks' path (should be 'rock')" -ForegroundColor Red
    $rocksCheck | ForEach-Object { Write-Host "  $($_.Filename):$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Red }
} else {
    Write-Host "✓ No incorrect 'rocks' paths found" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
