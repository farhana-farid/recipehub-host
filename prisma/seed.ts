/* eslint-disable no-console */
import { PrismaClient, VideoPlatform, Difficulty } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const img = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const ytShort = (id: string) => `https://www.youtube.com/shorts/${id}`;

interface SeedIngredient {
  name: string;
  nameBn?: string;
  quantity?: number;
  unit?: string;
  note?: string;
  optional?: boolean;
}

interface SeedStep {
  text: string;
  textBn?: string;
  tip?: string;
  tipBn?: string;
  timerSeconds?: number;
  videoStart?: number;
  videoEnd?: number;
}

interface SeedVideo {
  platform: VideoPlatform;
  url: string;
  videoId: string;
  creatorName: string;
  creatorHandle?: string;
  isPrimary?: boolean;
}

interface SeedRecipe {
  slug: string;
  title: string;
  titleBn?: string;
  description: string;
  descriptionBn?: string;
  image: string;
  cuisine: string;
  difficulty: Difficulty;
  baseServings: number;
  prepMinutes: number;
  cookMinutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  dietTags: string[];
  allergens: string[];
  ingredients: SeedIngredient[];
  steps: SeedStep[];
  videos: SeedVideo[];
}

/* ------------------------------------------------------------------ */
/* Recipes                                                             */
/* ------------------------------------------------------------------ */

