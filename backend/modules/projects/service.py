import shutil
from pathlib import Path
from uuid import UUID

import numpy as np
import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.modules.projects.models import CsvFile, Project

settings = get_settings()
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(exist_ok=True)


def create_project(db: Session, user_id: UUID, name: str) -> Project:
    project = Project(user_id=user_id, name=name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session, user_id: UUID) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.user_id == user_id)
        .order_by(Project.updated_at.desc())
        .all()
    )


def get_project(db: Session, project_id: UUID, user_id: UUID) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def delete_project(db: Session, project_id: UUID, user_id: UUID) -> None:
    project = get_project(db, project_id, user_id)
    for csv in project.csv_files:
        Path(csv.path).unlink(missing_ok=True)
    db.delete(project)
    db.commit()


def infer_schema(df: pd.DataFrame) -> dict:
    return {
        "columns": [
            {
                "name": col,
                "type": str(df[col].dtype),
                "sample_values": df[col].dropna().head(3).tolist(),
            }
            for col in df.columns
        ]
    }


def build_profile(df: pd.DataFrame) -> dict:
    total = len(df)
    profile: dict = {"columns": []}

    for col in df.columns:
        series = df[col]
        null_count = int(series.isna().sum())
        null_pct = round(null_count / total, 4) if total else 0

        col_info: dict = {
            "name": col,
            "type": str(series.dtype),
            "null_pct": null_pct,
            "unique_count": int(series.nunique()),
        }

        if pd.api.types.is_numeric_dtype(series):
            s = series.dropna()
            if len(s):
                col_info["min"] = _json_safe(s.min())
                col_info["max"] = _json_safe(s.max())
                col_info["mean"] = _json_safe(s.mean())
        else:
            top = series.value_counts().head(5)
            col_info["top_values"] = [
                {"value": str(k), "count": int(v)} for k, v in top.items()
            ]

        profile["columns"].append(col_info)

    return profile


def _json_safe(val):
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return round(float(val), 4)
    return val


async def upload_csv(db: Session, project_id: UUID, user_id: UUID, file: UploadFile) -> CsvFile:
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    project = get_project(db, project_id, user_id)

    project_dir = UPLOAD_DIR / str(project_id)
    project_dir.mkdir(exist_ok=True)

    dest = project_dir / file.filename
    content = await file.read()
    dest.write_bytes(content)

    try:
        df = pd.read_csv(dest)
        schema = infer_schema(df)
        profile = build_profile(df)
    except Exception as exc:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}") from exc

    csv_file = CsvFile(
        project_id=project.id,
        filename=file.filename,
        path=str(dest),
        row_count=len(df),
        schema_json=schema,
        profile_json=profile,
    )
    db.add(csv_file)
    db.commit()
    db.refresh(csv_file)
    return csv_file
