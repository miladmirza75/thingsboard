/**
 * OTA Package Type Definitions
 * Over-The-Air update package management
 * Based on: common/data/src/main/java/org/thingsboard/server/common/data/ota/OtaPackage.java
 */

import { EntityId, TenantId, DeviceProfileId } from './device.types'

// ==================== ID Types ====================

export interface OtaPackageId extends EntityId {
  entityType: 'OTA_PACKAGE'
}

// ==================== Enums ====================

export enum OtaPackageType {
  FIRMWARE = 'FIRMWARE',
  SOFTWARE = 'SOFTWARE',
}

export enum ChecksumAlgorithm {
  MD5 = 'MD5',
  SHA256 = 'SHA256',
  SHA384 = 'SHA384',
  SHA512 = 'SHA512',
  CRC32 = 'CRC32',
  MURMUR3_32 = 'MURMUR3_32',
  MURMUR3_128 = 'MURMUR3_128',
}

// ==================== OTA Package ====================

export interface OtaPackage {
  id?: OtaPackageId
  createdTime?: number
  tenantId: TenantId
  deviceProfileId?: DeviceProfileId
  type: OtaPackageType
  title: string
  version: string
  tag?: string
  url?: string
  fileName?: string
  contentType?: string
  checksumAlgorithm?: ChecksumAlgorithm
  checksum?: string
  dataSize?: number
  data?: string // Base64 encoded data
  additionalInfo?: {
    description?: string
  }
  hasData?: boolean
  externalId?: OtaPackageId
}

// ==================== OTA Package Info (for lists) ====================

export interface OtaPackageInfo {
  id: OtaPackageId
  tenantId: TenantId
  deviceProfileId?: DeviceProfileId
  type: OtaPackageType
  title: string
  version: string
  tag?: string
  url?: string
  fileName?: string
  contentType?: string
  dataSize?: number
  hasData?: boolean
  createdTime?: number
}

// ==================== Update Status ====================

export enum OtaUpdateStatus {
  QUEUED = 'QUEUED',
  INITIATED = 'INITIATED',
  DOWNLOADING = 'DOWNLOADING',
  DOWNLOADED = 'DOWNLOADED',
  VERIFIED = 'VERIFIED',
  UPDATING = 'UPDATING',
  UPDATED = 'UPDATED',
  FAILED = 'FAILED',
}

export interface DeviceOtaUpdate {
  deviceId: EntityId
  otaPackageId: OtaPackageId
  type: OtaPackageType
  status: OtaUpdateStatus
  startedAt?: number
  completedAt?: number
  progress?: number
  errorMessage?: string
}

// ==================== Helper Functions ====================

export function createDefaultOtaPackage(): OtaPackage {
  return {
    tenantId: { id: '', entityType: 'TENANT' },
    type: OtaPackageType.FIRMWARE,
    title: '',
    version: '',
    checksumAlgorithm: ChecksumAlgorithm.SHA256,
  }
}

export function isValidOtaPackage(pkg: OtaPackage): boolean {
  return (
    pkg.title.trim().length > 0 &&
    pkg.version.trim().length > 0 &&
    (!!pkg.url || !!pkg.data || !!pkg.hasData)
  )
}

export function getOtaPackageDisplayName(pkg: OtaPackage | OtaPackageInfo): string {
  return `${pkg.title} v${pkg.version}`
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function getOtaUpdateStatusColor(status: OtaUpdateStatus): string {
  switch (status) {
    case OtaUpdateStatus.QUEUED:
      return '#9E9E9E'
    case OtaUpdateStatus.INITIATED:
    case OtaUpdateStatus.DOWNLOADING:
    case OtaUpdateStatus.UPDATING:
      return '#2196F3'
    case OtaUpdateStatus.DOWNLOADED:
    case OtaUpdateStatus.VERIFIED:
      return '#FF9800'
    case OtaUpdateStatus.UPDATED:
      return '#4CAF50'
    case OtaUpdateStatus.FAILED:
      return '#F44336'
    default:
      return '#9E9E9E'
  }
}

export const otaPackageTypeNames: Record<OtaPackageType, string> = {
  [OtaPackageType.FIRMWARE]: 'Firmware',
  [OtaPackageType.SOFTWARE]: 'Software',
}

export const checksumAlgorithmNames: Record<ChecksumAlgorithm, string> = {
  [ChecksumAlgorithm.MD5]: 'MD5',
  [ChecksumAlgorithm.SHA256]: 'SHA-256',
  [ChecksumAlgorithm.SHA384]: 'SHA-384',
  [ChecksumAlgorithm.SHA512]: 'SHA-512',
  [ChecksumAlgorithm.CRC32]: 'CRC-32',
  [ChecksumAlgorithm.MURMUR3_32]: 'MurmurHash3 32-bit',
  [ChecksumAlgorithm.MURMUR3_128]: 'MurmurHash3 128-bit',
}
