"""Thumbnail generation service using DALL-E 3."""

import logging
from typing import TYPE_CHECKING

from openai import APIError, AsyncOpenAI, RateLimitError

if TYPE_CHECKING:
    from app.db.item import Item

logger = logging.getLogger(__name__)


def build_prompt(item: "Item") -> str:
    """Build a DALL-E prompt from item details.

    Args:
        item: The item to generate a thumbnail for.

    Returns:
        A detailed prompt for DALL-E.
    """
    # Base style for fantasy RPG item icons
    style = "Fantasy RPG item icon, centered, simple background, digital art"

    # Build description parts
    parts = []

    if item.name:
        parts.append(item.name)

    if item.item_type:
        parts.append(f"a {item.item_type}")

    if item.category:
        parts.append(f"({item.category})")

    if item.rarity:
        rarity_descriptors = {
            "common": "simple, ordinary",
            "uncommon": "slightly magical, with subtle glow",
            "rare": "magical, with blue glow",
            "very rare": "powerful magical, with purple aura",
            "legendary": "legendary, with golden glow and epic details",
            "artifact": "ancient artifact, with mystical symbols and powerful aura",
        }
        rarity_desc = rarity_descriptors.get(item.rarity.lower(), item.rarity)
        parts.append(f"({rarity_desc})")

    if item.description:
        # Truncate long descriptions
        desc = item.description[:200] if len(item.description) > 200 else item.description
        parts.append(f"Description: {desc}")

    item_description = " ".join(parts)

    prompt = f"{item_description}. {style}"
    return prompt


class ThumbnailGenerationError(Exception):
    """Exception raised when thumbnail generation fails."""

    pass


async def generate_thumbnail(item: "Item", api_key: str) -> str:
    """Generate a thumbnail for an item using DALL-E 3.

    Args:
        item: The item to generate a thumbnail for.
        api_key: The OpenAI API key to use.

    Returns:
        The URL of the generated thumbnail image.

    Raises:
        ThumbnailGenerationError: If generation fails.
    """
    client = AsyncOpenAI(api_key=api_key)

    prompt = build_prompt(item)
    logger.info(f"Generating thumbnail for item {item.id} with prompt: {prompt[:100]}...")

    try:
        response = await client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",  # DALL-E 3 minimum size
            quality="standard",
            n=1,
        )

        if response.data and len(response.data) > 0:
            image_url = response.data[0].url
            if image_url:
                logger.info(f"Successfully generated thumbnail for item {item.id}")
                return image_url

        raise ThumbnailGenerationError("No image returned from DALL-E")

    except RateLimitError as e:
        logger.warning(f"Rate limit hit for item {item.id}: {e}")
        raise ThumbnailGenerationError(f"Rate limit exceeded: {e}") from e

    except APIError as e:
        logger.error(f"OpenAI API error for item {item.id}: {e}")
        raise ThumbnailGenerationError(f"OpenAI API error: {e}") from e

    except Exception as e:
        logger.error(f"Unexpected error generating thumbnail for item {item.id}: {e}")
        raise ThumbnailGenerationError(f"Unexpected error: {e}") from e


async def test_api_key(api_key: str) -> tuple[bool, str | None]:
    """Test if an OpenAI API key is valid.

    Args:
        api_key: The API key to test.

    Returns:
        Tuple of (is_valid, error_message).
    """
    client = AsyncOpenAI(api_key=api_key)

    try:
        # Make a minimal API call to test the key
        await client.models.list()
        return True, None
    except APIError as e:
        return False, f"API error: {e}"
    except Exception as e:
        return False, f"Error: {e}"
