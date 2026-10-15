import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,

  /**
   * ⚠️ BUILD XATOLARI JIM O'TKAZILMAYDI. Next `ignoreBuildErrors`
   * ni taklif qiladi, lekin tur xatosi bilan chiqarilgan panel
   * ishlab chiqarishda ishlamay qoladi — va buni faqat
   * foydalanuvchi aytadi.
   *
   * ⚠️ `eslint` KALITI YO'Q: Next 16 da u `NextConfig` dan olib
   * tashlangan (lint alohida `next lint` buyrug'i bilan ishlaydi).
   */
  typescript: { ignoreBuildErrors: false },
};

export default config;
