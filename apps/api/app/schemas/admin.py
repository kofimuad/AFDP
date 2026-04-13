from pydantic import BaseModel


class AdminStatsResponse(BaseModel):
    """Admin platform statistics payload."""

    total_vendors: int
    total_restaurants: int
    total_grocery_stores: int
    total_foods: int
    total_ingredients: int
    total_searches: int
