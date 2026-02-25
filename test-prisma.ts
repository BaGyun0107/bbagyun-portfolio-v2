import { PrismaClient } from "./src/generated/prisma/client/index.js";
import path from "path";

const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
      },
    },
});

async function main() {
    try {
        const features = await prisma.feature.findMany();
        console.log("Found:", features.length);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
