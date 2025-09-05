#!/bin/bash

echo "=== Adventure Game Code Test Summary ==="
echo "Date: $(date)"
echo ""

echo "=== Project Structure Check ==="
echo "Checking if all required directories exist:"

dirs=("js/game" "js/ui" "js/utils" "css" "glb/assets" "glb/character" "glb/map")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✓ $dir exists"
    else
        echo "✗ $dir missing"
    fi
done

echo ""
echo "=== Asset Files Check ==="
echo "Checking if all asset files exist:"

assets=("glb/assets/grass/grass.glb" "glb/assets/bush/bush.glb" "glb/assets/rock/rock.glb" "glb/assets/tree/tree.glb" "glb/assets/campfire/campfire.glb" "glb/map/map.glb" "glb/character/character.glb")
for asset in "${assets[@]}"; do
    if [ -f "$asset" ]; then
        echo "✓ $asset exists"
    else
        echo "✗ $asset missing"
    fi
done

echo ""
echo "=== JavaScript Files Check ==="
echo "Checking if all JavaScript files exist:"

js_files=("js/main.js" "js/game/World.js" "js/game/Player.js" "js/game/BiomeAssets.js" "js/game/Biomes.js" "js/ui/Interface.js" "js/utils/Controls.js" "js/utils/Camera.js")
for js_file in "${js_files[@]}"; do
    if [ -f "$js_file" ]; then
        echo "✓ $js_file exists"
    else
        echo "✗ $js_file missing"
    fi
done

echo ""
echo "=== Syntax Check ==="
echo "Note: Syntax check skipped - ES6 modules require browser environment"

echo ""
echo "=== Path Analysis ==="
echo "Checking for any remaining incorrect asset paths:"

if grep -r "assets/trees/" js/ 2>/dev/null; then
    echo "✗ Found incorrect 'trees' path (should be 'tree')"
else
    echo "✓ No incorrect 'trees' paths found"
fi

if grep -r "assets/rocks/" js/ 2>/dev/null; then
    echo "✗ Found incorrect 'rocks' path (should be 'rock')"
else
    echo "✓ No incorrect 'rocks' paths found"
fi

echo ""
echo "=== Test Complete ==="
