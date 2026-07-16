export type FoodType =
  | "all"
  | "local"
  | "italian"
  | "pizza"
  | "asian"
  | "thai"
  | "indian"
  | "seafood"
  | "vegetarian"
  | "cafe";

export const FOOD_TYPES: Array<{ id: FoodType; label: string; emoji: string }> = [
  { id: "all", label: "Alle", emoji: "🍽️" },
  { id: "local", label: "Lokalt", emoji: "📍" },
  { id: "italian", label: "Italiensk", emoji: "🍝" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "asian", label: "Asiatisk", emoji: "🥢" },
  { id: "thai", label: "Thai", emoji: "🌶️" },
  { id: "indian", label: "Indisk", emoji: "🍛" },
  { id: "seafood", label: "Fisk & skaldyr", emoji: "🐟" },
  { id: "vegetarian", label: "Vegetarisk", emoji: "🥬" },
  { id: "cafe", label: "Café", emoji: "☕" },
];

export const OSM_CUISINE_FILTERS: Record<Exclude<FoodType, "all" | "cafe">, string> = {
  local: "regional|local",
  italian: "italian|pasta",
  pizza: "pizza",
  asian: "asian|chinese|japanese|korean|vietnamese|sushi|noodle",
  thai: "thai",
  indian: "indian",
  seafood: "seafood|fish",
  vegetarian: "vegetarian|vegan",
};

export const GOOGLE_FOOD_TYPES: Partial<Record<FoodType, string>> = {
  italian: "italian_restaurant",
  pizza: "pizza_restaurant",
  asian: "asian_restaurant",
  thai: "thai_restaurant",
  indian: "indian_restaurant",
  seafood: "seafood_restaurant",
  vegetarian: "vegetarian_restaurant",
  cafe: "cafe",
};

