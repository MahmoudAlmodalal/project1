export interface DemoCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

export interface DemoEquipment {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  borrowedQuantity: number;
  damagedQuantity: number;
  isArchived: boolean;
  category?: DemoCategory;
}

export interface DemoLoan {
  id: string;
  durationDays: number;
  academicJustification: string;
  status:
    | "PENDING_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "EXPIRED"
    | "CHECKED_OUT"
    | "RETURNED"
    | "OVERDUE";
  requestedAt: string;
  approvedAt?: string | null;
  pickupDeadline?: string | null;
  checkedOutAt?: string | null;
  expectedReturnDate?: string | null;
  returnedAt?: string | null;
  rejectionReason?: string | null;
  user?: {
    id: string;
    fullName: string;
    studentId: string | null;
    department: string;
    phone: string;
    email: string;
  };
  equipment: {
    id: string;
    nameAr: string;
    nameEn: string;
    imageUrl: string;
    availableQuantity?: number;
    reservedQuantity?: number;
    borrowedQuantity?: number;
    category?: {
      nameAr: string;
      nameEn: string;
    };
  };
}

export interface DemoUser {
  id: string;
  email: string;
  fullName: string;
  studentId: string | null;
  department: string;
  phone: string;
  role: "STUDENT" | "ADMIN";
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
}

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    id: "cat-cameras",
    slug: "cameras-media",
    nameAr: "الكاميرات ومعدات التصوير",
    nameEn: "Cameras & Media Equipment",
  },
  {
    id: "cat-laptops",
    slug: "laptops-workstations",
    nameAr: "الحواسيب المحمولة ومحطات العمل",
    nameEn: "Laptops & Mobile Workstations",
  },
  {
    id: "cat-sensors",
    slug: "sensors-measurement",
    nameAr: "أجهزة القياس والاستشعار",
    nameEn: "Sensors & Measurement Tools",
  },
  {
    id: "cat-audio",
    slug: "audio-accessories",
    nameAr: "الملحقات الصوتية والعرض",
    nameEn: "Audio & AV Accessories",
  },
  {
    id: "cat-vr-ai",
    slug: "vr-ai-hardware",
    nameAr: "تقنيات الواقع الافتراضي والذكاء الاصطناعي",
    nameEn: "VR & AI Edge Devices",
  },
  {
    id: "cat-robotics",
    slug: "robotics-iot",
    nameAr: "الروبوتات وإنترنت الأشياء",
    nameEn: "Robotics & IoT Kits",
  },
];

