import { Context } from "hono";
import prisma from "../../prisma/client";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const normalizeDays = (value: string | undefined) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30;
  }

  if (parsed > 365) {
    return 365;
  }

  return Math.floor(parsed);
};

const normalizeLowStockThreshold = (value: string | undefined) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10;
  }

  return Math.floor(parsed);
};

export const getDashboardOverview = async (c: Context) => {
  try {
    const days = normalizeDays(c.req.query("days"));
    const lowStockThreshold = normalizeLowStockThreshold(
      c.req.query("lowStockThreshold"),
    );

    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (days - 1));

    const [
      allOrders,
      recentOrders,
      totalCustomer,
      totalProduct,
      lowStockVariants,
      groupedProductSales,
    ] = await Promise.all([
      prisma.checkouts.findMany({
        select: {
          id: true,
          total_price: true,
          created_at: true,
          status: {
            orderBy: {
              created_at: "desc",
            },
            take: 1,
            select: {
              order_status: true,
              payment_status: true,
            },
          },
        },
      }),
      prisma.checkouts.findMany({
        orderBy: {
          created_at: "desc",
        },
        take: 8,
        select: {
          order_id: true,
          total_price: true,
          created_at: true,
          user: {
            select: {
              name: true,
              username: true,
            },
          },
          delivery: {
            select: {
              delivery_type: true,
            },
          },
          product_checkout: {
            select: {
              quantity: true,
            },
          },
          status: {
            orderBy: {
              created_at: "desc",
            },
            take: 1,
            select: {
              order_status: true,
              payment_status: true,
            },
          },
        },
      }),
      prisma.users.count({
        where: {
          role: "user",
          is_active: true,
        },
      }),
      prisma.products.count({
        where: {
          is_active: true,
        },
      }),
      prisma.variants.findMany({
        where: {
          is_active: true,
          stock: {
            lte: lowStockThreshold,
          },
          product: {
            is_active: true,
          },
        },
        orderBy: {
          stock: "asc",
        },
        take: 10,
        select: {
          id: true,
          variant: true,
          stock: true,
          price: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.product_checkouts.groupBy({
        by: ["product_id"],
        _sum: {
          quantity: true,
          price: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 5,
      }),
    ]);

    const statusCount = allOrders.reduce(
      (acc: Record<string, number>, order) => {
        const latestStatus = order.status[0]?.order_status ?? "pending";
        acc[latestStatus] = (acc[latestStatus] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const totalRevenue = allOrders.reduce((acc, order) => {
      const latestStatus = order.status[0];
      const isPaidOrSuccess =
        latestStatus?.payment_status === "paid" ||
        latestStatus?.order_status === "success";

      if (isPaidOrSuccess) {
        return acc + order.total_price;
      }

      return acc;
    }, 0);

    const totalOrders = allOrders.length;
    const pendingOrders = statusCount.pending ?? 0;
    const completedOrders = statusCount.success ?? 0;

    const trendMap = new Map<string, { orders: number }>();

    for (let index = 0; index < days; index++) {
      const date = new Date(rangeStart);
      date.setDate(rangeStart.getDate() + index);
      trendMap.set(formatDate(date), { orders: 0 });
    }

    allOrders.forEach((order) => {
      if (order.created_at < rangeStart) {
        return;
      }

      const dateKey = formatDate(order.created_at);
      const trendItem = trendMap.get(dateKey);

      if (!trendItem) {
        return;
      }

      trendItem.orders += 1;
    });

    const salesTrend = Array.from(trendMap.entries()).map(([date, value]) => ({
      date,
      checkout: value.orders,
    }));

    const productIds = groupedProductSales.map((item) => item.product_id);

    const topProductMeta = await prisma.products.findMany({
      where: {
        id: {
          in: productIds,
        },
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: {
          select: {
            category: true,
          },
        },
        product_images: {
          take: 1,
          select: {
            image_path: true,
          },
        },
      },
    });

    const topProductMap = new Map(
      topProductMeta.map((item) => [item.id, item]),
    );

    const topProducts = groupedProductSales
      .map((item) => {
        const product = topProductMap.get(item.product_id);

        if (!product) {
          return null;
        }

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          category: product.category.category,
          image_path: product.product_images[0]?.image_path,
          sold_quantity: item._sum.quantity ?? 0,
          revenue: item._sum.price ?? 0,
        };
      })
      .filter((item) => item !== null);

    const recentOrderData = recentOrders.map((order) => ({
      order_id: order.order_id,
      created_at: order.created_at,
      customer_name: order.user.name,
      customer_username: order.user.username,
      delivery_type: order.delivery.delivery_type,
      total_price: order.total_price,
      total_item: order.product_checkout.reduce(
        (acc, productCheckout) => acc + productCheckout.quantity,
        0,
      ),
      order_status: order.status[0]?.order_status ?? "pending",
      payment_status: order.status[0]?.payment_status ?? "pending",
    }));

    return c.json({
      success: true,
      data: {
        summary: {
          total_revenue: totalRevenue,
          total_order: totalOrders,
          pending_order: pendingOrders,
          completed_order: completedOrders,
          total_customer: totalCustomer,
          total_product: totalProduct,
          low_stock_count: lowStockVariants.length,
        },
        sales_trend: salesTrend,
        order_status_breakdown: Object.entries(statusCount).map(
          ([status, count]) => ({
            status,
            count,
          }),
        ),
        top_products: topProducts,
        low_stock_variants: lowStockVariants.map((variant) => ({
          id: variant.id,
          variant: variant.variant,
          stock: variant.stock,
          price: variant.price,
          product_id: variant.product.id,
          product_name: variant.product.name,
          product_slug: variant.product.slug,
        })),
        recent_orders: recentOrderData,
      },
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

export const chartCheckout = async (c: Context) => {
  try {
    const days = normalizeDays(c.req.query("days"));

    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (days - 1));

    const checkouts = await prisma.checkouts.findMany({
      where: {
        created_at: {
          gte: rangeStart,
        },
      },
      select: {
        created_at: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    const groupedData = checkouts.reduce(
      (acc: Record<string, number>, item) => {
        const date = formatDate(item.created_at);

        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;

        return acc;
      },
      {},
    );

    const chartData = Object.keys(groupedData)
      .sort((a, b) => a.localeCompare(b))
      .map((date) => ({
        date,
        checkout: groupedData[date],
      }));

    return c.json({
      success: true,
      data: chartData,
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
