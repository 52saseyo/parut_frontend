import { Fragment, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { adminLogin, login, logout, signup } from './features/auth/api'
import { useMyInfo } from './features/auth/hooks'
import { useProcessSellerApplication, useSellerApplications } from './features/admin/hooks'
import type { SellerApplication, SellerStatus } from './features/admin/api'
import {
  applyAsSeller,
  sellerLogin,
  type SellerApplicationRequest,
} from './features/sellers/api'
import { useMySellerApplicationStatus } from './features/sellers/hooks'
import { useSellerProduct, useSellerProductMutations, useSellerProducts, useSellerStocks, useSellerTimeDeals } from './features/seller-products/hooks'
import type { AppearanceType, ProductCategory, ProductStatus, SaleUnit } from './features/seller-products/api'
import {
  useCreateOrder,
  useCreateTimeDealOrder,
  useConfirmPayment,
  useOrder,
  usePreparePayment,
} from './features/orders/hooks'
import type { ApiProduct, ApiProductDetail } from './features/products/api'
import { useProduct, useProducts } from './features/products/hooks'
import { useRequestRefund } from './features/refunds/hooks'
import { useSellerDeliveries, useStartDelivery } from './features/delivery/hooks'
import type { Delivery } from './features/delivery/api'
import type { ApiTimeDeal, TimeDealListStatus, TimeDealStatus } from './features/timedeals/api'
import { useTimeDeal, useTimeDeals } from './features/timedeals/hooks'
import { authStorage } from './lib/api'

type Product = {
  id: string
  productId?: string
  name: string
  category: string
  price: number
  originalPrice?: number
  unit: string
  stock: number
  lowStockThreshold?: number
  seller: string
  emoji: string
  accent: string
  imageUrl?: string | null
  timeDeal?: boolean
  endsAt?: string
  startAt?: string
  endAt?: string
  timeDealStatus?: TimeDealStatus
}

const products: Product[] = [
  {
    id: 'strawberry',
    name: '논산 설향 딸기',
    category: '과일',
    price: 12900,
    originalPrice: 16900,
    unit: '500g',
    stock: 24,
    seller: '파릇농원',
    emoji: '🍓',
    accent: 'from-rose-200 to-red-100',
    timeDeal: true,
    endsAt: '02:18:42',
  },
  {
    id: 'spinach',
    name: '무농약 남해 시금치',
    category: '채소',
    price: 3900,
    unit: '200g',
    stock: 86,
    seller: '남해초록밭',
    emoji: '🥬',
    accent: 'from-emerald-200 to-lime-100',
  },
  {
    id: 'potato',
    name: '못난이 햇감자',
    category: '채소',
    price: 8900,
    originalPrice: 11900,
    unit: '2kg',
    stock: 41,
    seller: '햇살마루',
    emoji: '🥔',
    accent: 'from-amber-200 to-orange-100',
    timeDeal: true,
    endsAt: '05:44:10',
  },
  {
    id: 'rice',
    name: '2025 햅쌀 백미',
    category: '곡물',
    price: 34900,
    unit: '10kg',
    stock: 13,
    seller: '들녘정미소',
    emoji: '🌾',
    accent: 'from-yellow-100 to-stone-100',
  },
  {
    id: 'carrot',
    name: '제주 구좌 당근',
    category: '채소',
    price: 6900,
    unit: '1kg',
    stock: 54,
    seller: '구좌밭상회',
    emoji: '🥕',
    accent: 'from-orange-200 to-yellow-100',
  },
  {
    id: 'tomato',
    name: '대저 짭짤이 토마토',
    category: '채소',
    price: 11900,
    unit: '1kg',
    stock: 7,
    seller: '부산바다농장',
    emoji: '🍅',
    accent: 'from-red-200 to-orange-100',
  },
]

const money = (value: number) => `${value.toLocaleString('ko-KR')}원`
const checkoutDraftKey = 'parut.checkout.draft'

type CheckoutState = {
  productId?: string
  timeDealId?: string
  timeDeal?: boolean
  quantity?: number
}

function readCheckoutDraft(): CheckoutState | null {
  const saved = sessionStorage.getItem(checkoutDraftKey)
  if (!saved) return null
  try {
    return JSON.parse(saved) as CheckoutState
  } catch {
    sessionStorage.removeItem(checkoutDraftKey)
    return null
  }
}

const categoryMap: Record<string, ApiProduct['category']> = {
  채소: 'VEGETABLE',
  과일: 'FRUIT',
  곡물: 'GRAIN',
}

function productFromApi(product: ApiProduct | ApiProductDetail): Product {
  const category =
    product.category === 'FRUIT'
      ? '과일'
      : product.category === 'GRAIN'
        ? '곡물'
        : product.category === 'VEGETABLE'
          ? '채소'
          : '기타'
  return {
    id: product.productId,
    productId: product.productId,
    name: product.name,
    imageUrl: 'imageUrl' in product ? product.imageUrl : null,
    category,
    price: product.price,
    unit:
      'saleUnit' in product
        ? `${product.unitQuantity}${product.saleUnit === 'KG' ? 'kg' : product.saleUnit.toLowerCase()}`
        : '상품 단위',
    stock: 'availableQuantity' in product ? product.availableQuantity : 0,
    lowStockThreshold: product.lowStockThreshold,
    seller: product.origin,
    emoji: category === '과일' ? '🍓' : category === '곡물' ? '🌾' : '🥬',
    accent:
      category === '과일'
        ? 'from-rose-200 to-red-100'
        : category === '곡물'
          ? 'from-yellow-100 to-stone-100'
          : 'from-emerald-200 to-lime-100',
    timeDeal: false,
  }
}

function timeDealFromApi(timeDeal: ApiTimeDeal): Product {
  return {
    id: timeDeal.timeDealId,
    productId: timeDeal.productId,
    name: timeDeal.name,
    imageUrl: timeDeal.imageUrl,
    category: '타임딜',
    price: timeDeal.dealPrice,
    originalPrice: timeDeal.originalPrice,
    unit: '상품 단위',
    stock: timeDeal.stock.availableQuantity,
    lowStockThreshold: timeDeal.stock.lowStockThreshold,
    seller: timeDeal.origin,
    emoji: timeDeal.productGrade === 'UGLY' ? '🥕' : '🍓',
    accent:
      timeDeal.productGrade === 'UGLY'
        ? 'from-orange-200 to-amber-100'
        : 'from-rose-200 to-red-100',
    timeDeal: true,
    startAt: timeDeal.startAt,
    endAt: timeDeal.endAt,
    timeDealStatus: timeDeal.status,
  }
}

function remainingSeconds(endAt?: string) {
  if (!endAt) return null
  const seconds = Math.floor((new Date(endAt).getTime() - Date.now()) / 1000)
  return Number.isNaN(seconds) ? null : Math.max(0, seconds)
}

function isLowStock(product: Product) {
  return (
    product.lowStockThreshold !== undefined &&
    product.stock <= product.lowStockThreshold &&
    product.stock > 0
  )
}

function formatRemainingTime(seconds: number) {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  const restSeconds = seconds % 60
  return `${days}일 ${String(hours).padStart(2, '0')}시간 ${String(minutes).padStart(2, '0')}분 ${String(restSeconds).padStart(2, '0')}초`
}

function useRemainingTime(endAt?: string) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(endAt))

  useEffect(() => {
    const update = () => setSeconds(remainingSeconds(endAt))
    update()
    if (!endAt) return
    const timer = window.setInterval(update, 1_000)
    return () => window.clearInterval(timer)
  }, [endAt])

  return seconds === null ? null : formatRemainingTime(seconds)
}

function StatusBadge({
  children,
  tone = 'slate',
}: {
  children: string
  tone?: 'green' | 'orange' | 'blue' | 'red' | 'slate'
}) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/20',
    slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  }
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}
    >
      {children}
    </span>
  )
}

function ProductVisual({
  product,
  large = false,
  compact = false,
  showTimeDealBadge = true,
}: {
  product: Product
  large?: boolean
  compact?: boolean
  showTimeDealBadge?: boolean
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const hasImage = Boolean(product.imageUrl) && failedImageUrl !== product.imageUrl
  return (
    <div
      className={`relative flex ${large ? 'h-80' : compact ? 'h-24' : 'h-48'} w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${product.accent}`}
    >
      {hasImage ? (
        <img
          src={product.imageUrl ?? undefined}
          alt={product.name}
          className={`h-full w-full ${compact ? 'object-contain p-1' : 'object-cover'}`}
          onError={() => setFailedImageUrl(product.imageUrl ?? null)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-500">
          <span
            className={`${large ? 'text-5xl' : compact ? 'text-xs' : 'text-3xl'} font-black tracking-[0.18em]`}
          >
            NO IMAGE
          </span>
          <span className="mt-2 text-xs font-medium">이미지 준비 중</span>
        </div>
      )}
      {product.timeDeal && showTimeDealBadge && !compact && (
        <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white">
          TIME DEAL
        </span>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const isScheduledTimeDeal = product.timeDealStatus === 'SCHEDULED'
  const countdown = useRemainingTime(isScheduledTimeDeal ? product.startAt : product.endAt)
  return (
    <Link
      to={`${product.timeDeal ? '/time-deals' : '/products'}/${product.id}`}
      className="group block"
    >
      <ProductVisual product={product} />
      <div className="pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-500">{product.category}</p>
          {product.timeDeal && (
            <span className="text-xs font-bold text-orange-600">
              {(isScheduledTimeDeal ? product.startAt : product.endAt)
                ? countdown === '0일 00시간 00분 00초'
                  ? isScheduledTimeDeal ? '오픈됨' : '종료됨'
                  : isScheduledTimeDeal ? `오픈까지 ${countdown}` : countdown
                : product.endsAt}
            </span>
          )}
        </div>
        <h3 className="mt-1 truncate font-semibold text-slate-900 group-hover:text-emerald-700">
          {product.name}
        </h3>
        <p className="mt-2 text-lg font-bold text-slate-950">{money(product.price)}</p>
        {product.timeDeal && (
          <p
            className={
              isLowStock(product)
                ? 'mt-2 inline-flex rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-extrabold text-orange-700 shadow-sm'
                : 'mt-1 text-xs font-semibold text-slate-600'
            }
          >
            {isLowStock(product)
              ? `마감 임박 · ${product.stock.toLocaleString('ko-KR')}개 남음`
              : `남은 수량 ${product.stock.toLocaleString('ko-KR')}개`}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          {product.unit} · {product.seller}
        </p>
      </div>
    </Link>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 rounded-2xl bg-slate-200" />
      <div className="space-y-3 pt-4">
        <div className="h-3 w-16 rounded bg-slate-200" />
        <div className="h-5 w-4/5 rounded bg-slate-200" />
        <div className="h-6 w-24 rounded bg-slate-200" />
        <div className="h-3 w-32 rounded bg-slate-200" />
      </div>
    </div>
  )
}

function ProductDetailSkeleton({ timeDeal = false }: { timeDeal?: boolean }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
        <span>
          {timeDeal ? '타임딜 상세를 불러오는 중입니다.' : '상품 상세를 불러오는 중입니다.'}
        </span>
      </div>
      <div className="grid animate-pulse gap-10 lg:grid-cols-2 lg:items-start">
        <div className="h-80 rounded-2xl bg-slate-200" />
        <div className="space-y-5">
          <div className="h-6 w-24 rounded-full bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-10 w-4/5 rounded bg-slate-200" />
          <div className="h-9 w-32 rounded bg-slate-200" />
          <div className="space-y-4 border-y border-slate-200 py-6">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
          </div>
          <div className="h-14 w-full rounded-xl bg-emerald-100" />
        </div>
      </div>
    </main>
  )
}

function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(authStorage.getAccessToken()),
  )
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Link to="/" className="text-xl font-black tracking-tight text-emerald-700">
          parut<span className="text-orange-500">.</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
          <NavLink
            to="/products"
            className={({ isActive }) => (isActive ? 'text-emerald-700' : '')}
          >
            상품
          </NavLink>
          <NavLink
            to="/time-deals"
            className={({ isActive }) => (isActive ? 'text-orange-600' : '')}
          >
            타임딜
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => (isActive ? 'text-emerald-700' : '')}>
            주문 내역
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/seller" className="hidden text-xs font-semibold text-slate-500 sm:block">
            판매자 센터
          </Link>
          <Link to="/admin/login" className="hidden text-xs font-semibold text-slate-500 sm:block">
            관리자 센터
          </Link>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                void logout().finally(() => setIsAuthenticated(false))
              }}
              className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700"
            >
              로그아웃
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700"
            >
              로그인
            </Link>
          )}
          <Link
            to="/cart"
            aria-label="장바구니"
            className="rounded-full bg-slate-950 px-3 py-2 text-sm text-white"
          >
            🛒
          </Link>
        </div>
      </div>
    </header>
  )
}

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fcfdfb] text-slate-900">
      <Header />
      {children}
      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 text-sm text-slate-500 sm:px-8">
          <p className="font-bold text-emerald-700">parut.</p>
          <p className="mt-2">좋은 농수산물을 더 가까이, 파릇.</p>
        </div>
      </footer>
    </div>
  )
}

