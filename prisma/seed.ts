import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hash the default admin password
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 1. Create Default Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@toshinprima.com" },
    update: {},
    create: {
      email: "admin@toshinprima.com",
      name: "Super Admin",
      password: hashedPassword,
    },
  });
  console.log("Admin user seeded:", admin.email);

  // 2. Create Sample Employees (data berdasarkan form asli PT Toshin Prima)
  const employeesData = [
    { nik: "1701p0037", nama: "Sukermanto",             bagian: "Gudang / Inventory Control", departemen: "PPIC" },
    { nik: "26010356",  nama: "Fernando Ardiansyah P",  bagian: "Operator Produksi",          departemen: "Produksi" },
    { nik: "1001",      nama: "Budi Santoso",           bagian: "Stamping",                   departemen: "Produksi" },
    { nik: "1002",      nama: "Siti Rahayu",            bagian: "Admin HR",                   departemen: "HRPGA" },
    { nik: "1003",      nama: "Ahmad Fauzi",            bagian: "Press",                      departemen: "Produksi" },
    { nik: "1004",      nama: "Dewi Permatasari",       bagian: "Accounting",                 departemen: "Finance" },
    { nik: "1005",      nama: "Riko Prasetyo",          bagian: "Teknisi Mesin",              departemen: "Maintenance" },
    { nik: "1006",      nama: "Rina Wulandari",         bagian: "Bending",                    departemen: "Produksi" },
    { nik: "1007",      nama: "Hendra Setiawan",        bagian: "Inspector",                  departemen: "Quality Control" },
    { nik: "1008",      nama: "Lestari Ningrum",        bagian: "Admin Personalia",            departemen: "HRPGA" },
  ];

  console.log("Seeding employees...");
  for (const emp of employeesData) {
    await prisma.employee.upsert({
      where: { nik: emp.nik },
      update: { nama: emp.nama, bagian: emp.bagian, departemen: emp.departemen },
      create: emp,
    });
  }
  console.log(`${employeesData.length} employees seeded successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
