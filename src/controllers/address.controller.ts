import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddAddressRequest, UpdateAddressRequest } from "../types/address";

export const getAllAddress = async (c: Context) => {
  try {
    const userId = c.get("userId");

    const address = await prisma.address.findMany({
      where: { user_id: userId },
      omit: { user_id: true },
    });

    if (!address || address.length === 0) {
      return c.json(
        {
          success: false,
          message: "No address found with this user",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: address,
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

export const getOneAddress = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const addressId = c.req.param("id");

    const address = await prisma.address.findUnique({
      where: { id: Number(addressId), user_id: userId },
      omit: { user_id: true },
    });

    if (!address) {
      return c.json(
        {
          success: false,
          message: "No address found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: address,
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

export const createAddress = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const {
      recipient,
      label,
      city,
      subdistrict,
      zip_code,
      address,
      main_address,
    } = c.get("validatedBody") as AddAddressRequest;

    await prisma.address.create({
      data: {
        recipient,
        label,
        city,
        subdistrict,
        zip_code: Number(zip_code),
        address,
        main_address,

        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return c.json({
      success: true,
      message: "success add new address",
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

export const updateAddress = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const addressId = c.req.param("id");

    const isAddress = await prisma.address.findFirst({
      where: { id: Number(addressId), user_id: userId },
    });

    if (!isAddress) {
      return c.json(
        {
          success: false,
          message: "Address not found",
        },
        401
      );
    }

    const {
      recipient,
      label,
      city,
      subdistrict,
      zip_code,
      address,
      main_address,
    } = c.get("validatedBody") as UpdateAddressRequest;

    await prisma.address.update({
      where: { id: Number(addressId) },
      data: {
        recipient,
        label,
        city,
        subdistrict,
        zip_code: Number(zip_code),
        address,
        main_address,
      },
    });

    return c.json({
      success: true,
      message: "success edit address",
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

export const deleteAddress = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const addressId = c.req.param("id");

    const isAddress = await prisma.address.findFirst({
      where: { id: Number(addressId), user_id: userId },
    });

    if (!isAddress) {
      return c.json(
        {
          success: false,
          message: "Address not found",
        },
        401
      );
    }
    await prisma.address.delete({
      where: { id: Number(addressId) },
    });

    return c.json({
      success: true,
      message: "success delete address",
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
