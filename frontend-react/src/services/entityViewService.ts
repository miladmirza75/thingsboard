/**
 * Entity View Service
 * API service for entity view management
 */

import { api } from './api'
import { EntityView, EntityViewInfo, EntityViewSearchQuery } from '../types/entityview.types'

export const entityViewService = {
  /**
   * Get all entity views
   */
  getEntityViews: async (): Promise<EntityView[]> => {
    const response = await api.get<EntityView[]>('/entityViews')
    return response.data
  },

  /**
   * Get entity view info list (lightweight)
   */
  getEntityViewInfos: async (): Promise<EntityViewInfo[]> => {
    const response = await api.get<EntityViewInfo[]>('/entityViews/infos')
    return response.data
  },

  /**
   * Get entity view by ID
   */
  getEntityView: async (id: string): Promise<EntityView> => {
    const response = await api.get<EntityView>(`/entityView/${id}`)
    return response.data
  },

  /**
   * Get entity views with pagination
   */
  getEntityViewsPage: async (params: {
    pageSize: number
    page: number
    textSearch?: string
    sortProperty?: string
    sortOrder?: 'ASC' | 'DESC'
  }): Promise<{
    data: EntityView[]
    totalPages: number
    totalElements: number
    hasNext: boolean
  }> => {
    const queryParams = new URLSearchParams({
      pageSize: params.pageSize.toString(),
      page: params.page.toString(),
    })

    if (params.textSearch) {
      queryParams.append('textSearch', params.textSearch)
    }
    if (params.sortProperty) {
      queryParams.append('sortProperty', params.sortProperty)
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder)
    }

    const response = await api.get<{
      data: EntityView[]
      totalPages: number
      totalElements: number
      hasNext: boolean
    }>(`/entityViews?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Create new entity view
   */
  createEntityView: async (entityView: EntityView): Promise<EntityView> => {
    const response = await api.post<EntityView>('/entityView', entityView)
    return response.data
  },

  /**
   * Update existing entity view
   */
  updateEntityView: async (entityView: EntityView): Promise<EntityView> => {
    const response = await api.post<EntityView>('/entityView', entityView)
    return response.data
  },

  /**
   * Delete entity view
   */
  deleteEntityView: async (id: string): Promise<void> => {
    await api.delete(`/entityView/${id}`)
  },

  /**
   * Get entity views by entity ID (Device or Asset)
   */
  getEntityViewsByEntityId: async (entityId: string, entityType: string): Promise<EntityView[]> => {
    const response = await api.get<EntityView[]>(
      `/entityViews?entityId=${entityId}&entityType=${entityType}`
    )
    return response.data
  },

  /**
   * Assign entity view to customer
   */
  assignEntityViewToCustomer: async (
    entityViewId: string,
    customerId: string
  ): Promise<EntityView> => {
    const response = await api.post<EntityView>(
      `/customer/${customerId}/entityView/${entityViewId}`
    )
    return response.data
  },

  /**
   * Unassign entity view from customer
   */
  unassignEntityViewFromCustomer: async (entityViewId: string): Promise<EntityView> => {
    const response = await api.delete<EntityView>(`/customer/entityView/${entityViewId}`)
    return response.data
  },

  /**
   * Make entity view public
   */
  assignEntityViewToPublicCustomer: async (entityViewId: string): Promise<EntityView> => {
    const response = await api.post<EntityView>(
      `/customer/public/entityView/${entityViewId}`
    )
    return response.data
  },

  /**
   * Get customer entity views
   */
  getCustomerEntityViews: async (
    customerId: string,
    params: {
      pageSize: number
      page: number
      type?: string
      textSearch?: string
    }
  ): Promise<{
    data: EntityView[]
    totalPages: number
    totalElements: number
  }> => {
    const queryParams = new URLSearchParams({
      pageSize: params.pageSize.toString(),
      page: params.page.toString(),
    })

    if (params.type) {
      queryParams.append('type', params.type)
    }
    if (params.textSearch) {
      queryParams.append('textSearch', params.textSearch)
    }

    const response = await api.get<{
      data: EntityView[]
      totalPages: number
      totalElements: number
    }>(`/customer/${customerId}/entityViews?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Find entity views by query
   */
  findEntityViewsByQuery: async (query: EntityViewSearchQuery): Promise<EntityView[]> => {
    const response = await api.post<EntityView[]>('/entityViews/find', query)
    return response.data
  },

  /**
   * Get entity view types
   */
  getEntityViewTypes: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/entityView/types')
    return response.data
  },
}
