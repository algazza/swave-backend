import { Context } from "hono";
import { mkdir } from "node:fs/promises";
import { rm } from "node:fs/promises";
import tinify from "tinify";
import prisma from "../../prisma/client";
import { AddProductRequest } from "../types/product";
import { slugify } from "../utils/slugify";

tinify.key = process.env.TINIFY_API_KEY || "";

export const getAllProduct = async (c: Context) => {
  try {
    const products = await prisma.products.findMany({
      select: {
        id: true,
        name: true,
        sold: true,
        category: {
          select: {
            category: true,
          },
        },
        product_images: {
          take: 1,
          select: { image_path: true },
        },
        review: {
          select: { star: true },
        },
      },
    });

    if (!products) {
      return c.json({
        success: false,
        message: "product not added",
      });
    }

    const productJson = products.map((p) => ({
      id: p.id,
      name: p.name,
      sold: p.sold,
      category: p.category.category,
      product_images: p.product_images.map((img) => img.image_path),
      star:
        p.review.length === 0
          ? 0
          : p.review.reduce((acc, item) => acc + item.star, 0) /
            p.review.length,
    }));
    return c.json({
      success: true,
      data: productJson,
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
      500
    );
  }
};

export const getOneProduct = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const product = await prisma.products.findUnique({
      where: { id: Number(id) },
      select: {
        name: true,
        description: true,
        sold: true,
        category: true,
        variant: true,
        product_images: {
          select: {
            id: true,
            image_path: true,
          },
        },
        review: {
          select: {
            star: true,
            description: true,
            user: {
              select: {
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404
      );
    }

    const productJson = {
      ...product,
      category: product.category.category,
      star:
        product.review.length === 0
          ? 0
          : product.review.reduce((acc, item) => acc + item.star, 0) /
            product.review.length,
    };

    return c.json({
      success: true,
      data: productJson,
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
      500
    );
  }
};

export const createProduct = async (c: Context) => {
  try {
    const files = c.get("files");
    const images = files["images"];
    const imagePaths = [];

    if (!images) {
      return c.json({ success: false, message: "images required" }, 400);
    }

    const { name, description, category } = c.get(
      "validatedBody"
    ) as AddProductRequest;
    
    const existing = await prisma.products.findFirst({
      where: { name },
    });

    if (existing) {
      return c.json({
        success: false,
        message: "Product has regist",
      });
    }

    const categoryId = await prisma.categories.findUnique({
      where: { category },
      select: { id: true },
    });

    if (!categoryId) {
      return c.json({
        success: "false",
        message: "category not found",
      });
    }

    const folderName = slugify(name)
    await mkdir(`images/${folderName}`, {recursive: true});

    const fileList = Array.isArray(images) ? images : [images];
    for (const file of fileList) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const compressed = await tinify.fromBuffer(buffer).toBuffer();

      await Bun.write(`./images/${folderName}/${file.name}`, compressed);
      imagePaths.push(`images/${folderName}/${file.name}`);
    }

    await prisma.products.create({
      data: {
        name,
        description,
        sold: 0,

        category: {
          connect: {
            id: categoryId.id,
          },
        },

        product_images: {
          create: imagePaths.map((path) => ({
            image_path: path,
          })),
        },
      },
    });

    return c.json({
      success: true,
      message: "Success add product",
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
      500
    );
  }
};

export const deleteProduct = async (c: Context) => {
  try {
    const productId = c.req.param("id");

    const product = await prisma.products.findUnique({
      where: { id: Number(productId) },
      select: {
        id: true,
        name: true,
        product_images: true,
      },
    });

    if (!product) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404
      );
    }

    for (const img of product.product_images) {
      const filePath = `./${img.image_path}`;
      const file = Bun.file(filePath);
      
      if (await file.exists()) {
        await file.delete();
      }
    }
    await rm(`./images/${slugify(product.name)}`, {recursive: true, force: true})

    await prisma.$transaction([
      prisma.product_images.deleteMany({ where: { product_id: product.id } }),
      prisma.products.delete({ where: { id: product.id } }),
    ]);

    return c.json({
      success: true,
      message: "Success delete product",
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
      500
    );
  }
};

