import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/store/authContext'
import { CartProvider } from '@/store/cartContext'
import { ToastProvider } from '@/components/ui/Toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/admin/AdminRoute'

const HomePage = lazy(() => import('@/pages/HomePage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const CategoryPage = lazy(() => import('@/pages/CategoryPage'))
const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const SupportPage = lazy(() => import('@/pages/SupportPage'))

// Admin pages
const AdminLoginPage       = lazy(() => import('@/pages/admin/AdminLoginPage'))
const AdminDashboardPage   = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminProductsPage    = lazy(() => import('@/pages/admin/AdminProductsPage'))
const AdminProductFormPage = lazy(() => import('@/pages/admin/AdminProductFormPage'))
const AdminOrdersPage      = lazy(() => import('@/pages/admin/AdminOrdersPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F8FA' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-heading font-bold" style={{ color: '#001C3F' }}>⚡ Electric World</div>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#E31A2D', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-success/:id"
                element={<OrderSuccessPage />}
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="/admin/dashboard"
                element={<AdminRoute><AdminDashboardPage /></AdminRoute>}
              />
              <Route
                path="/admin/products"
                element={<AdminRoute><AdminProductsPage /></AdminRoute>}
              />
              <Route
                path="/admin/products/new"
                element={<AdminRoute><AdminProductFormPage /></AdminRoute>}
              />
              <Route
                path="/admin/products/edit/:id"
                element={<AdminRoute><AdminProductFormPage /></AdminRoute>}
              />
              <Route
                path="/admin/orders"
                element={<AdminRoute><AdminOrdersPage /></AdminRoute>}
              />
            </Routes>
          </Suspense>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
