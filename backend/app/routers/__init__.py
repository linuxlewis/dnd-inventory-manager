# API routers package
from app.routers.currency import router as currency_router
from app.routers.history import router as history_router
from app.routers.inventories import router as inventories_router
from app.routers.items import router as items_router

__all__ = ["currency_router", "history_router", "inventories_router", "items_router"]
