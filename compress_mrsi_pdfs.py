from __future__ import annotations

import csv
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


SOURCE_DIR = Path(r"C:\Resilio Sync\Alltek-Sean\project temp\MRSI 业绩")
OUTPUT_DIR = SOURCE_DIR / "压缩后"
PDFTOPPM = Path(
    r"C:\Users\xun51\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe"
)

RASTER_DPI = 130
JPEG_QUALITY = 62
KEEP_LOSSLESS_IF_RATIO_BELOW = 0.82


def mib(size: int) -> float:
    return size / 1024 / 1024


def lossless_rewrite(src: Path, dst: Path) -> None:
    reader = PdfReader(str(src))
    writer = PdfWriter()
    for page in reader.pages:
        try:
            page.compress_content_streams()
        except Exception:
            pass
        writer.add_page(page)

    if reader.metadata:
        writer.add_metadata(
            {k: str(v) for k, v in reader.metadata.items() if k and v is not None}
        )

    with dst.open("wb") as f:
        writer.write(f)


def page_sizes_points(src: Path) -> list[tuple[float, float]]:
    reader = PdfReader(str(src))
    sizes: list[tuple[float, float]] = []
    for page in reader.pages:
        box = page.mediabox
        sizes.append((float(box.width), float(box.height)))
    return sizes


def raster_rebuild(src: Path, dst: Path) -> None:
    sizes = page_sizes_points(src)
    with tempfile.TemporaryDirectory(prefix="pdf_compress_") as tmp:
        prefix = Path(tmp) / "page"
        subprocess.run(
            [
                str(PDFTOPPM),
                "-r",
                str(RASTER_DPI),
                "-jpeg",
                "-jpegopt",
                f"quality={JPEG_QUALITY},progressive=y,optimize=y",
                str(src),
                str(prefix),
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        images = sorted(Path(tmp).glob("page-*.jpg"))
        if len(images) != len(sizes):
            raise RuntimeError(
                f"Rendered {len(images)} pages, expected {len(sizes)} pages for {src.name}"
            )

        c = canvas.Canvas(str(dst), pagesize=sizes[0], pageCompression=1)
        for image_path, (width, height) in zip(images, sizes):
            c.setPageSize((width, height))
            with Image.open(image_path) as img:
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                c.drawImage(ImageReader(img), 0, 0, width=width, height=height)
            c.showPage()
        c.save()


def compress_one(src: Path) -> dict[str, str]:
    original_size = src.stat().st_size
    lossless_path = OUTPUT_DIR / src.name
    final_path = OUTPUT_DIR / src.name

    lossless_rewrite(src, lossless_path)
    lossless_size = lossless_path.stat().st_size

    method = "lossless"
    if lossless_size > original_size * KEEP_LOSSLESS_IF_RATIO_BELOW:
        raster_path = OUTPUT_DIR / f"{src.stem}.raster.pdf"
        raster_rebuild(src, raster_path)
        raster_size = raster_path.stat().st_size
        if raster_size < lossless_size:
            lossless_path.unlink(missing_ok=True)
            raster_path.rename(final_path)
            method = f"raster {RASTER_DPI}dpi q{JPEG_QUALITY}"
        else:
            raster_path.unlink(missing_ok=True)

    final_size = final_path.stat().st_size
    return {
        "file": src.name,
        "method": method,
        "original_mb": f"{mib(original_size):.2f}",
        "compressed_mb": f"{mib(final_size):.2f}",
        "saved_mb": f"{mib(original_size - final_size):.2f}",
        "saved_pct": f"{(1 - final_size / original_size) * 100:.1f}%",
    }


def main() -> None:
    if not PDFTOPPM.exists():
        raise FileNotFoundError(PDFTOPPM)

    OUTPUT_DIR.mkdir(exist_ok=True)
    rows = []
    for src in sorted(SOURCE_DIR.glob("*.pdf")):
        rows.append(compress_one(src))

    report = OUTPUT_DIR / "compression_report.csv"
    with report.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "file",
                "method",
                "original_mb",
                "compressed_mb",
                "saved_mb",
                "saved_pct",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print("Compressed PDFs written to:", OUTPUT_DIR)
    print(report)
    for row in rows:
        print(
            f"{row['file']}: {row['original_mb']} MB -> "
            f"{row['compressed_mb']} MB ({row['saved_pct']}, {row['method']})"
        )


if __name__ == "__main__":
    main()
