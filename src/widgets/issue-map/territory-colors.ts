/**
 * HUDUD RANGLARI — IKKITA, KO'P EMAS.
 *
 * ── NIMA UCHUN IKKITA ─────────────────────────────────────────────────
 *
 * ⚠️ AVVAL HAR HUDUD O'Z RANGIDA EDI (atlasdagidek, 16 ta rang) va u
 * ikki muammo tug'dirardi:
 *
 *   1. 900 ta MFY rangli mozaikaga aylanib, undan hech narsa
 *      o'qib bo'lmasdi;
 *   2. rang HECH NARSANI anglatmasdi — u shunchaki "bu boshqa
 *      hudud" degan belgi edi, holbuki o'sha ishni CHEGARA
 *      chizig'i allaqachon bajaradi.
 *
 * Endi rang BITTA savolga javob beradi: "men qayerdaman". Tanlangan
 * hudud ajralib turadi, qolgani fon bo'ladi — ya'ni rang e'tiborni
 * tortadigan joyni KO'RSATADI, bezak bo'lib qolmaydi.
 *
 * ⚠️ AJRATUVCHI — CHEGARA, RANG EMAS: shuning uchun chiziq QUYUQ
 * va har poligonda ko'rinadi. Ikki qo'shni hudud bir xil rangda
 * bo'lsa ham, ular chegarasi bilan aniq ajraladi.
 *
 * ⚠️ MAVZUGA BOG'LIQ EMAS: ranglar ochiq va ikki mavzuda ham bir
 * xil. Mavzuga moslansa, bir xil holat (tanlangan / tanlanmagan)
 * ikki xil rangda ko'rinib, belgi ma'nosini yo'qotardi.
 *
 * ⚠️ YORLIQ MATNI RANGGA QARAB (`leaflet-map.tsx#drawLabels`):
 * och fon ustida qora, quyuq faol rang ustida oq. Bitta rangda
 * qotirilsa, ikkisidan birida matn o'qilmay qolardi.
 */

/** Tanlanmagan hudud — fon. */
export const TERRITORY_BASE = "#dfe4ea";

/**
 * Tanlangan hudud — e'tibor shu yerda.
 *
 * ⚠️ QUYUQ, OCHIQ EMAS: och yashil (`#7fd4ab`) fon kulrangidan
 * yetarlicha ajralmasdi — ayniqsa viloyat masshtabida, ochilgan
 * tuman kichik dog' bo'lib qolganda. Quyuq rang "men shu yerdaman"
 * degan belgini bir qarashda beradi.
 *
 * ⚠️ SHU SABABLI YORLIQ MATNI O'ZGARADI: faol hudud ustida matn
 * OQ bo'ladi (`leaflet-map.tsx#drawLabels`) — qora matn quyuq
 * yashilda o'qilmasdi.
 */
export const TERRITORY_ACTIVE = "#1e8f5c";

/**
 * Sichqoncha ostidagi hudud.
 *
 * ⚠️ IKKI RANGDA UCHINCHI HOLAT KERAK: hamma poligon bir xil
 * bo'lgani uchun "men qaysi shakl ustidaman" degan savolga javob
 * faqat shu yoritishdan keladi. Tultip bir shaklning nomini
 * aytadi, lekin uning CHEGARASI qayergacha ekanini ko'rsatmaydi.
 */
export const TERRITORY_HOVER = "#c3ccd6";

/**
 * Sichqoncha FAOL hudud ustida.
 *
 * ⚠️ ALOHIDA QIYMAT: faol shaklni kulrangga bo'yash uni
 * "tanlanmagan" qilib ko'rsatardi — yoritish holatni
 * O'ZGARTIRMASLIGI kerak, faqat chegarani ko'rsatishi kerak.
 */
export const TERRITORY_ACTIVE_HOVER = "#17704a";

/** Hudud chegarasi — quyuq, ajratuvchi vazifasini bajaradi. */
export const TERRITORY_BORDER = "#475569";

/** Tanlangan hududning chegarasi — eng quyuq va qalin. */
export const TERRITORY_BORDER_ACTIVE = "#0f172a";
