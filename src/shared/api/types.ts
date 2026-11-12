/**
 * SERVER JAVOBLARINING TURLARI.
 *
 * ⚠️ QO'LDA YOZILGAN va serverdagi Prisma turlari bilan QO'LDA
 * sinxron. Generatsiya (openapi-typescript, tRPC) to'g'riroq
 * bo'lardi, lekin u qurilish bosqichiga server ishga tushishini
 * talab qiladi — ya'ni panelni serversiz qurib bo'lmasdi (CI,
 * boshqa dasturchining mashinasi).
 *
 * Shuning uchun almashuv: turlar qo'lda, lekin ular FAQAT shu
 * faylda. Server javobi o'zgarsa, bitta joy tahrirlanadi.
 */

// ═══════════════════════════════════════════════════════════════════
//  SANOQLI QIYMATLAR
// ═══════════════════════════════════════════════════════════════════

export type ScopeKind = "province" | "district";
export type UserRole = "owner" | "admin" | "operator" | "viewer";

export type SignalKind = "complaint" | "suggestion" | "question";
export type SignalSeverity = "low" | "normal" | "high";
export type SignalStatus = "new" | "attached" | "dismissed";

export type IssueSource = "signal" | "bot" | "manual" | "mobile";
export type IssueStatus = "new" | "in_progress" | "resolved" | "rejected";
export type IssuePriority = "low" | "normal" | "high" | "urgent";

// ═══════════════════════════════════════════════════════════════════
//  UMUMIY
// ═══════════════════════════════════════════════════════════════════

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Ref {
  id: string;
  name: string;
}

export interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
}

// ═══════════════════════════════════════════════════════════════════
//  KIRISH
// ═══════════════════════════════════════════════════════════════════

export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  scopeKind: ScopeKind;
  districtId: string | null;
  districtName: string | null;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/**
 * `GET /auth/me` javobi.
 *
 * ⚠️ `LoginResponse["user"]` DAN FARQ QILADI: `districtName` bu
 * yerda yo'q (guard faqat `districtId` ni o'qiydi). Panel tuman
 * nomini hudud ro'yxatidan oladi — ikkita manba bo'lsa, ular
 * ajralib ketardi.
 */
export interface MeResponse {
  id: string;
  username: string;
  role: UserRole;
  scopeKind: ScopeKind;
  districtId: string | null;
  permissions: string[];
}

// ═══════════════════════════════════════════════════════════════════
//  HUDUD
// ═══════════════════════════════════════════════════════════════════

export interface District {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isArchived: boolean;
  mahallaCount: number;
  /**
   * ⚠️ TUMANNING O'Z AHOLISI — rasmiy statistikadan.
   * `mahallaPopulation` dan ALOHIDA: MFY larning bir qismida
   * aholi to'ldirilmagan bo'lishi mumkin va yig'indi haqiqiy
   * aholidan kam chiqadi. "1000 kishiga" ko'rsatkichi esa
   * sun'iy ravishda KATTA bo'lib, tuman eng yomon ko'rinardi.
   */
  population: number | null;
  /** MFY lardagi aholi YIG'INDISI — to'liqligini tekshirish uchun. */
  mahallaPopulation: number;
  createdAt: string;
}

export interface Mahalla {
  id: string;
  code: string;
  name: string;
  district: Ref;
  chairmanName: string | null;
  chairmanPhone: string | null;
  population: number | null;
  sortOrder: number;
  isArchived: boolean;
  groupCount: number;
  issueCount: number;
}

// ═══════════════════════════════════════════════════════════════════
//  GURUHLAR
// ═══════════════════════════════════════════════════════════════════

export interface MahallaWithDistrict {
  id: string;
  name: string;
  district: Ref;
}

