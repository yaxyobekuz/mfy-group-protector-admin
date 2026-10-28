/* eslint-disable @next/next/no-img-element */

/**
 * O'ZBEKISTON RESPUBLIKASI DAVLAT GERBI — hujjat blankasi uchun.
 *
 * ⚠️ HAQIQIY GERB, CHIZMA EMAS: avval bu yerda qo'lda chizilgan
 * soddalashtirilgan ramz turardi va u rasmiy hujjatga YARAMASDI —
 * blankadagi gerb davlat ramzining O'ZI bo'lishi kerak, unga
 * o'xshatilgan rasm emas. Fayl Wikimedia Commons'dan olingan
 * (`PD-UZ-exempt`: rasmiy ramzlar mualliflik huquqi obyekti emas) —
 * batafsil: `public/gerb.svg.README.md`.
 *
 * ⚠️ `<img>`, INLINE `<svg>` EMAS: gerb — 138 KB vektor ma'lumot va
 * komponent ichiga yozilsa, u JS TO'PLAMIGA tushib, gerb kerak
 * bo'lmagan har bir sahifada ham yuklanardi. `public/` dagi fayl
 * esa brauzerda KESHLANADI va faqat hujjat ochilganda so'raladi.
 *
 * ⚠️ `next/image` ISHLATILMAYDI: u SVG ni optimallashtirmaydi
 * (standart holda `unoptimized` talab qiladi) va faqat ortiqcha
 * o'ram qo'shardi — bu yerda o'lchamlar qat'iy va javob beruvchi
 * rasm kerak emas.
 *
 * ⚠️ CHOP ETISHDA RANGLI QOLADI: gerb `globals.css` dagi "hamma
 * narsa qora" qoidasidan CHIQARILGAN (`.print-sheet svg` qoidasi
 * endi faqat `<svg>` ga tegadi, `<img>` ga emas). Oq-qora
 * printerda u o'zi kulrang bosiladi va shaklini saqlaydi —
 * tekshirilgan.
 */
export const Emblem = ({ className }: { className?: string }) => (
  <img
    src="/gerb.svg"
    alt="O'zbekiston Respublikasi Davlat gerbi"
    className={className}
    /* ⚠️ O'LCHAM ATRIBUTLARI: ularsiz rasm yuklanguncha balandlik
       0 bo'lib, blanka sarlavhasi SAKRAB tushardi (layout shift) —
       bu ayniqsa chop etish oynasi ochilayotganda ko'zga tashlanadi.
       Nisbat SVG `viewBox` idan: 191.453 × 201.48. */
    width={191}
    height={201}
  />
);
