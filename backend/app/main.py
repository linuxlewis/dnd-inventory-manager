from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.models import Inventory, Item  # noqa: F401 - import to register with SQLModel metadata
from app.routers import inventories_router, items_router, srd_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    await init_db()
    yield


app = FastAPI(title="D&D Party Inventory Manager", version="0.1.0", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(inventories_router)
app.include_router(items_router)
app.include_router(srd_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
