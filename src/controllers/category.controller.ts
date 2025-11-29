import { Context } from "hono";
import prisma from "../../prisma/client";
import { CategoryRequest } from "../types/category";

export const getAllCategory = async (c: Context) => {
  try {
    const categoryData = await prisma.categories.findMany({
      select: { category: true, product: true, variant: true },
    });

    if (!categoryData || categoryData.length === 0) {
      return c.json(
        {
          success: false,
          message: "No category found",
        },
        404
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
        message: "Internal server error",
        error: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
};

export const getOneCategory = async (c: Context) => {
  try {
    const category = c.req.param("category");

    const categoryData = await prisma.categories.findUnique({
      where: { category: String(category) },
      select: { category: true, product: true, variant: true },
    });

    if (!categoryData) {
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
      data: categoryData,
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
        message: "Internal server error",
      },
      500
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
        401
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
        message: "Internal server error",
        error: err instanceof Error ? err.message : String(err),
      },
      500
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
        401
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

    await prisma.variants.deleteMany({
      where: { categories_id: categoryId.id },
    });

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
        message: "Internal server error",
        error: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
};