function HomePage() {
  const timeDealQuery = useTimeDeals({ status: 'ACTIVE', size: 10 })
  const deals = timeDealQuery.data?.content.map(timeDealFromApi) ?? []
  return (
    <PublicLayout>
      <main>
        <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:pb-24 lg:pt-12">
          <div
            className="relative h-64 overflow-hidden rounded-[2rem] bg-emerald-50 bg-cover bg-center shadow-sm ring-1 ring-emerald-900/5 sm:h-80 lg:h-[22rem]"
            style={{ backgroundImage: "url('/images/parut.png')" }}
            role="img"
            aria-label="파릇 신선식품 타임딜 서비스 소개"
          >
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-end gap-2 bg-gradient-to-t from-slate-950/35 to-transparent px-4 pb-4 pt-12 sm:px-6 sm:pb-6">
            <Link
              to="/products"
              className="rounded-xl bg-emerald-700/95 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 hover:bg-emerald-800"
            >
              상품 둘러보기
            </Link>
            <Link
              to="/time-deals"
              className="rounded-xl bg-white/95 px-4 py-2.5 text-sm font-bold text-orange-700 hover:bg-white"
            >
              마감 임박 타임딜
            </Link>
            </div>
          </div>
        </section>
        <section className="mx-auto mt-2 max-w-7xl px-5 sm:px-8">
          <div className="grid gap-6 rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 lg:grid-cols-[1.1fr_1.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Fresh market, fair price</p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                오늘의 식탁을 <span className="text-emerald-700">파릇하게</span> 채우는 방법
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">산지의 신선함은 그대로, 필요한 만큼만 합리적으로 만나보세요.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['🌱', '산지직송', '농가의 신선함을 바로'],
                ['⏱️', '타임딜', '지금 만나는 특별한 가격'],
                ['🤝', '함께 만드는 가치', '생산자와 소비자가 함께 성장'],
              ].map(([icon, title, description]) => (
                <div key={title} className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-2xl">{icon}</p>
                  <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-orange-600">LIMITED TIME</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                지금 가장 파릇한 타임딜
              </h2>
            </div>
            <Link
              to="/time-deals"
              className="text-sm font-bold text-slate-500 hover:text-emerald-700"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {timeDealQuery.isLoading ? (
              Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)
            ) : deals.length > 0 ? (
              deals.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <p className="col-span-full rounded-2xl bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
                현재 진행 중인 타임딜이 없습니다.
              </p>
            )}
          </div>
        </section>
        <section className="mx-auto mt-20 max-w-7xl px-5 sm:px-8">
          <div className="rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
            <p className="text-sm font-bold text-emerald-300">PARUT PROMISE</p>
            <div className="mt-5 grid gap-8 sm:grid-cols-3">
              {['산지에서 바로', '필요한 만큼 알뜰하게', '판매자와 함께 성장'].map(
                (item, index) => (
                  <div key={item} className="border-l border-white/20 pl-4">
                    <p className="text-2xl">{['🌱', '🧺', '🤝'][index]}</p>
                    <p className="mt-3 font-bold">{item}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      파릇한 선택을 위한 서비스 원칙입니다.
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}

function ProductsPage({ timeDeals = false }: { timeDeals?: boolean }) {
  const [category, setCategory] = useState('전체')
  const [timeDealStatus, setTimeDealStatus] = useState<TimeDealListStatus>('ACTIVE')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const categories = ['전체', '채소', '과일', '곡물']
  const productQuery = useProducts(
    {
      keyword: keyword || undefined,
      category: category === '전체' ? undefined : categoryMap[category],
      size: 10,
    },
    !timeDeals,
  )
  const timeDealQuery = useTimeDeals({ status: timeDealStatus, size: 10 }, timeDeals)
  const isLoading = timeDeals ? timeDealQuery.isLoading : productQuery.isLoading
  const source = timeDeals
    ? (timeDealQuery.data?.content.map(timeDealFromApi) ?? [])
    : (productQuery.data?.content.map(productFromApi) ?? [])
  const filtered =
    !timeDeals && category !== '전체'
      ? source.filter((product) => product.category === category)
      : source
  return (
    <PublicLayout>
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p
              className={`text-sm font-bold ${timeDeals ? 'text-orange-600' : 'text-emerald-700'}`}
            >
              {timeDeals ? 'LIMITED TIME' : 'FRESH PRODUCTS'}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {timeDeals ? '타임딜' : '상품 둘러보기'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {timeDeals
                ? '마감 전에 파릇한 혜택을 챙겨보세요.'
                : '오늘 도착한 신선한 상품을 골라보세요.'}
            </p>
            {!timeDeals && (
              <form
                className="mt-5 flex max-w-xl gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  setKeyword(keywordInput.trim())
                }}
              >
                <input
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  placeholder="상품명을 검색해 보세요"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                >
                  검색
                </button>
              </form>
            )}
            {((!timeDeals && productQuery.isError) || (timeDeals && timeDealQuery.isError)) && (
              <p className="mt-3 text-xs text-orange-600">
                목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            )}
          </div>
          {timeDeals ? (
            <div className="flex flex-wrap gap-2" aria-label="타임딜 상태 필터">
              {([
                ['ACTIVE', '판매중'],
                ['SCHEDULED', '오픈 예정'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimeDealStatus(value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${timeDealStatus === value ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-orange-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${category === item ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-emerald-300'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)
          ) : filtered.length > 0 ? (
            filtered.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <p className="col-span-full rounded-2xl bg-slate-50 px-5 py-16 text-center text-sm text-slate-500">
              {timeDeals ? '현재 진행 중인 타임딜이 없습니다.' : '등록된 상품이 없습니다.'}
            </p>
          )}
        </div>
      </main>
    </PublicLayout>
  )
}

function ProductDetailPage({ timeDeal = false }: { timeDeal?: boolean }) {
  const { productId } = useParams()
  const navigate = useNavigate()
  const productQuery = useProduct(productId, !timeDeal)
  const timeDealQuery = useTimeDeal(productId, timeDeal)
  const product = timeDeal
    ? timeDealQuery.data
      ? timeDealFromApi(timeDealQuery.data)
      : null
    : productQuery.data
      ? productFromApi(productQuery.data)
      : null
  const [quantity, setQuantity] = useState(1)
  const isScheduledTimeDeal = product?.timeDealStatus === 'SCHEDULED'
  const countdown = useRemainingTime(
    isScheduledTimeDeal ? product?.startAt : product?.endAt,
  )
  const isAuthenticated = Boolean(authStorage.getAccessToken())
  const isLoading = productQuery.isLoading || timeDealQuery.isLoading
  const isError = productQuery.isError || timeDealQuery.isError
  if (!product && isLoading) {
    return (
      <PublicLayout>
        <ProductDetailSkeleton timeDeal={timeDeal} />
      </PublicLayout>
    )
  }
  if (!product && isError) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
          <p className="text-sm text-slate-500">상품 정보를 불러오지 못했습니다.</p>
          <Link
            to={timeDeal ? '/time-deals' : '/products'}
            className="mt-5 inline-block font-bold text-emerald-700"
          >
            목록으로 돌아가기
          </Link>
        </main>
      </PublicLayout>
    )
  }
  if (!product) return null
  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <Link
          to={timeDeal ? '/time-deals' : '/products'}
          className="text-sm font-semibold text-slate-500 hover:text-emerald-700"
        >
          ← 상품 목록
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
          <ProductVisual product={product} large />
          <div>
            {isError && (
              <p className="mb-4 text-xs text-orange-600">
                백엔드에서 상품 상세를 불러오지 못했습니다.
              </p>
            )}
            <div className="flex items-center gap-2">
              <StatusBadge tone={isScheduledTimeDeal ? 'orange' : product.stock > 0 ? 'green' : 'red'}>
                {isScheduledTimeDeal ? '오픈 예정' : product.stock > 0 ? '판매 중' : '품절'}
              </StatusBadge>
              {product.timeDeal && <StatusBadge tone="orange">타임딜</StatusBadge>}
              {isLowStock(product) && (
                <span className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-extrabold text-orange-700 shadow-sm">
                  마감 임박 · {product.stock.toLocaleString('ko-KR')}개 남음
                </span>
              )}
            </div>
            <p className="mt-5 text-sm text-slate-500">
              {product.category} · {product.seller}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-5 text-3xl font-black text-slate-950">{money(product.price)}</p>
            {product.originalPrice && (
              <p className="mt-1 text-sm text-slate-400 line-through">
                {money(product.originalPrice)}
              </p>
            )}
            <div className="mt-8 space-y-3 border-y border-slate-200 py-5 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>판매 단위</span>
                <strong className="text-slate-900">{product.unit}</strong>
              </div>
              <div className="flex justify-between">
                <span>남은 재고</span>
                <strong className="text-slate-900">{product.stock}개</strong>
              </div>
              {product.timeDeal && (
                <div className="flex justify-between">
                  <span>{isScheduledTimeDeal ? '딜 오픈까지' : '딜 종료까지'}</span>
                  <strong className="text-orange-600">
                    {(isScheduledTimeDeal ? product.startAt : product.endAt)
                      ? countdown === '0일 00시간 00분 00초'
                        ? isScheduledTimeDeal ? '오픈됨' : '종료됨'
                        : isScheduledTimeDeal ? `오픈까지 ${countdown}` : countdown
                      : product.endsAt}
                  </strong>
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span className="text-sm font-semibold text-slate-700">수량</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isScheduledTimeDeal}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 rounded-lg bg-white text-lg ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-5 text-center font-bold">{quantity}</span>
                <button
                  type="button"
                  disabled={isScheduledTimeDeal}
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="h-8 w-8 rounded-lg bg-white text-lg ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              disabled={isScheduledTimeDeal}
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login')
                  return
                }
                navigate('/checkout', {
                  state: {
                    productId: product.productId ?? product.id,
                    timeDealId: timeDeal ? product.id : undefined,
                    timeDeal,
                    quantity,
                  },
                })
              }}
              className="mt-5 w-full rounded-xl bg-emerald-700 px-5 py-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"
            >
              {isScheduledTimeDeal
                ? '아직 구매할 수 없습니다'
                : isAuthenticated
                ? `${money(product.price * quantity)} 주문하기`
                : '로그인 후 주문하기'}
            </button>
            {isScheduledTimeDeal ? (
              <p className="mt-3 text-center text-xs text-orange-600">
                오픈 예정 상품입니다. 오픈 시간 이후 구매할 수 있습니다.
              </p>
            ) : !isAuthenticated && (
              <p className="mt-3 text-center text-xs text-slate-500">
                주문하려면 로그인이 필요합니다.
              </p>
            )}
          </div>
        </div>
      </main>
    </PublicLayout>
  )
}

function OrdersPage() {
  const isAuthenticated = Boolean(authStorage.getAccessToken())
  const orders = [
    {
      id: 'P-20250918-001',
      date: '2025.09.18',
      product: '논산 설향 딸기 외 1건',
      amount: 25800,
      status: '배송 준비 중',
      tone: 'orange' as const,
    },
    {
      id: 'P-20250912-014',
      date: '2025.09.12',
      product: '무농약 남해 시금치',
      amount: 3900,
      status: '배송 완료',
      tone: 'green' as const,
    },
  ]
  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <p className="text-sm font-bold text-emerald-700">MY PARUT</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">주문 내역</h1>
        {isAuthenticated ? (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <Link
                to={`/orders/${order.id}`}
                key={order.id}
                className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {order.date} · {order.id}
                    </p>
                    <p className="mt-2 font-bold text-slate-950">{order.product}</p>
                  </div>
                  <StatusBadge tone={order.tone}>{order.status}</StatusBadge>
                </div>
                <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">결제 금액</span>
                  <strong>{money(order.amount)}</strong>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-16 text-center">
            <div className="text-5xl">🔐</div>
            <h2 className="mt-5 text-xl font-black text-slate-950">로그인이 필요한 기능입니다</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              주문 내역은 로그인 후 확인할 수 있습니다.
              <br />
              로그인하고 나의 주문 상태를 확인해 보세요.
            </p>
            <Link
              to="/login"
              className="mt-7 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              로그인하러 가기
            </Link>
          </div>
        )}
      </main>
    </PublicLayout>
  )
}

function OrderDetailPage() {
  const { orderId } = useParams()
  const orderQuery = useOrder(orderId)
  const refundMutation = useRequestRefund()
  const firstDeliveryGroup = orderQuery.data?.deliveryGroups[0]
  const firstOrderItem = firstDeliveryGroup?.items[0]
  const firstOrderItemId = firstOrderItem?.orderItemId
  const canRequestRefund = Boolean(firstOrderItemId && firstOrderItem.refundable)
  const displayOrderId = orderQuery.data?.orderNo ?? orderId
  const displayStatus = orderQuery.data?.orderStatus ?? '배송 준비 중'
  if (orderQuery.isError) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-xl px-5 py-28 text-center">
          <div className="text-5xl">📦</div>
          <h1 className="mt-6 text-2xl font-black text-slate-950">
            주문 정보를 조회할 수 없습니다
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            현재 주문 내역에 표시된 샘플 주문은 실제 백엔드 주문번호가 아니어서 상세 조회를 지원하지
            않습니다.
          </p>
          <Link
            to="/orders"
            className="mt-7 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white"
          >
            주문 내역으로 돌아가기
          </Link>
        </main>
      </PublicLayout>
    )
  }
  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <Link to="/orders" className="text-sm font-semibold text-slate-500 hover:text-emerald-700">
          ← 주문 내역
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">주문 상세</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{displayOrderId}</h1>
          </div>
          <StatusBadge tone={orderQuery.data ? 'green' : 'orange'}>{displayStatus}</StatusBadge>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold">주문 상품</h2>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-rose-100 text-4xl">
                🍓
              </div>
              <div>
                <p className="font-bold">{firstOrderItem?.productName ?? '논산 설향 딸기'}</p>
                <p className="mt-1 text-sm text-slate-500">
                  상품 1종 · {firstOrderItem?.quantity ?? 2}개
                </p>
              </div>
              <strong className="ml-auto">{money(firstOrderItem?.unitPrice ?? 25_800)}</strong>
            </div>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="font-bold">배송 현황</h2>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="mx-auto h-3 w-3 rounded-full bg-emerald-600" />
                  <p className="mt-2 font-semibold text-emerald-700">
                    {firstDeliveryGroup?.groupStatus === 'PREPARING' ? '상품 준비' : '주문 완료'}
                  </p>
                </div>
                <div>
                  <div
                    className={`mx-auto h-3 w-3 rounded-full ${firstDeliveryGroup?.groupStatus === 'SHIPPED' || firstDeliveryGroup?.groupStatus === 'DELIVERED' ? 'bg-emerald-600' : 'bg-slate-200'}`}
                  />
                  <p
                    className={`mt-2 ${firstDeliveryGroup?.groupStatus === 'SHIPPED' || firstDeliveryGroup?.groupStatus === 'DELIVERED' ? 'font-semibold text-emerald-700' : 'text-slate-400'}`}
                  >
                    배송 중
                  </p>
                </div>
                <div>
                  <div
                    className={`mx-auto h-3 w-3 rounded-full ${firstDeliveryGroup?.groupStatus === 'DELIVERED' ? 'bg-emerald-600' : 'bg-slate-200'}`}
                  />
                  <p
                    className={`mt-2 ${firstDeliveryGroup?.groupStatus === 'DELIVERED' ? 'font-semibold text-emerald-700' : 'text-slate-400'}`}
                  >
                    배송 완료
                  </p>
                </div>
              </div>
            </div>
          </section>
          <aside className="rounded-2xl bg-slate-950 p-6 text-white">
            <h2 className="font-bold">결제 금액</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>상품 금액</span>
                <span>25,800원</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span>3,000원</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                <span>총 결제</span>
                <span>28,800원</span>
              </div>
            </div>
            <button
              type="button"
              disabled={!canRequestRefund || refundMutation.isPending}
              onClick={() =>
                firstOrderItemId &&
                refundMutation.mutate({
                  orderItemId: firstOrderItemId,
                  reason: '고객 환불 요청',
                })
              }
              className="mt-7 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refundMutation.isPending
                ? '환불 요청 중...'
                : firstOrderItem?.refundable === false
                  ? '환불 불가'
                  : '환불 요청'}
            </button>
            {!canRequestRefund && !refundMutation.isPending && (
              <p className="mt-3 text-xs text-slate-400">
                환불 가능한 주문 상품에서만 요청할 수 있습니다.
              </p>
            )}
            {refundMutation.isSuccess && (
              <p className="mt-3 text-xs text-emerald-300">환불 요청이 접수됐습니다.</p>
            )}
            {refundMutation.isError && (
              <p className="mt-3 text-xs text-rose-300">
                환불 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            )}
          </aside>
        </div>
      </main>
    </PublicLayout>
  )
}

