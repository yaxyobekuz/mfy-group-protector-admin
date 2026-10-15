# Viloyat shtabi — Admin panel

MFY guruhlaridagi muammolarni aniqlash tizimining boshqaruv paneli.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind · Radix UI ·
TanStack Query · Recharts

---

## Tuzilma — FSD

```
src/
├── app/                    Next App Router (yo'llar + provider'lar)
│   ├── (app)/              himoyalangan sahifalar (AppShell ichida)
│   ├── login/              kirish (shell'dan TASHQARIDA)
│   ├── layout.tsx
│   ├── providers.tsx       QueryClient, tema, sessiya
│   └── globals.css         ranglar — YAGONA manba
│
├── widgets/                mustaqil UI bloklar
│   ├── app-shell/          sidebar + header + kirish nazorati
│   ├── page-header/
│   └── stat-tile/
│
├── features/               foydalanuvchi amallari (vertikal)
│   ├── signals/            api + karta + biriktirish oynasi
│   ├── issues/
│   ├── groups/
│   ├── territory/
│   ├── users/
│   └── reports/            hisobot + sozlama + audit query'lari
│
├── entities/               domen obyektlari
│   └── session/            kim kirgan, nimaga ruxsati bor
│
└── shared/                 hamma qatlam ishlatadi
    ├── api/                client, turlar, query kalitlari
    ├── config/             yorliqlar, navigatsiya
    ├── lib/                sana, cn
    └── ui/                 primitivlar
```

### Qatlam qoidasi

Import **faqat pastga** yo'naladi:

```
app → widgets → features → entities → shared
```

⚠️ `shared` hech kimni import qilmaydi, `entities` faqat `shared` ni, va
hokazo. Buzilsa aylanma bog'liqlik paydo bo'ladi va Next'ning build'i
tushunarsiz xato beradi.

---

## Ishga tushirish

```bash
cp .env.example .env     # NEXT_PUBLIC_API_URL ni to'ldiring
npm install
npm run dev              # http://localhost:3000
```

⚠️ `NEXT_PUBLIC_` prefiksi **majburiy**: bu qiymat brauzerga tushadi
(panel serverga mijozdan murojaat qiladi). Prefikssiz o'zgaruvchi faqat
server komponentlarida ko'rinadi va mijozda `undefined` bo'lib qolardi —
xato esa faqat brauzer konsolida chiqardi.

⚠️ **Bu faylga sir yozilmaydi.** API kalitlari va JWT sirlari serverda
(`server/.env`).

Birinchi kirish: seed yaratgan `owner` (standart `owner` / `owner123`).

---

## Sahifalar

| Yo'l | Nima | Ruxsat |
|---|---|---|
| `/` | Boshqaruv paneli — "hozir nima kutib turibdi" | — |
| `/signals` | AI topgan gaplar → murojaatga aylantirish | `signals.view` |
| `/issues` | Rasmiy murojaat navbati | `issues.view` |
| `/issues/[id]` | Karta: manba, izohlar, yopish | `issues.view` |
| `/groups` | Telegram guruhlari, kuzatuv, MFY biriktirish | `groups.view` |
| `/territory` | Tuman + MFY reyestri | `territory.view` |
| `/reports` | Kesimlar: dinamika, hudud, yo'nalish, AI samarasi | `reports.view` |
| `/users` | Xodimlar, ruxsat, qamrov | `users.view` |
| `/audit` | Kim nima qildi | `audit.view` |
| `/settings` | Tizim + yo'nalishlar | `settings.manage` |

---

## Nozik joylar

### Himoya serverda, panelda — qulaylik

⚠️ `can()` va menyu filtri **faqat ko'rinish** uchun. Haqiqiy himoya
serverda (`@RequirePermissions`). Foydalanuvchi URL'ni qo'lda yozsa ham
server to'xtatadi — panel shunchaki chiroyli xato ko'rsatadi.

Kirish nazorati `AppShell` da, `middleware.ts` da **emas**: token
`localStorage` da yashaydi va Next middleware uni ko'ra olmaydi (u server
tomonida ishlaydi va faqat cookie'ni o'qiydi).

### Ruxsat tokendan o'qilmaydi

`GET /auth/me` har yuklanishda chaqiriladi. Tokenga muhrlangan ro'yxatdan
o'qish bir so'rovni tejardi, lekin ruxsat olib qo'yilgan xodim token
muddati tugamaguncha (15 daqiqa) eski huquqlar bilan ishlab yuraverardi.
Serverdagi `JwtAuthGuard` ham aynan shunday qiladi.

### Ruxsat katalogi serverdan keladi

