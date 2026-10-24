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
  /** ⚠️ MOBIL ILOVA BELGISI — kalit, SVG emas (`schema.prisma`). */
  icon: string | null;
  /** Javob muddati (soat) — ilovada ko'rsatiladi, `dueAt` shundan. */
  slaHours: number;
  /** Mas'ul tashkilot nomi — matn, FK emas. */
  orgName: string | null;
  sortOrder: number;
  isActive: boolean;
  issueCount: number;
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
  /** ⚠️ `author` DAN ALOHIDA: fuqaro xodim EMAS (`schema.prisma`). */
  citizen: PersonRef | null;
  hasLocation: boolean;
  attachmentCount: number;
  /** Fuqaro "xavfli" deb belgilagan — TAXMIN, ustuvorlik emas. */
  isHazard: boolean;
  dueAt: string | null;
  /** ⚠️ MUDDAT — MO'LJAL, majburiyat emas. Faqat ajratib ko'rsatiladi. */
  isOverdue: boolean;
  commentCount: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface IssueComment {
  id: string;
  body: string;
  /** ⚠️ `true` bo'lsa izoh botdagi/ilovadagi MUALLIFGA ham ketgan. */
  isPublic: boolean;
  createdAt: string;
  /**
   * ⚠️ IKKALASI IXTIYORIY va AYNAN BITTASI to'ldirilgan: izohni
   * XODIM yoki FUQARO yozgan bo'lishi mumkin
   * (`schema.prisma#IssueComment`). Faqat `user` ni o'qiydigan kod
   * fuqaro yozgan qo'shimchani KO'RSATMAY qo'yardi.
   */
  user: PersonRef | null;
  citizen: PersonRef | null;
}

export interface IssueAttachment {
  id: string;
  kind: string;
  /** Nisbiy manzil (`/uploads/...`) — server yig'adi. */
  url: string;
  mimeType: string;
  size: number;
  originalName: string | null;
}

/**
 * MUROJAAT MUALLIFI — FUQARO.
 *
 * ⚠️ `StaffUser` EMAS: fuqaroda ruxsat ham, hududiy qamrov ham,
 * panelga kirish ham yo'q (`schema.prisma#Citizen`).
 */
export interface IssueCitizen {
  id: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  phone: string | null;
  telegramId: string;
  points: number;
  isBlocked: boolean;
}

export interface IssueDetail {
  id: string;
  publicNo: string;
  title: string;
  body: string;
  status: IssueStatus;
  priority: IssuePriority;
  source: IssueSource;
  category: { id: string; name: string; color: string | null };
  mahalla:
    | (MahallaWithDistrict & { chairmanName: string | null; chairmanPhone: string | null })
    | null;
  assignee: PersonRef | null;
  author: PersonRef | null;
  reviewer: PersonRef | null;
  /** Manba haqida barcha ma'lumot — shakli manbaga qarab BOSHQA. */
  sourceMeta: Record<string, unknown> | null;
  signal: {
    id: string;
    kind: SignalKind;
    severity: SignalSeverity;
    senderName: string | null;
    sentAt: string | null;
  } | null;
  dueAt: string | null;
  resolution: string | null;
  reviewedAt: string | null;
  comments: IssueComment[];
  createdAt: string;

  /** ── MOBIL ILOVADAN KELGAN MUROJAAT ──────────────────────────── */
  citizen: IssueCitizen | null;
  attachments: IssueAttachment[];
  /** ⚠️ KOORDINATA MUHRLANGAN — fuqaro ko'rsatgan nuqta. */
  lat: number | null;
  lng: number | null;
  address: string | null;
  /** ⚠️ FUQARO BELGISI — TAXMIN, ustuvorlikni odam qo'yadi. */
  isHazard: boolean;
  isLongStanding: boolean;
  isRepeatAppeal: boolean;
  /** Muammo qachon sodir bo'lgan — `createdAt` dan BOSHQA. */
  occurredAt: string | null;
}

// ═══════════════════════════════════════════════════════════════════
//  FUQAROLAR (mobil ilova)
// ═══════════════════════════════════════════════════════════════════

export interface Citizen {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  phone: string | null;
  photoUrl: string | null;
  points: number;
  isBlocked: boolean;
  blockedReason: string | null;
  lastSeenAt: string;
  createdAt: string;
  district: Ref | null;
  mahalla: Ref | null;
  appealCount: number;
}

export interface CitizenDetail extends Omit<Citizen, "appealCount"> {
  languageCode: string;
  blockedAt: string | null;
  districtId: string | null;
  stats: { total: number; open: number; resolved: number };
  recentAppeals: {
    id: string;
    publicNo: string;
    title: string;
    status: IssueStatus;
    createdAt: string;
    category: { id: string; name: string; color: string | null };
  }[];
}

export interface CitizenStats {
  total: number;
  blocked: number;
  /** Oxirgi 30 kunda ilovani ochganlar. */
  active30: number;
  /** ⚠️ FAQAT VILOYAT DARAJASIDA MA'NOLI (serverda 0 qaytadi). */
  noDistrict: number;
}

// ═══════════════════════════════════════════════════════════════════
//  YANGILIKLAR (mobil ilova)
// ═══════════════════════════════════════════════════════════════════

export interface Announcement {
  id: string;
  title: string;
  body: string;
  coverUrl: string | null;
  isPublished: boolean;
  isPinned: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  /** ⚠️ `null` — BUTUN VILOYAT uchun. */
  district: Ref | null;
  author: PersonRef | null;
}

// ═══════════════════════════════════════════════════════════════════
//  XARITA
// ═══════════════════════════════════════════════════════════════════

export interface IssueMapPoint {
  id: string;
  publicNo: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  lat: number | null;
  lng: number | null;
  address: string | null;
  isHazard: boolean;
  createdAt: string;
  category: { id: string; name: string; color: string | null };
  mahalla: { name: string } | null;
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

export interface TerritoryReport {
  mahallas: TerritoryReportRow[];
  districts: Array<{ id: string; name: string; count: number }>;
}

export interface CategoryReportRow {
  categoryId: string;
  name: string;
  color: string | null;
  count: number;
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

  /** ── MOBIL ILOVA ────────────────────────────────────────────── */
  mobileEnabled: boolean;
  /** ⚠️ AI faqat TOIFALAYDI; taklifni fuqaroning o'zi tasdiqlaydi. */
  mobileAiClassify: boolean;
  mobileMaxAttachments: number;
  /** ⚠️ 0 — CHEKSIZ. */
  mobileDailyLimit: number;

  updatedAt: string;
  updatedBy: string | null;
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
