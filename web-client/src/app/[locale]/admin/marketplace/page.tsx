"use client";

import { apiClient } from "@/lib/api-client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useLanguage } from "@/hooks/useTranslation";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import {
  Loader2,
  Edit2,
  Trash2,
  ShoppingBag,
  Store,
  Tags,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

// next/image available for migration — add unoptimized for dynamic URLs

const translations: Record<string, Record<string, any>> = {
  vi: {
    tabs: { products: "Sản phẩm", categories: "Danh mục", stores: "Cửa hàng" },
    searchProducts: "Tìm kiếm sản phẩm...",
    thImage: "Ảnh",
    thName: "Tên sản phẩm",
    thPrice: "Giá",
    thStore: "Cửa hàng",
    thCategory: "Danh mục",
    thActive: "Trạng thái",
    thActions: "Thao tác",
    thCommission: "Hoa hồng",
    active: "Hiển thị",
    inactive: "Ẩn",
    addProduct: "Thêm sản phẩm",
    editProduct: "Chỉnh sửa sản phẩm",
    addCategory: "Thêm danh mục",
    editCategory: "Chỉnh sửa danh mục",
    addStore: "Thêm cửa hàng",
    editStore: "Chỉnh sửa cửa hàng",
    productName: "Tên sản phẩm",
    productSlug: "Slug",
    productDesc: "Mô tả (HTML)",
    productPrice: "Giá gốc",
    productSalePrice: "Giá khuyến mãi",
    productStore: "Cửa hàng",
    productCategory: "Danh mục",
    productCommission: "Hoa hồng (%)",
    productImages: "URL ảnh (mỗi dòng một URL)",
    productThumbnail: "URL ảnh đại diện",
    productActive: "Hiển thị",
    productAffiliateUrl: "URL tiếp thị",
    categoryName: "Tên danh mục",
    categorySlug: "Slug",
    categoryDesc: "Mô tả",
    storeName: "Tên cửa hàng",
    storeSlug: "Slug",
    storeDesc: "Mô tả",
    storeWebsite: "Website",
    storeLogoUrl: "URL Logo",
    storeBannerUrl: "URL Banner",
    storePartner: "Đối tác",
    cancel: "Hủy",
    save: "Lưu",
    delete: "Xóa",
    deleteProductTitle: "Xóa sản phẩm",
    deleteProductMsg: "Bạn có chắc chắn muốn xóa sản phẩm này?",
    deleteCategoryTitle: "Xóa danh mục",
    deleteCategoryMsg: "Bạn có chắc chắn muốn xóa danh mục này?",
    deleteStoreTitle: "Xóa cửa hàng",
    deleteStoreMsg: "Bạn có chắc chắn muốn xóa cửa hàng này?",
    confirm: "Xác nhận",
    noData: "Không có dữ liệu",
    noProducts: "Chưa có sản phẩm nào",
    noCategories: "Chưa có danh mục nào",
    noStores: "Chưa có cửa hàng nào",
    loading: "Đang tải...",
    selectStore: "-- Chọn cửa hàng --",
    selectCategory: "-- Chọn danh mục --",
    selectPartner: "-- Chọn đối tác --",
    errors: {
      fetch: "Không thể tải dữ liệu.",
      create: "Không thể tạo mới.",
      update: "Không thể cập nhật.",
      delete: "Không thể xóa.",
      server: "Lỗi kết nối máy chủ.",
    },
    success: {
      create: "Tạo mới thành công!",
      update: "Cập nhật thành công!",
      delete: "Xóa thành công!",
    },
  },
  en: {
    tabs: { products: "Products", categories: "Categories", stores: "Stores" },
    searchProducts: "Search products...",
    thImage: "Image",
    thName: "Product Name",
    thPrice: "Price",
    thStore: "Store",
    thCategory: "Category",
    thActive: "Status",
    thActions: "Actions",
    thCommission: "Commission",
    active: "Active",
    inactive: "Inactive",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    addCategory: "Add Category",
    editCategory: "Edit Category",
    addStore: "Add Store",
    editStore: "Edit Store",
    productName: "Product Name",
    productSlug: "Slug",
    productDesc: "Description (HTML)",
    productPrice: "Original Price",
    productSalePrice: "Sale Price",
    productStore: "Store",
    productCategory: "Category",
    productCommission: "Commission (%)",
    productImages: "Image URLs (one per line)",
    productThumbnail: "Thumbnail URL",
    productActive: "Active",
    productAffiliateUrl: "Affiliate URL",
    categoryName: "Category Name",
    categorySlug: "Slug",
    categoryDesc: "Description",
    storeName: "Store Name",
    storeSlug: "Slug",
    storeDesc: "Description",
    storeWebsite: "Website",
    storeLogoUrl: "Logo URL",
    storeBannerUrl: "Banner URL",
    storePartner: "Partner",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    deleteProductTitle: "Delete Product",
    deleteProductMsg: "Are you sure you want to delete this product?",
    deleteCategoryTitle: "Delete Category",
    deleteCategoryMsg: "Are you sure you want to delete this category?",
    deleteStoreTitle: "Delete Store",
    deleteStoreMsg: "Are you sure you want to delete this store?",
    confirm: "Confirm",
    noData: "No data",
    noProducts: "No products yet",
    noCategories: "No categories yet",
    noStores: "No stores yet",
    loading: "Loading...",
    selectStore: "-- Select Store --",
    selectCategory: "-- Select Category --",
    selectPartner: "-- Select Partner --",
    errors: {
      fetch: "Failed to load data.",
      create: "Failed to create.",
      update: "Failed to update.",
      delete: "Failed to delete.",
      server: "Server connection error.",
    },
    success: {
      create: "Created successfully!",
      update: "Updated successfully!",
      delete: "Deleted successfully!",
    },
  },
};

