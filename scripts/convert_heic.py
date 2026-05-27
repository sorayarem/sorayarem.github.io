"""Convert IMG_6203.HEIC to a web-friendly JPEG."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "IMG_6203.HEIC"
OUT = ROOT / "img" / "seamamms-abby.jpg"

def main():
    OUT.parent.mkdir(exist_ok=True)
    try:
        import pillow_heif

        pillow_heif.register_heif_opener()
    except ImportError:
        pass

    from PIL import Image

    img = Image.open(SRC)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    img.save(OUT, "JPEG", quality=88, optimize=True)
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