const RECIPES: SeedRecipe[] = [
  {
    slug: "chicken-curry",
    title: "Homestyle Chicken Curry",
    titleBn: "ঘরোয়া মুরগির ঝোল কারি",
    description:
      "A rich, slow-simmered chicken curry with onions, tomatoes and warm garam masala — the kind that pairs perfectly with steamed rice or hot rotis.",
    descriptionBn: "পেঁয়াজ, টমেটো আর গরম মসলায় ধীর আঁচে রান্না ঘন, মসলাদার মুরগির ঝোল — গরম ভাত বা রুটির সাথে অতুলনীয়।",
    image: img("1585937421612-70a008356fbe"),
    cuisine: "Indian",
    difficulty: "MEDIUM",
    baseServings: 4,
    prepMinutes: 15,
    cookMinutes: 40,
    calories: 420,
    protein: 34,
    carbs: 12,
    fat: 25,
    tags: ["dinner", "comfort", "spicy", "family"],
    dietTags: ["high-protein", "gluten-free"],
    allergens: ["dairy"],
    ingredients: [
      { name: "chicken thighs", nameBn: "মুরগির রান", quantity: 700, unit: "g" },
      { name: "onion", nameBn: "পেঁয়াজ", quantity: 2, unit: "large", note: "finely sliced" },
      { name: "tomato", nameBn: "টমেটো", quantity: 3, unit: "medium", note: "puréed" },
      { name: "garlic", nameBn: "রসুন", quantity: 5, unit: "cloves" },
      { name: "ginger", nameBn: "আদা", quantity: 1, unit: "tbsp", note: "grated" },
      { name: "yogurt", nameBn: "টক দই", quantity: 0.5, unit: "cup" },
      { name: "garam masala", nameBn: "গরম মসলা", quantity: 2, unit: "tsp" },
      { name: "turmeric", nameBn: "হলুদ", quantity: 1, unit: "tsp" },
      { name: "cumin", nameBn: "জিরা", quantity: 1, unit: "tsp" },
      { name: "oil", nameBn: "তেল", quantity: 3, unit: "tbsp" },
      { name: "cilantro", nameBn: "ধনেপাতা", quantity: 1, unit: "handful", optional: true },
      { name: "salt", nameBn: "লবণ", quantity: 1.25, unit: "tsp" },
    ],
    steps: [
      {
        text: "Marinate the chicken with yogurt, turmeric and 1 tsp salt. Rest while you prep the rest.",
        textBn: "মুরগিতে দই, হলুদ ও এক চা চামচ লবণ মিশিয়ে ১৫ মিনিট রেখে দিন।",
        tip: "Yogurt tenderises the chicken and keeps it juicy.",
        tipBn: "দই মুরগি নরম রাখে এবং রসালো হয়।",
        videoStart: 0,
        videoEnd: 90,
      },
      {
        text: "Heat oil in a heavy pot. Fry the sliced onions over medium heat until deep golden — about 8 minutes.",
        textBn: "কড়াইয়ে তেল গরম করে পেঁয়াজ মাঝারি আঁচে সোনালি হওয়া পর্যন্ত ভাজুন — প্রায় ৮ মিনিট।",
        tip: "Do not rush the onions; the curry's sweetness comes from here.",
        tipBn: "পেঁয়াজ তাড়াহুড়ো করে ভাজবেন না; কারির স্বাদ এখান থেকেই আসে।",
        timerSeconds: 480,
        videoStart: 90,
        videoEnd: 240,
      },
      {
        text: "Add garlic, ginger and the ground spices. Toast for 60 seconds until fragrant.",
        textBn: "রসুন, আদা ও গুঁড়া মসলা দিয়ে ৬০ সেকেন্ড ভাজুন, সুগন্ধ বের হলেই নামিয়ে ফেলুন।",
        videoStart: 240,
        videoEnd: 360,
      },
      {
        text: "Add the chicken and sear 3–4 minutes, then pour in the tomato purée.",
        textBn: "মুরগি দিয়ে ৩–৪ মিনিট সিকার টমেটোর বাটা ঢেলে দিন।",
        videoStart: 360,
        videoEnd: 540,
      },
      {
        text: "Cover and simmer on low for 18–20 minutes until the oil separates and the chicken is cooked through.",
        textBn: "ঢাকা দিয়ে কম আঁচে ১৮–২০ মিনিট রান্না করুন, তেল আলাদা হয়ে এলেই বুঝবেন রান্না হয়ে গেছে।",
        timerSeconds: 1080,
        videoStart: 540,
        videoEnd: 780,
      },
      {
        text: "Finish with garam masala and fresh cilantro. Rest 5 minutes before serving.",
        textBn: "শেষে গরম মসলা ও ধনেপাতা ছড়িয়ে ৫ মিনিট রেখে পরিবেশন করুন।",
        timerSeconds: 300,
        videoStart: 780,
        videoEnd: 840,
      },
    ],
    videos: [
      {
        platform: "YOUTUBE",
        url: yt("cODuxAHrhrA"),
        videoId: "cODuxAHrhrA",
        creatorName: "Daily Dime Dinners",
        isPrimary: true,
      },
      {
        platform: "TIKTOK",
        // Demo entry exercising the short-link parser path and the
        // "Watch on TikTok" fallback card (TikTok embeds are region-gated).
        url: "https://vm.tiktok.com/ZMhKqXxTL/",
        videoId: "ZMhKqXxTL",
        creatorName: "@feelgoodfoodie",
        creatorHandle: "feelgoodfoodie",
      },
    ],
  },
  {
    slug: "classic-carbonara",
    title: "Classic Spaghetti Carbonara",
    titleBn: "ক্লাসিক স্প্যাগেটি কার্বোনারা",
    description:
      "Silky, glossy pasta built from nothing but eggs, pecorino, guanciale and black pepper — the Roman original, no cream in sight.",
    descriptionBn: "ডিম, পেকোরিনো পনির, গুয়ানচিয়ালে আর কালো মরিচে তৈরি রোমানদের সিল্কি পাস্তা — ক্রিম ছাড়াই।",
    image: img("1551183053-bf91a1d81141"),
    cuisine: "Italian",
    difficulty: "MEDIUM",
    baseServings: 4,
    prepMinutes: 10,
    cookMinutes: 20,
    calories: 560,
    protein: 24,
    carbs: 62,
    fat: 24,
    tags: ["dinner", "pasta", "italian"],
    dietTags: ["high-protein"],
    allergens: ["eggs", "dairy", "gluten"],
    ingredients: [
      { name: "spaghetti", quantity: 400, unit: "g" },
      { name: "guanciale", quantity: 150, unit: "g", note: "or pancetta" },
      { name: "egg yolks", quantity: 4, unit: "large" },
      { name: "pecorino romano", quantity: 80, unit: "g", note: "finely grated" },
      { name: "black pepper", quantity: 1, unit: "tsp", note: "coarse" },
      { name: "salt", quantity: 1, unit: "tbsp", note: "for pasta water" },
    ],
    steps: [
      {
        text: "Boil the spaghetti in well-salted water until just shy of al dente.",
        textBn: "প্রচুর লবণ পানিতে স্প্যাগেটি আল দান্তে হওয়ার ঠিক আগে পর্যন্ত সিদ্ধ করুন।",
        timerSeconds: 600,
        videoStart: 20,
        videoEnd: 80,
      },
      {
        text: "Render the guanciale in a cold pan brought up to medium heat until crisp and golden.",
        textBn: "ঠান্ডা প্যানে গুয়ানচিয়ালে দিয়ে মাঝারি আঁচে মুচমুচে সোনালি হওয়া পর্যন্ত ভাজুন।",
        videoStart: 80,
        videoEnd: 170,
      },
      {
        text: "Whisk yolks with pecorino and a heavy grind of black pepper into a paste.",
        textBn: "ডিমের কুসুমের সাথে পেকোরিনো ও কালো মরিচ ঘন পেস্টের মতো ফেটিয়ে নিন।",
        videoStart: 170,
        videoEnd: 250,
      },
      {
        text: "Toss pasta into the pork fat off-heat, then add the egg mix, loosening with pasta water until glossy.",
        textBn: "আঁচ বন্ধ করে পাস্তা চর্বিতে মেশান, তারপর ডিমের মিশ্রণ ও পাস্তা পানি দিয়ে চকচকে করুন।",
        tip: "Off-heat is the secret — scrambled eggs are the only way to ruin carbonara.",
        tipBn: "আঁচ বন্ধ রাখাই আসল রহস্য — আঁচে দিলে ডিম জমাট হয়ে যাবে।",
        videoStart: 250,
        videoEnd: 340,
      },
      {
        text: "Plate immediately with extra pecorino and pepper.",
        textBn: "সঙ্গে সঙ্গে পরিবেশন করে উপরে পনির ও মরিচ ছড়িয়ে দিন।",
        videoStart: 340,
        videoEnd: 400,
      },
    ],
    videos: [
      {
        platform: "YOUTUBE",
        url: yt("D_2DBLAt57c"),
        videoId: "D_2DBLAt57c",
        creatorName: "Jamie Oliver",
        isPrimary: true,
      },
      {
        platform: "YOUTUBE",
        url: yt("Mzi7Bl_yNls"),
        videoId: "Mzi7Bl_yNls",
        creatorName: "unpacking your plate",
      },
    ],
  },
  {
    slug: "creamy-chickpea-curry",
    title: "Creamy Chickpea Curry",
    titleBn: "ক্রিমি ছোলার কারি",
    description:
      "A weeknight chickpea curry simmered in coconut milk with spinach — ready in 30 minutes, vegan and deeply comforting.",
    descriptionBn: "নারকেল দুধ আর পালং শাকে ৩০ মিনিটে রান্না হয়ে যাওয়া নিরামিষ ছোলার কারি — স্বাদে ঘি মাখানো।",
    image: img("1512058564366-18510be2db19"),
    cuisine: "Indian",
    difficulty: "EASY",
    baseServings: 4,
    prepMinutes: 8,
    cookMinutes: 22,
    calories: 380,
    protein: 14,
    carbs: 46,
    fat: 15,
    tags: ["dinner", "quick", "budget"],
    dietTags: ["vegan", "vegetarian", "gluten-free"],
    allergens: [],
    ingredients: [
      { name: "chickpeas", nameBn: "ছোলা", quantity: 2, unit: "cans", note: "drained" },
      { name: "onion", nameBn: "পেঁয়াজ", quantity: 1, unit: "medium", note: "diced" },
      { name: "tomato", nameBn: "টমেটো", quantity: 2, unit: "medium" },
      { name: "garlic", nameBn: "রসুন", quantity: 3, unit: "cloves" },
      { name: "ginger", nameBn: "আদা", quantity: 1, unit: "tbsp" },
      { name: "curry powder", quantity: 2, unit: "tbsp" },
      { name: "coconut milk", quantity: 400, unit: "ml" },
      { name: "spinach", quantity: 2, unit: "cups" },
      { name: "rice", nameBn: "ভাত", quantity: 300, unit: "g", note: "to serve" },
    ],
    steps: [
      {
        text: "Sauté onion in a wide pot until translucent, about 5 minutes.",
        textBn: "পেঁয়াজ কষিয়ে স্বচ্ছ হওয়া পর্যন্ত ভাজুন, প্রায় ৫ মিনিট।",
        timerSeconds: 300,
        videoStart: 30,
        videoEnd: 90,
      },
      {
        text: "Add garlic, ginger and curry powder; bloom the spices for 1 minute.",
        textBn: "রসুন, আদা ও কারি পাউডার দিয়ে ১ মিনিট ভাজুন।",
        videoStart: 90,
        videoEnd: 150,
      },
      {
        text: "Add tomatoes and cook down until jammy, then stir in the chickpeas.",
        textBn: "টমেটো দিয়ে ঘন হওয়া পর্যন্ত রান্না করে ছোলা মিশিয়ে দিন।",
        videoStart: 150,
        videoEnd: 270,
      },
      {
        text: "Pour in coconut milk and simmer 12 minutes, then wilt the spinach through.",
        textBn: "নারকেল দুধ ঢেলে ১২ মিনিট সিদ্ধ করে পালং শাক মিশিয়ে দিন।",
        timerSeconds: 720,
        videoStart: 270,
        videoEnd: 420,
      },
      {
        text: "Serve over steamed rice with a squeeze of lemon.",
        textBn: "ভাতের উপরে দিয়ে লেবুর রস ছড়িয়ে পরিবেশন করুন।",
        videoStart: 420,
        videoEnd: 480,
      },
    ],
    videos: [
      {
        platform: "YOUTUBE",
        url: yt("3yZk1tibX9g"),
        videoId: "3yZk1tibX9g",
        creatorName: "Dr. Sarah Ballantyne",
        isPrimary: true,
      },
    ],
  },
  {
    slug: "vegan-buddha-bowl",
    title: "Rainbow Buddha Bowl",
    titleBn: "রেইনবো বুদ্ধা বোল",
    description:
      "Roasted sweet potato, crispy chickpeas, avocado and kale over quinoa, tied together with a lemon-tahini drizzle.",
    descriptionBn: "রোস্ট মিষ্টি কুমড়া, মুচমুচে ছোলা, অ্যাভোকাডো আর কেল — লেবু-তাহিনি সসে মোড়া পুষ্টিকর বোল।",
    image: img("1512621776951-a57141f2eefd"),
    cuisine: "Mediterranean",
    difficulty: "EASY",
    baseServings: 2,
    prepMinutes: 15,
    cookMinutes: 25,
    calories: 460,
    protein: 16,
    carbs: 52,
    fat: 22,
    tags: ["lunch", "meal-prep", "healthy"],
    dietTags: ["vegan", "vegetarian", "gluten-free"],
    allergens: [],
    ingredients: [
      { name: "quinoa", quantity: 1, unit: "cup" },
      { name: "sweet potato", quantity: 2, unit: "medium", note: "cubed" },
      { name: "chickpeas", nameBn: "ছোলা", quantity: 1, unit: "can" },
      { name: "avocado", quantity: 1, unit: "large" },
      { name: "cherry tomatoes", quantity: 1, unit: "cup" },
      { name: "kale", quantity: 2, unit: "cups", note: "massaged" },
      { name: "tahini", quantity: 3, unit: "tbsp" },
      { name: "lemon", quantity: 1, unit: "whole", note: "juiced" },
    ],
    steps: [
      {
        text: "Roast sweet potato and chickpeas at 200°C for 20 minutes with olive oil and smoked paprika.",
        textBn: "মিষ্টি কুমড়া ও ছোলা জলপাই তেল আর পেপরিকায় ২০০° সেলসিয়াসে ২০ মিনিট সেঁকুন।",
        timerSeconds: 1200,
        videoStart: 20,
        videoEnd: 110,
      },
      {
        text: "Rinse quinoa and simmer with 2 cups water for 15 minutes, covered.",
        textBn: "কোইনোয়া ধুয়ে ২ কাপ পানিতে ঢাকা অবস্থায় ১৫ মিনিট সিদ্ধ করুন।",
        timerSeconds: 900,
        videoStart: 110,
        videoEnd: 200,
      },
      {
        text: "Whisk tahini, lemon juice, garlic and water into a pourable dressing.",
        textBn: "তাহিনি, লেবুর রস, রসুন ও পানি ফেটিয়ে মিহি সস তৈরি করুন।",
        videoStart: 200,
        videoEnd: 280,
      },
      {
        text: "Massage kale with a pinch of salt until silky.",
        textBn: "কেলে সামান্য লবণ দিয়ে মাখিয়ে নরম করুন।",
        videoStart: 280,
        videoEnd: 340,
      },
      {
        text: "Arrange everything in bowls and drizzle generously with the dressing.",
        textBn: "সব উপকরণ বোলে সুন্দর করে সাজিয়ে উপরে সস ছড়িয়ে দিন।",
        videoStart: 340,
        videoEnd: 420,
      },
    ],
    videos: [
      {
        platform: "YOUTUBE",
        url: yt("Wb6eZSdacKY"),
        videoId: "Wb6eZSdacKY",
        creatorName: "Clean & Delicious",
        isPrimary: true,
      },
      {
        platform: "YOUTUBE",
        url: yt("BfEIqju20nQ"),
        videoId: "BfEIqju20nQ",
        creatorName: "Balance & Strength",
      },
    ],
  },
  {
    slug: "fluffy-pancakes",
    title: "Perfect Fluffy Pancakes",
    titleBn: "পারফেক্ট ফালফি প্যানকেক",
    description:
      "Tall, cloud-soft pancakes with golden edges — the Tasty classic that made Sunday breakfast famous.",
    descriptionBn: "তুলতুলে নরম, সোনালি কিনারার প্যানকেক — রবিবার সকালের বিখ্যাত নাস্তা।",
    image: img("1567620905732-2d1ec7ab7445"),
    cuisine: "American",
    difficulty: "EASY",
    baseServings: 4,
    prepMinutes: 10,
    cookMinutes: 15,
    calories: 380,
    protein: 11,
    carbs: 55,
    fat: 12,
    tags: ["breakfast", "kids", "sweet"],
    dietTags: ["vegetarian"],
    allergens: ["gluten", "dairy", "eggs"],
    ingredients: [
      { name: "flour", nameBn: "ময়দা", quantity: 2, unit: "cups" },
      { name: "milk", nameBn: "দুধ", quantity: 1.5, unit: "cups" },
      { name: "eggs", nameBn: "ডিম", quantity: 2, unit: "large" },
      { name: "sugar", quantity: 3, unit: "tbsp" },
      { name: "baking powder", quantity: 2, unit: "tsp" },
      { name: "butter", quantity: 2, unit: "tbsp", note: "melted" },
      { name: "salt", quantity: 0.5, unit: "tsp" },
      { name: "maple syrup", quantity: 0.5, unit: "cup", note: "to serve", optional: true },
    ],
    steps: [
      {
        text: "Whisk flour, sugar, baking powder and salt in a large bowl.",
        textBn: "ময়দা, চিনি, বেকিং পাউডার ও লবণ বড় বাটিতে ফেটিয়ে নিন।",
        videoStart: 30,
        videoEnd: 100,
      },
      {
        text: "In another bowl, beat milk, eggs and melted butter, then fold into the dry mix — lumps are fine.",
        textBn: "অন্য বাটিতে দুধ, ডিম ও মাখন ফেটিয়ে শুকনো মিশ্রণে ঢেলে ভাঁজ করুন — দানা থাকলেই ভালো।",
        tip: "Overmixing makes pancakes chewy; stop while streaks remain.",
        tipBn: "বেশি মেশালে প্যানকেক শক্ত হয়; মিশ্রণে ফোঁটা থাকলেই নামিয়ে ফেলুন।",
        videoStart: 100,
        videoEnd: 210,
      },
      {
        text: "Cook 1/4-cup rounds on medium heat until bubbles pop, about 2 minutes per side.",
        textBn: "মাঝারি আঁচে ১/৪ কাপ মাপের পিঠে ফোটা উঠলে উল্টে দিন, প্রতি পাশে ২ মিনিট।",
        timerSeconds: 240,
        videoStart: 210,
        videoEnd: 300,
      },
      {
        text: "Stack high, crown with butter and drown in maple syrup.",
        textBn: "উঁচু করে সাজিয়ে মাখন আর ম্যাপল সিরাপ ঢেলে পরিবেশন করুন।",
        videoStart: 300,
        videoEnd: 360,
      },
    ],
    videos: [
      {
        platform: "FACEBOOK_REEL",
        url: "https://www.facebook.com/buzzfeedtasty/videos/perfect-fluffy-pancake/2145444825708155",
        videoId: "2145444825708155",
        creatorName: "Tasty",
        creatorHandle: "buzzfeedtasty",
        isPrimary: true,
      },
    ],
  },
  {
    slug: "stuffed-steak-rolls",
    title: "Stuffed Steak Rolls",
    titleBn: "স্টাফড স্টেক রোল",
    description:
      "Thinly pounded flank steak rolled around mozzarella, spinach and peppers, seared then finished in garlic butter.",
    descriptionBn: "পাতলা করে পিটানো স্টেকে মজারেলা, পালং শাক আর লঙ্কা ভরা, রসুন-মাখনে ঝলসানো রোল।",
    image: img("1544025162-d76694265947"),
    cuisine: "American",
    difficulty: "HARD",
    baseServings: 4,
    prepMinutes: 25,
    cookMinutes: 20,
    calories: 520,
    protein: 42,
    carbs: 8,
    fat: 34,
    tags: ["dinner", "date-night", "grill"],
    dietTags: ["keto", "low-carb", "high-protein"],
    allergens: ["dairy"],
    ingredients: [
      { name: "flank steak", quantity: 700, unit: "g" },
      { name: "mozzarella", quantity: 150, unit: "g", note: "shredded" },
      { name: "spinach", quantity: 2, unit: "cups" },
      { name: "red bell pepper", quantity: 1, unit: "large", note: "julienned" },
      { name: "garlic", nameBn: "রসুন", quantity: 4, unit: "cloves" },
      { name: "olive oil", quantity: 2, unit: "tbsp" },
      { name: "rosemary", quantity: 2, unit: "sprigs" },
      { name: "butter", quantity: 2, unit: "tbsp" },
      { name: "salt", quantity: 1, unit: "tsp" },
      { name: "black pepper", quantity: 1, unit: "tsp" },
    ],
    steps: [
      {
        text: "Butterfly and pound the steak into a large, even rectangle; season aggressively.",
        textBn: "স্টেক পাতলা করে বেটে বড় সমান চৌকো বানান; ভালোভাবে মরিনেট করুন।",
        videoStart: 30,
        videoEnd: 150,
      },
      {
        text: "Layer spinach, peppers and mozzarella, leaving a clean border.",
        textBn: "পালং শাক, লঙ্কা আর পনির সমান করে দিন, কিনারা ফাঁকা রাখুন।",
        videoStart: 150,
        videoEnd: 260,
      },
      {
        text: "Roll tightly along the grain, then tie every 4–5 cm with butcher's twine.",
        textBn: "শক্ত করে গড়িয়ে প্রতি ৪–৫ সেমি পরপর সুতা দিয়ে বাঁধুন।",
        videoStart: 260,
        videoEnd: 400,
      },
      {
        text: "Sear all sides in a screaming-hot pan, then baste with garlic butter and rosemary.",
        textBn: "প্রচণ্ড গরম প্যানে চারদিকে ঝলসিয়ে রসুন-মাখন ও রোজমেরিতে বেস্ট করুন।",
        timerSeconds: 600,
        videoStart: 400,
        videoEnd: 560,
      },
      {
        text: "Rest 8 minutes under foil, snip the twine and slice into pinwheels.",
        textBn: "ফয়েল মুড়িয়ে ৮ মিনিট রেখে সুতা কেটে গোলাকার টুকরো করুন।",
        timerSeconds: 480,
        videoStart: 560,
        videoEnd: 640,
      },
    ],
    videos: [
      {
        platform: "FACEBOOK_REEL",
        url: "https://www.facebook.com/buzzfeedtasty/videos/1728676130718362",
        videoId: "1728676130718362",
        creatorName: "Tasty",
        creatorHandle: "buzzfeedtasty",
        isPrimary: true,
      },
    ],
  },
  {
    slug: "cheesy-egg-paratha",
    title: "Cheesy Egg Paratha",
    titleBn: "চিজি ডিম পরোটা",
    description:
      "Flaky paratha stuffed with spiced scrambled egg and molten cheese — the viral Ramadan breakfast from the reels.",
    descriptionBn: "মসলাদার ডিম আর গলা পনিরে ভরা পরোটা — ভাইরাল রমজান নাস্তা।",
    image: img("1631452180519-c014fe946bc7"),
    cuisine: "Bengali",
    difficulty: "EASY",
    baseServings: 2,
    prepMinutes: 15,
    cookMinutes: 15,
    calories: 440,
    protein: 18,
    carbs: 48,
    fat: 20,
    tags: ["breakfast", "ramadan", "kids"],
    dietTags: ["vegetarian", "high-protein"],
    allergens: ["gluten", "dairy", "eggs"],
    ingredients: [
      { name: "flour", nameBn: "ময়দা", quantity: 2, unit: "cups" },
      { name: "eggs", nameBn: "ডিম", quantity: 3, unit: "large" },
      { name: "onion", nameBn: "পেঁয়াজ", quantity: 1, unit: "small", note: "minced" },
      { name: "green chili", nameBn: "কাঁচা লঙ্কা", quantity: 1, unit: "whole", optional: true },
      { name: "cilantro", nameBn: "ধনেপাতা", quantity: 2, unit: "tbsp" },
      { name: "cheese", nameBn: "পনির", quantity: 0.5, unit: "cup", note: "shredded" },
      { name: "butter", quantity: 2, unit: "tbsp" },
      { name: "salt", nameBn: "লবণ", quantity: 0.75, unit: "tsp" },
    ],
    steps: [
      {
        text: "Knead a soft dough with flour, salt and warm water; rest 15 minutes.",
        textBn: "ময়দা, লবণ আর গরম পানিতে নরম ডো মেখে ১৫ মিনিট রেখে দিন।",
        timerSeconds: 900,
      },
      {
        text: "Beat eggs with onion, chili, cilantro and salt.",
        textBn: "ডিমের সাথে পেঁয়াজ, লঙ্কা, ধনেপাতা ও লবণ ফেটিয়ে নিন।",
      },
      {
        text: "Roll the dough thin, cook on a hot tawa, then pour the egg layer over the paratha.",
        textBn: "ডো পাতলা করে বেলে গরম তাওয়ায় দিয়ে উপরে ডিমের মিশ্রণ ছড়িয়ে দিন।",
        tip: "Lift the paratha slightly so the egg runs underneath and seals.",
        tipBn: "পরোটা সামান্য তুলে ডিম নিচে চলে গিয়ে সেট হতে দিন।",
        timerSeconds: 180,
      },
      {
        text: "Flip, brush with butter, scatter cheese and fold into quarters.",
        textBn: "উল্টে মাখন মাখিয়ে পনির ছড়িয়ে চার ভাগে ভাঁজ করুন।",
        timerSeconds: 120,
      },
      {
        text: "Serve hot with ketchup or a smear of mustard sauce.",
        textBn: "গরম গরম কেচাপ বা সরিষা সসের সাথে পরিবেশন করুন।",
      },
    ],
    videos: [
      {
        platform: "INSTAGRAM_REEL",
        url: "https://www.instagram.com/reel/DbTHj3Ct3DY/",
        videoId: "DbTHj3Ct3DY",
        creatorName: "Egg Paratha Reels",
        isPrimary: true,
      },
      {
        platform: "YOUTUBE_SHORTS",
        url: ytShort("O63tdNMtILY"),
        videoId: "O63tdNMtILY",
        creatorName: "Yes I Can Cook",
      },
    ],
  },
  {
    slug: "zero-oil-herb-chicken",
    title: "Zero-Oil Herb Chicken",
    titleBn: "জিরো-অয়েল হার্ব চিকেন",
    description:
      "High-protein chicken breast pan-seared without a drop of oil — yogurt-marinated, herb-crusted, wildly juicy.",
    descriptionBn: "এক ফোঁটা তেল ছাড়া দই-মরিনেট করা, হার্ব-ক্রাস্টেড উচ্চ প্রোটিনের চিকেন ব্রেস্ট।",
    image: img("1598515214211-89d3c73ae83b"),
    cuisine: "Healthy",
    difficulty: "EASY",
    baseServings: 2,
    prepMinutes: 10,
    cookMinutes: 18,
    calories: 260,
    protein: 38,
    carbs: 5,
    fat: 8,
    tags: ["dinner", "fitness", "quick"],
    dietTags: ["high-protein", "low-carb", "keto", "gluten-free"],
    allergens: ["dairy"],
    ingredients: [
      { name: "chicken breast", quantity: 500, unit: "g" },
      { name: "yogurt", nameBn: "টক দই", quantity: 3, unit: "tbsp" },
      { name: "paprika", quantity: 1, unit: "tsp" },
      { name: "garlic powder", quantity: 1, unit: "tsp" },
      { name: "oregano", quantity: 1, unit: "tsp" },
      { name: "black pepper", quantity: 0.5, unit: "tsp" },
      { name: "lemon", quantity: 1, unit: "whole" },
      { name: "salt", quantity: 1, unit: "tsp" },
    ],
    steps: [
      {
        text: "Marinate chicken in yogurt, spices and lemon zest for 10 minutes.",
        textBn: "দই, মসলা আর লেবুর খোসায় চিকেন ১০ মিনিট মেরিনেট করুন।",
        timerSeconds: 600,
      },
      {
        text: "Sear in a non-stick pan over medium heat — no oil needed, the marinade caramelises.",
        textBn: "নন-স্টিক প্যানে মাঝারি আঁচে সিকার — তেল লাগবে না, মরিনেড নিজেই ক্যারামেল হবে।",
        tip: "Medium heat only — high heat burns the yogurt before the chicken cooks.",
        tipBn: "মাঝারি আঁচেই — বেশি আঁচে দই পুড়ে যাবে।",
        timerSeconds: 480,
      },
      {
        text: "Flip once, cook 6 more minutes, then rest and squeeze lemon over.",
        textBn: "একবার উল্টে আরও ৬ মিনিট রান্না করে লেবুর রস ছড়িয়ে দিন।",
        timerSeconds: 360,
      },
    ],
    videos: [
      {
        platform: "YOUTUBE_SHORTS",
        url: ytShort("mnOXEhg8aCQ"),
        videoId: "mnOXEhg8aCQ",
        creatorName: "Yum Recipes Hut",
        isPrimary: true,
      },
    ],
  },
  {
    slug: "viral-omelette",
    title: "3-Minute Viral Omelette",
    titleBn: "ভাইরাল ৩-মিনিট অমলেট",
    description:
      "The fluffy folded omelette from the shorts — custardy middle, golden outside, endless fillings.",
    descriptionBn: "শর্টসের সেই ভাইরাল অমলেট — ভেতরে ক্রিমি, বাইরে সোনালি, ভরাট আপনার পছন্দমতো।",
    image: img("1484723091739-30a097e8f929"),
    cuisine: "Universal",
    difficulty: "EASY",
    baseServings: 1,
    prepMinutes: 3,
    cookMinutes: 4,
    calories: 240,
    protein: 16,
    carbs: 3,
    fat: 18,
    tags: ["breakfast", "quick", "budget"],
    dietTags: ["vegetarian", "low-carb", "keto", "gluten-free", "high-protein"],
    allergens: ["eggs", "dairy"],
    ingredients: [
      { name: "eggs", nameBn: "ডিম", quantity: 3, unit: "large" },
      { name: "milk", nameBn: "দুধ", quantity: 2, unit: "tbsp" },
      { name: "cheese", nameBn: "পনির", quantity: 0.25, unit: "cup" },
      { name: "tomato", nameBn: "টমেটো", quantity: 1, unit: "small", note: "diced" },
      { name: "onion", nameBn: "পেঁয়াজ", quantity: 2, unit: "tbsp", note: "minced" },
      { name: "butter", quantity: 1, unit: "tbsp" },
      { name: "chives", quantity: 1, unit: "tbsp", optional: true },
      { name: "salt", nameBn: "লবণ", quantity: 0.25, unit: "tsp" },
    ],
    steps: [
      {
        text: "Whisk eggs, milk and salt until completely uniform and frothy.",
        textBn: "ডিম, দুধ ও লবণ ফেনা হওয়া পর্যন্ত ভালো করে ফেটিয়ে নিন।",
      },
      {
        text: "Melt butter in a small non-stick pan and pour in the eggs, stirring fast for the first 20 seconds.",
        textBn: "ছোট নন-স্টিক প্যানে মাখন গলিয়ে ডিম ঢেলে প্রথম ২০ সেকেন্ড দ্রুত নাড়ুন।",
        tip: "Fast stirring builds tiny curds — that's the fluff.",
        tipBn: "দ্রুত নাড়লেই ছোট ছোট দানা হয় — এটাই ফালফি ভাব।",
        timerSeconds: 150,
      },
      {
        text: "Scatter tomato, onion and cheese, fold and slide onto toast.",
        textBn: "টমেটো, পেঁয়াজ ও পনির ছড়িয়ে ভাঁজ করে টোস্টে পরিবেশন করুন।",
        timerSeconds: 90,
      },
    ],
    videos: [
      {
        platform: "YOUTUBE_SHORTS",
        url: ytShort("ClmekzKkNj4"),
        videoId: "ClmekzKkNj4",
        creatorName: "Puviya Kitchen",
        isPrimary: true,
      },
    ],
  },
  {
    slug: "crockpot-cheesy-chicken-rice",
    title: "Crockpot Cheesy Chicken & Rice",
    titleBn: "ক্রকপট চিজি চিকেন রাইস",
    description:
      "The twice-viral slow cooker comfort meal: chicken, rice and cheddar melting into one creamy pot.",
    descriptionBn: "দুইবার ভাইরাল হওয়া স্লো-কুকার কমফোর্ট খাবার — চিকেন, ভাত আর চেডার পনিরের ক্রিমি এক পাত্র।",
    image: img("1546069901-ba9599a7e63c"),
    cuisine: "American",
    difficulty: "EASY",
    baseServings: 4,
    prepMinutes: 10,
    cookMinutes: 180,
    calories: 510,
    protein: 36,
    carbs: 48,
    fat: 20,
    tags: ["dinner", "comfort", "slow-cooker"],
    dietTags: ["high-protein", "gluten-free"],
    allergens: ["dairy"],
    ingredients: [
      { name: "chicken breast", quantity: 600, unit: "g" },
      { name: "rice", nameBn: "ভাত", quantity: 1.5, unit: "cups", note: "long grain" },
      { name: "cheddar", quantity: 1.5, unit: "cups", note: "shredded" },
      { name: "cream of chicken soup", quantity: 1, unit: "can" },
      { name: "chicken broth", quantity: 2, unit: "cups" },
      { name: "onion", nameBn: "পেঁয়াজ", quantity: 1, unit: "small" },
      { name: "garlic powder", quantity: 1, unit: "tsp" },
      { name: "salt", quantity: 1, unit: "tsp" },
    ],
    steps: [
      {
        text: "Layer rice, onion, broth and soup in the crockpot; stir once.",
        textBn: "ক্রকপটে ভাত, পেঁয়াজ, ঝোল আর স্যুপ দিয়ে একবার নেড়ে দিন।",
      },
      {
        text: "Nestle the seasoned chicken on top and cook on low for 3 hours.",
        textBn: "মসলা দেওয়া চিকেন উপরে বসিয়ে কম আঁচে ৩ ঘণ্টা রান্না করুন।",
        timerSeconds: 10800,
      },
      {
        text: "Shred the chicken, fold through the rice and blanket with cheddar until melted.",
        textBn: "চিকেন চিবানো করে ভাতের সাথে মিশিয়ে উপরে চেডার ছড়িয়ে গলান।",
        timerSeconds: 300,
      },
    ],
    videos: [
      {
        platform: "YOUTUBE_SHORTS",
        url: ytShort("5kBrafQHEP0"),
        videoId: "5kBrafQHEP0",
        creatorName: "Eating on a Dime",
        isPrimary: true,
      },
    ],
  },
  {
    slug: "ofe-nsala-white-soup",
    title: "Ofe Nsala (White Soup)",
    titleBn: "ওফে এনসালা (হোয়াইট সুপ)",
    description:
      "Nigeria's celebratory white soup — goat meat, smoked fish and uziza in a lightly thickened, pepper-bright broth.",
    descriptionBn: "নাইজেরিয়ার উৎসবের সাদা স্যুপ — ছাগলের মাংস, স্মোকড ফিশ আর উজিজা পাতার ঝাল-ঝাল ঝোল।",
    image: img("1547592166-23ac45744acd"),
    cuisine: "Nigerian",
    difficulty: "MEDIUM",
    baseServings: 4,
    prepMinutes: 15,
    cookMinutes: 60,
    calories: 390,
    protein: 32,
    carbs: 10,
    fat: 24,
    tags: ["dinner", "weekend", "traditional"],
    dietTags: ["high-protein", "gluten-free", "low-carb"],
    allergens: ["fish", "shellfish"],
    ingredients: [
      { name: "goat meat", quantity: 800, unit: "g", note: "bone-in pieces" },
      { name: "smoked fish", quantity: 150, unit: "g" },
      { name: "uziza leaves", quantity: 1, unit: "handful", note: "sliced" },
      { name: "ehuru", quantity: 3, unit: "seeds", note: "ground" },
      { name: "crayfish", quantity: 2, unit: "tbsp", note: "ground" },
      { name: "palm oil", quantity: 2, unit: "tbsp" },
      { name: "yam powder", quantity: 3, unit: "tbsp", note: "as thickener", optional: true },
      { name: "onion", nameBn: "পেঁয়াজ", quantity: 1, unit: "medium" },
      { name: "stock cubes", quantity: 2, unit: "whole" },
      { name: "scotch bonnet", quantity: 1, unit: "whole" },
    ],
    steps: [
      {
        text: "Season the goat meat with stock cubes, onion and pepper; boil until tender, about 45 minutes.",
        textBn: "ছাগলের মাংসে স্টক কিউব, পেঁয়াজ ও লঙ্কা দিয়ে নরম হওয়া পর্যন্ত ৪৫ মিনিট সিদ্ধ করুন।",
        timerSeconds: 2700,
      },
      {
        text: "Add smoked fish, ground ehuru and crayfish; simmer 10 minutes.",
        textBn: "স্মোকড ফিশ, এহুরু আর ক্রেফিশ দিয়ে ১০ মিনিট সিদ্ধ করুন।",
        timerSeconds: 600,
      },
      {
        text: "Stir in palm oil and yam powder to lightly thicken the broth.",
        textBn: "পাম তেল আর ইয়াম পাউডার দিয়ে ঝোল ঘন করুন।",
        videoStart: 60,
        videoEnd: 180,
      },
      {
        text: "Finish with uziza leaves, rest 5 minutes and serve with pounded yam.",
        textBn: "উজিজা পাতা দিয়ে ৫ মিনিট রেখে পাউন্ডেড ইয়ামের সাথে পরিবেশন করুন।",
        timerSeconds: 300,
        videoStart: 180,
        videoEnd: 300,
      },
    ],
    videos: [
      {
        platform: "YOUTUBE",
        url: yt("FXI1dAdwl-8"),
        videoId: "FXI1dAdwl-8",
        creatorName: "Joyful Cook",
        isPrimary: true,
      },
    ],
  },
  {
    slug: "jamaican-chickpea-curry",
    title: "Jamaican Chickpea Curry",
    titleBn: "জামাইকান ছোলা কারি",
    description:
      "Island-style chickpeas in coconut curry with sweet potato and scotch bonnet heat — vegan rasta pasta's calmer cousin.",
    descriptionBn: "নারকেল কারিতে জামাইকান ঘরের ছোলা, মিষ্টি কুমড়া আর স্কচ বনেটের ঝাল — সম্পূর্ণ নিরামিষ।",
    image: img("1476718406336-bb5a9690ee2a"),
    cuisine: "Jamaican",
    difficulty: "EASY",
    baseServings: 4,
    prepMinutes: 10,
    cookMinutes: 30,
    calories: 400,
    protein: 13,
    carbs: 54,
    fat: 16,
    tags: ["dinner", "spicy", "budget"],
    dietTags: ["vegan", "vegetarian", "gluten-free"],
    allergens: [],
    ingredients: [
      { name: "chickpeas", nameBn: "ছোলা", quantity: 2, unit: "cans" },
      { name: "coconut milk", quantity: 400, unit: "ml" },
      { name: "sweet potato", quantity: 1, unit: "large", note: "cubed" },
      { name: "onion", nameBn: "পেঁয়াজ", quantity: 1, unit: "medium" },
      { name: "bell pepper", quantity: 1, unit: "large" },
      { name: "garlic", nameBn: "রসুন", quantity: 3, unit: "cloves" },
      { name: "scallion", quantity: 3, unit: "stalks" },
      { name: "thyme", quantity: 4, unit: "sprigs" },
      { name: "jamaican curry powder", quantity: 2, unit: "tbsp" },
      { name: "scotch bonnet", quantity: 1, unit: "whole", optional: true },
    ],
    steps: [
      {
        text: "Sizzle onion, garlic, scallion and thyme in oil until the kitchen smells like Kingston.",
        textBn: "পেঁয়াজ, রসুন, স্ক্যালিয়ন আর থাইম ভাজুন যতক্ষণ না সুগন্ধ ছড়িয়ে যায়।",
        timerSeconds: 300,
      },
      {
        text: "Bloom the curry powder for 1 minute, then add sweet potato and bell pepper.",
        textBn: "কারি পাউডার ১ মিনিট ভেজে মিষ্টি কুমড়া ও লঙ্কা দিন।",
        timerSeconds: 60,
      },
      {
        text: "Pour in coconut milk and chickpeas; simmer 20 minutes until the potato is fork-tender.",
        textBn: "নারকেল দুধ ও ছোলা দিয়ে ২০ মিনিট সিদ্ধ করুন, কুমড়া নরম হলেই নামান।",
        timerSeconds: 1200,
      },
      {
        text: "Drop in the scotch bonnet whole for fragrance without fire, and serve with rice & peas.",
        textBn: "পুরো স্কচ বনেট ভেসে দিন — ঝাল নিয়ন্ত্রণে থাকবে; রাইস অ্যান্ড পিজ-এর সাথে পরিবেশন করুন।",
        timerSeconds: 120,
      },
    ],
    videos: [
      {
        platform: "YOUTUBE_SHORTS",
        url: ytShort("hjGvjiAiASI"),
        videoId: "hjGvjiAiASI",
        creatorName: "Ken in the Kitchen - Island Vegan",
        isPrimary: true,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

const USERS = [
  { email: "chef@recipehub.app", name: "Demo Chef", password: "cook1234", avatarEmoji: "🧑‍🍳" },
  { email: "ayesha@example.com", name: "Ayesha R.", password: "cook1234", avatarEmoji: "👩‍🍳" },
  { email: "rafi@example.com", name: "Rafi H.", password: "cook1234", avatarEmoji: "👨‍🍳" },
  { email: "maria@example.com", name: "Maria G.", password: "cook1234", avatarEmoji: "🙋‍♀️" },
  { email: "admin@recipehub.app", name: "RecipeHub Admin", password: "admin1234", avatarEmoji: "🛡️" },
];

/* ------------------------------------------------------------------ */
/* Seed runner                                                         */
/* ------------------------------------------------------------------ */

async function main() {
  console.log("Clearing existing data…");
  await db.$transaction([
    db.review.deleteMany(),
    db.favorite.deleteMany(),
    db.collectionRecipe.deleteMany(),
    db.collection.deleteMany(),
    db.video.deleteMany(),
    db.cookingStep.deleteMany(),
    db.recipeIngredient.deleteMany(),
    db.recipe.deleteMany(),
    db.ingredient.deleteMany(),
    db.session.deleteMany(),
    db.user.deleteMany(),
  ]);

  console.log("Seeding users…");
  const hashed = await Promise.all(USERS.map((u) => bcrypt.hash(u.password, 10)));
  const users: Record<string, string> = {};
  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const created = await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        hashedPassword: hashed[i],
        avatarEmoji: u.avatarEmoji,
        role: u.email.startsWith("admin@") ? "ADMIN" : "USER",
      },
    });
    users[u.email] = created.id;
  }

  console.log("Seeding ingredients…");
  // Common Bengali names for shared ingredients.
  const BN: Record<string, string> = {
    onion: "পেঁয়াজ", tomato: "টমেটো", garlic: "রসুন", ginger: "আদা", rice: "ভাত",
    eggs: "ডিম", flour: "ময়দা", milk: "দুধ", butter: "মাখন", cheese: "পনির",
    chickpeas: "ছোলা", "coconut milk": "নারকেল দুধ", spinach: "পালং শাক", salt: "লবণ",
    yogurt: "দই", "chicken breast": "মুরগির বুক", cilantro: "ধনেপাতা", lemon: "লেবু",
  };
  const SUBS: Record<string, string[]> = {
    yogurt: ["greek yogurt", "sour cream", "coconut yogurt"],
    "coconut milk": ["heavy cream", "cashew cream", "evaporated milk"],
    "greek yogurt": ["sour cream", "yogurt"],
    "sour cream": ["greek yogurt", "crème fraîche"],
    guanciale: ["pancetta", "bacon"],
    "pecorino romano": ["parmesan", "grana padano"],
    parmesan: ["pecorino romano"],
    quinoa: ["brown rice", "couscous", "bulgur"],
    chickpeas: ["cannellini beans", "butter beans"],
    "garam masala": ["curry powder", "allspice + cumin"],
    "curry powder": ["garam masala", "madras curry powder"],
    tahini: ["peanut butter", "sunflower seed butter"],
    mozzarella: ["provolone", "monterey jack"],
    cheddar: ["gouda", "monterey jack"],
    butter: ["ghee", "coconut oil", "margarine"],
    ghee: ["butter", "coconut oil"],
    cilantro: ["parsley", "thai basil"],
    kale: ["spinach", "swiss chard"],
    spinach: ["kale", "water spinach"],
    "heavy cream": ["coconut milk", "greek yogurt"],
    "scotch bonnet": ["habanero", "serrano + a pinch of allspice"],
    "flank steak": ["skirt steak", "hanger steak"],
  };

  const ingredientIds = new Map<string, string>();
  const allNames = new Set<string>();
  for (const r of RECIPES) for (const i of r.ingredients) allNames.add(i.name);
  for (const name of allNames) {
    const created = await db.ingredient.create({
      data: {
        name,
        nameBn: BN[name] ?? null,
        key: name,
        substitutes: SUBS[name] ?? [],
      },
    });
    ingredientIds.set(name, created.id);
  }

  console.log("Seeding recipes…");
  const recipeIds: Record<string, string> = {};
  for (const r of RECIPES) {
    const created = await db.recipe.create({
      data: {
        slug: r.slug,
        title: r.title,
        titleBn: r.titleBn,
        description: r.description,
        descriptionBn: r.descriptionBn,
        image: r.image,
        cuisine: r.cuisine,
        difficulty: r.difficulty,
        baseServings: r.baseServings,
        prepMinutes: r.prepMinutes,
        cookMinutes: r.cookMinutes,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        tags: r.tags,
        dietTags: r.dietTags,
        allergens: r.allergens,
        status: "PUBLISHED",
        authorId: users["chef@recipehub.app"],
        ingredients: {
          create: r.ingredients.map((i) => ({
            ingredientId: ingredientIds.get(i.name)!,
            quantity: i.quantity ?? null,
            unit: i.unit ?? null,
            note: i.note ?? null,
            optional: i.optional ?? false,
          })),
        },
        steps: {
          create: r.steps.map((s, idx) => ({
            order: idx + 1,
            text: s.text,
            textBn: s.textBn ?? null,
            tip: s.tip ?? null,
            tipBn: s.tipBn ?? null,
            timerSeconds: s.timerSeconds ?? null,
            videoStart: s.videoStart ?? null,
            videoEnd: s.videoEnd ?? null,
          })),
        },
        videos: {
          create: r.videos.map((v) => ({
            platform: v.platform,
            originalUrl: v.url,
            videoId: v.videoId,
            creatorName: v.creatorName,
            creatorHandle: v.creatorHandle ?? null,
            isPrimary: v.isPrimary ?? false,
          })),
        },
      },
    });
    recipeIds[r.slug] = created.id;
  }

  console.log("Seeding reviews, favorites, collections…");
  const reviews: Array<[string, string, number, string | null, boolean]> = [
    ["chicken-curry", "ayesha@example.com", 5, "Made this twice this week — the onion step is everything. খুবই সুস্বাদু! 🍛", false],
    ["chicken-curry", "rafi@example.com", 4, "Great depth of flavor. I added a cinnamon stick while simmering.", false],
    ["classic-carbonara", "maria@example.com", 5, "Off-heat trick saved my eggs. Silky perfection.", false],
    ["classic-carbonara", "rafi@example.com", 4, "Guanciale is worth hunting down, but bacon works in a pinch.", false],
    ["vegan-buddha-bowl", "ayesha@example.com", 5, "Meal-prepped three days of lunches. The tahini dressing is elite.", false],
    ["fluffy-pancakes", "maria@example.com", 5, "Kids demanded seconds and thirds. Tallest pancakes I've made.", false],
    ["cheesy-egg-paratha", "rafi@example.com", 5, "রমজানের সেহরিতে বানিয়েছি — দারুণ হয়েছে! The reels video makes it so easy.", false],
    ["zero-oil-herb-chicken", "maria@example.com", 4, "Genuinely juicy without oil. Yogurt marinade is doing God's work.", false],
    ["stuffed-steak-rolls", "rafi@example.com", 5, "Showstopper for date night. Twine tying makes it foolproof.", false],
    ["ofe-nsala-white-soup", "ayesha@example.com", 5, "Tastes like a Sunday in Enugu. Uziza is non-negotiable.", false],
    ["spam-recipe-review", "maria@example.com", 1, "CHEAP FOLLOWERS HERE >>> spam-link.example.com", true],
  ];
  for (const [slug, email, rating, body, flagged] of reviews) {
    const recipeId = recipeIds[slug];
    if (!recipeId) continue;
    await db.review.create({
      data: { recipeId, userId: users[email], rating, body, flagged },
    }).catch(() => {}); // spam demo review targets a non-existent slug
  }

  const favs: Array<[string, string]> = [
    ["ayesha@example.com", "chicken-curry"],
    ["ayesha@example.com", "vegan-buddha-bowl"],
    ["chef@recipehub.app", "classic-carbonara"],
    ["chef@recipehub.app", "cheesy-egg-paratha"],
    ["rafi@example.com", "stuffed-steak-rolls"],
    ["rafi@example.com", "cheesy-egg-paratha"],
  ];
  for (const [email, slug] of favs) {
    await db.favorite.create({ data: { userId: users[email], recipeId: recipeIds[slug] } }).catch(() => {});
  }

  const collections: Array<[string, string, string, string[]]> = [
    ["chef@recipehub.app", "Ramadan Meals", "🌙", ["cheesy-egg-paratha", "zero-oil-herb-chicken", "chicken-curry"]],
    ["chef@recipehub.app", "Quick 15-min Dinners", "⚡", ["viral-omelette", "creamy-chickpea-curry", "jamaican-chickpea-curry"]],
    ["ayesha@example.com", "Meal Prep Sundays", "🥗", ["vegan-buddha-bowl", "crockpot-cheesy-chicken-rice"]],
  ];
  for (const [email, name, emoji, slugs] of collections) {
    const col = await db.collection.create({ data: { userId: users[email], name, emoji } });
    for (const slug of slugs) {
      await db.collectionRecipe.create({ data: { collectionId: col.id, recipeId: recipeIds[slug] } });
    }
  }

  const counts = {
    users: await db.user.count(),
    recipes: await db.recipe.count(),
    ingredients: await db.ingredient.count(),
    steps: await db.cookingStep.count(),
    videos: await db.video.count(),
    reviews: await db.review.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
