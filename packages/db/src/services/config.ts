import { prisma } from "./prisma";

export async function getConfig(): Promise<Record<string, unknown>> {
  const row = await prisma.config.findUnique({ where: { id: "default" } });
  if (row) return JSON.parse(row.data);
  return {};
}

export async function saveConfig(data: Record<string, unknown>): Promise<void> {
  const json = JSON.stringify(data);
  await prisma.config.upsert({
    where: { id: "default" },
    create: { id: "default", data: json },
    update: { data: json },
  });
}