export const DEMO_EQUIPMENT: DemoEquipment[] = [
  {
    id: "eq-sony-a7iv",
    categoryId: "cat-cameras",
    nameAr: "كاميرا سوني Sony Alpha A7 IV",
    nameEn: "Sony Alpha A7 IV Full-Frame Camera",
    descriptionAr: "كاميرا تصوير هجينة احترافية بدقة 33 ميجابكسل تدعم تصوير 4K 60p، مرفقة بعدسة 24-70mm f/2.8 GM وحقيبة مانعة للصدمات وبطاريتين إضافيتين.",
    descriptionEn: "Professional 33MP hybrid camera with 4K 60p recording, FE 24-70mm f/2.8 GM lens kit, rugged travel case, and 2 extra batteries.",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 6,
    availableQuantity: 4,
    reservedQuantity: 1,
    borrowedQuantity: 1,
    damagedQuantity: 0,
    isArchived: false,
    category: DEMO_CATEGORIES[0],
  },
  {
    id: "eq-dell-precision",
    categoryId: "cat-laptops",
    nameAr: "محطة عمل ديل Dell Precision 5570",
    nameEn: "Dell Precision 5570 Mobile Workstation",
    descriptionAr: "معالج Intel Core i7 الجيل 12، ذاكرة عشوائية 32GB، سعة 1TB NVMe SSD، وبطاقة رسومات NVIDIA RTX A2000 مخصصة لبرامج المحاكاة والتصميم CAD.",
    descriptionEn: "Intel Core i7 12th Gen, 32GB RAM, 1TB NVMe SSD, NVIDIA RTX A2000 GPU engineered for heavy simulation, modeling, and CAD workflows.",
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 8,
    availableQuantity: 5,
    reservedQuantity: 1,
    borrowedQuantity: 2,
    damagedQuantity: 0,
    isArchived: false,
    category: DEMO_CATEGORIES[1],
  },
  {
    id: "eq-macbook-pro-m3",
    categoryId: "cat-laptops",
    nameAr: "ماك بوك برو Apple MacBook Pro 16\" M3 Max",
    nameEn: "Apple MacBook Pro 16\" M3 Max",
    descriptionAr: "شريحة M3 Max مع 36GB ذاكرة موحدة وشاشة Liquid Retina XDR مقاس 16 بوصة، مخصصة لمشاريع التعلم العميق وتحرير الفيديو بدقة 8K.",
    descriptionEn: "M3 Max chip with 36GB unified memory, 16-inch Liquid Retina XDR display, ideal for deep learning research and ultra-high-definition video rendering.",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 4,
    availableQuantity: 2,
    reservedQuantity: 1,
    borrowedQuantity: 1,
    damagedQuantity: 0,
    isArchived: false,
    category: DEMO_CATEGORIES[1],
  },
  {
    id: "eq-rigol-oscilloscope",
    categoryId: "cat-sensors",
    nameAr: "راسم إشارة رقمي Rigol DS1054Z 50MHz",
    nameEn: "Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope",
    descriptionAr: "جهاز قياس وتحليل إشارات رقمية رباعي القنوات بنطاق ترددي 50MHz ومعدل عينات 1GSa/s مع مجسات القياس الأصلية وكابل التوصيل.",
    descriptionEn: "4-channel 50MHz bandwidth digital oscilloscope with 1 GSa/s real-time sample rate, passive probes, and calibrated test leads.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 5,
    availableQuantity: 3,
    reservedQuantity: 1,
    borrowedQuantity: 0,
    damagedQuantity: 1,
    isArchived: false,
    category: DEMO_CATEGORIES[2],
  },
  {
    id: "eq-fluke-thermal",
    categoryId: "cat-sensors",
    nameAr: "كاميرا تصوير حراري Fluke TiS20+ MAX",
    nameEn: "Fluke TiS20+ MAX Thermal Imaging Camera",
    descriptionAr: "كاميرا حرارية متقدمة بدقة 120x90 مع تقنية IR-Fusion للدمج البصري، نطاق قياس من -20°C إلى 400°C لفحص الدوائر الكهربائية والميكانيكية.",
    descriptionEn: "Industrial thermal imager with 120x90 resolution, IR-Fusion blending, -20°C to 400°C range for electrical inspection and circuit thermal diagnostics.",
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 3,
    availableQuantity: 2,
    reservedQuantity: 0,
    borrowedQuantity: 1,
    damagedQuantity: 0,
    isArchived: false,
    category: DEMO_CATEGORIES[2],
  },
  {
    id: "eq-dji-mic-2",
    categoryId: "cat-audio",
    nameAr: "ميكروفون لاسلكي ذكي DJI Mic 2 ثنائي القناة",
    nameEn: "DJI Mic 2 Dual-Channel Wireless Microphone Kit",
    descriptionAr: "طقم ميكروفون لاسلكي ذكي بمدى 250 متر مع تسجيل داخلي 32-bit عائم وخاصية إلغاء الضوضاء الذكية وحافظة الشحن المتنقلة.",
    descriptionEn: "Dual-channel wireless mic kit with 250m range, 32-bit float internal recording, intelligent active noise cancelling, and charging dock.",
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 7,
    availableQuantity: 6,
    reservedQuantity: 0,
    borrowedQuantity: 1,
    damagedQuantity: 0,
    isArchived: false,
    category: DEMO_CATEGORIES[3],
  },
  {
    id: "eq-meta-quest-3",
    categoryId: "cat-vr-ai",
    nameAr: "نظارة الواقع المختلط Meta Quest 3 512GB",
    nameEn: "Meta Quest 3 Mixed Reality Headset (512GB)",
    descriptionAr: "نظارة واقع افتراضي ومختلط فائقة الدقة بمعالج Snapdragon XR2 Gen 2 ورؤية ملونة بالكامل Passthrough لتطبيقات التدريب التفاعلي والمحاكاة ثلاثية الأبعاد.",
    descriptionEn: "Advanced mixed reality headset featuring Snapdragon XR2 Gen 2, 4K+ Infinite Display, and full-color passthrough for interactive 3D simulations.",
    imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 4,
    availableQuantity: 2,
    reservedQuantity: 1,
    borrowedQuantity: 1,
    damagedQuantity: 0,
    isArchived: false,
    category: DEMO_CATEGORIES[4],
  },
  {
    id: "eq-jetson-orin",
    categoryId: "cat-vr-ai",
    nameAr: "مجموعة تطوير NVIDIA Jetson Orin Nano",
    nameEn: "NVIDIA Jetson Orin Nano Developer Kit (8GB)",
    descriptionAr: "لوحة معالجة ذكاء اصطناعي طرفية بقدرة تصل إلى 40 TOPS تدعم شبكات الرؤية الحاسوبية المعقدة ومعالجة مجسمات الاستشعار في الوقت الفعلي.",
    descriptionEn: "Compact edge AI developer kit delivering up to 40 TOPS of AI compute, optimized for autonomous robotic vision and multi-camera pipelines.",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 6,
    availableQuantity: 4,
    reservedQuantity: 1,
    borrowedQuantity: 1,
    damagedQuantity: 0,
    isArchived: false,
    category: DEMO_CATEGORIES[4],
  },
  {
    id: "eq-turtlebot-4",
    categoryId: "cat-robotics",
    nameAr: "روبوت الأبحاث الأكاديمية TurtleBot 4 Lite",
    nameEn: "TurtleBot 4 Lite Mobile Robotic Platform",
    descriptionAr: "منصة روبوتية متنقلة مفتوحة المصدر مبنية على بنية ROS 2 ومزودة بمستشعر LiDAR وكاميرا عمق OAK-D-Lite لتطبيقات الملاحة الذاتية ورسم الخرائط SLAM.",
    descriptionEn: "Open-source ROS 2 educational robot equipped with 2D LiDAR, OAK-D-Lite spatial AI depth camera, and iRobot Create 3 mobile base.",
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 3,
    availableQuantity: 1,
    reservedQuantity: 1,
    borrowedQuantity: 1,
    damagedQuantity: 0,
    isArchived: false,
    category: DEMO_CATEGORIES[5],
  },
  {
    id: "eq-drone-matrice",
    categoryId: "cat-cameras",
    nameAr: "طائرة درون DJI Matrice 30T للمسح الجوي",
    nameEn: "DJI Matrice 30T Surveying & Inspection Drone",
    descriptionAr: "طائرة بدون طيار صناعية مجهزة بكاميرا تكبير بصري 48MP، ومستشعر حراري إشعاعي، ومحدد مدى ليزري بمدى 1200 متر مع حقيبة طيران ومحطة شحن بطاريات.",
    descriptionEn: "Enterprise hybrid drone integrating zoom, wide, and radiometric thermal cameras with a 1,200m laser rangefinder for photogrammetry and aerial inspection.",
    imageUrl: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
    totalQuantity: 2,
    availableQuantity: 0,
    reservedQuantity: 1,
    borrowedQuantity: 1,
    damagedQuantity: 0,
    isArchived: false,
    category: DEMO_CATEGORIES[0],
  },
];

