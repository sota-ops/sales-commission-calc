export const dynamic = "force-dynamic";

import { getProducts } from "@/actions/products";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsClient products={products} />;
}
