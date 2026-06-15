"""Curated African food + ingredient catalog.

Used for two things:
  1. Populating the ``foods``, ``ingredients``, ``food_regions``, and
     ``food_ingredients`` tables so name-based search matches real dishes.
  2. Linking sourced vendors to a plausible subset of dishes/ingredients via
     ``vendor_items`` so ``/api/v1/search`` doesn't return empty restaurants
     for valid dish names.
"""

from __future__ import annotations

import os

from slugify import slugify

# Images are served from Cloudinary using a slug-based public_id convention:
#   afdp/foods/<slug>
# Upload each dish's image to that exact public_id via the Cloudinary dashboard
# or the helper in ``scripts/upload_food_images.py``. Until uploaded, the URL
# 404s and the UI should display its built-in placeholder.
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "dx5tbpgob")
_FOOD_IMG_URL_TEMPLATE = (
    "https://res.cloudinary.com/{cloud}/image/upload/"
    "f_auto,q_auto,w_800,c_fill,h_600/afdp/foods/{slug}.jpg"
)
_ING_IMG_URL_TEMPLATE = (
    "https://res.cloudinary.com/{cloud}/image/upload/"
    "f_auto,q_auto,w_600,c_fill,h_600/afdp/ingredients/{slug}.jpg"
)


def food_image_url(name: str) -> str:
    """Build a deterministic Cloudinary URL for a given food name."""
    return _FOOD_IMG_URL_TEMPLATE.format(cloud=CLOUDINARY_CLOUD_NAME, slug=slugify(name))


def ingredient_image_url(name: str) -> str:
    """Build a deterministic Cloudinary URL for a given ingredient name."""
    return _ING_IMG_URL_TEMPLATE.format(cloud=CLOUDINARY_CLOUD_NAME, slug=slugify(name))


# ── Regions ────────────────────────────────────────────────────────────────
REGIONS: list[str] = [
    "West African",
    "East African",
    "North African",
    "Southern African",
    "Central African",
    "Afro-Caribbean",
]

# ── Foods ──────────────────────────────────────────────────────────────────
# ``prep_minutes``/``cook_minutes`` are curated approximations for the
# "Cook it yourself" catalog cards — hands-on prep vs. active cook/bake time.
FOODS: list[dict] = [
    # West African
    {"name": "Jollof Rice", "region": "West African", "prep_minutes": 20, "cook_minutes": 45, "description": "Smoky one-pot tomato rice, a West African staple."},
    {"name": "Egusi Soup", "region": "West African", "prep_minutes": 25, "cook_minutes": 50, "description": "Melon-seed soup with leafy greens and protein."},
    {"name": "Suya", "region": "West African", "prep_minutes": 25, "cook_minutes": 15, "description": "Spicy grilled beef skewers coated in yaji spice."},
    {"name": "Fufu", "region": "West African", "prep_minutes": 10, "cook_minutes": 20, "description": "Soft pounded dough eaten with soup."},
    {"name": "Pounded Yam", "region": "West African", "prep_minutes": 15, "cook_minutes": 30, "description": "Smooth yam swallow paired with Nigerian soups."},
    {"name": "Banga Soup", "region": "West African", "prep_minutes": 20, "cook_minutes": 55, "description": "Palm-nut soup from the Niger Delta."},
    {"name": "Afang Soup", "region": "West African", "prep_minutes": 25, "cook_minutes": 45, "description": "Efik soup of afang leaves and waterleaf."},
    {"name": "Edikang Ikong", "region": "West African", "prep_minutes": 25, "cook_minutes": 45, "description": "Vegetable soup with ugu and waterleaf."},
    {"name": "Ogbono Soup", "region": "West African", "prep_minutes": 15, "cook_minutes": 40, "description": "Draw soup from ground ogbono seeds."},
    {"name": "Moi Moi", "region": "West African", "prep_minutes": 25, "cook_minutes": 45, "description": "Steamed bean pudding."},
    {"name": "Akara", "region": "West African", "prep_minutes": 20, "cook_minutes": 20, "description": "Fried bean cakes."},
    {"name": "Pepper Soup", "region": "West African", "prep_minutes": 15, "cook_minutes": 35, "description": "Peppery broth with fish, goat, or chicken."},
    {"name": "Efo Riro", "region": "West African", "prep_minutes": 20, "cook_minutes": 40, "description": "Yoruba spinach stew."},
    {"name": "Amala and Ewedu", "region": "West African", "prep_minutes": 15, "cook_minutes": 25, "description": "Yam-flour swallow with jute-leaf soup."},
    {"name": "Waakye", "region": "West African", "prep_minutes": 15, "cook_minutes": 60, "description": "Ghanaian rice and beans with shito."},
    {"name": "Kelewele", "region": "West African", "prep_minutes": 15, "cook_minutes": 15, "description": "Spiced fried plantains."},
    {"name": "Banku and Tilapia", "region": "West African", "prep_minutes": 20, "cook_minutes": 40, "description": "Fermented corn-cassava dough with grilled tilapia."},
    {"name": "Fufu and Light Soup", "region": "West African", "prep_minutes": 20, "cook_minutes": 50, "description": "Cassava fufu in a tomato-ginger broth."},
    {"name": "Okra Soup", "region": "West African", "prep_minutes": 15, "cook_minutes": 30, "description": "Okra-based draw soup."},
    {"name": "Groundnut Soup", "region": "West African", "prep_minutes": 20, "cook_minutes": 55, "description": "Peanut-based stew (Nkatenkwan)."},
    {"name": "Thieboudienne", "region": "West African", "prep_minutes": 30, "cook_minutes": 70, "description": "Senegalese jollof-style fish and rice."},
    {"name": "Yassa Poulet", "region": "West African", "prep_minutes": 20, "cook_minutes": 45, "description": "Senegalese lemon-onion chicken."},
    {"name": "Mafe", "region": "West African", "prep_minutes": 20, "cook_minutes": 60, "description": "Peanut stew popular across West Africa."},
    {"name": "Attieke", "region": "West African", "prep_minutes": 10, "cook_minutes": 20, "description": "Ivorian cassava couscous."},
    {"name": "Kedjenou", "region": "West African", "prep_minutes": 20, "cook_minutes": 60, "description": "Slow-cooked Ivorian chicken stew."},
    {"name": "Riz Gras", "region": "West African", "prep_minutes": 25, "cook_minutes": 55, "description": "Burkinabé festive rice."},
    {"name": "Chin Chin", "region": "West African", "prep_minutes": 25, "cook_minutes": 25, "description": "Crunchy sweet fried dough snack."},
    {"name": "Plantain Chips", "region": "West African", "prep_minutes": 10, "cook_minutes": 15, "description": "Crisp fried slices of green plantain."},

    # East African
    {"name": "Injera", "region": "East African", "prep_minutes": 30, "cook_minutes": 20, "description": "Spongy teff sourdough flatbread, the base of Ethiopian and Eritrean meals."},
    {"name": "Doro Wat", "region": "East African", "prep_minutes": 30, "cook_minutes": 90, "description": "Deeply spiced Ethiopian chicken stew with berbere and niter kibbeh."},
    {"name": "Injera with Doro Wat", "region": "East African", "prep_minutes": 40, "cook_minutes": 90, "description": "Sourdough flatbread with spiced chicken stew."},
    {"name": "Injera with Tibs", "region": "East African", "prep_minutes": 25, "cook_minutes": 25, "description": "Sauteed beef or lamb served over injera."},
    {"name": "Injera with Kitfo", "region": "East African", "prep_minutes": 20, "cook_minutes": 10, "description": "Minced raw beef with mitmita and niter kibbeh."},
    {"name": "Misir Wat", "region": "East African", "prep_minutes": 15, "cook_minutes": 40, "description": "Spiced red lentil stew."},
    {"name": "Shiro", "region": "East African", "prep_minutes": 10, "cook_minutes": 25, "description": "Thick chickpea-flour stew."},
    {"name": "Ugali", "region": "East African", "prep_minutes": 5, "cook_minutes": 15, "description": "Stiff maize porridge."},
    {"name": "Nyama Choma", "region": "East African", "prep_minutes": 15, "cook_minutes": 40, "description": "Kenyan grilled goat or beef."},
    {"name": "Pilau", "region": "East African", "prep_minutes": 20, "cook_minutes": 45, "description": "Swahili spiced rice."},
    {"name": "Chapati", "region": "East African", "prep_minutes": 25, "cook_minutes": 25, "description": "East African layered flatbread."},
    {"name": "Mandazi", "region": "East African", "prep_minutes": 20, "cook_minutes": 20, "description": "Cardamom-scented fried bread."},
    {"name": "Sukuma Wiki", "region": "East African", "prep_minutes": 10, "cook_minutes": 15, "description": "Sauteed collard greens."},
    {"name": "Githeri", "region": "East African", "prep_minutes": 15, "cook_minutes": 50, "description": "Kenyan corn-and-bean stew."},
    {"name": "Matoke", "region": "East African", "prep_minutes": 20, "cook_minutes": 40, "description": "Ugandan stewed plantains."},
    {"name": "Luwombo", "region": "East African", "prep_minutes": 30, "cook_minutes": 75, "description": "Ganda stew steamed in banana leaves."},

    # North African
    {"name": "Couscous", "region": "North African", "prep_minutes": 25, "cook_minutes": 60, "description": "Steamed semolina with vegetables and meat."},
    {"name": "Lamb Tagine", "region": "North African", "prep_minutes": 25, "cook_minutes": 120, "description": "Slow-cooked lamb with preserved lemon and olives."},
    {"name": "Chicken Tagine", "region": "North African", "prep_minutes": 20, "cook_minutes": 75, "description": "Chicken stewed in a conical clay pot."},
    {"name": "Harira", "region": "North African", "prep_minutes": 20, "cook_minutes": 60, "description": "Moroccan tomato-lentil soup."},
    {"name": "Shakshuka", "region": "North African", "prep_minutes": 10, "cook_minutes": 25, "description": "Eggs poached in spiced tomato sauce."},
    {"name": "Msemen", "region": "North African", "prep_minutes": 30, "cook_minutes": 20, "description": "Layered square pancakes."},
    {"name": "Brik", "region": "North African", "prep_minutes": 15, "cook_minutes": 10, "description": "Tunisian fried pastry with egg."},
    {"name": "Mechoui", "region": "North African", "prep_minutes": 20, "cook_minutes": 180, "description": "Slow-roasted whole lamb."},

    # Southern African
    {"name": "Bobotie", "region": "Southern African", "prep_minutes": 25, "cook_minutes": 50, "description": "Spiced minced meat baked with an egg topping."},
    {"name": "Bunny Chow", "region": "Southern African", "prep_minutes": 20, "cook_minutes": 60, "description": "Hollowed bread loaf filled with curry."},
    {"name": "Chakalaka", "region": "Southern African", "prep_minutes": 15, "cook_minutes": 25, "description": "Spicy vegetable relish."},
    {"name": "Pap and Wors", "region": "Southern African", "prep_minutes": 10, "cook_minutes": 35, "description": "Maize porridge with boerewors sausage."},
    {"name": "Biltong", "region": "Southern African", "prep_minutes": 30, "cook_minutes": 0, "description": "Air-dried cured beef."},
    {"name": "Sadza", "region": "Southern African", "prep_minutes": 5, "cook_minutes": 20, "description": "Zimbabwean stiff maize-meal porridge eaten with relishes."},

    # Central African
    {"name": "Saka-Saka", "region": "Central African", "prep_minutes": 20, "cook_minutes": 60, "description": "Pounded cassava leaves in palm oil."},
    {"name": "Poulet Moambe", "region": "Central African", "prep_minutes": 20, "cook_minutes": 55, "description": "Chicken in palm-nut sauce."},
    {"name": "Chikwangue", "region": "Central African", "prep_minutes": 20, "cook_minutes": 60, "description": "Fermented cassava dough."},
    {"name": "Ndole", "region": "Central African", "prep_minutes": 30, "cook_minutes": 60, "description": "Cameroonian bitter-leaf stew with groundnut and meat or shrimp."},

    # Afro-Caribbean
    {"name": "Jerk Chicken", "region": "Afro-Caribbean", "prep_minutes": 20, "cook_minutes": 40, "description": "Jamaican grilled chicken marinated in allspice and scotch bonnet."},
]

