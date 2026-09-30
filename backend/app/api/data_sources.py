from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import (
    DataSource, ProductionRecord, AccidentRecord, SafetyRecord, Mine
)

router = APIRouter(prefix="/data-sources", tags=["Data Sources"])


@router.get("")
@router.get("/catalog")
def list_data_sources(db: Session = Depends(get_db)):
    """
    Returns registered authoritative public datasets and their provenance metadata.
    """
    sources = db.query(DataSource).all()
    # Update real-time counts
    res = []
    for s in sources:
        count = s.record_count
        if "Production" in s.name:
            count = db.query(ProductionRecord).count()
        elif "Accident" in s.name:
            count = db.query(AccidentRecord).count()
        elif "Safety" in s.name:
            count = db.query(SafetyRecord).count()
        
        res.append({
            "id": s.id,
            "name": s.name,
            "source_organization": s.source_organization,
            "source_url": s.source_url,
            "source_date": s.source_date,
            "data_type": s.data_type,
            "record_count": count,
            "description": s.description,
            "last_imported": s.last_imported.strftime("%Y-%m-%d %H:%M:%S UTC") if s.last_imported else "N/A"
        })
    return res


@router.get("/production")
def get_public_production_records(
    fiscal_year: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Retrieves authoritative historical coal production & despatch figures (CCO / Ministry of Coal).
    """
    q = db.query(ProductionRecord)
    if fiscal_year:
        q = q.filter(ProductionRecord.fiscal_year == fiscal_year)
    if company:
        q = q.filter(ProductionRecord.company_name.ilike(f"%{company}%"))
    if state:
        q = q.filter(ProductionRecord.state.ilike(f"%{state}%"))

    records = q.order_by(desc(ProductionRecord.total_production_mt)).all()

    total_prod = sum(r.total_production_mt for r in records)
    total_desp = sum(r.offtake_despatch_mt for r in records)
    total_coking = sum(r.coking_coal_mt for r in records)
    total_non_coking = sum(r.non_coking_coal_mt for r in records)

    return {
        "source": "Coal Directory of India / Ministry of Coal, Government of India",
        "source_url": "https://coal.gov.in",
        "data_type": "Historical Government Data",
        "summary": {
            "total_production_mt": round(total_prod, 2),
            "total_despatch_mt": round(total_desp, 2),
            "coking_coal_mt": round(total_coking, 2),
            "non_coking_coal_mt": round(total_non_coking, 2),
            "mines_reported": len(records)
        },
        "records": [
            {
                "id": r.id,
                "mine_name": r.colliery_name,
                "company": r.company_name,
                "state": r.state,
                "fiscal_year": r.fiscal_year,
                "coking_coal_mt": r.coking_coal_mt,
                "non_coking_coal_mt": r.non_coking_coal_mt,
                "total_production_mt": r.total_production_mt,
                "offtake_despatch_mt": r.offtake_despatch_mt,
                "source_name": r.source_name,
                "source_url": r.source_url,
                "data_type": r.data_type
            }
            for r in records
        ]
    }


@router.get("/accidents")
def get_public_accident_records(
    year: Optional[int] = Query(None),
    accident_type: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Retrieves official DGMS accident statistics across Indian coalfields.
    """
    q = db.query(AccidentRecord)
    if year:
        q = q.filter(AccidentRecord.year == year)
    if accident_type:
        q = q.filter(AccidentRecord.accident_type.ilike(f"%{accident_type}%"))
    if state:
        q = q.filter(AccidentRecord.state.ilike(f"%{state}%"))

    records = q.order_by(desc(AccidentRecord.year)).all()

    total_fatal = sum(r.fatalities for r in records)
    total_inj = sum(r.serious_injuries for r in records)

    return {
        "source": "DGMS Annual Statistics on Safety and Accidents in Coal Mines",
        "source_url": "https://dgms.gov.in",
        "data_type": "Historical Government Data",
        "summary": {
            "total_fatalities": total_fatal,
            "total_serious_injuries": total_inj,
            "incidents_cataloged": len(records)
        },
        "records": [
            {
                "id": r.id,
                "mine_name": r.colliery_name,
                "company": r.company_name,
                "state": r.state,
                "year": r.year,
                "accident_type": r.accident_type,
                "fatalities": r.fatalities,
                "serious_injuries": r.serious_injuries,
                "cause_classification": r.cause_classification,
                "source_name": r.source_name,
                "source_url": r.source_url,
                "data_type": r.data_type
            }
            for r in records
        ]
    }


@router.get("/safety-indicators")
def get_public_safety_indicators(db: Session = Depends(get_db)):
    """
    Retrieves official DGMS annual national safety indicators (fatality & injury rates per MT).
    """
    records = db.query(SafetyRecord).order_by(desc(SafetyRecord.year)).all()

    return {
        "source": "Directorate General of Mines Safety (DGMS) Standard Mining Safety Indicators",
        "source_url": "https://dgms.gov.in",
        "data_type": "Historical Government Data",
        "records": [
            {
                "id": r.id,
                "year": r.year,
                "jurisdiction": r.state,
                "fatality_rate_per_mt": r.fatality_rate_per_mt,
                "serious_injury_rate_per_mt": r.serious_injury_rate_per_mt,
                "fatality_rate_per_1000_workers": r.fatality_rate_per_1000_workers,
                "serious_injury_rate_per_1000_workers": r.serious_injury_rate_per_1000_workers,
                "source_name": r.source_name,
                "source_url": r.source_url,
                "data_type": r.data_type
            }
            for r in records
        ]
    }
