# API routers package
from app.routers.inventories import router as inventories_router
from app.routers.items import router as items_router
from app.routers.srd import router as srd_router

__all__ = ["inventories_router", "items_router", "srd_router"]
