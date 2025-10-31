import sys
print("Python path:", sys.executable)
print("Python version:", sys.version)

print("\n" + "="*60)
print("Testing VoiceFixer Installation")
print("="*60)

# Test 1: Import
print("\n1️⃣ Testing import...")
try:
    from voicefixer import VoiceFixer
    print("✅ VoiceFixer imported successfully!")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    print("\n🔧 To fix, run:")
    print("   conda activate dsp_env")
    print("   pip install voicefixer")
    sys.exit(1)

# Test 2: Check dependencies
print("\n2️⃣ Checking dependencies...")
try:
    import torch
    import librosa
    import soundfile
    print(f"✅ torch: {torch.__version__}")
    print(f"✅ librosa: {librosa.__version__}")
    print(f"✅ soundfile: OK")
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    sys.exit(1)

# Test 3: Initialize model
print("\n3️⃣ Testing model initialization...")
try:
    print("⏳ Creating VoiceFixer instance...")
    vf = VoiceFixer()
    print("✅ VoiceFixer initialized successfully!")
except Exception as e:
    print(f"❌ Initialization failed: {e}")
    sys.exit(1)

print("\n" + "="*60)
print("✅ All tests passed! VoiceFixer is ready to use.")
print("="*60)