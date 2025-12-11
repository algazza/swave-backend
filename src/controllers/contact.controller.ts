import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddContactRequest, UpdateContactRequest } from "../types/contact";

export const getAllContact = async (c: Context) => {
  try {
    const contact = await prisma.contacts.findMany({
      omit: {
        description: true,
      },
    });

    return c.json({
      success: true,
      data: contact,
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

export const getOneContact = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const contact = await prisma.contacts.findUnique({
      where: { id: Number(id) },
    });

    if (!contact) {
      return c.json({
        success: false,
        message: "Contact not found",
      });
    }

    return c.json({
      success: true,
      data: contact,
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

export const createContact = async (c: Context) => {
  try {
    const { name, email, topic, description } = c.get(
      "validatedBody"
    ) as AddContactRequest;
    const contact = await prisma.contacts.create({
      data: {
        name,
        email,
        topic,
        description,
      },
    });

    return c.json({
      success: true,
      message: "Sucess add contact",
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

export const deleteContact = async (c: Context) => {
  try {
    const id = c.req.param("id");

    const existing = await prisma.contacts.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return c.json({
        success: false,
        message: "Contact not found",
      });
    }

    await prisma.contacts.delete({
        where: {id: Number(id)},
    })

    return c.json({
        success: true,
        message: 'Success delete contact'
    })
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