`GET /users/permissions-catalog`. Panelda nusxa **yo'q**: ikki joyda
saqlash qo'lda sinxronni talab qilardi va u albatta eskirardi — panelda
tugma ko'rinib, server 403 qaytarardi (yoki teskarisi, bu xavfliroq).

### Parallel 401'lar bitta refresh'ni kutadi

Sahifa yuklanganda 5 ta so'rov birga ketadi. Hammasi 401 olsa va har biri
alohida refresh yuborsa, serverdagi **rotatsiya** birinchisidan keyin
qolganlarini "qayta ishlatilgan token" deb hisoblab, **butun sessiyani
yopardi** — ya'ni foydalanuvchi har sahifa yangilashda tizimdan chiqib
ketardi. `client.ts` dagi `refreshPromise` buni to'xtatadi.

### Signal — karta, murojaat — jadval

Signalning asosiy mazmuni **matn** (aholi yozgan gap) va u bir necha
qatorga cho'ziladi: jadval yacheykasida kesilib ketardi, operator esa
aynan o'sha matnni o'qib qaror qabul qiladi.

Murojaatda esa sarlavha qisqa, muhim narsa holat/ijrochi/muddat — ya'ni
ustunlar.

### `summary` — xabarning o'z matni

AI **matn yozmaydi**: u faqat tanlaydi va toifalaydi. Shuning uchun kartada
matn **iqtibos** sifatida ko'rsatiladi (chap chiziq bilan) — operator buni
"AI shunday deb o'yladi" emas, "odam shunday yozdi" deb o'qishi kerak.

### Mutatsiya o'zi biladi nimani bekor qilish

Signalni biriktirish signallar ro'yxatiga, sanoqlarga **va** murojaatlar
ro'yxatiga ta'sir qiladi. Uchinchisini unutish eng oson va natijasi
"murojaat yaratildi, lekin ro'yxatda yo'q" bo'lardi. Shuning uchun
`invalidateQueries` chaqiruvi mutatsiya ichida, komponentda emas.

### Bo'sh holat nima qilish kerakligini aytadi

"Hech narsa topilmadi" degan yorliq o'zicha hech narsa bermaydi —
foydalanuvchi tizim buzilganmi yoki haqiqatan bo'shmi bilmaydi. Shuning
uchun `EmptyState` filtrga qarab boshqa matn ko'rsatadi:

- filtr qo'yilgan → "Filtrlarni kengaytirib ko'ring"
- filtr yo'q → "Botni MFY guruhiga qo'shing..."

### AI o'chirilgani alohida aytiladi

Bo'sh signal ro'yxatini ko'rgan operator "guruhlarda gap yo'q" deb
o'ylardi — aslida tahlil umuman ishlamayapti. `/signals` sahifasi
`aiEnabled: false` holatida ogohlantirish ko'rsatadi.

---

## Sana formati

Yagona manba: `shared/lib/date.ts`. Serverdagi `common/date.util.ts` ning
ko'zgusi.

```
kun         →  21-may, 2025
kun + vaqt  →  21-may, 2025 14:30
oy          →  Yanvar, 2026
nisbiy      →  5 daqiqa oldin  (1 kundan oshsa — to'liq sana)
```

⚠️ `toLocaleDateString()`, `Intl.DateTimeFormat` va qo'lda yig'ilgan
`${day}.${month}.${year}` **taqiqlangan**: natija kod **ishlayotgan**
muhitga bog'liq (brauzer tili, OS locale'i).

⚠️ `getHours()` ham ishlatilmaydi — u **brauzerning** zonasini beradi.
Xodim boshqa zonada bo'lsa, "soat 14:30 da kelgan murojaat" boshqa vaqt
ko'rsatardi. Toshkent devor-soati `+5` qo'shib, `getUTC*` bilan o'qiladi.

⚠️ `toInputDate()` — ISO qiymat, **format emas**: faqat
`<input type="date">` va so'rov parametri uchun.

---

## Yorliqlar va ranglar

Yagona manba: `shared/config/labels.ts`.

⚠️ Holat nomi o'nlab joyda ko'rinadi (ro'yxat, filtr, karta, hisobot) va
har joyda qo'lda yozilsa, ular ajralib ketardi: bir ekranda "Hal qilindi",
boshqasida "Yopildi". Rang ham shu yerda — holat rangi **ma'no tashiydi**
(qizil → e'tibor kerak).

Diagramma ranglari (`reports/page.tsx`) esa **alohida**: ular
kategoriyalarni ajratadi va ma'no tashimaydi. Ikkisini aralashtirish
"yashil kategoriya yaxshi" degan noto'g'ri o'qishni tug'dirardi.
