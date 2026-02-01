from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.db import (
    Base,  # noqa: F401 - import models to register with metadata
    Inventory,  # noqa: F401
    Item,  # noqa: F401
)
from app.routers import currency_router, events_router, inventories_router, items_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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
app.include_router(currency_router)
app.include_router(events_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
