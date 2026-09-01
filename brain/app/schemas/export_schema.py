import sys
import json
from pathlib import Path

brain_dir = str(Path(__file__).resolve().parents[2])
if brain_dir not in sys.path:
    sys.path.insert(0, brain_dir)

from app.schemas.contracts import AskRequest, AdvisoryResponse, NavIC25BytePacket

def export_json_schema():
    schemas = {
        "AskRequest": AskRequest.model_json_schema(),
        "AdvisoryResponse": AdvisoryResponse.model_json_schema(),
        "NavIC25BytePacket": NavIC25BytePacket.model_json_schema(),
    }
    output_dir = Path(__file__).resolve().parents[3] / "shared"
    output_dir.mkdir(exist_ok=True)
    schema_file = output_dir / "schema.json"
    with open(schema_file, "w") as f:
        json.dump(schemas, f, indent=2)
    print(f"Exported JSON schemas to {schema_file}")

if __name__ == "__main__":
    export_json_schema()
