/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { CODA_FOOD_ITEM_SEEDS, CUISINE_SUBCATEGORY_SEEDS } from './codaFoodSeeds';

type PlainObject = Record<string, any>;

const STORAGE_SCOPE = String(import.meta.env.BASE_URL || '/')
  .trim()
  .replace(/^\/+|\/+$/g, '')
  .replace(/[^a-zA-Z0-9_-]/g, '_') || 'root';

const STORAGE_KEY_PREFIX = `srs_team_hub.${STORAGE_SCOPE}`;
const DB_KEY = `${STORAGE_KEY_PREFIX}.local.db.v1`;
const USERS_KEY = `${STORAGE_KEY_PREFIX}.local.users.v1`;
const SESSION_KEY = `${STORAGE_KEY_PREFIX}.local.session.v1`;
const FILES_KEY = `${STORAGE_KEY_PREFIX}.local.files.v1`;
const TEMPLATE_DATA_RESET_KEY = `${STORAGE_KEY_PREFIX}.template.reset.version`;
const TEMPLATE_DATA_RESET_VERSION = 'srs_team_hub_template_v2';

const FK_TABLE_MAP: Record<string, string> = {
  category_id: 'menu_categories',
  department_id: 'job_departments',
  job_type_id: 'job_types',
  role_id: 'admin_roles',
  menu_id: 'tasting_menus',
  course_id: 'tasting_menu_courses',
  template_id: 'tasting_menu_templates',
};

const ALIAS_TABLE_MAP: Record<string, string> = {
  category: 'menu_categories',
  department: 'job_departments',
  job_type: 'job_types',
  role: 'admin_roles',
};

const DEFAULT_ADMIN_USER_ID = 'admin_local_owner';
const DEFAULT_ADMIN_EMAIL = 'admin@srs.local';
const DEFAULT_ADMIN_PASSWORD = 'srs-admin';
const DEFAULT_HOST_USER_ID = 'host_local_user';
const DEFAULT_HOST_EMAIL = 'host@srs.local';
const DEFAULT_HOST_PASSWORD = 'srs-host';
const DEFAULT_HOST_LEAD_USER_ID = 'host_local_lead';
const DEFAULT_HOST_LEAD_EMAIL = 'hostlead@srs.local';
const DEFAULT_HOST_LEAD_PASSWORD = 'srs-hostlead';
const DEFAULT_LINE_COOK_USER_ID = 'staff_local_line_cook';
const DEFAULT_LINE_COOK_EMAIL = 'linecook@srs.local';
const DEFAULT_LINE_COOK_PASSWORD = 'srs-linecook';
const DEFAULT_BARTENDER_USER_ID = 'staff_local_bartender';
const DEFAULT_BARTENDER_EMAIL = 'bartender@srs.local';
const DEFAULT_BARTENDER_PASSWORD = 'srs-bartender';
const DEFAULT_SERVER_USER_ID = 'staff_local_server';
const DEFAULT_SERVER_EMAIL = 'server@srs.local';
const DEFAULT_SERVER_PASSWORD = 'srs-server';
const TASTING_MENU_MIGRATION_FLAG = 'tastings_seed_20260315';

const DEFAULT_PASSWORD_BY_EMAIL: Record<string, string> = {
  [DEFAULT_ADMIN_EMAIL.toLowerCase()]: DEFAULT_ADMIN_PASSWORD,
  [DEFAULT_HOST_EMAIL.toLowerCase()]: DEFAULT_HOST_PASSWORD,
  [DEFAULT_HOST_LEAD_EMAIL.toLowerCase()]: DEFAULT_HOST_LEAD_PASSWORD,
  [DEFAULT_LINE_COOK_EMAIL.toLowerCase()]: DEFAULT_LINE_COOK_PASSWORD,
  [DEFAULT_BARTENDER_EMAIL.toLowerCase()]: DEFAULT_BARTENDER_PASSWORD,
  [DEFAULT_SERVER_EMAIL.toLowerCase()]: DEFAULT_SERVER_PASSWORD,
};

const LEGACY_DEFAULT_CREDENTIALS_BY_USER_ID: Record<string, { email: string; password: string }> = {
  [DEFAULT_ADMIN_USER_ID]: {
    email: 'admin@spoonbill.local',
    password: 'spoonbill-admin',
  },
  [DEFAULT_HOST_USER_ID]: {
    email: 'host@spoonbill.local',
    password: 'spoonbill-host',
  },
  [DEFAULT_HOST_LEAD_USER_ID]: {
    email: 'hostlead@spoonbill.local',
    password: 'spoonbill-hostlead',
  },
  [DEFAULT_LINE_COOK_USER_ID]: {
    email: 'linecook@spoonbill.local',
    password: 'spoonbill-linecook',
  },
  [DEFAULT_BARTENDER_USER_ID]: {
    email: 'bartender@spoonbill.local',
    password: 'spoonbill-bartender',
  },
  [DEFAULT_SERVER_USER_ID]: {
    email: 'server@spoonbill.local',
    password: 'spoonbill-server',
  },
};

const nowIso = () => new Date().toISOString();

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'item';

const createId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
};

const formatTime = (hour24: number) => `${String(hour24).padStart(2, '0')}:00`;

const buildDefaultTimeSlots = () => {
  const slots: PlainObject[] = [];

  for (let day = 0; day < 7; day += 1) {
    for (let hour = 17; hour <= 22; hour += 1) {
      slots.push({
        id: createId('slot'),
        start_time: formatTime(hour),
        end_time: formatTime(hour + 1),
        day_of_week: day,
        capacity: 24,
        is_event_slot: false,
        active: true,
        created_at: nowIso(),
      });
    }

    for (let hour = 18; hour <= 21; hour += 1) {
      slots.push({
        id: createId('event_slot'),
        start_time: formatTime(hour),
        end_time: formatTime(hour + 2),
        day_of_week: day,
        capacity: 80,
        is_event_slot: true,
        active: true,
        created_at: nowIso(),
      });
    }
  }

  return slots;
};

