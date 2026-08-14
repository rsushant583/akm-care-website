import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Search, Tag, X } from "lucide-react";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { matchOfficialCategories, searchSuggestions } from "@/lib/ecommerce/filters";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { shopCategoryPath } from "@/data/catalog/categories";
import { searchProducts } from "@/services/searchService";
import { allCatalogProducts } from "@/data/catalog/products";
import { cn } from "@/lib/utils";

const RECENT_SEARCH_KEY = "akm_shop_recent_searches_v1";
const MAX_RECENT = 6;
const MIN_QUERY = 2;
const EMPTY_PRODUCTS: CatalogProduct[] = [];

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecent(term: string) {
  const t = term.trim();
  if (!t) return;
  const next = [t, ...readRecent().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function ProductSearch({
  value,
  onChange,
  products = EMPTY_PRODUCTS,
  placeholder = "Search name, code, category…",
  className,
  navigateToShop = false,
}: {
  value: string;
  onChange: (value: string) => void;
  products?: CatalogProduct[];
  placeholder?: string;
  className?: string;
  navigateToShop?: boolean;
}) {
  const navigate = useNavigate();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef(products);
  productsRef.current = products;

  const inputValue = navigateToShop ? localValue : value;
  const trimmed = inputValue.trim();
  const categoryHits = matchOfficialCategories(trimmed, trimmed ? 4 : 6);
  const popularCategories = matchOfficialCategories("", 6);

  useEffect(() => {
    if (!navigateToShop) setLocalValue(value);
  }, [navigateToShop, value]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const q = inputValue.trim();
    if (q.length < MIN_QUERY) {
      setSuggestions((prev) => (prev.length === 0 ? prev : []));
      setSearching((prev) => (prev ? false : prev));
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const remote = await searchProducts(q, 6);
        if (cancelled) return;
        if (remote.length > 0) {
          setSuggestions(remote);
        } else {
          const localSource = productsRef.current.length ? productsRef.current : allCatalogProducts;
          setSuggestions(searchSuggestions(localSource, q, 6));
        }
      } catch {
        if (!cancelled) {
          const localSource = productsRef.current.length ? productsRef.current : allCatalogProducts;
          setSuggestions(searchSuggestions(localSource, q, 6));
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputValue]);

  const commitSearch = (term: string) => {
    const t = term.trim();
    writeRecent(t);
    setRecent(readRecent());
    setOpen(false);
    if (navigateToShop) {
      setLocalValue(t);
      if (t) navigate(`/shop?q=${encodeURIComponent(t)}`);
      else navigate("/shop");
      return;
    }
    onChange(term);
  };

  const showPanel =
    open &&
    (recent.length > 0 ||
      popularCategories.length > 0 ||
      categoryHits.length > 0 ||
      suggestions.length > 0 ||
      searching ||
      (trimmed.length >= MIN_QUERY && !searching && suggestions.length === 0 && categoryHits.length === 0));

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <label className="relative block w-full">
        <span className="sr-only">Search products</span>
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" aria-hidden />
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={inputValue}
          onChange={(e) => {
            if (navigateToShop) setLocalValue(e.target.value);
            else onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitSearch(inputValue);
            if (e.key === "Escape") {
              setOpen(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-black/[0.08] bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/30"
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              if (navigateToShop) setLocalValue("");
              else onChange("");
              setOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-[#6B6B6B] hover:text-[#1A1A1A]"
          >
            <X size={16} />
          </button>
        )}
      </label>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-40 mt-2 w-full rounded-xl border border-black/[0.08] bg-white shadow-lg overflow-hidden"
        >
          {!trimmed && recent.length > 0 && (
            <div className="p-3 border-b border-black/[0.05]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2 flex items-center gap-1">
                <Clock size={12} aria-hidden /> Recent searches
              </p>
              <div className="flex flex-wrap gap-2">
                {recent.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => commitSearch(term)}
                    className="px-2.5 py-1.5 min-h-9 text-xs bg-[#FAF8F5] border border-black/[0.06] hover:border-[#E8621A]/40"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!trimmed && (
            <div className="p-3 border-b border-black/[0.05]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2 flex items-center gap-1">
                <Tag size={12} aria-hidden /> Popular categories
              </p>
              <div className="flex flex-wrap gap-2">
                {popularCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={shopCategoryPath(cat.id)}
                    onClick={() => setOpen(false)}
                    className="px-2.5 py-1.5 min-h-9 text-xs bg-[#FAF8F5] border border-black/[0.06] hover:border-[#E8621A]/40"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {trimmed && categoryHits.length > 0 && (
            <ul className="py-1 border-b border-black/[0.05]">
              {categoryHits.map((cat) => (
                <li key={cat.id} role="option">
                  <Link
                    to={shopCategoryPath(cat.id)}
                    onClick={() => {
                      writeRecent(cat.label);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#FAF8F5] text-sm"
                  >
                    <Tag size={14} className="text-[#E8621A] shrink-0" aria-hidden />
                    <span className="font-medium">{cat.label}</span>
                    <span className="text-[11px] text-[#6B6B6B] ml-auto">Category</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {trimmed.length >= MIN_QUERY && searching && (
            <div className="p-4 text-sm text-[#6B6B6B]">Searching…</div>
          )}

          {trimmed.length >= MIN_QUERY && !searching && suggestions.length === 0 && categoryHits.length === 0 && (
            <div className="p-4 text-sm text-[#6B6B6B]">
              No results for “{inputValue}”. Try a product name, code, or category.
            </div>
          )}

          {suggestions.length > 0 && (
            <ul className="max-h-72 overflow-auto py-1">
              {suggestions.map((p) => (
                <li key={p.id} role="option">
                  <Link
                    to={productPath(p.slug)}
                    onClick={() => {
                      writeRecent(inputValue || p.name);
                      setRecent(readRecent());
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#FAF8F5] transition-colors"
                  >
                    <img
                      src={p.images[0]?.src || p.image_url || "/placeholder.svg"}
                      alt=""
                      className="h-12 w-9 object-cover bg-[#F5F0EB]"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1A1A1A] line-clamp-1">{p.name}</p>
                      <p className="text-[11px] text-[#6B6B6B]">
                        {p.productCode} · {p.categoryLabel}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#E8621A]">{formatINR(getEffectivePrice(p))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
