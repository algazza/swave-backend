import { faker } from "@faker-js/faker";
import prisma from "../client";

export const cartSeeder = async () => {
  const users = await prisma.users.findMany({ select: { id: true } });
  const products = await prisma.products.findMany({ select: { id: true } });

  if (users.length === 0) {
    console.log("No users found. Please seed users first.");
    return;
  }

  if (products.length === 0) {
    console.log("No products found. Please seed products and variants first.");
    return;
  }

  for (const user of users) {
    const itemCount = faker.number.int({ min: 1, max: 5 });

    for (let i = 0; i < itemCount; i++) {
      const product = faker.helpers.arrayElement(products);

      const variants = await prisma.variants.findMany({
        where: { product_id: product.id },
        select: { id: true, stock: true, price: true },
      });

      if (variants.length === 0) {
        // Skip if product has no variants
        continue;
      }

      const variant = faker.helpers.arrayElement(variants);
      const requestedQuantity = faker.number.int({ min: 1, max: 5 });
      const fixQuantity = Math.min(requestedQuantity, variant.stock);

      if (fixQuantity <= 0) {
        // No stock available, skip
        continue;
      }

      const existing = await prisma.carts.findFirst({
        where: {
          user_id: user.id,
          product_id: product.id,
          variant_id: variant.id,
        },
        select: {
          id: true,
          variant: {
            select: {
              stock: true,
              price: true,
            },
          },
        },
      });

      const price = variant.price * fixQuantity;

      if (existing) {
        await prisma.carts.update({
          where: { id: existing.id },
          data: {
            quantity: fixQuantity,
            price,
          },
        });
        continue;
      }

      await prisma.carts.create({
        data: {
          quantity: fixQuantity,
          price,
          product: { connect: { id: product.id } },
          variant: { connect: { id: variant.id } },
          user: { connect: { id: user.id } },
        },
      });
    }
  }
};