export interface TelegramGroup {
  chatId: string;
  type: string;
  title: string;
  username: string | null;
  status: string;
  /** Bot hali guruh ichidami. */
  isPresent: boolean;
  canPostMessages: boolean;
  /** ⚠️ KUZATUVGA ROZILIK — eng sezgir belgi. */
  isOfficial: boolean;
  officialAt: string | null;
  officialBy: PersonRef | null;
  /**
   * ⚠️ `isOfficial` DAN ALOHIDA: qalqon aholini himoya qiladi
   * (zararli fayl/havolani o'chiradi), `isOfficial` esa
   * yozishmani O'QISHGA rozilik. Ikkisi bog'liq emas.
   */
  guardEnabled: boolean;
  guardAt: string | null;
  /**
   * ⚠️ QALQONNING HAQIQIY SHARTI. `guardEnabled` — ma'muriyat
   * XOHISHI, bu esa Telegram RUXSATI: bot guruhda administrator
   * bo'lmasa yoki unga "Xabarlarni o'chirish" huquqi berilmagan
   * bo'lsa, qalqon yoqilgan bo'lsa ham HECH NARSA o'chira olmaydi.
   * Telegram o'shanda `400: message can't be deleted` deb
   * qaytaradi va bot guruhga ogohlantirish YOZMAYDI — ya'ni buni
   * faqat shu maydon ko'rsatadi.
   */
  canDeleteMessages: boolean;
  /** ⚠️ `null` — "hali o'qilmagan", `0` dan BOSHQA narsa. */
  memberCount: number | null;
  memberCountAt: string | null;
  /** ⚠️ `null` = hali biriktirilmagan. Bu NORMAL holat. */
  mahalla: MahallaWithDistrict | null;
  joinedAt: string;
  leftAt: string | null;
  /** Navbatda turgan, hali tahlil qilinmagan xabarlar. */
  pendingMessages: number;
  newSignals: number;
}

export interface GroupStats {
  total: number;
  official: number;
  unassigned: number;
  pendingMessages: number;
  /** Qalqon yoqilgan guruhlar soni. */
  guarded: number;
  /**
   * ⚠️ QALQON YOQILGAN, LEKIN BOT O'CHIRA OLMAYDI — eng xavfli
   * holat: ma'muriyat himoya bor deb o'ylaydi, amalda esa yo'q.
   */
  guardBlind: number;
  /**
   * GURUHLARDAGI A'ZOLAR YIG'INDISI.
   *
   * ⚠️ BOTDAGI FUQAROLAR SONI BILAN QO'SHILMAYDI: guruhdagi odam
   * botga yozmagan bo'lishi mumkin va teskarisi ham — qo'shilsa,
   * bir odam ikki marta sanalardi.
   */
  members: number;
}

/**
 * OMMAVIY AMALNING QAMROVI — ekrandagi FILTR.
 *
 * ⚠️ `page`/`limit` YO'Q va bu ataylab: amal butun filtr
 * natijasiga tegishli, ko'rinib turgan sahifaga emas. Sahifa
 * yuborilsa, "hammasiga" degan va'da buzilardi.
 *
 * ⚠️ `chatId` RO'YXATI HAM YO'Q: ro'yxat sahifalangan va panel
 * faqat 50 tasini biladi. Id ro'yxati yuborilsa, "hammasiga
 * yoqdim" degan odam aslida birinchi sahifani yoqqan bo'lardi va
 * buni HECH NARSA ko'rsatmasdi.
 *
 * ⚠️ NIMA UCHUN `shared` DA: bu shakl IKKI feature'da ishlatiladi —
 * `groups` (kuzatuv) va `security` (qalqon). Ikkisi panelning AYNI
 * ro'yxati ustida ishlaydi, lekin feature'lar bir-birini import
 * QILMAYDI (FSD qatlam qoidasi: import faqat pastga).
 */
export interface BulkGroupInput {
  filterIsOfficial?: boolean;
  /**
   * ⚠️ TUMAN FILTRI HAM UZATILADI: ommaviy amalning qamrovi —
   * EKRANDAGI filtr natijasi. Bu maydon tushib qolsa, operator bitta
   * tumanni ko'rib turib, amalni BUTUN VILOYATGA bajarardi.
   */
  filterDistrictId?: string;
  filterMahallaId?: string;
  filterUnassigned?: boolean;
  filterSearch?: string;
  /** Tasdiqlash oynasida ko'rsatilgan guruhlar soni. */
  expectedCount: number;
}

/**
 * ⚠️ `skippedNoMahalla` va `purgedMessages` IXTIYORIY: ular faqat
 * KUZATUV amalida bo'ladi. Qalqon MFY dan mustaqil (hududsiz
 * guruhdagi odamni ham himoya qilish mumkin) va navbat tozalash
 * ham unga tegishli emas.
 */
export interface BulkResult {
  changed: number;
  unchanged: number;
  matched: number;
  skippedNoMahalla?: number;
  purgedMessages?: number;
}

// ═══════════════════════════════════════════════════════════════════
//  XAVFSIZLIK
// ═══════════════════════════════════════════════════════════════════

/**
 * ⚠️ `SecurityEvent` — `Signal` EMAS. Signal AI taxmini va u odam
 * qaroriga muhtoj; bu yerda esa qoida qat'iy va bot ALLAQACHON
 * harakat qilgan. Shuning uchun kartada "biriktirish" tugmasi yo'q.
 */
