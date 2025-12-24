import { faker } from "@faker-js/faker";
import prisma from "../client";

export const categorySeeder = async () => {
  const categoryNames = [
    "Electronics",
    "Fashion",
    "Home & Garden",
    "Sports & Outdoors",
    "Beauty & Personal Care",
    "Toys & Games",
    "Books",
    "Food & Beverages",
    "Health & Wellness",
    "Pet Supplies",
    "Automotive",
    "Office Supplies",
  ];

  for (const categoryName of categoryNames) {
    const existing = await prisma.categories.findFirst({
      where: { category: categoryName },
    });

    if (existing) {
      console.log(`Category "${categoryName}" already exists. Skipping.`);
      continue;
    }

    await prisma.categories.create({
      data: {
        category: categoryName,
      },
    });
  }
};
