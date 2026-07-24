import { toast } from "@/components/ui/sonner";
import { productPath } from "@/lib/ecommerce/slug";

export async function shareProduct(input: {
  name: string;
  slug: string;
  text?: string;
}): Promise<void> {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}${productPath(input.slug)}`
      : `https://akmcare.in${productPath(input.slug)}`;

  const payload = {
    title: input.name,
    text: input.text || `Check out ${input.name} on AKM Care`,
    url,
  };

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(payload);
      return;
    }
  } catch {
    /* user cancelled or share failed — fall through to clipboard */
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Product link copied");
  } catch {
    toast.message("Share link", { description: url });
  }
}
