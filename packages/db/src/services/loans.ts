import { prisma } from "./prisma";

export async function createLoan(data: {
  borrowerId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  purpose?: string;
}) {
  return prisma.loan.create({ data });
}

export async function getLoanById(id: string) {
  return prisma.loan.findUnique({
    where: { id },
    include: { borrower: { select: { id: true, name: true, email: true } } },
  });
}

export async function getLoansByBorrower(borrowerId: string, opts?: { page?: number; limit?: number; status?: string }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const where: Record<string, unknown> = { borrowerId };
  if (opts?.status) where.status = opts.status;

  const [items, total, allLoans] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: { borrower: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loan.count({ where }),
    prisma.loan.findMany({
      where: { borrowerId },
      select: { status: true, amount: true },
    }),
  ]);

  const stats = {
    total: allLoans.length,
    completedCount: allLoans.filter((l) => l.status === "completed").length,
    totalBorrowed: allLoans.filter((l) => l.status === "disbursed" || l.status === "completed").reduce((sum, l) => sum + l.amount, 0),
  };

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}

export async function getAllLoans(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { page = 1, limit = 20, status } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: { borrower: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loan.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateLoan(id: string, data: {
  status?: string;
  approvedAt?: Date;
  disbursedAt?: Date;
  completedAt?: Date;
}) {
  return prisma.loan.update({
    where: { id },
    data,
    include: { borrower: { select: { id: true, name: true, email: true } } },
  });
}

export function calculateLoanTerms(amount: number, termMonths: number, annualRate: number = 5) {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = monthlyRate > 0
    ? (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
    : amount / termMonths;
  const totalRepayment = monthlyPayment * termMonths;
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    interestRate: annualRate,
  };
}
