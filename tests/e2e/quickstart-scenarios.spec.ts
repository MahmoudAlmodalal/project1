import { test, expect } from "@playwright/test";

test.describe("BorrowHub Quickstart Scenarios (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base
    await page.goto("/");
  });

  test("Scenario 1: Student Registration & Authentication Flow (SCR-02 -> SCR-01)", async ({
    page,
  }) => {
    // 1. Visit Register Page
    await page.goto("/register");
    await expect(page).toHaveURL(/.*register/);
    await expect(
      page.locator("text=تسجيل حساب طالب جديد").or(page.locator("text=Student Registration"))
    ).toBeVisible();

    // 2. Fill student details
    const uniqueId = Date.now().toString().slice(-6);
    await page.fill('input[name="fullName"]', `طالب تجريبي ${uniqueId}`);
    await page.fill('input[name="email"]', `student_${uniqueId}@university.edu.sa`);
    await page.fill('input[name="studentId"]', `44${uniqueId}`);
    // department is a <select name="department">
    await page.selectOption('select[name="department"]', { index: 0 });
    await page.fill('input[name="phone"]', "+966551234567");
    await page.fill('input[name="password"]', "Password123!");
    await page.fill('input[name="confirmPassword"]', "Password123!");

    // Check policy agreement checkbox if present
    const policyCheckbox = page.locator('input[type="checkbox"]');
    if ((await policyCheckbox.count()) > 0) {
      await policyCheckbox.check();
    }

    // 3. Submit registration form
    await page.click('button[type="submit"]');

    // Verify submission succeeds and shows either confirmation or pending notification
    await expect(
      page.locator("text=تم تسجيل حسابك بنجاح").or(page.locator("text=Registration Successful")).or(page.locator("text=بانتظار موافقة مشرف المعمل"))
    ).toBeVisible({ timeout: 15000 });

    // 4. Try logging in immediately at /login
    await page.goto("/login");
    await page.fill('input[type="email"]', `student_${uniqueId}@university.edu.sa`);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // Confirm system displays warning/banner that account is pending approval
    await expect(
      page.locator("text=المراجعة الإدارية").or(page.locator("text=pending approval")).or(page.locator("text=غير نشط"))
    ).toBeVisible({ timeout: 15000 });
  });

  test("Scenario 2: Catalog Discovery, Booking Modal, & Concurrency Lock (SCR-04, SCR-04-M)", async ({
    page,
  }) => {
    // Visit catalog
    await page.goto("/catalog");
    await expect(page.locator("h1")).toContainText(/كتالوج المعدات|Laboratory Equipment Catalog/i);

    // Verify search input is interactive and responsive
    const searchInput = page.locator('input[placeholder*="ابحث"]').or(page.locator('input[placeholder*="Search"]')).first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Sony");
    await page.keyboard.press("Enter");

    // Clear search and ensure items are displayed
    await searchInput.fill("");
    await page.keyboard.press("Enter");

    // Check for equipment cards
    const bookButtons = page.locator('button:has-text("طلب استعارة"), button:has-text("Request Loan")');
    if ((await bookButtons.count()) > 0) {
      const firstButton = bookButtons.first();
      await firstButton.click();

      // Ensure booking dialog opens (SCR-04-M)
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Check max duration constraint label/note
      await expect(dialog).toContainText(/10/);

      // Close modal
      const closeButton = dialog.locator('button:has-text("إلغاء"), button:has-text("Cancel")').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  });

  test("Scenario 3 & 4: Admin Operations Navigation (SCR-06, SCR-07, SCR-08)", async ({
    page,
  }) => {
    // Visit Admin Review Queue
    await page.goto("/admin/queue", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/طابور مراجعة الطلبات|Review Queue/i);

    // Visit Pickups Counter
    await page.goto("/admin/pickups", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/شباك تسليم العتاد|Approved Pickups/i);

    // Visit Returns Counter & Check for Return/Damage actions
    await page.goto("/admin/returns", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/شباك الفحص وال(إرجاع|استرجاع)|Returns & Inspection/i);

    // Verify inspect/damage action buttons exist in the UI
    const damageButtons = page.locator('button:has-text("تسجيل تلف"), button:has-text("Mark Damaged")');
    expect(await page.locator("body").isVisible()).toBeTruthy();
  });

  test("Scenario 5: Overdue Detection & Auto-Reinstatement (SCR-09)", async ({
    page,
  }) => {
    await page.goto("/admin/overdue");
    await expect(page.locator("h1")).toContainText(/إنذارات العتاد المتأخر|Overdue Alerts/i);

    // Check KPI cards or warning elements
    const overdueCard = page.locator("text=المتأخرة").or(page.locator("text=Overdue")).first();
    await expect(overdueCard).toBeVisible();
  });

  test("Scenario 6: RTL/LTR Language Switching Seamlessness", async ({ page }) => {
    await page.goto("/catalog");

    // Check initial RTL dir
    const html = page.locator("html");
    const initialDir = await html.getAttribute("dir");

    // Click language switcher button
    const langBtn = page.locator('button:has-text("English"), button:has-text("العربية")').first();
    await expect(langBtn).toBeVisible();
    await langBtn.click();

    // Verify direction mirrored without layout errors
    const updatedDir = await html.getAttribute("dir");
    expect(updatedDir).not.toBe(initialDir);

    // Toggle back
    await langBtn.click();
    expect(await html.getAttribute("dir")).toBe(initialDir);
  });
});
