# API routers package
from app.routers.currency import router as currency_router
from app.routers.events import router as events_router
from app.routers.inventories import router as inventories_router
from app.routers.items import router as items_router

__all__ = ["inventories_router", "items_router", "currency_router", "events_router"]
