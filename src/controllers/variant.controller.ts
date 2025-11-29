import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddVariantRequest, UpdateVariantRequest } from "../types/variant";

export const getVariantByCategory = async (c: Context) => {
  try {
    const categoryParam = c.req.param("category");

    const varaintData = await prisma.categories.findUnique({
      where: { category: categoryParam },
      select: { category: true, variant: true },
    });

    if (!varaintData) {
      return c.json(
        {
          success: false,
          message: "Category not found",
        },
        401
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
        message: "Internal server error",
      },
      500
    );
  }
};

export const createVariant = async (c: Context) => {
  try {
    const categoryParam = c.req.param("category");

    const categoryId = await prisma.categories.findUnique({
      where: { category: categoryParam },
      select: { id: true },
    });

    if (!categoryId) {
      return c.json(
        {
          success: false,
          message: "Category not found",
        },
        401
      );
    }

    const { variant, price, stock } = c.get("validatedBody") as AddVariantRequest;

    const existing = await prisma.variants.findFirst({
      where: { variant, categories_id: categoryId.id },
    });

    if (existing) {
      return c.json(
        {
          success: false,
          message: "variant has been registered",
        },
        409
      );
    }

    await prisma.variants.create({
      data: {
        variant,
        price,
        stock,

        category: {
          connect: {
            id: categoryId.id,
          },
        },
      },
    });

    return c.json({
      success: true,
      message: "success add new variant",
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
};

export const updateVariant = async (c: Context) => {
  try {
    const categoryParam = c.req.param("category");
    const variantParam = c.req.param("variant");

    const categoryId = await prisma.categories.findUnique({
      where: { category: categoryParam },
      select: { id: true },
    });

    if (!categoryId) {
      return c.json(
        {
          success: false,
          message: "Category not found",
        },
        401
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
        401
      );
    }

    const { variant, price, stock } = c.get("validatedBody") as UpdateVariantRequest;

    const existing = await prisma.variants.findFirst({
      where: { variant, categories_id: categoryId.id },
    });

    if (variant && existing) {
      return c.json(
        {
          success: false,
          message: "variant has been registered",
        },
        409
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
      message: 'Success update variant'
    })
  } catch (err) {
    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
};

export const deleteVaraint = async (c: Context) => {
  try {
    const categoryParam = c.req.param("category");
    const variantParam = c.req.param("variant");

    const categoryId = await prisma.categories.findUnique({
      where: { category: categoryParam },
      select: { id: true },
    });

    if (!categoryId) {
      return c.json(
        {
          success: false,
          message: "Category not found",
        },
        401
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
        401
      );
    }

    await prisma.variants.delete({
      where: { id: variantId.id, categories_id: categoryId.id },
    });

    return c.json({
      success: true,
      message: 'Success delete variant'
    })
  } catch (err) {
    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
};
