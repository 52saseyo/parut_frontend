import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adjustTimeDealStock,
  convertProductToTimeDeal,
  createSellerProduct,
  createTimeDeal,
  createTimeDealWithImage,
  deleteSellerProduct,
  getSellerProduct,
  getSellerProducts,
  getSellerStocks,
  getSellerTimeDealStock,
  getSellerTimeDeals,
  uploadTimeDealImage,
  uploadProductImage,
  updateSellerProduct,
  updateSellerProductStatus,
  updateSellerStock,
  updateSellerTimeDeal,
  deleteSellerTimeDeal,
  stopSellerTimeDeal,
  transferTimeDealStock,
  type AppearanceType,
  type CreateProductInput,
  type ProductCategory,
  type ProductStatus,
  type TimeDealConvertInput,
  type TimeDealCreateInput,
  type SellerTimeDealCursorParams,
  type SellerTimeDealUpdateInput,
  type UpdateProductInput,
} from './api'

export const sellerProductKeys = {
  all: ['seller-products'] as const,
  list: (params: object) => ['seller-products', 'list', params] as const,
  detail: (id: string) => ['seller-products', 'detail', id] as const,
  stocks: (page: number) => ['seller-products', 'stocks', page] as const,
  timeDeals: (params: SellerTimeDealCursorParams) => ['seller-products', 'time-deals', params] as const,
  timeDealStock: (timeDealId: string) => ['seller-products', 'time-deal-stock', timeDealId] as const,
}

export function useSellerProducts(params: {
  page?: number
  keyword?: string
  category?: ProductCategory
  status?: ProductStatus
  appearanceType?: AppearanceType
  size?: number
}, enabled = true) {
  return useQuery({
    queryKey: sellerProductKeys.list(params),
    queryFn: () => getSellerProducts(params),
    enabled,
  })
}

export function useSellerProduct(productId: string | undefined) {
  return useQuery({
    queryKey: sellerProductKeys.detail(productId ?? ''),
    queryFn: () => getSellerProduct(productId ?? ''),
    enabled: Boolean(productId),
  })
}

export function useSellerStocks(page = 1, size: 10 | 30 | 50 = 10) {
  return useQuery({
    queryKey: ['seller-products', 'stocks', page, size],
    queryFn: () => getSellerStocks({ page, size }),
  })
}

export function useSellerTimeDeals(params: SellerTimeDealCursorParams = {}) {
  return useQuery({
    queryKey: sellerProductKeys.timeDeals(params),
    queryFn: () => getSellerTimeDeals(params),
  })
}

export function useSellerTimeDealStock(timeDealId: string | undefined) {
  return useQuery({
    queryKey: sellerProductKeys.timeDealStock(timeDealId ?? ''),
    queryFn: () => getSellerTimeDealStock(timeDealId ?? ''),
    enabled: Boolean(timeDealId),
  })
}

export function useSellerProductMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: sellerProductKeys.all })
  }
  return {
    create: useMutation({ mutationFn: (input: CreateProductInput) => createSellerProduct(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ productId, input }: { productId: string; input: UpdateProductInput }) => updateSellerProduct(productId, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (productId: string) => deleteSellerProduct(productId), onSuccess: invalidate }),
    updateStatus: useMutation({ mutationFn: ({ productId, status }: { productId: string; status: ProductStatus }) => updateSellerProductStatus(productId, status), onSuccess: invalidate }),
    updateStock: useMutation({ mutationFn: ({ productId, totalQuantity }: { productId: string; totalQuantity: number }) => updateSellerStock(productId, totalQuantity), onSuccess: invalidate }),
    uploadImage: useMutation({ mutationFn: ({ productId, file }: { productId: string; file: File }) => uploadProductImage(productId, file), onSuccess: invalidate }),
    createTimeDeal: useMutation({ mutationFn: (input: TimeDealCreateInput) => createTimeDeal(input), onSuccess: invalidate }),
    createTimeDealWithImage: useMutation({ mutationFn: ({ input, file }: { input: TimeDealCreateInput; file?: File }) => createTimeDealWithImage(input, file), onSuccess: invalidate }),
    convert: useMutation({ mutationFn: (input: TimeDealConvertInput) => convertProductToTimeDeal(input), onSuccess: invalidate }),
    adjustTimeDealStock: useMutation({ mutationFn: ({ timeDealId, quantity }: { timeDealId: string; quantity: number }) => adjustTimeDealStock(timeDealId, quantity), onSuccess: invalidate }),
    updateTimeDeal: useMutation({ mutationFn: ({ timeDealId, input }: { timeDealId: string; input: SellerTimeDealUpdateInput }) => updateSellerTimeDeal(timeDealId, input), onSuccess: invalidate }),
    deleteTimeDeal: useMutation({ mutationFn: (timeDealId: string) => deleteSellerTimeDeal(timeDealId), onSuccess: invalidate }),
    stopTimeDeal: useMutation({ mutationFn: (timeDealId: string) => stopSellerTimeDeal(timeDealId), onSuccess: invalidate }),
    transferTimeDealStock: useMutation({ mutationFn: ({ timeDealId, productId, quantity }: { timeDealId: string; productId: string; quantity: number }) => transferTimeDealStock(timeDealId, productId, quantity), onSuccess: invalidate }),
    uploadTimeDealImage: useMutation({ mutationFn: ({ timeDealId, file }: { timeDealId: string; file: File }) => uploadTimeDealImage(timeDealId, file), onSuccess: invalidate }),
  }
}