# ── Ingredients ────────────────────────────────────────────────────────────
INGREDIENTS: list[str] = [
    # Grains & flours
    "Long grain rice", "Basmati rice", "Jollof rice parboiled rice",
    "Gari (cassava flour)", "Fufu flour", "Pounded yam flour (Elubo isu)",
    "Plantain flour (Elubo)", "Semolina (Semo)", "Teff flour",
    "Millet flour", "Sorghum flour", "Guinea corn flour", "Couscous",
    "Wheat flour", "Cornmeal (maize meal)",
    # Tubers & produce
    "Yam", "Plantains", "Cassava", "Cocoyam",
    "Scotch bonnet pepper", "Habanero pepper", "Ata rodo",
    "Okra (fresh)", "Okra (dried)",
    "Onion", "Tomato (fresh)", "Lemons", "Limes", "Spinach",
    # Seeds, nuts, legumes
    "Egusi seeds", "Ogbono seeds", "Melon seed flour",
    "Groundnut paste (peanut butter)", "Tigernuts",
    "Black-eyed peas", "Pigeon peas", "Bambara beans",
    "Chickpeas", "Red lentils", "Green beans",
    # Leafy greens (fresh or dried)
    "Bitter leaf", "Ugwu leaves", "Ewedu leaves", "Okazi (afang) leaves",
    "Waterleaf", "Oha leaves", "Uziza leaves",
    # Proteins (dry goods)
    "Stockfish", "Smoked catfish", "Dried shrimp", "Dried crayfish",
    "Ponmo (cow skin)", "Bonga fish (smoked herring)",
    # Fresh proteins
    "Beef", "Chicken", "Lamb", "Goat meat", "Fish (tilapia)", "Eggs", "Tuna",
    # Oils & fats
    "Red palm oil", "Palm nut concentrate (Banga)", "Niter kibbeh",
    "Shea butter", "Argan oil", "Vegetable oil", "Olive oil", "Butter",
    # Spices & seasonings
    "Suya spice (Yaji)", "Berbere spice", "Mitmita spice",
    "Ras el Hanout", "Harissa", "Chermoula paste",
    "Bouillon cubes (Maggi)", "Knorr seasoning", "Curry powder (Nigerian)",
    "Thyme", "Ginger", "Garlic",
    "Uda seeds", "Calabash nutmeg (Ehuru)", "Alligator pepper",
    "Sumac", "Preserved lemons",
    "Salt", "Black pepper", "Cumin", "Coriander (cilantro)", "Parsley",
    "Paprika", "Cinnamon", "Cardamom", "Bay leaves", "Allspice",
    # Fermented / pastes
    "Locust beans (Iru)", "Ogiri", "Dawadawa",
    "Tomato paste", "Shito",
    # Herbs / teas / misc
    "Hibiscus (Zobo)", "Baobab powder", "Moringa powder",
    "Tamarind", "Dates",
    # Bakery / pantry
    "Sugar", "Yeast", "Vinegar", "Milk", "Water",
    # Ethiopian / East African
    "Shiro powder", "Injera (fresh)",
    # North African
    "Merguez sausage", "Dried rose petals", "Phyllo (warka) pastry", "Olives",
    # Misc wrappings / condiments
    "Banana leaves", "Dijon mustard",
]

