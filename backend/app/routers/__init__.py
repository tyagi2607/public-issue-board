from app.routers.auth import router as auth_router
from app.routers.issues import router as issues_router
from app.routers.votes import router as votes_router
from app.routers.comments import router as comments_router
from app.routers.dashboard import router as dashboard_router
from app.routers.metadata import router as metadata_router

__all__ = [
    "auth_router",
    "issues_router",
    "votes_router",
    "comments_router",
    "dashboard_router",
    "metadata_router",
]
