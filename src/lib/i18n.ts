export type Lang = "en" | "bn";

type Dict = Record<string, { en: string; bn: string }>;

export const t: Dict = {
  "brand.tagline": { en: "Cook smarter. Eat better", bn: "স্মার্ট রান্না। স্বাস্থ্যকর খাবার" },
  "brand.sub": {
    en: "Save recipes from anywhere, watch every step, and turn everyday cooking into something effortless.",
    bn: "যেকোনো রেসিপি সংরক্ষণ করুন, প্রতিটি ধাপ দেখুন, আর রান্নাকে করুন সহজ।",
  },
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.recipes": { en: "Recipes", bn: "রেসিপি" },
  "nav.pantry": { en: "Pantry", bn: "প্যান্ট্রি" },
  "nav.favorites": { en: "Favorites", bn: "প্রিয়" },
  "nav.add": { en: "Add", bn: "যোগ" },
  "nav.profile": { en: "Profile", bn: "প্রোফাইল" },
  "nav.settings": { en: "Settings", bn: "সেটিংস" },
  "action.startCooking": { en: "Start Cooking", bn: "রান্না শুরু করুন" },
  "action.save": { en: "Save", bn: "সংরক্ষণ" },
  "action.saved": { en: "Saved", bn: "সংরক্ষিত" },
  "action.watchOn": { en: "Watch on", bn: "দেখুন" },
  "action.search": { en: "Search recipes, ingredients…", bn: "রেসিপি, উপকরণ খুঁজুন…" },
  "section.trending": { en: "Trending Recipes", bn: "জনপ্রিয় রেসিপি" },
  "section.reels": { en: "Recipe Reels & Shorts", bn: "রেসিপি রিলস ও শর্টস" },
  "section.popular": { en: "Popular Recipes", bn: "জনপ্রিয় রেসিপি" },
  "section.ingredients": { en: "Ingredients", bn: "উপকরণ" },
  "section.steps": { en: "Cooking Steps", bn: "রান্নার ধাপ" },
  "section.nutrition": { en: "Nutrition per serving", bn: "প্রতি পরিবেশনে পুষ্টি" },
  "section.reviews": { en: "Reviews", bn: "রিভিউ" },
  "label.cookTime": { en: "Cook Time", bn: "রান্নার সময়" },
  "label.prepTime": { en: "Prep Time", bn: "প্রস্তুতির সময়" },
  "label.skillLevel": { en: "Skill Level", bn: "দক্ষতা" },
  "label.ingredients": { en: "Ingredients", bn: "উপকরণ" },
  "label.calories": { en: "Est. Calories", bn: "ক্যালোরি" },
  "label.cookingFor": { en: "Cooking for", bn: "রান্না করছি" },
  "label.servings": { en: "servings", bn: "পরিবেশন" },
  "label.addAll": { en: "Add all", bn: "সব যোগ করুন" },
  "label.substitute": { en: "Substitute", bn: "বিকল্প" },
  "label.match": { en: "Match", bn: "ম্যাচ" },
  "label.missing": { en: "Missing", bn: "অনুপস্থিত" },
  "label.minutes": { en: "min", bn: "মিনিট" },
  "voice.listen": { en: "Voice: listening — say “next step”, “repeat”, or “timer 5 minutes”", bn: "ভয়েস: শুনছি — বলুন “পরবর্তী ধাপ”, “আবার”, বা “টাইমার ৫ মিনিট”" },
  "voice.unsupported": { en: "Voice control needs Chrome or Edge", bn: "ভয়েস কন্ট্রোলের জন্য Chrome বা Edge দরকার" },
  "voice.next": { en: "Next Step", bn: "পরবর্তী ধাপ" },
  "voice.repeat": { en: "Repeat Step", bn: "আবার দেখাও" },
  "step.of": { en: "Step", bn: "ধাপ" },
  "timer.set": { en: "Start Timer", bn: "টাইমার শুরু" },
  "timer.done": { en: "Time’s up!", bn: "সময় শেষ!" },
  "auth.login": { en: "Sign in", bn: "সাইন ইন" },
  "auth.signup": { en: "Sign up", bn: "সাইন আপ" },
  "auth.logout": { en: "Sign out", bn: "সাইন আউট" },
  "empty.noResults": { en: "No recipes found", bn: "কোনো রেসিপি পাওয়া যায়নি" },
};

export function tr(key: keyof typeof t | string, lang: Lang): string {
  const entry = t[key as string];
  if (!entry) return key as string;
  return lang === "bn" ? entry.bn : entry.en;
}

/** Pick localized content with graceful fallback to English. */
export function pick(lang: Lang, en: string | null | undefined, bn: string | null | undefined): string {
  if (lang === "bn" && bn) return bn;
  return en ?? "";
}

export const DIETS = [
  { key: "vegan", en: "Vegan", bn: "ভেগান" },
  { key: "vegetarian", en: "Vegetarian", bn: "নিরামিষ" },
  { key: "keto", en: "Keto", bn: "কিটো" },
  { key: "gluten-free", en: "Gluten-free", bn: "গ্লুটেন মুক্ত" },
  { key: "high-protein", en: "High protein", bn: "প্রোটিন বেশি" },
  { key: "low-carb", en: "Low carb", bn: "কম কার্ব" },
] as const;

export const ALLERGENS = [
  { key: "dairy", en: "Dairy", bn: "দুগ্ধ" },
  { key: "eggs", en: "Eggs", bn: "ডিম" },
  { key: "peanuts", en: "Peanuts", bn: "চিনাবাদাম" },
  { key: "tree-nuts", en: "Tree nuts", bn: "বাদাম" },
  { key: "shellfish", en: "Shellfish", bn: "চিংড়ি/শামুক" },
  { key: "soy", en: "Soy", bn: "সয়া" },
  { key: "gluten", en: "Gluten", bn: "গ্লুটেন" },
  { key: "fish", en: "Fish", bn: "মাছ" },
] as const;
