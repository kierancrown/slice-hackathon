import { RemotePageClient } from "@/app/remote/[code]/remote-page-client";

type RemotePageProps = {
  params: Promise<{
    code: string;
  }>;
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function RemotePage({
  params,
  searchParams,
}: RemotePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <RemotePageClient
      code={resolvedParams.code}
      token={resolvedSearchParams?.token ?? ""}
    />
  );
}