export type ThreatKind =
  | "apk_file"
  | "unknown_file"
  | "suspicious_url"
  | "shortened_url"
  | "masked_url"
  | "scam_text";

export type ThreatAction = "deleted" | "detected" | "delete_failed";

export interface SecurityEvent {
  id: string;
  chatId: string;
  messageId: string | null;

  kind: ThreatKind;
  action: ThreatAction;

  senderTgId: string | null;
  senderName: string | null;
  senderUsername: string | null;

  fileName: string | null;
  fileMime: string | null;
  fileSize: number | null;
  fileUniqueId: string | null;

  url: string | null;
  urlHost: string | null;

  /** Qoida kaliti (`installer_extension:apk`). */
  reason: string;

  /** ⚠️ Xabar o'chirilgan — matn faqat shu yerda qoladi. */
  messageText: string | null;
  errorMessage: string | null;

  sentAt: string | null;
  createdAt: string;

  /**
   * XODIM "NOTO'G'RI O'CHIRILDI" DEB BELGILAGAN.
   *
   * ⚠️ YOZUV O'CHIRILMAYDI, BELGILANADI: `security_events` —
   * append-only (doktrina) va noto'g'ri o'chirishlar ro'yxati
   * qoidani tuzatish uchun YAGONA manba. Tozalansa, o'sha dalil
   * yo'q bo'lardi.
   */
  isFalsePositive: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;

  group: {
    chatId: string;
    title: string;
    username: string | null;
    guardEnabled: boolean;
    mahalla: MahallaWithDistrict | null;
  };
}

export interface SecurityStats {
  total: number;
  deleted: number;
  /** ⚠️ O'chirilmagan — bot admin emas yoki Telegram rad etdi. */
  failed: number;
  last24h: number;
  byKind: Partial<Record<ThreatKind, number>>;
  guardedGroups: number;
  totalGroups: number;
  /**
   * ⚠️ QALQON YOQILGAN, LEKIN BOT O'CHIRA OLMAYDI — eng xavfli
   * holat: panelda "yoqilgan" bo'lib ko'rinadi, amalda esa hech
   * narsa o'chirilmaydi va bot guruhga ogohlantirish ham yozmaydi.
   */
  blindGroups: number;
  /**
   * NOTO'G'RI O'CHIRISHLAR — QOIDA SIFATINING YAGONA O'LCHOVI.
   *
   * ⚠️ O'SMAYOTGAN BO'LSA qoida aniq ishlayapti; o'syotgan
   * bo'lsa ro'yxatni ko'rib chiqish kerak. Usiz "oddiy
   * havolalar ham bloklanyapti" degan shikoyatni raqam bilan
   * tekshirib bo'lmasdi.
   */
  falsePositives: number;
}

// ═══════════════════════════════════════════════════════════════════
//  SIGNALLAR
// ═══════════════════════════════════════════════════════════════════

export interface Signal {
  id: string;
  kind: SignalKind;
  severity: SignalSeverity;
  /** ⚠️ XABARNING O'Z MATNI — AI yozgan xulosa EMAS. */
  summary: string;
  status: SignalStatus;

  senderName: string | null;
  sentAt: string | null;
  /** AI nechta xabarni ko'rib shu xulosaga kelgan. */
  messageCount: number;
  model: string | null;
  createdAt: string;

  group: {
    chatId: string;
    title: string;
    mahalla: MahallaWithDistrict | null;
  };

  /** `null` — yopiq guruh va `-100` prefiksi yo'q. */
  messageLink: string | null;

  issue: { id: string; publicNo: string; status: IssueStatus } | null;
  attachedBy: PersonRef | null;
  attachedAt: string | null;
  dismissedBy: PersonRef | null;
  dismissedAt: string | null;
  dismissedReason: string | null;
}

export interface SignalCounts {
  new: number;
  attached: number;
  dismissed: number;
  /** Yangi signallar orasida yuqori jiddiylikdagilar. */
  highNew: number;
}

export interface AnalysisSummary {
  analyzed: number;
  signals: number;
  groups: number;
  /** AI yiqilgan guruhlar — keyin qayta ko'riladi. */
  failedGroups: number;
  pending: number;
  /** AI o'chirilgan yoki kalit yo'q. */
  skipped: boolean;
}

export interface SignalJobStatus {
  aiEnabled: boolean;
  model: string;
  isRunning: boolean;
  lastRunAt: string | null;
  lastResult: AnalysisSummary | null;
}