function CheckoutPage() {
  const location = useLocation()
  const orderMutation = useCreateOrder()
  const timeDealOrderMutation = useCreateTimeDealOrder()
  const paymentMutation = usePreparePayment()
  const confirmPaymentMutation = useConfirmPayment()
  const locationState = location.state as CheckoutState | null
  const state = locationState ?? readCheckoutDraft()
  const isTimeDeal = Boolean(state?.timeDeal)
  const isAuthenticated = Boolean(authStorage.getAccessToken())
  const productQuery = useProduct(state?.productId, !isTimeDeal)
  const timeDealQuery = useTimeDeal(state?.timeDealId, isTimeDeal)
  const userQuery = useMyInfo(isAuthenticated)
  const product = isTimeDeal
    ? timeDealQuery.data
      ? timeDealFromApi(timeDealQuery.data)
      : null
    : productQuery.data
      ? productFromApi(productQuery.data)
      : null
  const quantity = state?.quantity ?? 1
  const [recipient, setRecipient] = useState(() => {
    const saved = localStorage.getItem('parut.checkout.recipient')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        localStorage.removeItem('parut.checkout.recipient')
      }
    }
    return {
      recipientName: '',
      recipientPhone: '',
      zipCode: '',
      addressBase: '',
      addressDetail: '',
      deliveryRequest: '',
    }
  })
  const [submitted, setSubmitted] = useState(false)
  const [apiOrderNo, setApiOrderNo] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const effectiveRecipient = {
    ...recipient,
    recipientName: recipient.recipientName || userQuery.data?.name || '',
  }
  const serializedRecipient = JSON.stringify(effectiveRecipient)

  useEffect(() => {
    if (locationState) {
      sessionStorage.setItem(checkoutDraftKey, JSON.stringify(locationState))
    }
  }, [locationState])

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('parut.checkout.recipient', serializedRecipient)
    }
  }, [isAuthenticated, serializedRecipient])

  async function submitOrder() {
    if (!product) return
    setValidationError(null)
    localStorage.setItem('parut.checkout.recipient', JSON.stringify(effectiveRecipient))
    const created = isTimeDeal
      ? await timeDealOrderMutation.mutateAsync({
          timeDealId: product.id,
          quantity,
          recipient: effectiveRecipient,
        })
      : await orderMutation.mutateAsync({
          items: [{ productId: product.productId ?? product.id, quantity }],
          recipient: effectiveRecipient,
        })
    const paymentReady = await paymentMutation.mutateAsync({
      orderId: created.orderId,
      paymentMethod: 'TOSS_PAY',
    })
    setPaymentProcessing(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 5_000))
      await confirmPaymentMutation.mutateAsync({
        paymentKey: `MOCK-PAYMENT-${Date.now()}`,
        tossOrderId: paymentReady.tossOrderId,
        amount: paymentReady.amount,
      })
    } finally {
      setPaymentProcessing(false)
    }
    sessionStorage.removeItem(checkoutDraftKey)
    setApiOrderNo(created.orderNo)
    setSubmitted(true)
  }

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-xl px-5 py-28 text-center">
          <h1 className="text-2xl font-black text-slate-950">로그인이 필요합니다</h1>
          <p className="mt-3 text-sm text-slate-500">주문을 진행하려면 먼저 로그인해 주세요.</p>
          <Link
            to="/login"
            className="mt-7 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white"
          >
            로그인하러 가기
          </Link>
        </main>
      </PublicLayout>
    )
  }

  const isProductLoading = productQuery.isLoading || timeDealQuery.isLoading
  if (isProductLoading) {
    return (
      <PublicLayout>
        <ProductDetailSkeleton timeDeal={isTimeDeal} />
      </PublicLayout>
    )
  }
  if (!product) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-xl px-5 py-28 text-center">
          <h1 className="text-2xl font-black text-slate-950">주문 상품을 찾을 수 없습니다</h1>
          <Link
            to={isTimeDeal ? '/time-deals' : '/products'}
            className="mt-7 inline-flex font-bold text-emerald-700"
          >
            목록으로 돌아가기
          </Link>
        </main>
      </PublicLayout>
    )
  }

  const productAmount = product.price * quantity
  const deliveryFee = 3_000
  const totalAmount = productAmount + deliveryFee
  const orderPending =
    orderMutation.isPending ||
    timeDealOrderMutation.isPending ||
    paymentMutation.isPending ||
    confirmPaymentMutation.isPending ||
    paymentProcessing

  if (submitted)
    return (
      <PublicLayout>
        <main className="mx-auto flex max-w-xl flex-col items-center px-5 py-28 text-center">
          <div className="text-6xl">🌱</div>
          <h1 className="mt-6 text-3xl font-black">주문이 접수됐어요</h1>
          <p className="mt-3 text-slate-500">
            결제 준비가 완료됐습니다. 주문 상태는 주문 내역에서 확인할 수 있습니다.
          </p>
          {apiOrderNo && (
            <p className="mt-3 text-sm font-bold text-emerald-700">주문번호 {apiOrderNo}</p>
          )}
          <Link
            to="/orders"
            className="mt-8 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white"
          >
            주문 내역 보기
          </Link>
        </main>
      </PublicLayout>
    )
  if (paymentProcessing)
    return (
      <PublicLayout>
        <main className="mx-auto flex max-w-xl flex-col items-center px-5 py-28 text-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
          <h1 className="mt-7 text-2xl font-black">결제를 승인하고 있어요</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            테스트 결제 승인 처리 중입니다.
            <br />
            잠시만 기다려 주세요.
          </p>
        </main>
      </PublicLayout>
    )
  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <p className="text-sm font-bold text-emerald-700">CHECKOUT</p>
        <h1 className="mt-2 text-3xl font-black">주문 확인</h1>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold">주문 상품</h2>
              <div className="mt-5 flex items-center gap-4">
                <div className="w-24 shrink-0">
                  <ProductVisual product={product} compact showTimeDealBadge={false} />
                </div>
                <div>
                  <p className="font-bold">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {product.unit} · {quantity}개
                  </p>
                </div>
                <strong className="ml-auto">{money(productAmount)}</strong>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold">배송 정보</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="받는 분"
                  value={effectiveRecipient.recipientName}
                  onChange={(event) =>
                    setRecipient({ ...recipient, recipientName: event.target.value })
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="연락처"
                  value={recipient.recipientPhone}
                  onChange={(event) =>
                    setRecipient({ ...recipient, recipientPhone: event.target.value })
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="우편번호"
                  value={recipient.zipCode}
                  onChange={(event) => setRecipient({ ...recipient, zipCode: event.target.value })}
                />
                <input
                  className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="기본 주소"
                  value={recipient.addressBase}
                  onChange={(event) =>
                    setRecipient({ ...recipient, addressBase: event.target.value })
                  }
                />
                <input
                  className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="상세 주소"
                  value={recipient.addressDetail}
                  onChange={(event) =>
                    setRecipient({ ...recipient, addressDetail: event.target.value })
                  }
                />
                <input
                  className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="배송 요청사항 (선택)"
                  value={recipient.deliveryRequest}
                  onChange={(event) =>
                    setRecipient({ ...recipient, deliveryRequest: event.target.value })
                  }
                />
                <p className="sm:col-span-2 text-xs text-slate-500">
                  최근 입력한 배송지가 있으면 자동으로 불러옵니다. 계정 배송지 API가 추가되면 서버
                  주소로 교체됩니다.
                </p>
              </div>
            </div>
          </section>
          <aside className="h-fit rounded-2xl bg-slate-950 p-6 text-white">
            <h2 className="font-bold">결제 요약</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>상품 금액</span>
                <span>{money(productAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span>3,000원</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                <span>총 결제 금액</span>
                <span>{money(totalAmount)}</span>
              </div>
            </div>
            {(orderMutation.isError ||
              timeDealOrderMutation.isError ||
              paymentMutation.isError ||
              confirmPaymentMutation.isError) && (
              <p className="mt-4 text-xs text-red-300">
                주문 또는 결제 준비에 실패했습니다. 로그인 상태와 백엔드 응답을 확인해주세요.
              </p>
            )}
            {validationError && <p className="mt-4 text-xs text-red-300">{validationError}</p>}
            <button
              type="button"
              disabled={orderPending}
              onClick={() => void submitOrder()}
              className="mt-7 w-full rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-black text-emerald-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {orderPending ? '주문 처리 중...' : `${money(totalAmount)} 결제 준비`}
            </button>
          </aside>
        </div>
      </main>
    </PublicLayout>
  )
}

function CartPage() {
  const isAuthenticated = Boolean(authStorage.getAccessToken())
  const cartItems = [
    { product: products[0], quantity: 1 },
    { product: products[1], quantity: 2 },
  ]
  const totalAmount = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )

  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <p className="text-sm font-bold text-emerald-700">MY PARUT</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">장바구니</h1>
        {!isAuthenticated ? (
          <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-16 text-center">
            <div className="text-5xl">🔐</div>
            <h2 className="mt-5 text-xl font-black text-slate-950">로그인이 필요한 기능입니다</h2>
            <p className="mt-3 text-sm text-slate-600">장바구니는 로그인 후 이용할 수 있습니다.</p>
            <Link
              to="/login"
              className="mt-7 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              로그인하러 가기
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              장바구니 API가 아직 구현되지 않아 샘플 상품을 표시하고 있습니다. 현재 상품
              추가·삭제·수량 변경은 지원하지 않습니다.
            </div>
            <div className="mt-6 space-y-4">
              {cartItems.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="w-24 shrink-0">
                    <ProductVisual product={product} compact showTimeDealBadge={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-950">{product.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {product.unit} · {quantity}개
                    </p>
                  </div>
                  <strong className="shrink-0">{money(product.price * quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-950 p-6 text-white">
              <span className="text-sm text-slate-300">샘플 장바구니 금액</span>
              <strong className="text-xl">{money(totalAmount)}</strong>
            </div>
          </>
        )}
      </main>
    </PublicLayout>
  )
}

function AuthPage() {
  const location = useLocation()
  const isSignup = location.pathname === '/signup'
  const isAdminLogin = location.pathname === '/admin/login'
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', name: '' })
  const mutation = useMutation({
    mutationFn: async () => {
      if (isSignup) {
        await signup({ username: form.username, password: form.password, name: form.name })
        return null
      }
      return isAdminLogin
        ? adminLogin({ username: form.username, password: form.password })
        : login({ username: form.username, password: form.password })
    },
    onSuccess: () => navigate(isSignup ? '/login' : isAdminLogin ? '/admin' : '/'),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-50 px-5 py-8 sm:py-12">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-emerald-900/5">
        <div
          className="order-first h-36 bg-cover bg-center bg-no-repeat bg-emerald-50 sm:h-48 lg:h-64"
          style={{ backgroundImage: "url('/images/parut.png')" }}
          role="img"
          aria-label="파릇 신선식품 서비스 소개"
        />
        <div className="p-7 sm:p-10">
        <Link to="/" className="text-xl font-black text-emerald-700">
          parut<span className="text-orange-500">.</span>
        </Link>
        <h1 className="mt-10 text-3xl font-black">
          {isSignup ? '파릇한 시작' : isAdminLogin ? '관리자 로그인' : '다시 만나요'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isSignup
            ? '파릇 서비스에 가입해보세요.'
            : isAdminLogin
              ? 'Parut 운영자 계정으로 로그인하세요.'
              : '파릇한 장보기를 시작해보세요.'}
        </p>
        <form
          className="mt-8 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          {isSignup && (
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
              placeholder="이름"
            />
          )}
          <input
            required
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
            placeholder="아이디"
          />
          <input
            required
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
            placeholder="비밀번호"
            type="password"
          />
          {mutation.isError && (
            <p className="text-xs text-red-600">
              요청에 실패했습니다. 백엔드 연결과 입력값을 확인해주세요.
            </p>
          )}
          <button
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending
              ? '처리 중...'
              : isSignup
                ? '회원가입'
                : isAdminLogin
                  ? '관리자 로그인'
                  : '로그인'}
          </button>
        </form>
        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
          {isSignup ? (
            <Link to="/login" className="hover:text-emerald-700">
              로그인으로 돌아가기
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="font-bold text-orange-600 hover:text-orange-700"
              >
                회원가입
              </Link>
              <Link
                to="/login"
                className={isAdminLogin ? 'hover:text-emerald-700' : 'font-bold text-emerald-700'}
              >
                일반 로그인
              </Link>
              <Link
                to="/seller/login"
                className="hover:text-emerald-700"
              >
                판매자 로그인
              </Link>
              <Link
                to="/admin/login"
                className={isAdminLogin ? 'font-bold text-emerald-700' : 'hover:text-emerald-700'}
              >
                관리자 로그인
              </Link>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

function SellerLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const mutation = useMutation({
    mutationFn: () => sellerLogin(form),
    onSuccess: () => navigate('/seller'),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-50 px-5 py-8 sm:py-12">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-emerald-900/5">
        <div
          className="order-first h-36 bg-cover bg-center bg-no-repeat bg-emerald-50 sm:h-48 lg:h-64"
          style={{ backgroundImage: "url('/images/parut.png')" }}
          role="img"
          aria-label="파릇 판매자 서비스 소개"
        />
        <div className="p-7 sm:p-10">
        <Link to="/" className="text-xl font-black text-emerald-700">
          parut<span className="text-orange-500">.</span>
        </Link>
        <p className="mt-10 text-sm font-bold text-emerald-700">SELLER CENTER</p>
        <h1 className="mt-2 text-3xl font-black">판매자 로그인</h1>
        <p className="mt-2 text-sm text-slate-500">승인된 판매자 계정으로 로그인하세요.</p>
        <form
          className="mt-8 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
            placeholder="판매자 아이디"
          />
          <input
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
            placeholder="비밀번호"
            type="password"
          />
          {mutation.isError && (
            <p className="text-xs text-red-600">
              판매자 로그인에 실패했습니다. 승인된 판매자 계정인지 확인해주세요.
            </p>
          )}
          <button
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? '로그인 중...' : '판매자 로그인'}
          </button>
        </form>
        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <Link to="/login" className="hover:text-emerald-700">
            일반 로그인
          </Link>
          <Link to="/seller/login" className="font-bold text-emerald-700">
            판매자 로그인
          </Link>
          <Link to="/admin/login" className="hover:text-emerald-700">
            관리자 로그인
          </Link>
          <Link to="/seller/apply" className="font-semibold text-orange-600">
            판매자 신청하기
          </Link>
        </div>
        </div>
      </div>
    </div>
  )
}

const emptySellerApplication: SellerApplicationRequest = {
  loginId: '',
  password: '',
  companyName: '',
  bizRegNo: '',
  repName: '',
  bizAddress: '',
  managerName: '',
  managerPhone: '',
  managerEmail: '',
  slackId: '',
}

function SellerApplyPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptySellerApplication)
  const mutation = useMutation({
    mutationFn: () => applyAsSeller(form),
    onSuccess: () => navigate('/seller/login'),
  })
  const update = (field: keyof SellerApplicationRequest, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }
  const fields: Array<[
    keyof SellerApplicationRequest,
    string,
    string,
    'text' | 'password' | 'email',
  ]> = [
    ['loginId', '판매자 로그인 아이디', '판매자 로그인에 사용할 아이디', 'text'],
    ['password', '비밀번호', '비밀번호', 'password'],
    ['companyName', '업체명', '업체명', 'text'],
    ['bizRegNo', '사업자등록번호', '사업자등록번호', 'text'],
    ['repName', '대표자명', '대표자명', 'text'],
    ['bizAddress', '사업장 주소', '사업장 주소', 'text'],
    ['managerName', '담당자명', '담당자명', 'text'],
    ['managerPhone', '담당자 전화번호', '담당자 전화번호', 'text'],
    ['managerEmail', '담당자 이메일', '담당자 이메일', 'email'],
    ['slackId', 'Slack ID', '선택 입력', 'text'],
  ]

  return (
    <div className="min-h-screen bg-emerald-50 px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-7 shadow-xl shadow-emerald-900/5 sm:p-10">
        <Link to="/" className="text-xl font-black text-emerald-700">
          parut<span className="text-orange-500">.</span>
        </Link>
        <p className="mt-10 text-sm font-bold text-emerald-700">SELLER APPLICATION</p>
        <h1 className="mt-2 text-3xl font-black">판매자 신청</h1>
        <p className="mt-2 text-sm text-slate-500">
          신청 후 관리자 승인까지 완료되면 판매자 센터를 이용할 수 있습니다.
        </p>
        <form
          className="mt-8 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          {fields.map(([field, label, placeholder, type]) => (
            <label key={field} className={field === 'bizAddress' ? 'sm:col-span-2' : ''}>
              <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
              <input
                required={field !== 'slackId'}
                value={form[field] ?? ''}
                onChange={(event) => update(field, event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                placeholder={placeholder}
                type={type}
              />
            </label>
          ))}
          {mutation.isError && (
            <p className="sm:col-span-2 text-xs text-red-600">
              판매자 신청에 실패했습니다. 이미 사용 중인 아이디인지 입력값을 확인해주세요.
            </p>
          )}
          <button
            disabled={mutation.isPending}
            className="sm:col-span-2 rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? '신청 중...' : '판매자 신청하기'}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-500">
          이미 신청하셨다면{' '}
          <Link to="/seller/login" className="font-semibold text-emerald-700">
            판매자 로그인
          </Link>
        </div>
      </div>
    </div>
  )
}

function SellerAccessPage({ section = 'dashboard' }: { section?: string }) {
  const role = authStorage.getRole()
  const hasToken = Boolean(authStorage.getAccessToken())
  const statusQuery = useMySellerApplicationStatus(
    hasToken && (role === 'PENDING_SELLER' || role === 'SELLER'),
  )

  if (role === 'SELLER') return <DashboardPage role="seller" section={section} />

  if (!hasToken) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
          <p className="text-sm font-bold text-emerald-700">SELLER CENTER</p>
          <h1 className="mt-3 text-3xl font-black">판매자 로그인이 필요합니다</h1>
          <p className="mt-3 text-sm text-slate-500">
            판매자 센터를 이용하려면 승인된 판매자 계정으로 로그인해주세요.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/seller/login" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">
              판매자 로그인
            </Link>
            <Link to="/seller/apply" className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700">
              판매자 신청
            </Link>
          </div>
        </main>
      </PublicLayout>
    )
  }

  if (role === 'CUSTOMER') {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
          <p className="text-sm font-bold text-emerald-700">SELLER CENTER</p>
          <h1 className="mt-3 text-3xl font-black">판매자 신청 후 이용할 수 있습니다</h1>
          <p className="mt-3 text-sm text-slate-500">
            현재 일반 고객으로 로그인되어 있습니다. 판매자 신청과 관리자 승인이 완료되면 판매자 센터를 이용할 수 있습니다.
          </p>
          <Link to="/seller/apply" className="mt-8 inline-block rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">
            판매자 신청하기
          </Link>
        </main>
      </PublicLayout>
    )
  }

  if (role === 'ADMIN') {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
          <h1 className="text-3xl font-black">관리자 계정으로 로그인되어 있습니다</h1>
          <p className="mt-3 text-sm text-slate-500">판매자 기능은 승인된 판매자 계정으로 이용해주세요.</p>
          <Link to="/admin" className="mt-8 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
            관리자 콘솔로 이동
          </Link>
        </main>
      </PublicLayout>
    )
  }

  if (statusQuery.isPending) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
          <p className="mt-4 text-sm text-slate-500">판매자 신청 상태를 확인하는 중입니다.</p>
        </main>
      </PublicLayout>
    )
  }

  const status = statusQuery.data?.status
  return (
    <PublicLayout>
      <main className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
        <StatusBadge tone={status === 'REJECTED' ? 'red' : 'orange'}>
          {status === 'REJECTED' ? '신청 반려' : '승인 대기'}
        </StatusBadge>
        <h1 className="mt-4 text-3xl font-black">
          {status === 'REJECTED' ? '판매자 신청이 반려되었습니다' : '판매자 승인 대기 중입니다'}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {status === 'REJECTED'
            ? statusQuery.data?.rejectReason || '반려 사유를 확인한 뒤 다시 신청해주세요.'
            : '관리자 승인 후 판매자 로그인으로 다시 접속해주세요.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {status === 'REJECTED' && (
            <Link to="/seller/apply" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">
              다시 신청하기
            </Link>
          )}
          <Link to="/seller/login" className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700">
            판매자 로그인
          </Link>
        </div>
      </main>
    </PublicLayout>
  )
}

