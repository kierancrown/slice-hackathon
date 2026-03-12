import { PresentationApp } from "@/components/presentation/presentation-app";

type HomeProps = {
  searchParams?: Promise<{
    slide?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;

  return <PresentationApp initialSlideTarget={resolvedSearchParams?.slide ?? null} />;
}