# ── Food → Ingredients mapping ─────────────────────────────────────────────
# Each value is a list of (ingredient_name, quantity_note) tuples.
# Every recipe has at least 3 ingredients per the food_ingredients schema ACs.
FOOD_INGREDIENTS: dict[str, list[tuple[str, str]]] = {
    # ── West African ──────────────────────────────────────────────────────
    "Jollof Rice": [
        ("Long grain rice", "3 cups"),
        ("Tomato paste", "3 tbsp"),
        ("Tomato (fresh)", "4 medium"),
        ("Scotch bonnet pepper", "2, blended"),
        ("Onion", "2 medium"),
        ("Bouillon cubes (Maggi)", "2 cubes"),
        ("Curry powder (Nigerian)", "1 tsp"),
        ("Thyme", "1 tsp"),
        ("Vegetable oil", "1/3 cup"),
    ],
    "Egusi Soup": [
        ("Egusi seeds", "2 cups, ground"),
        ("Red palm oil", "1/2 cup"),
        ("Ugwu leaves", "2 cups, chopped"),
        ("Stockfish", "1 piece, soaked"),
        ("Dried crayfish", "2 tbsp, ground"),
        ("Locust beans (Iru)", "1 tbsp"),
        ("Scotch bonnet pepper", "2, blended"),
        ("Onion", "1 medium"),
    ],
    "Suya": [
        ("Beef", "500 g, thin strips"),
        ("Suya spice (Yaji)", "3 tbsp"),
        ("Groundnut paste (peanut butter)", "2 tbsp, dry-roasted"),
        ("Ginger", "1 tsp, ground"),
        ("Garlic", "1 tsp, ground"),
        ("Vegetable oil", "2 tbsp, for basting"),
    ],
    "Fufu": [
        ("Gari (cassava flour)", "2 cups"),
        ("Fufu flour", "1 cup"),
        ("Water", "4 cups"),
        ("Salt", "pinch, optional"),
    ],
    "Pounded Yam": [
        ("Yam", "1 kg, peeled and boiled"),
        ("Pounded yam flour (Elubo isu)", "2 cups, alternative"),
        ("Water", "4 cups"),
        ("Salt", "pinch"),
    ],
    "Banga Soup": [
        ("Palm nut concentrate (Banga)", "500 g"),
        ("Dried crayfish", "2 tbsp, ground"),
        ("Uziza leaves", "1/2 cup, chopped"),
        ("Stockfish", "1 piece"),
        ("Onion", "1 medium"),
        ("Bouillon cubes (Maggi)", "1 cube"),
    ],
    "Afang Soup": [
        ("Okazi (afang) leaves", "2 cups, shredded"),
        ("Waterleaf", "3 cups, chopped"),
        ("Red palm oil", "1/2 cup"),
        ("Stockfish", "1 piece"),
        ("Ponmo (cow skin)", "200 g"),
        ("Dried crayfish", "2 tbsp"),
    ],
    "Edikang Ikong": [
        ("Ugwu leaves", "3 cups, chopped"),
        ("Waterleaf", "3 cups, chopped"),
        ("Red palm oil", "1/2 cup"),
        ("Dried crayfish", "2 tbsp, ground"),
        ("Beef", "300 g"),
        ("Stockfish", "1 piece"),
    ],
    "Ogbono Soup": [
        ("Ogbono seeds", "1 cup, ground"),
        ("Red palm oil", "1/3 cup"),
        ("Dried crayfish", "2 tbsp"),
        ("Stockfish", "1 piece"),
        ("Ugwu leaves", "1 cup, optional"),
    ],
    "Moi Moi": [
        ("Black-eyed peas", "2 cups, peeled and blended"),
        ("Red palm oil", "1/4 cup"),
        ("Scotch bonnet pepper", "1, blended"),
        ("Onion", "1 medium"),
        ("Eggs", "3, hard-boiled (optional)"),
        ("Bouillon cubes (Maggi)", "1 cube"),
    ],
    "Akara": [
        ("Black-eyed peas", "2 cups, peeled and blended"),
        ("Scotch bonnet pepper", "1"),
        ("Onion", "1 small, grated"),
        ("Vegetable oil", "for deep frying"),
        ("Salt", "to taste"),
    ],
    "Pepper Soup": [
        ("Uda seeds", "3, cracked"),
        ("Calabash nutmeg (Ehuru)", "2, cracked"),
        ("Scotch bonnet pepper", "2"),
        ("Goat meat", "500 g, optional alternative"),
        ("Fish (tilapia)", "1 whole, alternative"),
        ("Bouillon cubes (Maggi)", "2 cubes"),
    ],
    "Efo Riro": [
        ("Ugwu leaves", "3 cups, chopped"),
        ("Spinach", "2 cups, alternative"),
        ("Red palm oil", "1/3 cup"),
        ("Locust beans (Iru)", "1 tbsp"),
        ("Scotch bonnet pepper", "2, blended"),
        ("Beef", "300 g"),
        ("Onion", "1 medium"),
    ],
    "Amala and Ewedu": [
        ("Plantain flour (Elubo)", "2 cups"),
        ("Ewedu leaves", "2 cups, blended"),
        ("Locust beans (Iru)", "1 tbsp"),
        ("Water", "4 cups"),
        ("Bouillon cubes (Maggi)", "1 cube"),
    ],
    "Waakye": [
        ("Long grain rice", "2 cups"),
        ("Black-eyed peas", "1 cup, soaked"),
        ("Shito", "2 tbsp, to serve"),
        ("Onion", "1 medium"),
        ("Salt", "to taste"),
    ],
    "Kelewele": [
        ("Plantains", "3 ripe, cubed"),
        ("Ginger", "1 tbsp, grated"),
        ("Scotch bonnet pepper", "1, minced"),
        ("Vegetable oil", "for frying"),
        ("Salt", "pinch"),
    ],
    "Banku and Tilapia": [
        ("Gari (cassava flour)", "1 cup"),
        ("Cornmeal (maize meal)", "1 cup, fermented"),
        ("Fish (tilapia)", "2 whole, grilled"),
        ("Scotch bonnet pepper", "2, blended for shito"),
        ("Onion", "1 medium"),
    ],
    "Fufu and Light Soup": [
        ("Gari (cassava flour)", "2 cups"),
        ("Tomato (fresh)", "4 medium"),
        ("Scotch bonnet pepper", "1"),
        ("Ginger", "1 tbsp"),
        ("Chicken", "500 g, cut up"),
        ("Onion", "1 medium"),
    ],
    "Okra Soup": [
        ("Okra (fresh)", "300 g, chopped"),
        ("Red palm oil", "1/3 cup"),
        ("Dried crayfish", "2 tbsp"),
        ("Stockfish", "1 piece"),
        ("Scotch bonnet pepper", "1"),
    ],
    "Groundnut Soup": [
        ("Groundnut paste (peanut butter)", "1 cup"),
        ("Chicken", "500 g"),
        ("Scotch bonnet pepper", "1"),
        ("Ginger", "1 tbsp"),
        ("Onion", "1 medium"),
        ("Tomato paste", "2 tbsp"),
    ],
    "Thieboudienne": [
        ("Jollof rice parboiled rice", "3 cups"),
        ("Fish (tilapia)", "2 whole, stuffed"),
        ("Tomato paste", "3 tbsp"),
        ("Scotch bonnet pepper", "1"),
        ("Onion", "2 medium"),
        ("Parsley", "1/2 cup"),
    ],
    "Yassa Poulet": [
        ("Chicken", "1 whole, cut up"),
        ("Onion", "6 large, sliced"),
        ("Preserved lemons", "2, alternative fresh lemons"),
        ("Lemons", "3, juiced"),
        ("Scotch bonnet pepper", "1"),
        ("Dijon mustard", "2 tbsp, optional"),
        ("Vegetable oil", "1/3 cup"),
    ],
    "Mafe": [
        ("Groundnut paste (peanut butter)", "1 cup"),
        ("Tomato paste", "3 tbsp"),
        ("Beef", "500 g, cubed"),
        ("Scotch bonnet pepper", "1"),
        ("Onion", "1 medium"),
        ("Cassava", "300 g, cubed"),
    ],
    "Attieke": [
        ("Cassava", "500 g, fermented and granulated"),
        ("Vegetable oil", "2 tbsp"),
        ("Salt", "to taste"),
        ("Onion", "1 small (garnish)"),
    ],
    "Kedjenou": [
        ("Chicken", "1 whole, cut up"),
        ("Tomato paste", "2 tbsp"),
        ("Ginger", "1 tbsp"),
        ("Scotch bonnet pepper", "1"),
        ("Onion", "1 large"),
        ("Bay leaves", "2"),
    ],
    "Riz Gras": [
        ("Long grain rice", "3 cups"),
        ("Tomato paste", "3 tbsp"),
        ("Beef", "500 g"),
        ("Onion", "2 medium"),
        ("Vegetable oil", "1/3 cup"),
        ("Bouillon cubes (Maggi)", "2 cubes"),
    ],
    "Chin Chin": [
        ("Wheat flour", "3 cups"),
        ("Sugar", "1/2 cup"),
        ("Butter", "1/4 cup"),
        ("Milk", "1/2 cup"),
        ("Eggs", "1"),
        ("Vegetable oil", "for deep frying"),
    ],
    "Plantain Chips": [
        ("Plantains", "3 green"),
        ("Vegetable oil", "for frying"),
        ("Salt", "to taste"),
    ],

    # ── East African ──────────────────────────────────────────────────────
    "Injera": [
        ("Teff flour", "4 cups"),
        ("Water", "5 cups"),
        ("Yeast", "1/2 tsp"),
        ("Salt", "pinch"),
    ],
    "Doro Wat": [
        ("Chicken", "1 whole, cut up"),
        ("Berbere spice", "3 tbsp"),
        ("Niter kibbeh", "1/2 cup"),
        ("Onion", "4 large, finely diced"),
        ("Eggs", "4, hard-boiled"),
        ("Garlic", "4 cloves"),
        ("Ginger", "1 tbsp"),
    ],
    "Injera with Doro Wat": [
        ("Injera (fresh)", "4 rounds"),
        ("Teff flour", "4 cups, to make injera"),
        ("Berbere spice", "3 tbsp"),
        ("Niter kibbeh", "1/2 cup"),
        ("Chicken", "1 whole, cut up"),
        ("Onion", "4 large"),
    ],
    "Injera with Tibs": [
        ("Injera (fresh)", "4 rounds"),
        ("Beef", "500 g, cubed"),
        ("Berbere spice", "2 tbsp"),
        ("Niter kibbeh", "1/4 cup"),
        ("Onion", "2 large"),
        ("Garlic", "4 cloves"),
    ],
    "Injera with Kitfo": [
        ("Injera (fresh)", "4 rounds"),
        ("Beef", "500 g, minced lean"),
        ("Mitmita spice", "2 tbsp"),
        ("Niter kibbeh", "1/3 cup, warm"),
        ("Cardamom", "pinch, ground"),
    ],
    "Misir Wat": [
        ("Red lentils", "2 cups"),
        ("Berbere spice", "3 tbsp"),
        ("Niter kibbeh", "1/4 cup"),
        ("Onion", "2 large, finely diced"),
        ("Garlic", "3 cloves"),
        ("Tomato paste", "2 tbsp"),
    ],
    "Shiro": [
        ("Shiro powder", "1 cup"),
        ("Niter kibbeh", "1/4 cup"),
        ("Berbere spice", "2 tbsp"),
        ("Onion", "1 large"),
        ("Garlic", "3 cloves"),
        ("Water", "3 cups"),
    ],
    "Ugali": [
        ("Cornmeal (maize meal)", "2 cups"),
        ("Millet flour", "1 cup, blend option"),
        ("Water", "4 cups"),
        ("Salt", "pinch"),
    ],
    "Nyama Choma": [
        ("Goat meat", "1 kg, bone-in"),
        ("Garlic", "4 cloves, minced"),
        ("Thyme", "1 tbsp"),
        ("Salt", "1 tbsp"),
        ("Black pepper", "1 tsp"),
        ("Lemons", "2, juiced"),
    ],
    "Pilau": [
        ("Basmati rice", "3 cups"),
        ("Beef", "500 g, cubed"),
        ("Cumin", "1 tbsp"),
        ("Cardamom", "4 pods"),
        ("Cinnamon", "1 stick"),
        ("Onion", "2 large, caramelized"),
        ("Garlic", "4 cloves"),
    ],
    "Chapati": [
        ("Wheat flour", "3 cups"),
        ("Water", "1 cup, warm"),
        ("Vegetable oil", "3 tbsp"),
        ("Salt", "1 tsp"),
    ],
    "Mandazi": [
        ("Wheat flour", "3 cups"),
        ("Sugar", "1/3 cup"),
        ("Yeast", "1 tsp"),
        ("Milk", "1 cup, warm"),
        ("Cardamom", "1/2 tsp, ground"),
        ("Eggs", "1"),
        ("Vegetable oil", "for deep frying"),
    ],
    "Sukuma Wiki": [
        ("Spinach", "500 g (or collard greens), chopped"),
        ("Onion", "1 large"),
        ("Tomato (fresh)", "2 medium"),
        ("Garlic", "3 cloves"),
        ("Vegetable oil", "2 tbsp"),
    ],
    "Githeri": [
        ("Black-eyed peas", "1 cup, soaked"),
        ("Cornmeal (maize meal)", "1/2 cup, kernels or coarse"),
        ("Onion", "1 medium"),
        ("Tomato (fresh)", "2 medium"),
        ("Salt", "to taste"),
    ],
    "Matoke": [
        ("Plantains", "6 green"),
        ("Onion", "1 medium"),
        ("Tomato (fresh)", "2 medium"),
        ("Garlic", "2 cloves"),
        ("Vegetable oil", "2 tbsp"),
    ],
    "Luwombo": [
        ("Chicken", "1 whole, cut up (or beef)"),
        ("Red palm oil", "2 tbsp"),
        ("Groundnut paste (peanut butter)", "1/2 cup"),
        ("Onion", "1 medium"),
        ("Tomato (fresh)", "2 medium"),
        ("Banana leaves", "for steaming"),
    ],

    # ── North African ─────────────────────────────────────────────────────
    "Couscous": [
        ("Couscous", "3 cups, steamed"),
        ("Ras el Hanout", "1 tbsp"),
        ("Lamb", "500 g"),
        ("Chickpeas", "1 cup"),
        ("Onion", "1 large"),
        ("Olive oil", "1/4 cup"),
    ],
    "Lamb Tagine": [
        ("Lamb", "1 kg, cubed"),
        ("Ras el Hanout", "2 tbsp"),
        ("Preserved lemons", "2"),
        ("Olives", "1/2 cup"),
        ("Onion", "2 large"),
        ("Garlic", "4 cloves"),
        ("Olive oil", "1/4 cup"),
    ],
    "Chicken Tagine": [
        ("Chicken", "1 whole, cut up"),
        ("Ras el Hanout", "2 tbsp"),
        ("Preserved lemons", "2"),
        ("Olives", "1/2 cup"),
        ("Harissa", "1 tsp"),
        ("Onion", "2 large"),
        ("Olive oil", "1/4 cup"),
    ],
    "Harira": [
        ("Red lentils", "1 cup"),
        ("Chickpeas", "1 cup"),
        ("Tomato paste", "3 tbsp"),
        ("Ras el Hanout", "1 tbsp"),
        ("Onion", "1 large"),
        ("Coriander (cilantro)", "1/2 cup"),
        ("Parsley", "1/2 cup"),
    ],
    "Shakshuka": [
        ("Eggs", "6"),
        ("Tomato (fresh)", "6 medium"),
        ("Tomato paste", "2 tbsp"),
        ("Harissa", "1 tbsp"),
        ("Onion", "1 large"),
        ("Cumin", "1 tsp"),
        ("Paprika", "1 tsp"),
        ("Olive oil", "1/4 cup"),
    ],
    "Msemen": [
        ("Semolina (Semo)", "1 cup"),
        ("Wheat flour", "2 cups"),
        ("Butter", "1/4 cup, softened"),
        ("Water", "1 cup, warm"),
        ("Salt", "1 tsp"),
    ],
    "Brik": [
        ("Phyllo (warka) pastry", "4 sheets"),
        ("Tuna", "1 can"),
        ("Eggs", "4"),
        ("Harissa", "1 tsp"),
        ("Parsley", "1/4 cup"),
        ("Vegetable oil", "for frying"),
    ],
    "Mechoui": [
        ("Lamb", "1 whole shoulder or half sheep"),
        ("Ras el Hanout", "3 tbsp"),
        ("Butter", "1/2 cup, softened"),
        ("Garlic", "1 head"),
        ("Cumin", "1 tbsp"),
        ("Salt", "2 tbsp"),
    ],

    # ── Southern African ──────────────────────────────────────────────────
    "Bobotie": [
        ("Beef", "500 g, minced"),
        ("Curry powder (Nigerian)", "1 tbsp"),
        ("Tomato paste", "2 tbsp"),
        ("Eggs", "2"),
        ("Milk", "1 cup"),
        ("Onion", "1 large"),
        ("Bay leaves", "3"),
    ],
    "Bunny Chow": [
        ("Curry powder (Nigerian)", "2 tbsp"),
        ("Chicken", "500 g (or lamb/beef)"),
        ("Tomato (fresh)", "3 medium"),
        ("Onion", "2 large"),
        ("Garlic", "4 cloves"),
        ("Wheat flour", "bread loaf, hollowed"),
    ],
    "Chakalaka": [
        ("Tomato paste", "2 tbsp"),
        ("Scotch bonnet pepper", "1"),
        ("Curry powder (Nigerian)", "1 tbsp"),
        ("Onion", "1 large"),
        ("Green beans", "1 cup, chopped"),
        ("Tomato (fresh)", "2 medium"),
    ],
    "Pap and Wors": [
        ("Cornmeal (maize meal)", "2 cups"),
        ("Water", "4 cups"),
        ("Salt", "to taste"),
        ("Beef", "500 g, coarse-ground (for boerewors)"),
        ("Coriander (cilantro)", "1 tbsp, ground (for wors)"),
    ],
    "Biltong": [
        ("Beef", "1 kg, silverside"),
        ("Vinegar", "1/2 cup"),
        ("Salt", "3 tbsp, coarse"),
        ("Coriander (cilantro)", "2 tbsp, seed roasted and cracked"),
        ("Black pepper", "1 tbsp, coarse"),
    ],
    "Sadza": [
        ("Cornmeal (maize meal)", "3 cups"),
        ("Millet flour", "1 cup, traditional option"),
        ("Water", "4 cups"),
        ("Salt", "pinch, optional"),
    ],

    # ── Central African ───────────────────────────────────────────────────
    "Saka-Saka": [
        ("Cassava", "500 g leaves, pounded"),
        ("Red palm oil", "1/3 cup"),
        ("Dried shrimp", "2 tbsp"),
        ("Onion", "1 large"),
        ("Scotch bonnet pepper", "1"),
    ],
    "Poulet Moambe": [
        ("Chicken", "1 whole, cut up"),
        ("Palm nut concentrate (Banga)", "400 g"),
        ("Red palm oil", "2 tbsp"),
        ("Onion", "1 large"),
        ("Tomato (fresh)", "2 medium"),
        ("Garlic", "3 cloves"),
    ],
    "Chikwangue": [
        ("Cassava", "1 kg, fermented"),
        ("Gari (cassava flour)", "1 cup, binder"),
        ("Water", "3 cups"),
        ("Banana leaves", "for wrapping"),
    ],
    "Ndole": [
        ("Bitter leaf", "2 cups, washed and shredded"),
        ("Groundnut paste (peanut butter)", "1 cup, boiled with bitter leaf"),
        ("Dried shrimp", "2 tbsp, ground"),
        ("Beef", "500 g"),
        ("Onion", "1 large"),
        ("Garlic", "3 cloves"),
    ],

    # ── Afro-Caribbean ────────────────────────────────────────────────────
    "Jerk Chicken": [
        ("Chicken", "1 whole, cut up"),
        ("Scotch bonnet pepper", "2, minced"),
        ("Allspice", "1 tbsp, ground"),
        ("Thyme", "2 tbsp"),
        ("Ginger", "1 tbsp"),
        ("Garlic", "4 cloves"),
        ("Limes", "2, juiced"),
    ],
}


