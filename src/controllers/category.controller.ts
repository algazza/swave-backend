import { Context } from "hono";
import prisma from "../../prisma/client";
import { CategoryRequest } from "../types/category";

export const getAllCategory = async (c: Context) => {
  try {
    const categoryData = await prisma.categories.findMany({
      select: { category: true, product: { select: { id: true } } },
    });

    const categoryJson = categoryData
      .map((item) => ({
        category: item.category,
        count: item.product.length,
      }))
      .sort((a, b) =>
        a.category.localeCompare(b.category, "id", { sensitivity: "base" }),
      );

    return c.json({
      success: true,
      data: categoryJson,
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

export const getOneCategory = async (c: Context) => {
  try {
    const category = c.req.param("category");

    const categoryData = await prisma.categories.findUnique({
      where: { category: String(category) },
      select: { category: true, product: true },
    });

    if (!categoryData) {
      return c.json(
        {
          success: false,
          message: "Category not found",
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: categoryData,
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

export const createCategory = async (c: Context) => {
  try {
    const { category } = c.get("validatedBody") as CategoryRequest;

    const existing = await prisma.categories.findFirst({
      where: { category },
    });

    if (existing) {
      return c.json({
        success: false,
        message: "Category has been registed",
      });
    }

    await prisma.categories.create({
      data: { category },
    });

    return c.json({
      success: true,
      message: `success add ${category} category`,
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

export const updateCategory = async (c: Context) => {
  try {
    const categoryParam = c.req.param("category");

    const isCategory = await prisma.categories.findFirst({
      where: { category: categoryParam },
    });

    if (!isCategory) {
      return c.json(
        {
          success: false,
          message: "Category not found",
        },
        404,
      );
    }

    const { category } = c.get("validatedBody") as CategoryRequest;

    await prisma.categories.update({
      where: { category: categoryParam },
      data: { category },
    });

    return c.json({
      success: true,
      message: "success update category",
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

export const softDeleteCategory = async (c: Context) => {
  try {
    const categoryParam = c.req.param("category");

    const isCategory = await prisma.categories.findFirst({
      where: { category: categoryParam },
    });

    if (!isCategory) {
      return c.json(
        {
          success: false,
          message: "Category not found",
        },
        404,
      );
    }

    await prisma.categories.update({
      where: { category: categoryParam },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    return c.json({
      success: true,
      message: "success soft delete category",
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

export const deleteCategory = async (c: Context) => {
  try {
    const categoryParam = c.req.param("category");

    const categoryId = await prisma.categories.findFirst({
      where: { category: categoryParam },
      select: { id: true },
    });

    if (!categoryId) {
      return c.json(
        {
          success: false,
          message: "Category not found",
        },
        404,
      );
    }

    const product = await prisma.products.findFirst({
      where: { categories_id: categoryId.id },
    });

    if (product) {
      return c.json({
        success: false,
        message:
          "There are still products in this category, please move the product to another category first.",
      });
    }

    await prisma.categories.delete({
      where: { category: categoryParam },
    });

    return c.json({
      success: true,
      message: "Success delete category",
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
