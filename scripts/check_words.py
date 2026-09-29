import re
from pathlib import Path

def count_words(text):
    return len(re.findall(r"\b[A-Za-z0-9_\'-]+\b", text))

content = Path("docs/assessment-answers.md").read_text(encoding="utf-8")
parts = re.split(r"##\s+", content)

for p in parts[1:]:
    lines = p.strip().split("\n")
    title = lines[0].strip()
    body = "\n".join(lines[1:]).strip()
    # Strip markdown headers or dividers
    body_clean = re.sub(r"---", "", body)
    words = count_words(body_clean)
    print(f"{title}: {words} words")