// ═══════════════════════════════════════════════════════════════════
//  MUAMMOLAR
// ═══════════════════════════════════════════════════════════════════

export interface IssueCategory {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  /** Belgi KALITI (`category-icons.ts`) — ilovada ko'rinadi. */
  icon: string | null;
  slaHours: number;
  orgName: string | null;
  sortOrder: number;
  isActive: boolean;
  issueCount: number;
  /**
   * ── KICHIK YO'NALISH (ota-bola) ───────────────────────
   *
   * ⚠️ `null` — bu ASOSIY yo'nalish. Daraxt ATIGI IKKI DARAJA:
   * bolaning bolasi bo'lmaydi (server tekshiradi).
   *
   * ⚠️ ICHIDA BOLALARI BOR YO'NALISH TANLANMAYDI: fuqaro
   * "Kommunal xizmatlar" ni tanlab qo'ysa, bo'linishning ma'nosi
   * yo'qolardi — hisobotda yana bitta katta uyum paydo bo'lardi.
   */
  parentId: string | null;
  childCount: number;
}

/** Ilovadan kelgan murojaat muallifi — FUQARO (xodim emas). */
export interface CitizenRef {
  id: string;
  name: string;
}

export interface IssueListItem {
  id: string;
  publicNo: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  source: IssueSource;
  category: { id: string; name: string; color: string | null };
  mahalla: MahallaWithDistrict | null;
  assignee: PersonRef | null;
  author: PersonRef | null;
  /** ⚠️ `source==="mobile"` da muallif shu (xodim emas). */
  citizen: CitizenRef | null;
  dueAt: string | null;
  /** ⚠️ MUDDAT — MO'LJAL, majburiyat emas. Faqat ajratib ko'rsatiladi. */
  isOverdue: boolean;
  commentCount: number;
  /**
   * SHU MUROJAATGA ULANGAN TAKRORIYLAR SONI.
   *
   * ⚠️ OMMAVIY HODISA BELGISI: transformator o'chganda 20 kishi
   * "svet yo'q" deb yozadi va ularning hammasi ALOHIDA murojaat
   * bo'lib navbatga tushardi. Bu son "bu bitta hodisa" deb
   * aytadi.
   */
  duplicateCount: number;
  /** ⚠️ `true` — bu murojaatning O'ZI boshqasiga ulangan. */
  isDuplicate: boolean;
  duplicateOfId: string | null;
  /**
   * TIZIM "BU MUROJAATMI?" DEB SHUBHA QILGAN.
   *
   * ⚠️ FAQAT BELGI, RAD ETISH EMAS: murojaat baribir
   * yaratilgan va fuqaro "qabul qilindi" degan javobni olgan.
   * Avtomatik rad etish xato bo'lsa, HAQIQIY muammo jimgina
   * yo'qolardi.
   */
  isSuspicious: boolean;
  suspicionReason: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface IssueComment {
  id: string;
  body: string;
  /** ⚠️ `true` bo'lsa izoh botdagi/fuqarodagi MUALLIFGA ham ketgan. */
  isPublic: boolean;
  createdAt: string;
  /** Xodim yozgan bo'lsa to'ladi. */
  user: PersonRef | null;
  /** Fuqaro yozgan "qo'shimcha" bo'lsa to'ladi. */
  citizen: PersonRef | null;
}

export interface IssueAttachment {
  id: string;
  kind: "photo" | "video";
  /** `/uploads/...` — to'liq manzilga `fileUrl()` orqali aylanadi. */
  path: string;
  mimeType: string;
  size: number;
}

export interface IssueDetail {
  id: string;
  publicNo: string;
  title: string;
  body: string;
  status: IssueStatus;
  priority: IssuePriority;
  source: IssueSource;
  category: { id: string; name: string; color: string | null; icon: string | null };
  mahalla:
    | (MahallaWithDistrict & { chairmanName: string | null; chairmanPhone: string | null })
    | null;
  assignee: PersonRef | null;
  author: PersonRef | null;
  /** ⚠️ `source==="mobile"` da muallif shu (telefon, username bilan). */
  citizen: (PersonRef & { username: string | null; phone: string | null; telegramId: string }) | null;
  reviewer: PersonRef | null;
  /** Mobil murojaatda: xaritadagi nuqta, manzil, bayroqlar, dalil fayllari. */
  lat: number | null;
  lng: number | null;
  address: string | null;
  isHazard: boolean;
  isLongStanding: boolean;
  isRepeatAppeal: boolean;
  occurredAt: string | null;
  attachments: IssueAttachment[];
  /** Manba haqida barcha ma'lumot — shakli manbaga qarab BOSHQA
   * (`sourceMeta.ai` — imzolangan AI taklifi; `sourceMeta.flags`). */
  sourceMeta: Record<string, unknown> | null;
  signal: {
    id: string;
    kind: SignalKind;
    severity: SignalSeverity;
    senderName: string | null;
    sentAt: string | null;
  } | null;
  dueAt: string | null;
  /**
   * MUDDAT QAYERDAN KELDI — `category` | `rule` | `manual` | `ai`.
   *
   * ⚠️ "Muddat qanday belgilanyapti?" degan savolga javob. Avval
   * panelda faqat sana turardi va xodim uni "tizim o'ylab topgan" deb
   * qabul qilardi — kech qolganda ham sababini izlamasdi.
   *
   * ⚠️ TANILMAGAN QIYMAT KALIT KO'RINISHIDA chiqadi: server yangi
   * manba qo'shsa, panel yiqilmasligi kerak.
   */
  dueSource: string | null;
  resolution: string | null;
  reviewedAt: string | null;
  comments: IssueComment[];
  /**
   * ⚠️ SHU MUROJAATGA ULANGAN TAKRORIYLAR: ular bilan BIRGA
   * yopiladi (`issues.service.ts#closeDuplicates`) va har biriga
   * javob ALOHIDA yetadi — ya'ni 20 kishiga 20 marta qo'lda
   * javob yozish kerak emas.
   */
  duplicates: Array<{
    id: string;
    publicNo: string;
    createdAt: string;
    citizen: { firstName: string; lastName: string | null } | null;
  }>;
  /** ⚠️ `null` emas bo'lsa — bu murojaat ASOSIY emas, takroriy. */
  duplicateOf: { id: string; publicNo: string; title: string } | null;
  isSuspicious: boolean;
  suspicionReason: string | null;
  createdAt: string;
}

export interface IssueStats {
  new: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  open: number;
  overdue: number;
  /** Hududi belgilanmagan — "MFY biriktirish ishi qoldi". */
  unassignedMahalla: number;
}

// ═══════════════════════════════════════════════════════════════════
//  XODIMLAR
// ═══════════════════════════════════════════════════════════════════

export interface StaffUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  scopeKind: ScopeKind;
  telegramId: string | null;
  permissions: string[];
  isActive: boolean;
  isArchived: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  district: Ref | null;
  _count: { assignedIssues: number };
}

