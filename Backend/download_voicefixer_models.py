import os
import urllib.request
from pathlib import Path

print("🔽 Downloading VoiceFixer Models...")
print("="*60)

# Create cache directory
cache_dir = Path.home() / ".cache" / "voicefixer"
cache_dir.mkdir(parents=True, exist_ok=True)
print(f"📁 Cache directory: {cache_dir}")

# Model URLs
models = {
    "vocoder.ckpt": "https://zenodo.org/record/5600188/files/vocoder.ckpt?download=1",
    "analysis_module.ckpt": "https://zenodo.org/record/5600188/files/analysis_module.ckpt?download=1"
}

def download_with_progress(url, filepath):
    """Download file with progress bar"""
    print(f"\n📥 Downloading: {filepath.name}")
    print(f"🔗 URL: {url}")
    
    def reporthook(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size)
        downloaded = count * block_size / (1024*1024)
        total = total_size / (1024*1024)
        print(f"\r⏳ Progress: {percent}% ({downloaded:.1f}/{total:.1f} MB)", end='')
    
    try:
        urllib.request.urlretrieve(url, filepath, reporthook)
        print(f"\n✅ Downloaded: {filepath.name} ({filepath.stat().st_size / (1024*1024):.1f} MB)")
        return True
    except Exception as e:
        print(f"\n❌ Failed: {e}")
        return False

# Download models
success = True
for filename, url in models.items():
    filepath = cache_dir / filename
    
    if filepath.exists():
        print(f"\n✅ Already exists: {filename} ({filepath.stat().st_size / (1024*1024):.1f} MB)")
        continue
    
    if not download_with_progress(url, filepath):
        success = False
        break

print("\n" + "="*60)
if success:
    print("✅ All models downloaded successfully!")
    print(f"📂 Models saved to: {cache_dir}")
else:
    print("❌ Download failed. Please check your internet connection.")
    print("💡 You can download manually from:")
    print("   https://zenodo.org/record/5600188")