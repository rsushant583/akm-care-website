/** Customer-facing copy helpers. Never surface raw database/API errors. */

export function customerSafeMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!raw) return fallback;
  if (/supabase|postgres|permission denied|rls|jwt|api key|postgrest|network request failed|failed to fetch/i.test(raw)) {
    return fallback;
  }
  if (raw.length > 140) return fallback;
  return raw;
}

/** Replace clearly outdated ecommerce FAQ copy without rewriting corporate FAQs. */
export function polishStorefrontFaq<T extends { question: string; answer: string }>(item: T): T {
  const q = item.question.toLowerCase();
  const a = item.answer.toLowerCase();

  if (q.includes("when will products be available")) {
    return {
      ...item,
      question: "Can I shop fashion products on AKM Care?",
      answer:
        "Yes. Browse sarees, lehengas, gowns, 3-piece suits and men's jeans on the Shop page. Each product shows live price and stock from the catalog.",
    };
  }

  if (q.includes("are your products organic") || (q.includes("authentic") && a.includes("rural indian villages"))) {
    return {
      ...item,
      question: "Are AKM Care products authentic?",
      answer:
        "Yes. Fashion products listed on AKM Care come from the live catalog with real pricing and stock. We do not invent reviews, ratings, or inventory counts.",
    };
  }

  if (a.includes("preparing our e-commerce platform") || a.includes("will be available soon")) {
    return {
      ...item,
      answer:
        "You can shop authentic fashion products now from the Shop page. Live pricing and availability are shown on each product.",
    };
  }

  return item;
}
