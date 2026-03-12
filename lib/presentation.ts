import type { QuizSlide, Slide } from "@/components/presentation/types";
import { slides } from "@/data/slides";

export function getSlideById(slideId: string | null | undefined): Slide | null {
  if (!slideId) {
    return null;
  }

  return slides.find((slide) => slide.id === slideId) ?? null;
}

export function getSlideIndexById(slideId: string | null | undefined): number {
  if (!slideId) {
    return -1;
  }

  return slides.findIndex((slide) => slide.id === slideId);
}

export function isQuizSlide(slide: Slide | null | undefined): slide is QuizSlide {
  return Boolean(slide && slide.kind === "quiz");
}
