import axios from 'axios'
import { apiClient, type ApiResponse } from '../../lib/api'

export type ProductCategory = 'VEGETABLE' | 'FRUIT' | 'GRAIN' | 'ETC'
export type AppearanceType = 'NORMAL' | 'UGLY'
export type ProductStatus = 'DRAFT' | 'ON_SALE' | 'SOLD_OUT' | 'SUSPENDED' | 'DELETED'
export type SaleUnit = 'G' | 'KG' | 'EA' | 'BOX'

export type SellerProductListItem = {
  productId: string
  name: string
  category: ProductCategory
  price: number
  status: ProductStatus
  imageUrl?: string | null
}

export type SellerProductDetail = SellerProductListItem & {
  description: string | null
  appearanceType: AppearanceType
  origin: string
  harvestDate: string
  saleUnit: SaleUnit
  unitQuantity: number
  stockId: string
  totalQuantity: number
  availableQuantity: number
  lowStockThreshold: number
  stockStatus: string
  url: string | null
}

export type OffsetPage<T> = {
  content: T[]
  pageInfo: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    last: boolean
  }
}

export type CreateProductInput = {
  category: ProductCategory
  name: string
  description?: string
  price: number
  appearanceType: AppearanceType
  origin: string
  harvestDate: string
  saleUnit: SaleUnit
  unitQuantity: number
  totalQuantity: number
  lowStockThreshold: number
  imageId?: string
}

export type UpdateProductInput = Partial<
  Omit<CreateProductInput, 'totalQuantity' | 'lowStockThreshold' | 'imageId'>
>

export type TimeDealCreateInput = {
  name: string
  description?: string
  productGrade: 'NORMAL' | 'UGLY'
  origin: string
  harvestedDate: string
  originalPrice: number
  discountRate: number
  startAt: string
  endAt: string
  maxPurchaseQuantity: number
  initialQuantity: number
  lowStockThreshold: number
}

export type TimeDealConvertInput = {
  productId: string
  quantity: number
  discountRate: number
  startAt: string
  endAt: string
  maxPurchaseQuantity: number
  lowStockThreshold: number
}

export type SellerTimeDeal = {
  timeDealId: string
  productId: string | null
  sellerId: string
  imageUrl: string | null
  name: string
  description: string
  productGrade: 'NORMAL' | 'UGLY'
  origin: string
  harvestedDate: string
  originalPrice: number
  discountRate: number
  dealPrice: number
  startAt: string
  endAt: string
  maxPurchaseQuantity: number
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'STOPPED'
  stock: {
    availableQuantity: number
    reservedQuantity: number
    soldQuantity: number
    lowStockThreshold: number
  }
}

export type SellerTimeDealUpdateInput = Partial<
  Pick<
    TimeDealCreateInput,
    | 'name'
    | 'description'
    | 'productGrade'
    | 'origin'
    | 'harvestedDate'
    | 'originalPrice'
    | 'discountRate'
    | 'startAt'
    | 'endAt'
    | 'maxPurchaseQuantity'
  >
>

export type SellerTimeDealStock = {
  timeDealId: string
  availableQuantity: number
  reservedQuantity: number
  soldQuantity: number
  lowStockThreshold: number
}

export type SellerTimeDealCursorParams = {
  cursor?: string
  cursorId?: string
  size?: 10 | 30 | 50
}

export async function getSellerProducts(params: {
  page?: number
  size?: number
  keyword?: string
  category?: ProductCategory
  status?: ProductStatus
  appearanceType?: AppearanceType
}) {
  const response = await apiClient.get<ApiResponse<OffsetPage<SellerProductListItem>>>(
    '/api/v1/seller/products',
    { params: { page: 1, size: 10, direction: 'desc', ...params } },
  )
  return response.data.data
}

export async function getSellerProduct(productId: string) {
  const response = await apiClient.get<ApiResponse<SellerProductDetail>>(
    `/api/v1/seller/products/${productId}`,
  )
  return response.data.data
}

export async function createSellerProduct(input: CreateProductInput) {
  const response = await apiClient.post<ApiResponse<{ productId: string; status: ProductStatus }>>(
    '/api/v1/seller/products',
    input,
  )
  return response.data.data
}

export async function updateSellerProduct(productId: string, input: UpdateProductInput) {
  const response = await apiClient.patch<ApiResponse<{ productId: string; status: ProductStatus }>>(
    `/api/v1/seller/products/${productId}`,
    input,
  )
  return response.data.data
}

export async function deleteSellerProduct(productId: string) {
  await apiClient.delete<ApiResponse<null>>(`/api/v1/seller/products/${productId}`)
}

