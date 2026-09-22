/** Tipos de la API (espejo de docs/openapi.yaml del backend). */
export type Role = "ADMIN" | "SALES" | "WAREHOUSE";

export type Page<T> = { count: number; page: number; pages: number; items: T[] };
export type PageQuery = { page?: number; limit?: number };

export type User = { id: number; firstName: string; lastName: string; username: string; role: Role; active: boolean; createdAt: string };
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

export type Audit = { id: number; userId: number; username: string; method: string; resource: string; createdAt: string };
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
