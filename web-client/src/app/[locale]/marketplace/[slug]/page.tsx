"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DOMPurify from 'isomorphic-dompurify';
import Image from 'next/image';
import { useSession } from "next-auth/react";
import { useLanguage } from "@/hooks/useTranslation";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  ShoppingBag,
  Store,
  TrendingUp,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Users,
  User,
  Star,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
  ShoppingCart,
  Truck,
  Phone,
  MapPin,
  MessageSquare,
  Send,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";

const translations: Record<string, Record<string, any>> = {
  vi: {
    loading: "Đang tải sản phẩm...",
    notFound: "Không tìm thấy sản phẩm",
    notFoundDesc: "Sản phẩm này không tồn tại hoặc đã bị gỡ xuống.",
    backToMarketplace: "Quay lại Chợ",
    buyNow: "Mua ngay",
    buyOnPlatform: "Mua trên nền tảng",
    buyExternal: "Mua bên ngoài",
    storeLabel: "Cửa hàng",
    commissionLabel: (pct: number) => `Hoa hồng ${pct}% cho VĐV`,
    originalPrice: "Giá gốc",
    salePrice: "Giá khuyến mãi",
    description: "Mô tả sản phẩm",
    affiliateAthletes: "VĐV tiếp thị",
    noAthletes: "Chưa có VĐV nào tiếp thị sản phẩm này.",
    affiliateLink: "Link tiếp thị",
    views: "lượt xem",
    promoteProduct: "Quảng bá sản phẩm này",
    promoting: "Đang tạo link...",
    promoteSuccess: "Đã tạo link tiếp thị! Link đã được sao chép.",
    promoteError: "Không thể tạo link tiếp thị.",
    loginToPromote: "Đăng nhập với tài khoản VĐV để quảng bá sản phẩm này.",
    // Order
    orderTitle: "Đặt hàng",
    quantity: "Số lượng",
    shippingAddress: "Địa chỉ giao hàng",
    phoneNumber: "Số điện thoại",
    notes: "Ghi chú (tùy chọn)",
    orderBtn: "Đặt hàng",
    ordering: "Đang đặt hàng...",
    orderSuccess: "Đặt hàng thành công!",
    orderError: "Không thể đặt hàng. Vui lòng thử lại.",
    stock: "Còn hàng",
    outOfStock: "Hết hàng",
    // Reviews
    reviews: "Đánh giá",
    noReviews: "Chưa có đánh giá nào.",
    writeReview: "Viết đánh giá",
    yourRating: "Đánh giá của bạn",
    comment: "Bình luận",
    commentPlaceholder: "Chia sẻ trải nghiệm của bạn về sản phẩm này...",
    submitReview: "Gửi đánh giá",
    reviewSuccess: "Cảm ơn bạn đã đánh giá!",
    reviewError: "Không thể gửi đánh giá.",
    loginToReview: "Đăng nhập để đánh giá sản phẩm này.",
    ratingDist: "Phân bố đánh giá",
    // Related
    relatedProducts: "Sản phẩm liên quan",
    noRelated: "Chưa có sản phẩm liên quan.",
  },
  en: {
    loading: "Loading product...",
    notFound: "Product not found",
    notFoundDesc: "This product does not exist or has been taken down.",
    backToMarketplace: "Back to Marketplace",
    buyNow: "Buy Now",
    buyOnPlatform: "Buy on Platform",
    buyExternal: "Buy Externally",
    storeLabel: "Store",
    commissionLabel: (pct: number) => `${pct}% commission for Athletes`,
    originalPrice: "Original Price",
    salePrice: "Sale Price",
    description: "Product Description",
    affiliateAthletes: "Affiliate Athletes",
    noAthletes: "No athletes are promoting this product yet.",
    affiliateLink: "Affiliate Link",
    views: "views",
    promoteProduct: "Promote This Product",
    promoting: "Creating link...",
    promoteSuccess: "Affiliate link created and copied!",
    promoteError: "Failed to create affiliate link.",
    loginToPromote: "Log in with an athlete account to promote this product.",
    orderTitle: "Place Order",
    quantity: "Quantity",
    shippingAddress: "Shipping Address",
    phoneNumber: "Phone Number",
    notes: "Notes (optional)",
    orderBtn: "Place Order",
    ordering: "Placing order...",
    orderSuccess: "Order placed successfully!",
    orderError: "Failed to place order. Please try again.",
    stock: "In stock",
    outOfStock: "Out of stock",
    reviews: "Reviews",
    noReviews: "No reviews yet.",
    writeReview: "Write a Review",
    yourRating: "Your Rating",
    comment: "Comment",
    commentPlaceholder: "Share your experience with this product...",
    submitReview: "Submit Review",
    reviewSuccess: "Thank you for your review!",
    reviewError: "Failed to submit review.",
    loginToReview: "Log in to review this product.",
    ratingDist: "Rating Distribution",
    relatedProducts: "Related Products",
    noRelated: "No related products yet.",
  },
};

