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
FOODS: list[dict] = [
    # West African
    {"name": "Jollof Rice", "region": "West African", "description": "Smoky one-pot tomato rice, a West African staple."},
    {"name": "Egusi Soup", "region": "West African", "description": "Melon-seed soup with leafy greens and protein."},
    {"name": "Suya", "region": "West African", "description": "Spicy grilled beef skewers coated in yaji spice."},
    {"name": "Fufu", "region": "West African", "description": "Soft pounded dough eaten with soup."},
    {"name": "Pounded Yam", "region": "West African", "description": "Smooth yam swallow paired with Nigerian soups."},
    {"name": "Banga Soup", "region": "West African", "description": "Palm-nut soup from the Niger Delta."},
    {"name": "Afang Soup", "region": "West African", "description": "Efik soup of afang leaves and waterleaf."},
    {"name": "Edikang Ikong", "region": "West African", "description": "Vegetable soup with ugu and waterleaf."},
    {"name": "Ogbono Soup", "region": "West African", "description": "Draw soup from ground ogbono seeds."},
    {"name": "Moi Moi", "region": "West African", "description": "Steamed bean pudding."},
    {"name": "Akara", "region": "West African", "description": "Fried bean cakes."},
    {"name": "Pepper Soup", "region": "West African", "description": "Peppery broth with fish, goat, or chicken."},
    {"name": "Efo Riro", "region": "West African", "description": "Yoruba spinach stew."},
    {"name": "Amala and Ewedu", "region": "West African", "description": "Yam-flour swallow with jute-leaf soup."},
    {"name": "Waakye", "region": "West African", "description": "Ghanaian rice and beans with shito."},
    {"name": "Kelewele", "region": "West African", "description": "Spiced fried plantains."},
    {"name": "Banku and Tilapia", "region": "West African", "description": "Fermented corn-cassava dough with grilled tilapia."},
    {"name": "Fufu and Light Soup", "region": "West African", "description": "Cassava fufu in a tomato-ginger broth."},
    {"name": "Okra Soup", "region": "West African", "description": "Okra-based draw soup."},
    {"name": "Groundnut Soup", "region": "West African", "description": "Peanut-based stew (Nkatenkwan)."},
    {"name": "Thieboudienne", "region": "West African", "description": "Senegalese jollof-style fish and rice."},
    {"name": "Yassa Poulet", "region": "West African", "description": "Senegalese lemon-onion chicken."},
    {"name": "Mafe", "region": "West African", "description": "Peanut stew popular across West Africa."},
    {"name": "Attieke", "region": "West African", "description": "Ivorian cassava couscous."},
    {"name": "Kedjenou", "region": "West African", "description": "Slow-cooked Ivorian chicken stew."},
    {"name": "Riz Gras", "region": "West African", "description": "Burkinabé festive rice."},
    {"name": "Chin Chin", "region": "West African", "description": "Crunchy sweet fried dough snack."},
    {"name": "Plantain Chips", "region": "West African", "description": "Crisp fried slices of green plantain."},

    # East African
    {"name": "Injera", "region": "East African", "description": "Spongy teff sourdough flatbread, the base of Ethiopian and Eritrean meals."},
    {"name": "Doro Wat", "region": "East African", "description": "Deeply spiced Ethiopian chicken stew with berbere and niter kibbeh."},
    {"name": "Injera with Doro Wat", "region": "East African", "description": "Sourdough flatbread with spiced chicken stew."},
    {"name": "Injera with Tibs", "region": "East African", "description": "Sauteed beef or lamb served over injera."},
    {"name": "Injera with Kitfo", "region": "East African", "description": "Minced raw beef with mitmita and niter kibbeh."},
    {"name": "Misir Wat", "region": "East African", "description": "Spiced red lentil stew."},
    {"name": "Shiro", "region": "East African", "description": "Thick chickpea-flour stew."},
    {"name": "Ugali", "region": "East African", "description": "Stiff maize porridge."},
    {"name": "Nyama Choma", "region": "East African", "description": "Kenyan grilled goat or beef."},
    {"name": "Pilau", "region": "East African", "description": "Swahili spiced rice."},
    {"name": "Chapati", "region": "East African", "description": "East African layered flatbread."},
    {"name": "Mandazi", "region": "East African", "description": "Cardamom-scented fried bread."},
    {"name": "Sukuma Wiki", "region": "East African", "description": "Sauteed collard greens."},
    {"name": "Githeri", "region": "East African", "description": "Kenyan corn-and-bean stew."},
    {"name": "Matoke", "region": "East African", "description": "Ugandan stewed plantains."},
    {"name": "Luwombo", "region": "East African", "description": "Ganda stew steamed in banana leaves."},

    # North African
    {"name": "Couscous", "region": "North African", "description": "Steamed semolina with vegetables and meat."},
    {"name": "Lamb Tagine", "region": "North African", "description": "Slow-cooked lamb with preserved lemon and olives."},
    {"name": "Chicken Tagine", "region": "North African", "description": "Chicken stewed in a conical clay pot."},
    {"name": "Harira", "region": "North African", "description": "Moroccan tomato-lentil soup."},
    {"name": "Shakshuka", "region": "North African", "description": "Eggs poached in spiced tomato sauce."},
    {"name": "Msemen", "region": "North African", "description": "Layered square pancakes."},
    {"name": "Brik", "region": "North African", "description": "Tunisian fried pastry with egg."},
    {"name": "Mechoui", "region": "North African", "description": "Slow-roasted whole lamb."},

    # Southern African
    {"name": "Bobotie", "region": "Southern African", "description": "Spiced minced meat baked with an egg topping."},
    {"name": "Bunny Chow", "region": "Southern African", "description": "Hollowed bread loaf filled with curry."},
    {"name": "Chakalaka", "region": "Southern African", "description": "Spicy vegetable relish."},
    {"name": "Pap and Wors", "region": "Southern African", "description": "Maize porridge with boerewors sausage."},
    {"name": "Biltong", "region": "Southern African", "description": "Air-dried cured beef."},
    {"name": "Sadza", "region": "Southern African", "description": "Zimbabwean stiff maize-meal porridge eaten with relishes."},

    # Central African
    {"name": "Saka-Saka", "region": "Central African", "description": "Pounded cassava leaves in palm oil."},
    {"name": "Poulet Moambe", "region": "Central African", "description": "Chicken in palm-nut sauce."},
    {"name": "Chikwangue", "region": "Central African", "description": "Fermented cassava dough."},
    {"name": "Ndole", "region": "Central African", "description": "Cameroonian bitter-leaf stew with groundnut and meat or shrimp."},

    # Afro-Caribbean
    {"name": "Jerk Chicken", "region": "Afro-Caribbean", "description": "Jamaican grilled chicken marinated in allspice and scotch bonnet."},
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
