import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adjustTimeDealStock,
  convertProductToTimeDeal,
  createSellerProduct,
  createTimeDeal,
  getSellerProduct,
  getSellerProducts,
  getSellerStocks,
  uploadProductImage,
  updateSellerProduct,
  updateSellerProductStatus,
  updateSellerStock,
  type AppearanceType,
  type CreateProductInput,
  type ProductCategory,
  type ProductStatus,
  type TimeDealConvertInput,
  type TimeDealCreateInput,
  type UpdateProductInput,
} from './api'

export const sellerProductKeys = {
  all: ['seller-products'] as const,
  list: (params: object) => ['seller-products', 'list', params] as const,
  detail: (id: string) => ['seller-products', 'detail', id] as const,
  stocks: (page: number) => ['seller-products', 'stocks', page] as const,
}

export function useSellerProducts(params: {
  page?: number
  keyword?: string
  category?: ProductCategory
  status?: ProductStatus
  appearanceType?: AppearanceType
}) {
  return useQuery({
    queryKey: sellerProductKeys.list(params),
    queryFn: () => getSellerProducts(params),
  })
}

export function useSellerProduct(productId: string | undefined) {
  return useQuery({
    queryKey: sellerProductKeys.detail(productId ?? ''),
    queryFn: () => getSellerProduct(productId ?? ''),
    enabled: Boolean(productId),
  })
}

export function useSellerStocks(page = 1) {
  return useQuery({
    queryKey: sellerProductKeys.stocks(page),
    queryFn: () => getSellerStocks({ page }),
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
    updateStatus: useMutation({ mutationFn: ({ productId, status }: { productId: string; status: ProductStatus }) => updateSellerProductStatus(productId, status), onSuccess: invalidate }),
    updateStock: useMutation({ mutationFn: ({ productId, totalQuantity }: { productId: string; totalQuantity: number }) => updateSellerStock(productId, totalQuantity), onSuccess: invalidate }),
    uploadImage: useMutation({ mutationFn: ({ productId, file }: { productId: string; file: File }) => uploadProductImage(productId, file), onSuccess: invalidate }),
    createTimeDeal: useMutation({ mutationFn: (input: TimeDealCreateInput) => createTimeDeal(input), onSuccess: invalidate }),
    convert: useMutation({ mutationFn: (input: TimeDealConvertInput) => convertProductToTimeDeal(input), onSuccess: invalidate }),
    adjustTimeDealStock: useMutation({ mutationFn: ({ timeDealId, quantity }: { timeDealId: string; quantity: number }) => adjustTimeDealStock(timeDealId, quantity), onSuccess: invalidate }),
  }
}
