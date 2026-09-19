import { useQuery } from '@tanstack/react-query'
import { getProduct, getProducts, type ProductSearchParams } from './api'

export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductSearchParams) => ['products', 'list', params] as const,
  detail: (productId: string) => ['products', 'detail', productId] as const,
}

export function useProducts(params: ProductSearchParams = {}, enabled = true) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    enabled,
  })
}

export function useProduct(productId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: productKeys.detail(productId ?? ''),
    queryFn: () => getProduct(productId ?? ''),
    enabled: Boolean(productId) && enabled,
  })
}