function formatVND(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function StarRating({ rating, size = 14, interactive = false, onChange }: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          className={interactive ? "cursor-pointer hover:scale-110 transition" : ""}
        >
          <Star
            size={size}
            className={i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { data: session } = useSession();
  const tStr = translations[language] || translations.vi;
  const slug = params?.slug as string;

  const {
    data: product,
    isLoading,
    error,
  } = useApi(slug ? `/products/${slug}` : null);

  // Image gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [promoting, setPromoting] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingData, setRatingData] = useState<any>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Order modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({ quantity: 1, shippingAddress: "", phoneNumber: "", notes: "" });
  const [ordering, setOrdering] = useState(false);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    if (product?.id) {
      fetchReviews();
      fetchRelated();
    }
  }, [product?.id]);

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const [listRes, ratingRes] = await Promise.all([
        apiClient.request(`/reviews/product/${product.id}?limit=10`),
        apiClient.request(`/reviews/product/${product.id}/rating`),
      ]);
      if (listRes.ok) {
        const data = await listRes.json();
        setReviews(data.data || []);
      }
      if (ratingRes.ok) {
        setRatingData(await ratingRes.json());
      }
    } catch { /* silently fail */ }
    finally { setReviewsLoading(false); }
  };

  const fetchRelated = async () => {
    setRelatedLoading(true);
    try {
      const res = await apiClient.request(`/products/${product.id}/related?limit=4`);
      if (res.ok) setRelatedProducts(await res.json());
    } catch { /* silently fail */ }
    finally { setRelatedLoading(false); }
  };

  const handlePromote = async () => {
    if (!session || !product) return;
    setPromoting(true);
    try {
      const res = await apiClient.request("/affiliate/links", {
        method: "POST",
        body: JSON.stringify({
          platform: "OTHER",
          originalUrl: `${window.location.origin}/marketplace/${product.slug}`,
          title: product.name,
          description: product.store?.name
            ? `${language === "vi" ? "Sản phẩm từ" : "Product from"} ${product.store.name}`
            : "",
          commissionRate: product.commissionRate ?? 5,
          thumbnailUrl: product.images?.[0] ?? product.thumbnailUrl ?? "",
          productId: product.id,
        }),
      });
      if (res.ok) {
        const link = await res.json();
        const trackingUrl = `${window.location.origin}/go/${link.shortCode}`;
        await navigator.clipboard.writeText(trackingUrl);
        toast.success(tStr.promoteSuccess);
      } else {
        toast.error(tStr.promoteError);
      }
    } catch {
      toast.error(tStr.promoteError);
    } finally {
      setPromoting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewForm.rating === 0) return;
    setSubmittingReview(true);
    try {
      const res = await apiClient.request(`/reviews/product/${product.id}`, {
        method: "POST",
        body: JSON.stringify(reviewForm),
      });
      if (res.ok) {
        toast.success(tStr.reviewSuccess);
        setReviewForm({ rating: 0, comment: "" });
        fetchReviews();
      } else {
        toast.error(tStr.reviewError);
      }
    } catch {
      toast.error(tStr.reviewError);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.shippingAddress || !orderForm.phoneNumber) return;
    setOrdering(true);
    try {
      const res = await apiClient.request("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: orderForm.quantity }],
          shippingAddress: orderForm.shippingAddress,
          phoneNumber: orderForm.phoneNumber,
          notes: orderForm.notes || undefined,
        }),
      });
      if (res.ok) {
        toast.success(tStr.orderSuccess);
        setShowOrderModal(false);
        setOrderForm({ quantity: 1, shippingAddress: "", phoneNumber: "", notes: "" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || tStr.orderError);
      }
    } catch {
      toast.error(tStr.orderError);
    } finally {
      setOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="animate-pulse space-y-6">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <EmptyState
          icon={<ShoppingBag size={40} />}
          title={tStr.notFound}
          description={tStr.notFoundDesc}
          action={
            <Link href="/marketplace">
              <Button variant="outline" className="gap-2">
                <ArrowLeft size={16} /> {tStr.backToMarketplace}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const images = product.images || (product.thumbnailUrl ? [product.thumbnailUrl] : []);
  const hasGallery = images.length > 1;
  const isInStock = product.stock > 0;
  const avgRating = ratingData?.avgRating ?? 0;
  const totalReviews = ratingData?.totalReviews ?? 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Button */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> {tStr.backToMarketplace}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Image Gallery */}
        <div className="space-y-3">
          <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
            {product.thumbnailUrl || images[0] ? (
              <Image
                src={images[activeImageIndex] || product.thumbnailUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={64} className="text-slate-300 dark:text-slate-600" />
              </div>
            )}

            {hasGallery && activeImageIndex > 0 && (
              <button
                onClick={() => setActiveImageIndex((i) => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 dark:bg-slate-900/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft size={18} className="text-slate-700 dark:text-slate-300" />
              </button>
            )}
            {hasGallery && activeImageIndex < images.length - 1 && (
              <button
                onClick={() => setActiveImageIndex((i) => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 dark:bg-slate-900/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <ChevronRight size={18} className="text-slate-700 dark:text-slate-300" />
              </button>
            )}

            {product.salePrice && product.salePrice < product.price && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow">
                {language === "vi" ? "Giảm giá" : "Sale"}
              </div>
            )}
          </div>

          {hasGallery && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 transition cursor-pointer relative ${
                    idx === activeImageIndex
                      ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${idx + 1}`} fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="space-y-6">
          {/* Name & Store */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              {product.name}
            </h1>
            {product.store && (
              <Link
                href={`/stores/${product.store.slug}`}
                className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold"
              >
                <Store size={16} />
                {product.store.name}
              </Link>
            )}
          </div>

          {/* Pricing & Actions */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Price */}
            {product.salePrice ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-red-600 dark:text-red-400">
                    {formatVND(product.salePrice, language)}
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    {formatVND(product.price, language)}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatVND(product.price, language)}
              </span>
            )}

            {/* Stock status */}
            <p className="text-xs font-semibold flex items-center gap-1">
              {isInStock ? (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {tStr.stock}: {product.stock}
                </span>
              ) : (
                <span className="text-red-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  {tStr.outOfStock}
                </span>
              )}
            </p>

            {/* Commission Badge */}
            {product.commissionRate != null && product.commissionRate > 0 && (
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                <TrendingUp size={16} />
                {tStr.commissionLabel(product.commissionRate)}
              </div>
            )}

            {/* Rating summary */}
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <StarRating rating={Math.round(avgRating)} />
                <span className="font-bold text-slate-700 dark:text-slate-300">{avgRating.toFixed(1)}</span>
                <span className="text-slate-400">({totalReviews})</span>
              </div>
            )}

            {/* Buy Buttons */}
            <div className="space-y-2 pt-1">
              {/* In-platform purchase */}
              {session ? (
                <Button
                  className="w-full gap-2 text-base py-5 font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20"
                  size="lg"
                  onClick={() => setShowOrderModal(true)}
                  disabled={!isInStock}
                >
                  <ShoppingCart size={18} />
                  {tStr.buyOnPlatform}
                </Button>
              ) : (
                <Link href="/login" className="block">
                  <Button className="w-full gap-2 text-base py-5 font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20" size="lg" disabled={!isInStock}>
                    <ShoppingCart size={18} />
                    {tStr.buyOnPlatform}
                  </Button>
                </Link>
              )}

              {/* External link */}
              {(product.affiliateUrl || product.store?.website || product.url) && (
                <a href={product.affiliateUrl || product.store?.website || product.url} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full gap-2 font-semibold" size="sm">
                    <ExternalLink size={14} />
                    {tStr.buyExternal}
                  </Button>
                </a>
              )}
            </div>

            {/* Promote Button (athletes only) */}
            {session?.user && product.commissionRate != null && product.commissionRate > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePromote}
                isLoading={promoting}
                className="gap-2 w-full"
              >
                <Share2 size={16} />
                {promoting ? tStr.promoting : tStr.promoteProduct}
              </Button>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                {tStr.description}
              </h2>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Star size={22} className="text-amber-500 fill-amber-500" />
          {tStr.reviews}
          {totalReviews > 0 && (
            <span className="text-sm font-normal text-slate-400">({totalReviews})</span>
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Rating summary + distribution */}
          <div className="space-y-4">
            {ratingData && totalReviews > 0 ? (
              <>
                <div className="text-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="text-4xl font-extrabold text-slate-900 dark:text-white">{avgRating.toFixed(1)}</div>
                  <StarRating rating={Math.round(avgRating)} size={16} />
                  <p className="text-xs text-slate-400 mt-1">{totalReviews} {language === "vi" ? "đánh giá" : "reviews"}</p>
                </div>

                <div className="space-y-1.5 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{tStr.ratingDist}</p>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingData.distribution?.[star] ?? 0;
                    const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-right font-bold text-slate-500">{star}</span>
                        <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right text-slate-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-sm text-slate-400">
                <p>{tStr.noReviews}</p>
              </div>
            )}

            {/* Write Review (auth required) */}
            {session ? (
              <form onSubmit={handleSubmitReview} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tStr.writeReview}</p>
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">{tStr.yourRating}</label>
                  <StarRating rating={reviewForm.rating} interactive onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} size={20} />
                </div>
                <Input
                  placeholder={tStr.commentPlaceholder}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                />
                <Button type="submit" size="sm" isLoading={submittingReview} disabled={reviewForm.rating === 0} className="gap-1.5">
                  <Send size={12} />
                  {tStr.submitReview}
                </Button>
              </form>
            ) : (
              <Link href="/login" className="block text-center text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {tStr.loginToReview}
              </Link>
            )}
          </div>

          {/* Right: Review list */}
          <div className="md:col-span-2 space-y-4">
            {reviewsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((r: any) => (
                <div key={r.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {r.user?.avatarUrl ? (
                        <Image src={r.user.avatarUrl} alt="" width={32} height={32} className="object-cover" />
                      ) : (
                        <User size={14} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.user?.fullName}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={r.rating} size={10} />
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 pl-11">{r.comment}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-sm text-slate-400">{tStr.noReviews}</p>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <ShoppingBag size={22} className="text-blue-500" />
          {tStr.relatedProducts}
        </h2>

        {relatedLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((rp: any) => {
              const rpImage = rp.images?.[0] || rp.thumbnailUrl;
              return (
                <Link
                  key={rp.id}
                  href={`/marketplace/${rp.slug}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {rpImage ? (
                      <Image src={rpImage} alt={rp.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={32} className="text-slate-300" />
                      </div>
                    )}
                    {rp.commissionRate > 0 && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {rp.commissionRate}%
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{rp.name}</p>
                    <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                      {formatVND(rp.salePrice ?? rp.price, language)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-8 text-sm text-slate-400">{tStr.noRelated}</p>
        )}
      </div>

      {/* Affiliate Athletes Section */}
      {product.affiliateAthletes && product.affiliateAthletes.length > 0 && (
        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Users size={22} className="text-blue-500" />
            {tStr.affiliateAthletes}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {product.affiliateAthletes.map((athlete: any) => (
              <div
                key={athlete.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                  {athlete.avatarUrl ? (
                    <Image src={athlete.avatarUrl} alt={athlete.fullName} fill sizes="32px" className="object-cover" />
                  ) : (
                    <User size={20} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {athlete.fullName}
                  </p>
                  {athlete.clickCount != null && (
                    <p className="text-xs text-slate-400">
                      {athlete.clickCount} {tStr.views}
                    </p>
                  )}
                </div>
                {athlete.affiliateUrl && (
                  <a
                    href={athlete.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                  >
                    {tStr.affiliateLink}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tStr.orderTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePlaceOrder} className="p-6 space-y-4">
            {/* Product summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                {images[0] ? (
                  <Image src={images[0]} alt={product.name} width={48} height={48} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={16} className="text-slate-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
                <p className="text-xs text-slate-400">
                  {formatVND(product.salePrice ?? product.price, language)} / {language === "vi" ? "sản phẩm" : "item"}
                </p>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.quantity}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderForm({ ...orderForm, quantity: Math.max(1, orderForm.quantity - 1) })}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  -
                </button>
                <Input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: Math.min(product.stock, Math.max(1, Number(e.target.value) || 1)) })}
                  className="w-20 text-center"
                />
                <button
                  type="button"
                  onClick={() => setOrderForm({ ...orderForm, quantity: Math.min(product.stock, orderForm.quantity + 1) })}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  +
                </button>
                <span className="text-xs text-slate-400 ml-2">
                  {formatVND((product.salePrice ?? product.price) * orderForm.quantity, language)}
                </span>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Phone size={12} /> {tStr.phoneNumber}
              </label>
              <Input
                placeholder="09xxxxxxxx"
                value={orderForm.phoneNumber}
                onChange={(e) => setOrderForm({ ...orderForm, phoneNumber: e.target.value })}
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} /> {tStr.shippingAddress}
              </label>
              <Input
                placeholder={language === "vi" ? "Số nhà, đường, quận, thành phố" : "Street, district, city"}
                value={orderForm.shippingAddress}
                onChange={(e) => setOrderForm({ ...orderForm, shippingAddress: e.target.value })}
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.notes}
              </label>
              <Input
                placeholder={language === "vi" ? "Ghi chú thêm..." : "Additional notes..."}
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => setShowOrderModal(false)}>
                {language === "vi" ? "Hủy" : "Cancel"}
              </Button>
              <Button type="submit" isLoading={ordering} className="gap-2">
                <Truck size={14} />
                {ordering ? tStr.ordering : tStr.orderBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
