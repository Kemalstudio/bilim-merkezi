import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, minCardChargeTmt, tmtPerUsd, toStripeUsdCents } from "@/lib/money";
import { describeDevice } from "@/lib/device";
import { deletedEmail, isDeletedEmail, signInMethods } from "@/lib/account";
import { courseSchema } from "@/lib/validations/course";
import { changeEmailSchema, deleteAccountSchema, setPasswordSchema } from "@/lib/validations/profile";

test("prices are shown in manat, grouped, without fractions", () => {
  assert.match(formatMoney(1900), /^1\s?900 TMT$/u);
  assert.match(formatMoney("5100.00"), /5\s?100 TMT$/u);
  assert.equal(formatMoney(0), "0 TMT");
  assert.equal(formatMoney("not a number"), "0 TMT");
});

test("Stripe is charged in US cents at the official rate", () => {
  assert.equal(tmtPerUsd(), 3.5);
  assert.equal(toStripeUsdCents(3500), 100_000); // 3500 TMT = 1000 USD
  assert.equal(toStripeUsdCents(1900), 54_286);
  // Below 0.50 USD Stripe refuses the card charge; 1.75 TMT is the smallest manat amount that clears it.
  assert.equal(minCardChargeTmt(), 2);
  assert.ok(toStripeUsdCents(minCardChargeTmt()) >= 50);
});

test("device labels name the browser and system only", () => {
  const chromeWindows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
  const edge = `${chromeWindows} Edg/126.0`;
  const safariIphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const chromeAndroid = "Mozilla/5.0 (Linux; Android 14; SM-A175F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";
  assert.equal(describeDevice(chromeWindows), "Chrome · Windows");
  assert.equal(describeDevice(edge), "Edge · Windows");
  assert.equal(describeDevice(safariIphone), "Safari · iOS");
  assert.equal(describeDevice(chromeAndroid), "Chrome · Android");
  assert.equal(describeDevice(null), null);
  assert.equal(describeDevice("curl/8.0"), null);
});

test("a deleted account is recognisable and anonymous", () => {
  const email = deletedEmail("abc123");
  assert.equal(isDeletedEmail(email), true);
  assert.equal(isDeletedEmail("parent@example.com"), false);
  assert.equal(isDeletedEmail(null), false);
});

test("sign-in methods reflect what the account really has", () => {
  assert.deepEqual(signInMethods({ phone: "99365123456", passwordHash: null, hasGoogle: false }), ["sms"]);
  assert.deepEqual(signInMethods({ phone: "99365123456", passwordHash: "x", hasGoogle: true }), ["sms", "password", "google"]);
  assert.deepEqual(signInMethods({ phone: null, passwordHash: null, hasGoogle: false }), []);
});

test("settings forms validate before any action touches the database", () => {
  assert.equal(changeEmailSchema.parse({ email: " Mom@Example.com " }).email, "mom@example.com");
  assert.equal(changeEmailSchema.safeParse({ email: "nope" }).success, false);

  const password = { newPassword: "longenough1", confirmNewPassword: "longenough1" };
  assert.equal(setPasswordSchema.safeParse(password).success, true);
  assert.equal(setPasswordSchema.safeParse({ ...password, confirmNewPassword: "different1" }).success, false);
  assert.equal(setPasswordSchema.safeParse({ newPassword: "short", confirmNewPassword: "short" }).success, false);

  // Deleting an account needs the explicit tick.
  assert.equal(deleteAccountSchema.safeParse({ confirm: "on" }).success, true);
  assert.equal(deleteAccountSchema.safeParse({}).success, false);
});

test("course prices are whole manat and a teacher photo must come from our own upload", () => {
  const base = {
    title: "Курс",
    summary: "Кратко о курсе, достаточно длинно",
    description: "Подробное описание курса, достаточно длинное для проверки.",
    level: "BEGINNER",
    lessonsPerWeek: 3,
    weeklyHoursMin: 15,
    weeklyHoursMax: 20,
    price: 1500,
    categoryId: "cat",
    instructorName: "Айгуль Назарова",
    published: true,
    featured: false,
    certificate: true,
    outcomes: [],
    skills: [],
    requirements: [],
    audience: [],
    modules: [
      {
        title: "Неделя 1: основы",
        lessons: [1, 2, 3].map((n) => ({ title: `Урок ${n}`, durationMin: 60, topics: [] })),
      },
    ],
  };
  assert.equal(courseSchema.safeParse(base).success, true);
  assert.equal(courseSchema.safeParse({ ...base, price: 1500.5 }).success, false);
  assert.equal(courseSchema.safeParse({ ...base, price: -1 }).success, false);
  assert.equal(courseSchema.safeParse({ ...base, price: 1500, discountPrice: 1800 }).success, false);
  assert.equal(courseSchema.safeParse({ ...base, instructorAvatar: "/uploads/avatars/3f1c2b4a-1234-4abc-8def-0123456789ab.webp" }).success, true);
  assert.equal(courseSchema.safeParse({ ...base, instructorAvatar: "/instructors/aigul-nazarova.jpg" }).success, true);
  assert.equal(courseSchema.safeParse({ ...base, instructorAvatar: "https://evil.example/x.png" }).success, false);
});

test("CSV exports open cleanly in a spreadsheet and cannot run formulas", async () => {
  const { toCsv } = await import("@/lib/csv");
  const csv = toCsv(["Имя", "Сумма"], [
    ["Айгуль; Назарова", 1900],
    ['=HYPERLINK("http://evil.example")', 50],
    ['Кавычки "внутри"', null],
    [new Date("2026-09-21T10:30:45Z"), "+993"],
  ]);
  assert.ok(csv.startsWith("﻿Имя;Сумма\r\n"), "BOM and semicolon separator for Excel");
  assert.match(csv, /"Айгуль; Назарова";1900/);
  assert.match(csv, /'=HYPERLINK/, "a leading = is neutralised");
  assert.match(csv, /"Кавычки ""внутри"""/);
  assert.match(csv, /2026-09-21 10:30:45;'\+993/);
});
