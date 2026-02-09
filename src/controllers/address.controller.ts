import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddAddressRequest, UpdateAddressRequest } from "../types/address";
import { distanceLocation, fowardLocation } from "../service/location";

export const getAllAddress = async (c: Context) => {
  try {
    const userId = c.get("userId");

    const address = await prisma.address.findMany({
      where: { user_id: userId },
      omit: { user_id: true },
    });

    return c.json({
      success: true,
      data: address,
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
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500
    );
  }
};

export const getDistance = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const addressId = c.req.param("id");
    const adminAddress = await prisma.address.findFirst({
      where: { user_id: 1 },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!adminAddress) {
      return c.json({
        success: false,
        message: "address admin not found",
      });
    }

    const userAddress = await prisma.address.findUnique({
      where: { user_id: userId, id: Number(addressId) },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!userAddress) {
      return c.json({
        success: false,
        message: "address not found",
      });
    }

    const res = await distanceLocation(
      adminAddress.longitude,
      adminAddress.latitude,
      userAddress.longitude,
      userAddress.latitude
    );

    const distanceRound = Math.round(res / 1000) * 1000;

    return c.json({
      success: true,
      data: {
        distance: distanceRound,
        price: distanceRound * 2,
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
      500
    );
  }
};

// FIXME: user only have 1 main address, check when update main_address to true
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
      description,
    } = c.get("validatedBody") as AddAddressRequest;

    const res = await fowardLocation(address, city, zip_code);

    const isMainAddress = await prisma.address.findFirst({
      where: { user_id: userId, main_address: true },
      select: { id: true },
    });

    if (main_address === true && isMainAddress) {
      await prisma.address.update({
        where: { id: isMainAddress.id },
        data: { main_address: false },
      });
    }

    await prisma.address.create({
      data: {
        recipient,
        label,
        city,
        subdistrict,
        zip_code: Number(zip_code),
        address,
        main_address,
        latitude: res.lat,
        longitude: res.lon,
        description,

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
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
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
      select: {
        id: true,
        city: true,
        zip_code: true,
        address: true,
      },
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
      description,
    } = c.get("validatedBody") as UpdateAddressRequest;

    const isMainAddress = await prisma.address.findFirst({
      where: { user_id: userId, main_address: true },
      select: { id: true },
    });

    if (main_address === true && isMainAddress) {
      await prisma.address.update({
        where: { id: isMainAddress.id },
        data: { main_address: false },
      });
    }

    if (
      address !== isAddress.address ||
      city !== isAddress.city ||
      Number(zip_code) !== isAddress.zip_code
    ) {
      const res = await fowardLocation(
        address || isAddress.address,
        city || isAddress.city,
        zip_code || String(isAddress.zip_code)
      );

      await prisma.address.update({
        where: { id: Number(addressId) },
        data: {
          latitude: res.lat,
          longitude: res.lon,
        },
      });
    }

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
        description,
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
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500
    );
  }
};

export const softDeleteAddress = async (c: Context) => {
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
    await prisma.address.update({
      where: { id: Number(addressId) },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    return c.json({
      success: true,
      message: "success soft delete address",
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
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500
    );
  }
};