# ── Food → curated external recipe links ───────────────────────────────────
# We link to recipe content (YouTube / articles) rather than authoring steps;
# the defensible layer is ingredient sourcing, not the recipe text. Each value
# is a list of dicts: url, source_type ("youtube"|"article"), title, optional
# thumbnail_url, and is_primary (at most one True per food). URLs verified live
# on 2026-06-15. Seeded on every deploy via seed_vendors._upsert_catalog.
FOOD_RECIPE_LINKS: dict[str, list[dict]] = {
    "Jollof Rice": [
        {"url": "https://www.youtube.com/watch?v=CjbAltYAl2E", "source_type": "youtube", "title": "Cook Jollof Rice like a pro - Sweet Adjeley", "thumbnail_url": "https://i.ytimg.com/vi/CjbAltYAl2E/hqdefault.jpg", "is_primary": True},
        {"url": "https://cheflolaskitchen.com/jollof-rice/", "source_type": "article", "title": "Jollof Rice - Chef Lolas Kitchen", "thumbnail_url": None, "is_primary": False},
    ],
    "Egusi Soup": [
        {"url": "https://www.youtube.com/watch?v=lVjME9OyIfY", "source_type": "youtube", "title": "Nigerian Egusi Soup - Sweet Adjeley", "thumbnail_url": "https://i.ytimg.com/vi/lVjME9OyIfY/hqdefault.jpg", "is_primary": True},
    ],
    "Suya": [
        {"url": "https://www.youtube.com/watch?v=dIyuRABa9rw", "source_type": "youtube", "title": "Suya - The Kitchen Muse", "thumbnail_url": "https://i.ytimg.com/vi/dIyuRABa9rw/hqdefault.jpg", "is_primary": True},
    ],
    "Fufu": [
        {"url": "https://www.youtube.com/watch?v=zKvfVNjwufc", "source_type": "youtube", "title": "Cassava Fufu, step by step - Queenvarieties", "thumbnail_url": "https://i.ytimg.com/vi/zKvfVNjwufc/hqdefault.jpg", "is_primary": True},
    ],
    "Pounded Yam": [
        {"url": "https://www.youtube.com/watch?v=RwAis5ZxHUY", "source_type": "youtube", "title": "Pounded Yam without pounding - Daniel Ochuko", "thumbnail_url": "https://i.ytimg.com/vi/RwAis5ZxHUY/hqdefault.jpg", "is_primary": True},
    ],
    "Banga Soup": [
        {"url": "https://www.youtube.com/watch?v=dFBSH1FYFUM", "source_type": "youtube", "title": "Rich Banga Soup (Ofe Akwu) - Cooking With Ijey", "thumbnail_url": "https://i.ytimg.com/vi/dFBSH1FYFUM/hqdefault.jpg", "is_primary": True},
    ],
    "Afang Soup": [
        {"url": "https://www.youtube.com/watch?v=wiZyjeTh8cQ", "source_type": "youtube", "title": "Afang Soup - Sisi Jemimah", "thumbnail_url": "https://i.ytimg.com/vi/wiZyjeTh8cQ/hqdefault.jpg", "is_primary": True},
    ],
    "Edikang Ikong": [
        {"url": "https://www.youtube.com/watch?v=i80-r_xV0tY", "source_type": "youtube", "title": "Edikang Ikong, Calabar style - Ifys Kitchen", "thumbnail_url": "https://i.ytimg.com/vi/i80-r_xV0tY/hqdefault.jpg", "is_primary": True},
    ],
    "Ogbono Soup": [
        {"url": "https://www.youtube.com/watch?v=kahuJ68GaTk", "source_type": "youtube", "title": "Ogbono Soup - Ifys Kitchen", "thumbnail_url": "https://i.ytimg.com/vi/kahuJ68GaTk/hqdefault.jpg", "is_primary": True},
    ],
    "Moi Moi": [
        {"url": "https://www.youtube.com/watch?v=9a4Cbw9VqvE", "source_type": "youtube", "title": "Moi Moi steamed bean pudding - Jiddahs Kitchen", "thumbnail_url": "https://i.ytimg.com/vi/9a4Cbw9VqvE/hqdefault.jpg", "is_primary": True},
    ],
    "Akara": [
        {"url": "https://www.youtube.com/watch?v=K-XXBHMyb04", "source_type": "youtube", "title": "Akara (Nigerian bean cakes) - Airhes Corner", "thumbnail_url": "https://i.ytimg.com/vi/K-XXBHMyb04/hqdefault.jpg", "is_primary": True},
    ],
    "Pepper Soup": [
        {"url": "https://www.youtube.com/watch?v=_EPtwLsFpoY", "source_type": "youtube", "title": "Assorted meat pepper soup - Ijeoma999 Kitchen", "thumbnail_url": "https://i.ytimg.com/vi/_EPtwLsFpoY/hqdefault.jpg", "is_primary": True},
    ],
    "Efo Riro": [
        {"url": "https://www.youtube.com/watch?v=lxCY5fObe30", "source_type": "youtube", "title": "Efo Riro spinach stew - Sisi Jemimah", "thumbnail_url": "https://i.ytimg.com/vi/lxCY5fObe30/hqdefault.jpg", "is_primary": True},
    ],
    "Amala and Ewedu": [
        {"url": "https://www.youtube.com/watch?v=PMSSLgjtC6A", "source_type": "youtube", "title": "Amala, Ewedu & Gbegiri (Abula) - Chinenye Uchenna", "thumbnail_url": "https://i.ytimg.com/vi/PMSSLgjtC6A/hqdefault.jpg", "is_primary": True},
    ],
    "Waakye": [
        {"url": "https://www.youtube.com/watch?v=cpQ7f8z44io", "source_type": "youtube", "title": "Waakye (Ghana rice & beans) - Cooking with Efya", "thumbnail_url": "https://i.ytimg.com/vi/cpQ7f8z44io/hqdefault.jpg", "is_primary": True},
    ],
    "Kelewele": [
        {"url": "https://www.youtube.com/watch?v=mTRQXj7oSVs", "source_type": "youtube", "title": "Kelewele spicy fried plantain - Sasu Flavas", "thumbnail_url": "https://i.ytimg.com/vi/mTRQXj7oSVs/hqdefault.jpg", "is_primary": True},
    ],
    "Banku and Tilapia": [
        {"url": "https://www.youtube.com/watch?v=jE4LyTrumKQ", "source_type": "youtube", "title": "Banku & grilled Tilapia - Tasty n Fresh", "thumbnail_url": "https://i.ytimg.com/vi/jE4LyTrumKQ/hqdefault.jpg", "is_primary": True},
    ],
    "Fufu and Light Soup": [
        {"url": "https://www.youtube.com/watch?v=_QJ3PGjHw9c", "source_type": "youtube", "title": "Fufu & Light Soup - Cooking with Efya", "thumbnail_url": "https://i.ytimg.com/vi/_QJ3PGjHw9c/hqdefault.jpg", "is_primary": True},
    ],
    "Okra Soup": [
        {"url": "https://www.youtube.com/watch?v=eUWOmvyhU6Q", "source_type": "youtube", "title": "Okra Soup - Sisi Jemimah", "thumbnail_url": "https://i.ytimg.com/vi/eUWOmvyhU6Q/hqdefault.jpg", "is_primary": True},
    ],
    "Groundnut Soup": [
        {"url": "https://www.youtube.com/watch?v=TyUy3-APD5Q", "source_type": "youtube", "title": "Ghanaian Groundnut (Peanut) Soup - Sweet Adjeley", "thumbnail_url": "https://i.ytimg.com/vi/TyUy3-APD5Q/hqdefault.jpg", "is_primary": True},
    ],
    "Thieboudienne": [
        {"url": "https://www.youtube.com/watch?v=r7Zdp2TpmAA", "source_type": "youtube", "title": "Authentic Senegalese Thieboudienne - Cooking With Claudy", "thumbnail_url": "https://i.ytimg.com/vi/r7Zdp2TpmAA/hqdefault.jpg", "is_primary": True},
    ],
    "Yassa Poulet": [
        {"url": "https://www.youtube.com/watch?v=JkBLnng7at4", "source_type": "youtube", "title": "Poulet Yassa, Senegalese chicken - Receiteira", "thumbnail_url": "https://i.ytimg.com/vi/JkBLnng7at4/hqdefault.jpg", "is_primary": True},
    ],
    "Mafe": [
        {"url": "https://www.youtube.com/watch?v=UOorPVtWPQ8", "source_type": "youtube", "title": "Senegalese Mafe peanut stew - Hanne Cuisine", "thumbnail_url": "https://i.ytimg.com/vi/UOorPVtWPQ8/hqdefault.jpg", "is_primary": True},
    ],
    "Attieke": [
        {"url": "https://www.youtube.com/watch?v=tnuCssHAwwg", "source_type": "youtube", "title": "Attieke cassava couscous - Cooking with Sindaco", "thumbnail_url": "https://i.ytimg.com/vi/tnuCssHAwwg/hqdefault.jpg", "is_primary": True},
    ],
    "Kedjenou": [
        {"url": "https://www.youtube.com/watch?v=Bj5vjc7IIPs", "source_type": "youtube", "title": "Kedjenou de Poulet - Omo Alluah", "thumbnail_url": "https://i.ytimg.com/vi/Bj5vjc7IIPs/hqdefault.jpg", "is_primary": True},
    ],
    "Riz Gras": [
        {"url": "https://www.youtube.com/watch?v=WqzemaPzoCo", "source_type": "youtube", "title": "Riz Gras with lamb - Kadirecipes", "thumbnail_url": "https://i.ytimg.com/vi/WqzemaPzoCo/hqdefault.jpg", "is_primary": True},
    ],
    "Chin Chin": [
        {"url": "https://www.youtube.com/watch?v=1SZ5RKFm5Sk", "source_type": "youtube", "title": "Crunchy Chin Chin - Ifys Kitchen", "thumbnail_url": "https://i.ytimg.com/vi/1SZ5RKFm5Sk/hqdefault.jpg", "is_primary": True},
    ],
    "Plantain Chips": [
        {"url": "https://www.youtube.com/watch?v=m64arE90nyY", "source_type": "youtube", "title": "Homemade Plantain Chips - Chizoba Edemuzor", "thumbnail_url": "https://i.ytimg.com/vi/m64arE90nyY/hqdefault.jpg", "is_primary": True},
    ],
    "Injera": [
        {"url": "https://www.youtube.com/watch?v=DAq6NUuM6Qk", "source_type": "youtube", "title": "Injera, Ethiopian sour flatbread - Earthly Superfood", "thumbnail_url": "https://i.ytimg.com/vi/DAq6NUuM6Qk/hqdefault.jpg", "is_primary": True},
    ],
    "Doro Wat": [
        {"url": "https://www.youtube.com/watch?v=zi4AT6uYKUs", "source_type": "youtube", "title": "Doro Wat, spicy chicken stew - Munchies", "thumbnail_url": "https://i.ytimg.com/vi/zi4AT6uYKUs/hqdefault.jpg", "is_primary": True},
    ],
    "Injera with Doro Wat": [
        {"url": "https://www.youtube.com/watch?v=d3s3NavOvZU", "source_type": "youtube", "title": "Doro Wat, Ethiopian chicken stew - How To Cook Great", "thumbnail_url": "https://i.ytimg.com/vi/d3s3NavOvZU/hqdefault.jpg", "is_primary": True},
    ],
    "Injera with Tibs": [
        {"url": "https://www.youtube.com/watch?v=IChsogXzT5s", "source_type": "youtube", "title": "Ethiopian Beef Tibs - How To Cook Great", "thumbnail_url": "https://i.ytimg.com/vi/IChsogXzT5s/hqdefault.jpg", "is_primary": True},
    ],
    "Injera with Kitfo": [
        {"url": "https://www.youtube.com/watch?v=jpwrHDBwvp8", "source_type": "youtube", "title": "Ethiopian Kitfo - Dagi Fasika", "thumbnail_url": "https://i.ytimg.com/vi/jpwrHDBwvp8/hqdefault.jpg", "is_primary": True},
    ],
    "Misir Wat": [
        {"url": "https://www.youtube.com/watch?v=YWck6d7ZjFY", "source_type": "youtube", "title": "Misir Wot red lentil stew - eatahfood", "thumbnail_url": "https://i.ytimg.com/vi/YWck6d7ZjFY/hqdefault.jpg", "is_primary": True},
    ],
    "Shiro": [
        {"url": "https://www.youtube.com/watch?v=7aQX-hIvnPM", "source_type": "youtube", "title": "Shiro chickpea stew - Asedos Kitchen", "thumbnail_url": "https://i.ytimg.com/vi/7aQX-hIvnPM/hqdefault.jpg", "is_primary": True},
    ],
    "Ugali": [
        {"url": "https://www.youtube.com/watch?v=rW2xnLyXV3w", "source_type": "youtube", "title": "Ugali - Chef Josh", "thumbnail_url": "https://i.ytimg.com/vi/rW2xnLyXV3w/hqdefault.jpg", "is_primary": True},
    ],
    "Nyama Choma": [
        {"url": "https://www.youtube.com/watch?v=P5eGWFCjReA", "source_type": "youtube", "title": "Nyama Choma, Kenyan BBQ goat - Easy n Delicious", "thumbnail_url": "https://i.ytimg.com/vi/P5eGWFCjReA/hqdefault.jpg", "is_primary": True},
    ],
    "Pilau": [
        {"url": "https://www.youtube.com/watch?v=c2R79_0r-do", "source_type": "youtube", "title": "Kenyan Pilau, step by step - Annas Kitchen KE", "thumbnail_url": "https://i.ytimg.com/vi/c2R79_0r-do/hqdefault.jpg", "is_primary": True},
    ],
    "Chapati": [
        {"url": "https://www.youtube.com/watch?v=UvgVw732ASg", "source_type": "youtube", "title": "Soft layered Kenyan Chapati - Asedos Kitchen", "thumbnail_url": "https://i.ytimg.com/vi/UvgVw732ASg/hqdefault.jpg", "is_primary": True},
    ],
    "Mandazi": [
        {"url": "https://www.youtube.com/watch?v=OSyT7S6fB4A", "source_type": "youtube", "title": "Mandazi (Mahamri) - Chef Lolas Kitchen", "thumbnail_url": "https://i.ytimg.com/vi/OSyT7S6fB4A/hqdefault.jpg", "is_primary": True},
    ],
    "Sukuma Wiki": [
        {"url": "https://www.youtube.com/watch?v=MTNo4H6fPuw", "source_type": "youtube", "title": "Sukuma Wiki collard greens - Infoods", "thumbnail_url": "https://i.ytimg.com/vi/MTNo4H6fPuw/hqdefault.jpg", "is_primary": True},
    ],
    "Githeri": [
        {"url": "https://www.youtube.com/watch?v=asMXjd5ePys", "source_type": "youtube", "title": "Kenyan Githeri (maize & beans) - Jikoni", "thumbnail_url": "https://i.ytimg.com/vi/asMXjd5ePys/hqdefault.jpg", "is_primary": True},
    ],
    "Matoke": [
        {"url": "https://www.youtube.com/watch?v=sBpXlLxmq_8", "source_type": "youtube", "title": "Matoke, plantains with beans - Easy n Delicious", "thumbnail_url": "https://i.ytimg.com/vi/sBpXlLxmq_8/hqdefault.jpg", "is_primary": True},
    ],
    "Luwombo": [
        {"url": "https://www.youtube.com/watch?v=ni5icnmCZFg", "source_type": "youtube", "title": "Chicken Luwombo in banana leaves - The Cooking Nurse", "thumbnail_url": "https://i.ytimg.com/vi/ni5icnmCZFg/hqdefault.jpg", "is_primary": True},
    ],
    "Couscous": [
        {"url": "https://www.youtube.com/watch?v=GfNRbVquluA", "source_type": "youtube", "title": "Couscous with seven vegetables - CookingWithAlia", "thumbnail_url": "https://i.ytimg.com/vi/GfNRbVquluA/hqdefault.jpg", "is_primary": True},
    ],
    "Lamb Tagine": [
        {"url": "https://www.youtube.com/watch?v=v9C6gtpNiFY", "source_type": "youtube", "title": "Traditional Moroccan Lamb Tagine - Chef Kevin Ashton", "thumbnail_url": "https://i.ytimg.com/vi/v9C6gtpNiFY/hqdefault.jpg", "is_primary": True},
    ],
    "Chicken Tagine": [
        {"url": "https://www.youtube.com/watch?v=TpsUQ7SbTXs", "source_type": "youtube", "title": "Chicken Tagine Mchermel - CookingWithAlia", "thumbnail_url": "https://i.ytimg.com/vi/TpsUQ7SbTXs/hqdefault.jpg", "is_primary": True},
    ],
    "Harira": [
        {"url": "https://www.youtube.com/watch?v=l5YO90dI5Jc", "source_type": "youtube", "title": "Moroccan Harira soup - Dimitras Dishes", "thumbnail_url": "https://i.ytimg.com/vi/l5YO90dI5Jc/hqdefault.jpg", "is_primary": True},
    ],
    "Shakshuka": [
        {"url": "https://www.youtube.com/watch?v=aqnk723WSp4", "source_type": "youtube", "title": "Authentic Tunisian Shakshuka - Cook around the World", "thumbnail_url": "https://i.ytimg.com/vi/aqnk723WSp4/hqdefault.jpg", "is_primary": True},
    ],
    "Msemen": [
        {"url": "https://www.youtube.com/watch?v=t50V0P76IwE", "source_type": "youtube", "title": "Msemen Moroccan pancake - CookingWithAlia", "thumbnail_url": "https://i.ytimg.com/vi/t50V0P76IwE/hqdefault.jpg", "is_primary": True},
    ],
    "Brik": [
        {"url": "https://www.youtube.com/watch?v=OV9EgaE80O8", "source_type": "youtube", "title": "Tunisian Brik pastry - Tunisian Cuisine in English", "thumbnail_url": "https://i.ytimg.com/vi/OV9EgaE80O8/hqdefault.jpg", "is_primary": True},
    ],
    "Mechoui": [
        {"url": "https://www.youtube.com/watch?v=PC4__Tw66sc", "source_type": "youtube", "title": "Lamb Mechoui - Hanne Cuisine", "thumbnail_url": "https://i.ytimg.com/vi/PC4__Tw66sc/hqdefault.jpg", "is_primary": True},
    ],
    "Bobotie": [
        {"url": "https://www.youtube.com/watch?v=nEMLgtRnwsg", "source_type": "youtube", "title": "South African Bobotie - The Cooking Foodie", "thumbnail_url": "https://i.ytimg.com/vi/nEMLgtRnwsg/hqdefault.jpg", "is_primary": True},
    ],
    "Bunny Chow": [
        {"url": "https://www.youtube.com/watch?v=Bjrh8BmI22k", "source_type": "youtube", "title": "South African Bunny Chow - Infoods", "thumbnail_url": "https://i.ytimg.com/vi/Bjrh8BmI22k/hqdefault.jpg", "is_primary": True},
    ],
    "Chakalaka": [
        {"url": "https://www.youtube.com/watch?v=U4driexsnt4", "source_type": "youtube", "title": "South African Chakalaka relish - Wolkberg Artisans", "thumbnail_url": "https://i.ytimg.com/vi/U4driexsnt4/hqdefault.jpg", "is_primary": True},
    ],
    "Pap and Wors": [
        {"url": "https://www.youtube.com/watch?v=TFMI69JfEyk", "source_type": "youtube", "title": "Pap en Wors - The Frozen Fig", "thumbnail_url": "https://i.ytimg.com/vi/TFMI69JfEyk/hqdefault.jpg", "is_primary": True},
    ],
    "Biltong": [
        {"url": "https://www.youtube.com/watch?v=_JBA8p4QG7k", "source_type": "youtube", "title": "South African Biltong - Wolkberg Artisans", "thumbnail_url": "https://i.ytimg.com/vi/_JBA8p4QG7k/hqdefault.jpg", "is_primary": True},
    ],
    "Sadza": [
        {"url": "https://www.youtube.com/watch?v=GpmM7cVyvq8", "source_type": "youtube", "title": "Sadza ne Nyama - Daily Dime Dinners", "thumbnail_url": "https://i.ytimg.com/vi/GpmM7cVyvq8/hqdefault.jpg", "is_primary": True},
    ],
    "Saka-Saka": [
        {"url": "https://www.youtube.com/watch?v=CJSs3Op2iu0", "source_type": "youtube", "title": "Pondu / Saka-Saka cassava leaves - Cook with Nahima", "thumbnail_url": "https://i.ytimg.com/vi/CJSs3Op2iu0/hqdefault.jpg", "is_primary": True},
    ],
    "Poulet Moambe": [
        {"url": "https://www.youtube.com/watch?v=lf1C3-qXQfg", "source_type": "youtube", "title": "Poulet Moambe - EatThisNY", "thumbnail_url": "https://i.ytimg.com/vi/lf1C3-qXQfg/hqdefault.jpg", "is_primary": True},
    ],
    "Chikwangue": [
        {"url": "https://www.youtube.com/watch?v=6aYU6QS3G2E", "source_type": "youtube", "title": "Chikwangue (cassava) at home - Muyakas Kitchen", "thumbnail_url": "https://i.ytimg.com/vi/6aYU6QS3G2E/hqdefault.jpg", "is_primary": True},
    ],
    "Ndole": [
        {"url": "https://www.youtube.com/watch?v=Lw1URtejchc", "source_type": "youtube", "title": "Authentic Cameroonian Ndole - Cooking with baby d", "thumbnail_url": "https://i.ytimg.com/vi/Lw1URtejchc/hqdefault.jpg", "is_primary": True},
    ],
    "Jerk Chicken": [
        {"url": "https://www.youtube.com/watch?v=TAkloIC_DPQ", "source_type": "youtube", "title": "Authentic Jamaican Jerk Chicken - Racquels Caribbean Cuisine", "thumbnail_url": "https://i.ytimg.com/vi/TAkloIC_DPQ/hqdefault.jpg", "is_primary": True},
    ],
}


