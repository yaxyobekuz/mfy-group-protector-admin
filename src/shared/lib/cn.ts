import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind klasslarini birlashtiradi.
 *
 * ⚠️ `twMerge` KERAK, oddiy `clsx` yetarli emas: `clsx` ikki
 * qarama-qarshi klassni (`p-2 p-4`) ikkalasini qoldiradi va
 * natijani CSS tartibida brauzer hal qiladi — ya'ni komponentga
 * tashqaridan berilgan `className` ichki qiymatni USTIGA YOZMAY
 * qolishi mumkin. `twMerge` oxirgisini qoldiradi.
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