const CODA_BEVERAGE_IMPORT = [
  {
    name: 'Plumed Paradise Pina Colada',
    description: 'Indulge in a taste of paradise with this luscious, frothy cocktail, a tropical symphony that dances on the palate, inviting you to spread your wings in a vibrant haven.',
    price: 18,
    alcohol_content: 2,
    non_alcoholic: false,
    ingredients: ['Bacardi Superior', 'Pineapple Juice', 'Coconut Cream'],
    spirit_category: 'RUM',
    flight: 'Tropical Fruit Adventure',
  },
  {
    name: 'Chirping Chi Chi',
    description: 'Embark on a tranquil escape with this playful twist on the classic, where every sip sings a melody of tropical bliss, whisking you away to a serene paradise.',
    price: 18,
    alcohol_content: 2,
    non_alcoholic: false,
    ingredients: ["Tito's Handmade Vodka", 'Coconut Cream', 'Pineapple Juice'],
    spirit_category: 'VODKA',
    flight: null,
  },
  {
    name: 'Coral Canopy Reef',
    description: 'Delve into oceanic paradise with this visually stunning cocktail, a harmonious blend that mirrors the serene beauty and bright hues of a coral reef.',
    price: 18,
    alcohol_content: 2,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: 'Tropical Fruit Adventure',
  },
  {
    name: 'Molten Sunset Lava Flow',
    description: 'Witness a tropical sunset in a glass with this captivating cocktail, where the fiery blend of strawberry, pineapple, and coconut creates a mesmerizing lava flow effect.',
    price: 18,
    alcohol_content: 2,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Sapphire Skies Blue Hawaii',
    description: 'Immerse yourself in the splendor of a tropical daydream, a cocktail that captures the essence of cloudless, sapphire skies and sun-kissed shores.',
    price: 20,
    alcohol_content: 3,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: 'Tropical Fruit Adventure',
  },
  {
    name: 'Soothing Sanctuary Painkiller',
    description: 'Embark on a serene journey to tropical bliss with this enchanting cocktail, offering a delicate balance of warmth and sweetness, perfect for a tranquil escape from the everyday.',
    price: 20,
    alcohol_content: 3,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Aloha Spirit Mai Tai',
    description: 'Savor the sunset and dance with the waves with this blissful cocktail, an embodiment of the Hawaiian spirit and island paradise.',
    price: 20,
    alcohol_content: 3,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: 'Tiki Classic Flight',
  },
  {
    name: 'Island Rendezvous Bahama Mama',
    description: 'Embark on a sun-drenched journey with this vibrant cocktail, a blissful blend of island flavors that celebrates the spirited essence of tropical life.',
    price: 20,
    alcohol_content: 3,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Break The Storm Hurricane',
    description: "Embrace the exhilaration of a tropical tempest with this vibrant and bold cocktail, a daring blend that captures the essence of a storm's untamed beauty.",
    price: 20,
    alcohol_content: 3,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: "Trader Vic's Mai Tai",
    description: 'Indulge in the ultimate embodiment of island elegance with this enchanting cocktail, a symphony of flavors that whisk you away to sandy beaches and sun-kissed shores.',
    price: 20,
    alcohol_content: 3,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Feathered Frenzy Zombie',
    description: 'Surrender to the call of the wild with this audacious, complex cocktail, a tropical storm in a glass that tantalizes the senses and awakens the spirit.',
    price: 22,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: 'Tiki Classic Flight',
  },
  {
    name: "Talon's Tango Scorpion",
    description: "A daring dance of flavors, this cocktail tempts with a mysterious blend, inviting you to embrace the wild thrill of nature's untamed spirit.",
    price: 22,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Rum Ripples Rum Runner',
    description: 'Embark on a flavorful odyssey with this spirited blend, an adventure of sun-kissed sweetness and refreshing zest, perfect for the high seas explorer.',
    price: 22,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Tropic Wings Singapore Sling',
    description: 'Embark on a sensory journey with this enchanting blend, evoking distant tropical horizons and a blush of sunset in every sip.',
    price: 22,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'GIN',
    flight: 'Tiki Classic Flight',
  },
  {
    name: 'Jungle Plumage Bird',
    description: 'Dive into a vivid and adventurous cocktail that brings the lush, vibrant essence of the jungle to life, complete with a mysterious hint of the exotic.',
    price: 22,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: 'Spoonbill Signature',
  },
  {
    name: "Flamingo's Fancy Planter's Punch",
    description: 'Celebrate tropical sophistication with this vibrant, whimsical cocktail, embodying the grace of a flamingo with its flamboyant hue and lively citrus notes. Enhanced with a splash of potent overproof rum to elevate the tropical experience to new heights of indulgence',
    price: 24,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: 'Spoonbill Signature',
  },
  {
    name: 'Opulent Oasis Pearl Diver',
    description: 'Experience a journey into sophisticated relaxation with this exquisite cocktail, blending select rums and delicate flavors for a truly opulent escape.',
    price: 24,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: 'Spoonbill Signature',
  },
  {
    name: 'Shark Beak Bay Shark Bite',
    description: "Embark on a vivid ocean adventure with this audacious cocktail, a tribute to the deep's mysteries with its bold flavors and dramatic 'bleeding' effect. Crowned with a dark rum float, this drink takes a fierce bite with its enhanced potency, perfect for those who like to swim in deeper waters.",
    price: 24,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Nautical Nest Navy Grog',
    description: 'Set sail on a bold seafaring adventure with this hearty cocktail, a tribute to maritime explorers with its robust blend of rums and zesty citrus flavors.',
    price: 24,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Enchanted Canopy Fog Cutter',
    description: 'Lose yourself in the magic of the tropical wilderness with this complex and intriguing cocktail, a symphony of potent spirits and citrus, topped with a haze-like sherry float.',
    price: 24,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Mystic Jungle Bowl',
    description: 'Embark on a flavor expedition with layers of passion fruit and citrus, crowned by a cinnamon flare.',
    price: 60,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Volcanic Spirit Bowl',
    description: 'Experience an eruption of tropical flavors with a smoky grenadine finish like flowing lava.',
    price: 60,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: "Siren's Serenade Bowl",
    description: "Be enchanted by this melody of sweet and citrus notes, as enchanting as a siren's call.",
    price: 60,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: "Navigator's Grog Bowl",
    description: 'Navigate through a sea of flavors, from the sweetness of the tropics to a hint of spice.',
    price: 60,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: "Islander's Sunset Bowl",
    description: 'Set sail towards the horizon with this vibrant blend, where the warmth of the Island sun meets the coolness of the evening tide.',
    price: 60,
    alcohol_content: 4,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Crimson Tide Bowl',
    description: "Set sail on bold flavors with a cocktail that's as deep and daring as the crimson tide.",
    price: 70,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'BOURBON',
    flight: null,
  },
  {
    name: "Pirate's Bounty Bowl",
    description: "Plunder the depths of flavor with a robust bowl fit for a captain's toast.",
    price: 70,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: 'Typhoon Treasure Bowl',
    description: "Brace for a storm of flavors with a mix that's as tempestuous as it is tantalizing.",
    price: 70,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: "Empire's Eclipse Bowl",
    description: "Conquer the night with a cocktail that's as mysterious as an eclipse with a burst of citrus flame.",
    price: 70,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
  {
    name: "Islander's Sunset Bowl",
    description: 'Set sail towards the horizon with this vibrant blend, where the warmth of the island sun meets the coolness of the evening tide.',
    price: 70,
    alcohol_content: 5,
    non_alcoholic: false,
    ingredients: [],
    spirit_category: 'RUM',
    flight: null,
  },
] as const;

const seedMenu = () => {
  const categories = [
    { id: 'cat_cocktails', name: 'Cocktails', menu_type: 'drinks', display_order: 1, parent_id: null, active: true },
    { id: 'cat_spirits', name: 'Spirits', menu_type: 'drinks', display_order: 2, parent_id: null, active: true },
    { id: 'cat_cuisine', name: 'Cuisine', menu_type: 'food', display_order: 1, parent_id: null, active: true },
    { id: 'cat_signature', name: 'Signature', menu_type: 'drinks', display_order: 1, parent_id: 'cat_cocktails', active: true },
    { id: 'cat_zero_proof', name: 'Zero Proof', menu_type: 'drinks', display_order: 2, parent_id: 'cat_cocktails', active: true },
    { id: 'cat_whiskey', name: 'Whiskey', menu_type: 'drinks', display_order: 1, parent_id: 'cat_spirits', active: true },
    { id: 'cat_agave', name: 'Agave', menu_type: 'drinks', display_order: 2, parent_id: 'cat_spirits', active: true },
    { id: 'cat_small_plates', name: 'Small Plates', menu_type: 'food', display_order: 1, parent_id: 'cat_cuisine', active: true },
    { id: 'cat_entrees', name: 'Entrees', menu_type: 'food', display_order: 2, parent_id: 'cat_cuisine', active: true },
  ].map((item) => ({ ...item, created_at: nowIso(), updated_at: nowIso() }));

  const items = [
    {
      id: 'item_tidepool',
      name: 'Tidepool Daiquiri',
      description: 'White rum, pandan, lime, and demerara.',
      price: 18,
      bottle_price: null,
      image_url: null,
      menu_type: 'drinks',
      show_price: true,
      show_description: true,
      ingredients: ['White Rum', 'Pandan', 'Lime'],
      allergens: null,
      is_vegetarian: true,
      is_vegan: true,
      is_gluten_free: true,
      alcohol_content: 3,
      garnish: 'Lime zest',
      category_id: 'cat_signature',
      active: true,
    },
    {
      id: 'item_orchid',
      name: 'Orchid No. 5',
      description: 'Lychee, coconut water, jasmine, and citrus.',
      price: 14,
      bottle_price: null,
      image_url: null,
      menu_type: 'drinks',
      show_price: true,
      show_description: true,
      ingredients: ['Lychee', 'Coconut Water', 'Jasmine'],
      allergens: null,
      is_vegetarian: true,
      is_vegan: true,
      is_gluten_free: true,
      alcohol_content: 0,
      garnish: 'Edible orchid',
      category_id: 'cat_zero_proof',
      active: true,
    },
    {
      id: 'item_single_malt',
      name: 'Highland Single Malt',
      description: 'Notes of honey, peat, and orange oil.',
      price: 24,
      bottle_price: null,
      image_url: null,
      menu_type: 'drinks',
      show_price: true,
      show_description: true,
      ingredients: ['Scotch Whisky'],
      allergens: null,
      is_vegetarian: true,
      is_vegan: true,
      is_gluten_free: true,
      alcohol_content: 4,
      garnish: null,
      category_id: 'cat_whiskey',
      active: true,
    },
    {
      id: 'item_crudo',
      name: 'Hamachi Crudo',
      description: 'Yuzu kosho, cucumber, and chili crisp.',
      price: 22,
      bottle_price: null,
      image_url: null,
      menu_type: 'food',
      show_price: true,
      show_description: true,
      ingredients: ['Hamachi', 'Yuzu', 'Cucumber'],
      allergens: ['Fish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      alcohol_content: null,
      garnish: null,
      category_id: 'cat_small_plates',
      active: true,
    },
    {
      id: 'item_short_rib',
      name: 'Miso Short Rib',
      description: 'Shiitake glaze, scallion rice, and sesame.',
      price: 36,
      bottle_price: null,
      image_url: null,
      menu_type: 'food',
      show_price: true,
      show_description: true,
      ingredients: ['Beef Short Rib', 'Miso', 'Sesame'],
      allergens: ['Soy'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      alcohol_content: null,
      garnish: null,
      category_id: 'cat_entrees',
      active: true,
    },
  ].map((item) => ({ ...item, created_at: nowIso(), updated_at: nowIso() }));

  return { categories, items };
};

const seedTastings = () => {
  const withTimestamps = (record: PlainObject) => ({
    ...record,
    created_at: nowIso(),
    updated_at: nowIso(),
  });

  const menus = [
    {
      id: 'tm_prix_fixe',
      name: 'Prix Fixe',
      description: 'Three-course prix fixe menu with starter, main, and dessert choices.',
      price: 85,
      menu_type: 'prix_fixe',
      display_order: 1,
      active: true,
    },
    {
      id: 'tm_tasting_tropics',
      name: 'Tasting - Tropics',
      description: 'A tropical tasting progression from amuse-bouche to dessert.',
      price: 125,
      menu_type: 'prix_fixe',
      display_order: 2,
      active: true,
    },
    {
      id: 'tm_tasting_captains_table',
      name: 'Tasting - Captains Table',
      description: "A captain's table experience with premium seafood-forward courses.",
      price: 175,
      menu_type: 'prix_fixe',
      display_order: 3,
      active: true,
    },
  ].map(withTimestamps);

  const courses = [
    {
      id: 'tc_prix_starter',
      menu_id: 'tm_prix_fixe',
      name: 'Starter Choices',
      description: null,
      display_order: 1,
      allows_choice: true,
    },
    {
      id: 'tc_prix_main',
      menu_id: 'tm_prix_fixe',
      name: 'Main Choices',
      description: null,
      display_order: 2,
      allows_choice: true,
    },
    {
      id: 'tc_prix_dessert',
      menu_id: 'tm_prix_fixe',
      name: 'Dessert',
      description: null,
      display_order: 3,
      allows_choice: true,
    },
    {
      id: 'tc_tropics_amuse',
      menu_id: 'tm_tasting_tropics',
      name: 'Amuse-Bouche',
      description: null,
      display_order: 1,
      allows_choice: false,
    },
    {
      id: 'tc_tropics_first',
      menu_id: 'tm_tasting_tropics',
      name: 'First Course',
      description: null,
      display_order: 2,
      allows_choice: false,
    },
    {
      id: 'tc_tropics_second',
      menu_id: 'tm_tasting_tropics',
      name: 'Second Course',
      description: null,
      display_order: 3,
      allows_choice: false,
    },
    {
      id: 'tc_tropics_third',
      menu_id: 'tm_tasting_tropics',
      name: 'Third Course',
      description: null,
      display_order: 4,
      allows_choice: false,
    },
    {
      id: 'tc_tropics_dessert',
      menu_id: 'tm_tasting_tropics',
      name: 'Dessert',
      description: null,
      display_order: 5,
      allows_choice: false,
    },
    {
      id: 'tc_captains_amuse',
      menu_id: 'tm_tasting_captains_table',
      name: 'Amuse-Bouche',
      description: null,
      display_order: 1,
      allows_choice: false,
    },
    {
      id: 'tc_captains_first',
      menu_id: 'tm_tasting_captains_table',
      name: 'First Course',
      description: null,
      display_order: 2,
      allows_choice: false,
    },
    {
      id: 'tc_captains_main',
      menu_id: 'tm_tasting_captains_table',
      name: 'Main Course',
      description: null,
      display_order: 3,
      allows_choice: false,
    },
    {
      id: 'tc_captains_second',
      menu_id: 'tm_tasting_captains_table',
      name: 'Second Course',
      description: null,
      display_order: 4,
      allows_choice: false,
    },
    {
      id: 'tc_captains_third',
      menu_id: 'tm_tasting_captains_table',
      name: 'Third Course',
      description: null,
      display_order: 5,
      allows_choice: false,
    },
    {
      id: 'tc_captains_dessert',
      menu_id: 'tm_tasting_captains_table',
      name: 'Dessert',
      description: null,
      display_order: 6,
      allows_choice: false,
    },
  ].map(withTimestamps);

  const items = [
    {
      id: 'ti_prix_starter_ceviche',
      course_id: 'tc_prix_starter',
      name: 'Citrus Ceviche Mahi-Mah',
      description: 'Fresh mahi-mahi marinated in a vibrant citrus blend, served with tropical fruit salsa.',
      ingredients: [],
      allergens: ['Fish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_prix_starter_lobster_martini',
      course_id: 'tc_prix_starter',
      name: 'Chilled Lobster Martini',
      description: 'Succulent lobster meat served chilled with avocado and mango relish.',
      ingredients: [],
      allergens: ['Shellfish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 2,
      active: true,
    },
    {
      id: 'ti_prix_starter_coconut_shrimp',
      course_id: 'tc_prix_starter',
      name: 'Coconut Shrimp with Mango-Habanero Sauce',
      description: 'Crispy coconut shrimp paired with a sweet and spicy mango-habanero sauce.',
      ingredients: [],
      allergens: ['Shellfish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      display_order: 3,
      active: true,
    },
    {
      id: 'ti_prix_main_scallops',
      course_id: 'tc_prix_main',
      name: 'Pan-Seared Scallops with Mango-Lime Relish',
      description: 'Plump scallops seared to perfection, topped with a bright mango-lime relish.',
      ingredients: [],
      allergens: ['Shellfish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_prix_main_jerk_chicken',
      course_id: 'tc_prix_main',
      name: 'Jerk-Spiced Chicken Breast with Coconut Rice',
      description: 'Juicy chicken breast infused with Caribbean jerk spices, served over coconut rice.',
      ingredients: [],
      allergens: [],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 2,
      active: true,
    },
    {
      id: 'ti_prix_main_taro_curry',
      course_id: 'tc_prix_main',
      name: 'Vegetarian Taro Root Curry (can be made vegan)',
      description: 'Creamy taro root curry with tropical vegetables.',
      ingredients: [],
      allergens: [],
      is_vegetarian: true,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 3,
      active: true,
    },
    {
      id: 'ti_prix_dessert_passion_brulee',
      course_id: 'tc_prix_dessert',
      name: 'Passion Fruit Creme Brulee',
      description: 'Silky custard infused with passion fruit, topped with caramelized sugar.',
      ingredients: [],
      allergens: ['Dairy', 'Egg'],
      is_vegetarian: true,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_prix_dessert_tres_leches',
      course_id: 'tc_prix_dessert',
      name: 'Coconut Tres Leches Cake',
      description: 'Moist coconut cake soaked in three milks, topped with toasted coconut.',
      ingredients: [],
      allergens: ['Dairy'],
      is_vegetarian: true,
      is_vegan: false,
      is_gluten_free: false,
      display_order: 2,
      active: true,
    },
    {
      id: 'ti_prix_dessert_pineapple_icecream',
      course_id: 'tc_prix_dessert',
      name: 'Grilled Pineapple with Rum Caramel and Coconut Ice Cream',
      description: 'Caramelized pineapple with rum caramel and coconut ice cream.',
      ingredients: [],
      allergens: ['Dairy'],
      is_vegetarian: true,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 3,
      active: true,
    },
    {
      id: 'ti_tropics_amuse_oyster',
      course_id: 'tc_tropics_amuse',
      name: 'Oyster Selection (with tropical mignonettes)',
      description: 'Fresh oysters served with an array of tropical mignonettes.',
      ingredients: [],
      allergens: ['Shellfish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_tropics_first_ceviche_trio',
      course_id: 'tc_tropics_first',
      name: 'Tropical Ceviche Trio (shrimp, mahi-mahi, and octopus)',
      description: 'A refreshing medley of shrimp, mahi-mahi, and octopus cured in citrus juices.',
      ingredients: [],
      allergens: ['Fish', 'Shellfish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_tropics_second_shrimp_lollipops',
      course_id: 'tc_tropics_second',
      name: 'Coconut Shrimp Lollipops',
      description: 'Coconut-fried shrimp served on sugarcane skewers with mango-chili dipping sauce.',
      ingredients: [],
      allergens: ['Shellfish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_tropics_third_seafood_chowder',
      course_id: 'tc_tropics_third',
      name: 'Tropical Seafood Chowder',
      description: 'A medley of fresh seafood in a creamy coconut broth with island spices.',
      ingredients: [],
      allergens: ['Fish', 'Shellfish', 'Dairy'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_tropics_dessert_rum_skewers',
      course_id: 'tc_tropics_dessert',
      name: 'Grilled Pineapple & Banana Rum Skewers',
      description: 'Caramelized pineapple and banana skewers with rum-infused whipped cream.',
      ingredients: [],
      allergens: ['Dairy'],
      is_vegetarian: true,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_captains_amuse_hamachi',
      course_id: 'tc_captains_amuse',
      name: 'Citrus-Cured Hamachi',
      description: 'Delicate slices of hamachi infused with bright citrus flavors.',
      ingredients: [],
      allergens: ['Fish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_captains_first_poke_tower',
      course_id: 'tc_captains_first',
      name: 'Ahi Tuna Poke Tower',
      description: 'Layers of fresh ahi tuna, avocado, mango, and crispy wontons.',
      ingredients: [],
      allergens: ['Fish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_captains_main_bluefin',
      course_id: 'tc_captains_main',
      name: 'Seared Bluefin Tuna with Tropical Salsa',
      description: 'Rare bluefin tuna with vibrant tropical fruit salsa.',
      ingredients: [],
      allergens: ['Fish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_captains_second_octopus',
      course_id: 'tc_captains_second',
      name: 'Grilled Octopus with Papaya Salad',
      description: 'Tender char-grilled octopus with a vibrant papaya salad.',
      ingredients: [],
      allergens: ['Shellfish'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_captains_third_lobster_bisque',
      course_id: 'tc_captains_third',
      name: 'Lobster Bisque with Coconut Foam',
      description: 'Velvety lobster soup crowned with delicate coconut foam.',
      ingredients: [],
      allergens: ['Shellfish', 'Dairy'],
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      display_order: 1,
      active: true,
    },
    {
      id: 'ti_captains_dessert_lava',
      course_id: 'tc_captains_dessert',
      name: 'Chocolate Lava Cake with Macadamia Nut Brittle',
      description: 'Decadent chocolate cake with a molten center and macadamia brittle.',
      ingredients: [],
      allergens: ['Dairy', 'Nuts'],
      is_vegetarian: true,
      is_vegan: false,
      is_gluten_free: false,
      display_order: 1,
      active: true,
    },
  ].map(withTimestamps);

  return { menus, courses, items };
};

const defaultLocalUsers = () => [
  {
    id: DEFAULT_ADMIN_USER_ID,
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    created_at: nowIso(),
  },
];

const defaultTeamMembers = () => [
  {
    id: 'tm_owner',
    user_id: DEFAULT_ADMIN_USER_ID,
    email: DEFAULT_ADMIN_EMAIL,
    name: 'Owner Admin',
    title: 'Owner',
    portal: 'admin',
    can_view_reservations: true,
    can_view_events_parties: true,
    can_view_classes: true,
    can_access_menu_management: true,
    can_access_operations: true,
    can_access_workforce: true,
    can_access_content_management: true,
    can_access_career_management: true,
    can_access_investment: true,
    can_access_settings: true,
    operations_classes_read_only: false,
    active: true,
    created_at: nowIso(),
  },
  {
    id: 'tm_host',
    user_id: DEFAULT_HOST_USER_ID,
    email: DEFAULT_HOST_EMAIL,
    name: 'Host Account',
    title: 'Host',
    portal: 'host',
    can_view_reservations: true,
    can_view_events_parties: true,
    can_view_classes: true,
    can_access_menu_management: false,
    can_access_operations: true,
    can_access_workforce: true,
    can_access_content_management: false,
    can_access_career_management: false,
    can_access_investment: false,
    can_access_settings: false,
    operations_classes_read_only: true,
    active: true,
    created_at: nowIso(),
  },
  {
    id: 'tm_host_lead',
    user_id: DEFAULT_HOST_LEAD_USER_ID,
    email: DEFAULT_HOST_LEAD_EMAIL,
    name: 'Kai Morgan',
    title: 'Lead Host',
    portal: 'host',
    can_view_reservations: true,
    can_view_events_parties: true,
    can_view_classes: true,
    can_access_menu_management: false,
    can_access_operations: true,
    can_access_workforce: true,
    can_access_content_management: false,
    can_access_career_management: false,
    can_access_investment: false,
    can_access_settings: false,
    operations_classes_read_only: true,
    active: true,
    created_at: nowIso(),
  },
  {
    id: 'tm_line_cook',
    user_id: DEFAULT_LINE_COOK_USER_ID,
    email: DEFAULT_LINE_COOK_EMAIL,
    name: 'Marco Diaz',
    title: 'Line Cook',
    portal: 'staff',
    can_view_reservations: false,
    can_view_events_parties: false,
    can_view_classes: false,
    can_access_menu_management: false,
    can_access_operations: true,
    can_access_workforce: true,
    can_access_content_management: false,
    can_access_career_management: false,
    can_access_investment: false,
    can_access_settings: false,
    operations_classes_read_only: true,
    active: true,
    created_at: nowIso(),
  },
  {
    id: 'tm_bartender',
    user_id: DEFAULT_BARTENDER_USER_ID,
    email: DEFAULT_BARTENDER_EMAIL,
    name: 'Nina Park',
    title: 'Bartender',
    portal: 'staff',
    can_view_reservations: false,
    can_view_events_parties: true,
    can_view_classes: true,
    can_access_menu_management: false,
    can_access_operations: true,
    can_access_workforce: true,
    can_access_content_management: false,
    can_access_career_management: false,
    can_access_investment: false,
    can_access_settings: false,
    operations_classes_read_only: true,
    active: true,
    created_at: nowIso(),
  },
  {
    id: 'tm_server',
    user_id: DEFAULT_SERVER_USER_ID,
    email: DEFAULT_SERVER_EMAIL,
    name: 'Avery Cole',
    title: 'Server',
    portal: 'staff',
    can_view_reservations: true,
    can_view_events_parties: false,
    can_view_classes: false,
    can_access_menu_management: false,
    can_access_operations: true,
    can_access_workforce: true,
    can_access_content_management: false,
    can_access_career_management: false,
    can_access_investment: false,
    can_access_settings: false,
    operations_classes_read_only: true,
    active: true,
    created_at: nowIso(),
  },
];

const WORKFORCE_DEFAULT_LOCATION_ID = 'wf_loc_main';

const normalizeTimeValue = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '00:00:00';
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return '00:00:00';
};

const todayDateValue = () => new Date().toISOString().slice(0, 10);

const asDateTimeValue = (dateValue: string, timeValue: string) => `${dateValue}T${normalizeTimeValue(timeValue)}`;

const workforceRoleForTitle = (title: string) => {
  const normalized = String(title || '').trim().toLowerCase();

  if (normalized.includes('owner') || normalized.includes('manager')) return 'wf_role_manager';
  if (normalized.includes('lead host') || normalized.includes('host')) return 'wf_role_host';
  if (normalized.includes('bartender')) return 'wf_role_bartender';
  if (normalized.includes('line cook') || normalized.includes('cook')) return 'wf_role_line_cook';
  if (normalized.includes('server')) return 'wf_role_server';

  return 'wf_role_server';
};

const workforceStationForRole = (roleId: string) => {
  if (roleId === 'wf_role_manager') return 'wf_station_expo';
  if (roleId === 'wf_role_host') return 'wf_station_host';
  if (roleId === 'wf_role_bartender') return 'wf_station_bar';
  if (roleId === 'wf_role_line_cook') return 'wf_station_line';
  return 'wf_station_service';
};

const workforceRateForRole = (roleId: string) => {
  if (roleId === 'wf_role_manager') return 42;
  if (roleId === 'wf_role_host') return 24;
  if (roleId === 'wf_role_bartender') return 30;
  if (roleId === 'wf_role_line_cook') return 28;
  return 23;
};

const workforceShiftWindowForRole = (roleId: string) => {
  if (roleId === 'wf_role_manager') return { start: '14:00:00', end: '22:00:00' };
  if (roleId === 'wf_role_host') return { start: '17:00:00', end: '23:00:00' };
  if (roleId === 'wf_role_bartender') return { start: '16:00:00', end: '00:00:00' };
  if (roleId === 'wf_role_line_cook') return { start: '15:00:00', end: '23:00:00' };
  return { start: '17:00:00', end: '23:00:00' };
};

const buildDefaultWorkforceSeed = (teamMembers: PlainObject[]) => {
  const roleRows = [
    {
      id: 'wf_role_manager',
      name: 'Manager',
      department_id: 'wf_dept_management',
      default_station_id: 'wf_station_expo',
      labor_class: 'management',
      hourly_rate: 42,
      active: true,
      created_at: nowIso(),
    },
    {
      id: 'wf_role_host',
      name: 'Host',
      department_id: 'wf_dept_service',
      default_station_id: 'wf_station_host',
      labor_class: 'front_of_house',
      hourly_rate: 24,
      active: true,
      created_at: nowIso(),
    },
    {
      id: 'wf_role_server',
      name: 'Server',
      department_id: 'wf_dept_service',
      default_station_id: 'wf_station_service',
      labor_class: 'front_of_house',
      hourly_rate: 23,
      active: true,
      created_at: nowIso(),
    },
    {
      id: 'wf_role_bartender',
      name: 'Bartender',
      department_id: 'wf_dept_bar',
      default_station_id: 'wf_station_bar',
      labor_class: 'bar',
      hourly_rate: 30,
      active: true,
      created_at: nowIso(),
    },
    {
      id: 'wf_role_line_cook',
      name: 'Line Cook',
      department_id: 'wf_dept_kitchen',
      default_station_id: 'wf_station_line',
      labor_class: 'kitchen',
      hourly_rate: 28,
      active: true,
      created_at: nowIso(),
    },
    {
      id: 'wf_role_expo',
      name: 'Expo',
      department_id: 'wf_dept_kitchen',
      default_station_id: 'wf_station_expo',
      labor_class: 'kitchen',
      hourly_rate: 29,
      active: true,
      created_at: nowIso(),
    },
  ];

  const today = todayDateValue();

  const workforceEmployees = teamMembers.map((member) => {
    const roleId = workforceRoleForTitle(String(member.title || ''));
    const employeeId = `wf_emp_${String(member.id || createId('wf_emp')).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const normalizedEmail = String(member.email || '').trim().toLowerCase();
    return {
      id: employeeId,
      user_id: String(member.user_id || ''),
      email: String(member.email || ''),
      phone: String(member.phone || ''),
      name: String(member.name || 'Team Member'),
      title: String(member.title || 'Employee'),
      status: member.active === false ? 'inactive' : 'active',
      default_location_id: WORKFORCE_DEFAULT_LOCATION_ID,
      hire_date: today,
      pay_basis: 'hourly',
      hourly_rate: workforceRateForRole(roleId),
      pto_unit: 'hours',
      training_state: 'active',
      availability: 'Open availability',
      login_username: String(member.email || ''),
      login_password: DEFAULT_PASSWORD_BY_EMAIL[normalizedEmail] || '',
      attendance_score: 100,
      created_at: nowIso(),
    };
  });

  const employeeRoles = workforceEmployees.map((employee) => {
    const sourceMember = teamMembers.find((member) => String(member.user_id || '') === String(employee.user_id || '')) || {};
    const roleId = workforceRoleForTitle(String(sourceMember.title || employee.title || ''));
    return {
      id: `wf_er_${employee.id}`,
      employee_id: employee.id,
      role_id: roleId,
      hourly_rate: workforceRateForRole(roleId),
      primary_role: true,
      active: true,
      created_at: nowIso(),
    };
  });

  const shifts = employeeRoles.map((assignment) => {
    const shiftWindow = workforceShiftWindowForRole(String(assignment.role_id || ''));
    const stationId = workforceStationForRole(String(assignment.role_id || ''));
    return {
      id: `wf_shift_${assignment.employee_id}`,
      employee_id: assignment.employee_id,
      role_id: assignment.role_id,
      location_id: WORKFORCE_DEFAULT_LOCATION_ID,
      station_id: stationId,
      start_time: asDateTimeValue(today, shiftWindow.start),
      end_time: asDateTimeValue(today, shiftWindow.end),
      break_rules: 'ca_standard',
      wage_rate: workforceRateForRole(String(assignment.role_id || '')),
      hours_scheduled: 8,
      status: 'published',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
  });

  const ptoBalances = workforceEmployees.map((employee) => ({
    id: `wf_pto_${employee.id}`,
    employee_id: employee.id,
    accrued_hours: 80,
    used_hours: employee.id.endsWith('host_lead') ? 8 : 0,
    available_hours: employee.id.endsWith('host_lead') ? 72 : 80,
    pto_unit: 'hours',
    updated_at: nowIso(),
    created_at: nowIso(),
  }));

  const scheduleTemplates = [
    {
      id: 'wf_sched_tpl_weekday_pm',
      name: 'Weekday PM Core',
      location_id: WORKFORCE_DEFAULT_LOCATION_ID,
      created_by: 'system',
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];

  const scheduleTemplateShifts = [
    {
      id: 'wf_sched_tpl_shift_1',
      template_id: 'wf_sched_tpl_weekday_pm',
      day_offset: 1,
      employee_id: workforceEmployees[1]?.id || workforceEmployees[0]?.id || '',
      role_id: 'wf_role_host',
      station_id: 'wf_station_host',
      start_time: '17:00:00',
      end_time: '23:00:00',
      wage_rate: 24,
      created_at: nowIso(),
    },
    {
      id: 'wf_sched_tpl_shift_2',
      template_id: 'wf_sched_tpl_weekday_pm',
      day_offset: 1,
      employee_id: workforceEmployees[4]?.id || workforceEmployees[0]?.id || '',
      role_id: 'wf_role_bartender',
      station_id: 'wf_station_bar',
      start_time: '16:00:00',
      end_time: '00:00:00',
      wage_rate: 30,
      created_at: nowIso(),
    },
  ];

  return {
    workforce_locations: [
      {
        id: WORKFORCE_DEFAULT_LOCATION_ID,
        name: 'Spoonbill Lounge',
        timezone: 'America/Los_Angeles',
        active: true,
        created_at: nowIso(),
      },
    ],
    workforce_departments: [
      { id: 'wf_dept_management', name: 'Management', active: true, created_at: nowIso() },
      { id: 'wf_dept_service', name: 'Service', active: true, created_at: nowIso() },
      { id: 'wf_dept_bar', name: 'Bar', active: true, created_at: nowIso() },
      { id: 'wf_dept_kitchen', name: 'Kitchen', active: true, created_at: nowIso() },
    ],
    workforce_stations: [
      { id: 'wf_station_host', name: 'Host Stand', department_id: 'wf_dept_service', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_service', name: 'Main Floor', department_id: 'wf_dept_service', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_bar', name: 'Main Bar', department_id: 'wf_dept_bar', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_line', name: 'Hot Line', department_id: 'wf_dept_kitchen', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_expo', name: 'Expo', department_id: 'wf_dept_kitchen', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_dish', name: 'Dish', department_id: 'wf_dept_kitchen', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
    ],
    workforce_roles: roleRows,
    workforce_employees: workforceEmployees,
    workforce_employee_roles: employeeRoles,
    workforce_shift_templates: [
      {
        id: 'wf_tpl_prep_am',
        name: 'Prep AM',
        role_id: 'wf_role_line_cook',
        station_id: 'wf_station_line',
        start_time: '06:00:00',
        end_time: '14:00:00',
        active: true,
        created_at: nowIso(),
      },
      {
        id: 'wf_tpl_service_host',
        name: 'Host PM',
        role_id: 'wf_role_host',
        station_id: 'wf_station_host',
        start_time: '17:00:00',
        end_time: '23:00:00',
        active: true,
        created_at: nowIso(),
      },
      {
        id: 'wf_tpl_service_bar',
        name: 'Bar PM',
        role_id: 'wf_role_bartender',
        station_id: 'wf_station_bar',
        start_time: '16:00:00',
        end_time: '00:00:00',
        active: true,
        created_at: nowIso(),
      },
    ],
    workforce_shifts: shifts,
    workforce_schedule_templates: scheduleTemplates,
    workforce_schedule_template_shifts: scheduleTemplateShifts,
    workforce_punches: [],
    workforce_breaks: [],
    workforce_time_off_requests: [
      {
        id: 'wf_to_request_1',
        employee_id: workforceEmployees[2]?.id || workforceEmployees[0]?.id || '',
        request_type: 'day_off',
        start_date: today,
        end_date: today,
        hours: 8,
        status: 'approved',
        notes: 'Family event',
        created_at: nowIso(),
      },
    ],
    workforce_time_off_blocks: [],
    workforce_company_holidays: [],
    workforce_pto_balances: ptoBalances,
    workforce_employee_documents: [],
    workforce_tasks: [
      {
        id: 'wf_task_line_check',
        title: 'Line Check',
        assigned_role_id: 'wf_role_line_cook',
        location_id: WORKFORCE_DEFAULT_LOCATION_ID,
        station_id: 'wf_station_line',
        due_time: asDateTimeValue(today, '16:30:00'),
        completion_status: 'open',
        critical: true,
        created_at: nowIso(),
      },
      {
        id: 'wf_task_bar_open',
        title: 'Bar Setup + Garnish Prep',
        assigned_role_id: 'wf_role_bartender',
        location_id: WORKFORCE_DEFAULT_LOCATION_ID,
        station_id: 'wf_station_bar',
        due_time: asDateTimeValue(today, '16:00:00'),
        completion_status: 'open',
        critical: false,
        created_at: nowIso(),
      },
    ],
    workforce_log_entries: [
      {
        id: 'wf_log_bootstrap',
        author_name: 'System',
        timestamp: nowIso(),
        location_id: WORKFORCE_DEFAULT_LOCATION_ID,
        category: 'operations',
        severity: 'info',
        message: 'Workforce OS initialized with shared labor ledger.',
        created_at: nowIso(),
      },
    ],
    workforce_rules: [
      {
        id: 'wf_rule_ca_meal_1',
        rule_code: 'CA_MEAL_1',
        jurisdiction: 'CA',
        trigger_event: 'PUNCH',
        expression_json: '{"threshold_hours":5,"break_type":"meal"}',
        block_or_warn: 'warn',
        active: true,
        created_at: nowIso(),
      },
      {
        id: 'wf_rule_overtime_daily',
        rule_code: 'OT_DAILY',
        jurisdiction: 'CA',
        trigger_event: 'PUNCH',
        expression_json: '{"threshold_hours":8}',
        block_or_warn: 'warn',
        active: true,
        created_at: nowIso(),
      },
    ],
    workforce_events: [
      {
        id: 'wf_evt_bootstrap',
        event_type: 'WORKFORCE_BOOTSTRAP',
        actor_id: 'system',
        subject_type: 'workforce',
        subject_id: 'initial_seed',
        location_id: WORKFORCE_DEFAULT_LOCATION_ID,
        timestamp: nowIso(),
        metadata_json: '{"source":"default_seed"}',
        correlation_id: 'wf_corr_bootstrap',
        created_at: nowIso(),
      },
    ],
    workforce_dashboard_snapshots: [],
  };
};

const buildDefaultClassSessions = (events: PlainObject[]) =>
  events
    .filter((event) => event.booking_type === 'class')
    .map((event) => ({
      id: createId('class_session'),
      event_id: event.id,
      class_date: event.date,
      class_time: event.time,
      capacity_override: event.booking_capacity ?? null,
      minimum_override: event.booking_minimum ?? 1,
      active: true,
      created_at: nowIso(),
    }));

const buildDefaultDriveThruOrders = () => {
  return [];
};

const buildDefaultDb = () => {
  return {
    menu_categories: [],
    menu_items: [],
    tasting_menus: [],
    tasting_menu_courses: [],
    tasting_menu_items: [],
    tasting_menu_templates: [],
    tasting_menu_course_templates: [],
    events: [],
    class_sessions: buildDefaultClassSessions([]),
    time_slots: [],
    drive_thru_orders: buildDefaultDriveThruOrders(),
    reservations: [],
    event_bookings: [],
    class_bookings: [],
    tables: [],
    job_departments: [],
    job_types: [],
    job_listings: [],
    job_applications: [],
    investor_submissions: [],
    image_categories: [],
    images: [],
    image_metadata: [],
    admin_roles: [
      { id: 'role_owner', name: 'Owner', description: 'Full BOH access', created_at: nowIso() },
      { id: 'role_manager', name: 'Manager', description: 'Operational BOH access', created_at: nowIso() },
      { id: 'role_host', name: 'Host', description: 'Reservations, events, and classes BOH access', created_at: nowIso() },
      { id: 'role_staff', name: 'Staff', description: 'Limited staff access', created_at: nowIso() },
    ],
    admin_permissions: [],
    admin_role_permissions: [],
    admin_user_roles: [
      {
        id: 'aur_owner',
        user_id: DEFAULT_ADMIN_USER_ID,
        role_id: 'role_owner',
        created_at: nowIso(),
      },
    ],
    workforce_locations: [
      {
        id: WORKFORCE_DEFAULT_LOCATION_ID,
        name: 'Main Location',
        timezone: 'America/Los_Angeles',
        active: true,
        created_at: nowIso(),
      },
    ],
    workforce_departments: [
      { id: 'wf_dept_management', name: 'Management', active: true, created_at: nowIso() },
      { id: 'wf_dept_service', name: 'Service', active: true, created_at: nowIso() },
      { id: 'wf_dept_bar', name: 'Bar', active: true, created_at: nowIso() },
      { id: 'wf_dept_kitchen', name: 'Kitchen', active: true, created_at: nowIso() },
    ],
    workforce_stations: [
      { id: 'wf_station_host', name: 'Host Stand', department_id: 'wf_dept_service', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_service', name: 'Main Floor', department_id: 'wf_dept_service', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_bar', name: 'Main Bar', department_id: 'wf_dept_bar', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_line', name: 'Hot Line', department_id: 'wf_dept_kitchen', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_expo', name: 'Expo', department_id: 'wf_dept_kitchen', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
      { id: 'wf_station_dish', name: 'Dish', department_id: 'wf_dept_kitchen', location_id: WORKFORCE_DEFAULT_LOCATION_ID, active: true, created_at: nowIso() },
    ],
    workforce_roles: [
      {
        id: 'wf_role_team_member',
        name: 'Team Member',
        department_id: 'wf_dept_service',
        default_station_id: 'wf_station_service',
        labor_class: 'operations',
        role_section: 'General',
        display_order: 1,
        hourly_rate: 24,
        active: true,
        created_at: nowIso(),
      },
      {
        id: 'wf_role_supervisor',
        name: 'Supervisor',
        department_id: 'wf_dept_management',
        default_station_id: 'wf_station_service',
        labor_class: 'operations',
        role_section: 'General',
        display_order: 2,
        hourly_rate: 32,
        active: true,
        created_at: nowIso(),
      },
    ],
    workforce_employees: [],
    workforce_employee_roles: [],
    workforce_shift_templates: [],
    workforce_shifts: [],
    workforce_schedule_templates: [],
    workforce_schedule_template_shifts: [],
    workforce_punches: [],
    workforce_breaks: [],
    workforce_time_off_requests: [],
    workforce_time_off_blocks: [],
    workforce_company_holidays: [],
    workforce_pto_balances: [],
    workforce_employee_documents: [],
    workforce_tasks: [],
    workforce_log_entries: [],
    workforce_rules: [
      {
        id: 'wf_rule_ca_meal_1',
        rule_code: 'CA_MEAL_1',
        jurisdiction: 'CA',
        trigger_event: 'PUNCH',
        expression_json: '{"threshold_hours":5,"break_type":"meal"}',
        block_or_warn: 'warn',
        active: true,
        created_at: nowIso(),
      },
      {
        id: 'wf_rule_overtime_daily',
        rule_code: 'OT_DAILY',
        jurisdiction: 'CA',
        trigger_event: 'PUNCH',
        expression_json: '{"threshold_hours":8}',
        block_or_warn: 'warn',
        active: true,
        created_at: nowIso(),
      },
    ],
    workforce_events: [],
    workforce_dashboard_snapshots: [],
    team_members: [],
  };
};

const defaultUsers = () => defaultLocalUsers();

const storageAvailable = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const loadJson = (key: string, fallbackFactory: () => any) => {
  if (!storageAvailable()) {
    return fallbackFactory();
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      const value = fallbackFactory();
      window.localStorage.setItem(key, JSON.stringify(value));
      return value;
    }
    return JSON.parse(raw);
  } catch {
    const value = fallbackFactory();
    window.localStorage.setItem(key, JSON.stringify(value));
    return value;
  }
};

const persistJson = (key: string, value: any) => {
  if (!storageAvailable()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const splitToList = (value: any) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|;/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseSalaryRange = (rawSalaryRange: any) => {
  if (typeof rawSalaryRange !== 'string' || !rawSalaryRange.trim()) {
    return {
      salary_min: null,
      salary_max: null,
      salary_type: null,
    };
  }

  const normalized = rawSalaryRange.toLowerCase();
  const numberMatches = Array.from(normalized.matchAll(/(\d+(?:\.\d+)?)\s*(k)?/g));

  const values = numberMatches
    .map((match) => {
      const numeric = Number.parseFloat(match[1]);
      if (!Number.isFinite(numeric)) return null;
      return match[2] ? numeric * 1000 : numeric;
    })
    .filter((value): value is number => value !== null);

  const salaryType = /\/\s*hr|hour/.test(normalized)
    ? 'hourly'
    : /\/\s*year|year|k/.test(normalized)
      ? 'yearly'
      : null;

  return {
    salary_min: values[0] ?? null,
    salary_max: values[1] ?? null,
    salary_type: salaryType,
  };
};

const normalizeDrinkName = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeDrinkKey = (name: string, price: number | null | undefined) =>
  `${normalizeDrinkName(name).toLowerCase()}|${price ?? ''}`;

const normalizeFoodName = (value: string) => value.replace(/\s+/g, ' ').trim();

const CURATED_DESSERT_ITEMS = [
  { name: 'Chocolate Lava Cake with Macadamia Nut Brittle', price: 14 },
  { name: 'Passion Fruit Creme Brulee', price: 14 },
  { name: 'Coconut Tres Leches Cake', price: 14 },
  { name: 'Grilled Pineapple with Rum Caramel and Coconut Ice Cream', price: 14 },
] as const;

const CODA_SIGNATURE_DRINKS = new Set([
  'Aloha Spirit Mai Tai',
  'Feathered Frenzy Zombie',
  "Flamingo's Fancy Planter's Punch",
]);

const CODA_HAPPY_HOUR_DRINKS = new Set([
  'Aloha Spirit Mai Tai',
  'Chirping Chi Chi',
  'Plumed Paradise Pina Colada',
  'Sapphire Skies Blue Hawaii',
]);

const CODA_FLIGHT_OFFERINGS = [
  {
    name: 'Tiki Classic',
    price: 45,
    description:
      'Aloha Spirit Mai Tai, Feathered Frenzy Zombie, and Tropic Wings Singapore Sling.',
    ingredients: ['Aloha Spirit Mai Tai', 'Feathered Frenzy Zombie', 'Tropic Wings Singapore Sling'],
  },
  {
    name: 'Tropical Fruit Adventure',
    price: 50,
    description:
      'Coral Canopy Reef, Plumed Paradise Pina Colada, and Sapphire Skies Blue Hawaii.',
    ingredients: ['Coral Canopy Reef', 'Plumed Paradise Pina Colada', 'Sapphire Skies Blue Hawaii'],
  },
  {
    name: 'Spoonbill Signature',
    price: 55,
    description:
      "Flamingo's Fancy Planter's Punch, Jungle Plumage Bird, and Opulent Oasis Pearl Diver.",
    ingredients: ["Flamingo's Fancy Planter's Punch", 'Jungle Plumage Bird', 'Opulent Oasis Pearl Diver'],
  },
] as const;

const CODA_ZERO_PROOF_ADDITIONS = [
  {
    name: 'Boylan Bottled Cane Colas',
    price: 5,
    description: 'Root Beer, Cane Cola, Ginger Ale, Cream Soda, Black Cherry.',
    ingredients: ['Root Beer', 'Cane Cola', 'Ginger Ale', 'Cream Soda', 'Black Cherry'],
  },
] as const;

const SPIRITS_SUBCATEGORY_SEEDS = [
  { id: 'cat_rum_light_white', name: 'Light & White Rums' },
  { id: 'cat_rum_dark', name: 'Dark Rums' },
  { id: 'cat_rum_gold', name: 'Gold Rums' },
  { id: 'cat_rum_overproof', name: 'Overproof Rums' },
  { id: 'cat_rum_premium_aged', name: 'Premium Aged Rums' },
  { id: 'cat_rum_agricole', name: 'Agricole Rums' },
  { id: 'cat_rum_spiced', name: 'Spiced Rums' },
  { id: 'cat_rum_specialty', name: 'Unique and Specialty Rums' },
  { id: 'cat_rum_flavored', name: 'Flavored Rums' },
  { id: 'cat_vodkas', name: 'Vodkas' },
  { id: 'cat_sherry', name: 'Sherry' },
  { id: 'cat_brandy', name: 'Brandy' },
  { id: 'cat_apricot_brandy', name: 'Apricot Brandy' },
  { id: 'cat_cherry_brandy', name: 'Cherry Brandy' },
  { id: 'cat_tequila_blanco', name: 'Tequila (Blanco/Silver)' },
  { id: 'cat_tequila_anejo', name: 'Anejo Tequila' },
  { id: 'cat_tequila_reposado', name: 'Reposado Tequila' },
  { id: 'cat_bourbon', name: 'Bourbon' },
  { id: 'cat_whiskey', name: 'Whiskey' },
  { id: 'cat_gin', name: 'Gin' },
  { id: 'cat_gin_international_craft', name: 'International and Craft Gins' },
  { id: 'cat_gin_american', name: 'American Gins' },
  { id: 'cat_gin_new_western', name: 'New Western (Modern) Gin' },
  { id: 'cat_gin_old_tom', name: 'Old Tom Gin' },
  { id: 'cat_gin_navy_strength', name: 'Navy Strength Gin' },
  { id: 'cat_gin_sloe', name: 'Sloe Gin' },
  { id: 'cat_grenadine', name: 'Grenadine' },
  { id: 'cat_mezcal', name: 'Mezcal' },
  { id: 'cat_pisco', name: 'Pisco' },
  { id: 'cat_sake_soju', name: 'Sake and Soju' },
  { id: 'cat_vermouth', name: 'Vermouth (Dry and Sweet)' },
  { id: 'cat_campari_aperol', name: 'Campari and Aperol' },
  { id: 'cat_amaretto', name: 'Amaretto' },
  { id: 'cat_triple_sec', name: 'Triple Sec' },
  { id: 'cat_falernum', name: 'Falernum' },
  { id: 'cat_aquavit', name: 'Aquavit' },
  { id: 'cat_chartreuse', name: 'Chartreuse' },
  { id: 'cat_maraschino_liqueur', name: 'Maraschino Liqueur' },
  { id: 'cat_rhum_clement', name: 'Rhum Clement' },
  { id: 'cat_port_wine', name: 'Port Wine' },
  { id: 'cat_curacao', name: 'Blue Curacao and Orange Curacao' },
  { id: 'cat_benedictine', name: 'Benedictine' },
  { id: 'cat_absinthe', name: 'Absinthe' },
  { id: 'cat_cointreau', name: 'Cointreau' },
  { id: 'cat_coffee_liqueur', name: 'Coffee Liqueur' },
  { id: 'cat_blackberry_liqueur', name: 'Blackberry Liqueur' },
  { id: 'cat_banana_liqueur', name: 'Banana Liqueur' },
] as const;

const BEER_WINE_SUBCATEGORY_SEEDS = [
  { id: 'cat_craft_beer', name: 'Craft Beer' },
  { id: 'cat_white_wines', name: 'White Wines' },
  { id: 'cat_red_wines', name: 'Red Wines' },
  { id: 'cat_rose_wines', name: 'Rose Wines' },
  { id: 'cat_sparkling_wines', name: 'Sparkling Wines' },
  { id: 'cat_champagne', name: 'Champagne' },
] as const;

const SPIRITS_ITEM_SEEDS = [
  { name: 'Bacardi Superior', category_id: 'cat_rum_light_white' },
  { name: 'Havana Club 3 Year Old', category_id: 'cat_rum_light_white' },
  { name: 'Plantation 3 Stars', category_id: 'cat_rum_light_white' },
  { name: 'Rhum J.M Blanc', category_id: 'cat_rum_light_white' },
  { name: "Myers's Original Dark", category_id: 'cat_rum_dark' },
  { name: "Gosling's Black Seal", category_id: 'cat_rum_dark' },
  { name: "Pusser's British Navy Rum", category_id: 'cat_rum_dark' },
  { name: 'Appleton Estate Reserve Blend', category_id: 'cat_rum_gold' },
  { name: 'Mount Gay Eclipse', category_id: 'cat_rum_gold' },
  { name: 'El Dorado 5-Year-Old', category_id: 'cat_rum_gold' },
  { name: 'Wray & Nephew Overproof', category_id: 'cat_rum_overproof' },
  { name: 'Plantation OFTD', category_id: 'cat_rum_overproof' },
  { name: 'Lemon Hart 151', category_id: 'cat_rum_overproof' },
  { name: 'Ron Zacapa 23 Solera', category_id: 'cat_rum_premium_aged' },
  { name: 'El Dorado 15-Year-Old', category_id: 'cat_rum_premium_aged' },
  { name: 'Appleton Estate 21-Year-Old', category_id: 'cat_rum_premium_aged' },
  { name: 'Rhum Clement VSOP', category_id: 'cat_rum_agricole' },
  { name: 'Rhum Barbancourt 5 Star', category_id: 'cat_rum_agricole' },
  { name: 'Sailor Jerry Spiced Rum', category_id: 'cat_rum_spiced' },
  { name: 'Kraken Black Spiced Rum', category_id: 'cat_rum_spiced' },
  { name: 'Diplomatico Reserva Exclusiva', category_id: 'cat_rum_specialty' },
  { name: "St. Lucia Distillers Chairman's Reserve", category_id: 'cat_rum_specialty' },
  { name: 'Rhum J.M XO', category_id: 'cat_rum_specialty' },
  { name: 'Malibu Coconut Rum', category_id: 'cat_rum_flavored' },
  { name: 'Bacardi Limon', category_id: 'cat_rum_flavored' },
  { name: 'Belvedere', category_id: 'cat_vodkas' },
  { name: 'Grey Goose', category_id: 'cat_vodkas' },
  { name: 'Ketel One', category_id: 'cat_vodkas' },
  { name: 'Stolichnaya Elit', category_id: 'cat_vodkas' },
  { name: 'Absolut Elyx', category_id: 'cat_vodkas' },
  { name: 'Chopin', category_id: 'cat_vodkas' },
  { name: 'Ciroc', category_id: 'cat_vodkas' },
  { name: 'Russian Standard Gold', category_id: 'cat_vodkas' },
  { name: "Tito's Handmade Vodka", category_id: 'cat_vodkas' },
  { name: 'Reyka', category_id: 'cat_vodkas' },
  { name: 'Crystal Head', category_id: 'cat_vodkas' },
  { name: 'Van Gogh Vodka', category_id: 'cat_vodkas' },
  { name: 'Purity Vodka', category_id: 'cat_vodkas' },
  { name: 'Zubrowka Bison Grass Vodka', category_id: 'cat_vodkas' },
  { name: 'Beluga Noble Russian Vodka', category_id: 'cat_vodkas' },
  { name: 'Fino', category_id: 'cat_sherry' },
  { name: 'Manzanilla', category_id: 'cat_sherry' },
  { name: 'Amontillado', category_id: 'cat_sherry' },
  { name: 'Oloroso', category_id: 'cat_sherry' },
  { name: 'Palo Cortado', category_id: 'cat_sherry' },
  { name: 'Pedro Ximenez (PX)', category_id: 'cat_sherry' },
  { name: 'Cream Sherry', category_id: 'cat_sherry' },
  { name: 'Moscatel', category_id: 'cat_sherry' },
  { name: 'Hennessy V.S.O.P Privilege', category_id: 'cat_brandy' },
  { name: 'Remy Martin VSOP', category_id: 'cat_brandy' },
  { name: 'Courvoisier VSOP', category_id: 'cat_brandy' },
  { name: 'Torres 10 Gran Reserva', category_id: 'cat_brandy' },
  { name: 'St-Remy VSOP', category_id: 'cat_brandy' },
  { name: 'Armagnac Castarede VSOP', category_id: 'cat_brandy' },
  { name: 'Paul Masson VSOP', category_id: 'cat_brandy' },
  { name: "Laird's Straight Apple Brandy", category_id: 'cat_brandy' },
  { name: 'Maraska Apricot Brandy', category_id: 'cat_apricot_brandy' },
  { name: "Rothman & Winter Orchard Apricot Liqueur", category_id: 'cat_apricot_brandy' },
  { name: "Briottet Creme d'Abricot (Apricot Cream)", category_id: 'cat_apricot_brandy' },
  { name: 'Giffard Abricot du Roussillon', category_id: 'cat_apricot_brandy' },
  { name: 'Cherry Heering', category_id: 'cat_cherry_brandy' },
  { name: 'Kirsch de Cuisine', category_id: 'cat_cherry_brandy' },
  { name: 'Leroux Cherry Brandy', category_id: 'cat_cherry_brandy' },
  { name: 'Massenez Kirsch Vieux', category_id: 'cat_cherry_brandy' },
  { name: 'Patron Silver', category_id: 'cat_tequila_blanco' },
  { name: 'Don Julio Blanco', category_id: 'cat_tequila_blanco' },
  { name: 'Herradura Silver', category_id: 'cat_tequila_blanco' },
  { name: 'Espolon Blanco', category_id: 'cat_tequila_blanco' },
  { name: 'Don Julio Anejo', category_id: 'cat_tequila_anejo' },
  { name: 'Patron Anejo', category_id: 'cat_tequila_anejo' },
  { name: 'Herradura Anejo', category_id: 'cat_tequila_anejo' },
  { name: 'Casa Noble Anejo', category_id: 'cat_tequila_anejo' },
  { name: 'Casamigos Reposado', category_id: 'cat_tequila_reposado' },
  { name: 'El Jimador Reposado', category_id: 'cat_tequila_reposado' },
  { name: 'Milagro Reposado', category_id: 'cat_tequila_reposado' },
  { name: '1800 Reposado', category_id: 'cat_tequila_reposado' },
  { name: 'Woodford Reserve', category_id: 'cat_bourbon' },
  { name: 'Buffalo Trace', category_id: 'cat_bourbon' },
  { name: "Maker's Mark", category_id: 'cat_bourbon' },
  { name: 'Bulleit Bourbon', category_id: 'cat_bourbon' },
  { name: "Jameson Irish Whiskey", category_id: 'cat_whiskey' },
  { name: 'Glenfiddich 12 Year Single Malt Scotch', category_id: 'cat_whiskey' },
  { name: 'Lagavulin 16 Year Old', category_id: 'cat_whiskey' },
  { name: "Jack Daniel's Tennessee Whiskey", category_id: 'cat_whiskey' },
  { name: 'Balvenie DoubleWood 12 Year Old', category_id: 'cat_whiskey' },
  { name: 'Ardbeg 10 Year Old', category_id: 'cat_whiskey' },
  { name: 'London Dry Gin', category_id: 'cat_gin' },
  { name: 'Tanqueray No. Ten', category_id: 'cat_gin' },
  { name: 'Beefeater London Dry', category_id: 'cat_gin' },
  { name: 'Sipsmith London Dry', category_id: 'cat_gin' },
  { name: "Hendrick's Gin (Scotland)", category_id: 'cat_gin_international_craft' },
  { name: 'Monkey 47 (Germany)', category_id: 'cat_gin_international_craft' },
  { name: 'The Botanist (Scotland)', category_id: 'cat_gin_international_craft' },
  { name: 'St. George Terroir Gin', category_id: 'cat_gin_american' },
  { name: 'Brooklyn Gin', category_id: 'cat_gin_american' },
  { name: 'Bluecoat American Dry Gin', category_id: 'cat_gin_american' },
  { name: 'Aviation American Gin', category_id: 'cat_gin_new_western' },
  { name: 'Roku Japanese Craft Gin', category_id: 'cat_gin_new_western' },
  { name: "G'Vine Floraison (France)", category_id: 'cat_gin_new_western' },
  { name: "Hayman's Old Tom Gin", category_id: 'cat_gin_old_tom' },
  { name: 'Ransom Old Tom Gin', category_id: 'cat_gin_old_tom' },
  { name: 'Plymouth Navy Strength', category_id: 'cat_gin_navy_strength' },
  { name: "Leopold's Navy Strength American Gin", category_id: 'cat_gin_navy_strength' },
  { name: 'Plymouth Sloe Gin', category_id: 'cat_gin_sloe' },
  { name: 'Sipsmith Sloe Gin', category_id: 'cat_gin_sloe' },
  { name: 'Monin Grenadine Syrup', category_id: 'cat_grenadine' },
  { name: 'Small Hand Foods Grenadine', category_id: 'cat_grenadine' },
  { name: 'Homemade Grenadine', category_id: 'cat_grenadine' },
  { name: 'Del Maguey Vida', category_id: 'cat_mezcal' },
  { name: 'Monte Alban Mezcal', category_id: 'cat_mezcal' },
  { name: 'El Jolgorio', category_id: 'cat_mezcal' },
  { name: 'Pisco Porton', category_id: 'cat_pisco' },
  { name: 'Barsol Pisco', category_id: 'cat_pisco' },
  { name: 'La Caravedo Puro Quebranta', category_id: 'cat_pisco' },
  { name: 'Junmai and Ginjo Sake', category_id: 'cat_sake_soju' },
  { name: 'Chamisul Soju', category_id: 'cat_sake_soju' },
  { name: 'Yamamoto Pure Black Soju', category_id: 'cat_sake_soju' },
  { name: 'Dolin Vermouth', category_id: 'cat_vermouth' },
  { name: 'Carpano Antica Formula', category_id: 'cat_vermouth' },
  { name: 'Noilly Prat Dry Vermouth', category_id: 'cat_vermouth' },
  { name: 'Select', category_id: 'cat_campari_aperol' },
  { name: 'Cynar', category_id: 'cat_campari_aperol' },
  { name: 'Disaronno', category_id: 'cat_amaretto' },
  { name: 'Lazzaroni Amaretto', category_id: 'cat_amaretto' },
  { name: 'Luxardo Triplum', category_id: 'cat_triple_sec' },
  { name: 'Cointreau', category_id: 'cat_triple_sec' },
  { name: "John D. Taylor's Velvet Falernum", category_id: 'cat_falernum' },
  { name: "BG Reynolds' Falernum", category_id: 'cat_falernum' },
  { name: 'Linie Aquavit', category_id: 'cat_aquavit' },
  { name: 'Krogstad Festlig Aquavit', category_id: 'cat_aquavit' },
  { name: 'Green Chartreuse', category_id: 'cat_chartreuse' },
  { name: 'Yellow Chartreuse', category_id: 'cat_chartreuse' },
  { name: 'Luxardo Maraschino', category_id: 'cat_maraschino_liqueur' },
  { name: 'Maraska Maraschino', category_id: 'cat_maraschino_liqueur' },
  { name: 'Rhum Clement V.S.O.P.', category_id: 'cat_rhum_clement' },
  { name: 'Rhum J.', category_id: 'cat_rhum_clement' },
  { name: 'Taylor Fladgate', category_id: 'cat_port_wine' },
  { name: "Graham's", category_id: 'cat_port_wine' },
  { name: 'Senior & Co. Genuine Blue Curacao', category_id: 'cat_curacao' },
  { name: 'Bols Blue Curacao', category_id: 'cat_curacao' },
  { name: 'Pierre Ferrand Dry Curacao', category_id: 'cat_curacao' },
  { name: 'B&B (Benedictine & Brandy)', category_id: 'cat_benedictine' },
  { name: 'Benedictine Single Cask', category_id: 'cat_benedictine' },
  { name: 'Pernod Absinthe', category_id: 'cat_absinthe' },
  { name: 'St. George Absinthe Verte', category_id: 'cat_absinthe' },
  { name: 'La Fee Absinthe Parisienne', category_id: 'cat_absinthe' },
  { name: 'Cointreau Noir', category_id: 'cat_cointreau' },
  { name: 'Grand Marnier', category_id: 'cat_cointreau' },
  { name: 'Kahlua', category_id: 'cat_coffee_liqueur' },
  { name: 'Patron XO Cafe', category_id: 'cat_coffee_liqueur' },
  { name: 'Tia Maria', category_id: 'cat_coffee_liqueur' },
  { name: 'Chambord', category_id: 'cat_blackberry_liqueur' },
  { name: 'Leopold Bros. Blackberry Liqueur', category_id: 'cat_blackberry_liqueur' },
  { name: 'Creme de Mure', category_id: 'cat_blackberry_liqueur' },
  { name: 'Giffard Banane du Bresil', category_id: 'cat_banana_liqueur' },
  { name: '99 Bananas', category_id: 'cat_banana_liqueur' },
  { name: 'Tempus Fugit Spirits Creme de Banane', category_id: 'cat_banana_liqueur' },
] as const;

const BEER_WINE_ITEM_SEEDS = [
  { name: 'Kiwi-Strawberry (Jiant Hard Tea)', category_id: 'cat_craft_beer' },
  { name: 'Super Bad Apple (2 Towns Ciderhouse)', category_id: 'cat_craft_beer' },
  { name: 'Ube Mango Cheesecake (Kings / XUL)', category_id: 'cat_craft_beer' },
  { name: 'Toast Points (Highland Park / Moonlight)', category_id: 'cat_craft_beer' },
  { name: 'The Lightest One (Enegren Brewing)', category_id: 'cat_craft_beer' },
  { name: 'Del Valle (San Fernando Brewing)', category_id: 'cat_craft_beer' },
  { name: 'Hop Merchants Lager (Lawless Brewing)', category_id: 'cat_craft_beer' },
  { name: 'Tangible Passion (Riip Beer Co.)', category_id: 'cat_craft_beer' },
  { name: 'Vacant For Winter (Pizza Port Brewing)', category_id: 'cat_craft_beer' },
  { name: 'Super Cali (Riip Beer Co.)', category_id: 'cat_craft_beer' },
  { name: 'Sauvignon Blanc - Cloudy Bay (New Zealand)', category_id: 'cat_white_wines' },
  { name: 'Chardonnay - Cakebread Cellars (Napa Valley, USA)', category_id: 'cat_white_wines' },
  { name: 'Riesling - Dr. Loosen Blue Slate (Germany)', category_id: 'cat_white_wines' },
  { name: 'Pinot Grigio - Santa Margherita (Italy)', category_id: 'cat_white_wines' },
  { name: 'Viognier - Yalumba Y Series (Australia)', category_id: 'cat_white_wines' },
  { name: 'Pinot Noir - Domaine Serene Yamhill Cuvee (Oregon, USA)', category_id: 'cat_red_wines' },
  { name: 'Cabernet Sauvignon - Silver Oak (Alexander Valley, USA)', category_id: 'cat_red_wines' },
  { name: 'Merlot - Duckhorn Vineyards (Napa Valley, USA)', category_id: 'cat_red_wines' },
  { name: "Syrah - Penfolds Max's (Australia)", category_id: 'cat_red_wines' },
  { name: 'Malbec - Catena Zapata (Argentina)', category_id: 'cat_red_wines' },
  { name: 'Whispering Angel Rose (France)', category_id: 'cat_rose_wines' },
  { name: 'Rock Angel Rose (France)', category_id: 'cat_rose_wines' },
  { name: 'Miraval Rose (France)', category_id: 'cat_rose_wines' },
  { name: 'Minuty M Rose (France)', category_id: 'cat_rose_wines' },
  { name: 'Sacha Lichine Single Blend Rose (France)', category_id: 'cat_rose_wines' },
  { name: 'Prosecco - La Marca (Italy)', category_id: 'cat_sparkling_wines' },
  { name: 'Cava - Segura Viudas Brut Reserva (Spain)', category_id: 'cat_sparkling_wines' },
  { name: 'Franciacorta - Bellavista Alma Gran Cuvee (Italy)', category_id: 'cat_sparkling_wines' },
  { name: 'American Sparkling - Domaine Chandon Brut (California, USA)', category_id: 'cat_sparkling_wines' },
  { name: 'Sparkling Rose - Schramsberg Mirabelle Brut Rose (California, USA)', category_id: 'cat_sparkling_wines' },
  { name: 'Veuve Clicquot Brut Yellow Label', category_id: 'cat_champagne' },
  { name: 'Moet & Chandon Imperial', category_id: 'cat_champagne' },
  { name: 'Bollinger Special Cuvee', category_id: 'cat_champagne' },
  { name: 'Dom Perignon', category_id: 'cat_champagne' },
  { name: 'Taittinger La Francaise', category_id: 'cat_champagne' },
] as const;

const ensureCodaBeverageImport = (db: PlainObject) => {
  if (!Array.isArray(db.menu_categories) || !Array.isArray(db.menu_items)) {
    return false;
  }

  let changed = false;
  const now = nowIso();
  const categories = db.menu_categories as PlainObject[];
  const items = db.menu_items as PlainObject[];

  const ensureCategory = (config: {
    id: string;
    name: string;
    parent_id: string | null;
    display_order: number;
  }) => {
    let category =
      categories.find((entry) => entry.id === config.id) ||
      categories.find((entry) => entry.menu_type === 'drinks' && entry.name === config.name);

    if (!category) {
      category = {
        id: config.id,
        name: config.name,
        menu_type: 'drinks',
        display_order: config.display_order,
        parent_id: config.parent_id,
        active: true,
        created_at: now,
        updated_at: now,
      };
      categories.push(category);
      changed = true;
      return category.id;
    }

    if (category.menu_type !== 'drinks') {
      category.menu_type = 'drinks';
      changed = true;
    }
    if (category.name !== config.name) {
      category.name = config.name;
      changed = true;
    }
    if (category.parent_id !== config.parent_id) {
      category.parent_id = config.parent_id;
      changed = true;
    }
    if (category.display_order !== config.display_order) {
      category.display_order = config.display_order;
      changed = true;
    }
    if (category.active !== true) {
      category.active = true;
      changed = true;
    }
    if (!category.created_at) {
      category.created_at = now;
      changed = true;
    }
    if (!category.updated_at) {
      category.updated_at = now;
      changed = true;
    }

    return category.id;
  };

  const cocktailsCategoryId = ensureCategory({
    id: 'cat_cocktails',
    name: 'Cocktails',
    parent_id: null,
    display_order: 1,
  });
  const signatureCategoryId = ensureCategory({
    id: 'cat_signature',
    name: 'Signature',
    parent_id: cocktailsCategoryId,
    display_order: 1,
  });
  const happyHourCategoryId = ensureCategory({
    id: 'cat_happy_hour',
    name: 'Happy Hour',
    parent_id: cocktailsCategoryId,
    display_order: 2,
  });
  const flightsCategoryId = ensureCategory({
    id: 'cat_flights',
    name: 'Flights',
    parent_id: cocktailsCategoryId,
    display_order: 3,
  });
  const bowlsCategoryId = ensureCategory({
    id: 'cat_bowls',
    name: 'Bowls',
    parent_id: cocktailsCategoryId,
    display_order: 4,
  });
  const classicsCategoryId = ensureCategory({
    id: 'cat_classics',
    name: 'Classic',
    parent_id: cocktailsCategoryId,
    display_order: 5,
  });
  const zeroProofCategoryId = ensureCategory({
    id: 'cat_zero_proof',
    name: 'Zero Proof',
    parent_id: cocktailsCategoryId,
    display_order: 6,
  });

  const spiritsRootCategoryId = ensureCategory({
    id: 'cat_spirits',
    name: 'Spirits',
    parent_id: null,
    display_order: 2,
  });
  const beerWineRootCategoryId = ensureCategory({
    id: 'cat_beer_wine',
    name: 'Beer & Wine',
    parent_id: null,
    display_order: 3,
  });

  const spiritsSubcategoryIds = new Map<string, string>();
  SPIRITS_SUBCATEGORY_SEEDS.forEach((subcategory, index) => {
    const ensuredId = ensureCategory({
      id: subcategory.id,
      name: subcategory.name,
      parent_id: spiritsRootCategoryId,
      display_order: index + 1,
    });
    spiritsSubcategoryIds.set(subcategory.id, ensuredId);
  });

  BEER_WINE_SUBCATEGORY_SEEDS.forEach((subcategory, index) => {
    ensureCategory({
      id: subcategory.id,
      name: subcategory.name,
      parent_id: beerWineRootCategoryId,
      display_order: index + 1,
    });
  });

  const tequilaBlancoCategoryId = spiritsSubcategoryIds.get('cat_tequila_blanco') || 'cat_tequila_blanco';

  const legacyCategoryTargets: Record<string, string> = {
    'Signature Cocktails': signatureCategoryId,
    'Happy Hour Specials': happyHourCategoryId,
    'Cocktail Flights': flightsCategoryId,
    'Cocktail Bowls': bowlsCategoryId,
    'Bowls': bowlsCategoryId,
    'Classic Cocktails': classicsCategoryId,
    Agave: tequilaBlancoCategoryId,
  };

  for (const category of categories) {
    if (category.menu_type !== 'drinks') continue;
    const targetCategoryId = legacyCategoryTargets[category.name];
    if (!targetCategoryId || category.id === targetCategoryId) continue;

    for (const item of items) {
      if (item.category_id === category.id) {
        item.category_id = targetCategoryId;
        item.updated_at = now;
        changed = true;
      }
    }

    if (category.active !== false) {
      category.active = false;
      category.updated_at = now;
      changed = true;
    }
  }

  for (const item of items) {
    if (item.menu_type !== 'drinks' || typeof item.name !== 'string') continue;
    if (!/\bbowl\b/i.test(item.name)) continue;
    if (item.category_id === bowlsCategoryId) continue;
    item.category_id = bowlsCategoryId;
    item.updated_at = now;
    changed = true;
  }

  const existingDrinkByKey = new Map<string, PlainObject>();
  const existingDrinksByName = new Map<string, PlainObject[]>();
  items
    .filter((item) => item.menu_type === 'drinks')
    .forEach((item) => {
      const name = typeof item.name === 'string' ? normalizeDrinkName(item.name) : '';
      const key = normalizeDrinkKey(name, item.price);
      if (!existingDrinkByKey.has(key)) {
        existingDrinkByKey.set(key, item);
      }
      const nameKey = name.toLowerCase();
      const list = existingDrinksByName.get(nameKey) || [];
      list.push(item);
      existingDrinksByName.set(nameKey, list);
    });

  for (const imported of CODA_BEVERAGE_IMPORT) {
    const name = normalizeDrinkName(imported.name);
    const price = Number(imported.price);
    const alcoholContent = Number.isFinite(imported.alcohol_content) ? imported.alcohol_content : null;
    const description = imported.description ? imported.description.trim() : null;
    const ingredients = imported.ingredients
      .map((ingredient) => normalizeDrinkName(ingredient))
      .filter(Boolean);
    const isSignature = CODA_SIGNATURE_DRINKS.has(name);
    const isHappyHour = CODA_HAPPY_HOUR_DRINKS.has(name);
    const isBowl = /\bbowl\b/i.test(name);
    const flightGroup = imported.flight ? normalizeDrinkName(imported.flight) : null;

    const categoryId = imported.non_alcoholic
      ? zeroProofCategoryId
      : isBowl
        ? bowlsCategoryId
      : isHappyHour
        ? happyHourCategoryId
        : isSignature
          ? signatureCategoryId
          : classicsCategoryId;
    const itemKey = normalizeDrinkKey(name, price);
    let existing = existingDrinkByKey.get(itemKey);
    if (!existing) {
      const sameNameItems = existingDrinksByName.get(name.toLowerCase()) || [];
      if (sameNameItems.length === 1) {
        existing = sameNameItems[0];
      }
    }

    if (!existing) {
      items.push({
        id: `item_${slug(`${name}-${price}`)}`,
        name,
        description,
        price,
        bottle_price: null,
        image_url: null,
        menu_type: 'drinks',
        show_price: true,
        show_description: true,
        active: true,
        ingredients,
        alcohol_content: alcoholContent,
        garnish: null,
        category_id: categoryId,
        coda_signature: isSignature,
        coda_happy_hour: isHappyHour,
        coda_flight_group: flightGroup,
        allergens: null,
        is_vegetarian: true,
        is_vegan: true,
        is_gluten_free: true,
        created_at: now,
        updated_at: now,
      });
      changed = true;
      continue;
    }

    // Keep BOH edits intact for existing records; only fill missing essentials.
    let itemChanged = false;
    const ensureField = (field: string, value: any) => {
      const current = existing[field];
      if (current === undefined || current === null || current === '') {
        existing[field] = value;
        itemChanged = true;
      }
    };

    ensureField('name', name);
    ensureField('description', description);
    ensureField('price', price);
    ensureField('menu_type', 'drinks');
    ensureField('show_price', true);
    ensureField('show_description', true);
    ensureField('active', true);
    ensureField('ingredients', ingredients);
    ensureField('alcohol_content', alcoholContent);
    ensureField('category_id', categoryId);
    ensureField('coda_signature', isSignature);
    ensureField('coda_happy_hour', isHappyHour);
    ensureField('coda_flight_group', flightGroup);

    if (!existing.created_at) {
      existing.created_at = now;
      itemChanged = true;
    }
    if (itemChanged) {
      existing.updated_at = now;
      changed = true;
    }
  }

  const upsertCuratedDrink = (config: {
    name: string;
    description: string | null;
    price: number;
    category_id: string;
    ingredients: string[];
    alcohol_content: number | null;
    coda_signature: boolean;
    coda_happy_hour: boolean;
    coda_flight_group: string | null;
  }) => {
    const name = normalizeDrinkName(config.name);
    const key = normalizeDrinkKey(name, config.price);

    let existing = items.find((item) => {
      if (item.menu_type !== 'drinks') return false;
      const itemName = typeof item.name === 'string' ? normalizeDrinkName(item.name) : '';
      return normalizeDrinkKey(itemName, item.price) === key;
    });
    if (!existing) {
      existing = items.find((item) => {
        if (item.menu_type !== 'drinks') return false;
        const itemName = typeof item.name === 'string' ? normalizeDrinkName(item.name) : '';
        return itemName.toLowerCase() === name.toLowerCase();
      });
    }

    if (!existing) {
      existing = {
        id: `item_${slug(`${name}-${config.price}`)}`,
        name,
        description: config.description,
        price: config.price,
        bottle_price: null,
        image_url: null,
        menu_type: 'drinks',
        show_price: true,
        show_description: true,
        active: true,
        ingredients: config.ingredients,
        alcohol_content: config.alcohol_content,
        garnish: null,
        category_id: config.category_id,
        coda_signature: config.coda_signature,
        coda_happy_hour: config.coda_happy_hour,
        coda_flight_group: config.coda_flight_group,
        allergens: null,
        is_vegetarian: true,
        is_vegan: true,
        is_gluten_free: true,
        created_at: now,
        updated_at: now,
      };
      items.push(existing);
      changed = true;
      return;
    }

    // Preserve BOH edits (price, lineup, etc.) for curated rows once seeded.
    let itemChanged = false;
    const ensureField = (field: string, value: any) => {
      const current = existing[field];
      if (current === undefined || current === null || current === '') {
        existing[field] = value;
        itemChanged = true;
      }
    };

    ensureField('menu_type', 'drinks');
    ensureField('show_price', true);
    ensureField('show_description', true);
    ensureField('active', true);
    ensureField('category_id', config.category_id);
    ensureField('coda_flight_group', config.coda_flight_group);

    if (!existing.created_at) {
      existing.created_at = now;
      itemChanged = true;
    }
    if (itemChanged) {
      existing.updated_at = now;
      changed = true;
    }
  };

  for (const flight of CODA_FLIGHT_OFFERINGS) {
    upsertCuratedDrink({
      name: flight.name,
      description: flight.description,
      price: flight.price,
      category_id: flightsCategoryId,
      ingredients: flight.ingredients.map((item) => normalizeDrinkName(item)).filter(Boolean),
      alcohol_content: null,
      coda_signature: false,
      coda_happy_hour: false,
      coda_flight_group: normalizeDrinkName(flight.name),
    });
  }

  for (const zeroProof of CODA_ZERO_PROOF_ADDITIONS) {
    upsertCuratedDrink({
      name: zeroProof.name,
      description: zeroProof.description,
      price: zeroProof.price,
      category_id: zeroProofCategoryId,
      ingredients: zeroProof.ingredients.map((item) => normalizeDrinkName(item)).filter(Boolean),
      alcohol_content: 0,
      coda_signature: false,
      coda_happy_hour: false,
      coda_flight_group: null,
    });
  }

  const upsertCatalogDrink = (config: {
    name: string;
    category_id: string;
    description?: string | null;
    price?: number | null;
    show_price?: boolean;
    ingredients?: string[] | null;
    alcohol_content?: number | null;
  }) => {
    const name = normalizeDrinkName(config.name);
    let existing = items.find((item) => {
      if (item.menu_type !== 'drinks') return false;
      const itemName = typeof item.name === 'string' ? normalizeDrinkName(item.name) : '';
      return itemName.toLowerCase() === name.toLowerCase();
    });

    if (!existing) {
      existing = {
        id: `item_${slug(name)}`,
        name,
        description: config.description ?? null,
        price: config.price ?? null,
        bottle_price: null,
        image_url: null,
        menu_type: 'drinks',
        show_price: config.show_price ?? config.price != null,
        show_description: Boolean(config.description),
        active: true,
        ingredients: config.ingredients ?? null,
        alcohol_content: config.alcohol_content ?? null,
        garnish: null,
        category_id: config.category_id,
        coda_signature: false,
        coda_happy_hour: false,
        coda_flight_group: null,
        allergens: null,
        is_vegetarian: true,
        is_vegan: true,
        is_gluten_free: true,
        created_at: now,
        updated_at: now,
      };
      items.push(existing);
      changed = true;
      return;
    }

    let itemChanged = false;
    const ensureField = (field: string, value: any) => {
      const current = existing[field];
      if (current === undefined || current === null || current === '') {
        existing[field] = value;
        itemChanged = true;
      }
    };

    ensureField('menu_type', 'drinks');
    ensureField('active', true);
    ensureField('show_price', config.show_price ?? config.price != null);
    ensureField('show_description', Boolean(config.description));
    ensureField('price', config.price ?? null);
    ensureField('description', config.description ?? null);
    ensureField('ingredients', config.ingredients ?? null);
    ensureField('alcohol_content', config.alcohol_content ?? null);
    ensureField('category_id', config.category_id);

    if (!existing.created_at) {
      existing.created_at = now;
      itemChanged = true;
    }
    if (itemChanged) {
      existing.updated_at = now;
      changed = true;
    }
  };

  for (const item of SPIRITS_ITEM_SEEDS) {
    upsertCatalogDrink({
      name: item.name,
      category_id: item.category_id,
      show_price: false,
      alcohol_content: null,
    });
  }

  for (const item of BEER_WINE_ITEM_SEEDS) {
    upsertCatalogDrink({
      name: item.name,
      category_id: item.category_id,
      show_price: false,
      alcohol_content: null,
    });
  }

  return changed;
};

const ensureCodaFoodImport = (db: PlainObject) => {
  if (!Array.isArray(db.menu_categories) || !Array.isArray(db.menu_items)) {
    return false;
  }

  let changed = false;
  const now = nowIso();
  const categories = db.menu_categories as PlainObject[];
  const items = db.menu_items as PlainObject[];

  const ensureCategory = (config: {
    id: string;
    name: string;
    parent_id: string | null;
    display_order: number;
  }) => {
    let category =
      categories.find((entry) => entry.id === config.id) ||
      categories.find((entry) => entry.menu_type === 'food' && entry.name === config.name);

    if (!category) {
      category = {
        id: config.id,
        name: config.name,
        menu_type: 'food',
        display_order: config.display_order,
        parent_id: config.parent_id,
        active: true,
        created_at: now,
        updated_at: now,
      };
      categories.push(category);
      changed = true;
      return category.id;
    }

    if (category.menu_type !== 'food') {
      category.menu_type = 'food';
      changed = true;
    }
    if (category.name !== config.name) {
      category.name = config.name;
      changed = true;
    }
    if (category.parent_id !== config.parent_id) {
      category.parent_id = config.parent_id;
      changed = true;
    }
    if (category.display_order !== config.display_order) {
      category.display_order = config.display_order;
      changed = true;
    }
    if (category.active !== true) {
      category.active = true;
      changed = true;
    }
    if (!category.created_at) {
      category.created_at = now;
      changed = true;
    }
    if (!category.updated_at) {
      category.updated_at = now;
      changed = true;
    }

    return category.id;
  };

  const cuisineRootCategoryId = ensureCategory({
    id: 'cat_cuisine',
    name: 'Cuisine',
    parent_id: null,
    display_order: 1,
  });

  const cuisineSubcategoryIds = new Map<string, string>();
  CUISINE_SUBCATEGORY_SEEDS.forEach((subcategory) => {
    const parentId =
      subcategory.parent_id === 'cat_cuisine'
        ? cuisineRootCategoryId
        : cuisineSubcategoryIds.get(subcategory.parent_id) || subcategory.parent_id;
    const ensuredId = ensureCategory({
      id: subcategory.id,
      name: subcategory.name,
      parent_id: parentId,
      display_order: subcategory.display_order,
    });
    cuisineSubcategoryIds.set(subcategory.id, ensuredId);
  });

  const categoryIdTargets: Record<string, string | null> = {
    cat_small_plates: cuisineSubcategoryIds.get('cat_food_small_plates') || 'cat_food_small_plates',
    cat_entrees: cuisineSubcategoryIds.get('cat_food_main') || 'cat_food_main',
    cat_food_small_plates:
      cuisineSubcategoryIds.get('cat_food_small_plates') || 'cat_food_small_plates',
    cat_food_appetizer: cuisineSubcategoryIds.get('cat_food_appetizer') || 'cat_food_appetizer',
    cat_food_salad_and_soup:
      cuisineSubcategoryIds.get('cat_food_soup_salad') || 'cat_food_soup_salad',
    cat_food_salads: cuisineSubcategoryIds.get('cat_food_soup_salad') || 'cat_food_soup_salad',
    cat_food_main: cuisineSubcategoryIds.get('cat_food_main') || 'cat_food_main',
    cat_food_main_sea: cuisineSubcategoryIds.get('cat_food_main_sea') || 'cat_food_main_sea',
    cat_food_main_land: cuisineSubcategoryIds.get('cat_food_main_land') || 'cat_food_main_land',
    cat_food_sides: cuisineSubcategoryIds.get('cat_food_sides') || 'cat_food_sides',
    cat_food_shareable: cuisineSubcategoryIds.get('cat_food_shareable') || 'cat_food_shareable',
    cat_food_shareable_platters:
      cuisineSubcategoryIds.get('cat_food_shareable') || 'cat_food_shareable',
    cat_food_raw_bar: cuisineSubcategoryIds.get('cat_food_raw_bar') || 'cat_food_raw_bar',
    cat_food_bowls: cuisineSubcategoryIds.get('cat_food_bowls_rolls') || 'cat_food_bowls_rolls',
    cat_food_roll: cuisineSubcategoryIds.get('cat_food_bowls_rolls') || 'cat_food_bowls_rolls',
    cat_food_bowls_rolls:
      cuisineSubcategoryIds.get('cat_food_bowls_rolls') || 'cat_food_bowls_rolls',
    cat_food_dessert:
      cuisineSubcategoryIds.get('cat_food_dessert') || 'cat_food_dessert',
    cat_food_prefix: null,
  };

  const categoryNameTargets: Record<string, string | null> = {
    'small plate':
      cuisineSubcategoryIds.get('cat_food_small_plates') || 'cat_food_small_plates',
    'small plates':
      cuisineSubcategoryIds.get('cat_food_small_plates') || 'cat_food_small_plates',
    entrees: cuisineSubcategoryIds.get('cat_food_main') || 'cat_food_main',
    appetizer: cuisineSubcategoryIds.get('cat_food_appetizer') || 'cat_food_appetizer',
    'salad & soup': cuisineSubcategoryIds.get('cat_food_soup_salad') || 'cat_food_soup_salad',
    'soup & salad': cuisineSubcategoryIds.get('cat_food_soup_salad') || 'cat_food_soup_salad',
    salads: cuisineSubcategoryIds.get('cat_food_soup_salad') || 'cat_food_soup_salad',
    main: cuisineSubcategoryIds.get('cat_food_main') || 'cat_food_main',
    'main - sea': cuisineSubcategoryIds.get('cat_food_main_sea') || 'cat_food_main_sea',
    'main - land': cuisineSubcategoryIds.get('cat_food_main_land') || 'cat_food_main_land',
    sides: cuisineSubcategoryIds.get('cat_food_sides') || 'cat_food_sides',
    sharable: cuisineSubcategoryIds.get('cat_food_shareable') || 'cat_food_shareable',
    shareable: cuisineSubcategoryIds.get('cat_food_shareable') || 'cat_food_shareable',
    'shareable platters':
      cuisineSubcategoryIds.get('cat_food_shareable') || 'cat_food_shareable',
    'raw bar': cuisineSubcategoryIds.get('cat_food_raw_bar') || 'cat_food_raw_bar',
    bowl: cuisineSubcategoryIds.get('cat_food_bowls_rolls') || 'cat_food_bowls_rolls',
    bowls: cuisineSubcategoryIds.get('cat_food_bowls_rolls') || 'cat_food_bowls_rolls',
    roll: cuisineSubcategoryIds.get('cat_food_bowls_rolls') || 'cat_food_bowls_rolls',
    rolls: cuisineSubcategoryIds.get('cat_food_bowls_rolls') || 'cat_food_bowls_rolls',
    'bowls / rolls':
      cuisineSubcategoryIds.get('cat_food_bowls_rolls') || 'cat_food_bowls_rolls',
    dessert: cuisineSubcategoryIds.get('cat_food_dessert') || 'cat_food_dessert',
    desserts: cuisineSubcategoryIds.get('cat_food_dessert') || 'cat_food_dessert',
    prefix: null,
  };

  const remapFoodCategoryId = (categoryId: string | null | undefined) => {
    if (!categoryId) return null;
    if (Object.prototype.hasOwnProperty.call(categoryIdTargets, categoryId)) {
      return categoryIdTargets[categoryId];
    }
    if (cuisineSubcategoryIds.has(categoryId)) {
      return cuisineSubcategoryIds.get(categoryId) || categoryId;
    }
    return undefined;
  };

  const remapFoodCategoryName = (categoryName: string | null | undefined) => {
    if (!categoryName) return undefined;
    const normalized = normalizeFoodName(String(categoryName)).toLowerCase();
    if (!normalized) return undefined;
    if (Object.prototype.hasOwnProperty.call(categoryNameTargets, normalized)) {
      return categoryNameTargets[normalized];
    }
    return undefined;
  };

  for (const category of categories) {
    if (category.menu_type !== 'food') continue;

    const targetCategoryId =
      remapFoodCategoryId(category.id) ?? remapFoodCategoryName(category.name);
    if (targetCategoryId === undefined) continue;

    if (targetCategoryId === null) {
      for (const item of items) {
        if (item.category_id === category.id && item.active !== false) {
          item.active = false;
          item.updated_at = now;
          changed = true;
        }
      }

      if (category.active !== false) {
        category.active = false;
        category.updated_at = now;
        changed = true;
      }
      continue;
    }

    if (category.id !== targetCategoryId) {
      for (const item of items) {
        if (item.category_id === category.id) {
          item.category_id = targetCategoryId;
          item.updated_at = now;
          changed = true;
        }
      }

      if (category.active !== false) {
        category.active = false;
        category.updated_at = now;
        changed = true;
      }
    }
  }

  const existingFoodByName = new Map<string, PlainObject>();
  items
    .filter((item) => item.menu_type === 'food')
    .forEach((item) => {
      const normalizedName = normalizeFoodName(String(item.name || '')).toLowerCase();
      if (!normalizedName || existingFoodByName.has(normalizedName)) return;
      existingFoodByName.set(normalizedName, item);
    });

  for (const imported of CODA_FOOD_ITEM_SEEDS) {
    const name = normalizeFoodName(imported.name);
    if (!name) continue;

    const importedPrice =
      typeof imported.price === 'number' && Number.isFinite(imported.price)
        ? imported.price
        : null;
    const importedDescription =
      typeof imported.description === 'string' && imported.description.trim()
        ? imported.description.trim()
        : null;
    const remappedImportedCategoryId = remapFoodCategoryId(imported.category_id);
    const categoryId =
      remappedImportedCategoryId === undefined
        ? cuisineSubcategoryIds.get(imported.category_id) || imported.category_id
        : remappedImportedCategoryId;
    const dietText = `${name} ${importedDescription || ''}`.toLowerCase();
    const inferredVegan = /\bvegan\b/.test(dietText);
    const inferredVegetarian = inferredVegan || /\bvegetarian\b/.test(dietText);

    let existing = existingFoodByName.get(name.toLowerCase());

    if (!categoryId) {
      if (existing && existing.active !== false) {
        existing.active = false;
        existing.updated_at = now;
        changed = true;
      }
      continue;
    }

    if (!existing) {
      existing = {
        id: `item_${slug(`food-${name}`)}`,
        name,
        description: importedDescription,
        price: importedPrice,
        bottle_price: null,
        image_url: null,
        menu_type: 'food',
        show_price: true,
        show_description: true,
        active: true,
        ingredients: null,
        allergens: null,
        is_vegetarian: inferredVegetarian,
        is_vegan: inferredVegan,
        is_gluten_free: false,
        spice_level: null,
        portion_size: null,
        serves: null,
        alcohol_content: null,
        garnish: null,
        category_id: categoryId,
        created_at: now,
        updated_at: now,
      };
      items.push(existing);
      existingFoodByName.set(name.toLowerCase(), existing);
      changed = true;
      continue;
    }

    let itemChanged = false;
    const ensureField = (field: string, value: any) => {
      const current = existing[field];
      if (current === undefined || current === null || current === '') {
        existing[field] = value;
        itemChanged = true;
      }
    };

    ensureField('menu_type', 'food');
    ensureField('active', true);
    ensureField('show_price', true);
    ensureField('show_description', true);
    ensureField('name', name);
    ensureField('description', importedDescription);
    ensureField('price', importedPrice);
    ensureField('category_id', categoryId);
    ensureField('ingredients', null);
    ensureField('allergens', null);
    ensureField('spice_level', null);
    ensureField('portion_size', null);
    ensureField('serves', null);
    ensureField('is_vegetarian', inferredVegetarian);
    ensureField('is_vegan', inferredVegan);
    ensureField('is_gluten_free', false);

    const existingCategoryTarget = remapFoodCategoryId(existing.category_id);
    if (existingCategoryTarget === null) {
      if (existing.active !== false) {
        existing.active = false;
        itemChanged = true;
      }
    } else if (existingCategoryTarget && existing.category_id !== existingCategoryTarget) {
      existing.category_id = existingCategoryTarget;
      itemChanged = true;
    } else if (!existing.category_id) {
      existing.category_id = categoryId;
      itemChanged = true;
    }

    if (!existing.created_at) {
      existing.created_at = now;
      itemChanged = true;
    }
    if (itemChanged) {
      existing.updated_at = now;
      changed = true;
    }
  }

  const dessertCategoryId = cuisineSubcategoryIds.get('cat_food_dessert') || 'cat_food_dessert';
  const curatedDessertNameSet = new Set(
    CURATED_DESSERT_ITEMS.map((dessert) => normalizeFoodName(dessert.name).toLowerCase()),
  );
  const legacySeedDessertNameSet = new Set(
    CODA_FOOD_ITEM_SEEDS
      .filter((seedItem) => seedItem.category_id === 'cat_food_dessert')
      .map((seedItem) => normalizeFoodName(seedItem.name).toLowerCase()),
  );

  const findFoodItemByName = (name: string) =>
    items.find((item) => {
      if (item.menu_type !== 'food') return false;
      const itemName = normalizeFoodName(String(item.name || '')).toLowerCase();
      return itemName === name.toLowerCase();
    });

  for (const curatedDessert of CURATED_DESSERT_ITEMS) {
    const normalizedName = normalizeFoodName(curatedDessert.name);
    const nameKey = normalizedName.toLowerCase();
    const seedMatch = CODA_FOOD_ITEM_SEEDS.find(
      (item) => normalizeFoodName(item.name).toLowerCase() === nameKey,
    );
    const seededDescription =
      typeof seedMatch?.description === 'string' && seedMatch.description.trim()
        ? seedMatch.description.trim()
        : null;

    let existing = findFoodItemByName(normalizedName);
    if (!existing) {
      const dietText = `${normalizedName} ${seededDescription || ''}`.toLowerCase();
      const inferredVegan = /\bvegan\b/.test(dietText);
      const inferredVegetarian = inferredVegan || /\bvegetarian\b/.test(dietText);

      existing = {
        id: `item_${slug(`food-${normalizedName}`)}`,
        name: normalizedName,
        description: seededDescription,
        price: curatedDessert.price,
        bottle_price: null,
        image_url: null,
        menu_type: 'food',
        show_price: true,
        show_description: true,
        active: true,
        ingredients: null,
        allergens: null,
        is_vegetarian: inferredVegetarian,
        is_vegan: inferredVegan,
        is_gluten_free: false,
        spice_level: null,
        portion_size: null,
        serves: null,
        alcohol_content: null,
        garnish: null,
        category_id: dessertCategoryId,
        created_at: now,
        updated_at: now,
      };
      items.push(existing);
      existingFoodByName.set(nameKey, existing);
      changed = true;
      continue;
    }

    let itemChanged = false;
    if (existing.active !== true) {
      existing.active = true;
      itemChanged = true;
    }
    if (existing.menu_type !== 'food') {
      existing.menu_type = 'food';
      itemChanged = true;
    }
    if (existing.category_id !== dessertCategoryId) {
      existing.category_id = dessertCategoryId;
      itemChanged = true;
    }
    if (existing.price !== curatedDessert.price) {
      existing.price = curatedDessert.price;
      itemChanged = true;
    }
    if ((existing.description === undefined || existing.description === null || existing.description === '') && seededDescription) {
      existing.description = seededDescription;
      itemChanged = true;
    }
    if (existing.show_price !== true) {
      existing.show_price = true;
      itemChanged = true;
    }
    if (existing.show_description !== true) {
      existing.show_description = true;
      itemChanged = true;
    }
    if (!existing.created_at) {
      existing.created_at = now;
      itemChanged = true;
    }
    if (itemChanged) {
      existing.updated_at = now;
      changed = true;
    }
  }

  for (const item of items) {
    if (item.menu_type !== 'food') continue;
    const normalizedName = normalizeFoodName(String(item.name || '')).toLowerCase();
    if (!legacySeedDessertNameSet.has(normalizedName)) continue;
    if (curatedDessertNameSet.has(normalizedName)) continue;
    if (item.active !== false) {
      item.active = false;
      item.updated_at = now;
      changed = true;
    }
  }

  for (const item of items) {
    if (item.menu_type !== 'food') continue;
    if (item.id === 'item_crudo' || item.id === 'item_short_rib') {
      if (item.active !== false) {
        item.active = false;
        item.updated_at = now;
        changed = true;
      }
    }
  }

  return changed;
};

const ensureTastingMenuImport = (db: PlainObject) => {
  let changed = false;

  if (!Array.isArray(db.tasting_menus)) {
    db.tasting_menus = [];
    changed = true;
  }

  if (!Array.isArray(db.tasting_menu_courses)) {
    db.tasting_menu_courses = [];
    changed = true;
  }

  if (!Array.isArray(db.tasting_menu_items)) {
    db.tasting_menu_items = [];
    changed = true;
  }

  if (
    typeof db._migration_flags !== 'object' ||
    db._migration_flags === null ||
    Array.isArray(db._migration_flags)
  ) {
    db._migration_flags = {};
    changed = true;
  }

  if (db._migration_flags[TASTING_MENU_MIGRATION_FLAG] === true) {
    return changed;
  }

  const tastingSeed = seedTastings();
  const targetMenuIds = new Set(tastingSeed.menus.map((menu) => menu.id));
  const targetCourseIds = new Set(tastingSeed.courses.map((course) => course.id));
  const targetItemIds = new Set(tastingSeed.items.map((item) => item.id));

  const legacyCourseIds = new Set(
    db.tasting_menu_courses
      .filter(
        (course: PlainObject) =>
          targetMenuIds.has(course.menu_id) ||
          course.menu_id === 'tm_omakase' ||
          course.menu_id === 'tm_legacy_tasting_journey',
      )
      .map((course: PlainObject) => course.id),
  );

  const previousCourseCount = db.tasting_menu_courses.length;
  db.tasting_menu_courses = db.tasting_menu_courses.filter(
    (course: PlainObject) => !legacyCourseIds.has(course.id) && !targetCourseIds.has(course.id),
  );
  if (db.tasting_menu_courses.length !== previousCourseCount) {
    changed = true;
  }

  const previousItemCount = db.tasting_menu_items.length;
  db.tasting_menu_items = db.tasting_menu_items.filter(
    (item: PlainObject) =>
      !legacyCourseIds.has(item.course_id) &&
      !targetCourseIds.has(item.course_id) &&
      !targetItemIds.has(item.id),
  );
  if (db.tasting_menu_items.length !== previousItemCount) {
    changed = true;
  }

  const previousMenuCount = db.tasting_menus.length;
  db.tasting_menus = db.tasting_menus.filter((menu: PlainObject) => !targetMenuIds.has(menu.id));
  if (db.tasting_menus.length !== previousMenuCount) {
    changed = true;
  }

  for (const menu of db.tasting_menus) {
    const menuName = normalizeFoodName(String(menu.name || '')).toLowerCase();
    if (
      menu.id === 'tm_omakase' ||
      menu.id === 'tm_legacy_tasting_journey' ||
      menuName === 'spoonbill tasting journey'
    ) {
      if (menu.active !== false) {
        menu.active = false;
        menu.updated_at = nowIso();
        changed = true;
      }
    }
  }

  db.tasting_menus.push(...clone(tastingSeed.menus));
  db.tasting_menu_courses.push(...clone(tastingSeed.courses));
  db.tasting_menu_items.push(...clone(tastingSeed.items));
  changed = true;

  db._migration_flags[TASTING_MENU_MIGRATION_FLAG] = true;

  return changed;
};

// Keep legacy seed helpers available for optional future backfills.
void [
  buildDefaultTimeSlots,
  seedMenu,
  seedTastings,
  defaultTeamMembers,
  buildDefaultWorkforceSeed,
  ensureCodaBeverageImport,
  ensureCodaFoodImport,
  ensureTastingMenuImport,
];

const migrateDb = (db: PlainObject) => {
  let changed = false;
  const eventImageByTitle: Record<string, string> = {
    'Island Mixology Class': 'https://raw.githubusercontent.com/CAJustise/the-spoonbill/main/public/images/library/misc/mixologyclass.png',
    'Pacific Rim Tasting Night': 'https://raw.githubusercontent.com/CAJustise/the-spoonbill/main/public/images/library/misc/tiki-noir.png',
  };
  const eventBookingDefaultsByTitle: Record<string, { booking_type: 'class' | 'event' | 'reservation'; booking_capacity: number; booking_minimum: number }> = {
    'Island Mixology Class': { booking_type: 'class', booking_capacity: 16, booking_minimum: 1 },
    'Pacific Rim Tasting Night': { booking_type: 'class', booking_capacity: 28, booking_minimum: 1 },
  };

  if (Array.isArray(db.job_listings)) {
    db.job_listings = db.job_listings.map((job: PlainObject) => {
      const nextJob = { ...job };
      const inferredSalary = parseSalaryRange(nextJob.salary_range);
      const nextRequirements = splitToList(nextJob.requirements);
      const nextBenefits = splitToList(nextJob.benefits);

      if (JSON.stringify(nextJob.requirements ?? null) !== JSON.stringify(nextRequirements)) {
        nextJob.requirements = nextRequirements;
        changed = true;
      }

      if (JSON.stringify(nextJob.benefits ?? null) !== JSON.stringify(nextBenefits)) {
        nextJob.benefits = nextBenefits;
        changed = true;
      }

      if (nextJob.salary_min == null && inferredSalary.salary_min != null) {
        nextJob.salary_min = inferredSalary.salary_min;
        changed = true;
      }

      if (nextJob.salary_max == null && inferredSalary.salary_max != null) {
        nextJob.salary_max = inferredSalary.salary_max;
        changed = true;
      }

      if ((nextJob.salary_type == null || nextJob.salary_type === '') && inferredSalary.salary_type) {
        nextJob.salary_type = inferredSalary.salary_type;
        changed = true;
      }

      if (nextJob.salary_min === undefined) {
        nextJob.salary_min = null;
        changed = true;
      }

      if (nextJob.salary_max === undefined) {
        nextJob.salary_max = null;
        changed = true;
      }

      if (nextJob.salary_type === undefined) {
        nextJob.salary_type = null;
        changed = true;
      }

      return nextJob;
    });
  }

  if (Array.isArray(db.events)) {
    db.events = db.events.map((event: PlainObject) => {
      const nextEvent = { ...event };
      const targetImageUrl = eventImageByTitle[nextEvent.title];

      if (targetImageUrl && nextEvent.image_url !== targetImageUrl) {
        nextEvent.image_url = targetImageUrl;
        changed = true;
      }

      const bookingDefaults = eventBookingDefaultsByTitle[nextEvent.title];
      if (bookingDefaults && nextEvent.booking_type !== bookingDefaults.booking_type) {
        nextEvent.booking_type = bookingDefaults.booking_type;
        changed = true;
      }

      const inferredCapacity =
        nextEvent.booking_type === 'class'
          ? 16
          : nextEvent.booking_type === 'event'
            ? 60
            : nextEvent.booking_type === 'reservation'
              ? 28
              : 0;
      if (
        (nextEvent.booking_type === 'class' ||
          nextEvent.booking_type === 'event' ||
          nextEvent.booking_type === 'reservation') &&
        (typeof nextEvent.booking_capacity !== 'number' || Number.isNaN(nextEvent.booking_capacity))
      ) {
        nextEvent.booking_capacity = inferredCapacity;
        changed = true;
      }

      if (
        nextEvent.booking_type === 'class' &&
        (typeof nextEvent.booking_minimum !== 'number' ||
          Number.isNaN(nextEvent.booking_minimum) ||
          nextEvent.booking_minimum < 1)
      ) {
        nextEvent.booking_minimum = bookingDefaults?.booking_minimum ?? 1;
        changed = true;
      }

      return nextEvent;
    });
  }

  if (!Array.isArray(db.class_bookings)) {
    db.class_bookings = [];
    changed = true;
  }

  if (!Array.isArray(db.class_sessions)) {
    db.class_sessions = [];
    changed = true;
  }

  if (Array.isArray(db.events) && Array.isArray(db.class_sessions)) {
    db.events
      .filter((event: PlainObject) => event.booking_type === 'class')
      .forEach((event: PlainObject) => {
        const hasBaseSession = db.class_sessions.some(
          (session: PlainObject) =>
            session.event_id === event.id &&
            session.class_date === event.date &&
            session.class_time === event.time,
        );

        if (hasBaseSession) return;

        db.class_sessions.push({
          id: createId('class_session'),
          event_id: event.id,
          class_date: event.date,
          class_time: event.time,
          capacity_override: event.booking_capacity ?? null,
          minimum_override: event.booking_minimum ?? 1,
          active: true,
          created_at: nowIso(),
        });
        changed = true;
      });
  }

  if (Array.isArray(db.reservations)) {
    db.reservations = db.reservations.map((reservation: PlainObject) => {
      if (reservation.status) return reservation;
      changed = true;
      return {
        ...reservation,
        status: 'pending',
      };
    });
  }

  if (Array.isArray(db.event_bookings)) {
    db.event_bookings = db.event_bookings.map((booking: PlainObject) => {
      if (booking.status) return booking;
      changed = true;
      return {
        ...booking,
        status: 'pending',
      };
    });
  }

  if (Array.isArray(db.class_bookings)) {
    const sessionByScheduleKey = new Map<string, PlainObject>();
    if (Array.isArray(db.class_sessions)) {
      db.class_sessions.forEach((session: PlainObject) => {
        const key = `${session.event_id || ''}::${session.class_date || ''}::${session.class_time || ''}`;
        sessionByScheduleKey.set(key, session);
      });
    }

    db.class_bookings = db.class_bookings.map((booking: PlainObject) => {
      const nextBooking = { ...booking };

      if (!nextBooking.status) {
        nextBooking.status = 'pending';
        changed = true;
      }

      if (!nextBooking.class_session_id && nextBooking.event_id && nextBooking.class_date && nextBooking.class_time) {
        const scheduleKey = `${nextBooking.event_id}::${nextBooking.class_date}::${nextBooking.class_time}`;
        const matchingSession = sessionByScheduleKey.get(scheduleKey);
        if (matchingSession?.id) {
          nextBooking.class_session_id = matchingSession.id;
          changed = true;
        }
      }

      if (nextBooking.class_session_id && (!nextBooking.class_date || !nextBooking.class_time)) {
        const matchingSession = Array.isArray(db.class_sessions)
          ? db.class_sessions.find((session: PlainObject) => session.id === nextBooking.class_session_id)
          : null;
        if (matchingSession) {
          if (!nextBooking.class_date) {
            nextBooking.class_date = matchingSession.class_date;
            changed = true;
          }
          if (!nextBooking.class_time) {
            nextBooking.class_time = matchingSession.class_time;
            changed = true;
          }
        }
      }

      return nextBooking;
    });
  }

  if (!Array.isArray(db.drive_thru_orders)) {
    db.drive_thru_orders = [];
    changed = true;
  }

  return { db, changed };
};

const getUserByIdentity = (users: PlainObject[], userId: string, email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  return users.find((candidate) => {
    const candidateEmail = String(candidate.email || '').trim().toLowerCase();
    return candidate.id === userId || candidateEmail === normalizedEmail;
  }) || null;
};

const ensureDefaultUsers = (users: PlainObject[]) => {
  let changed = false;

  defaultLocalUsers().forEach((defaultUser) => {
    const existing = getUserByIdentity(users, defaultUser.id, defaultUser.email);
    if (!existing) {
      users.push(defaultUser);
      changed = true;
      return;
    }

    const existingEmail = normalizeEmail(String(existing.email || ''));
    const defaultEmail = normalizeEmail(defaultUser.email);
    const existingPassword = String(existing.password || '');
    const legacyCredentials = LEGACY_DEFAULT_CREDENTIALS_BY_USER_ID[defaultUser.id];
    const legacyEmail = normalizeEmail(String(legacyCredentials?.email || ''));
    const legacyPassword = String(legacyCredentials?.password || '');

    if (!existing.email || existingEmail === legacyEmail) {
      if (existingEmail !== defaultEmail) {
        existing.email = defaultUser.email;
        changed = true;
      }
    }

    if (!existing.password || (legacyPassword && existingPassword === legacyPassword)) {
      if (existingPassword !== defaultUser.password) {
        existing.password = defaultUser.password;
        changed = true;
      }
    }

    if (!existing.created_at) {
      existing.created_at = defaultUser.created_at;
      changed = true;
    }
  });

  return changed;
};

const ensureRole = (db: PlainObject, role: { id: string; name: string; description: string }) => {
  if (!Array.isArray(db.admin_roles)) {
    db.admin_roles = [];
  }

  const existing = db.admin_roles.find((candidate: PlainObject) => candidate.id === role.id);
  if (existing) {
    let changed = false;
    if (existing.name !== role.name) {
      existing.name = role.name;
      changed = true;
    }
    if (existing.description !== role.description) {
      existing.description = role.description;
      changed = true;
    }
    return changed;
  }

  db.admin_roles.push({
    ...role,
    created_at: nowIso(),
  });
  return true;
};

const ensureUserRoleLink = (db: PlainObject, userId: string, roleId: string) => {
  if (!Array.isArray(db.admin_user_roles)) {
    db.admin_user_roles = [];
  }

  const exists = db.admin_user_roles.some(
    (candidate: PlainObject) => candidate.user_id === userId && candidate.role_id === roleId,
  );

  if (exists) return false;

  db.admin_user_roles.push({
    id: createId('aur'),
    user_id: userId,
    role_id: roleId,
    created_at: nowIso(),
  });
  return true;
};

const ensureTeamMembers = (db: PlainObject, users: PlainObject[]) => {
  let changed = false;

  if (!Array.isArray(db.team_members)) {
    db.team_members = [];
    changed = true;
  }

  const userEmailById = users.reduce((accumulator, user) => {
    if (!user?.id) return accumulator;
    accumulator[user.id] = String(user.email || '');
    return accumulator;
  }, {} as Record<string, string>);

  db.team_members = db.team_members.map((member: PlainObject) => {
    const nextMember = { ...member };
    const memberUserId = String(nextMember.user_id || '');

    if (!nextMember.email && memberUserId && userEmailById[memberUserId]) {
      nextMember.email = userEmailById[memberUserId];
      changed = true;
    }

    if (nextMember.active === undefined) {
      nextMember.active = true;
      changed = true;
    }

    if (nextMember.can_manage_schedule === undefined) {
      nextMember.can_manage_schedule = Boolean(nextMember.can_access_workforce);
      changed = true;
    }

    if (!nextMember.can_manage_schedule && nextMember.can_access_workforce) {
      nextMember.can_access_workforce = false;
      changed = true;
    }

    return nextMember;
  });

  return changed;
};

const ensureWorkforceFoundation = (db: PlainObject, users: PlainObject[]) => {
  let changed = false;
  const workforceTables = [
    'workforce_locations',
    'workforce_departments',
    'workforce_stations',
    'workforce_roles',
    'workforce_employees',
    'workforce_employee_roles',
    'workforce_shift_templates',
    'workforce_shifts',
    'workforce_schedule_templates',
    'workforce_schedule_template_shifts',
    'workforce_punches',
    'workforce_breaks',
    'workforce_time_off_requests',
    'workforce_time_off_blocks',
    'workforce_company_holidays',
    'workforce_pto_balances',
    'workforce_employee_documents',
    'workforce_tasks',
    'workforce_log_entries',
    'workforce_rules',
    'workforce_events',
    'workforce_dashboard_snapshots',
  ];

  workforceTables.forEach((tableName) => {
    if (!Array.isArray(db[tableName])) {
      db[tableName] = [];
      changed = true;
    }
  });

  if (Array.isArray(db.workforce_employees)) {
    const userById = users.reduce((accumulator, user) => {
      if (!user?.id) return accumulator;
      accumulator[String(user.id)] = user;
      return accumulator;
    }, {} as Record<string, PlainObject>);

    db.workforce_employees = db.workforce_employees.map((employee: PlainObject) => {
      const nextEmployee = { ...employee };
      const linkedUser = userById[String(nextEmployee.user_id || '')];
      if (linkedUser && !nextEmployee.email) {
        nextEmployee.email = String(linkedUser.email || '');
        changed = true;
      }

      if (nextEmployee.phone === undefined || nextEmployee.phone === null) {
        nextEmployee.phone = '';
        changed = true;
      }

      if (!nextEmployee.default_location_id) {
        nextEmployee.default_location_id = WORKFORCE_DEFAULT_LOCATION_ID;
        changed = true;
      }

      if (!nextEmployee.status) {
        nextEmployee.status = 'active';
        changed = true;
      }

      if (!nextEmployee.hire_date) {
        nextEmployee.hire_date = todayDateValue();
        changed = true;
      }

      if (!nextEmployee.pay_basis) {
        nextEmployee.pay_basis = 'hourly';
        changed = true;
      }

      if (!nextEmployee.pto_unit) {
        nextEmployee.pto_unit = 'hours';
        changed = true;
      }

      if (!nextEmployee.availability) {
        nextEmployee.availability = 'Open availability';
        changed = true;
      }

      if (nextEmployee.hourly_rate === undefined || nextEmployee.hourly_rate === null) {
        const roleId = workforceRoleForTitle(String(nextEmployee.title || ''));
        nextEmployee.hourly_rate = workforceRateForRole(roleId);
        changed = true;
      }

      if (!nextEmployee.training_state) {
        nextEmployee.training_state = 'active';
        changed = true;
      }

      if (nextEmployee.attendance_score === undefined || nextEmployee.attendance_score === null) {
        nextEmployee.attendance_score = 100;
        changed = true;
      }

      if (!nextEmployee.login_username) {
        const inferredUsername = String(linkedUser?.email || nextEmployee.email || '').trim();
        if (inferredUsername) {
          nextEmployee.login_username = inferredUsername;
          changed = true;
        }
      }

      if (nextEmployee.login_password === undefined || nextEmployee.login_password === null) {
        const inferredPassword = String(linkedUser?.password || '');
        nextEmployee.login_password = inferredPassword;
        changed = true;
      }

      return nextEmployee;
    });
  }

  if (Array.isArray(db.workforce_employee_roles)) {
    const roleRateByRoleId = Array.isArray(db.workforce_roles)
      ? (db.workforce_roles as PlainObject[]).reduce((accumulator, role) => {
          if (!role?.id) return accumulator;
          accumulator[String(role.id)] = Number(role.hourly_rate || workforceRateForRole(String(role.id)));
          return accumulator;
        }, {} as Record<string, number>)
      : {};

    db.workforce_employee_roles = db.workforce_employee_roles.map((assignment: PlainObject, index: number) => {
      const nextAssignment = { ...assignment };

      if (!nextAssignment.id) {
        const employeeId = String(nextAssignment.employee_id || `employee_${index}`);
        const roleId = String(nextAssignment.role_id || 'wf_role_server');
        nextAssignment.id = `wf_er_${employeeId}_${roleId}_${index}`;
        changed = true;
      }

      if (!nextAssignment.role_id) {
        nextAssignment.role_id = 'wf_role_server';
        changed = true;
      }

      if (nextAssignment.hourly_rate === undefined || nextAssignment.hourly_rate === null) {
        const roleId = String(nextAssignment.role_id || 'wf_role_server');
        nextAssignment.hourly_rate = roleRateByRoleId[roleId] ?? workforceRateForRole(roleId);
        changed = true;
      }

      if (nextAssignment.primary_role === undefined) {
        nextAssignment.primary_role = index === 0;
        changed = true;
      }

      if (nextAssignment.active === undefined) {
        nextAssignment.active = true;
        changed = true;
      }

      if (!nextAssignment.created_at) {
        nextAssignment.created_at = nowIso();
        changed = true;
      }

      return nextAssignment;
    });
  }

  if (Array.isArray(db.workforce_pto_balances)) {
    const employeeUnitById = Array.isArray(db.workforce_employees)
      ? (db.workforce_employees as PlainObject[]).reduce((accumulator, employee) => {
          if (!employee?.id) return accumulator;
          accumulator[String(employee.id)] = String(employee.pto_unit || 'hours').toLowerCase() === 'days' ? 'days' : 'hours';
          return accumulator;
        }, {} as Record<string, 'hours' | 'days'>)
      : {};

    db.workforce_pto_balances = db.workforce_pto_balances.map((balance: PlainObject) => {
      const nextBalance = { ...balance };
      const employeeId = String(nextBalance.employee_id || '');
      const unit = employeeUnitById[employeeId] || 'hours';

      if (!nextBalance.pto_unit) {
        nextBalance.pto_unit = unit;
        changed = true;
      }

      if (nextBalance.available_hours === undefined || nextBalance.available_hours === null) {
        const accrued = Number(nextBalance.accrued_hours || 0);
        const used = Number(nextBalance.used_hours || 0);
        nextBalance.available_hours = Math.max(0, accrued - used);
        changed = true;
      }

      if (!nextBalance.updated_at) {
        nextBalance.updated_at = nowIso();
        changed = true;
      }

      return nextBalance;
    });
  }

  return changed;
};

const ensureRoleAssignments = (db: PlainObject, users: PlainObject[]) => {
  let changed = false;

  if (ensureRole(db, { id: 'role_owner', name: 'Owner', description: 'Full BOH access' })) {
    changed = true;
  }
  if (ensureRole(db, { id: 'role_manager', name: 'Manager', description: 'Operational BOH access' })) {
    changed = true;
  }
  if (ensureRole(db, { id: 'role_host', name: 'Host', description: 'Reservations, events, and classes BOH access' })) {
    changed = true;
  }
  if (ensureRole(db, { id: 'role_staff', name: 'Staff', description: 'Limited staff access' })) {
    changed = true;
  }

  const adminUser = getUserByIdentity(users, DEFAULT_ADMIN_USER_ID, DEFAULT_ADMIN_EMAIL);
  if (adminUser && ensureUserRoleLink(db, adminUser.id, 'role_owner')) {
    changed = true;
  }

  const hostUser = getUserByIdentity(users, DEFAULT_HOST_USER_ID, DEFAULT_HOST_EMAIL);
  if (hostUser && ensureUserRoleLink(db, hostUser.id, 'role_host')) {
    changed = true;
  }

  const hostLeadUser = getUserByIdentity(users, DEFAULT_HOST_LEAD_USER_ID, DEFAULT_HOST_LEAD_EMAIL);
  if (hostLeadUser && ensureUserRoleLink(db, hostLeadUser.id, 'role_host')) {
    changed = true;
  }

  const lineCookUser = getUserByIdentity(users, DEFAULT_LINE_COOK_USER_ID, DEFAULT_LINE_COOK_EMAIL);
  if (lineCookUser && ensureUserRoleLink(db, lineCookUser.id, 'role_staff')) {
    changed = true;
  }

  const bartenderUser = getUserByIdentity(users, DEFAULT_BARTENDER_USER_ID, DEFAULT_BARTENDER_EMAIL);
  if (bartenderUser && ensureUserRoleLink(db, bartenderUser.id, 'role_staff')) {
    changed = true;
  }

  const serverUser = getUserByIdentity(users, DEFAULT_SERVER_USER_ID, DEFAULT_SERVER_EMAIL);
  if (serverUser && ensureUserRoleLink(db, serverUser.id, 'role_staff')) {
    changed = true;
  }

  if (ensureTeamMembers(db, users)) {
    changed = true;
  }

  if (ensureWorkforceFoundation(db, users)) {
    changed = true;
  }

  return changed;
};

class LocalStore {
  db: PlainObject;
  users: PlainObject[];
  session: PlainObject | null;
  files: PlainObject;

  constructor() {
    this.db = loadJson(DB_KEY, buildDefaultDb);
    this.users = loadJson(USERS_KEY, defaultUsers);
    this.session = loadJson(SESSION_KEY, () => null);
    this.files = loadJson(FILES_KEY, () => ({}));

    const usersChanged = ensureDefaultUsers(this.users);
    if (usersChanged) {
      this.saveUsers();
    }

    if (storageAvailable()) {
      const resetVersion = window.localStorage.getItem(TEMPLATE_DATA_RESET_KEY);
      if (resetVersion !== TEMPLATE_DATA_RESET_VERSION) {
        this.db = buildDefaultDb();
        this.users = defaultUsers();
        this.session = null;
        this.files = {};
        this.saveDb();
        this.saveUsers();
        this.saveSession();
        this.saveFiles();
        window.localStorage.setItem(TEMPLATE_DATA_RESET_KEY, TEMPLATE_DATA_RESET_VERSION);
      }
    }

    if (ensureRoleAssignments(this.db, this.users)) {
      this.saveDb();
    }

    const migration = migrateDb(this.db);
    this.db = migration.db;
    if (migration.changed) {
      this.saveDb();
    }
  }

  saveDb() {
    persistJson(DB_KEY, this.db);
  }

  saveUsers() {
    persistJson(USERS_KEY, this.users);
  }

  saveSession() {
    persistJson(SESSION_KEY, this.session);
  }

  saveFiles() {
    persistJson(FILES_KEY, this.files);
  }

  table(tableName: string): PlainObject[] {
    if (!this.db[tableName]) {
      this.db[tableName] = [];
      this.saveDb();
    }
    return this.db[tableName];
  }
}

const parseRelationDescriptors = (selection: string) => {
  const descriptors: PlainObject[] = [];
  const relationRegex = /(\w+)\s*:\s*([a-zA-Z_][\w]*)\s*\(([^()]+)\)/g;

  let match: RegExpExecArray | null;
  while (true) {
    match = relationRegex.exec(selection);
    if (!match) break;

    descriptors.push({
      alias: match[1],
      token: match[2],
      fields: match[3]
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    });
  }

  return descriptors;
};

const inferRelatedTable = (alias: string, token: string, row: PlainObject) => {
  if (token.endsWith('_id')) {
    return FK_TABLE_MAP[token] || `${token.replace(/_id$/, '')}s`;
  }

  if (row[token]) {
    return token;
  }

  if (ALIAS_TABLE_MAP[alias]) {
    return ALIAS_TABLE_MAP[alias];
  }

  return token;
};

const inferForeignKey = (alias: string, token: string, row: PlainObject) => {
  if (token.endsWith('_id')) {
    return token;
  }

  const candidates = [`${alias}_id`, `${token.replace(/s$/, '')}_id`, `${token}_id`];
  return candidates.find((candidate) => Object.prototype.hasOwnProperty.call(row, candidate));
};

const pickFields = (row: PlainObject, fields: string[]) => {
  if (fields.length === 1 && fields[0] === '*') {
    return clone(row);
  }

  const picked: PlainObject = {};
  fields.forEach((field) => {
    if (field in row) {
      picked[field] = row[field];
    }
  });
  return picked;
};

const applyRelations = (rows: PlainObject[], selection: string | undefined, store: LocalStore) => {
  if (!selection) return rows;
  const descriptors = parseRelationDescriptors(selection);
  if (!descriptors.length) return rows;

  return rows.map((row) => {
    const hydrated = { ...row };

    descriptors.forEach((descriptor) => {
      const relatedTableName = inferRelatedTable(descriptor.alias, descriptor.token, row);
      const foreignKey = inferForeignKey(descriptor.alias, descriptor.token, row);
      const relatedTable = store.table(relatedTableName);

      if (!foreignKey) {
        hydrated[descriptor.alias] = null;
        return;
      }

      const foreignValue = row[foreignKey];
      const relatedRow = relatedTable.find((candidate) => candidate.id === foreignValue);
      hydrated[descriptor.alias] = relatedRow ? pickFields(relatedRow, descriptor.fields) : null;
    });

    return hydrated;
  });
};

const normalizeRecord = (record: PlainObject, tableName: string): PlainObject => {
  const normalized = { ...record };

  if (!normalized.id) {
    normalized.id = createId(slug(tableName));
  }

  if (!normalized.created_at) {
    normalized.created_at = nowIso();
  }

  normalized.updated_at = nowIso();

  return normalized;
};

class LocalQueryBuilder {
  store: LocalStore;
  tableName: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  selection: string | undefined;
  payload: PlainObject[] | PlainObject | null;
  filters: Array<{ column: string; value: any }>;
  orderBy: Array<{ column: string; ascending: boolean }>;
  singleResult: boolean;
  returnData: boolean;

  constructor(store: LocalStore, tableName: string) {
    this.store = store;
    this.tableName = tableName;
    this.operation = 'select';
    this.selection = undefined;
    this.payload = null;
    this.filters = [];
    this.orderBy = [];
    this.singleResult = false;
    this.returnData = true;
  }

  select(selection = '*') {
    this.selection = selection;
    this.returnData = true;
    return this;
  }

  insert(payload: PlainObject[] | PlainObject) {
    this.operation = 'insert';
    this.payload = payload;
    this.returnData = false;
    return this;
  }

  update(payload: PlainObject) {
    this.operation = 'update';
    this.payload = payload;
    this.returnData = false;
    return this;
  }

  delete() {
    this.operation = 'delete';
    this.payload = null;
    this.returnData = false;
    return this;
  }

  upsert(payload: PlainObject[] | PlainObject) {
    this.operation = 'upsert';
    this.payload = payload;
    this.returnData = false;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  is(column: string, value: any) {
    return this.eq(column, value);
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  then(onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) {
    return this.execute().then(onFulfilled, onRejected);
  }

  catch(onRejected: (reason: any) => any) {
    return this.execute().catch(onRejected);
  }

  finally(onFinally: () => void) {
    return this.execute().finally(onFinally);
  }

  applyFilters(rows: PlainObject[]) {
    if (!this.filters.length) return rows;

    return rows.filter((row) =>
      this.filters.every(({ column, value }) => {
        if (!(column in row)) {
          return false;
        }
        return row[column] === value;
      }),
    );
  }

  applyOrder(rows: PlainObject[]) {
    if (!this.orderBy.length) return rows;

    const ordered = [...rows];
    ordered.sort((a, b) => {
      for (const rule of this.orderBy) {
        const aVal = a[rule.column];
        const bVal = b[rule.column];

        if (aVal === bVal) continue;
        if (aVal == null) return rule.ascending ? 1 : -1;
        if (bVal == null) return rule.ascending ? -1 : 1;

        if (aVal < bVal) return rule.ascending ? -1 : 1;
        if (aVal > bVal) return rule.ascending ? 1 : -1;
      }

      return 0;
    });

    return ordered;
  }

  createPayloadArray() {
    if (Array.isArray(this.payload)) {
      return this.payload;
    }
    if (this.payload) {
      return [this.payload];
    }
    return [];
  }

  async executeSelect() {
    const sourceRows = this.store.table(this.tableName);
    const filtered = this.applyFilters(sourceRows);
    const ordered = this.applyOrder(filtered);
    const rows = applyRelations(clone(ordered), this.selection, this.store);

    if (this.singleResult) {
      return {
        data: rows[0] || null,
        error: null,
      };
    }

    return {
      data: rows,
      error: null,
    };
  }

  async executeInsert() {
    const payloadRows = this.createPayloadArray();
    const table = this.store.table(this.tableName);

    const insertedRows = payloadRows.map((row) => {
      const normalized = normalizeRecord(row, this.tableName);
      table.push(normalized);
      return normalized;
    });

    this.store.saveDb();

    const data = this.returnData ? clone(insertedRows) : null;
    return {
      data: this.singleResult ? data?.[0] || null : data,
      error: null,
    };
  }

  async executeUpdate() {
    const table = this.store.table(this.tableName);
    const updateValues = this.payload || {};

    const updatedRows: PlainObject[] = [];
    table.forEach((row, index) => {
      const matches = this.filters.every(({ column, value }) => row[column] === value);
      if (!matches) return;

      const nextRow = {
        ...row,
        ...updateValues,
        updated_at: nowIso(),
      };

      table[index] = nextRow;
      updatedRows.push(nextRow);
    });

    this.store.saveDb();

    const data = this.returnData ? clone(updatedRows) : null;
    return {
      data: this.singleResult ? data?.[0] || null : data,
      error: null,
    };
  }

  async executeDelete() {
    const table = this.store.table(this.tableName);
    const deletedRows: PlainObject[] = [];

    const keep = table.filter((row) => {
      const matches = this.filters.every(({ column, value }) => row[column] === value);
      if (matches) {
        deletedRows.push(row);
        return false;
      }
      return true;
    });

    this.store.db[this.tableName] = keep;
    this.store.saveDb();

    const data = this.returnData ? clone(deletedRows) : null;
    return {
      data: this.singleResult ? data?.[0] || null : data,
      error: null,
    };
  }

  async executeUpsert() {
    const payloadRows = this.createPayloadArray();
    const table = this.store.table(this.tableName);
    const touchedRows: PlainObject[] = [];

    payloadRows.forEach((payloadRow) => {
      const normalized = normalizeRecord(payloadRow, this.tableName);
      const index = table.findIndex((candidate) => candidate.id === normalized.id);

      if (index >= 0) {
        table[index] = {
          ...table[index],
          ...normalized,
          updated_at: nowIso(),
        };
        touchedRows.push(table[index]);
        return;
      }

      table.push(normalized);
      touchedRows.push(normalized);
    });

    this.store.saveDb();

    const data = this.returnData ? clone(touchedRows) : null;
    return {
      data: this.singleResult ? data?.[0] || null : data,
      error: null,
    };
  }

  async execute() {
    try {
      switch (this.operation) {
        case 'insert':
          return await this.executeInsert();
        case 'update':
          return await this.executeUpdate();
        case 'delete':
          return await this.executeDelete();
        case 'upsert':
          return await this.executeUpsert();
        case 'select':
        default:
          return await this.executeSelect();
      }
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error?.message || 'Local data layer error',
        },
      };
    }
  }
}

const toSessionPayload = (user: PlainObject | null) => {
  if (!user) return null;
  return {
    access_token: `local-${user.id}`,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

class LocalAuth {
  store: LocalStore;

  constructor(store: LocalStore) {
    this.store = store;
  }

  async getSession() {
    return {
      data: {
        session: this.store.session,
      },
      error: null,
    };
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const user = this.store.users.find(
      (candidate) =>
        candidate.email.toLowerCase() === String(email || '').toLowerCase() &&
        candidate.password === password,
    );

    if (!user) {
      return {
        data: {
          user: null,
          session: null,
        },
        error: {
          message: 'Invalid login credentials',
        },
      };
    }

    const session = toSessionPayload(user);
    this.store.session = session;
    this.store.saveSession();

    return {
      data: {
        user: session.user,
        session,
      },
      error: null,
    };
  }

  async signOut() {
    this.store.session = null;
    this.store.saveSession();

    return {
      error: null,
    };
  }

  async updateUser(attributes: { email?: string; password?: string }) {
    const activeSession = this.store.session;
    if (!activeSession?.user?.id) {
      return {
        data: { user: null },
        error: {
          message: 'No active user session',
        },
      };
    }

    const index = this.store.users.findIndex((candidate) => candidate.id === activeSession.user.id);
    if (index < 0) {
      return {
        data: { user: null },
        error: {
          message: 'Current user not found',
        },
      };
    }

    const updated = {
      ...this.store.users[index],
      ...attributes,
      updated_at: nowIso(),
    };

    this.store.users[index] = updated;
    this.store.saveUsers();

    this.store.session = toSessionPayload(updated);
    this.store.saveSession();

    return {
      data: {
        user: this.store.session.user,
      },
      error: null,
    };
  }

  admin = {
    createUser: async ({ email, password }: { email: string; password: string }) => {
      const existing = this.store.users.find(
        (candidate) => candidate.email.toLowerCase() === String(email || '').toLowerCase(),
      );

      if (existing) {
        return {
          data: { user: null },
          error: {
            message: 'User already registered',
          },
        };
      }

      const user = {
        id: createId('user'),
        email,
        password,
        created_at: nowIso(),
      };

      this.store.users.push(user);
      this.store.saveUsers();

      return {
        data: {
          user: {
            id: user.id,
            email: user.email,
          },
        },
        error: null,
      };
    },

    updateUserById: async (
      userId: string,
      attributes: { email?: string; password?: string },
    ) => {
      const index = this.store.users.findIndex((candidate) => candidate.id === userId);
      if (index < 0) {
        return {
          data: { user: null },
          error: {
            message: 'User not found',
          },
        };
      }

      const requestedEmail = String(attributes.email || '').trim();
      if (requestedEmail) {
        const duplicate = this.store.users.find(
          (candidate, candidateIndex) =>
            candidateIndex !== index &&
            String(candidate.email || '').toLowerCase() === requestedEmail.toLowerCase(),
        );

        if (duplicate) {
          return {
            data: { user: null },
            error: {
              message: 'Email already in use',
            },
          };
        }
      }

      const updated = {
        ...this.store.users[index],
        ...(requestedEmail ? { email: requestedEmail } : {}),
        ...(attributes.password !== undefined ? { password: String(attributes.password) } : {}),
        updated_at: nowIso(),
      };

      this.store.users[index] = updated;
      this.store.saveUsers();

      if (this.store.session?.user?.id === userId) {
        this.store.session = toSessionPayload(updated);
        this.store.saveSession();
      }

      return {
        data: {
          user: {
            id: updated.id,
            email: updated.email,
          },
        },
        error: null,
      };
    },

    deleteUser: async (userId: string) => {
      const before = this.store.users.length;
      this.store.users = this.store.users.filter((candidate) => candidate.id !== userId);
      this.store.saveUsers();

      if (this.store.db.admin_user_roles) {
        this.store.db.admin_user_roles = this.store.db.admin_user_roles.filter(
          (role: PlainObject) => role.user_id !== userId,
        );
        this.store.saveDb();
      }

      if (this.store.session?.user?.id === userId) {
        this.store.session = null;
        this.store.saveSession();
      }

      if (before === this.store.users.length) {
        return {
          error: {
            message: 'User not found',
          },
        };
      }

      return {
        error: null,
      };
    },
  };
}

const readAsDataUrl = async (file: File | Blob): Promise<string> => {
  if (typeof FileReader === 'undefined') {
    return '';
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
};

class LocalStorageBucket {
  store: LocalStore;
  bucket: string;

  constructor(store: LocalStore, bucket: string) {
    this.store = store;
    this.bucket = bucket;
  }

  async upload(path: string, file: File | Blob, options?: { onUploadProgress?: (arg: { loaded: number; total: number }) => void }) {
    const bucketFiles = this.store.files[this.bucket] || {};

    let dataUrl = '';
    if (typeof Blob !== 'undefined' && file instanceof Blob) {
      dataUrl = await readAsDataUrl(file);
      if (options?.onUploadProgress) {
        options.onUploadProgress({
          loaded: file.size,
          total: file.size,
        });
      }
    }

    bucketFiles[path] = {
      name: path,
      data_url: dataUrl,
      size: typeof file === 'object' && 'size' in file ? file.size : 0,
      updated_at: nowIso(),
    };

    this.store.files[this.bucket] = bucketFiles;
    this.store.saveFiles();

    return {
      data: {
        path,
        id: path,
        fullPath: `${this.bucket}/${path}`,
      },
      error: null,
    };
  }

  list(prefix = '') {
    const bucketFiles = this.store.files[this.bucket] || {};
    const rows = Object.values(bucketFiles)
      .filter((file: PlainObject) => file.name.startsWith(prefix))
      .sort((a: PlainObject, b: PlainObject) => a.name.localeCompare(b.name))
      .map((file: PlainObject) => ({
        name: file.name,
        id: file.name,
        updated_at: file.updated_at,
      }));

    return {
      data: rows,
      error: null,
    };
  }

  remove(paths: string[]) {
    const bucketFiles = this.store.files[this.bucket] || {};
    paths.forEach((path) => {
      delete bucketFiles[path];
    });

    this.store.files[this.bucket] = bucketFiles;
    this.store.saveFiles();

    return {
      data: null,
      error: null,
    };
  }

  getPublicUrl(path: string) {
    const bucketFiles = this.store.files[this.bucket] || {};
    const file = bucketFiles[path];

    return {
      data: {
        publicUrl:
          file?.data_url ||
          `https://placehold.co/1200x800/e2f2f4/0f4c5c?text=${encodeURIComponent(path)}`,
      },
    };
  }
}

class LocalStorageApi {
  store: LocalStore;

  constructor(store: LocalStore) {
    this.store = store;
  }

  from(bucket: string) {
    return new LocalStorageBucket(this.store, bucket);
  }
}

class LocalSupabaseClient {
  store: LocalStore;
  auth: LocalAuth;
  storage: LocalStorageApi;

  constructor(store: LocalStore) {
    this.store = store;
    this.auth = new LocalAuth(store);
    this.storage = new LocalStorageApi(store);
  }

  from(tableName: string) {
    return new LocalQueryBuilder(this.store, tableName);
  }
}

const singletonStore = new LocalStore();

export const createLocalSupabaseClient = () => new LocalSupabaseClient(singletonStore);
export const localAdminDefaults = {
  email: DEFAULT_ADMIN_EMAIL,
  password: DEFAULT_ADMIN_PASSWORD,
};
