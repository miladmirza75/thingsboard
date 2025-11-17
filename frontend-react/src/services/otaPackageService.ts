/**
 * OTA Package Service
 * API service for over-the-air update package management
 */

import { api } from './api'
import { OtaPackage, OtaPackageInfo, OtaPackageType } from '../types/otapackage.types'
import { DeviceProfileId } from '../types/device.types'

export const otaPackageService = {
  /**
   * Get all OTA packages
   */
  getOtaPackages: async (type?: OtaPackageType): Promise<OtaPackage[]> => {
    const params = type ? `?type=${type}` : ''
    const response = await api.get<OtaPackage[]>(`/otaPackages${params}`)
    return response.data
  },

  /**
   * Get OTA package info list (lightweight)
   */
  getOtaPackageInfos: async (
    deviceProfileId?: string,
    type?: OtaPackageType
  ): Promise<OtaPackageInfo[]> => {
    const params = new URLSearchParams()
    if (deviceProfileId) params.append('deviceProfileId', deviceProfileId)
    if (type) params.append('type', type)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const response = await api.get<OtaPackageInfo[]>(`/otaPackages/infos${queryString}`)
    return response.data
  },

  /**
   * Get OTA package by ID
   */
  getOtaPackage: async (id: string): Promise<OtaPackage> => {
    const response = await api.get<OtaPackage>(`/otaPackage/${id}`)
    return response.data
  },

  /**
   * Get OTA package info by ID (without data)
   */
  getOtaPackageInfo: async (id: string): Promise<OtaPackageInfo> => {
    const response = await api.get<OtaPackageInfo>(`/otaPackage/info/${id}`)
    return response.data
  },

  /**
   * Get OTA packages with pagination
   */
  getOtaPackagesPage: async (params: {
    pageSize: number
    page: number
    textSearch?: string
    sortProperty?: string
    sortOrder?: 'ASC' | 'DESC'
    deviceProfileId?: string
    type?: OtaPackageType
  }): Promise<{
    data: OtaPackageInfo[]
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
    if (params.deviceProfileId) {
      queryParams.append('deviceProfileId', params.deviceProfileId)
    }
    if (params.type) {
      queryParams.append('type', params.type)
    }

    const response = await api.get<{
      data: OtaPackageInfo[]
      totalPages: number
      totalElements: number
      hasNext: boolean
    }>(`/otaPackages?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Create new OTA package
   */
  createOtaPackage: async (pkg: OtaPackage): Promise<OtaPackage> => {
    const response = await api.post<OtaPackage>('/otaPackage', pkg)
    return response.data
  },

  /**
   * Update existing OTA package
   */
  updateOtaPackage: async (pkg: OtaPackage): Promise<OtaPackage> => {
    const response = await api.post<OtaPackage>('/otaPackage', pkg)
    return response.data
  },

  /**
   * Delete OTA package
   */
  deleteOtaPackage: async (id: string): Promise<void> => {
    await api.delete(`/otaPackage/${id}`)
  },

  /**
   * Upload OTA package file
   */
  uploadOtaPackageFile: async (file: File, pkg: OtaPackage): Promise<OtaPackage> => {
    const formData = new FormData()
    formData.append('file', file)

    // Append package metadata
    formData.append('title', pkg.title)
    formData.append('version', pkg.version)
    formData.append('type', pkg.type)
    if (pkg.tag) formData.append('tag', pkg.tag)
    if (pkg.deviceProfileId?.id) formData.append('deviceProfileId', pkg.deviceProfileId.id)
    if (pkg.checksumAlgorithm) formData.append('checksumAlgorithm', pkg.checksumAlgorithm)
    if (pkg.checksum) formData.append('checksum', pkg.checksum)
    if (pkg.additionalInfo?.description) {
      formData.append('additionalInfo', JSON.stringify(pkg.additionalInfo))
    }

    const response = await api.post<OtaPackage>('/otaPackage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Download OTA package file
   */
  downloadOtaPackage: async (id: string): Promise<Blob> => {
    const response = await api.get(`/otaPackage/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Get OTA packages by device profile ID
   */
  getOtaPackagesByDeviceProfileId: async (
    deviceProfileId: string,
    type?: OtaPackageType
  ): Promise<OtaPackageInfo[]> => {
    const params = type ? `&type=${type}` : ''
    const response = await api.get<OtaPackageInfo[]>(
      `/otaPackages?deviceProfileId=${deviceProfileId}${params}`
    )
    return response.data
  },

  /**
   * Check if version exists for device profile
   */
  checkVersionExists: async (
    deviceProfileId: string,
    type: OtaPackageType,
    version: string
  ): Promise<boolean> => {
    try {
      const response = await api.get<{ exists: boolean }>(
        `/otaPackage/version/exists?deviceProfileId=${deviceProfileId}&type=${type}&version=${version}`
      )
      return response.data.exists
    } catch {
      return false
    }
  },

  /**
   * Get devices using OTA package
   */
  getDevicesUsingOtaPackage: async (otaPackageId: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/otaPackage/${otaPackageId}/devices`)
    return response.data
  },
}