# ── Cuisine-keyed subsets (used when linking vendor_items) ─────────────────
_NIGERIAN = [
    "Jollof Rice", "Egusi Soup", "Suya", "Fufu", "Pounded Yam", "Banga Soup",
    "Afang Soup", "Edikang Ikong", "Ogbono Soup", "Moi Moi", "Akara",
    "Pepper Soup", "Efo Riro", "Amala and Ewedu", "Okra Soup",
    "Chin Chin", "Plantain Chips",
]
_GHANAIAN = ["Waakye", "Kelewele", "Banku and Tilapia", "Fufu and Light Soup", "Jollof Rice", "Groundnut Soup", "Plantain Chips"]
_SENEGALESE = ["Thieboudienne", "Yassa Poulet", "Mafe"]
_IVORIAN = ["Attieke", "Kedjenou", "Mafe"]
_ETHIOPIAN = ["Injera", "Doro Wat", "Injera with Doro Wat", "Injera with Tibs", "Injera with Kitfo", "Misir Wat", "Shiro"]
_ERITREAN = ["Injera", "Injera with Doro Wat", "Injera with Tibs", "Shiro"]
_KENYAN = ["Ugali", "Nyama Choma", "Pilau", "Chapati", "Mandazi", "Sukuma Wiki", "Githeri"]
_UGANDAN = ["Matoke", "Luwombo", "Chapati"]
_SOMALI = ["Pilau", "Chapati", "Mandazi"]
_MOROCCAN = ["Couscous", "Lamb Tagine", "Chicken Tagine", "Harira", "Msemen", "Mechoui"]
_TUNISIAN = ["Shakshuka", "Brik", "Couscous"]
_ALGERIAN = ["Couscous", "Harira", "Shakshuka"]
_SOUTH_AFRICAN = ["Bobotie", "Bunny Chow", "Chakalaka", "Pap and Wors", "Biltong", "Sadza"]
_CONGOLESE = ["Saka-Saka", "Poulet Moambe", "Chikwangue"]
_CAMEROONIAN = ["Okra Soup", "Egusi Soup", "Suya", "Banga Soup", "Ndole"]
_WEST_AFRICAN = list({*_NIGERIAN, *_GHANAIAN, *_SENEGALESE, *_IVORIAN})
_EAST_AFRICAN = list({*_ETHIOPIAN, *_ERITREAN, *_KENYAN, *_UGANDAN, *_SOMALI})
_ALL = [f["name"] for f in FOODS]