export const DEMO_STUDENT_LOANS: DemoLoan[] = [
  {
    id: "loan-demo-001",
    durationDays: 4,
    academicJustification: "مشروع التخرج: تصوير وتوثيق مراحل بناء الهيكل الإنشائي لقسم الهندسة المدنية وتجهيز العرض الختامي.",
    status: "APPROVED",
    requestedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    approvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    pickupDeadline: new Date(Date.now() + 3600000 * 36).toISOString(),
    equipment: {
      id: "eq-sony-a7iv",
      nameAr: "كاميرا سوني Sony Alpha A7 IV",
      nameEn: "Sony Alpha A7 IV Full-Frame Camera",
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      category: {
        nameAr: "الكاميرات ومعدات التصوير",
        nameEn: "Cameras & Media Equipment",
      },
    },
  },
  {
    id: "loan-demo-002",
    durationDays: 5,
    academicJustification: "بحث معمل الذكاء الاصطناعي: تدريب شبكة عصبية لنماذج الرؤية الحاسوبية على جهاز حاسوبي عالي الأداء.",
    status: "CHECKED_OUT",
    requestedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    approvedAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    checkedOutAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    expectedReturnDate: new Date(Date.now() + 3600000 * 72).toISOString(),
    equipment: {
      id: "eq-dell-precision",
      nameAr: "محطة عمل ديل Dell Precision 5570",
      nameEn: "Dell Precision 5570 Mobile Workstation",
      imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      category: {
        nameAr: "الحواسيب المحمولة ومحطات العمل",
        nameEn: "Laptops & Mobile Workstations",
      },
    },
  },
  {
    id: "loan-demo-003",
    durationDays: 2,
    academicJustification: "تجربة معملية لقياس استجابة دوائر التردد اللاسلكي لمقرر الاتصالات والشبكات.",
    status: "RETURNED",
    requestedAt: new Date(Date.now() - 3600000 * 180).toISOString(),
    approvedAt: new Date(Date.now() - 3600000 * 160).toISOString(),
    checkedOutAt: new Date(Date.now() - 3600000 * 150).toISOString(),
    returnedAt: new Date(Date.now() - 3600000 * 100).toISOString(),
    equipment: {
      id: "eq-rigol-oscilloscope",
      nameAr: "راسم إشارة رقمي Rigol DS1054Z 50MHz",
      nameEn: "Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope",
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      category: {
        nameAr: "أجهزة القياس والاستشعار",
        nameEn: "Sensors & Measurement Tools",
      },
    },
  },
  {
    id: "loan-demo-004",
    durationDays: 3,
    academicJustification: "تسجيل بودكاست توعوي عن الأمن السيبراني للنادي الطلابي في الكلية.",
    status: "PENDING_REVIEW",
    requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    equipment: {
      id: "eq-dji-mic-2",
      nameAr: "ميكروفون لاسلكي ذكي DJI Mic 2 ثنائي القناة",
      nameEn: "DJI Mic 2 Dual-Channel Wireless Microphone Kit",
      imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
      category: {
        nameAr: "الملحقات الصوتية والعرض",
        nameEn: "Audio & AV Accessories",
      },
    },
  },
];

