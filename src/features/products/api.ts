import { apiClient, type ApiResponse } from '../../lib/api'

export type ProductCategory = 'VEGETABLE' | 'FRUIT' | 'GRAIN' | 'ETC'
export type AppearanceType = 'NORMAL' | 'UGLY'

export type ApiProduct = {
  productId: string
  name: string
  category: ProductCategory
  price: number
  appearanceType: AppearanceType
  origin: string
}

export type ApiProductDetail = ApiProduct & {
  description: string
  harvestDate: string
  saleUnit: 'G' | 'KG' | 'EA' | 'BOX'
  unitQuantity: number
  status: 'DRAFT' | 'ON_SALE' | 'SOLD_OUT' | 'SUSPENDED' | 'DELETED'
  availableQuantity: number
  imageUrl: string | null
}

export type CursorResponse<T> = {
  content: T[]
  pageInfo: {
    nextCursor: string | null
    nextIdAfter: string | null
    hasNext: boolean
    sortBy: string
    sortDirection: 'asc' | 'desc'
  }
}

export type ProductSearchParams = {
  keyword?: string
  category?: ProductCategory
  appearanceType?: AppearanceType
  status?: string
  minPrice?: number
  maxPrice?: number
  size?: number
  sort?: string
  direction?: 'asc' | 'desc'
  cursor?: string
  cursorId?: string
}

export async function getProducts(params: ProductSearchParams = {}) {
  const response = await apiClient.get<ApiResponse<CursorResponse<ApiProduct>>>(
    '/api/v1/products',
    { params },
  )
  return response.data.data
}

export async function getProduct(productId: string) {
  const response = await apiClient.get<ApiResponse<ApiProductDetail>>(
    `/api/v1/products/${productId}`,
  )
  return response.data.data
}
