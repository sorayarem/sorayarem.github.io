"""Regenerate cv-preview.png from cv.pdf (page 1). Run: pip install pymupdf && python scripts/convert-cv-preview.py"""
from pathlib import Path

import fitz

root = Path(__file__).resolve().parents[1]
doc = fitz.open(root / "cv.pdf")
doc[0].get_pixmap(matrix=fitz.Matrix(2, 2)).save(root / "cv-preview.png")
print("Wrote", root / "cv-preview.png")
