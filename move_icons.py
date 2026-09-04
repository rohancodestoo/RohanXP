import os
import re
import shutil

base_dir = r'd:\Coding\personal projects\resume'
assets_dir = os.path.join(base_dir, 'assets')
old_programs_dir = os.path.join(assets_dir, 'programs')
icons_dir = os.path.join(assets_dir, 'icons')

# 1. Rename programs to icons
if os.path.exists(old_programs_dir) and not os.path.exists(icons_dir):
    os.rename(old_programs_dir, icons_dir)
elif not os.path.exists(icons_dir):
    os.makedirs(icons_dir)

files_to_update = ['index.html', 'script.js', 'style.css', 'test.html']

# Regex to find all used assets
asset_pattern = re.compile(r'assets/([^""\'\)]+)')

used_assets = set()

for filename in files_to_update:
    filepath = os.path.join(base_dir, filename)
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    matches = asset_pattern.findall(content)
    for match in matches:
        used_assets.add(match)

# Determine what to move to icons
moves = {}

for asset in used_assets:
    if asset.startswith('programs/'):
        # already in icons directory due to folder rename, but we need to update reference
        old_ref = f'assets/{asset}'
        new_ref = f'assets/icons/{asset[len("programs/"):]}'
        moves[old_ref] = new_ref
    elif 'Windows XP Icons/' in asset:
        old_path = os.path.join(assets_dir, asset.replace('/', os.sep))
        basename = os.path.basename(asset)
        new_path = os.path.join(icons_dir, basename)
        
        # move file
        if os.path.exists(old_path):
            if not os.path.exists(new_path):
                shutil.copy2(old_path, new_path)
            
        old_ref = f'assets/{asset}'
        new_ref = f'assets/icons/{basename}'
        moves[old_ref] = new_ref
    elif asset == 'windows xp logo.png':
        old_path = os.path.join(assets_dir, asset)
        new_path = os.path.join(icons_dir, asset)
        
        if os.path.exists(old_path):
            if not os.path.exists(new_path):
                shutil.copy2(old_path, new_path)
        
        old_ref = f'assets/{asset}'
        new_ref = f'assets/icons/{asset}'
        moves[old_ref] = new_ref

# Now update the files
for filename in files_to_update:
    filepath = os.path.join(base_dir, filename)
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    # Sort by length descending to avoid partial matches replacing first
    for old_ref in sorted(moves.keys(), key=len, reverse=True):
        new_content = new_content.replace(old_ref, moves[old_ref])
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filename}')

print('Done moving and updating references.')
