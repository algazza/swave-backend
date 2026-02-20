import { Context } from "hono";
import { mkdir } from "node:fs/promises";
import { rm } from "node:fs/promises";
import tinify from "tinify";
import prisma from "../../prisma/client";
import { AddProductRequest, UpdateProductRequest } from "../types/product";
import { slugify, slugifyFilename } from "../utils";

tinify.key = process.env.TINIFY_API_KEY || "";

export const getAllProduct = async (c: Context) => {
  try {
    const products = await prisma.products.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        sold: true,
        slug: true,
        category: {
          select: {
            category: true,
          },
        },
        variant: {
          select: {
            price: true,
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
      return c.json(
        {
          success: false,
          message: "product not added",
        },
        404,
      );
    }

    const productJson = products.map((p) => ({
      id: p.id,
      name: p.name,
      sold: p.sold,
      slug: p.slug,
      category: p.category.category,
      product_images: p.product_images.map((img) => img.image_path)[0],
      price: p.variant.map((v) => v.price)[0],
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
      500,
    );
  }
};

export const getRecomendedProducts = async (c: Context) => {
  try {
    const productSlug = c.req.param("slug");

    const products = await prisma.products.findMany({
      where: {
        NOT: {
          slug: String(productSlug),
        },
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        sold: true,
        slug: true,
        category: {
          select: {
            category: true,
          },
        },
        variant: {
          select: {
            price: true,
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

    if (!products || products.length === 0) {
      return c.json(
        {
          success: false,
          message: "No products available",
        },
        404,
      );
    }

    const shuffled = products.sort(() => Math.random() - 0.5);
    const recommended = shuffled.slice(0, Math.min(4, shuffled.length));

    const productJson = recommended.map((p) => ({
      id: p.id,
      name: p.name,
      sold: p.sold,
      slug: p.slug,
      category: p.category.category,
      product_images: p.product_images.map((img) => img.image_path)[0],
      price: p.variant.map((v) => v.price)[0],
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
      500,
    );
  }
};

export const getOneProduct = async (c: Context) => {
  try {
    const slug = c.req.param("slug");
    const product = await prisma.products.findUnique({
      where: { slug: String(slug), is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sold: true,
        is_active: true,
        category: true,
        variant: {
          omit: {
            product_id: true,
          },
        },
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
        404,
      );
    }

    const productJson = {
      ...product,
      product_images: product.product_images,
      category: product.category.category,
      review: product.review.map((rev) => ({
        star: rev.star,
        description: rev.description,
        name: rev.user.name,
      })),
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
      500,
    );
  }
};

export const getAllDeletedProduct = async (c: Context) => {
  try {
    const products = await prisma.products.findMany({
      where: { is_active: false },
      select: {
        id: true,
        name: true,
        sold: true,
        slug: true,
        category: {
          select: {
            category: true,
          },
        },
        variant: {
          select: {
            price: true,
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
      return c.json(
        {
          success: false,
          message: "product not added",
        },
        404,
      );
    }

    const productJson = products.map((p) => ({
      id: p.id,
      name: p.name,
      sold: p.sold,
      slug: p.slug,
      category: p.category.category,
      product_images: p.product_images.map((img) => img.image_path)[0],
      price: p.variant.map((v) => v.price)[0],
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
      500,
    );
  }
};

export const createProduct = async (c: Context) => {
  try {
    const files = c.get("files");
    const images = files["images"];
    const imagePaths: any[] = [];

    if (!images) {
      return c.json({ success: false, message: "images required" }, 400);
    }

    const { name, description, category } = c.get(
      "validatedBody",
    ) as AddProductRequest;

    const existing = await prisma.products.findFirst({
      where: { name },
    });

    if (existing) {
      return c.json(
        {
          success: false,
          message: "Product has registered",
        },
        409,
      );
    }

    const categoryId = await prisma.categories.findUnique({
      where: { category },
      select: { id: true },
    });

    if (!categoryId) {
      return c.json(
        {
          success: false,
          message: "category not found",
        },
        404,
      );
    }

    const folderName = slugify(name);
    await mkdir(`images/${folderName}`, { recursive: true });

    const fileList = Array.isArray(images) ? images : [images];
    // TODO: change refactor image from tinyjpg to sharp
    await Promise.all(
      fileList.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const compressed = await tinify.fromBuffer(buffer).toBuffer();
        const fileName = slugifyFilename(file.name);

        await Bun.write(`./images/${folderName}/${fileName}`, compressed);
        imagePaths.push(`images/${folderName}/${fileName}`);
      }),
    );

    const slugName = slugify(name);
    const product = await prisma.products.create({
      data: {
        name,
        description,
        slug: slugName,
        sold: 0,
        is_active: false,

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
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        product_images: imagePaths[0],
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

export const updateProduct = async (c: Context) => {
  try {
    const productId = c.req.param("id");

    const isProduct = await prisma.products.findUnique({
      where: { id: Number(productId) },
    });

    if (!isProduct) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404,
      );
    }

    const { name, description, category } = c.get(
      "validatedBody",
    ) as UpdateProductRequest;

    if (name) {
      const existing = await prisma.products.findFirst({
        where: { name },
      });

      if (existing) {
        return c.json(
          {
            success: false,
            message: "Product has registered",
          },
          409,
        );
      }

      await prisma.products.update({
        where: { id: Number(productId) },
        data: {
          slug: slugify(name),
        },
      });
    }

    if (category) {
      const categoryId = await prisma.categories.findUnique({
        where: { category },
        select: { id: true },
      });

      if (!categoryId) {
        return c.json(
          {
            success: false,
            message: "category not found",
          },
          404,
        );
      }

      await prisma.products.update({
        where: { id: Number(productId) },
        data: {
          name,
          description,
          category: {
            connect: {
              id: categoryId.id,
            },
          },
        },
      });
    }

    await prisma.products.update({
      where: { id: Number(productId) },
      data: {
        name,
        description,
      },
    });

    return c.json({
      success: true,
      data: {
        id: isProduct.id,
        slug: slugify(name || isProduct.name),
        name: name || isProduct.name,
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
        404,
      );
    }

    for (const img of product.product_images) {
      const filePath = `./${img.image_path}`;
      const file = Bun.file(filePath);

      if (await file.exists()) {
        await file.delete();
      }
    }
    await rm(`./images/${slugify(product.name)}`, {
      recursive: true,
      force: true,
    });

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
      500,
    );
  }
};

export const softDeleteProduct = async (c: Context) => {
  try {
    const productId = c.req.param("id");

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

    await prisma.products.update({
      where: { id: Number(productId) },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

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
      500,
    );
  }
};

export const addProductImage = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const files = c.get("files");
    const images = files["images"];
    const imagePaths = [];

    if (!images) {
      return c.json({ success: false, message: "images required" }, 400);
    }

    const product = await prisma.products.findUnique({
      where: { id: Number(id) },
      select: { name: true },
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
    const existingCount = await prisma.product_images.count({
      where: { product_id: Number(id) },
    });
    const fileList = Array.isArray(images) ? images : [images];

    if (existingCount + fileList.length > 10) {
      return c.json(
        { success: false, message: "Max 10 images per product" },
        400,
      );
    }

    const folderName = slugify(product.name);
    if (!(await Bun.file(`./images/${folderName}`).exists())) {
      await mkdir(`images/${folderName}`, { recursive: true });
    }

    for (const file of fileList) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const compressed = await tinify.fromBuffer(buffer).toBuffer();
      const fileName = slugifyFilename(file.name);

      await Bun.write(`./images/${folderName}/${fileName}`, compressed);
      imagePaths.push(`images/${folderName}/${fileName}`);
    }

    await prisma.product_images.createMany({
      data: imagePaths.map((path) => ({
        product_id: Number(id),
        image_path: path,
      })),
    });

    return c.json({
      success: true,
      message: "Success add product image",
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

export const updateProductImage = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const imagesId = c.req.param("imageId");
    const files = c.get("files");
    const image = files?.image;

    if (!image) {
      return c.json({ success: false, message: "image required" }, 400);
    }

    const oldImage = await prisma.product_images.findUnique({
      where: { id: Number(imagesId) },
      select: {
        image_path: true,
        product_id: true,
      },
    });

    if (!oldImage) {
      return c.json(
        {
          success: false,
          message: "Image not found",
        },
        404,
      );
    }

    if (oldImage.product_id !== Number(id)) {
      return c.json(
        {
          success: false,
          message: "Image does not belong to this product",
        },
        400,
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const composed = await tinify.fromBuffer(buffer).toBuffer();
    await Bun.write(`./${oldImage.image_path}`, composed);

    return c.json({
      success: true,
      message: "Success update product image",
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

export const deleteProductImage = async (c: Context) => {
  try {
    const productId = c.req.param("id");
    const imageId = c.req.param("imageId");

    const productImage = await prisma.product_images.findUnique({
      where: { id: Number(imageId) },
      select: {
        image_path: true,
        product_id: true,
      },
    });

    if (!productImage) {
      return c.json(
        {
          success: false,
          message: "Image not found",
        },
        404,
      );
    }

    if (productImage.product_id !== Number(productId)) {
      return c.json(
        {
          success: false,
          message: "Image does not belong to this product",
        },
        400,
      );
    }

    const filePath = `./${productImage.image_path}`;
    const file = Bun.file(filePath);

    if (await file.exists()) {
      await file.delete();
    }

    await prisma.product_images.delete({
      where: { id: Number(imageId) },
    });

    return c.json({
      success: true,
      message: "Success delete product image",
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