export async function updateSellerProductStatus(productId: string, status: ProductStatus) {
  const response = await apiClient.patch<ApiResponse<{ productId: string; status: ProductStatus }>>(
    `/api/v1/seller/products/${productId}/status`,
    { status },
  )
  return response.data.data
}

export async function getSellerStocks(params: { page?: number; size?: 10 | 30 | 50 } = {}) {
  const response = await apiClient.get<ApiResponse<OffsetPage<SellerStock>>>('/api/v1/stocks', {
    params: { page: 1, size: 10, sort: 'createdAt', direction: 'desc', ...params },
  })
  return response.data.data
}

export type SellerStock = {
  stockId: string
  productId: string
  totalQuantity: number
  availableQuantity: number
  status: string
}

export async function updateSellerStock(productId: string, totalQuantity: number) {
  const response = await apiClient.patch<ApiResponse<SellerStock>>(`/api/v1/stocks/${productId}`, {
    totalQuantity,
  })
  return response.data.data
}

export async function uploadProductImage(productId: string, file: File) {
  const image = await uploadImage(file)

  await apiClient.post<ApiResponse<null>>(`/api/v1/seller/products/${productId}/images`, {
    imageId: image.imageId,
  })
  return image
}

export async function uploadImage(file: File) {
  const uploadResponse = await apiClient.post<
    ApiResponse<{ imageKey: string; uploadUrl: string }>
  >('/api/v1/images/presigned-url', {
    contentType: file.type,
    fileSize: file.size,
  })
  const { imageKey, uploadUrl } = uploadResponse.data.data

  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
  })

  const completeResponse = await apiClient.post<ApiResponse<{ imageId: string; imageUrl: string }>>(
    '/api/v1/images/complete',
    { imageKey, originalName: file.name },
  )
  return completeResponse.data.data
}

export async function uploadTimeDealImage(timeDealId: string, file: File) {
  const image = await uploadImage(file)
  await apiClient.post<ApiResponse<null>>(`/api/v1/seller/timed-deals/${timeDealId}/images`, {
    imageId: image.imageId,
  })
  return image
}

export async function createTimeDeal(input: TimeDealCreateInput) {
  const response = await apiClient.post<ApiResponse<{ timeDealId: string; status: string }>>(
    '/api/v1/seller/timed-deals',
    input,
  )
  return response.data.data
}

export async function createTimeDealWithImage(input: TimeDealCreateInput, file?: File) {
  const timeDeal = await createTimeDeal(input)
  if (file) await uploadTimeDealImage(timeDeal.timeDealId, file)
  return timeDeal
}

export async function convertProductToTimeDeal(input: TimeDealConvertInput) {
  const response = await apiClient.post<ApiResponse<{ timeDealId: string; productId: string; status: string }>>(
    '/api/v1/seller/timed-deals/conversions',
    input,
  )
  return response.data.data
}

export async function adjustTimeDealStock(timeDealId: string, quantity: number) {
  const response = await apiClient.patch<ApiResponse<unknown>>(
    `/api/v1/seller/timed-deals/${timeDealId}/stock`,
    { quantity },
  )
  return response.data.data
}

export async function getSellerTimeDeals(params: SellerTimeDealCursorParams = {}) {
  const response = await apiClient.get<
    ApiResponse<import('../products/api').CursorResponse<SellerTimeDeal>>
  >('/api/v1/seller/timed-deals', { params: { size: 10, ...params } })
  return response.data.data
}

export async function updateSellerTimeDeal(
  timeDealId: string,
  input: SellerTimeDealUpdateInput,
) {
  const response = await apiClient.patch<
    ApiResponse<{ timeDealId: string; status: SellerTimeDeal['status']; updatedAt: string }>
  >(`/api/v1/seller/timed-deals/${timeDealId}`, input)
  return response.data.data
}

export async function deleteSellerTimeDeal(timeDealId: string) {
  await apiClient.delete<ApiResponse<null>>(`/api/v1/seller/timed-deals/${timeDealId}`)
}

export async function stopSellerTimeDeal(timeDealId: string) {
  const response = await apiClient.patch<
    ApiResponse<{ timeDealId: string; status: 'STOPPED' }>
  >(`/api/v1/seller/timed-deals/${timeDealId}/stop`)
  return response.data.data
}

export async function getSellerTimeDealStock(timeDealId: string) {
  const response = await apiClient.get<ApiResponse<SellerTimeDealStock>>(
    `/api/v1/seller/timed-deals/${timeDealId}/stock`,
  )
  return response.data.data
}

export async function transferTimeDealStock(
  timeDealId: string,
  productId: string,
  quantity: number,
) {
  const response = await apiClient.post<ApiResponse<unknown>>(
    `/api/v1/seller/timed-deals/${timeDealId}/stock/transfer`,
    { productId, quantity },
  )
  return response.data.data
}
