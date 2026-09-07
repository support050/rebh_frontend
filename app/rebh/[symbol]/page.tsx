import { redirect } from "next/navigation";

export default async function RebhLegacyCompanyRedirect({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  redirect(`/rebh/company/${symbol}`);
}