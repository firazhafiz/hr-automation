const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function syncCounters() {
  console.log("Syncing employee counters from existing FormSubmission data...");

  const counts = await prisma.formSubmission.groupBy({
    by: ["employee_id", "jenis_form"],
    where: { is_deleted: false, employee_id: { not: null } },
    _count: { id: true },
  });

  const map = {};
  for (const row of counts) {
    if (!row.employee_id) continue;
    if (!map[row.employee_id]) map[row.employee_id] = { sp: 0, cuti: 0, ijin: 0 };
    if (row.jenis_form === "SP") map[row.employee_id].sp = row._count.id;
    if (row.jenis_form === "CUTI") map[row.employee_id].cuti = row._count.id;
    if (row.jenis_form === "IJIN") map[row.employee_id].ijin = row._count.id;
  }

  let updated = 0;
  for (const [empId, totals] of Object.entries(map)) {
    await prisma.employee.update({
      where: { id: empId },
      data: {
        total_sp: totals.sp,
        total_cuti: totals.cuti,
        total_ijin: totals.ijin,
      },
    });
    updated++;
  }

  console.log(`Done! Updated ${updated} employees.`);
  await prisma.$disconnect();
}

syncCounters().catch((e) => {
  console.error(e);
  process.exit(1);
});
