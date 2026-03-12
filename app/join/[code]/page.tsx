import { JoinPageClient } from "@/app/join/[code]/join-page-client";

type JoinPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const resolvedParams = await params;

  return <JoinPageClient code={resolvedParams.code} />;
}
