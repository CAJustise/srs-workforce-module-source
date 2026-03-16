export const CUISINE_SUBCATEGORY_SEEDS = [
  {
    "id": "cat_food_appetizer",
    "name": "Appetizer",
    "parent_id": "cat_cuisine",
    "display_order": 1
  },
  {
    "id": "cat_food_soup_salad",
    "name": "Soup & Salad",
    "parent_id": "cat_cuisine",
    "display_order": 2
  },
  {
    "id": "cat_food_main",
    "name": "Main",
    "parent_id": "cat_cuisine",
    "display_order": 3
  },
  {
    "id": "cat_food_main_sea",
    "name": "Main - Sea",
    "parent_id": "cat_food_main",
    "display_order": 1
  },
  {
    "id": "cat_food_main_land",
    "name": "Main - Land",
    "parent_id": "cat_food_main",
    "display_order": 2
  },
  {
    "id": "cat_food_sides",
    "name": "Sides",
    "parent_id": "cat_cuisine",
    "display_order": 4
  },
  {
    "id": "cat_food_shareable",
    "name": "Shareable",
    "parent_id": "cat_cuisine",
    "display_order": 5
  },
  {
    "id": "cat_food_raw_bar",
    "name": "Raw Bar",
    "parent_id": "cat_cuisine",
    "display_order": 6
  },
  {
    "id": "cat_food_bowls_rolls",
    "name": "Bowls / Rolls",
    "parent_id": "cat_cuisine",
    "display_order": 7
  },
  {
    "id": "cat_food_small_plates",
    "name": "Small Plates",
    "parent_id": "cat_cuisine",
    "display_order": 8
  },
  {
    "id": "cat_food_dessert",
    "name": "Desserts",
    "parent_id": "cat_cuisine",
    "display_order": 9
  }
] as const;

