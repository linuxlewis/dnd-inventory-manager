# API routers package
from app.routers.inventories import router as inventories_router
from app.routers.items import router as items_router
from app.routers.openai import router as openai_router

__all__ = ["inventories_router", "items_router", "openai_router"]
