from pathlib import Path
import pandas as pd


class RelationshipService:
    REQUIRED_COLUMNS = [
        "StudentID",
        "StudentName",
        "ClassName",
        "ParentName",
        "ParentWX",
    ]

    def __init__(self, storage_root: Path) -> None:
        self.storage_root = storage_root

    def relationship_path(self) -> Path:
        return self.storage_root / "config" / "Relationship.xlsx"

    def exists(self) -> bool:
        return self.relationship_path().exists()

    def load_rows(self) -> list[dict]:
        path = self.relationship_path()
        if not path.exists():
            return []
        df = pd.read_excel(path)
        missing = [c for c in self.REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            raise ValueError(f"Relationship.xlsx 缺少列: {', '.join(missing)}")
        return df[self.REQUIRED_COLUMNS].fillna("").to_dict(orient="records")

    def save_rows(self, rows: list[dict]) -> Path:
        path = self.relationship_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        df = pd.DataFrame(rows, columns=self.REQUIRED_COLUMNS)
        df.to_excel(path, index=False)
        return path
