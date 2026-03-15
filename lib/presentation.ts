import type { Deck, DeckId, QuizSlide, Slide, SlideRef } from "@/components/presentation/types";
import { slideDecks } from "@/data/slides";

export const decks = slideDecks.decks;
export const decksById = new Map(decks.map((deck) => [deck.id, deck] as const));
export const allSlides = decks.flatMap((deck) => deck.slides);
export const quizSlides = allSlides.filter((slide): slide is QuizSlide => slide.kind === "quiz");
export const quizSlidesById = new Map(quizSlides.map((slide) => [slide.id, slide] as const));

export function getDefaultDeck(): Deck {
  return decks[0];
}

export function getDeckById(deckId: string | null | undefined): Deck | null {
  if (!deckId) {
    return null;
  }

  return decksById.get(deckId as DeckId) ?? null;
}

export function getSlidesForDeck(deckId: string | null | undefined): Slide[] {
  return getDeckById(deckId)?.slides ?? getDefaultDeck().slides;
}

export function getDeckIdForSlide(slideId: string | null | undefined): DeckId | null {
  if (!slideId) {
    return null;
  }

  for (const deck of decks) {
    if (deck.slides.some((slide) => slide.id === slideId)) {
      return deck.id;
    }
  }

  return null;
}

export function getSlideRef(
  deckId: string | null | undefined,
  slideId: string | null | undefined,
): SlideRef | null {
  const deck = getDeckById(deckId) ?? (slideId ? getDeckById(getDeckIdForSlide(slideId)) : null);
  if (!deck || !slideId) {
    return null;
  }

  const slide = deck.slides.find((item) => item.id === slideId);
  return slide ? { deckId: deck.id, slideId: slide.id } : null;
}

export function getSlideById(
  slideId: string | null | undefined,
  deckId?: string | null,
): Slide | null {
  const ref = getSlideRef(deckId ?? null, slideId);
  if (!ref) {
    return null;
  }

  return getDeckById(ref.deckId)?.slides.find((slide) => slide.id === ref.slideId) ?? null;
}

export function getSlideIndexById(
  deckId: string | null | undefined,
  slideId: string | null | undefined,
): number {
  if (!slideId) {
    return -1;
  }

  return getSlidesForDeck(deckId).findIndex((slide) => slide.id === slideId);
}

export function resolveDeckAndSlide(
  deckTarget: string | null | undefined,
  slideTarget: string | null | undefined,
): { deck: Deck; index: number } {
  const selectedDeck = getDeckById(deckTarget) ?? getDefaultDeck();

  if (slideTarget) {
    const withinDeckIndex = selectedDeck.slides.findIndex((slide) => slide.id === slideTarget);
    if (withinDeckIndex >= 0) {
      return { deck: selectedDeck, index: withinDeckIndex };
    }

    const fallbackDeckId = getDeckIdForSlide(slideTarget);
    const fallbackDeck = getDeckById(fallbackDeckId);
    if (fallbackDeck) {
      const fallbackIndex = fallbackDeck.slides.findIndex((slide) => slide.id === slideTarget);
      if (fallbackIndex >= 0) {
        return { deck: fallbackDeck, index: fallbackIndex };
      }
    }
  }

  return { deck: selectedDeck, index: 0 };
}

export function isQuizSlide(slide: Slide | null | undefined): slide is QuizSlide {
  return Boolean(slide && slide.kind === "quiz");
}