export interface PermissionDef {
  key: string;
  label: string;
  hint?: string;
}

export interface PermissionGroup {
  key: string;
  label: string;
  items: PermissionDef[];
}

export interface PermissionCatalog {
  groups: PermissionGroup[];
  roleDefaults: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════════
//  HISOBOT
// ═══════════════════════════════════════════════════════════════════

export interface ReportOverview {
  total: number;
  status: Record<IssueStatus, number>;
  open: number;
  source: Record<IssueSource, number>;
  overdue: number;
  /** Faqat YOPILGANLAR bo'yicha. */
  avgResolutionHours: number | null;
  resolutionRate: number | null;
}

export interface TerritoryReportRow {
  mahallaId: string | null;
  mahallaName: string;
  district: Ref | null;
  population: number | null;
  count: number;
  /** 1000 aholiga — `population` bo'lsa. */
  per1000: number | null;
}

export interface TerritoryReportDistrict {
  id: string;
  name: string;
  count: number;
  /** ⚠️ `null` — aholi soni kiritilmagan (nol emas). */
  population: number | null;
  /** 1000 aholiga — `population` bo'lsa. */
  per1000: number | null;
  /**
   * AHOLI QAYERDAN OLINDI.
   *
   * ⚠️ MANBA KO'RSATILADI: "MFY lardan" yig'ilgan son to'liq
   * bo'lmasligi mumkin (bir qismi to'ldirilmagan) va o'shanda
   * "1000 kishiga" ko'rsatkichi sun'iy ravishda KATTA chiqadi.
   * Manba yozilmasa, xodim g'alati raqamning sababini topa
   * olmasdi.
   */
  populationSource: "district" | "mahallas" | null;
}

export interface TerritoryReport {
  mahallas: TerritoryReportRow[];
  districts: TerritoryReportDistrict[];
}

/**
 * TIZIMLI MUAMMO — AYNI MFY, AYNI YO'NALISHDA QAYTA-QAYTA.
 *
 * ⚠️ "Kommunal xizmatlar — 400 ta" degan qator hech narsa
 * aytmaydi: ichimlik suvi bilan issiqlik ta'minoti IKKI BOSHQA
 * tashkilot. Shuning uchun kesim ENG ANIQ yo'nalish bo'yicha.
 */
export interface RecurringRow {
  mahallaId: string;
  mahallaName: string;
  district: Ref | null;
  categoryId: string;
  categoryName: string;
  /** Ota yo'nalish nomi — "Kommunal xizmatlar → Ichimlik suvi". */
  parentName: string | null;
  total: number;
  /**
   * ⚠️ HODISA SONI — TAKRORIYLARNI HISOBGA OLMAGANDA: bitta
   * transformator uzilishi 20 ta murojaat bo'lishi mumkin va
   * "20 marta muammo bo'ldi" degan xulosa XATO bo'lardi.
   */
  incidents: number;
  duplicates: number;
  firstAt: string | null;
  lastAt: string | null;
  spanDays: number;
  /** Oyiga o'rtacha hodisa — davrga nisbatan. */
  perMonth: number;
}

export interface RecurringReport {
  items: RecurringRow[];
}

export interface CategoryReportRow {
  categoryId: string;
  name: string;
  /** Ota yo'nalish nomi — "Kommunal xizmatlar → Ichimlik suvi". */
  parentName: string | null;
  color: string | null;
  icon: string | null;
  count: number;
  /**
   * MUDDATI O'TGAN VA HALI YOPILMAGANLARI.
   *
   * ⚠️ JAMI BILAN BIRGA KERAK: "400 ta murojaat" degan son
   * yo'nalish yomon ishlayotganini aytmaydi — "400 tadan 120
   * tasi muddatdan o'tgan" esa aytadi.
   */
  overdue: number;
}

export interface SignalReport {
  total: number;
  status: Record<SignalStatus, number>;
  kind: Record<SignalKind, number>;
  severity: Record<SignalSeverity, number>;
  /** ⚠️ AI ANIQLIGI: biriktirilgan / ko'rilgan. `new` maxrajda emas. */
  attachRate: number | null;
}

export interface DailyPoint {
  date: string;
  total: number;
  resolved: number;
}

// ═══════════════════════════════════════════════════════════════════
//  SOZLAMA VA AUDIT
// ═══════════════════════════════════════════════════════════════════

export interface Settings {
  id: string;
  orgName: string;
  aiEnabled: boolean;
  aiIntervalMinutes: number;
  aiMaxMessagesPerRun: number;
  messageRetentionHours: number;
  alertChatIds: string[];
  alertMinSeverity: SignalSeverity;

