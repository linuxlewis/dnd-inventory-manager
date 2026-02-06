"""Currency service layer for business logic and validation.

Conversion rates: 10 CP = 1 SP, 10 SP = 1 GP, 10 GP = 1 PP
In copper: CP=1, SP=10, GP=100, PP=1000
"""

from fastapi import HTTPException

from app.models import CurrencyDenomination, CurrencyResponse, CurrencyUpdate, Inventory

# Value of each denomination in copper pieces
CONVERSION_RATES: dict[CurrencyDenomination, int] = {
    CurrencyDenomination.copper: 1,
    CurrencyDenomination.silver: 10,
    CurrencyDenomination.gold: 100,
    CurrencyDenomination.platinum: 1000,
}


def get_total_copper(inventory: Inventory) -> int:
    """Calculate total value of inventory in copper pieces."""
    return (
        inventory.copper
        + inventory.silver * CONVERSION_RATES[CurrencyDenomination.silver]
        + inventory.gold * CONVERSION_RATES[CurrencyDenomination.gold]
        + inventory.platinum * CONVERSION_RATES[CurrencyDenomination.platinum]
    )


def get_delta_copper(delta: CurrencyUpdate) -> int:
    """Calculate total value of delta in copper pieces."""
    return (
        (delta.copper or 0)
        + (delta.silver or 0) * CONVERSION_RATES[CurrencyDenomination.silver]
        + (delta.gold or 0) * CONVERSION_RATES[CurrencyDenomination.gold]
        + (delta.platinum or 0) * CONVERSION_RATES[CurrencyDenomination.platinum]
    )


def copper_to_denominations(copper: int) -> tuple[int, int, int, int]:
    """Convert copper value to optimal denomination breakdown.

    Returns (platinum, gold, silver, copper) tuple.
    """
    platinum = copper // CONVERSION_RATES[CurrencyDenomination.platinum]
    copper %= CONVERSION_RATES[CurrencyDenomination.platinum]

    gold = copper // CONVERSION_RATES[CurrencyDenomination.gold]
    copper %= CONVERSION_RATES[CurrencyDenomination.gold]

    silver = copper // CONVERSION_RATES[CurrencyDenomination.silver]
    copper %= CONVERSION_RATES[CurrencyDenomination.silver]

    return (platinum, gold, silver, copper)


def apply_currency_delta(inventory: Inventory, delta: CurrencyUpdate) -> CurrencyResponse:
    """Apply a currency delta to an inventory.

    Modifies the inventory in place and returns the new currency state.
    Raises HTTPException(400) if insufficient funds.

    For spending (negative deltas), automatically makes change from higher
    denominations if needed. For example, spending 15 GP when you only have
    10 GP and 1 PP will break the platinum to cover the difference.
    """
    delta_copper = get_delta_copper(delta)

    # If adding funds, just add directly
    if delta_copper >= 0:
        if delta.copper is not None:
            inventory.copper += delta.copper
        if delta.silver is not None:
            inventory.silver += delta.silver
        if delta.gold is not None:
            inventory.gold += delta.gold
        if delta.platinum is not None:
            inventory.platinum += delta.platinum
        return CurrencyResponse.from_inventory(inventory)

    # Spending: check total value and make change if needed
    total_copper = get_total_copper(inventory)
    spend_copper = abs(delta_copper)

    if total_copper < spend_copper:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    # Calculate new total and convert back to denominations
    new_total = total_copper - spend_copper
    new_pp, new_gp, new_sp, new_cp = copper_to_denominations(new_total)

    inventory.platinum = new_pp
    inventory.gold = new_gp
    inventory.silver = new_sp
    inventory.copper = new_cp

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
    from_rate = CONVERSION_RATES[from_denom]
    to_rate = CONVERSION_RATES[to_denom]

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
