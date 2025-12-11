import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddReviewRequest } from "../types/review";

export const getHistoryReview = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const review = await prisma.reviews.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        star: true,
        description: true,
        created_at: true,
        user: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
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
            product_checkout: {
              select: {
                variant: {
                  select: {
                    variant: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!review || review.length === 0) {
      return c.json({
        success: true,
        message: "user doesnt have review",
      });
    }

    return c.json({
      success: true,
      data: review,
    });
  } catch (err) {
    return c.json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : String(err) || "Internal server error",
    });
  }
};

export const getHistoryUnreview = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const unReview = await prisma.checkouts.findMany({
      where: { user_id: userId, review: null },
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
            status_type: true,
          },
        },
        product_checkout: {
          select: {
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

    if (!unReview || unReview.length === 0) {
      return c.json({
        success: true,
        message: "no product to review",
      });
    }

    return c.json({
      success: true,
      data: unReview,
    });
  } catch (err) {
    return c.json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : String(err) || "Internal server error",
    });
  }
};

export const createReview = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const { star, description, order_id, product_id } = c.get(
      "validatedBody"
    ) as AddReviewRequest;

    const checkout = await prisma.checkouts.findUnique({
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
      });
    }

    if (!checkout.status.find((s) => s.status_type === "success")) {
      return c.json({
        success: false,
        message: "you cant review until completed",
      });
    }


    const existing = await prisma.reviews.findUnique({
      where: {product_id, checkout_id: checkout.id}
    }) 

    if(existing){
      return c.json({
        success: false,
        message: 'You cant review again'
      })
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
    return c.json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : String(err) || "Internal server error",
    });
  }
};
