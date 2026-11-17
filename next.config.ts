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

  /**
   * ⚠️ BU "YANGILANDI" DEGAN BELGI EMAS — TEKSHIRUVNI YOQADI.
   *
   * Qiymat berilganda `next build` har safar o'rnatilgan Next
   * versiyasini e'lon qilingan xavfsizlik ogohlantirishlari bilan
   * solishtiradi va zaifligi topilsa build'ni TO'XTATADI
   * (`dist/build/index.js` dagi `nudgeUpgrade`).
   *
   * ⚠️ YA'NI BUILD BIR KUN KELIB "SABABSIZ" YIQILISHI MUMKIN: kod
   * o'zgarmaydi, lekin yangi ogohlantirish chiqqan bo'ladi. Buni
   * bilmasdan turib sababni topish qiyin — shuning uchun shu izoh
   * bor.
   *
   * ⚠️ SHUNGA QARAMAY YOQILGAN: panel viloyat ma'muriyati uchun va
   * zaiflik haqida JIM qolish eng yomon variant bo'lardi — bu
   * `ignoreBuildErrors: false` bilan ayni qaror. Deploy quvuri
   * to'xtab qolishi kerak bo'lmasa, shu kalitni olib tashlang.
   */
  experimental: { agentUpgrade: "security" },
};

export default config;