CUISINE_FOODS: dict[str, list[str]] = {
    "nigerian": _NIGERIAN,
    "ghanaian": _GHANAIAN,
    "senegalese": _SENEGALESE,
    "ivorian": _IVORIAN,
    "cameroonian": _CAMEROONIAN,
    "sierra_leonean": _WEST_AFRICAN,
    "liberian": _WEST_AFRICAN,
    "ethiopian": _ETHIOPIAN,
    "eritrean": _ERITREAN,
    "somali": _SOMALI,
    "sudanese": _EAST_AFRICAN,
    "kenyan": _KENYAN,
    "ugandan": _UGANDAN,
    "tanzanian": _KENYAN,
    "moroccan": _MOROCCAN,
    "tunisian": _TUNISIAN,
    "algerian": _ALGERIAN,
    "south_african": _SOUTH_AFRICAN,
    "zimbabwean": _SOUTH_AFRICAN,
    "congolese": _CONGOLESE,
    "west_african": _WEST_AFRICAN,
    "east_african": _EAST_AFRICAN,
    "african": _ALL,
}

# ── Country-level cuisines (for the "Cook it yourself" cuisine filter) ──────
# Display names for the country-level cuisine keys above. The aggregate keys
# (``west_african``/``east_african``/``african``) and the pure region-aliases
# (e.g. ``sierra_leonean`` reuses the whole West-African set) are intentionally
# excluded so cuisine pills map to distinct dish sets and don't over-tag.
_CUISINE_DISPLAY: dict[str, str] = {
    "nigerian": "Nigerian",
    "ghanaian": "Ghanaian",
    "senegalese": "Senegalese",
    "ivorian": "Ivorian",
    "cameroonian": "Cameroonian",
    "ethiopian": "Ethiopian",
    "eritrean": "Eritrean",
    "somali": "Somali",
    "kenyan": "Kenyan",
    "ugandan": "Ugandan",
    "moroccan": "Moroccan",
    "tunisian": "Tunisian",
    "algerian": "Algerian",
    "south_african": "South African",
    "congolese": "Congolese",
}

