import { PrismaClient, Role, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting BorrowHub database seed...");

  // Clean existing data in reverse relation order
  await prisma.damageRecord.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Simple salted hash representation for seed (in production bcrypt is used)
  const defaultPasswordHash = "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ec55d8Gvv45V8VN3K"; // 'Password123!'

  // 1. Seed Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@university.edu.sa",
      passwordHash: defaultPasswordHash,
      fullName: "د. عبد الله الشمري (Dr. Abdullah Al-Shammari)",
      department: "قسم هندسة الحاسب والشبكات",
      phone: "+966501234567",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const studentActive = await prisma.user.create({
    data: {
      email: "student@university.edu.sa",
      passwordHash: defaultPasswordHash,
      fullName: "سارة خالد الزهراني (Sarah Al-Zahrani)",
      studentId: "441009823",
      department: "كلية علوم الحاسب والمعلومات",
      phone: "+966559876543",
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });

  const studentPending = await prisma.user.create({
    data: {
      email: "new.student@university.edu.sa",
      passwordHash: defaultPasswordHash,
      fullName: "فيصل بن عمر (Faisal Bin Omar)",
      studentId: "442001199",
      department: "كلية الهندسة الميكانيكية",
      phone: "+966541122334",
      role: Role.STUDENT,
      status: UserStatus.PENDING_APPROVAL,
    },
  });

  console.log("✅ Seeded Users: Admin, Active Student, Pending Student");

  // 2. Seed Categories
  const catCameras = await prisma.category.create({
    data: {
      slug: "cameras-media",
      nameAr: "الكاميرات ومعدات التصوير",
      nameEn: "Cameras & Media Equipment",
    },
  });

  const catLaptops = await prisma.category.create({
    data: {
      slug: "laptops-workstations",
      nameAr: "الحواسيب المحمولة ومحطات العمل",
      nameEn: "Laptops & Mobile Workstations",
    },
  });

  const catSensors = await prisma.category.create({
    data: {
      slug: "sensors-measurement",
      nameAr: "أجهزة القياس والاستشعار",
      nameEn: "Sensors & Measurement Tools",
    },
  });

  const catAudio = await prisma.category.create({
    data: {
      slug: "audio-accessories",
      nameAr: "الملحقات الصوتية والعرض",
      nameEn: "Audio & AV Accessories",
    },
  });

  console.log("✅ Seeded Categories: 4 categories");

  // 3. Seed Equipment
  const cameraSony = await prisma.equipment.create({
    data: {
      categoryId: catCameras.id,
      nameAr: "كاميرا سوني Sony Alpha A7 IV",
      nameEn: "Sony Alpha A7 IV Full-Frame Camera",
      descriptionAr: "كاميرا تصوير احترافية بدقة 33 ميجابكسل تدعم تصوير الفيديو بدقة 4K 60p، مرفقة مع عدسة FE 24-70mm f/2.8 GM وحقيبة واقية وبطاريتين.",
      descriptionEn: "Professional 33MP full-frame hybrid camera with 4K 60p video, FE 24-70mm f/2.8 GM lens kit, protective case, and 2 batteries.",
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      totalQuantity: 5,
      availableQuantity: 4,
      reservedQuantity: 1,
      borrowedQuantity: 0,
      damagedQuantity: 0,
    },
  });

  const laptopDell = await prisma.equipment.create({
    data: {
      categoryId: catLaptops.id,
      nameAr: "محطة عمل ديل Dell Precision 5570",
      nameEn: "Dell Precision 5570 Workstation",
      descriptionAr: "معالج Intel Core i7 الجيل 12، ذاكرة عشوائية 32GB، سعة تخزين 1TB SSD، بطاقة رسوميات NVIDIA RTX A2000 مخصصة للمحاكاة والتصميم الهندسي.",
      descriptionEn: "Intel Core i7 12th Gen, 32GB RAM, 1TB NVMe SSD, NVIDIA RTX A2000 GPU engineered for CAD and data simulations.",
      imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      totalQuantity: 8,
      availableQuantity: 6,
      reservedQuantity: 0,
      borrowedQuantity: 2,
      damagedQuantity: 0,
    },
  });

  const oscilloscope = await prisma.equipment.create({
    data: {
      categoryId: catSensors.id,
      nameAr: "راسم إشارة رقمي Rigol DS1054Z Digital Oscilloscope",
      nameEn: "Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope",
      descriptionAr: "جهاز قياس وتحليل إشارات رقمية رباعي القنوات بنطاق ترددي 50MHz ومعدل عينات 1GSa/s مع مجسات القياس الأصلية وكابل التوصيل.",
      descriptionEn: "4-channel 50MHz bandwidth digital oscilloscope with 1 GSa/s real-time sample rate, including probes and power interface.",
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      totalQuantity: 4,
      availableQuantity: 3,
      reservedQuantity: 0,
      borrowedQuantity: 0,
      damagedQuantity: 1,
    },
  });

  const micShure = await prisma.equipment.create({
    data: {
      categoryId: catAudio.id,
      nameAr: "ميكروفون لاسلكي DJI Mic 2 ثنائي القناة",
      nameEn: "DJI Mic 2 Dual-Channel Wireless Microphone",
      descriptionAr: "طقم ميكروفون لاسلكي ذكي بمدى 250 متر مع تسجيل داخلي 32-bit عائم وخاصية إلغاء الضوضاء الذكية وحافظة الشحن المتنقلة.",
      descriptionEn: "Dual-channel wireless mic kit with 250m range, 32-bit float internal recording, intelligent noise cancelling, and charging case.",
      imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
      totalQuantity: 6,
      availableQuantity: 6,
      reservedQuantity: 0,
      borrowedQuantity: 0,
      damagedQuantity: 0,
    },
  });

  console.log("✅ Seeded Equipment: 4 items across categories");

  // 4. Seed sample Loan for active student
  const sampleLoan = await prisma.loan.create({
    data: {
      userId: studentActive.id,
      equipmentId: cameraSony.id,
      durationDays: 3,
      academicJustification: "مشروع التخرج: توثيق وتصوير التجارب الميدانية لقسم الهندسة الميكانيكية.",
      status: "APPROVED",
      approvedById: admin.id,
      approvedAt: new Date(),
      pickupDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h from now
    },
  });

  console.log("✅ Seeded Sample Approved Loan:", sampleLoan.id);
  console.log("🌱 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