  /** ── XAVFSIZLIK QALQONI ─────────────────────────────────────── */
  guardDeleteFiles: boolean;
  guardDeleteUrls: boolean;
  /** ⚠️ Faqat domen (`evil.com`), to'liq havola EMAS. */
  guardBlockedHosts: string[];
  /** ⚠️ Qora ro'yxatdan USTUN turadi. */
  guardAllowedHosts: string[];

  /** ── MINI APP (FUQARO MUROJAATLARI) ─────────────────────────── */
  /** ⚠️ `0` — cheksiz. Chegara — BLOK EMAS, sekinlatish. */
  mobileDailyLimit: number;
  mobileMaxAttachments: number;
  /**
   * TELEFON RAQAMI MAJBURIYMI (murojaat yuborishda).
   *
   * ⚠️ O'CHIRISH — JIDDIY QADAM: telefonsiz murojaatda xodim
   * odamga bog'lana olmaydi (Telegram ismi ixtiyoriy, hudud esa
   * ko'rsatilmagan bo'lishi mumkin) va murojaat navbatda turib
   * qoladi.
   */
  requirePhone: boolean;

  updatedAt: string;
  updatedBy: string | null;
}

// ═══════════════════════════════════════════════════════════════════
//  FUQARO VA YANGILIK (MINI APP)
// ═══════════════════════════════════════════════════════════════════

/**
 * TUMAN KESIMI — XARITA UCHUN.
 *
 * ⚠️ UCH OQIM ALOHIDA MAYDON: `issues`, `signals`, `security` bir
 * songa QO'SHILMAYDI — muammo rasmiy fakt, signal AI taxmini,
 * xavfsizlik hodisasi esa qat'iy qoida natijasi. Qo'shilsa,
 * xaritadagi rang nimani bildirishini aytib bo'lmasdi.
 */
export interface DistrictMapRow {
  id: string;
  code: string;
  name: string;
  isArchived: boolean;

