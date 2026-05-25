import fitz
from pathlib import Path

root = Path(__file__).resolve().parents[1]
page = fitz.open(root / "cv.pdf")[0]
ph = page.rect.height
pw = page.rect.width
for block in page.get_text("dict")["blocks"]:
    if block.get("type") != 0:
        continue
    for line in block["lines"]:
        text = "".join(s["text"] for s in line["spans"]).strip()
        if not text:
            continue
        x0, y0, x1, y1 = line["bbox"]
        print(
            f"y={y0/ph*100:5.1f}-{y1/ph*100:5.1f}  "
            f"xR={x1/pw*100:5.1f}  {text[:85]}"
        )
