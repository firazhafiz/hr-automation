/**
 * Cleanup script: Hapus semua data Employee, FormSubmission, AuditLog, dan ScanLog
 * Usage: npx tsx prisma/cleanup.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Memulai cleanup database...\n");

  // Order matters due to foreign keys
  const auditDeleted = await prisma.auditLog.deleteMany({});
  console.log(`  ✓ AuditLog: ${auditDeleted.count} record dihapus`);

  const scanLogDeleted = await prisma.scanLog.deleteMany({});
  console.log(`  ✓ ScanLog: ${scanLogDeleted.count} record dihapus`);

  const submissionsDeleted = await prisma.formSubmission.deleteMany({});
  console.log(`  ✓ FormSubmission: ${submissionsDeleted.count} record dihapus`);

  const employeesDeleted = await prisma.employee.deleteMany({});
  console.log(`  ✓ Employee: ${employeesDeleted.count} record dihapus`);

  console.log("\n✅ Database sudah bersih! Siap untuk seeding data baru.");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