# Ordered, de-duplicated list of cuisine display names for filter UIs.
CUISINES: list[str] = list(_CUISINE_DISPLAY.values())

# Food name -> sorted list of cuisine display names, derived by inverting
# CUISINE_FOODS over the curated whitelist (reuses existing data, no duplication).
FOOD_CUISINES: dict[str, list[str]] = {}
for _key, _display in _CUISINE_DISPLAY.items():
    for _food_name in CUISINE_FOODS.get(_key, []):
        FOOD_CUISINES.setdefault(_food_name, [])
        if _display not in FOOD_CUISINES[_food_name]:
            FOOD_CUISINES[_food_name].append(_display)
for _food_name in FOOD_CUISINES:
    FOOD_CUISINES[_food_name].sort()


# For grocery vendors we mostly just pick a general African pantry selection,
# but we sort it by cuisine so e.g. an Ethiopian grocery leans Ethiopian.
_PAN_AFRICAN_STAPLES = [
    "Long grain rice", "Gari (cassava flour)", "Plantains", "Yam",
    "Red palm oil", "Scotch bonnet pepper", "Tomato paste",
    "Bouillon cubes (Maggi)", "Curry powder (Nigerian)", "Thyme",
    "Ginger", "Garlic", "Dried crayfish",
]
_NIGERIAN_INGS = _PAN_AFRICAN_STAPLES + [
    "Egusi seeds", "Ogbono seeds", "Locust beans (Iru)", "Ugwu leaves",
    "Ewedu leaves", "Stockfish", "Suya spice (Yaji)", "Pounded yam flour (Elubo isu)",
    "Plantain flour (Elubo)", "Ponmo (cow skin)", "Uda seeds",
    "Calabash nutmeg (Ehuru)",
]
_GHANAIAN_INGS = _PAN_AFRICAN_STAPLES + ["Shito", "Gari (cassava flour)", "Groundnut paste (peanut butter)"]
_ETHIOPIAN_INGS = _PAN_AFRICAN_STAPLES + [
    "Teff flour", "Berbere spice", "Mitmita spice", "Niter kibbeh",
    "Shiro powder", "Injera (fresh)",
]
_SOMALI_INGS = _PAN_AFRICAN_STAPLES + ["Basmati rice", "Dates", "Sumac"]
_KENYAN_INGS = _PAN_AFRICAN_STAPLES + ["Millet flour", "Sorghum flour", "Ugwu leaves"]
_MOROCCAN_INGS = _PAN_AFRICAN_STAPLES + [
    "Couscous", "Ras el Hanout", "Harissa", "Preserved lemons",
    "Merguez sausage", "Semolina (Semo)", "Argan oil", "Sumac", "Dried rose petals",
]
_SENEGALESE_INGS = _PAN_AFRICAN_STAPLES + [
    "Jollof rice parboiled rice", "Bonga fish (smoked herring)",
    "Groundnut paste (peanut butter)",
]
_CONGOLESE_INGS = _PAN_AFRICAN_STAPLES + ["Palm nut concentrate (Banga)", "Cassava"]