export const CODA_FOOD_ITEM_SEEDS = [
  {
    "name": "Coconut Shrimp with Mango-Habanero Sauce",
    "category_id": "cat_food_small_plates",
    "price": 16,
    "description": "Succulent jumbo shrimp encrusted in a crispy coconut breading, golden-fried to perfection. Served with our signature mango-habanero sauce, offering a harmonious blend of tropical sweetness and subtle heat. This dish captures the essence of island flavors, providing a delightful contrast of textures and tastes."
  },
  {
    "name": "Seared Ahi Tuna Tacos",
    "category_id": "cat_food_small_plates",
    "price": 18,
    "description": "Perfectly seared ahi in mini tortillas with mango salsa and avocado crema."
  },
  {
    "name": "Crab and Avocado Stack",
    "category_id": "cat_food_small_plates",
    "price": 20,
    "description": "Layers of succulent crabmeat and creamy avocado with a citrus drizzle."
  },
  {
    "name": "Grilled Octopus with Papaya Salad",
    "category_id": "cat_food_small_plates",
    "price": 22,
    "description": "Tender octopus char-grilled and served with a vibrant papaya salad."
  },
  {
    "name": "Grilled Mahi-Mahi Salad with Passion Fruit Vinaigrette (Sub Chicken, Pork Belly, Lamb or Tofu)",
    "category_id": "cat_food_small_plates",
    "price": 24,
    "description": "Flaky grilled mahi-mahi atop mixed greens with a tangy passion fruit vinaigrette."
  },
  {
    "name": "Island Cobb Salad with Blackened Shrimp (Sub Chicken, Pork Belly, Lamb or Tofu)",
    "category_id": "cat_food_small_plates",
    "price": 22,
    "description": "A tropical twist on the classic with blackened shrimp and island-inspired toppings."
  },
  {
    "name": "Sesame-Crusted Ahi Steak",
    "category_id": "cat_food_main",
    "price": 30,
    "description": "Sesame seed encrusted Ahi steak, seared to perfection, alongside wasabi mashed potatoes and sauteed baby bok choy, finished with a ginger- soy drizzle"
  },
  {
    "name": "Blackened Mahi-Mahi with Mango Salsa",
    "category_id": "cat_food_main",
    "price": 28,
    "description": "Boldly seasoned and blackened Mahi-Mahi, served with herbed quinoa and a bright mango-pineapple salsa"
  },
  {
    "name": "Herb-Butter Grilled Lobster Tail",
    "category_id": "cat_food_main",
    "price": 40,
    "description": null
  },
  {
    "name": "Garlic Butter Shrimp Skewers",
    "category_id": "cat_food_main",
    "price": 25,
    "description": "Grilled shrimp skewered and basted with garlic butter, accompanied by cream polenta and seasonal Vegetables"
  },
  {
    "name": "Whole Grilled Dungeness Crab",
    "category_id": "cat_food_main",
    "price": 40,
    "description": "Grilled Dungeness crab with a lime-butter glaze, accompanied by garlic spinach and herb-roasted potatoes"
  },
  {
    "name": "Grilled Chicken with Mango Glaze",
    "category_id": "cat_food_main",
    "price": 24,
    "description": "Chicken breast with a sweet mango glaze, alongside roasted sweet potatoes and sauteed kale"
  },
  {
    "name": "Spiced Pork Ribs with Guava BBQ Sauce",
    "category_id": "cat_food_main",
    "price": 28,
    "description": "Tender ribs smothered in a guava BBQ sauce, with grilled plantains and a side of coconut-lime rice"
  },
  {
    "name": "Lamb Loin Chops with Pineapple-Mint Glaze",
    "category_id": "cat_food_main",
    "price": 19,
    "description": "Perfectly grilled lamb loin chops glazed in a sweet and tangy pineapple-mint sauce, accompanied by roasted root vegetables for a hearty and satisfying main course"
  },
  {
    "name": "Char-Grilled Ribeye with Island Spice Rub",
    "category_id": "cat_food_main",
    "price": 35,
    "description": null
  },
  {
    "name": "Creamy Coconut Polenta with Mushroom Ragout (Vegetarian)",
    "category_id": "cat_food_main",
    "price": 20,
    "description": "Smooth polenta enriched with coconut cream, topped with a savory mushroom and vegetable ragout"
  },
  {
    "name": "Chocolate Avocado Pudding",
    "category_id": "cat_food_dessert",
    "price": 14,
    "description": "Rich and smooth chocolate pudding made with ripe avocados, sweetened naturally, garnished with toasted coconut flakes and mint"
  },
  {
    "name": "Coconut Panna Cotta",
    "category_id": "cat_food_dessert",
    "price": 15,
    "description": "Creamy coconut and vanilla-infused panna cotta, accompanied by tropical fruit salsa for a tangy contrast"
  },
  {
    "name": "Grilled Pineapple & Banana Rum Skewers",
    "category_id": "cat_food_dessert",
    "price": 15,
    "description": "Alternating chunks of pineapple and banana, soaked in dark rum, grilled and caramelized, served with rum-infused whipped cream"
  },
  {
    "name": "Caramelized Rum Cake",
    "category_id": "cat_food_dessert",
    "price": 16,
    "description": "Moist cake soaked in buttery rum syrup, with a caramelized topping, capturing the essence of island rum"
  },
  {
    "name": "Chocolate Lava Cake with Papaya Coulis",
    "category_id": "cat_food_dessert",
    "price": 18,
    "description": "Decadent lava cake with a molten center, paired with bright papaya coulis for a delightful contrast"
  },
  {
    "name": "Tropical Fruit Brulee",
    "category_id": "cat_food_dessert",
    "price": 19,
    "description": "Creamy custard topped with chopped tropical fruits, caramelized to a crisp finish for a refreshing crunch"
  },
  {
    "name": "Passion Fruit Creme Brulee",
    "category_id": "cat_food_dessert",
    "price": 14,
    "description": "Silky custard infused with tropical passion fruit, topped with caramelized sugar."
  },
  {
    "name": "Coconut Tres Leches Cake",
    "category_id": "cat_food_dessert",
    "price": 14,
    "description": "Moist coconut cake soaked in three milks, topped with toasted coconut."
  },
  {
    "name": "Grilled Pineapple with Rum Caramel and Coconut Ice Cream",
    "category_id": "cat_food_dessert",
    "price": 14,
    "description": "Caramelized pineapple with rum caramel sauce and coconut ice cream."
  },
  {
    "name": "Chocolate Lava Cake with Macadamia Nut Brittle",
    "category_id": "cat_food_dessert",
    "price": 14,
    "description": "Decadent chocolate cake with a molten center, accompanied by macadamia nut brittle."
  },
  {
    "name": "Tropical Seafood Chowder",
    "category_id": "cat_food_salad_and_soup",
    "price": 16,
    "description": "A medley of fresh seafood in a creamy coconut broth with island spices."
  },
  {
    "name": "Lobster Bisque with Coconut Foam",
    "category_id": "cat_food_salad_and_soup",
    "price": 14,
    "description": "Velvety lobster soup crowned with a delicate coconut foam"
  },
  {
    "name": "Deconstructed Ahi Poke Bowl",
    "category_id": "cat_food_bowls",
    "price": 25,
    "description": "Fresh Ahi marinated in a soy-sesame blend, over seasoned sushi rice, enhanced with avocado, cucumber, edamame, and a sprinkle of furikake"
  },
  {
    "name": "Island Teriyaki Mahi-Mahi Bowl",
    "category_id": "cat_food_bowls",
    "price": 23,
    "description": "Jasmine rice topped with teriyaki glazed grilled Mahi- Mahi, and a vibrant medley of stir-fried tropical vegetables"
  },
  {
    "name": "Caribbean Shrimp Bowl",
    "category_id": "cat_food_bowls",
    "price": 23,
    "description": "Grilled shrimp atop coconut rice with black beans, pineapple salsa, and a touch of spicy jerk sauce"
  },
  {
    "name": "Crab-Stuffed Avocado Bowl",
    "category_id": "cat_food_bowls",
    "price": 23,
    "description": "Half an avocado filled with creamy crab salad on mixed greens, topped with mango salsa"
  },
  {
    "name": "Chicken and Pineapple Bowl",
    "category_id": "cat_food_bowls",
    "price": 20,
    "description": "Grilled chicken and sweet pineapple over coconut rice with tropical vegetables"
  },
  {
    "name": "Pork Loin Chop with Taro Puree",
    "category_id": "cat_food_bowls",
    "price": 25,
    "description": "Grilled pork loin chop with a hint of island spices, served over a creamy taro root puree and garnished with a mango chutney"
  },
  {
    "name": "Lamb Gyro Bowl",
    "category_id": "cat_food_bowls",
    "price": 19,
    "description": "A deconstructed gyro bowl featuring spiced lamb, served over a bed of seasoned rice with tomatoes, cucumbers, and a dollop of tzatziki"
  },
  {
    "name": "Beef Short Rib Bowl with Coconut Rice",
    "category_id": "cat_food_bowls",
    "price": 25,
    "description": null
  },
  {
    "name": "Tropical Stuffed Peppers (Vegetarian)",
    "category_id": "cat_food_bowls",
    "price": 19,
    "description": "Bell peppers stuffed with quinoa, black beans, corn, and pineapple, topped with melted Monterey Jack cheese"
  },
  {
    "name": "Polynesian Crab Rangoon",
    "category_id": "cat_food_shareable",
    "price": 40,
    "description": "A twist on the classic, filled with sweet crab and cream cheese, served with a pineapple sweet and sour sauce for dipping"
  },
  {
    "name": "Coconut Shrimp Platter",
    "category_id": "cat_food_shareable",
    "price": 40,
    "description": "Crispy coconut-crusted shrimp, ready to be dipped in a tangy mango sauce perfect for a group indulgence"
  },
  {
    "name": "Island Charcuterie and Tropical Cheese Platter",
    "category_id": "cat_food_shareable",
    "price": 56,
    "description": "A lavish spread featuring an array of spiced cured meats, artisanal cheeses, and tropical fruits Accompanied by nutty crackers, honey-lime drizzle, and an assortment of pickled vegetables and tropical chutneys"
  },
  {
    "name": "Island BBQ Slider Trio",
    "category_id": "cat_food_shareable",
    "price": 44,
    "description": "Mini sliders featuring pulled pork, jerk chicken, and grilled mahi-mahi, each on a sweet Hawaiian roll, accompanied by a tangy slaw and tropical fruit relish, perfect for sampling and sharing"
  },
  {
    "name": "Vegan Mezze Platter",
    "category_id": "cat_food_shareable",
    "price": 36,
    "description": "A vibrant selection of hummus, baba ganoush, and roasted red pepper dip, served with vegetable crudites, olives, and warm pita bread"
  },
  {
    "name": "Vegetarian Spring Roll Platter",
    "category_id": "cat_food_shareable",
    "price": 14,
    "description": "Crisp, fresh vegetable spring rolls packed with julienne carrots, cabbage, and sweet peppers, served with a sweet chili dipping sauce and a peanut hoisin blend for an array of flavors"
  },
  {
    "name": "Starter: Mango and Scallop Ceviche",
    "category_id": "cat_food_prefix",
    "price": 60,
    "description": null
  },
  {
    "name": "Main Course: Citrus-Herb Grilled Swordfish",
    "category_id": "cat_food_prefix",
    "price": null,
    "description": null
  },
  {
    "name": "Dessert: Passion Fruit Mousse",
    "category_id": "cat_food_prefix",
    "price": null,
    "description": null
  },
  {
    "name": "Lobster Roll",
    "category_id": "cat_food_roll",
    "price": 32,
    "description": null
  },
  {
    "name": "Oyster Selection (with tropical mignonettes)",
    "category_id": "cat_food_raw_bar",
    "price": 24,
    "description": "Fresh oysters served with an array of house-made tropical mignonettes."
  },
  {
    "name": "Tropical Ceviche Trio (shrimp, mahi-mahi, and octopus)",
    "category_id": "cat_food_raw_bar",
    "price": 22,
    "description": "A refreshing medley of shrimp, mahi-mahi, and octopus \"cooked\" in citrus juices"
  },
  {
    "name": "Coconut-Lime Scallop Crudo",
    "category_id": "cat_food_raw_bar",
    "price": 24,
    "description": "Fresh scallops thinly sliced and dressed with coconut milk, lime juice, and a touch of chili."
  },
  {
    "name": "Citrus-Cured Hamachi",
    "category_id": "cat_food_raw_bar",
    "price": 18,
    "description": "Delicate slices of hamachi infused with bright citrus flavors."
  },
  {
    "name": "Ahi Tuna Poke Tower",
    "category_id": "cat_food_raw_bar",
    "price": 50,
    "description": "Layers of fresh ahi tuna, avocado, mango, and crispy wontons, drizzled with a sesame-soy glaze."
  },
  {
    "name": "Lobster Sashimi",
    "category_id": "cat_food_raw_bar",
    "price": 38,
    "description": "Thinly sliced raw lobster tail served with a passion fruit ponzu sauce."
  },
  {
    "name": "Coconut Rice",
    "category_id": "cat_food_sides",
    "price": 8,
    "description": null
  },
  {
    "name": "Grilled Plantains",
    "category_id": "cat_food_sides",
    "price": 8,
    "description": null
  },
  {
    "name": "Tropical Vegetable Medley",
    "category_id": "cat_food_sides",
    "price": 8,
    "description": null
  },
  {
    "name": "Sweet Potato Mash with Rum Butter",
    "category_id": "cat_food_sides",
    "price": 8,
    "description": null
  },
  {
    "name": "Macadamia-Crusted Halibut with Pineapple Beurre Blanc",
    "category_id": "cat_food_main_sea",
    "price": 38,
    "description": "Tender halibut with a crunchy macadamia crust and pineapple beurre blanc."
  },
  {
    "name": "Seared Bluefin Tuna with Tropical Salsa",
    "category_id": "cat_food_main_sea",
    "price": 45,
    "description": "Exquisitely seared rare Bluefin tuna, accompanied by a vibrant tropical fruit salsa, finished with a delicate arrangement of micro greens. This dish exemplifies luxury and freshness, perfectly balancing the rich flavor of the tuna with the bright, zesty notes of our house-made salsa."
  },
  {
    "name": "Pan-Seared Scallops with Mango-Lime Relish",
    "category_id": "cat_food_main_sea",
    "price": 36,
    "description": "Plump scallops seared to perfection, topped with a bright mango-lime relish."
  },
  {
    "name": "Grilled Spiny Lobster Tail with Coconut Butter",
    "category_id": "cat_food_main_sea",
    "price": 65,
    "description": "A succulent spiny lobster tail, grilled to perfection and basted with our signature coconut butter. Served with a grilled lemon half and a scatter of fresh, aromatic herbs. This dish brings together the sweet flesh of the lobster with the rich, tropical notes of coconut for a truly indulgent experience."
  },
  {
    "name": "Jerk-Spiced Chicken Breast with Coconut Rice",
    "category_id": "cat_food_main_land",
    "price": 28,
    "description": "Juicy chicken breast infused with Caribbean jerk spices, served over coconut rice."
  },
  {
    "name": "Guava-Glazed Pork Belly",
    "category_id": "cat_food_main_land",
    "price": 32,
    "description": "Crispy pork belly glazed with sweet and tangy guava sauce."
  },
  {
    "name": "Grilled Lamb Chops with Pineapple-Mint Sauce",
    "category_id": "cat_food_main_land",
    "price": 38,
    "description": "Tender lamb chops complemented by a refreshing pineapple-mint sauce."
  },
  {
    "name": "Vegetarian Taro Root Curry (can be made vegan)",
    "category_id": "cat_food_main_land",
    "price": 26,
    "description": "Creamy taro root curry with tropical vegetables, easily made vegan."
  },
  {
    "name": "Coconut Shrimp Lollipops",
    "category_id": "cat_food_shareable_platters",
    "price": 42,
    "description": "Large shrimp coated in coconut, fried and served on sugarcane skewers with a mango-chili dipping sauce."
  },
  {
    "name": "Tropical Seafood Ceviche Sampler",
    "category_id": "cat_food_shareable_platters",
    "price": 55,
    "description": "A refreshing sampler of tropical ceviches featuring shrimp, mahi-mahi, and octopus."
  },
  {
    "name": "Seafood Tower (oysters, shrimp, crab claws, lobster tail)",
    "category_id": "cat_food_shareable_platters",
    "price": 85,
    "description": "An opulent display of oysters, shrimp, crab claws, and lobster tail."
  },
  {
    "name": "Island Charcuterie and Tropical Cheese Board",
    "category_id": "cat_food_shareable_platters",
    "price": 32,
    "description": "An array of cured meats, artisanal cheeses, and tropical fruits."
  },
  {
    "name": "King Crab Legs",
    "category_id": "cat_food_shareable_platters",
    "price": null,
    "description": "Generous portions of steamed Alaskan King Crab legs, served with drawn butter, lemon wedges, and a sprinkle of fresh herbs. Perfect for sharing, these sweet and succulent crab legs offer a taste of pure luxury, ideal for those seeking the finest seafood experience."
  },
  {
    "name": "Chilled Snow Crab Leg Platter",
    "category_id": "cat_food_shareable_platters",
    "price": 55,
    "description": "A generous portion of succulent, chilled snow crab legs, expertly cracked for easy enjoyment. Served with our signature tropical mignonette and citrus-infused drawn butter, elevating this classic to new heights of refinement."
  },
  {
    "name": "Citrus Ceviche Mahi-Mahi",
    "category_id": "cat_food_appetizer",
    "price": 17,
    "description": "Zesty lime and orange marinated Mahi-Mahi, served with crisp plantain chips"
  },
  {
    "name": "Chilled Lobster Martini",
    "category_id": "cat_food_appetizer",
    "price": 25,
    "description": "Succulent lobster meat served chilled in a martini glass with avocado and mango relish."
  },
  {
    "name": "Tropical Shrimp Cocktail",
    "category_id": "cat_food_appetizer",
    "price": 18,
    "description": "Chilled jumbo prawns with a pineapple-horseradish sauce, offering a sweet and sharp flavor profile"
  },
  {
    "name": "Caribbean Jerk Chicken Skewers",
    "category_id": "cat_food_appetizer",
    "price": 16,
    "description": "Jerk-marinated chicken skewers grilled and paired with pineapple salsa"
  },
  {
    "name": "Polynesian Pork Belly",
    "category_id": "cat_food_appetizer",
    "price": 20,
    "description": "Crispy pork belly with a Polynesian-inspired glaze, served with a pineapple and papaya salsa"
  },
  {
    "name": "Caribbean Spiced Lamb Skewers",
    "category_id": "cat_food_appetizer",
    "price": 18,
    "description": "Tender lamb skewers marinated in Caribbean spices, served with a cooling mango-yogurt dip for a light and flavorful start"
  },
  {
    "name": "Beef Carpaccio with Tropical Salsa",
    "category_id": "cat_food_appetizer",
    "price": 19,
    "description": null
  },
  {
    "name": "Tofu Poke Bowl (Vegan)",
    "category_id": "cat_food_appetizer",
    "price": 18,
    "description": "Marinated tofu cubes with sushi rice, edamame, seaweed salad, and an avocado-wasabi spread"
  },
  {
    "name": "Ahi Nicoise with a Twist",
    "category_id": "cat_food_salads",
    "price": 22,
    "description": "Lightly seared Ahi atop a vibrant mix of greens, quail eggs, haricots verts, and olives, all brought together with a citrus-infused olive oil dressing"
  },
  {
    "name": "Tropical Mahi-Mahi Salad",
    "category_id": "cat_food_salads",
    "price": 20,
    "description": "Grilled Mahi-Mahi on a bed of baby greens, with fresh papaya, avocado, toasted coconut, tossed in a passion fruit vinaigrette"
  },
  {
    "name": "Shrimp and Avocado Salad",
    "category_id": "cat_food_salads",
    "price": 20,
    "description": "Grilled shrimp, avocado, mixed greens, and grapefruit segments in a citrus vinaigrette"
  },
  {
    "name": "Crab Louie Salad",
    "category_id": "cat_food_salads",
    "price": 24,
    "description": "A modern twist on the classic, with crisp lettuce, avocado, eggs, cherry tomatoes, and lump crabmeat in Louie dressing"
  },
  {
    "name": "Tropical Chicken Salad",
    "category_id": "cat_food_salads",
    "price": 18,
    "description": "Grilled chicken with mango and avocado on mixed greens, dressed in citrus honey, sprinkled with almonds"
  },
  {
    "name": "Luau-Style Pulled Pork Salad",
    "category_id": "cat_food_salads",
    "price": 22,
    "description": "Slow-cooked pulled pork served over tropical greens with citrus notes and sweet potato crisps."
  },
  {
    "name": "Lamb Salad with Tropical Citrus Dressing",
    "category_id": "cat_food_salads",
    "price": 19,
    "description": "Grilled lamb slices atop a bed of mixed greens, accented with fresh tropical fruits, and drizzled with a zesty citrus dressing"
  },
  {
    "name": "Island Vegetable Curry (Vegan)",
    "category_id": "cat_food_salads",
    "price": 20,
    "description": "A rich blend of seasonal vegetables in a coconut curry sauce, served over jasmine rice with plantain chips"
  }
] as const;
