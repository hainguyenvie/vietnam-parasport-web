"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/hooks/useTranslation";
import { useApi, usePaginatedApi } from "@/hooks/useApi";
import { useState } from "react";
import {
  Store,
  Globe,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

import Image from 'next/image';

const translations: Record<string, Record<string, any>> = {
  vi: {
    loading: "Đang tải cửa hàng...",
    notFound: "Không tìm thấy cửa hàng",
    notFoundDesc: "Cửa hàng này không tồn tại hoặc đã bị gỡ xuống.",
    backToMarketplace: "Quay lại Chợ",
    noProducts: "Chưa có sản phẩm nào",
    noProductsDesc: "Cửa hàng này hiện chưa có sản phẩm nào.",
    productsCount: (n: number) => `${n} sản phẩm`,
    website: "Website",
    visitWebsite: "Truy cập website",
    commissionNote: (pct: number) => `Hoa hồng ${pct}% cho VĐV`,
    storeProducts: "Sản phẩm của cửa hàng",
  },
  en: {
    loading: "Loading store...",
    notFound: "Store not found",
    notFoundDesc: "This store does not exist or has been removed.",
    backToMarketplace: "Back to Marketplace",
    noProducts: "No products yet",
    noProductsDesc: "This store has no products yet.",
    productsCount: (n: number) => `${n} products`,
    website: "Website",
    visitWebsite: "Visit website",
    commissionNote: (pct: number) => `${pct}% commission for Athletes`,
    storeProducts: "Store Products",
  },
};

function formatVND(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function StorePage() {
  const params = useParams();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;
  const slug = params?.slug as string;

  const { data: store, isLoading, error } = useApi(slug ? `/stores/${slug}` : null);

  const [page, setPage] = useState(1);
  const limit = 12;

  const storeId = store?.id;
  const { data: products, total, totalPages, isLoading: loadingProducts } = usePaginatedApi(
    storeId ? `/products` : null,
    page,
    limit,
    store?.id ? { storeId: store.id } : undefined
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <EmptyState
          icon={<Store size={40} />}
          title={tStr.notFound}
          description={tStr.notFoundDesc}
          action={
            <Link href="/marketplace" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
              <ArrowLeft size={16} /> {tStr.backToMarketplace}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> {tStr.backToMarketplace}
      </Link>

      {/* Store Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-10 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Banner Image */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 relative overflow-hidden">
          {store.bannerUrl ? (
            <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-15 bg-grid-white/[0.06]" />
          )}
        </div>

        {/* Store Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6 pt-16">
          <div className="flex items-end gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <Store size={32} className="text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-white">
              <h1 className="text-2xl md:text-3xl font-extrabold truncate drop-shadow-sm">
                {store.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                {store.partner?.name && (
                  <span className="text-sm text-white/80 flex items-center gap-1">
                    <MapPin size={13} />
                    {store.partner.name}
                  </span>
                )}
              </div>
            </div>
            {store.website && (
              <a
                href={store.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-bold rounded-xl transition border border-white/30 shrink-0"
              >
                <Globe size={14} />
                {tStr.visitWebsite}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Store Description */}
      {store.description && (
        <div className="mb-10">
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {store.description}
          </p>
        </div>
      )}

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag size={22} className="text-blue-500" />
            {tStr.storeProducts}
          </h2>
          {!loadingProducts && products.length > 0 && (
            <span className="text-sm text-slate-400 font-semibold">
              {tStr.productsCount(products.length)}
            </span>
          )}
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <Skeleton className="aspect-square rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/marketplace/${product.slug}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {product.thumbnailUrl || product.imageUrl || product.images?.[0] ? (
                      <img
                        src={product.thumbnailUrl || product.imageUrl || product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={40} className="text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    {product.salePrice && product.salePrice < product.price && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        {language === "vi" ? "Giảm giá" : "Sale"}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {product.name}
                    </h3>
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
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-0.5">
                          <TrendingUp size={10} />
                          {tStr.commissionNote(product.commissionRate)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

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
    </div>
  );
}
