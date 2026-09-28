"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/hooks/useTranslation";
import { usePaginatedApi, useApi } from "@/hooks/useApi";
import { useSession } from "next-auth/react";
import {
  Search,
  ShoppingBag,
  Store,
  Tag,
  Loader2,
  TrendingUp,
  Filter,
  X,
  Star,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

import Image from 'next/image';

const translations: Record<string, Record<string, any>> = {
  vi: {
    pageTitle: "Chợ thể thao",
    pageDesc: "Sản phẩm & dịch vụ hỗ trợ bởi các Vận động viên Paralympic Việt Nam",
    searchPlaceholder: "Tìm kiếm sản phẩm...",
    allCategories: "Tất cả danh mục",
    loading: "Đang tải sản phẩm...",
    noProducts: "Chưa có sản phẩm nào",
    noProductsDesc: "Hiện chưa có sản phẩm nào trong chợ. Hãy quay lại sau nhé!",
    priceFormat: (v: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v),
    commission: (pct: number) => `Hoa hồng ${pct}% cho VĐV`,
  },
  en: {
    pageTitle: "Sports Marketplace",
    pageDesc: "Products & services supported by Vietnam Paralympic Athletes",
    searchPlaceholder: "Search products...",
    allCategories: "All Categories",
    loading: "Loading products...",
    noProducts: "No products yet",
    noProductsDesc: "There are currently no products in the marketplace. Please check back later!",
    priceFormat: (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "VND" }).format(v),
    commission: (pct: number) => `${pct}% commission for Athletes`,
  },
};

function SkeletonCard() {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <Skeleton className="w-full aspect-[16/10] rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function formatVND(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function MarketplacePage() {
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minCommission, setMinCommission] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query params for products
  const extraParams: Record<string, string> = {};
  if (debouncedSearch) extraParams.search = debouncedSearch;
  if (selectedCategory && selectedCategory !== "all") extraParams.categoryId = selectedCategory;
  if (minCommission) extraParams.minCommissionRate = minCommission;

  const {
    data: products,
    total,
    totalPages,
    isLoading: loadingProducts,
  } = usePaginatedApi("/products", page, limit, extraParams);

  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories } = useApi("/products/categories");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
          {tStr.pageTitle}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
          {tStr.pageDesc}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <Input
            placeholder={tStr.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setDebouncedSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <Select
          value={selectedCategory}
          onValueChange={(v: string) => { setSelectedCategory(v); setPage(1); }}
        >
          <SelectTrigger className="w-full sm:w-[220px]" aria-label={tStr.allCategories}>
            <SelectValue placeholder={tStr.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tStr.allCategories}</SelectItem>
            {(Array.isArray(categories) ? categories : []).map((cat: any) => (
              <SelectItem key={cat.id || cat.slug || cat} value={cat.id || cat.slug || cat}>
                {cat.name || cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={minCommission}
          onValueChange={(v: string) => { setMinCommission(v); setPage(1); }}
        >
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Commission rate">
            <SelectValue placeholder={language === "vi" ? "Hoa hồng tối thiểu" : "Min Commission"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{language === "vi" ? "Tất cả" : "All"}</SelectItem>
            <SelectItem value="5">5%+</SelectItem>
            <SelectItem value="10">10%+</SelectItem>
            <SelectItem value="15">15%+</SelectItem>
            <SelectItem value="20">20%+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {loadingProducts || loadingCategories ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={32} />}
          title={tStr.noProducts}
          description={tStr.noProductsDesc}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product: any) => (
              <Link
                key={product.id}
                href={`/marketplace/${product.slug}`}
                className="block"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) {
                    e.preventDefault();
                  }
                }}
              >
              <Card className="group bg-card hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col overflow-hidden border-border">
                {/* Product Image */}
                <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                  {product.thumbnailUrl || product.imageUrl || product.images?.[0] ? (
                    <img
                      src={product.thumbnailUrl || product.imageUrl || product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={48} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                  {/* Sale Badge */}
                  {product.salePrice && product.salePrice < product.price && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow">
                      {language === "vi" ? "Giảm giá" : "Sale"}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                    <Store size={13} />
                    {product.store?.name || product.storeName || (language === "vi" ? "Không xác định" : "Unknown")}
                  </p>

                  {/* Rating + Review count */}
                  {(product._count?.reviews > 0) && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{product._count.reviews}</span>
                    </div>
                  )}

                  {/* Price & Commission */}
                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      {product.salePrice ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                            {formatVND(product.salePrice, language)}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            {formatVND(product.price, language)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                          {formatVND(product.price, language)}
                        </span>
                      )}
                    </div>
                    {product.commissionRate != null && product.commissionRate > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                        <TrendingUp size={12} />
                        {tStr.commission(product.commissionRate)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
