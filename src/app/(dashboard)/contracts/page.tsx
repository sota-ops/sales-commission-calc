export const dynamic = "force-dynamic";

import { getContracts } from "@/actions/contracts";
import { getMembers } from "@/actions/members";
import { getCustomers } from "@/actions/customers";
import { getProducts } from "@/actions/products";
import { ContractsClient } from "./contracts-client";

export default async function ContractsPage() {
  const [contracts, members, customers, products] = await Promise.all([
    getContracts(),
    getMembers(),
    getCustomers(),
    getProducts(),
  ]);

  return (
    <ContractsClient
      contracts={contracts}
      members={members}
      customers={customers}
      products={products}
    />
  );
}
