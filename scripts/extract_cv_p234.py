import fitz
from pathlib import Path

root = Path(__file__).resolve().parents[1]
doc = fitz.open(root / "cv.pdf")
for pno in [1, 2, 3]:
    page = doc[pno]
    ph = page.rect.height
    print("=== PAGE", pno + 1, "===")
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(s["text"] for s in line["spans"]).strip()
            if not text:
                continue
            y0 = line["bbox"][1]
            print(f"{y0/ph*100:5.1f}  {text}")
doc.close()