  issues: number;
  open: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  overdue: number;

  signals: number;
  signalsNew: number;
  signalsHigh: number;

  security: number;

  avgResolutionHours: number | null;
  resolutionRate: number | null;
}

/** Tumansiz (MFY biriktirilmagan) yozuvlar — xaritada bo'yalmaydi. */
export type DistrictMapTotals = Omit<
  DistrictMapRow,
  "id" | "code" | "name" | "isArchived"
>;

export interface DistrictMapResponse {
  /** `true` — kategoriya filtri yoqilgan, signal/xavfsizlik 0 qaytgan. */
  categoryFiltered: boolean;
  districts: DistrictMapRow[];
  unassigned: DistrictMapTotals;
}

export interface CitizenListItem {
  id: string;
  telegramId: string;
  name: string;
  username: string | null;
  phone: string | null;
  photoUrl: string | null;
  districtName: string | null;
  points: number;
  appeals: number;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
}

/**
 * REYTING QATORI.
 *
 * ⚠️ `rank` SERVERDAN KELADI, ro'yxat indeksidan HISOBLANMAYDI:
 * tartib `points desc` bo'yicha serverda chiqadi va mijozda qayta
 * raqamlash filtr/saralash o'zgarganda yolg'on o'rin ko'rsatardi.
 */
export interface RatingRow {
  rank: number;
  id: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  points: number;
  appeals: number;
  districtName: string | null;
  createdAt: string;
}

export interface RatingResponse {
  items: RatingRow[];
  /** Bali 0 dan katta, bloklanmagan fuqarolar soni (TOP emas, JAMI). */
  totalActive: number;
  totalPoints: number;
}

export interface CitizenDetail {
  id: string;
  telegramId: string;
  name: string;
  username: string | null;
  phone: string | null;
  photoUrl: string | null;
  languageCode: string;
  districtName: string | null;
  mahallaName: string | null;
  points: number;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
  stats: { total: number; open: number; resolved: number };
}

// ── MOBIL ANALITIKA VA XARITA ──────────────────────────────────────

export interface MobileReport {
  total: number;
  status: Record<IssueStatus, number>;
  open: number;
  overdue: number;
  resolutionRate: number | null;
  avgResponseHours: number | null;
  slaOnTimeRate: number | null;
  /**
   * ⚠️ "OBUNACHI" DEGAN BITTA SON YO'Q — uchta alohida sanoq:
   *   total    — ro'yxatdan o'tganlar (bot + ilova)
   *   telegram — Telegram orqali XABAR YUBORSA BO'LADIGANLAR
   *   recent   — oxirgi 30 kunda ishlatganlar
   *
   * ⚠️ `telegram` ≠ `total`: Google bilan kirgan fuqaroda `telegramId`
   * yo'q va unga tarqatma bormaydi.
   */
  citizens: {
    total: number;
    active: number;
    blocked: number;
    telegram: number;
    recent: number;
  };
  categories: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    count: number;
  }[];
  topCitizens: { id: string; name: string; points: number; appeals: number }[];
}

export interface MapIssue {
  id: string;
  publicNo: string;
  title: string;
  lat: number;
  lng: number;
  status: IssueStatus;
  source: IssueSource;
  createdAt: string;
  category: { id: string; name: string; color: string | null; icon: string | null };
}

/**
 * E'LONGA QO'SHILGAN FAYL.
 *
 * ⚠️ `coverUrl` NING O'RNINI BOSMAYDI: muqova — ro'yxatdagi BITTA
 * surat, media esa e'lon ICHIDAGI galereya. Bittasini ikkinchisiga
 * aylantirsak, eski e'lonlarning ro'yxatdagi ko'rinishi buzilardi.
 */
export interface AnnouncementMedia {
  id: string;
  kind: "photo" | "video";
  url: string;
  mimeType: string;
  size: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  coverUrl: string | null;
  isPinned: boolean;
  districtId: string | null;
  districtName: string | null;
  publishedAt: string | null;
  /**
   * ⚠️ `publishedAt` DAN ALOHIDA: biri O'TMISH ("qachon chiqdi"),
   * ikkinchisi KELAJAK ("qachon chiqadi"). Nashr etilgandan keyin
   * server uni TOZALAYDI, ya'ni ikkisi bir vaqtda to'la bo'lmaydi.
   */
  scheduledAt: string | null;
  viewCount: number;
  createdAt: string;
  media: AnnouncementMedia[];
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  userId: string | null;
  user: (PersonRef & { username: string }) | null;
}

