import prisma from "../client";
import { cartSeeder } from "./cart.seeder";
import { categorySeeder } from "./category.seeder";
import { checkoutSeeder } from "./checkout.seeder";
import { productSeeder } from "./product.seeder";
import { reviewSeeder } from "./review.seeder";
import { userSeeder } from "./user.seeder";

const main = async () => {
  console.log("seeder starting...");
  await userSeeder();
  await categorySeeder();
  await productSeeder();
  await cartSeeder()
  await checkoutSeeder();
  await reviewSeeder();
  console.log("seeder finished.");
};

main()
    .catch((err) => {
      console.log(err);
      process.exit(1);
    }).finally(async () => {
      await prisma.$disconnect();
} )
