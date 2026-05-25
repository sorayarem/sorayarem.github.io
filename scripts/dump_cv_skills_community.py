import fitz
from pathlib import Path

root = Path(__file__).resolve().parents[1]
doc = fitz.open(root / "cv.pdf")
for pno in [2, 3]:
    page = doc[pno]
    ph = page.rect.height
    print(f"=== PAGE {pno + 1} ===")
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(s["text"] for s in line["spans"]).strip()
            if not text:
                continue
            y0, y1 = line["bbox"][1], line["bbox"][3]
            if pno == 2 and y0 / ph * 100 < 55:
                continue
            if pno == 3 and (y0 / ph * 100 < 55 or y0 / ph * 100 > 92):
                continue
            print(f"  {y0/ph*100:5.1f}-{y1/ph*100:5.1f}  {text[:85]}")
doc.close()
