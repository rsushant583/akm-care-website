import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout, { AdminGuard } from "@/components/admin/AdminLayout";
import AdminLoginPage from "@/pages/admin/AdminLogin";
import AdminDashboardPage from "@/pages/admin/AdminDashboard";
import AdminProductsPage from "@/pages/admin/AdminProducts";
import AdminProductFormPage from "@/pages/admin/AdminProductForm";
import AdminCategoriesPage from "@/pages/admin/AdminCategories";
import AdminBrandsPage from "@/pages/admin/AdminBrands";
import AdminInventoryPage from "@/pages/admin/AdminInventory";
import AdminOrdersPage from "@/pages/admin/AdminOrders";
import AdminCustomersPage from "@/pages/admin/AdminCustomers";
import AdminBannersPage from "@/pages/admin/AdminBanners";
import AdminCouponsPage from "@/pages/admin/AdminCoupons";
import AdminContentPage from "@/pages/admin/AdminContent";
import AdminMediaPage from "@/pages/admin/AdminMedia";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalytics";
import AdminSettingsPage from "@/pages/admin/AdminSettings";
import AdminMotivationPage from "@/pages/admin/AdminMotivation";
import AdminFaqManagePage from "@/pages/admin/AdminFaqManage";
import AdminServicesManagePage from "@/pages/admin/AdminServicesManage";
import AdminInboxPage from "@/pages/admin/AdminInbox";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductFormPage />} />
        <Route path="products/:id" element={<AdminProductFormPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="brands" element={<AdminBrandsPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="content" element={<AdminContentPage />} />
        <Route path="media" element={<AdminMediaPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="motivation" element={<AdminMotivationPage />} />
        <Route path="faq" element={<AdminFaqManagePage />} />
        <Route path="services" element={<AdminServicesManagePage />} />
        <Route path="inbox" element={<AdminInboxPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
