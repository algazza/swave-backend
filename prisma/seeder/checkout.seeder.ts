import { faker } from "@faker-js/faker";
import prisma from "../client";
import { distanceLocation } from "../../src/service/location";

export const checkoutSeeder = async () => {
  // Get users with carts
  const users = await prisma.users.findMany({
    where: {
      cart: {
        some: {},
      },
    },
    select: { id: true },
  });

  if (users.length === 0) {
    console.log("No users with carts found. Please seed carts first.");
    return;
  }

  for (const user of users) {
    // Get random carts for this user (1-3 items)
    const carts = await prisma.carts.findMany({
      where: { user_id: user.id },
      take: faker.number.int({ min: 1, max: 3 }),
      select: {
        id: true,
        product_id: true,
        variant_id: true,
        quantity: true,
      },
    });

    if (carts.length === 0) {
      continue;
    }

    try {
      // Get user's address
      const userAddress = await prisma.address.findFirst({
        where: { user_id: user.id },
        select: {
          id: true,
          longitude: true,
          latitude: true,
        },
      });

      if (!userAddress || !userAddress.longitude || !userAddress.latitude) {
        console.log(
          `User ${user.id} has no address with coordinates. Skipping.`
        );
        continue;
      }

      // Get admin address
      const adminAddress = await prisma.address.findFirst({
        where: { user_id: 1 },
        select: {
          longitude: true,
          latitude: true,
        },
      });

      if (!adminAddress || !adminAddress.longitude || !adminAddress.latitude) {
        console.log("Admin address not found. Skipping checkout seeding.");
        return;
      }

      const distanceRound = Math.round(20000 / 1000) * 1000;

      // Process checkout in transaction
      const result = await prisma.$transaction(async (tx) => {
        const variantItems = await Promise.all(
          carts.map(async (cart) => {
            const variant = await tx.variants.findUnique({
              where: { id: cart.variant_id },
              select: {
                id: true,
                price: true,
                stock: true,
                product_id: true,
              },
            });

            if (!variant) {
              throw new Error(`Variant ${cart.variant_id} not found`);
            }

            if (variant.product_id !== cart.product_id) {
              throw new Error("Variant does not belong to product");
            }

            if (variant.stock < cart.quantity) {
              throw new Error("Insufficient stock");
            }

            // Delete from cart
            await tx.carts.delete({
              where: { id: cart.id },
            });

            // Update product sold and variant stock
            await tx.products.update({
              where: { id: cart.product_id },
              data: {
                sold: {
                  increment: cart.quantity,
                },
              },
            });

            await tx.variants.update({
              where: { id: cart.variant_id },
              data: {
                stock: {
                  decrement: cart.quantity,
                },
              },
            });

            return {
              product_id: cart.product_id,
              variant_id: cart.variant_id,
              quantity: cart.quantity,
              price: variant.price,
              subtotal: variant.price * cart.quantity,
            };
          })
        );

        const total_price =
          variantItems.reduce((acc, item) => acc + item.subtotal, 0) +
          distanceRound * 2;

        const order_id = `ORD-${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Randomize status to allow reviews; bias towards 'success'
        const orderStatus =
          faker.number.int({ min: 0, max: 99 }) < 50
            ? "success"
            : faker.helpers.arrayElement([
                "pending",
                "processing",
                "delivery",
                "cancelled",
              ]);
        const paymentStatus =
          orderStatus === "success"
            ? "paid"
            : faker.helpers.arrayElement([
                "pending",
                "expired",
                "failed",
                "refunded",
              ]);
        const statusDescription =
          orderStatus === "success"
            ? "Completed"
            : orderStatus === "delivery"
            ? "On delivery"
            : "Waiting for payment";

        const checkout = await tx.checkouts.create({
          data: {
            order_id,
            description: faker.lorem.sentence(),
            gift_card: faker.datatype.boolean({ probability: 0.3 }),
            gift_description: faker.lorem.sentence(),
            estimation: new Date(Date.now() + 3 * 86400000).toISOString(),
            total_price,
            user: {
              connect: {
                id: user.id,
              },
            },
            delivery: {
              create: {
                delivery_type: faker.helpers.arrayElement([
                  "delivery",
                  "pickup",
                ]),
                pickup_date: faker.date.future().toISOString(),
                pickup_hour: `${faker.number
                  .int({ min: 0, max: 23 })
                  .toString()
                  .padStart(2, "0")}:${faker.number
                  .int({ min: 0, max: 59 })
                  .toString()
                  .padStart(2, "0")}`,
                delivery_price: 0,
                address: {
                  connect: {
                    id: userAddress.id,
                  },
                },
              },
            },
            status: {
              create: {
                payment_status: paymentStatus,
                order_status: orderStatus,
                description: statusDescription,
              },
            },
            product_checkout: {
              create: variantItems.map((item) => ({
                quantity: item.quantity,
                price: item.subtotal,
                product: {
                  connect: {
                    id: item.product_id,
                  },
                },
                variant: {
                  connect: {
                    id: item.variant_id,
                  },
                },
              })),
            },
          },
        });

        return {
          checkoutId: checkout.id,
          orderId: order_id,
          totalPrice: total_price,
        };
      });

      console.log(
        `Created checkout ${result.orderId} for user ${user.id} with total ${result.totalPrice}`
      );
    } catch (err) {
      console.error(
        `Error creating checkout for user ${user.id}:`,
        err instanceof Error ? err.message : String(err)
      );
      continue;
    }
  }
};
