import { faker } from "@faker-js/faker";
import prisma from "../client";

export const reviewSeeder = async () => {
  const checkouts = await prisma.checkouts.findMany({
    where: {
      status: {
        some: {
          order_status: "success",
        },
      },
      review: {
        none: {},
      },
    },
    select: {
      id: true,
      user_id: true,
      product_checkout: {
        select: {
          product_id: true,
        },
      },
    },
  });

  if (checkouts.length === 0) {
    console.log("No successful checkouts to review. Skipping review seeding.");
    return;
  }

  for (const checkout of checkouts) {
    if (!checkout.product_checkout.length) {
      // Nothing to review
      continue;
    }

    // Simulate user choice: not all successful checkouts get reviewed
    const willReview = Math.random() < 0.7; // ~70% chance to create a review
    if (!willReview) {
      console.log(
        `Skipping review for checkout ${checkout.id} (user chose not to review)`,
      );
      continue;
    }

    const item = faker.helpers.arrayElement(checkout.product_checkout);

    await prisma.reviews.create({
      data: {
        star: faker.number.int({ min: 1, max: 5 }),
        description: faker.lorem.sentence(),
        user: { connect: { id: checkout.user_id } },
        checkout: { connect: { id: checkout.id } },
        product: { connect: { id: item.product_id } },
      },
    });

    console.log(`Created review for checkout ${checkout.id}`);
  }

  console.log("Review seeding completed!");
};
