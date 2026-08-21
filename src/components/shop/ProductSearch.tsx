import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Loader2, Search, Tag, X } from "lucide-react";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { matchOfficialCategories, searchSuggestions } from "@/lib/ecommerce/filters";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { shopCategoryPath, type OfficialShopCategory } from "@/data/catalog/categories";
import { searchProducts } from "@/services/searchService";
import { allCatalogProducts } from "@/data/catalog/products";
import { cn } from "@/lib/utils";
import { getProductImgProps } from "@/lib/images/productImage";

const RECENT_SEARCH_KEY = "akm_shop_recent_searches_v1";
const MAX_RECENT = 6;
const MIN_QUERY = 2;
const DEBOUNCE_MS = 280;
const EMPTY_PRODUCTS: CatalogProduct[] = [];

type SearchStatus = "idle" | "pending" | "searching" | "ready";

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

function productMatchesQuery(product: CatalogProduct, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return false;
  const hay = [product.name, product.sku, product.productCode, product.categoryLabel, product.brand ?? ""]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function ProductSearch({
  value,
  onChange,
  onSearchCommit,
  products = EMPTY_PRODUCTS,
  placeholder = "Search name, code, category…",
  className,
  navigateToShop = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearchCommit?: (term: string) => void;
  products?: CatalogProduct[];
  placeholder?: string;
  className?: string;
  navigateToShop?: boolean;
}) {
  const navigate = useNavigate();
  const listId = useId();
  const optionPrefix = useId();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [localValue, setLocalValue] = useState(value);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef(products);
  const requestSeq = useRef(0);
  productsRef.current = products;

  const inputValue = navigateToShop ? localValue : value;
  const trimmed = inputValue.trim();
  const categoryHits = matchOfficialCategories(trimmed, trimmed ? 4 : 6);
  const popularCategories = matchOfficialCategories("", 6);
  const busy = status === "pending" || status === "searching";

  const visibleSuggestions = useMemo(() => {
    if (trimmed.length < MIN_QUERY) return [];
    if (status === "ready") return suggestions;
    return suggestions.filter((p) => productMatchesQuery(p, trimmed));
  }, [suggestions, trimmed, status]);

  type Option =
    | { kind: "recent"; key: string; term: string }
    | { kind: "category"; key: string; cat: OfficialShopCategory }
    | { kind: "product"; key: string; product: CatalogProduct };

  const options = useMemo<Option[]>(() => {
    const list: Option[] = [];
    if (!trimmed) {
      for (const term of recent) list.push({ kind: "recent", key: `recent:${term}`, term });
      for (const cat of popularCategories) list.push({ kind: "category", key: `cat:${cat.id}`, cat });
      return list;
    }
    for (const cat of categoryHits) list.push({ kind: "category", key: `cat:${cat.id}`, cat });
    for (const product of visibleSuggestions) list.push({ kind: "product", key: `prod:${product.id}`, product });
    return list;
  }, [trimmed, recent, popularCategories, categoryHits, visibleSuggestions]);

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
      requestSeq.current += 1;
      setSuggestions([]);
      setStatus("idle");
      return;
    }

    setStatus("pending");
    const seq = ++requestSeq.current;
    const timer = window.setTimeout(async () => {
      if (seq !== requestSeq.current) return;
      setStatus("searching");
      try {
        const remote = await searchProducts(q, 6);
        if (seq !== requestSeq.current) return;
        if (remote.length > 0) {
          setSuggestions(remote);
        } else {
          const localSource = productsRef.current.length ? productsRef.current : allCatalogProducts;
          setSuggestions(searchSuggestions(localSource, q, 6));
        }
      } catch {
        if (seq !== requestSeq.current) return;
        const localSource = productsRef.current.length ? productsRef.current : allCatalogProducts;
        setSuggestions(searchSuggestions(localSource, q, 6));
      } finally {
        if (seq === requestSeq.current) setStatus("ready");
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [inputValue]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [trimmed, status, suggestions.length, categoryHits.length]);

  const commitSearch = (term: string) => {
    const t = term.trim();
    writeRecent(t);
    setRecent(readRecent());
    setOpen(false);
    setActiveIndex(-1);
    if (navigateToShop) {
      setLocalValue(t);
      if (t) navigate(`/shop?q=${encodeURIComponent(t)}`);
      else navigate("/shop");
      if (t) onSearchCommit?.(t);
      return;
    }
    onChange(term);
    if (t) onSearchCommit?.(t);
  };

  const activateOption = (option: Option) => {
    if (option.kind === "recent") {
      commitSearch(option.term);
      return;
    }
    if (option.kind === "category") {
      writeRecent(option.cat.label);
      setRecent(readRecent());
      setOpen(false);
      navigate(shopCategoryPath(option.cat.id));
      return;
    }
    writeRecent(inputValue || option.product.name);
    setRecent(readRecent());
    setOpen(false);
    navigate(productPath(option.product.slug));
  };

  const showEmpty =
    trimmed.length >= MIN_QUERY &&
    status === "ready" &&
    !busy &&
    visibleSuggestions.length === 0 &&
    categoryHits.length === 0;

  const showPanel =
    open &&
    (recent.length > 0 ||
      popularCategories.length > 0 ||
      categoryHits.length > 0 ||
      visibleSuggestions.length > 0 ||
      busy ||
      showEmpty);

  const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined;
  const activeDescendant = activeOption ? `${optionPrefix}-${activeOption.key}` : undefined;

  const moveActive = (delta: number) => {
    if (!options.length) return;
    setActiveIndex((prev) => {
      const next = prev < 0 ? (delta > 0 ? 0 : options.length - 1) : prev + delta;
      if (next < 0) return options.length - 1;
      if (next >= options.length) return 0;
      return next;
    });
  };

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
          aria-activedescendant={open ? activeDescendant : undefined}
          aria-busy={busy}
          value={inputValue}
          onChange={(e) => {
            if (navigateToShop) setLocalValue(e.target.value);
            else onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              moveActive(1);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              moveActive(-1);
              return;
            }
            if (e.key === "Enter") {
              if (open && activeOption) {
                e.preventDefault();
                activateOption(activeOption);
                return;
              }
              commitSearch(inputValue);
              return;
            }
            if (e.key === "Escape") {
              setOpen(false);
              setActiveIndex(-1);
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
              setActiveIndex(-1);
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
          aria-label="Search suggestions"
          className="absolute z-40 mt-2 w-full rounded-xl border border-black/[0.08] bg-white shadow-lg overflow-hidden"
        >
          {!trimmed && recent.length > 0 && (
            <div className="p-3 border-b border-black/[0.05]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2 flex items-center gap-1">
                <Clock size={12} aria-hidden /> Recent searches
              </p>
              <div className="flex flex-wrap gap-2">
                {recent.map((term) => {
                  const key = `recent:${term}`;
                  const selected = activeOption?.key === key;
                  return (
                    <button
                      key={term}
                      id={`${optionPrefix}-${key}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setActiveIndex(options.findIndex((o) => o.key === key))}
                      onClick={() => commitSearch(term)}
                      className={cn(
                        "px-2.5 py-1.5 min-h-9 text-xs bg-[#FAF8F5] border border-black/[0.06] hover:border-[#E8621A]/40",
                        selected && "border-[#E8621A]/50 bg-[#E8621A]/5",
                      )}
                    >
                      {term}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!trimmed && (
            <div className="p-3 border-b border-black/[0.05]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2 flex items-center gap-1">
                <Tag size={12} aria-hidden /> Popular categories
              </p>
              <div className="flex flex-wrap gap-2">
                {popularCategories.map((cat) => {
                  const key = `cat:${cat.id}`;
                  const selected = activeOption?.key === key;
                  return (
                    <Link
                      key={cat.id}
                      id={`${optionPrefix}-${key}`}
                      role="option"
                      aria-selected={selected}
                      to={shopCategoryPath(cat.id)}
                      onMouseEnter={() => setActiveIndex(options.findIndex((o) => o.key === key))}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "px-2.5 py-1.5 min-h-9 text-xs bg-[#FAF8F5] border border-black/[0.06] hover:border-[#E8621A]/40",
                        selected && "border-[#E8621A]/50 bg-[#E8621A]/5",
                      )}
                    >
                      {cat.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {trimmed && categoryHits.length > 0 && (
            <ul className="py-1 border-b border-black/[0.05]">
              {categoryHits.map((cat) => {
                const key = `cat:${cat.id}`;
                const selected = activeOption?.key === key;
                return (
                  <li key={cat.id}>
                    <Link
                      id={`${optionPrefix}-${key}`}
                      role="option"
                      aria-selected={selected}
                      to={shopCategoryPath(cat.id)}
                      onMouseEnter={() => setActiveIndex(options.findIndex((o) => o.key === key))}
                      onClick={() => {
                        writeRecent(cat.label);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 hover:bg-[#FAF8F5] text-sm",
                        selected && "bg-[#FAF8F5]",
                      )}
                    >
                      <Tag size={14} className="text-[#E8621A] shrink-0" aria-hidden />
                      <span className="font-medium">{cat.label}</span>
                      <span className="text-[11px] text-[#6B6B6B] ml-auto">Category</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {trimmed.length >= MIN_QUERY && busy && visibleSuggestions.length === 0 && (
            <div className="p-4 text-sm text-[#6B6B6B] inline-flex items-center gap-2" role="status">
              <Loader2 size={14} className="animate-spin" aria-hidden />
              Searching…
            </div>
          )}

          {showEmpty && (
            <div className="p-4 text-sm text-[#6B6B6B]" role="status">
              No results for “{trimmed}”. Try a product name, code, or category.
            </div>
          )}

          {visibleSuggestions.length > 0 && (
            <ul className="max-h-72 overflow-auto py-1" aria-busy={busy}>
              {visibleSuggestions.map((p) => {
                const key = `prod:${p.id}`;
                const selected = activeOption?.key === key;
                const thumb = getProductImgProps({
                  src: p.images[0]?.src || p.image_url,
                  role: "search",
                  decorative: true,
                });
                return (
                  <li key={p.id}>
                    <Link
                      id={`${optionPrefix}-${key}`}
                      role="option"
                      aria-selected={selected}
                      to={productPath(p.slug)}
                      onMouseEnter={() => setActiveIndex(options.findIndex((o) => o.key === key))}
                      onClick={() => {
                        writeRecent(inputValue || p.name);
                        setRecent(readRecent());
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 hover:bg-[#FAF8F5] transition-colors",
                        selected && "bg-[#FAF8F5]",
                      )}
                    >
                      <img
                        src={thumb.src}
                        srcSet={thumb.srcSet}
                        sizes={thumb.sizes}
                        alt=""
                        width={thumb.width}
                        height={thumb.height}
                        className="h-12 w-9 product-photo bg-[#F5F0EB]"
                        loading={thumb.loading}
                        decoding={thumb.decoding}
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
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
