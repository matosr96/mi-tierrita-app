/** Tipos de la API (espejo de docs/openapi.yaml del backend). */
export type Role = "ADMIN" | "SALES" | "WAREHOUSE";

export type Page<T> = { count: number; page: number; pages: number; items: T[] };
export type PageQuery = { page?: number; limit?: number };

export type User = { id: number; firstName: string; lastName: string; username: string; role: Role; active: boolean; email?: string | null; phone?: string | null; createdAt: string; hasAvatar?: boolean; avatarUpdatedAt?: string | null };
/** Persona del directorio (`GET /users/directory`): rol, contacto y presencia; lo ve cualquier rol. */
export type DirectoryEntry = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: Role;
  email: string | null;
  phone: string | null;
  hasAvatar: boolean;
  avatarUpdatedAt: string | null;
  online: boolean;
  lastSeenAt: string | null;
  active: boolean;
};
export type UpdateProfileInput = { firstName?: string; lastName?: string; email?: string | null; phone?: string | null };
export type SigninResponse = { token: string; user: User };
export type CreateUserInput = { firstName: string; lastName: string; username: string; password: string; role: Role };
export type ChangePasswordInput = { currentPassword: string; newPassword: string };

export type Category = { id: number; name: string; active: boolean; createdAt: string };

export type Product = {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  /** Unidades de lotes no vencidos: lo que se puede vender hoy (`stock` incluye lo vencido aún en bodega). */
  availableStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
export type CreateProductInput = { name: string; sku: string; categoryId: number; purchasePrice: number; salePrice: number };
export type UpdateProductInput = Partial<CreateProductInput> & { active?: boolean };
export type ProductQuery = PageQuery & { category?: number; active?: boolean; search?: string };

export type ProductBatch = {
  id: number;
  productId: number;
  productName: string;
  supplierId: number | null;
  supplierName: string | null;
  quantity: number;
  quantityRemaining: number;
  unitCost: number;
  expiresAt: string;
  expired: boolean;
  daysToExpire: number;
  createdAt: string;
};
export type CreateBatchInput = { quantity: number; expiresAt: string; unitCost?: number; supplierId?: number };
export type CreatePurchaseInput = { productId: number; quantity: number; unitCost: number; expiresAt: string };

export type Supplier = { id: number; name: string; taxId: string | null; phone: string | null; active: boolean; createdAt: string };
export type CreateSupplierInput = { name: string; taxId?: string; phone?: string };
export type UpdateSupplierInput = { name?: string; taxId?: string | null; phone?: string | null; active?: boolean };

export type Customer = {
  id: number;
  name: string;
  documentId: string;
  phone: string | null;
  creditLimit: number;
  balance: number;
  availableCredit: number;
  active: boolean;
  createdAt: string;
};
export type CreateCustomerInput = { name: string; documentId: string; phone?: string; creditLimit?: number };
export type UpdateCustomerInput = { name?: string; documentId?: string; phone?: string | null; creditLimit?: number; active?: boolean };
export type CustomerQuery = PageQuery & { active?: boolean; search?: string; withBalance?: boolean };
export type CustomerBalance = {
  customerId: number;
  name: string;
  creditLimit: number;
  balance: number;
  availableCredit: number;
  lastCreditSaleAt: string | null;
  lastPaymentAt: string | null;
  overdue: boolean;
  overdueDays: number;
};
export type CustomerPayment = { id: number; customerId: number; userId: number; amount: number; balanceAfter: number; createdAt: string };

export type PaymentType = "CASH" | "CREDIT";
export type SaleStatus = "COMPLETED" | "VOIDED";
export type SaleLineInput = { productId: number; quantity: number };
export type CreateSaleInput = { customerId?: number; paymentType: PaymentType; lines: SaleLineInput[] };
export type Sale = {
  id: number;
  invoiceNumber: string;
  customerId: number | null;
  customerName: string | null;
  userId: number;
  username: string;
  paymentType: PaymentType;
  total: number;
  status: SaleStatus;
  voidedAt: string | null;
  voidedBy: number | null;
  createdAt: string;
};
export type SaleLine = { id: number; productId: number; productName: string; sku: string; quantity: number; unitPrice: number; lineTotal: number };
export type SaleDetail = Sale & { lines: SaleLine[] };
export type SaleQuery = PageQuery & { from?: string; to?: string; customerId?: number; userId?: number; status?: SaleStatus };

export type Audit = { id: number; userId: number; username: string; method: string; resource: string; aiSuggested: boolean; entity?: string | null; entityId?: number | null; changes?: AuditChanges | null; createdAt: string };
export type AuditChanges = { request?: Record<string, unknown>; response?: Record<string, unknown> };
export type AuditQuery = PageQuery & { userId?: number; resource?: string; from?: string; to?: string };
/** Línea de tiempo de un registro (brief 33): `entity` es el recurso raíz de la ruta (products, customers, sales…). */
export type RecordHistoryQuery = PageQuery & { entity: string; entityId: number };

/** Búsqueda global (brief 29): solo vienen los grupos que el rol puede ver. */
export type SearchProduct = { id: number; name: string; sku: string; availableStock: number; salePrice: number };
export type SearchCustomer = { id: number; name: string; documentId: string; balance: number };
export type SearchPerson = { id: number; firstName: string; lastName: string; username: string; role: Role };
export type SearchSupplier = { id: number; name: string };
export type SearchResults = { products?: SearchProduct[]; customers?: SearchCustomer[]; people?: SearchPerson[]; suppliers?: SearchSupplier[] };

/** Comentarios por registro con «responder a» (brief 33). */
export type CommentEntity = "products" | "customers" | "sales" | "suppliers" | "batches";
export type CommentAuthor = { id: number; firstName: string; lastName: string; username: string; role: Role };
export type RecordComment = {
  id: number;
  entity: CommentEntity;
  entityId: number;
  body: string;
  author: CommentAuthor;
  replyTo: { id: number; author: CommentAuthor; excerpt: string; deleted: boolean } | null;
  createdAt: string;
  /** Respuesta de Tita a una mención (@Tita) a nombre del autor; solo esa persona confirma o descarta sus tarjetas. */
  tita: boolean;
  titaProposals: AiProposal[] | null;
  titaActions: Record<string, { status: AiActionStatus; note?: string }> | null;
};
export type TitaActionInput = { index: number; status: "done" | "failed" | "dismissed"; note?: string };
export type CreateCommentInput = { entity: CommentEntity; entityId: number; body: string; replyToId?: number };

export type SalesGroupBy = "day" | "product";
/** Trazabilidad: hasta 20 ids de las ventas que componen la fila y cuántas son en total. */
export type RowSources = { sourceIds: number[]; sourceCount: number };
export type SalesReportDayRow = RowSources & { date: string; salesCount: number; units: number; total: number; cashTotal: number; creditTotal: number };
export type SalesReportProductRow = RowSources & { productId: number; productName: string; sku: string; salesCount: number; units: number; total: number };
export type SalesReport = {
  from: string;
  to: string;
  groupBy: SalesGroupBy;
  salesCount: number;
  units: number;
  total: number;
  cashTotal: number;
  creditTotal: number;
  /** Total / número de ventas, calculado por la API (null si no hubo ventas). */
  averageTicket?: number | null;
  rows: SalesReportDayRow[] | SalesReportProductRow[];
};
export type BatchAggregate = { batches: number; units: number; costValue: number };
/** `productIds`: hasta 20 ids de productos de la categoría (trazabilidad); `products` es el total. */
export type InventoryCategoryRow = { categoryId: number; categoryName: string; products: number; units: number; costValue: number; saleValue: number; productIds: number[] };
export type InventoryReport = {
  asOf: string;
  expiringDays: number;
  products: number;
  activeProducts: number;
  units: number;
  costValue: number;
  saleValue: number;
  outOfStock: number;
  expiringSoon: BatchAggregate;
  expired: BatchAggregate;
  byCategory: InventoryCategoryRow[];
};
export type ReceivableRow = {
  customerId: number;
  name: string;
  creditLimit: number;
  balance: number;
  lastCreditSaleAt: string | null;
  lastPaymentAt: string | null;
  overdue: boolean;
};
export type ReceivablesReport = {
  overdueDays: number;
  customersWithBalance: number;
  totalBalance: number;
  overdueCustomers: number;
  overdueBalance: number;
  items: ReceivableRow[];
};

export type Assumptions = {
  monthlySales: number;
  costOfSalesPct: number;
  fixedExpensesMonth: number;
  baseSalesGrowth: number;
  constructionInvestment: number;
  equipmentInvestment: number;
  salesIncreasePct: number;
  additionalFixedExpensesMonth: number;
  inventoryTurnover: number;
  creditRateEA: number;
  termMonths: number;
  tmarEA: number;
  investorRateEA: number;
  horizonYears: number;
  inflation: number;
  salvageValuePct: number;
  ownerWithdrawalsMonth: number;
};
export type CreateScenarioInput = {
  name: string;
  fixedInvestment: number;
  creditPct: number;
  termMonths: number;
  salesIncrease: number;
  additionalExpensesMonth: number;
  creditCoversWorkingCapital?: boolean;
  assumptions?: Partial<Assumptions>;
};
export type ScenarioIndicators = {
  workingCapital: number;
  totalInvestment: number;
  credit: number;
  ownContribution: number;
  installment: number;
  totalInterest: number;
  npv: number;
  irr: number | null;
  paybackSimple: number | null;
  paybackDiscounted: number | null;
  profitabilityIndex: number;
  benefitCostRatio: number;
  investorNpv: number;
  investorIrr: number | null;
  coverageWithSales: number | null;
  coverageWithoutSales: number | null;
  coverageIncremental: number | null;
  signChanges: number;
};
export type ScenarioSummary = {
  id: number;
  name: string;
  userId: number;
  username: string;
  fixedInvestment: number;
  creditPct: number;
  termMonths: number;
  salesIncrease: number;
  additionalExpensesMonth: number;
  creditCoversWorkingCapital: boolean;
  indicators: ScenarioIndicators;
  createdAt: string;
  updatedAt: string;
};
export type CashFlowDetail = { year: number; margin: number; expenses: number; workingCapitalDelta: number; salvage: number; workingCapitalRecovery: number; flow: number };
export type ScenarioDetail = ScenarioSummary & {
  assumptions: Assumptions;
  results: ScenarioIndicators & { fixedInvestment: number; flows: number[]; investorFlows: number[]; debtService: number[]; detail: CashFlowDetail[] };
};
export type AmortizationRow = { month: number; installment: number; interest: number; principal: number; balance: number };
export type Amortization = { scenarioId: number; credit: number; termMonths: number; installment: number; totalInterest: number; rows: AmortizationRow[] };
export type SensitivityVariable = "salesIncrease" | "inventoryTurnover" | "tmar";
export type Range = { from: number; to: number; step: number };
export type Sensitivity = { scenarioId: number; variable: SensitivityVariable; range: Range; points: { value: number; npv: number; irr: number | null }[] };
export type Bivariate = { scenarioId: number; varX: SensitivityVariable; varY: SensitivityVariable; xValues: number[]; yValues: number[]; npv: number[][] };
export type TornadoBar = { variable: string; low: number; high: number; npvLow: number; npvHigh: number; amplitude: number };
export type Tornado = { scenarioId: number; delta: number; baseNpv: number; bars: TornadoBar[] };

export type ExportReportKind = "sales" | "inventory" | "receivables" | "scenario";
export type ExportFormat = "pdf" | "xlsx";
/** Filtros y resumen de un documento generado: objeto plano de escalares (lo que la API guarda y firma). */
export type ExportData = Record<string, string | number | boolean | null>;
export type ReportExport = {
  id: number;
  userId: number;
  username: string;
  report: ExportReportKind;
  format: ExportFormat;
  description: string;
  /** Folio `R-AAAA-NNNNNN` que va en la portada y en el QR. */
  folio: string;
  /** sha256 que calcula la API; null en registros anteriores. */
  hash: string | null;
  filters: ExportData;
  summary: ExportData;
  createdAt: string;
  verifyUrl: string;
};
export type RecordExportInput = { report: ExportReportKind; format: ExportFormat; description: string; filters?: ExportData; summary?: ExportData };
/** Respuesta pública de `GET /reports/verify/:folio` (quien escanea el QR). */
export type ExportVerification = {
  valid: true;
  folio: string;
  report: ExportReportKind;
  format: ExportFormat;
  description: string;
  createdAt: string;
  generatedBy: string;
  filters: ExportData;
  summary: ExportData;
  hash: string | null;
};

/** `recipientId` null: canal general; con valor: mensaje privado. */
/* ---------- Chat del equipo (canal general y privados) ---------- */
export type ChatPerson = { id: number; firstName: string; lastName: string };
export type ChatMention = ChatPerson & { username: string };
/** `durationMs`: solo en notas de voz (la app lo manda al subirlas). */
export type ChatAttachment = { id: number; name: string; mime: string; size: number; durationMs: number | null };
/** Mensaje citado; `privateReply`: la cita viene del canal general y la respuesta es privada. */
export type ChatQuote = { id: number; author: ChatPerson; body: string; attachments: number; inThread: boolean; privateReply: boolean; deleted: boolean };
export type ChatThreadSummary = { replies: number; unread: number; lastReplyAt: string; participants: ChatPerson[] };
/** Enviado (en el servidor), entregado (llegó a la app de todos), visto (todos lo leyeron) y, en notas de voz, reproducido (todos la escucharon). */
export type ChatDeliveryStatus = "sent" | "delivered" | "read" | "played";
export type ChatReceiptsSummary = { status: ChatDeliveryStatus; total: number; delivered: number; read: number; played: number };
export type ChatMessage = {
  id: number;
  clientId: string | null;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  recipientId: number | null;
  body: string;
  createdAt: string;
  threadRootId: number | null;
  /** Última edición del texto; null si nunca se editó. */
  editedAt: string | null;
  /** Eliminado: conserva su lugar, sin texto ni adjuntos. */
  deleted: boolean;
  replyTo: ChatQuote | null;
  thread: ChatThreadSummary | null;
  pinned: { at: string; by: { id: number; name: string } } | null;
  mentions: ChatMention[];
  attachments: ChatAttachment[];
  /** Solo en los mensajes propios. */
  receipts: ChatReceiptsSummary | null;
  unread: boolean;
  mentionsMe: boolean;
  /** Respuesta de Tita a una mención (@Tita) a nombre de `userId`; solo esa persona confirma o descarta sus tarjetas. */
  tita: boolean;
  titaProposals: AiProposal[] | null;
  titaActions: Record<string, { status: AiActionStatus; note?: string }> | null;
};
export type ChatPage = { items: ChatMessage[]; hasMoreBefore: boolean; hasMoreAfter: boolean; root?: ChatMessage };
export type SendChatMessageInput = { body: string; recipientId?: number; replyToId?: number; threadRootId?: number; attachmentIds?: number[]; clientId: string };
export type ChatReceiptEntry = { user: ChatPerson & { role: Role; active: boolean }; deliveredAt: string | null; readAt: string | null; playedAt: string | null };
/** `read`, `delivered` y `pending` se excluyen entre sí; `played` (solo con `audio`) es un subconjunto de `read`. */
export type ChatReceipts = { messageId: number; status: ChatDeliveryStatus; audio: boolean; read: ChatReceiptEntry[]; delivered: ChatReceiptEntry[]; pending: ChatReceiptEntry[]; played: ChatReceiptEntry[] };
/** Contenido de una conversación (`GET /chat/media`): un adjunto o un enlace del texto, con quién lo envió. */
export type ChatMediaKind = "image" | "file" | "audio" | "link";
export type ChatMediaItem =
  | { kind: "image" | "file" | "audio"; messageId: number; createdAt: string; author: ChatPerson; attachment: ChatAttachment }
  | { kind: "link"; messageId: number; createdAt: string; author: ChatPerson; url: string };
export type ChatPreview = { body: string; createdAt: string; mine: boolean } | null;
export type ChatMember = { id: number; firstName: string; lastName: string; username: string; role: Role; online: boolean; lastSeenAt: string | null; unread: number; mentions: number; lastMessage: ChatPreview };
export type ChatTeam = { general: { unread: number; mentions: number; lastMessage: ChatPreview }; members: ChatMember[]; onlineCount: number; unreadTotal: number };
/** Aviso en vivo (`GET /chat/stream`); `peerId` null = canal general. */
export type ChatLiveEvent =
  | { type: "ready" }
  | { type: "bye" }
  | { type: "team" }
  | { type: "update"; ids: number[]; peerId: number | null }
  | { type: "message"; id: number; peerId: number | null; threadRootId: number | null; authorId: number; authorName: string; preview: string; attachments: number; mentionsMe: boolean }
  // Alarma personalizada que acaba de sonar y resumen diario de vencimientos (brief 2026, puntos 12 y 13).
  | { type: "alarm"; alarmId: number; title: string; description: string | null; area: AlarmArea | null; firedAt: string }
  | { type: "due"; count: number; summary: string };

export type ContactStatus = "NEW" | "READ" | "ARCHIVED";
export type ContactMessage = { id: number; name: string; phone: string | null; email: string | null; topic: string | null; body: string; status: ContactStatus; createdAt: string };
export type SendContactInput = { name: string; phone?: string; email?: string; topic?: string; body: string; website?: string };

/* ---------- Asistente de IA (rutas /ai; ninguna escribe datos) ---------- */
export type AiStatus = { enabled: boolean; model: string | null };
export type AiChatTurn = { role: "user" | "assistant"; content: string; attachments?: AiAttachment[] };
export type AiSource = { tool: string; label: string };
export type AiSaleProposal = {
  type: "sale";
  customerId: number | null;
  customerName: string | null;
  paymentType: PaymentType;
  lines: { productId: number; productName: string; quantity: number; unitPrice: number; available: number }[];
  estimatedTotal: number;
  warnings: string[];
};
export type AiPaymentProposal = { type: "payment"; customerId: number; customerName: string; amount: number; balance: number };
export type AiPurchaseProposal = { type: "purchase"; supplierId: number | null; supplierName: string | null; productId: number; productName: string; quantity: number; unitCost: number; expiresAt: string };
/** Formulario prellenado en su pantalla (venta, abono o compra), para quien prefiera revisarlo allí. */
export type AiHandoff = AiSaleProposal | AiPaymentProposal | AiPurchaseProposal;
/** Petición exacta que la app envía a la API real si la persona confirma (misma validación, permisos y auditoría). */
export type AiActionRequest = { method: "POST" | "PUT" | "PATCH" | "DELETE"; path: string; body?: Record<string, unknown> };
export type AiAction = { type: "action"; kind: string; title: string; lines: string[]; warnings: string[]; confirmLabel: string; request: AiActionRequest; handoff?: AiHandoff };
export type AiReportKind = "sales" | "inventory" | "receivables";
export type AiReportProposal = { type: "report"; report: AiReportKind; title: string; lines: string[]; params: Record<string, string | number> };
export type AiProposal = AiAction | AiReportProposal;
/** Adjunto de una pregunta: imagen o PDF en base64, o el texto de una hoja de cálculo o archivo de texto. */
export type AiAttachment =
  | { kind: "image"; name: string; mediaType: "image/jpeg"; data: string }
  | { kind: "pdf"; name: string; data: string }
  | { kind: "text"; name: string; text: string };
export type AiReply = { reply: string; sources: AiSource[]; proposals: AiProposal[]; conversationId: number; messageId: number; userMessageId: number };
/** Pantalla desde la que se le habla a Tita (contexto del prompt). */
export type AiScreen = "inicio" | "inventario" | "lotes" | "ventas" | "clientes" | "proveedores" | "finanzas" | "reportes" | "tita" | "chat" | "contactos" | "usuarios" | "auditoria" | "alarmas" | "perfil";
export type AiChatRequest = { messages: AiChatTurn[]; asincrono?: boolean; conversationId?: number; screen?: AiScreen };
/** Primer paso de la respuesta en dos pasos (202): la tarea que hay que consultar cada 1,5 s. */
export type AiTaskAccepted = { tareaId: string; conversationId: number; userMessageId: number };
export type AiTaskPending = { tareaId: string; status: "pending" };
export type AiActionStatus = "idle" | "running" | "done" | "failed" | "dismissed";
export type AiStoredAttachment = { kind: AiAttachment["kind"]; name: string };
/** Mensaje guardado en el historial (los adjuntos solo con su nombre). */
export type AiStoredMessage = {
  id: number;
  role: "user" | "assistant" | "event";
  content: string;
  attachments: AiStoredAttachment[] | null;
  sources: AiSource[] | null;
  proposals: AiProposal[] | null;
  actions: Record<string, { status: AiActionStatus; note?: string }> | null;
  error: boolean;
  createdAt: string;
};
export type AiConversation = { id: number; title: string; screen: AiScreen | null; messages: number; createdAt: string; updatedAt: string };
export type AiConversationDetail = AiConversation & { items: AiStoredMessage[] };
export type AiConversationEventInput = { content: string; messageId?: number; index?: number; status?: AiActionStatus; note?: string };

export type AiInsight =
  | { kind: "restock"; productId: number; productName: string; sku: string; available: number; dailyAvg: number; coverDays: number; suggestedQty: number }
  | { kind: "rotate"; batchId: number; productId: number; productName: string; expiresAt: string; daysToExpire: number; remaining: number; projectedSold: number; surplus: number; surplusCost: number }
  | { kind: "collect"; customerId: number; name: string; phone: string | null; balance: number; creditLimit: number; usedPct: number; overdue: boolean; daysSincePayment: number | null }
  | { kind: "idle"; productId: number; productName: string; sku: string; available: number; costValue: number; lastSaleAt: string | null };
export type AiBriefing = { text: string | null; generatedAt: string; insights: AiInsight[] };

export type AiInvoiceCandidate = { productId: number; name: string; sku: string; purchasePrice: number; score: number };
export type AiInvoiceLine = { description: string; quantity: number | null; unitCost: number | null; expiresAt: string | null; lot: string | null; candidates: AiInvoiceCandidate[]; warnings: string[] };
export type AiInvoiceReading = {
  supplier: { name: string | null; taxId: string | null; match: { supplierId: number; name: string } | null };
  invoiceNumber: string | null;
  invoiceDate: string | null;
  lines: AiInvoiceLine[];
  notes: string | null;
};
export type AiDraftKind = "collection_message" | "contact_reply" | "report_summary" | "scenario_explain";
export type AiDraftRequest = { kind: AiDraftKind; customerId?: number; contactId?: number; scenarioId?: number; from?: string; to?: string };
export type AiDraft = { kind: AiDraftKind; text: string; phone: string | null };

/* ---------- Alarmas, avisos de vencimiento y Web Push (brief 2026, puntos 12 a 14) ---------- */
export type AlarmRepeat = "ONCE" | "DAILY" | "WEEKDAYS" | "WEEKLY";
export type AlarmArea = "inicio" | "inventario" | "lotes" | "ventas" | "clientes" | "proveedores" | "finanzas" | "reportes" | "chat" | "alarmas";
export type Alarm = {
  id: number;
  title: string;
  description: string | null;
  /** HH:MM, hora local del negocio. */
  timeOfDay: string;
  repeat: AlarmRepeat;
  /** Solo WEEKLY: 0 = domingo … 6 = sábado. */
  weekdays: number[];
  /** Solo ONCE. */
  date: string | null;
  area: AlarmArea | null;
  active: boolean;
  nextFireAt: string | null;
  lastFiredAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type AlarmInput = { title: string; description?: string; timeOfDay: string; repeat: AlarmRepeat; weekdays?: number[]; date?: string; area?: AlarmArea };
export type AlarmFire = { id: number; alarmId: number; title: string; description: string | null; area: AlarmArea | null; firedAt: string; seenAt: string | null };

export type DueKind = "batch_expiring" | "batch_expired" | "receivable_overdue" | "receivable_due_soon";
export type DueItem = { kind: DueKind; id: number; title: string; detail: string; dueOn: string; href: string };
export type DueNotices = { count: number; summary: string; items: DueItem[] };

export type PushPublicKey = { enabled: boolean; publicKey: string | null };
export type PushSubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string };

/* ---------- calendario reutilizable (brief de octubre de 2026, punto 31) ---------- */
export type CalendarKind = "batch" | "receivable" | "alarm" | "closing";
export type CalendarPriority = "alta" | "media" | "baja";
export type CalendarStatus = "pending" | "overdue" | "done";
/** Ítem con fecha (`GET /calendar`): `date` en YYYY-MM-DD (hora del negocio); `area` en texto; `href` es la pantalla a la que lleva. */
export type CalendarItem = { id: string; kind: CalendarKind; title: string; detail: string; date: string; priority: CalendarPriority; area: string; status: CalendarStatus; href: string };
export type CalendarSummary = { pending: number; overdue: number; done: number };
export type CalendarResponse = { from: string; to: string; items: CalendarItem[]; summary: CalendarSummary };
/** Sin fechas = mes en curso; como mucho 62 días. */
export type CalendarQuery = { from?: string; to?: string };

/* ---------- biblioteca de documentos y enlaces ---------- */

export type LibraryKind = "document" | "link";
/** `roles` vacío = lo ven todos los roles. Un documento trae `name`, `mime` y `size`; un enlace trae `url`. */
export type LibraryItem = {
  id: number;
  kind: LibraryKind;
  title: string;
  description: string;
  url: string | null;
  name: string | null;
  mime: string | null;
  size: number | null;
  roles: Role[];
  createdBy: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
};
export type LibraryQuery = PageQuery & { kind?: LibraryKind; q?: string };
export type CreateLinkInput = { title: string; description?: string; url: string; roles?: Role[] };
export type UploadLibraryDocumentInput = { file: File; title: string; description?: string; roles?: Role[]; onProgress?: (fraction: number) => void };
export type UpdateLibraryItemInput = { title?: string; description?: string; url?: string; roles?: Role[] };
