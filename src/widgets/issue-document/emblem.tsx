/**
 * HUJJAT GERBI — soddalashtirilgan ramziy chizma (SVG).
 *
 * ⚠️ RASM FAYLI EMAS, INLINE SVG: hujjat CHOP ETILADI va tashqi
 * rasm chop etish oynasi ochilgan paytda hali yuklanmagan bo'lishi
 * mumkin — qog'ozda gerb o'rnida bo'sh joy chiqardi. Inline SVG esa
 * sahifaning O'ZI bilan birga keladi.
 *
 * ⚠️ RASMIY DAVLAT GERBINING NUSXASI EMAS va bo'lishi ham shart
 * emas: bu panel ichidagi ichki hujjat (ro'yxatga olingan murojaat
 * bayonnomasi), davlat blankasi emas. Rasmiy gerb kerak bo'lsa, u
 * alohida vektor fayl sifatida qo'yiladi — lekin u holda huquqiy
 * tomoni ham hal qilinishi lozim.
 *
 * ⚠️ CHIZMA ATAYLAB SODDA: avvalgi variantda quyosh nurlari,
 * tog'lar, boshoq va lenta bor edi va 64–80 piksel o'lchamda
 * ularning chiziqlari bir-biriga qo'shilib, GERB O'RNIGA DOG'
 * ko'rinardi — ayniqsa chop etilganda. Qog'ozda o'qiladigan
 * narsa — kam sonli, qalin chiziq.
 *
 * ⚠️ `currentColor`: chop etishda qora, ekranda esa mavzu rangi.
 */
export const Emblem = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 64 70"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Yulduz — tepada */}
    <path
      d="M32 3 L34.1 9.4 L40.8 9.4 L35.4 13.4 L37.4 19.8 L32 15.8 L26.6 19.8 L28.6 13.4 L23.2 9.4 L29.9 9.4 Z"
      strokeWidth={1.8}
    />

    {/* Qalqon — davlat ramzi emas, HUJJAT belgisi */}
    <path d="M32 22 L51 28 V42 Q51 55 32 63 Q13 55 13 42 V28 Z" strokeWidth={2.2} />

    {/* Quyosh — qalqon ichida */}
    <circle cx="32" cy="36" r="6.5" strokeWidth={1.8} />

    {/* Tog' cho'qqilari — quyosh ostida */}
    <path d="M20 50 L27 42 L32 47 L38 40 L45 50" strokeWidth={1.8} />
  </svg>
);
