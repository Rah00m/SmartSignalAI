# download_chbmit.py
# Usage examples:
# python download_chbmit.py --subject chb01 --files chb01_01.edf chb01_15.edf
# python download_chbmit.py --subject chb01   (will auto-select a few files from the summary)
import requests, argparse
from pathlib import Path

BASE_URL = "https://physionet.org/files/chbmit/1.0.0"

def download_file(url, dest_path):
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    if dest_path.exists():
        print(f"Already downloaded: {dest_path}")
        return
    print(f"Downloading {url} -> {dest_path}")
    r = requests.get(url, stream=True)
    r.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=1024*1024):
            if chunk:
                f.write(chunk)
    print("Done.")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--subject", required=True, help="e.g. chb01")
    p.add_argument("--files", nargs="*", help="list of EDF filenames", default=[])
    args = p.parse_args()

    subject = args.subject
    out_dir = Path("data")/subject

    if not args.files:
        # try to get summary and auto-select a few files (first 6)
        summary_url = f"{BASE_URL}/{subject}/{subject}-summary.txt"
        try:
            r = requests.get(summary_url)
            r.raise_for_status()
            text = r.text
            files = []
            for line in text.splitlines():
                if line.strip().startswith("File Name:"):
                    fname = line.split(":",1)[1].strip()
                    files.append(fname)
            if not files:
                raise RuntimeError("No file names found in summary.")
            files = files[:6]
            print("Auto-selected files:", files)
        except Exception as e:
            print("Could not fetch summary; please pass --files manually.")
            raise
    else:
        files = args.files

    for fname in files:
        url = f"{BASE_URL}/{subject}/{fname}"
        dest = out_dir/fname
        download_file(url, dest)

if __name__ == "__main__":
    main()