/** Tipos de la API (espejo de docs/openapi.yaml del backend). */
export type Role = "ADMIN" | "SALES" | "WAREHOUSE";

export type Page<T> = { count: number; page: number; pages: number; items: T[] };
export type PageQuery = { page?: number; limit?: number };

export type User = { id: number; firstName: string; lastName: string; username: string; role: Role; active: boolean; email?: string | null; phone?: string | null; createdAt: string };
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

export type Audit = { id: number; userId: number; username: string; method: string; resource: string; aiSuggested: boolean; createdAt: string };
export type AuditQuery = PageQuery & { userId?: number; resource?: string; from?: string; to?: string };

export type SalesGroupBy = "day" | "product";
export type SalesReportDayRow = { date: string; salesCount: number; units: number; total: number };
export type SalesReportProductRow = { productId: number; productName: string; sku: string; salesCount: number; units: number; total: number };
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
  byCategory: { categoryId: number; categoryName: string; products: number; units: number; costValue: number; saleValue: number }[];
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
export type ReportExport = { id: number; userId: number; username: string; report: ExportReportKind; format: ExportFormat; description: string; createdAt: string };
export type RecordExportInput = { report: ExportReportKind; format: ExportFormat; description: string };

/** `recipientId` null: canal general; con valor: mensaje privado. */
/* ---------- Chat del equipo (canal general y privados) ---------- */
export type ChatPerson = { id: number; firstName: string; lastName: string };
export type ChatMention = ChatPerson & { username: string };
export type ChatAttachment = { id: number; name: string; mime: string; size: number };
/** Mensaje citado; `privateReply`: la cita viene del canal general y la respuesta es privada. */
export type ChatQuote = { id: number; author: ChatPerson; body: string; attachments: number; inThread: boolean; privateReply: boolean; deleted: boolean };
export type ChatThreadSummary = { replies: number; unread: number; lastReplyAt: string; participants: ChatPerson[] };
/** Enviado (en el servidor), entregado (llegó a la app de todos) y visto (todos lo leyeron). */
export type ChatDeliveryStatus = "sent" | "delivered" | "read";
export type ChatReceiptsSummary = { status: ChatDeliveryStatus; total: number; delivered: number; read: number };
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
};
export type ChatPage = { items: ChatMessage[]; hasMoreBefore: boolean; hasMoreAfter: boolean; root?: ChatMessage };
export type SendChatMessageInput = { body: string; recipientId?: number; replyToId?: number; threadRootId?: number; attachmentIds?: number[]; clientId: string };
export type ChatReceiptEntry = { user: ChatPerson & { role: Role; active: boolean }; deliveredAt: string | null; readAt: string | null };
export type ChatReceipts = { messageId: number; status: ChatDeliveryStatus; read: ChatReceiptEntry[]; delivered: ChatReceiptEntry[]; pending: ChatReceiptEntry[] };
export type ChatPreview = { body: string; createdAt: string; mine: boolean } | null;
export type ChatMember = { id: number; firstName: string; lastName: string; username: string; role: Role; online: boolean; lastSeenAt: string | null; unread: number; mentions: number; lastMessage: ChatPreview };
export type ChatTeam = { general: { unread: number; mentions: number; lastMessage: ChatPreview }; members: ChatMember[]; onlineCount: number; unreadTotal: number };
/** Aviso en vivo (`GET /chat/stream`); `peerId` null = canal general. */
export type ChatLiveEvent =
  | { type: "ready" }
  | { type: "bye" }
  | { type: "team" }
  | { type: "update"; ids: number[]; peerId: number | null }
  | { type: "message"; id: number; peerId: number | null; threadRootId: number | null; authorId: number; authorName: string; preview: string; attachments: number; mentionsMe: boolean };

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
export type AiReply = { reply: string; sources: AiSource[]; proposals: AiProposal[] };

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
