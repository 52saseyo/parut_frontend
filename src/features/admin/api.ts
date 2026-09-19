import { apiClient, type ApiResponse } from '../../lib/api'

export type SellerStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type SellerApplication = {
  id: string
  loginId: string
  companyName: string
  bizRegNo: string
  repName: string
  bizAddress: string
  managerName: string
  managerPhone: string
  managerEmail: string
  slackId: string | null
  status: SellerStatus
  createdAt: string
}

export type SellerApplicationPage = {
  content: SellerApplication[]
  pageInfo: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    last: boolean
  }
}

export async function getSellerApplications(params: {
  keyword?: string
  page?: number
  size?: number
}) {
  const response = await apiClient.get<ApiResponse<SellerApplicationPage>>(
    '/api/v1/sellers/applications',
    {
      params: {
        ...params,
        sort: 'createdAt',
        direction: 'desc',
      },
    },
  )
  return response.data.data
}

export async function processSellerApplication(
  applicationId: string,
  input: { status: Exclude<SellerStatus, 'PENDING'>; rejectReason?: string },
) {
  const response = await apiClient.patch<ApiResponse<SellerApplication>>(
    `/api/v1/sellers/applications/${applicationId}`,
    input,
  )
  return response.data.data
}