function formatVND(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

// --- TYPES ---
interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  salePrice: string;
  storeId: string;
  categoryId: string;
  commissionRate: string;
  images: string;
  thumbnailUrl: string;
  isActive: boolean;
  affiliateUrl: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
}

interface StoreFormData {
  name: string;
  slug: string;
  description: string;
  website: string;
  logoUrl: string;
  bannerUrl: string;
  partnerId: string;
}

const emptyProduct: ProductFormData = {
  name: "", slug: "", description: "", price: "", salePrice: "",
  storeId: "", categoryId: "", commissionRate: "", images: "",
  thumbnailUrl: "", isActive: true, affiliateUrl: "",
};

const emptyCategory: CategoryFormData = { name: "", slug: "", description: "" };

const emptyStore: StoreFormData = {
  name: "", slug: "", description: "", website: "",
  logoUrl: "", bannerUrl: "", partnerId: "",
};

// --- Product Form Modal ---
function ProductFormModal({
  open,
  onOpenChange,
  initialData,
  stores,
  categories,
  onSave,
  saving,
  language,
  tStr,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData: ProductFormData | null;
  stores: any[];
  categories: any[];
  onSave: (data: ProductFormData) => Promise<void>;
  saving: boolean;
  language: string;
  tStr: any;
}) {
  const [form, setForm] = useState<ProductFormData>(emptyProduct);

  useEffect(() => {
    setForm(initialData || emptyProduct);
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData?.name ? tStr.editProduct : tStr.addProduct}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productName}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productSlug}</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productPrice}</label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productSalePrice}</label>
              <Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} min="0" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productStore}</label>
              <select className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} required>
                <option value="">{tStr.selectStore}</option>
                {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productCategory}</label>
              <select className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">{tStr.selectCategory}</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productCommission}</label>
              <Input type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} min="0" max="100" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productThumbnail}</label>
              <Input type="url" value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productAffiliateUrl}</label>
            <Input type="url" value={form.affiliateUrl} onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productImages}</label>
            <textarea className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.productDesc}</label>
            <textarea className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{tStr.productActive}</span>
          </label>

          <DialogFooter className="px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tStr.cancel}</Button>
            <Button type="submit" isLoading={saving}>{tStr.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Category Form Modal ---
function CategoryFormModal({
  open,
  onOpenChange,
  initialData,
  onSave,
  saving,
  tStr,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData: CategoryFormData | null;
  onSave: (data: CategoryFormData) => Promise<void>;
  saving: boolean;
  tStr: any;
}) {
  const [form, setForm] = useState<CategoryFormData>(emptyCategory);

  useEffect(() => {
    setForm(initialData || emptyCategory);
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData?.name ? tStr.editCategory : tStr.addCategory}</DialogTitle>
        </DialogHeader>
        <form onSubmit={async (e) => { e.preventDefault(); await onSave(form); }} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.categoryName}</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.categorySlug}</label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.categoryDesc}</label>
            <textarea className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter className="px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tStr.cancel}</Button>
            <Button type="submit" isLoading={saving}>{tStr.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Store Form Modal ---
function StoreFormModal({
  open,
  onOpenChange,
  initialData,
  partners,
  onSave,
  saving,
  tStr,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData: StoreFormData | null;
  partners: any[];
  onSave: (data: StoreFormData) => Promise<void>;
  saving: boolean;
  tStr: any;
}) {
  const [form, setForm] = useState<StoreFormData>(emptyStore);

  useEffect(() => {
    setForm(initialData || emptyStore);
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData?.name ? tStr.editStore : tStr.addStore}</DialogTitle>
        </DialogHeader>
        <form onSubmit={async (e) => { e.preventDefault(); await onSave(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.storeName}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.storeSlug}</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.storePartner}</label>
            <select className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} required>
              <option value="">{tStr.selectPartner}</option>
              {partners.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.storeWebsite}</label>
              <Input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.storeLogoUrl}</label>
              <Input type="url" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.storeBannerUrl}</label>
            <Input type="url" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{tStr.storeDesc}</label>
            <textarea className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter className="px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tStr.cancel}</Button>
            <Button type="submit" isLoading={saving}>{tStr.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Admin Marketplace Page ---
export default function AdminMarketplacePage() {
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const [activeTab, setActiveTab] = useState<"products" | "categories" | "stores">("products");

  // Data
  const { data: rawProducts = [], isLoading: loadingProducts, mutate: reloadProducts } = useApi("/products");
  const products: any[] = Array.isArray(rawProducts) ? rawProducts : rawProducts?.data || [];

  const { data: rawCategories = [], isLoading: loadingCategories, mutate: reloadCategories } = useApi("/products/categories");
  const categories: any[] = Array.isArray(rawCategories) ? rawCategories : rawCategories?.data || [];

  const { data: rawStores = [], isLoading: loadingStores, mutate: reloadStores } = useApi("/stores");
  const stores: any[] = Array.isArray(rawStores) ? rawStores : rawStores?.data || [];

  const { data: rawPartners = [], isLoading: loadingPartners } = useApi("/partners");
  const partners: any[] = Array.isArray(rawPartners) ? rawPartners : rawPartners?.data || [];

  const loadingAll = loadingProducts || loadingCategories || loadingStores || loadingPartners;

  // Product state
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // Category state
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  // Store state
  const [storeSearch, setStoreSearch] = useState("");
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreFormData | null>(null);
  const [savingStore, setSavingStore] = useState(false);
  const [deleteStore, setDeleteStore] = useState<any>(null);
  const [deletingStore, setDeletingStore] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") { setSortKey(undefined); setSortDirection(null); }
      else setSortDirection("asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // --- Product CRUD ---
  const handleSaveProduct = async (formData: ProductFormData) => {
    setSavingProduct(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price) || 0,
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        commissionRate: formData.commissionRate ? Number(formData.commissionRate) : undefined,
        images: formData.images
          ? formData.images.split("\n").map((u) => u.trim()).filter(Boolean)
          : [],
      };

      const method = editingProduct?.slug ? "PUT" : "POST";
      const path = editingProduct?.slug ? `/products/${editingProduct.slug}` : "/products";

      const res = await apiClient.request(path, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(tStr.success[editingProduct?.slug ? "update" : "create"]);
        setShowProductModal(false);
        setEditingProduct(null);
        reloadProducts();
      } else {
        toast.error(tStr.errors[editingProduct?.slug ? "update" : "create"]);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteProduct) return;
    setDeletingProduct(true);
    try {
      const res = await apiClient.request(`/products/${deleteProduct.slug || deleteProduct.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(tStr.success.delete);
        setDeleteProduct(null);
        reloadProducts();
      } else {
        toast.error(tStr.errors.delete);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setDeletingProduct(false);
    }
  };

  // --- Category CRUD ---
  const handleSaveCategory = async (formData: CategoryFormData) => {
    setSavingCategory(true);
    try {
      const method = editingCategory?.slug ? "PUT" : "POST";
      const path = editingCategory?.slug ? `/products/categories/${editingCategory.slug}` : "/products/categories";
      const res = await apiClient.request(path, { method, body: JSON.stringify(formData) });
      if (res.ok) {
        toast.success(tStr.success[editingCategory?.slug ? "update" : "create"]);
        setShowCategoryModal(false);
        setEditingCategory(null);
        reloadCategories();
      } else {
        toast.error(tStr.errors[editingCategory?.slug ? "update" : "create"]);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCategory) return;
    setDeletingCategory(true);
    try {
      const res = await apiClient.request(`/products/categories/${deleteCategory.slug || deleteCategory.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(tStr.success.delete);
        setDeleteCategory(null);
        reloadCategories();
      } else {
        toast.error(tStr.errors.delete);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setDeletingCategory(false);
    }
  };

  // --- Store CRUD ---
  const handleSaveStore = async (formData: StoreFormData) => {
    setSavingStore(true);
    try {
      const method = editingStore?.slug ? "PUT" : "POST";
      const path = editingStore?.slug ? `/stores/${editingStore.slug}` : "/stores";
      const res = await apiClient.request(path, { method, body: JSON.stringify(formData) });
      if (res.ok) {
        toast.success(tStr.success[editingStore?.slug ? "update" : "create"]);
        setShowStoreModal(false);
        setEditingStore(null);
        reloadStores();
      } else {
        toast.error(tStr.errors[editingStore?.slug ? "update" : "create"]);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setSavingStore(false);
    }
  };

  const handleConfirmDeleteStore = async () => {
    if (!deleteStore) return;
    setDeletingStore(true);
    try {
      const res = await apiClient.request(`/stores/${deleteStore.slug || deleteStore.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(tStr.success.delete);
        setDeleteStore(null);
        reloadStores();
      } else {
        toast.error(tStr.errors.delete);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setDeletingStore(false);
    }
  };

  // --- Filtered data ---
  const filteredProducts = products.filter((p: any) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (p.name || "").toLowerCase().includes(q);
  });

  const filteredCategories = categories.filter((c: any) => {
    if (!categorySearch) return true;
    const q = categorySearch.toLowerCase();
    return (c.name || "").toLowerCase().includes(q);
  });

  const filteredStores = stores.filter((s: any) => {
    if (!storeSearch) return true;
    const q = storeSearch.toLowerCase();
    return (s.name || "").toLowerCase().includes(q);
  });

  // --- Sorted data ---
  function sortData<T extends Record<string, any>>(data: T[], key: string | undefined, dir: "asc" | "desc" | null): T[] {
    if (!key || !dir) return data;
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal) : (aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
      return dir === "asc" ? cmp : -cmp;
    });
  }

  const sortedProducts = useMemo(() => sortData(filteredProducts, sortKey, sortDirection), [filteredProducts, sortKey, sortDirection]);
  const sortedCategories = useMemo(() => sortData(filteredCategories, sortKey, sortDirection), [filteredCategories, sortKey, sortDirection]);
  const sortedStores = useMemo(() => sortData(filteredStores, sortKey, sortDirection), [filteredStores, sortKey, sortDirection]);

  if (loadingAll) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-700 mb-6">
        {(["products", "categories", "stores"] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 cursor-pointer ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tStr.tabs[tab]}
          </button>
        ))}
      </div>

      {/* ============ PRODUCTS TAB ============ */}
      {activeTab === "products" && (
        <div>
          {sortedProducts.length === 0 && !productSearch ? (
            <EmptyState
              icon={<ShoppingBag size={32} />}
              title={tStr.noProducts}
            />
          ) : (
            <DataTable
              data={sortedProducts}
              searchPlaceholder={tStr.searchProducts}
              searchValue={productSearch}
              onSearchChange={setProductSearch}
              onCreate={() => { setEditingProduct(null); setShowProductModal(true); }}
              createLabel={tStr.addProduct}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              columns={[
                {
                  key: "image",
                  title: tStr.thImage,
                  sortable: true,
                  render: (p: any) => (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      {p.thumbnailUrl ? (
                        <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={16} className="text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "name",
                  title: tStr.thName,
                  sortable: true,
                  render: (p: any) => (
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.slug}</p>
                    </div>
                  ),
                },
                {
                  key: "price",
                  title: tStr.thPrice,
                  sortable: true,
                  render: (p: any) => (
                    <div className="text-sm">
                      {p.salePrice ? (
                        <>
                          <span className="font-bold text-red-600 dark:text-red-400">{formatVND(p.salePrice, language)}</span>
                          <span className="text-xs text-slate-400 line-through ml-1.5">{formatVND(p.price, language)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-slate-700 dark:text-slate-300">{formatVND(p.price, language)}</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: "store",
                  title: tStr.thStore,
                  sortable: true,
                  render: (p: any) => (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {p.store?.name || (language === "vi" ? "Không xác định" : "N/A")}
                    </span>
                  ),
                },
                {
                  key: "category",
                  title: tStr.thCategory,
                  sortable: true,
                  render: (p: any) => (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {p.category?.name || (language === "vi" ? "Không xác định" : "N/A")}
                    </span>
                  ),
                },
                {
                  key: "commission",
                  title: tStr.thCommission,
                  sortable: true,
                  render: (p: any) => (
                    p.commissionRate ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                        <TrendingUp size={12} /> {p.commissionRate}%
                      </span>
                    ) : <span className="text-xs text-slate-400">--</span>
                  ),
                },
                {
                  key: "status",
                  title: tStr.thActive,
                  sortable: true,
                  render: (p: any) => (
                    p.isActive !== false ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {tStr.active}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                        {tStr.inactive}
                      </span>
                    )
                  ),
                },
                {
                  key: "actions",
                  title: tStr.thActions,
                  render: (p: any) => (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct({
                            name: p.name || "",
                            slug: p.slug || "",
                            description: p.description || "",
                            price: String(p.price || ""),
                            salePrice: p.salePrice ? String(p.salePrice) : "",
                            storeId: p.storeId || p.store?.id || "",
                            categoryId: p.categoryId || p.category?.id || "",
                            commissionRate: p.commissionRate != null ? String(p.commissionRate) : "",
                            images: Array.isArray(p.images) ? p.images.join("\n") : "",
                            thumbnailUrl: p.thumbnailUrl || "",
                            isActive: p.isActive !== false,
                            affiliateUrl: p.affiliateUrl || "",
                          });
                          setShowProductModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ),
                },
              ]}
              totalRecords={sortedProducts.length}
              page={1}
              pageSize={sortedProducts.length}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
            />
          )}
        </div>
      )}

      {/* ============ CATEGORIES TAB ============ */}
      {activeTab === "categories" && (
        <div>
          {sortedCategories.length === 0 && !categorySearch ? (
            <EmptyState
              icon={<Tags size={32} />}
              title={tStr.noCategories}
            />
          ) : (
            <DataTable
              data={sortedCategories}
              searchPlaceholder={language === "vi" ? "Tìm kiếm danh mục..." : "Search categories..."}
              searchValue={categorySearch}
              onSearchChange={setCategorySearch}
              onCreate={() => { setEditingCategory(null); setShowCategoryModal(true); }}
              createLabel={tStr.addCategory}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              columns={[
                {
                  key: "name",
                  title: tStr.thName,
                  sortable: true,
                  render: (c: any) => (
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.slug}</p>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  title: tStr.thActions,
                  render: (c: any) => (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory({
                            name: c.name || "",
                            slug: c.slug || "",
                            description: c.description || "",
                          });
                          setShowCategoryModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteCategory(c)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ),
                },
              ]}
              totalRecords={sortedCategories.length}
              page={1}
              pageSize={sortedCategories.length}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
            />
          )}
        </div>
      )}

      {/* ============ STORES TAB ============ */}
      {activeTab === "stores" && (
        <div>
          {sortedStores.length === 0 && !storeSearch ? (
            <EmptyState
              icon={<Store size={32} />}
              title={tStr.noStores}
            />
          ) : (
            <DataTable
              data={sortedStores}
              searchPlaceholder={language === "vi" ? "Tìm kiếm cửa hàng..." : "Search stores..."}
              searchValue={storeSearch}
              onSearchChange={setStoreSearch}
              onCreate={() => { setEditingStore(null); setShowStoreModal(true); }}
              createLabel={tStr.addStore}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              columns={[
                {
                  key: "logo",
                  title: tStr.thImage,
                  sortable: true,
                  render: (s: any) => (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store size={16} className="text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "name",
                  title: tStr.thName,
                  sortable: true,
                  render: (s: any) => (
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.slug}</p>
                    </div>
                  ),
                },
                {
                  key: "partner",
                  title: tStr.storePartner,
                  sortable: true,
                  render: (s: any) => (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {s.partner?.name || (language === "vi" ? "Không có" : "None")}
                    </span>
                  ),
                },
                {
                  key: "website",
                  title: tStr.storeWebsite,
                  sortable: true,
                  render: (s: any) => (
                    s.website ? (
                      <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-[150px]">
                        {s.website}
                      </a>
                    ) : <span className="text-xs text-slate-400">--</span>
                  ),
                },
                {
                  key: "actions",
                  title: tStr.thActions,
                  render: (s: any) => (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingStore({
                            name: s.name || "",
                            slug: s.slug || "",
                            description: s.description || "",
                            website: s.website || "",
                            logoUrl: s.logoUrl || "",
                            bannerUrl: s.bannerUrl || "",
                            partnerId: s.partnerId || s.partner?.id || "",
                          });
                          setShowStoreModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteStore(s)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ),
                },
              ]}
              totalRecords={sortedStores.length}
              page={1}
              pageSize={sortedStores.length}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
            />
          )}
        </div>
      )}

      {/* ============ MODALS ============ */}

      {/* Product Form Modal */}
      <ProductFormModal
        open={showProductModal}
        onOpenChange={setShowProductModal}
        initialData={editingProduct}
        stores={stores}
        categories={categories}
        onSave={handleSaveProduct}
        saving={savingProduct}
        language={language}
        tStr={tStr}
      />

      {/* Category Form Modal */}
      <CategoryFormModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        initialData={editingCategory}
        onSave={handleSaveCategory}
        saving={savingCategory}
        tStr={tStr}
      />

      {/* Store Form Modal */}
      <StoreFormModal
        open={showStoreModal}
        onOpenChange={setShowStoreModal}
        initialData={editingStore}
        partners={partners}
        onSave={handleSaveStore}
        saving={savingStore}
        tStr={tStr}
      />

      {/* Delete Product Confirm */}
      <ConfirmModal
        isOpen={deleteProduct !== null}
        title={tStr.deleteProductTitle}
        message={tStr.deleteProductMsg}
        confirmText={tStr.delete}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setDeleteProduct(null)}
        type="danger"
      />

      {/* Delete Category Confirm */}
      <ConfirmModal
        isOpen={deleteCategory !== null}
        title={tStr.deleteCategoryTitle}
        message={tStr.deleteCategoryMsg}
        confirmText={tStr.delete}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setDeleteCategory(null)}
        type="danger"
      />

      {/* Delete Store Confirm */}
      <ConfirmModal
        isOpen={deleteStore !== null}
        title={tStr.deleteStoreTitle}
        message={tStr.deleteStoreMsg}
        confirmText={tStr.delete}
        onConfirm={handleConfirmDeleteStore}
        onCancel={() => setDeleteStore(null)}
        type="danger"
      />
    </div>
  );
}