// ════════════════════════════════════════════════════════════════════
//  IJROCHI QOIDALARI — MFY × YO'NALISH → XODIM
// ════════════════════════════════════════════════════════════════════

export interface AssignmentRule {
  id: string;
  categoryId: string;
  category: { id: string; name: string; icon: string | null; slaHours: number };
  /** ⚠️ `null` — yo'nalishning umumiy SLA'si ishlatiladi. */
  slaHours: number | null;
  user: PersonRef & { isActive: boolean; isArchived: boolean };
  /**
   * ⚠️ QOIDA BOR, LEKIN ISHLAMAYDI: xodim arxivlangan yoki
   * o'chirilgan. Yashirilsa, ma'muriyat "ijrochi belgilangan" deb
   * o'ylab yuraverardi.
   */
  isBroken: boolean;
}

export interface MahallaRules {
  id: string;
  name: string;
  district: { id: string; name: string };
  rules: AssignmentRule[];
}

// ════════════════════════════════════════════════════════════════════
//  TARQATMA
// ════════════════════════════════════════════════════════════════════

export type BroadcastAudience = "citizens" | "groups" | "both";
export type BroadcastMode = "text" | "forward" | "copy";
export type BroadcastStatus = "pending" | "sending" | "done" | "failed";

export interface Broadcast {
  id: string;
  audience: BroadcastAudience;
  mode: BroadcastMode;
  /** ⚠️ `null` — uzatilgan xabar (matn serverda saqlanmagan). */
  text: string | null;
  status: BroadcastStatus;
  total: number;
  sent: number;
  failed: number;
  error: string | null;
  /** `panel` yoki `bot` — qaysi yo'ldan yuborilgani. */
  via: string;
  createdAt: string;
  finishedAt: string | null;
  district: { id: string; name: string } | null;
  mahalla: { id: string; name: string } | null;
  author: PersonRef | null;
}

/** Yuborishdan OLDIN hisoblangan auditoriya hajmi. */
export interface AudienceSize {
  citizens: number;
  groups: number;
  total: number;
}

// ════════════════════════════════════════════════════════════════════
//  TASHQI TAHDID RO'YXATLARI
// ════════════════════════════════════════════════════════════════════

export type ThreatFeedFormat = "hosts" | "domains" | "adguard" | "urlhaus";

/**
 * O'ZI YANGILANADIGAN FISHING / ZARARLI DOMEN RO'YXATI.
 *
 * ⚠️ QO'LDAGI QORA RO'YXAT O'RNINI BOSMAYDI, QO'SHIMCHA: mahalliy
 * firibgar domenlar tashqi ro'yxatlarga umuman tushmaydi.
 *
 * ⚠️ `lastError` KO'RSATILISHI SHART: ro'yxat bir hafta
 * yuklanmay turgan bo'lsa, himoya eskirib ketganini faqat shu
 * maydon aytadi.
 */
export interface ThreatFeed {
  id: string;
  name: string;
  url: string;
  format: ThreatFeedFormat;
  isEnabled: boolean;
  lastFetchedAt: string | null;
  lastCount: number;
  lastError: string | null;
}

/**
 * MFY KESIMI — XARITADAGI ISSIQLIK VA POLIGONLAR UCHUN.
 *
 * ⚠️ `MapIssue` DAN FARQI: u bitta murojaatning NUQTASI, bu esa
 * butun MFY ning SANOG'I — koordinatasiz murojaatlar bilan birga.
 * "Qaysi MFY da muammo ko'p" degan savolga faqat shu javob beradi.
 */
export interface MahallaMapItem {
  id: string;
  name: string;
  district: { id: string; name: string };
  /** ⚠️ `null` — markaz hali qo'yilmagan (chegara ham bo'lmasligi mumkin). */
  lat: number | null;
  lng: number | null;
  /** GeoJSON `Polygon`/`MultiPolygon` geometriyasi yoki `null`. */
  geoJson: unknown;
  /**
   * ⚠️ MARKAZ TAXMINIY: MFY chegarasi hali import qilinmagan va
   * nuqta o'sha MFY dagi murojaatlarning O'RTACHA koordinatasidan
   * olingan. Aniq chegara bilan taxminiy nuqtani bir xil ko'rsatish
   * xaritaga ortiqcha ishonch berardi.
   */
  isApproximate: boolean;
  total: number;
  /** ⚠️ Yo'nalish bo'yicha kesim — filtr mijozda, so'rovsiz ishlashi uchun. */
  byCategory: Record<string, number>;
}