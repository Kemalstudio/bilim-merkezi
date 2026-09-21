/**
 * Gives the demo instructors a portrait. The photos are stock test portraits (xsgames.co
 * random-user set) stored in public/instructors — placeholders until the centre has real
 * photos of its teachers. Only courses without an avatar are touched, so a photo uploaded in the
 * admin panel is never replaced.
 *
 * Run: npm run instructors:avatars
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

export const INSTRUCTOR_AVATARS: Record<string, string> = {
  "Аигуль Назарова": "/instructors/aigul-nazarova.jpg",
  "Айна Ходжаева": "/instructors/aina-hojayeva.jpg",
  "Аман Дурдыев": "/instructors/aman-durdyyev.jpg",
  "Батыр Аманов": "/instructors/batyr-amanov.jpg",
  "Гульнара Сапарова": "/instructors/gulnara-saparova.jpg",
  "Гульшат Байрамова": "/instructors/gulshat-bayramova.jpg",
  "Джахан Кулиева": "/instructors/jahan-kuliyeva.jpg",
  "Джемал Овезова": "/instructors/jemal-owezova.jpg",
  "Джемиля Аширова": "/instructors/jemilya-ashirova.jpg",
  "Джерен Реджепова": "/instructors/jeren-rejepova.jpg",
  "Лейли Нурмухаммедова": "/instructors/leyli-nurmuhammedova.jpg",
  "Максат Ходжаниязов": "/instructors/maksat-hojaniyazov.jpg",
  "Мая Байрамдурдыева": "/instructors/maya-bayramdurdyyeva.jpg",
  "Мердан Аннаев": "/instructors/merdan-annayev.jpg",
  "Мерет Оразов": "/instructors/meret-orazov.jpg",
  "Огулбике Мурадова": "/instructors/ogulbike-muradova.jpg",
  "Огулгерек Чарыева": "/instructors/ogulgerek-charyyeva.jpg",
  "Сердар Атаев": "/instructors/serdar-atayev.jpg",
  "Сердар Гельдыев": "/instructors/serdar-geldiyev.jpg",
};

async function main() {
  let updated = 0;
  for (const [name, avatar] of Object.entries(INSTRUCTOR_AVATARS)) {
    const result = await prisma.course.updateMany({
      where: { instructorName: name, OR: [{ instructorAvatar: null }, { instructorAvatar: "" }] },
      data: { instructorAvatar: avatar },
    });
    updated += result.count;
  }
  console.log(`instructor avatars set on ${updated} course(s)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
