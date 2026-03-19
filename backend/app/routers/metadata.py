from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Category, Jurisdiction, GovernmentBody
from app.schemas.schemas import CategoryOut, JurisdictionOut, GovernmentBodyOut

router = APIRouter(tags=["metadata"])


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(Category).order_by(Category.name))
    return result.scalars().all()


@router.get("/jurisdictions", response_model=list[JurisdictionOut])
async def list_jurisdictions(db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(Jurisdiction).order_by(Jurisdiction.level, Jurisdiction.name))
    return result.scalars().all()


@router.get("/government-bodies", response_model=list[GovernmentBodyOut])
async def list_government_bodies(
    jurisdiction_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(GovernmentBody).order_by(GovernmentBody.name)
    if jurisdiction_id:
        q = q.where(GovernmentBody.jurisdiction_id == jurisdiction_id)
    result = await db.execute(q)
    return result.scalars().all()
