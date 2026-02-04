"""Currency service layer for business logic and validation.

Conversion rates: 10 CP = 1 SP, 10 SP = 1 GP, 10 GP = 1 PP
In copper: CP=1, SP=10, GP=100, PP=1000
"""

from fastapi import HTTPException

from app.models import CurrencyDenomination, CurrencyResponse, CurrencyUpdate, Inventory

# Value of each denomination in copper pieces
CONVERSION_RATES: dict[str, int] = {
    "copper": 1,
    "silver": 10,
    "gold": 100,
    "platinum": 1000,
}


def calculate_total_gp(copper: int, silver: int, gold: int, platinum: int) -> float:
    """Calculate total value in gold pieces.

    Formula: (copper/100) + (silver/10) + gold + (platinum*10)
    """
    return copper / 100 + silver / 10 + gold + platinum * 10


def validate_sufficient_funds(inventory: Inventory, delta: CurrencyUpdate) -> bool:
    """Check if inventory has sufficient funds for the delta.

    Returns True if all resulting values would be non-negative.
    """
    new_copper = inventory.copper + (delta.copper or 0)
    new_silver = inventory.silver + (delta.silver or 0)
    new_gold = inventory.gold + (delta.gold or 0)
    new_platinum = inventory.platinum + (delta.platinum or 0)

    return new_copper >= 0 and new_silver >= 0 and new_gold >= 0 and new_platinum >= 0


def apply_currency_delta(inventory: Inventory, delta: CurrencyUpdate) -> CurrencyResponse:
    """Apply a currency delta to an inventory.

    Modifies the inventory in place and returns the new currency state.
    Raises HTTPException(400) if insufficient funds.
    """
    if not validate_sufficient_funds(inventory, delta):
        raise HTTPException(status_code=400, detail="Insufficient funds")

    if delta.copper is not None:
        inventory.copper += delta.copper
    if delta.silver is not None:
        inventory.silver += delta.silver
    if delta.gold is not None:
        inventory.gold += delta.gold
    if delta.platinum is not None:
        inventory.platinum += delta.platinum

    return CurrencyResponse.from_inventory(inventory)


def convert_currency(
    inventory: Inventory,
    from_denom: CurrencyDenomination,
    to_denom: CurrencyDenomination,
    amount: int,
) -> CurrencyResponse:
    """Convert currency from one denomination to another.

    Modifies the inventory in place and returns the new currency state.
    Raises HTTPException(400) if insufficient funds or invalid conversion.

    For up-conversion (e.g., copper to gold), only the exact amount needed
    is consumed. For example, converting 250 CP to gold uses 200 CP (2 GP)
    and leaves 50 CP.

    For down-conversion (e.g., gold to silver), the full amount is consumed
    and converted exactly.
    """
    if from_denom == to_denom:
        raise HTTPException(status_code=400, detail="Cannot convert to same denomination")

    # Get current amount of source denomination
    current_amount = getattr(inventory, from_denom.value)
    if current_amount < amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {from_denom.value}: have {current_amount}, need {amount}",
        )

    # Calculate conversion
    from_rate = CONVERSION_RATES[from_denom.value]
    to_rate = CONVERSION_RATES[to_denom.value]

    # Convert to copper, then to target
    total_copper = amount * from_rate
    converted_amount = total_copper // to_rate

    if converted_amount == 0:
        raise HTTPException(
            status_code=400,
            detail=f"Amount too small to convert: {amount} {from_denom.value} "
            f"< 1 {to_denom.value}",
        )

    # Calculate how much of the source was actually used
    used_copper = converted_amount * to_rate
    used_source = used_copper // from_rate

    # Deduct only the used source amount (remainder stays in source denomination)
    setattr(inventory, from_denom.value, current_amount - used_source)

    # Add converted amount
    current_target = getattr(inventory, to_denom.value)
    setattr(inventory, to_denom.value, current_target + converted_amount)

    # Note: remainder is preserved in the source denomination by only
    # deducting used_source. No need to add remainder as copper.

    return CurrencyResponse.from_inventory(inventory)
