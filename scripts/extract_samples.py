"""Read only the Samples worksheet; preserve identifiers and convert Excel dates."""
import json
from datetime import datetime, timedelta
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Asset Classification for Asset Tagging 1.xlsx"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
FIELDS = {
    "Asset Code": "code", "Asset Name": "name", "PO number": "poNumber",
    "Vendor Code": "vendorCode", "Vendor Name": "vendorName",
    "Asset Location": "location", "Cost Center": "costCenter", "Quantity": "quantity",
    "Useful Life": "usefulLife", "Capitalization Date": "capitalizationDate",
}

with zipfile.ZipFile(SOURCE) as archive:
    strings = ["".join(item.itertext()) for item in ET.fromstring(
        archive.read("xl/sharedStrings.xml")).findall("m:si", NS)]
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    sheet = next(s for s in workbook.findall("m:sheets/m:sheet", NS) if s.get("name") == "Samples")
    rel_id = sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    target = next(r.get("Target") for r in rels if r.get("Id") == rel_id)
    sheet_path = target.lstrip("/") if target.startswith("/") else "xl/" + target
    rows = ET.fromstring(archive.read(sheet_path)).findall("m:sheetData/m:row", NS)
    samples = []
    current = []
    for row in rows:
        cells = {}
        for cell in row.findall("m:c", NS):
            value = cell.find("m:v", NS)
            text = value.text if value is not None else "".join(cell.itertext())
            if cell.get("t") == "s":
                text = strings[int(text)]
            cells["".join(c for c in cell.get("r") if c.isalpha())] = text
        if cells.get("A"):
            current = [{"type": cells["A"]} for col in ("D", "E") if cells.get(col, "").startswith("Sample")]
            samples.extend(current)
        field = FIELDS.get(cells.get("C", "").strip())
        if field:
            for index, sample in enumerate(current):
                value = cells.get(("D", "E")[index], "")
                if field == "capitalizationDate" and value:
                    value = (datetime(1899, 12, 30) + timedelta(days=float(value))).strftime("%Y-%m-%d")
                sample[field] = value

for sample in samples:
    if set(FIELDS.values()) - set(sample):
        raise ValueError(f"Incomplete sample: {sample}")
    sample["sapCode"] = sample["code"].zfill(16)
if len({s["code"] for s in samples}) != len(samples):
    raise ValueError("Duplicate asset codes")
destination = ROOT / "src/data/samples.json"
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(samples, indent=2, ensure_ascii=False) + "\n")
print(f"Extracted {len(samples)} samples, each with {len(FIELDS)} fields, to {destination}")