export const DEMO_ADMIN_QUEUE: DemoLoan[] = [
  {
    id: "loan-queue-001",
    durationDays: 3,
    academicJustification: "إجراء تجارب ملاحة ذاتية وتطبيق خوارزميات SLAM لمشروع تخرج هندسة الروبوتات والأنظمة الذكية.",
    status: "PENDING_REVIEW",
    requestedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    user: {
      id: "user-std-101",
      fullName: "محمد بن سلطان القحطاني (Mohammed Al-Qahtani)",
      studentId: "442008741",
      department: "قسم هندسة الحاسب والأنظمة المدمجة",
      phone: "+966504432198",
      email: "m.qahtani@university.edu.sa",
    },
    equipment: {
      id: "eq-turtlebot-4",
      nameAr: "روبوت الأبحاث الأكاديمية TurtleBot 4 Lite",
      nameEn: "TurtleBot 4 Lite Mobile Robotic Platform",
      imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
      availableQuantity: 1,
      reservedQuantity: 1,
      borrowedQuantity: 1,
      category: {
        nameAr: "الروبوتات وإنترنت الأشياء",
        nameEn: "Robotics & IoT Kits",
      },
    },
  },
  {
    id: "loan-queue-002",
    durationDays: 4,
    academicJustification: "تطوير بيئة محاكاة افتراضية لعمليات الصيانة الصناعية التفاعلية ضمن مسابقة هاكاثون الابتكار الجامعي.",
    status: "PENDING_REVIEW",
    requestedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    user: {
      id: "user-std-102",
      fullName: "ريم بنت عبد العزيز التميمي (Reem Al-Tamimi)",
      studentId: "441005520",
      department: "كلية علوم الحاسب والمعلومات",
      phone: "+966551198877",
      email: "r.tamimi@university.edu.sa",
    },
    equipment: {
      id: "eq-meta-quest-3",
      nameAr: "نظارة الواقع المختلط Meta Quest 3 512GB",
      nameEn: "Meta Quest 3 Mixed Reality Headset (512GB)",
      imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80",
      availableQuantity: 2,
      reservedQuantity: 1,
      borrowedQuantity: 1,
      category: {
        nameAr: "تقنيات الواقع الافتراضي والذكاء الاصطناعي",
        nameEn: "VR & AI Edge Devices",
      },
    },
  },
  {
    id: "loan-queue-003",
    durationDays: 7,
    academicJustification: "تحليل وتدريب نماذج لغوية كبيرة متخصصة بالمصطلحات الطبية بالتعاون مع المركز البحثي بالجامعة.",
    status: "PENDING_REVIEW",
    requestedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    user: {
      id: "user-std-103",
      fullName: "خالد بن فهد الغامدي (Khaled Al-Ghamdi)",
      studentId: "443001889",
      department: "قسم علوم البيانات والذكاء الاصطناعي",
      phone: "+966567788990",
      email: "k.ghamdi@university.edu.sa",
    },
    equipment: {
      id: "eq-macbook-pro-m3",
      nameAr: "ماك بوك برو Apple MacBook Pro 16\" M3 Max",
      nameEn: "Apple MacBook Pro 16\" M3 Max",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      availableQuantity: 2,
      reservedQuantity: 1,
      borrowedQuantity: 1,
      category: {
        nameAr: "الحواسيب المحمولة ومحطات العمل",
        nameEn: "Laptops & Mobile Workstations",
      },
    },
  },
];

