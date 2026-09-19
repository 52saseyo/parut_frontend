import { useState, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { login, signup } from './features/auth/api'
import { useCreateOrder, useOrder, usePreparePayment } from './features/orders/hooks'
import type { ApiProduct, ApiProductDetail } from './features/products/api'
import { useProduct, useProducts } from './features/products/hooks'
import { useRequestRefund } from './features/refunds/hooks'
import type { ApiTimeDeal } from './features/timedeals/api'
import { useTimeDeal, useTimeDeals } from './features/timedeals/hooks'

type Product = {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  unit: string
  stock: number
  seller: string
  emoji: string
  accent: string
  timeDeal?: boolean
  endsAt?: string
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
    name: product.name,
    category,
    price: product.price,
    unit: '상품 단위',
    stock: 'availableQuantity' in product ? product.availableQuantity : 0,
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
    name: timeDeal.name,
    category: '타임딜',
    price: timeDeal.dealPrice,
    originalPrice: timeDeal.originalPrice,
    unit: '상품 단위',
    stock: timeDeal.stock.availableQuantity,
    seller: timeDeal.origin,
    emoji: timeDeal.productGrade === 'UGLY' ? '🥕' : '🍓',
    accent:
      timeDeal.productGrade === 'UGLY'
        ? 'from-orange-200 to-amber-100'
        : 'from-rose-200 to-red-100',
    timeDeal: true,
    endsAt: new Date(timeDeal.endAt).toLocaleString('ko-KR'),
  }
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

function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div
      className={`relative flex ${large ? 'h-80' : 'h-48'} items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${product.accent}`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/30" />
      <span className={`${large ? 'text-8xl' : 'text-6xl'} drop-shadow-sm`}>{product.emoji}</span>
      {product.timeDeal && (
        <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white">
          TIME DEAL
        </span>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
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
            <span className="text-xs font-bold text-orange-600">{product.endsAt}</span>
          )}
        </div>
        <h3 className="mt-1 truncate font-semibold text-slate-900 group-hover:text-emerald-700">
          {product.name}
        </h3>
        <p className="mt-2 text-lg font-bold text-slate-950">{money(product.price)}</p>
        <p className="mt-1 text-xs text-slate-500">
          {product.unit} · {product.seller}
        </p>
      </div>
    </Link>
  )
}

