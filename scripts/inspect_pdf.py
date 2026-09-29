import fitz
from pathlib import Path

def render_pdf_to_images():
    pdf_path = Path("outputs/the-date-crew-assessment.pdf")
    output_dir = Path("outputs/pdf_pages")
    output_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(str(pdf_path))
    print(f"Total pages: {len(doc)}")

    for i, page in enumerate(doc):
        # Render at 2x resolution (144 dpi) for clear readability
        pix = page.get_pixmap(dpi=150)
        out_file = output_dir / f"page_{i + 1}.png"
        pix.save(str(out_file))
        print(f"Rendered: {out_file}")

if __name__ == "__main__":
    render_pdf_to_images()
