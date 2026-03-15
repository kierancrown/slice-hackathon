import { PresentationApp } from "@/components/presentation/presentation-app";

type HomeProps = {
  searchParams?: Promise<{
    deck?: string;
    slide?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <PresentationApp
      initialDeckTarget={resolvedSearchParams?.deck ?? null}
      initialSlideTarget={resolvedSearchParams?.slide ?? null}
    />
  );
}