function Header() {
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
          <Link
            to="/login"
            className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700"
          >
            로그인
          </Link>
          <Link
            to="/checkout"
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
        <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
              Fresh market, fair price
            </p>
            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">
              오늘의 식탁을
              <br />
              <span className="text-emerald-700">파릇하게</span> 채우는 방법
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              산지의 신선함은 그대로, 필요한 만큼만 합리적으로. 믿을 수 있는 농수산물을 만나보세요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800"
              >
                상품 둘러보기
              </Link>
              <Link
                to="/time-deals"
                className="rounded-xl bg-orange-100 px-5 py-3.5 text-sm font-bold text-orange-700 hover:bg-orange-200"
              >
                마감 임박 타임딜
              </Link>
            </div>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-[2rem] bg-emerald-100 p-8 sm:min-h-96">
            <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/40" />
            <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-orange-200/60" />
            <div className="relative flex h-full flex-col justify-between">
              <span className="w-fit rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-emerald-800">
                이번 주 추천
              </span>
              <div className="py-8 text-center text-8xl drop-shadow-sm sm:text-9xl">🥕🥬🍓</div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">못난이도 맛은 그대로</p>
                <p className="mt-1 text-2xl font-black text-emerald-950">알뜰한 제철 장보기</p>
              </div>
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
            {deals.length > 0 ? (
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
  const categories = ['전체', '채소', '과일', '곡물']
  const productQuery = useProducts(
    {
      category: category === '전체' ? undefined : categoryMap[category],
      size: 10,
    },
    !timeDeals,
  )
  const timeDealQuery = useTimeDeals({ status: 'ACTIVE', size: 10 }, timeDeals)
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
            {((!timeDeals && productQuery.isError) || (timeDeals && timeDealQuery.isError)) && (
              <p className="mt-3 text-xs text-orange-600">
                목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            )}
          </div>
          {!timeDeals && (
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
          {filtered.length > 0 ? (
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
  const isLoading = productQuery.isLoading || timeDealQuery.isLoading
  const isError = productQuery.isError || timeDealQuery.isError
  if (!product && (isLoading || isError)) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
          <p className="text-sm text-slate-500">
            {isLoading ? '상품 정보를 불러오는 중입니다.' : '상품 정보를 불러오지 못했습니다.'}
          </p>
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
              <StatusBadge tone={product.stock > 0 ? 'green' : 'red'}>
                {product.stock > 0 ? '판매 중' : '품절'}
              </StatusBadge>
              {product.timeDeal && <StatusBadge tone="orange">타임딜</StatusBadge>}
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
                  <span>딜 종료까지</span>
                  <strong className="text-orange-600">{product.endsAt}</strong>
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span className="text-sm font-semibold text-slate-700">수량</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 rounded-lg bg-white text-lg ring-1 ring-slate-200"
                >
                  −
                </button>
                <span className="w-5 text-center font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="h-8 w-8 rounded-lg bg-white text-lg ring-1 ring-slate-200"
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout', { state: { productId: product.id, quantity } })}
              className="mt-5 w-full rounded-xl bg-emerald-700 px-5 py-4 text-sm font-bold text-white hover:bg-emerald-800"
            >
              {money(product.price * quantity)} 주문하기
            </button>
          </div>
        </div>
      </main>
    </PublicLayout>
  )
}

function OrdersPage() {
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
        {orderQuery.isError && (
          <p className="mt-4 text-xs text-orange-600">
            주문 API 응답이 없어 임시 주문 상세를 표시하고 있습니다.
          </p>
        )}
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
              {refundMutation.isPending ? '환불 요청 중...' : '환불 요청'}
            </button>
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
  const paymentMutation = usePreparePayment()
  const state = location.state as { productId?: string; quantity?: number } | null
  const product = products.find((item) => item.id === state?.productId) ?? products[0]
  const quantity = state?.quantity ?? 1
  const [recipient, setRecipient] = useState({
    recipientName: '파릇 고객',
    recipientPhone: '010-0000-0000',
    zipCode: '00000',
    addressBase: '서울시 파릇구 파릇로 1',
    addressDetail: '',
    deliveryRequest: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [apiOrderNo, setApiOrderNo] = useState<string | null>(null)

  async function submitOrder() {
    const isUuid = Boolean(state?.productId && /^[0-9a-f-]{36}$/i.test(state.productId))
    if (!isUuid) {
      setSubmitted(true)
      return
    }

    const created = await orderMutation.mutateAsync({
      items: [{ productId: state?.productId as string, quantity }],
      recipient,
    })
    await paymentMutation.mutateAsync({ orderId: created.orderId, paymentMethod: 'TOSS_PAY' })
    setApiOrderNo(created.orderNo)
    setSubmitted(true)
  }

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
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-rose-100 text-4xl">
                  🍓
                </div>
                <div>
                  <p className="font-bold">논산 설향 딸기</p>
                  <p className="mt-1 text-sm text-slate-500">500g · 1개</p>
                </div>
                <strong className="ml-auto">12,900원</strong>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold">배송 정보</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="받는 분"
                  value={recipient.recipientName}
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
                  className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="배송 주소"
                  value={recipient.addressBase}
                  onChange={(event) =>
                    setRecipient({ ...recipient, addressBase: event.target.value })
                  }
                />
              </div>
            </div>
          </section>
          <aside className="h-fit rounded-2xl bg-slate-950 p-6 text-white">
            <h2 className="font-bold">결제 요약</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>상품 금액</span>
                <span>{money(product.price * quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span>3,000원</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                <span>총 결제 금액</span>
                <span>{money(product.price * quantity + 3000)}</span>
              </div>
            </div>
            {(orderMutation.isError || paymentMutation.isError) && (
              <p className="mt-4 text-xs text-red-300">
                주문 또는 결제 준비에 실패했습니다. 로그인 상태와 백엔드 응답을 확인해주세요.
              </p>
            )}
            <button
              type="button"
              disabled={orderMutation.isPending || paymentMutation.isPending}
              onClick={() => void submitOrder()}
              className="mt-7 w-full rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-black text-emerald-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {orderMutation.isPending || paymentMutation.isPending
                ? '주문 처리 중...'
                : `${money(product.price * quantity + 3000)} 결제 준비`}
            </button>
          </aside>
        </div>
      </main>
    </PublicLayout>
  )
}

function AuthPage() {
  const location = useLocation()
  const isSignup = location.pathname === '/signup'
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', name: '' })
  const mutation = useMutation({
    mutationFn: async () => {
      if (isSignup) {
        await signup({ username: form.username, password: form.password, name: form.name })
        return null
      }
      return login({ username: form.username, password: form.password })
    },
    onSuccess: () => navigate(isSignup ? '/login' : '/'),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-50 px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl shadow-emerald-900/5 sm:p-10">
        <Link to="/" className="text-xl font-black text-emerald-700">
          parut<span className="text-orange-500">.</span>
        </Link>
        <h1 className="mt-10 text-3xl font-black">{isSignup ? '파릇한 시작' : '다시 만나요'}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {isSignup ? '파릇 서비스에 가입해보세요.' : '파릇한 장보기를 시작해보세요.'}
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
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
              placeholder="이름"
            />
          )}
          <input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
            placeholder="아이디"
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
              요청에 실패했습니다. 백엔드 연결과 입력값을 확인해주세요.
            </p>
          )}
          <button
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? '처리 중...' : isSignup ? '회원가입' : '로그인'}
          </button>
        </form>
        <div className="mt-6 flex justify-between text-xs text-slate-500">
          <Link to={isSignup ? '/login' : '/signup'} className="hover:text-emerald-700">
            {isSignup ? '로그인으로 돌아가기' : '회원가입'}
          </Link>
          <Link to="/seller" className="hover:text-emerald-700">
            판매자 센터 미리보기
          </Link>
        </div>
      </div>
    </div>
  )
}

function DashboardLayout({ children, role }: { children: ReactNode; role: 'seller' | 'admin' }) {
  const seller = role === 'seller'
  const links = seller
    ? [
        ['/seller', '대시보드'],
        ['/seller/products', '상품 관리'],
        ['/seller/stocks', '재고 관리'],
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
            <Link to="/" className="text-sm font-semibold text-slate-500">
              서비스 보기
            </Link>
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
                end={to === `/${role}`}
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
        {section === 'products' && (
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
      {(section === 'products' ||
        section === 'admin-products' ||
        section === 'stocks' ||
        section === 'admin-stocks') && (
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
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4 font-bold">판매자 승인 대기</div>
          {['산들바다 수산', '시골한상', '푸른들 농장'].map((name) => (
            <div
              key={name}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 last:border-0"
            >
              <div>
                <p className="font-bold">{name}</p>
                <p className="mt-1 text-xs text-slate-500">입점 신청 · 2025.09.18</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                >
                  승인
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  검토
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(section === 'orders' || section === 'admin-orders') && (
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/time-deals" element={<ProductsPage timeDeals />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/time-deals/:productId" element={<ProductDetailPage timeDeal />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:orderId" element={<OrderDetailPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/seller" element={<DashboardPage role="seller" />} />
      <Route path="/seller/products" element={<DashboardPage role="seller" section="products" />} />
      <Route path="/seller/stocks" element={<DashboardPage role="seller" section="stocks" />} />
      <Route path="/seller/orders" element={<DashboardPage role="seller" section="orders" />} />
      <Route
        path="/seller/settlements"
        element={<DashboardPage role="seller" section="settlements" />}
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