CUISINE_INGREDIENTS: dict[str, list[str]] = {
    "nigerian": _NIGERIAN_INGS,
    "ghanaian": _GHANAIAN_INGS,
    "senegalese": _SENEGALESE_INGS,
    "ivorian": _SENEGALESE_INGS,
    "cameroonian": _NIGERIAN_INGS,
    "sierra_leonean": _PAN_AFRICAN_STAPLES,
    "liberian": _PAN_AFRICAN_STAPLES,
    "ethiopian": _ETHIOPIAN_INGS,
    "eritrean": _ETHIOPIAN_INGS,
    "somali": _SOMALI_INGS,
    "sudanese": _SOMALI_INGS,
    "kenyan": _KENYAN_INGS,
    "ugandan": _KENYAN_INGS,
    "tanzanian": _KENYAN_INGS,
    "moroccan": _MOROCCAN_INGS,
    "tunisian": _MOROCCAN_INGS,
    "algerian": _MOROCCAN_INGS,
    "south_african": _PAN_AFRICAN_STAPLES,
    "zimbabwean": _PAN_AFRICAN_STAPLES,
    "congolese": _CONGOLESE_INGS,
    "west_african": list({*_NIGERIAN_INGS, *_GHANAIAN_INGS, *_SENEGALESE_INGS}),
    "east_african": list({*_ETHIOPIAN_INGS, *_KENYAN_INGS, *_SOMALI_INGS}),
    "african": INGREDIENTS,
}
