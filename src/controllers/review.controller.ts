import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddReviewRequest } from "../types/review";

export const getHistoryReview = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const reviews = await prisma.reviews.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        star: true,
        description: true,
        created_at: true,
        product_id: true,
        checkout_id: true,
        user: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            product_images: {
              take: 1,
              select: { image_path: true },
            },
            category: {
              select: {
                category: true,
              },
            },
          },
        },
        checkout: {
          select: {
            order_id: true,
          },
        },
      },
    });

    const reviewsWithVariants = await Promise.all(
      reviews.map(async (review) => {
        const productCheckout = await prisma.product_checkouts.findFirst({
          where: {
            checkout_id: review.checkout_id,
            product_id: review.product_id,
          },
          select: {
            variant: {
              select: {
                variant: true,
              },
            },
          },
        });

        const { product_id, checkout_id, ...reviewData } = review;
        return {
          ...reviewData,
          checkout: {
            ...review.checkout,
            product_checkout: productCheckout
              ? [{ variant: productCheckout.variant }]
              : [],
          },
        };
      }),
    );

    const reviewJSON = reviewsWithVariants.map((review) => ({
      id: review.id,
      star: review.star,
      description: review.description,
      created_at: review.created_at,
      user: review.user,
      order_id: review.checkout.order_id,
      product: {
        product_id: review.product.id,
        name: review.product.name,
        image_path: review.product.product_images.map(
          (img) => img.image_path,
        )[0],
        category: review.product.category.category,
        variant: review.checkout.product_checkout[0]?.variant.variant,
      },
    }));

    return c.json({
      success: true,
      data: reviewJSON,
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500,
    );
  }
};

export const getHistoryUnreview = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const checkouts = await prisma.checkouts.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        order_id: true,
        created_at: true,
        total_price: true,
        status: {
          orderBy: {
            created_at: "desc",
          },
          take: 1,
          select: {
            order_status: true,
          },
        },
        product_checkout: {
          select: {
            product_id: true,
            product: {
              select: {
                id: true,
                name: true,
                product_images: {
                  take: 1,
                  select: { image_path: true },
                },
                category: {
                  select: {
                    category: true,
                  },
                },
              },
            },
            variant: {
              select: {
                variant: true,
                price: true,
              },
            },
            quantity: true,
          },
        },
      },
    });

    const unReview = await Promise.all(
      checkouts
        .filter((checkout) =>
          checkout.status.some((s) => s.order_status === "success"),
        )
        .map(async (checkout) => {
          const reviews = await prisma.reviews.findMany({
            where: { checkout_id: checkout.id },
            select: { product_id: true },
          });

          const reviewedProductIds = reviews.map((r) => r.product_id);
          const unreviewedProducts = checkout.product_checkout.filter(
            (pc) => !reviewedProductIds.includes(pc.product_id),
          );

          if (unreviewedProducts.length === 0) {
            return null;
          }

          return unreviewedProducts.map((pc) => ({
            id: checkout.id,
            order_id: checkout.order_id,
            created_at: checkout.created_at,
            total_price: checkout.total_price,
            status: checkout.status[0].order_status,
            product: {
              product_id: pc.product.id,
              product_name: pc.product.name,
              product_images: pc.product.product_images.map(
                (img) => img.image_path,
              )[0],
              category: pc.product.category.category,
              variant: pc.variant.variant,
              price: pc.variant.price,
              quantity: pc.quantity,
            },
          }));
        }),
    );

    return c.json({
      success: true,
      data: unReview.filter((item) => item !== null).flat(),
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500,
    );
  }
};

export const createReview = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const { star, description, order_id, product_id } = c.get(
      "validatedBody",
    ) as AddReviewRequest;

    const checkout = await prisma.checkouts.findFirst({
      where: {
        user_id: userId,
        order_id: order_id,
        product_checkout: {
          some: {
            product_id: Number(product_id),
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!checkout) {
      return c.json({
        success: false,
        message: "product not found",
      }, 404);
    }

    if (!checkout.status.find((s) => s.order_status === "success")) {
      return c.json({
        success: false,
        message: "you cant review until completed",
      }, 400);
    }

    const existing = await prisma.reviews.findFirst({
      where: { product_id, checkout_id: checkout.id },
    });

    if (existing) {
      return c.json({
        success: false,
        message: "You cant review again",
      }, 400);
    }

    await prisma.reviews.create({
      data: {
        star,
        description,
        user: {
          connect: { id: userId },
        },
        checkout: {
          connect: { id: checkout.id },
        },
        product: {
          connect: { id: product_id },
        },
      },
    });

    return c.json({
      success: true,
      message: "success add review",
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500,
    );
  }
};

export const deleteReview = async (c: Context) => {
  try {
    const reviewId = c.req.param("id");

    const review = await prisma.reviews.findFirst({
      where: { id: Number(reviewId) },
    });

    if (!review) {
      return c.json({
        success: false,
        message: "review not found",
      }, 404);
    }

    await prisma.reviews.delete({
      where: { id: Number(reviewId) },
    });

    return c.json({
      success: true,
      message: "success delete review",
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500,
    );
  }
}