const sellerProductCategories: Array<[ProductCategory, string]> = [
  ['VEGETABLE', '채소'],
  ['FRUIT', '과일'],
  ['GRAIN', '곡물'],
  ['ETC', '기타'],
]

function productStatusLabel(status: ProductStatus) {
  return status === 'ON_SALE'
    ? '판매 중'
    : status === 'DRAFT'
      ? '판매 준비'
      : status === 'SOLD_OUT'
        ? '품절'
        : status === 'SUSPENDED'
          ? '판매 중지'
          : '삭제됨'
}

function SellerFormField({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={className}>
      <span className="block text-xs font-bold text-slate-700">{label}</span>
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
      <span className="mt-1.5 block">{children}</span>
    </label>
  )
}

function SellerActionOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-5 backdrop-blur-[2px]" role="status" aria-live="polite" aria-label="작업 진행 중">
      <div className="flex min-w-[220px] flex-col items-center rounded-2xl bg-white px-8 py-7 text-center shadow-2xl">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" aria-hidden="true" />
        <p className="mt-4 text-sm font-bold text-slate-900">요청을 처리하고 있습니다</p>
        <p className="mt-1 text-xs text-slate-500">완료될 때까지 잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}

function sellerMutationPending(mutations: Record<string, { isPending: boolean }>) {
  return Object.values(mutations).some((mutation) => mutation.isPending)
}

function sellerActionErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback
  const response = error.response
  if (typeof response !== 'object' || response === null || !('data' in response)) return fallback
  const data = response.data
  if (typeof data !== 'object' || data === null) return fallback
  if ('message' in data && typeof data.message === 'string') return data.message
  if ('errorMessage' in data && typeof data.errorMessage === 'string') return data.errorMessage
  if ('code' in data && typeof data.code === 'string') return `${fallback} (${data.code})`
  return fallback
}

function sellerLocalDateTime(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const defaultSellerStartAt = sellerLocalDateTime()
const defaultSellerEndAt = sellerLocalDateTime(new Date(Date.now() + 86_400_000))

function SellerProductEditForm({ productId, onClose }: { productId: string; onClose: () => void }) {
  const detailQuery = useSellerProduct(productId)
  const mutations = useSellerProductMutations()
  const [form, setForm] = useState({
    category: 'VEGETABLE' as ProductCategory,
    name: '',
    description: '',
    price: '',
    appearanceType: 'NORMAL' as AppearanceType,
    origin: '',
    harvestDate: '',
    saleUnit: 'EA' as SaleUnit,
    unitQuantity: '1',
  })

  useEffect(() => {
    const product = detailQuery.data
    if (!product) return
    setForm({
      category: product.category,
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      appearanceType: product.appearanceType,
      origin: product.origin,
      harvestDate: product.harvestDate,
      saleUnit: product.saleUnit,
      unitQuantity: String(product.unitQuantity),
    })
  }, [detailQuery.data])

  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }))
  if (detailQuery.isPending) return <div className="animate-pulse p-5 text-sm text-slate-500">상품 정보를 불러오는 중입니다.</div>
  if (detailQuery.isError || !detailQuery.data) return <div className="p-5 text-sm text-red-600">상품 정보를 불러오지 못했습니다.</div>

  return (
    <form
      className="grid gap-3 bg-emerald-50 px-5 py-5 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault()
        mutations.update.mutate({
          productId,
          input: {
            category: form.category,
            name: form.name,
            description: form.description,
            price: Number(form.price),
            appearanceType: form.appearanceType,
            origin: form.origin,
            harvestDate: form.harvestDate,
            saleUnit: form.saleUnit,
            unitQuantity: Number(form.unitQuantity),
          },
        }, { onSuccess: onClose })
      }}
    >
      {sellerMutationPending(mutations) && <SellerActionOverlay />}
      <div className="flex items-center justify-between sm:col-span-2">
        <h4 className="font-bold">상품 정보 수정</h4>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500">닫기</button>
      </div>
      <SellerFormField label="상품명"><input required value={form.name} onChange={(event) => update('name', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField>
      <SellerFormField label="원산지"><input required value={form.origin} onChange={(event) => update('origin', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField>
      <SellerFormField label="상품 카테고리"><select value={form.category} onChange={(event) => update('category', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{sellerProductCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></SellerFormField>
      <SellerFormField label="외관 유형"><select value={form.appearanceType} onChange={(event) => update('appearanceType', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="NORMAL">일반 외관</option><option value="UGLY">못난이 상품</option></select></SellerFormField>
      <SellerFormField label="판매 가격"><input required type="number" min="0" value={form.price} onChange={(event) => update('price', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField>
      <SellerFormField label="수확일"><input required type="date" value={form.harvestDate} onChange={(event) => update('harvestDate', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField>
      <SellerFormField label="판매 단위"><select value={form.saleUnit} onChange={(event) => update('saleUnit', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="G">g</option><option value="KG">kg</option><option value="EA">개</option><option value="BOX">박스</option></select></SellerFormField>
      <SellerFormField label="판매 단위 수량"><input required type="number" min="0.01" step="0.01" value={form.unitQuantity} onChange={(event) => update('unitQuantity', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField>
      <SellerFormField label="상품 설명" className="sm:col-span-2"><textarea value={form.description} onChange={(event) => update('description', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField>
      {mutations.update.isError && <p className="sm:col-span-2 text-xs text-red-600">상품 수정에 실패했습니다.</p>}
      <button disabled={mutations.update.isPending} className="sm:col-span-2 rounded-lg bg-emerald-700 py-2.5 text-sm font-bold text-white disabled:opacity-50">{mutations.update.isPending ? '저장 중...' : '수정 내용 저장'}</button>
    </form>
  )
}

function SellerProductManagement() {
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [status, setStatus] = useState<ProductStatus | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [actionProductId, setActionProductId] = useState<string | null>(null)
  const [editProductId, setEditProductId] = useState<string | null>(null)
  const [convertProductId, setConvertProductId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const productsQuery = useSellerProducts({
    page: 1,
    keyword: submittedKeyword || undefined,
    status: status || undefined,
  })
  const mutations = useSellerProductMutations()
  const [form, setForm] = useState({
    category: 'VEGETABLE' as ProductCategory,
    name: '',
    description: '',
    price: '',
    appearanceType: 'NORMAL' as AppearanceType,
    origin: '',
    harvestDate: new Date().toISOString().slice(0, 10),
    saleUnit: 'EA' as SaleUnit,
    unitQuantity: '1',
    totalQuantity: '0',
    lowStockThreshold: '0',
  })
  const [convertForm, setConvertForm] = useState({
    quantity: '',
    discountRate: '20',
    startAt: defaultSellerStartAt,
    endAt: defaultSellerEndAt,
    maxPurchaseQuantity: '1',
    lowStockThreshold: '5',
  })
  const products = productsQuery.data?.content ?? []

  const updateForm = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutations.create.mutate({
      category: form.category,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      appearanceType: form.appearanceType,
      origin: form.origin,
      harvestDate: form.harvestDate,
      saleUnit: form.saleUnit,
      unitQuantity: Number(form.unitQuantity),
      totalQuantity: Number(form.totalQuantity),
      lowStockThreshold: Number(form.lowStockThreshold),
    }, { onSuccess: () => { setShowCreate(false); setSuccessMessage('상품 등록이 완료되었습니다. 아래 목록에서 등록된 상품을 확인할 수 있습니다.') } })
  }

  return (
    <section className="mt-8 space-y-4">
      {sellerMutationPending(mutations) && <SellerActionOverlay />}
      {successMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{successMessage}</div>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-950">일반 상품 관리</h2>
          <p className="mt-1 text-sm text-slate-500">상품 정보와 판매 상태를 관리하고 타임딜로 전환할 수 있습니다.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((current) => !current)}
          className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
        >
          {showCreate ? '등록 폼 닫기' : '상품 등록'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={submitCreate} className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:grid-cols-2">
          <h3 className="sm:col-span-2 font-bold">일반 상품 등록</h3>
          <SellerFormField label="상품명" hint="고객에게 표시되는 상품 이름">
            <input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 논산 설향 딸기" />
          </SellerFormField>
          <SellerFormField label="원산지" hint="상품이 생산된 지역 또는 국가">
            <input required value={form.origin} onChange={(event) => updateForm('origin', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 충남 논산" />
          </SellerFormField>
          <SellerFormField label="상품 카테고리">
            <select value={form.category} onChange={(event) => updateForm('category', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {sellerProductCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </SellerFormField>
          <SellerFormField label="외관 유형" hint="못난이 상품 여부를 구분합니다">
            <select value={form.appearanceType} onChange={(event) => updateForm('appearanceType', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="NORMAL">일반 외관</option>
            <option value="UGLY">못난이 상품</option>
            </select>
          </SellerFormField>
          <SellerFormField label="판매 가격" hint="원 단위의 상품 판매 가격">
            <input required type="number" min="0" value={form.price} onChange={(event) => updateForm('price', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 12900" />
          </SellerFormField>
          <SellerFormField label="수확일" hint="상품을 수확한 날짜">
            <input required type="date" value={form.harvestDate} onChange={(event) => updateForm('harvestDate', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </SellerFormField>
          <SellerFormField label="판매 단위" hint="고객 주문 1개가 의미하는 단위">
            <select value={form.saleUnit} onChange={(event) => updateForm('saleUnit', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="G">g</option><option value="KG">kg</option><option value="EA">개</option><option value="BOX">박스</option>
            </select>
          </SellerFormField>
          <SellerFormField label="판매 단위 수량" hint="판매 단위 1개에 포함되는 수량">
            <input required type="number" min="0.01" step="0.01" value={form.unitQuantity} onChange={(event) => updateForm('unitQuantity', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 500" />
          </SellerFormField>
          <SellerFormField label="초기 총 재고" hint="등록 시 준비할 전체 재고 수량. 0이면 판매 시작할 수 없습니다.">
            <input required type="number" min="0" value={form.totalQuantity} onChange={(event) => updateForm('totalQuantity', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 100" />
          </SellerFormField>
          <SellerFormField label="재고 부족 기준" hint="남은 수량이 이 값 이하이면 마감 임박으로 표시합니다.">
            <input required type="number" min="0" value={form.lowStockThreshold} onChange={(event) => updateForm('lowStockThreshold', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 10" />
          </SellerFormField>
          <SellerFormField label="상품 설명" hint="상품의 특징과 고객에게 전달할 안내 사항" className="sm:col-span-2">
            <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="상품 설명을 입력해주세요." />
          </SellerFormField>
          <p className="sm:col-span-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">판매 시작 전 상품 이미지 등록이 필요합니다. 상품을 먼저 등록한 뒤 상품 목록의 이미지 등록 버튼으로 JPEG·PNG·WEBP 이미지를 업로드해주세요.</p>
          {mutations.create.isError && <p className="sm:col-span-2 text-xs text-red-600">상품 등록에 실패했습니다. 입력값과 판매자 권한을 확인해주세요.</p>}
          <button disabled={mutations.create.isPending} className="sm:col-span-2 rounded-lg bg-emerald-700 py-2.5 text-sm font-bold text-white disabled:opacity-50">{mutations.create.isPending ? '등록 중...' : '상품 등록하기'}</button>
        </form>
      )}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4">
        <form className="flex flex-1 gap-2" onSubmit={(event) => { event.preventDefault(); setSubmittedKeyword(keyword.trim()) }}>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="상품명 검색" />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">검색</button>
        </form>
        <select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus | '')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">전체 상태</option><option value="DRAFT">판매 준비</option><option value="ON_SALE">판매 중</option><option value="SOLD_OUT">품절</option><option value="SUSPENDED">판매 중지</option>
        </select>
      </div>

      {productsQuery.isPending && <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />}
      {productsQuery.isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">상품 목록을 불러오지 못했습니다.</div>}
      {!productsQuery.isPending && !productsQuery.isError && products.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">등록된 상품이 없습니다.</div>}
      {products.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">상품</th><th className="px-5 py-3">카테고리</th><th className="px-5 py-3">판매가</th><th className="px-5 py-3">상태</th><th className="px-5 py-3">관리</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <Fragment key={product.productId}>
                  <tr>
                    <td className="px-5 py-4 font-semibold text-slate-900"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-emerald-50">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xl" aria-label="이미지 없음">🍎</div>}</div><div className="min-w-0"><p className="truncate">{product.name}</p><div className="mt-1 font-mono text-[10px] font-normal text-slate-400">{product.productId}</div></div></div></td>
                    <td className="px-5 py-4 text-slate-500">{product.category}</td>
                    <td className="px-5 py-4">{money(product.price)}</td>
                    <td className="px-5 py-4"><StatusBadge tone={product.status === 'ON_SALE' ? 'green' : product.status === 'SOLD_OUT' ? 'red' : 'orange'}>{productStatusLabel(product.status)}</StatusBadge></td>
                    <td className="px-5 py-4"><div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
                        {mutations.uploadImage.isPending ? '업로드 중...' : '이미지 등록'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          disabled={mutations.uploadImage.isPending}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) mutations.uploadImage.mutate({ productId: product.productId, file })
                            event.target.value = ''
                          }}
                        />
                      </label>
                      {product.status === 'ON_SALE' ? (
                        <button type="button" onClick={() => mutations.updateStatus.mutate({ productId: product.productId, status: 'SUSPENDED' })} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">판매 중지</button>
                      ) : product.status === 'DRAFT' || product.status === 'SUSPENDED' ? (
                        <button type="button" onClick={() => mutations.updateStatus.mutate({ productId: product.productId, status: 'ON_SALE' })} className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">판매 시작</button>
                      ) : (
                        <span title="품절 상품은 재고를 보충한 뒤 판매 재개 API가 필요합니다." className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">판매 시작 불가</span>
                      )}
                      <button type="button" onClick={() => setConvertProductId(convertProductId === product.productId ? null : product.productId)} className="rounded-lg bg-orange-100 px-3 py-2 text-xs font-bold text-orange-700">타임딜 전환</button>
                      <button type="button" onClick={() => setActionProductId(actionProductId === product.productId ? null : product.productId)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">관리 ▾</button>
                    </div></td>
                  </tr>
                  {actionProductId === product.productId && <tr><td colSpan={5} className="bg-slate-50 px-5 py-3"><div className="flex flex-wrap items-center gap-2"><span className="mr-2 text-xs font-semibold text-slate-500">상품 관리</span><button type="button" onClick={() => { setEditProductId(editProductId === product.productId ? null : product.productId); setActionProductId(null) }} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">상품 수정</button><button type="button" onClick={() => { if (window.confirm('이 상품을 삭제하시겠습니까?')) mutations.remove.mutate(product.productId); setActionProductId(null) }} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">상품 삭제</button><button type="button" onClick={() => setActionProductId(null)} className="ml-auto rounded-lg px-3 py-2 text-xs font-semibold text-slate-500">닫기</button></div></td></tr>}
                  {editProductId === product.productId && <tr><td colSpan={5}><SellerProductEditForm productId={product.productId} onClose={() => setEditProductId(null)} /></td></tr>}
                  {convertProductId === product.productId && (
                    <tr><td colSpan={5} className="bg-orange-50 px-5 py-4">
                      <form className="grid gap-2 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); mutations.convert.mutate({ productId: product.productId, quantity: Number(convertForm.quantity), discountRate: Number(convertForm.discountRate), startAt: new Date(convertForm.startAt).toISOString(), endAt: new Date(convertForm.endAt).toISOString(), maxPurchaseQuantity: Number(convertForm.maxPurchaseQuantity), lowStockThreshold: Number(convertForm.lowStockThreshold) }, { onSuccess: () => setConvertProductId(null) }) }}>
                        <SellerFormField label="타임딜 전환 수량" hint="일반 상품 재고에서 타임딜로 이동할 수량">
                          <input required type="number" min="1" value={convertForm.quantity} onChange={(event) => setConvertForm({ ...convertForm, quantity: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 30" />
                        </SellerFormField>
                        <SellerFormField label="할인율" hint="일반 상품 가격에 적용할 할인 비율(%)">
                          <input required type="number" min="0" step="0.1" value={convertForm.discountRate} onChange={(event) => setConvertForm({ ...convertForm, discountRate: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 20" />
                        </SellerFormField>
                        <SellerFormField label="최대 구매 수량" hint="고객 1명이 구매할 수 있는 최대 수량">
                          <input required type="number" min="1" value={convertForm.maxPurchaseQuantity} onChange={(event) => setConvertForm({ ...convertForm, maxPurchaseQuantity: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 3" />
                        </SellerFormField>
                        <SellerFormField label="판매 시작 일시" hint="타임딜이 고객에게 공개되는 시점">
                          <input required type="datetime-local" value={convertForm.startAt} onChange={(event) => setConvertForm({ ...convertForm, startAt: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </SellerFormField>
                        <SellerFormField label="판매 종료 일시" hint="타임딜이 자동으로 종료되는 시점">
                          <input required type="datetime-local" value={convertForm.endAt} onChange={(event) => setConvertForm({ ...convertForm, endAt: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </SellerFormField>
                        <SellerFormField label="재고 부족 기준" hint="남은 수량이 이 값 이하이면 마감 임박 표시">
                          <input required type="number" min="0" value={convertForm.lowStockThreshold} onChange={(event) => setConvertForm({ ...convertForm, lowStockThreshold: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="예: 5" />
                        </SellerFormField>
                        <button disabled={mutations.convert.isPending} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white sm:col-span-3">{mutations.convert.isPending ? '전환 중...' : '타임딜 생성하기'}</button>
                      </form>
                    </td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {mutations.uploadImage.isError && <p className="text-xs text-red-600">이미지 등록에 실패했습니다. JPEG·PNG·WEBP 형식의 10MB 이하 파일인지 확인해주세요.</p>}
      {mutations.updateStatus.isError && <p className="text-xs text-orange-700">판매 시작 조건을 확인해주세요. 상품 이미지가 등록되어 있고, 판매 가능한 재고가 1개 이상이며, 상품 상태가 판매 준비 또는 판매 중지여야 합니다.</p>}
    </section>
  )
}

function SellerStockManagement() {
  const stocksQuery = useSellerStocks()
  const mutations = useSellerProductMutations()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('')
  const [stockMessage, setStockMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const stocks = stocksQuery.data?.content ?? []
  return (
    <section className="mt-8">
      {sellerMutationPending(mutations) && <SellerActionOverlay />}
      <div><h2 className="font-bold text-slate-950">일반 상품 재고 관리</h2><p className="mt-1 text-sm text-slate-500">일반 상품의 총 재고를 수정합니다. 타임딜 재고는 타임딜별 재고 관리에서 별도로 조정합니다.</p></div>
      {stockMessage && <div role="status" className={`rounded-xl border px-4 py-3 text-sm font-semibold ${stockMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{stockMessage.text}</div>}
      {stocksQuery.isPending && <div className="mt-4 h-48 animate-pulse rounded-2xl bg-slate-200" />}
      {stocksQuery.isError && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">재고 목록을 불러오지 못했습니다.</div>}
      {!stocksQuery.isPending && !stocksQuery.isError && stocks.length === 0 && <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">관리할 재고가 없습니다.</div>}
      {stocks.length > 0 && <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">상품 ID</th><th className="px-5 py-3">총 재고</th><th className="px-5 py-3">판매 가능</th><th className="px-5 py-3">상태</th><th className="px-5 py-3">관리</th></tr></thead><tbody className="divide-y divide-slate-100">{stocks.map((stock) => <tr key={stock.stockId}><td className="px-5 py-4 font-mono text-xs">{stock.productId}</td><td className="px-5 py-4">{stock.totalQuantity}개</td><td className="px-5 py-4">{stock.availableQuantity}개</td><td className="px-5 py-4"><StatusBadge tone={stock.status === 'AVAILABLE' ? 'green' : 'orange'}>{stock.status}</StatusBadge></td><td className="px-5 py-4">{editingId === stock.productId ? <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setStockMessage(null); mutations.updateStock.mutate({ productId: stock.productId, totalQuantity: Number(quantity) }, { onSuccess: () => { setEditingId(null); setStockMessage({ type: 'success', text: '일반 상품 재고가 수정되었습니다.' }) }, onError: (error) => setStockMessage({ type: 'error', text: sellerActionErrorMessage(error, '일반 상품 재고 수정에 실패했습니다. 판매 가능 수량과 상품 상태를 확인해주세요.') }) }) }}><input required type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /><button className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white">저장</button></form> : <button type="button" onClick={() => { setEditingId(stock.productId); setQuantity(String(stock.totalQuantity)); setStockMessage(null) }} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">수량 수정</button>}</td></tr>)}</tbody></table></div>}
    </section>
  )
}

function SellerTimeDealManagement() {
  const mutations = useSellerProductMutations()
  const timeDealsQuery = useSellerTimeDeals()
  const [showCreate, setShowCreate] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDiscountRate, setEditDiscountRate] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [form, setForm] = useState({ name: '', description: '', productGrade: 'NORMAL' as 'NORMAL' | 'UGLY', origin: '', harvestedDate: new Date().toISOString().slice(0, 10), originalPrice: '', discountRate: '20', startAt: defaultSellerStartAt, endAt: defaultSellerEndAt, maxPurchaseQuantity: '1', initialQuantity: '', lowStockThreshold: '5' })
  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const timeDeals = timeDealsQuery.data?.content ?? []
  return (
    <section className="mt-8 space-y-5">
      {sellerMutationPending(mutations) && <SellerActionOverlay />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-orange-600">TIME DEAL MANAGEMENT</p><h2 className="mt-2 font-bold text-slate-950">타임딜 관리</h2><p className="mt-1 text-sm text-slate-500">타임딜을 등록하고 판매 상태와 운영 작업을 관리합니다.</p></div>
        <button type="button" onClick={() => setShowCreate((current) => !current)} className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600">{showCreate ? '등록 폼 닫기' : '타임딜 등록'}</button>
      </div>
      {successMessage && <div role="status" className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">{successMessage}</div>}
      {timeDealsQuery.isPending && <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />}
      {timeDealsQuery.isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">내 타임딜 목록을 불러오지 못했습니다.</div>}
      {!timeDealsQuery.isPending && !timeDealsQuery.isError && timeDeals.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">등록된 타임딜이 없습니다.</div>}
      {timeDeals.length > 0 && <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">상품명</th><th className="px-5 py-3">상태</th><th className="px-5 py-3">가격</th><th className="px-5 py-3">재고</th><th className="px-5 py-3">판매 기간</th><th className="px-5 py-3">관리</th></tr></thead><tbody className="divide-y divide-slate-100">{timeDeals.map((deal) => <Fragment key={deal.timeDealId}><tr><td className="px-5 py-4 font-semibold"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-orange-50">{deal.imageUrl ? <img src={deal.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xl" aria-label="이미지 없음">🥕</div>}</div><div className="min-w-0"><p className="truncate">{deal.name}</p><div className="mt-1 font-mono text-[10px] text-slate-400">{deal.timeDealId}</div></div></div></td><td className="px-5 py-4"><StatusBadge tone={deal.status === 'ACTIVE' ? 'green' : deal.status === 'STOPPED' ? 'red' : 'orange'}>{deal.status}</StatusBadge></td><td className="px-5 py-4">{deal.dealPrice.toLocaleString('ko-KR')}원<div className="text-xs text-slate-400">할인율 {deal.discountRate}%</div></td><td className="px-5 py-4">{deal.stock.availableQuantity}개<div className="text-xs text-slate-400">예약 {deal.stock.reservedQuantity} · 판매 {deal.stock.soldQuantity}</div></td><td className="px-5 py-4 text-xs">{new Date(deal.startAt).toLocaleString('ko-KR')}<br />~ {new Date(deal.endAt).toLocaleString('ko-KR')}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2">{deal.status === 'SCHEDULED' && <><button type="button" onClick={() => { setEditingId(deal.timeDealId); setEditName(deal.name); setEditDiscountRate(String(deal.discountRate)) }} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold">수정</button><label className="cursor-pointer rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">이미지 등록<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) mutations.uploadTimeDealImage.mutate({ timeDealId: deal.timeDealId, file }) }} /></label></>}{deal.status === 'ACTIVE' && <button type="button" onClick={() => mutations.stopTimeDeal.mutate(deal.timeDealId)} className="rounded-lg bg-orange-100 px-3 py-2 text-xs font-bold text-orange-700">중지</button>}{deal.status === 'SCHEDULED' && <button type="button" onClick={() => { if (window.confirm('이 타임딜을 삭제하시겠습니까?')) mutations.deleteTimeDeal.mutate(deal.timeDealId) }} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">삭제</button>}</div></td></tr>{editingId === deal.timeDealId && <tr><td colSpan={6} className="bg-slate-50 px-5 py-4"><form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); mutations.updateTimeDeal.mutate({ timeDealId: deal.timeDealId, input: { name: editName, discountRate: Number(editDiscountRate) } }, { onSuccess: () => setEditingId(null) }) }}><SellerFormField label="상품명"><input required value={editName} onChange={(event) => setEditName(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="할인율"><input required type="number" min="0" step="0.1" value={editDiscountRate} onChange={(event) => setEditDiscountRate(event.target.value)} className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><button className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">저장</button><button type="button" onClick={() => setEditingId(null)} className="rounded-lg bg-white px-3 py-2 text-xs font-bold">취소</button></form></td></tr>}</Fragment>)}</tbody></table></div>}
      {showCreate && <form className="grid gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); mutations.createTimeDealWithImage.mutate({ input: { name: form.name, description: form.description, productGrade: form.productGrade, origin: form.origin, harvestedDate: form.harvestedDate, originalPrice: Number(form.originalPrice), discountRate: Number(form.discountRate), startAt: new Date(form.startAt).toISOString(), endAt: new Date(form.endAt).toISOString(), maxPurchaseQuantity: Number(form.maxPurchaseQuantity), initialQuantity: Number(form.initialQuantity), lowStockThreshold: Number(form.lowStockThreshold) }, file: imageFile ?? undefined }, { onSuccess: (result) => { setSuccessMessage(`타임딜 생성이 완료되었습니다.${imageFile ? ' 이미지도 등록되었습니다.' : ''} 생성된 타임딜 ID: ${result.timeDealId}`); setImageFile(null); setForm((current) => ({ ...current, name: '', description: '', originalPrice: '', initialQuantity: '' })); setShowCreate(false) } }) }}>
        <div className="sm:col-span-2"><h3 className="font-bold text-slate-950">타임딜 등록</h3><p className="mt-1 text-xs text-slate-500">일반 상품과 연결하지 않는 독립 타임딜을 등록합니다.</p></div>
        <SellerFormField label="타임딜 상품명"><input required value={form.name} onChange={(event) => update('name', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="원산지"><input required value={form.origin} onChange={(event) => update('origin', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="타임딜 설명"><textarea value={form.description} onChange={(event) => update('description', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="상품 품질"><select value={form.productGrade} onChange={(event) => update('productGrade', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="NORMAL">일반 품질</option><option value="UGLY">못난이 상품</option></select></SellerFormField><SellerFormField label="수확일"><input required type="date" value={form.harvestedDate} onChange={(event) => update('harvestedDate', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="정가"><input required type="number" min="0" value={form.originalPrice} onChange={(event) => update('originalPrice', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="할인율"><input required type="number" min="0" step="0.1" value={form.discountRate} onChange={(event) => update('discountRate', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="초기 타임딜 재고"><input required type="number" min="1" value={form.initialQuantity} onChange={(event) => update('initialQuantity', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="최대 구매 수량"><input required type="number" min="1" value={form.maxPurchaseQuantity} onChange={(event) => update('maxPurchaseQuantity', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="재고 부족 기준"><input required type="number" min="0" value={form.lowStockThreshold} onChange={(event) => update('lowStockThreshold', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="판매 시작 일시"><input required type="datetime-local" value={form.startAt} onChange={(event) => update('startAt', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="판매 종료 일시"><input required type="datetime-local" value={form.endAt} onChange={(event) => update('endAt', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></SellerFormField><SellerFormField label="대표 이미지"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></SellerFormField>
        {mutations.createTimeDealWithImage.isError && <p className="sm:col-span-2 text-xs text-red-600">타임딜 또는 이미지 등록에 실패했습니다.</p>}<button disabled={mutations.createTimeDealWithImage.isPending} className="sm:col-span-2 rounded-lg bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">{mutations.createTimeDealWithImage.isPending ? '타임딜과 이미지 등록 중...' : '타임딜 생성하기'}</button>
      </form>}
    </section>
  )
}

function SellerTimeDealStockManagement() {
  const mutations = useSellerProductMutations()
  const stocksQuery = useSellerTimeDeals()
  const stocks = stocksQuery.data?.content ?? []
  const [editingId, setEditingId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('')
  const [stockMessage, setStockMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  return (
    <section className="mt-8 space-y-5">
      <div>
        <p className="text-sm font-bold text-orange-600">TIME DEAL STOCK</p>
        <h2 className="mt-2 font-bold text-slate-950">타임딜 재고 관리</h2>
        <p className="mt-1 text-sm text-slate-500">일반 상품 재고와 분리된 타임딜 판매 재고를 조정하는 영역입니다.</p>
      </div>
      {sellerMutationPending(mutations) && <SellerActionOverlay />}
      {stockMessage && <div role="status" className={`rounded-xl border px-4 py-3 text-sm font-semibold ${stockMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{stockMessage.text}</div>}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-950">타임딜별 재고 현황</h3>
          <p className="mt-1 text-xs text-slate-500">판매 가능·예약·판매 완료 수량을 타임딜 단위로 관리합니다.</p>
        </div>
        {stocksQuery.isPending && <div className="p-10 text-center text-sm text-slate-500">재고를 불러오는 중입니다.</div>}
        {stocksQuery.isError && <div className="p-10 text-center text-sm text-red-600">타임딜 재고를 불러오지 못했습니다.</div>}
        {!stocksQuery.isPending && !stocksQuery.isError && stocks.length === 0 && <div className="p-10 text-center text-sm text-slate-500">관리할 타임딜 재고가 없습니다.</div>}
        {stocks.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">타임딜 ID</th><th className="px-5 py-3">판매 가능</th><th className="px-5 py-3">예약</th><th className="px-5 py-3">판매 완료</th><th className="px-5 py-3">관리</th></tr></thead><tbody className="divide-y divide-slate-100">{stocks.map((deal) => <tr key={deal.timeDealId}><td className="px-5 py-4 font-mono text-xs">{deal.timeDealId}</td><td className="px-5 py-4">{deal.stock.availableQuantity}개</td><td className="px-5 py-4">{deal.stock.reservedQuantity}개</td><td className="px-5 py-4">{deal.stock.soldQuantity}개</td><td className="px-5 py-4">{editingId === deal.timeDealId ? <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setStockMessage(null); mutations.adjustTimeDealStock.mutate({ timeDealId: deal.timeDealId, quantity: Number(quantity) }, { onSuccess: () => { setEditingId(null); setStockMessage({ type: 'success', text: '타임딜 재고가 조정되었습니다.' }) }, onError: (error) => setStockMessage({ type: 'error', text: sellerActionErrorMessage(error, '타임딜 재고 조정에 실패했습니다. 조정 수량과 타임딜 상태를 확인해주세요.') }) }) }}><input required type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-1.5" /><button className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white">조정</button><button type="button" onClick={() => setEditingId(null)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold">취소</button></form> : <button type="button" onClick={() => { setEditingId(deal.timeDealId); setQuantity(''); setStockMessage(null) }} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold">재고 조정</button>}</td></tr>)}</tbody></table></div>}
      </div>
    </section>
  )
}

function DashboardLayout({ children, role }: { children: ReactNode; role: 'seller' | 'admin' }) {
  const seller = role === 'seller'
  const navigate = useNavigate()
  const links = seller
    ? [
        ['/seller', '대시보드'],
        ['/seller/products', '상품 관리'],
        ['/seller/stocks', '재고 관리'],
        ['/seller/time-deals', '타임딜 관리'],
        ['/seller/time-deals/stocks', '타임딜 재고 관리'],
        ['/seller/orders', '주문·배송'],
        ['/seller/settlements', '정산'],
      ]
    : [
        ['/admin', '운영 대시보드'],
        ['/admin/sellers', '판매자 승인'],
        ['/admin/products', '상품 운영'],
        ['/admin/orders', '주문·환불'],
        ['/admin/stocks', '재고 운영'],
        ['/admin/settlements', '정산 운영'],
      ]
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-5 sm:px-8">
          <Link to="/" className="text-xl font-black text-emerald-700">
            parut<span className="text-orange-500">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <StatusBadge tone={seller ? 'green' : 'blue'}>
              {seller ? 'SELLER' : 'ADMIN'}
            </StatusBadge>
            {seller ? (
              <>
                <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                  서비스 보기
                </Link>
                <button
                  type="button"
                  className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                  onClick={async () => {
                    await logout()
                    navigate('/seller/login')
                  }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                onClick={async () => {
                  await logout()
                  navigate('/admin/login')
                }}
              >
                로그아웃
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white px-4 py-8 md:block">
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            {seller ? 'Seller Center' : 'Admin Console'}
          </p>
          <nav className="mt-4 space-y-1">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === `/${role}` || to === '/seller/time-deals'}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  )
}

function DashboardPage({
  role,
  section = 'dashboard',
}: {
  role: 'seller' | 'admin'
  section?: string
}) {
  const seller = role === 'seller'
  const title =
    section === 'products'
      ? '상품 관리'
      : section === 'stocks'
        ? '재고 관리'
        : section === 'time-deals'
          ? '타임딜 관리'
          : section === 'time-deal-stocks'
            ? '타임딜 재고 관리'
        : section === 'orders'
          ? '주문·배송 관리'
          : section === 'sellers'
            ? '판매자 승인'
            : section === 'settlements'
              ? '정산 운영'
              : section === 'admin-products'
                ? '상품 운영'
                : section === 'admin-orders'
                  ? '주문·환불 운영'
                  : section === 'admin-stocks'
                    ? '재고 운영'
                    : seller
                      ? '판매자 대시보드'
                      : '운영 대시보드'
  const productRows = products.slice(0, 4)
  return (
    <DashboardLayout role={role}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-700">
            {seller ? 'SELLER CENTER' : 'ADMIN CONSOLE'}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {seller ? '내 상품과 주문을 한 곳에서 관리하세요.' : 'Parut 서비스의 운영 현황입니다.'}
          </p>
        </div>
        {section === 'products' && !seller && (
          <button
            type="button"
            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white"
          >
            상품 등록
          </button>
        )}
      </div>
      {section === 'dashboard' && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(seller
            ? [
                ['이번 달 주문', '128건', '지난달보다 12% 증가'],
                ['판매 중 상품', '24개', '3개 품절 임박'],
                ['배송 대기', '8건', '오늘 처리 필요'],
                ['이번 달 정산', '1,284,000원', '정산 예정'],
              ]
            : [
                ['전체 회원', '1,248명', '이번 주 42명 가입'],
                ['판매자 승인 대기', '7건', '확인 필요'],
                ['오늘 주문', '86건', '전일보다 8% 증가'],
                ['환불 요청', '3건', '처리 필요'],
              ]
          ).map(([label, value, note]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
              <p className="mt-2 text-xs text-emerald-700">{note}</p>
            </div>
          ))}
        </div>
      )}
      {seller && section === 'products' && <SellerProductManagement />}
      {seller && section === 'stocks' && <SellerStockManagement />}
      {seller && section === 'time-deals' && <SellerTimeDealManagement />}
      {seller && section === 'time-deal-stocks' && <SellerTimeDealStockManagement />}
      {seller && section === 'orders' && <SellerOrderManagement />}
      {!seller && (section === 'admin-products' || section === 'admin-stocks') && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold">{section.includes('stocks') ? '재고 현황' : '상품 목록'}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3">상품</th>
                  <th className="px-5 py-3">카테고리</th>
                  <th className="px-5 py-3">판매가</th>
                  <th className="px-5 py-3">재고</th>
                  <th className="px-5 py-3">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productRows.map((product) => (
                  <tr key={product.id}>
                    <td className="px-5 py-4 font-semibold text-slate-900">{product.name}</td>
                    <td className="px-5 py-4 text-slate-500">{product.category}</td>
                    <td className="px-5 py-4">{money(product.price)}</td>
                    <td className="px-5 py-4">{product.stock}개</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={product.stock < 10 ? 'orange' : 'green'}>
                        {product.stock < 10 ? '재고 임박' : '판매 중'}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {section === 'sellers' && (
        <AdminSellerApplications />
      )}
      {!seller && section === 'admin-orders' && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4 font-bold">최근 주문</div>
          {['P-20250918-001', 'P-20250918-002', 'P-20250917-031'].map((id, index) => (
            <div
              key={id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 last:border-0"
            >
              <div>
                <p className="font-bold">{id}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {['논산 설향 딸기 외 1건', '무농약 남해 시금치', '못난이 햇감자'][index]}
                </p>
              </div>
              <StatusBadge tone={index === 2 ? 'blue' : 'orange'}>
                {index === 2 ? '배송 중' : '처리 필요'}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

function deliveryStatusLabel(status: Delivery['status']) {
  return status === 'PREPARING' ? '상품 준비 중' : status === 'SHIPPED' ? '배송 중' : '배송 완료'
}

function deliveryStatusTone(status: Delivery['status']): 'green' | 'blue' | 'orange' {
  return status === 'PREPARING' ? 'orange' : status === 'SHIPPED' ? 'blue' : 'green'
}

function SellerOrderManagement() {
  const deliveriesQuery = useSellerDeliveries()
  const startDeliveryMutation = useStartDelivery()
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({})
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null)
  const deliveries = deliveriesQuery.data?.content ?? []

  const startDelivery = (delivery: Delivery) => {
    const trackingNumber = trackingNumbers[delivery.deliveryId]?.trim()
    if (!trackingNumber) return
    setActiveDeliveryId(delivery.deliveryId)
    startDeliveryMutation.mutate(
      { deliveryId: delivery.deliveryId, trackingNumber },
      { onSuccess: () => setTrackingNumbers((current) => ({ ...current, [delivery.deliveryId]: '' })) },
    )
  }

  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold">배송 작업 목록</h2>
          <p className="mt-1 text-sm text-slate-500">상품 준비가 끝난 주문에 운송장 번호를 입력하고 배송을 시작하세요.</p>
        </div>
        {deliveriesQuery.isPending ? (
          <SellerDeliverySkeleton />
        ) : deliveriesQuery.isError ? (
          <div className="px-5 py-12 text-center text-sm text-red-700">배송 목록을 불러오지 못했습니다.</div>
        ) : deliveries.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">처리할 배송이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3">배송 ID</th>
                  <th className="px-5 py-3">배송그룹 ID</th>
                  <th className="px-5 py-3">상태</th>
                  <th className="px-5 py-3">운송장 번호</th>
                  <th className="px-5 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((delivery) => {
                  const isStarting = activeDeliveryId === delivery.deliveryId && startDeliveryMutation.isPending
                  return (
                    <tr key={delivery.deliveryId}>
                      <td className="px-5 py-4 font-mono text-xs">{delivery.deliveryId}</td>
                      <td className="px-5 py-4 font-mono text-xs">{delivery.deliveryGroupId}</td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={deliveryStatusTone(delivery.status)}>
                          {deliveryStatusLabel(delivery.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-4">{delivery.trackingNumber ?? '-'}</td>
                      <td className="px-5 py-4">
                        {delivery.status === 'PREPARING' ? (
                          <form
                            className="flex min-w-[280px] gap-2"
                            onSubmit={(event) => {
                              event.preventDefault()
                              startDelivery(delivery)
                            }}
                          >
                            <input
                              required
                              value={trackingNumbers[delivery.deliveryId] ?? ''}
                              onChange={(event) =>
                                setTrackingNumbers((current) => ({
                                  ...current,
                                  [delivery.deliveryId]: event.target.value,
                                }))
                              }
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              placeholder="운송장 번호"
                            />
                            <button
                              type="submit"
                              disabled={isStarting}
                              className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300"
                            >
                              {isStarting ? '처리 중' : '배송 시작'}
                            </button>
                          </form>
                        ) : (
                          <span className="text-slate-400">처리 완료</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {startDeliveryMutation.isError && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          배송 시작에 실패했습니다. 운송장 번호와 배송 상태를 확인해주세요.
        </p>
      )}
    </section>
  )
}

function SellerDeliverySkeleton() {
  return (
    <div className="space-y-3 p-5" aria-label="배송 목록을 불러오는 중입니다.">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}

function sellerStatusLabel(status: SellerStatus) {
  return status === 'PENDING' ? '승인 대기' : status === 'APPROVED' ? '승인 완료' : '반려'
}

function sellerStatusTone(status: SellerStatus) {
  return status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange'
}

function formatApplicationDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR')
}

function AdminSellerApplications() {
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const applicationsQuery = useSellerApplications(submittedKeyword, page)
  const processMutation = useProcessSellerApplication()
  const applications = applicationsQuery.data?.content ?? []
  const pageInfo = applicationsQuery.data?.pageInfo

  const process = (application: SellerApplication, status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !rejectReason.trim()) return
    processMutation.mutate(
      {
        applicationId: application.id,
        input: {
          status,
          ...(status === 'REJECTED' ? { rejectReason: rejectReason.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          setRejectingId(null)
          setRejectReason('')
        },
      },
    )
  }

  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-950">판매자 신청 목록</h2>
            <p className="mt-1 text-sm text-slate-500">
              신청 정보를 확인하고 판매자 입점을 승인하거나 반려할 수 있습니다.
            </p>
          </div>
          <form
            className="flex w-full gap-2 sm:w-auto"
            onSubmit={(event) => {
              event.preventDefault()
              setPage(0)
              setSubmittedKeyword(keyword.trim())
            }}
          >
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 sm:w-56"
              placeholder="업체명·담당자 검색"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
            >
              검색
            </button>
          </form>
        </div>
      </div>

      {applicationsQuery.isPending && (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      )}

      {applicationsQuery.isError && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          판매자 신청 목록을 불러오지 못했습니다. 관리자 로그인 상태와 백엔드 연결을 확인해주세요.
        </div>
      )}

      {!applicationsQuery.isPending && !applicationsQuery.isError && applications.length === 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {submittedKeyword ? '검색 결과가 없습니다.' : '판매자 신청이 없습니다.'}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {applications.map((application) => (
          <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-950">{application.companyName}</h3>
                  <StatusBadge tone={sellerStatusTone(application.status) as 'green' | 'orange' | 'red'}>
                    {sellerStatusLabel(application.status)}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  대표 {application.repName} · 사업자등록번호 {application.bizRegNo}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  신청자 {application.managerName} · {application.managerPhone} · {application.loginId}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {application.bizAddress} · 신청일 {formatApplicationDate(application.createdAt)}
                </p>
              </div>
              {application.status === 'PENDING' && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={processMutation.isPending}
                    onClick={() => process(application, 'APPROVED')}
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    disabled={processMutation.isPending}
                    onClick={() => {
                      setRejectingId(rejectingId === application.id ? null : application.id)
                      setRejectReason('')
                    }}
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    반려
                  </button>
                </div>
              )}
            </div>
            {rejectingId === application.id && (
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                <input
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400"
                  placeholder="반려 사유를 입력해주세요."
                />
                <button
                  type="button"
                  disabled={!rejectReason.trim() || processMutation.isPending}
                  onClick={() => process(application, 'REJECTED')}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  반려 확정
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {pageInfo && pageInfo.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-slate-500">
            {pageInfo.page + 1} / {pageInfo.totalPages}
          </span>
          <button
            type="button"
            disabled={pageInfo.last}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </section>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/time-deals" element={<ProductsPage timeDeals />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/time-deals/:productId" element={<ProductDetailPage timeDeal />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:orderId" element={<OrderDetailPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/admin/login" element={<AuthPage />} />
      <Route path="/seller/login" element={<SellerLoginPage />} />
      <Route path="/seller/apply" element={<SellerApplyPage />} />
      <Route path="/seller" element={<SellerAccessPage />} />
      <Route path="/seller/products" element={<SellerAccessPage section="products" />} />
      <Route path="/seller/stocks" element={<SellerAccessPage section="stocks" />} />
      <Route path="/seller/time-deals" element={<SellerAccessPage section="time-deals" />} />
      <Route path="/seller/time-deals/stocks" element={<SellerAccessPage section="time-deal-stocks" />} />
      <Route path="/seller/orders" element={<SellerAccessPage section="orders" />} />
      <Route
        path="/seller/settlements"
        element={<SellerAccessPage section="settlements" />}
      />
      <Route path="/admin" element={<DashboardPage role="admin" />} />
      <Route path="/admin/sellers" element={<DashboardPage role="admin" section="sellers" />} />
      <Route
        path="/admin/products"
        element={<DashboardPage role="admin" section="admin-products" />}
      />
      <Route path="/admin/orders" element={<DashboardPage role="admin" section="admin-orders" />} />
      <Route path="/admin/stocks" element={<DashboardPage role="admin" section="admin-stocks" />} />
      <Route
        path="/admin/settlements"
        element={<DashboardPage role="admin" section="settlements" />}
      />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}

export default App
