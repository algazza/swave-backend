import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddVariantRequest, UpdateVariantRequest } from "../types/variant";

export const getVariantByProduct = async (c: Context) => {
  try {
    const productId = c.req.param("productId");

    const varaintData = await prisma.products.findUnique({
      where: { id: Number(productId), is_active: true },
      select: { id: true, name: true, variant: true },
    });

    if (!varaintData) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404,
      );
    }
    return c.json({
      success: true,
      data: varaintData,
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

export const createVariant = async (c: Context) => {
  try {
    const productId = c.req.param("productId");

    const product = await prisma.products.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404,
      );
    }

    const { variants } = c.get("validatedBody") as {
      variants: AddVariantRequest[];
    };

    const variantName = variants.map((v) => v.variant);

    const existing = await prisma.variants.findMany({
      where: { product_id: Number(productId), variant: { in: variantName } },
    });

    if (existing.length > 0) {
      return c.json(
        {
          success: false,
          message: "variant has been registered",
        },
        409,
      );
    }

    await prisma.$transaction(
      variants.map((v) =>
        prisma.variants.create({
          data: {
            variant: v.variant,
            price: v.price,
            stock: v.stock,
            product: {
              connect: {
                id: Number(productId),
              },
            },
          },
        }),
      ),
    );

    if (product.is_active === false) {
      await prisma.products.update({
        where: { id: Number(productId) },
        data: {
          is_active: true,
        },
      });
    }

    return c.json({
      success: true,
      message: "success add new variant",
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

export const updateVariant = async (c: Context) => {
  try {
    const productId = c.req.param("productId");
    const variantParam = c.req.param("variant");

    const product = await prisma.products.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404,
      );
    }

    const variantId = await prisma.variants.findFirst({
      where: { variant: variantParam, product_id: Number(productId) },
      select: { id: true },
    });

    if (!variantId) {
      return c.json(
        {
          success: false,
          message: "Variant not found",
        },
        404,
      );
    }

    const { variant, price, stock } = c.get(
      "validatedBody",
    ) as UpdateVariantRequest;

    const existing = await prisma.variants.findFirst({
      where: { variant, product_id: Number(productId) },
    });

    if (variant && existing) {
      return c.json(
        {
          success: false,
          message: "variant has been registered",
        },
        409,
      );
    }

    await prisma.variants.update({
      where: variantId,
      data: {
        variant,
        price,
        stock,
      },
    });

    return c.json({
      success: true,
      message: "Success update variant",
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

export const softDeleteVariant = async (c: Context) => {
  try {
    const productId = c.req.param("productId");
    const variantParam = c.req.param("variant");

    const product = await prisma.products.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404,
      );
    }

    const variantId = await prisma.variants.findFirst({
      where: { variant: variantParam, product_id: Number(productId) },
      select: { id: true },
    });

    if (!variantId) {
      return c.json(
        {
          success: false,
          message: "Variant not found",
        },
        404,
      );
    }

    await prisma.variants.update({
      where: variantId,
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    return c.json({
      success: true,
      message: "success soft delete variant",
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

export const deleteVaraint = async (c: Context) => {
  try {
    const productId = c.req.param("productId");
    const variantParam = c.req.param("variant");

    const product = await prisma.products.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404,
      );
    }

    const variantId = await prisma.variants.findFirst({
      where: { variant: variantParam },
      select: { id: true },
    });

    if (!variantId) {
      return c.json(
        {
          success: false,
          message: "Variant not found",
        },
        404,
      );
    }

    await prisma.variants.delete({
      where: { id: variantId.id, product_id: Number(productId) },
    });

    return c.json({
      success: true,
      message: "Success delete variant",
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
