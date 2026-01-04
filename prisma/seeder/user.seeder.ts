import { faker } from "@faker-js/faker";
import prisma from "../client";

export const userSeeder = async () => {
  for (let i = 1; i <= 10; i++) {
    const hashedPassword = await Bun.password.hash("070409");
    await prisma.users.create({
      data: {
        name: "Daniel Oktora",
        username: `vincent0${i}`,
        phone: `+62070409${i}`,
        password: hashedPassword,
        role: i === 1 ? "admin" : "user",

        address: {
          create: Array.from({ length: 2 }, (j) => ({
            recipient: faker.person.fullName(),
            subdistrict: faker.location.county(),
            city: faker.location.city(),
            address: faker.location.streetAddress(),
            zip_code: parseInt(faker.location.zipCode()),
            label: faker.helpers.arrayElement([
              "Home",
              "Office",
              "School",
              "Apartment",
            ]),
            main_address: j === 1 ? true : false,
            latitude: faker.location.latitude().toString(),
            longitude: faker.location.longitude().toString(),
          })),
        },
      },
    });
  }
};
