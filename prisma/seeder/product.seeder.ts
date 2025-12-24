import { faker } from "@faker-js/faker";
import prisma from "../client";

export const productSeeder = async () => {
  const categories = await prisma.categories.findMany();

  if (categories.length === 0) {
    console.log("No categories found. Please seed categories first.");
    return;
  }

  for (let i = 0; i < 30; i++) {
    const product = await prisma.products.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        sold: faker.number.int({ min: 0, max: 500 }),
        categories_id: faker.helpers.arrayElement(categories).id,

        variant: {
          create: Array.from(
            { length: faker.number.int({ min: 1, max: 4 }) },
            () => ({
              variant: faker.helpers.arrayElement([
                "Small",
                "Medium",
                "Large",
                "XL",
                "Red",
                "Blue",
                "Green",
                "Black",
                "White",
              ]),
              price: faker.number.int({ min: 10000, max: 500000 }),
              stock: faker.number.int({ min: 0, max: 100 }),
            })
          ),
        },

        product_images: {
          create: Array.from(
            { length: faker.number.int({ min: 1, max: 5 }) },
            () => ({
              image_path: faker.image.url(),
            })
          ),
        },
      },
    });
  }
};
