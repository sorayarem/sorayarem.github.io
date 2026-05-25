import fitz
from pathlib import Path

root = Path(__file__).resolve().parents[1]
page = fitz.open(root / "cv.pdf")[3]
ph = page.rect.height
print("=== PAGE 4 ===")
for block in page.get_text("dict")["blocks"]:
    if block.get("type") != 0:
        continue
    for line in block["lines"]:
        text = "".join(s["text"] for s in line["spans"]).strip()
        if not text:
            continue
        y0, y1 = line["bbox"][1], line["bbox"][3]
        if y0 / ph * 100 < 42:
            continue
        print(f"  {y0/ph*100:5.1f}-{y1/ph*100:5.1f}  {text[:90]}")