export const DEMO_USERS: DemoUser[] = [
  {
    id: "user-demo-001",
    email: "faisal.omar@university.edu.sa",
    fullName: "فيصل بن عمر الدوسري (Faisal Omar)",
    studentId: "442001199",
    department: "كلية الهندسة الميكانيكية",
    phone: "+966541122334",
    role: "STUDENT",
    status: "PENDING_APPROVAL",
    rejectionReason: null,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "user-demo-002",
    email: "noura.saud@university.edu.sa",
    fullName: "نورة بنت سعود المطيري (Noura Al-Mutairi)",
    studentId: "443009120",
    department: "قسم علوم الحاسب",
    phone: "+966508877665",
    role: "STUDENT",
    status: "PENDING_APPROVAL",
    rejectionReason: null,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "user-demo-003",
    email: "sarah.zahrani@university.edu.sa",
    fullName: "سارة خالد الزهراني (Sarah Al-Zahrani)",
    studentId: "441009823",
    department: "كلية علوم الحاسب والمعلومات",
    phone: "+966559876543",
    role: "STUDENT",
    status: "ACTIVE",
    rejectionReason: null,
    createdAt: new Date(Date.now() - 3600000 * 240).toISOString(),
  },
  {
    id: "user-demo-004",
    email: "tariq.harbi@university.edu.sa",
    fullName: "طارق بن منصور الحربي (Tariq Al-Harbi)",
    studentId: "440003312",
    department: "قسم الهندسة الكهربائية",
    phone: "+966533322110",
    role: "STUDENT",
    status: "ACTIVE",
    rejectionReason: null,
    createdAt: new Date(Date.now() - 3600000 * 360).toISOString(),
  },
  {
    id: "user-demo-005",
    email: "ali.shahri@university.edu.sa",
    fullName: "علي بن يحيى الشهري (Ali Al-Shehri)",
    studentId: "441002299",
    department: "قسم العمارة والتخطيط",
    phone: "+966599887711",
    role: "STUDENT",
    status: "SUSPENDED",
    rejectionReason: "تأخر في تسليم عهدة كاميرا تصوير لأكثر من 14 يومًا دون عذر مسبق",
    createdAt: new Date(Date.now() - 3600000 * 500).toISOString(),
  },
];
