/**
 * Entity View Type Definitions
 * Mirrors ThingsBoard Java implementation
 * Based on: common/data/src/main/java/org/thingsboard/server/common/data/EntityView.java
 */

import { EntityId, TenantId, CustomerId } from './device.types'

// ==================== ID Types ====================

export interface EntityViewId extends EntityId {
  entityType: 'ENTITY_VIEW'
}

// ==================== Entity View ====================

export interface EntityView {
  id?: EntityViewId
  createdTime?: number
  tenantId: TenantId
  customerId?: CustomerId
  entityId: EntityId // Referenced Device or Asset
  name: string
  type: string
  keys: TelemetryEntityView
  startTimeMs: number
  endTimeMs: number
  additionalInfo?: {
    description?: string
  }
  externalId?: EntityViewId
  version?: number
}

// ==================== Telemetry Entity View (Key Filters) ====================

export interface TelemetryEntityView {
  timeseries?: string[] // Timeseries keys to expose
  attributes?: AttributeEntityView // Attribute keys to expose by scope
}

export interface AttributeEntityView {
  cs?: string[] // Client scope attributes
  ss?: string[] // Server scope attributes
  sh?: string[] // Shared scope attributes
}

// ==================== Entity View Info (for lists) ====================

export interface EntityViewInfo {
  id: EntityViewId
  tenantId: TenantId
  customerId?: CustomerId
  entityId: EntityId
  name: string
  type: string
  customerTitle?: string
  customerIsPublic?: boolean
}

// ==================== Entity View Search Query ====================

export interface EntityViewSearchQuery {
  relationType?: string
  entityViewTypes?: string[]
  pageLink: {
    page: number
    pageSize: number
    textSearch?: string
    sortOrder?: {
      key: string
      direction: 'ASC' | 'DESC'
    }
  }
}

// ==================== Helper Functions ====================

export function createDefaultEntityView(): EntityView {
  const now = Date.now()
  return {
    tenantId: { id: '', entityType: 'TENANT' },
    entityId: { id: '', entityType: 'DEVICE' },
    name: '',
    type: '',
    keys: {
      timeseries: [],
      attributes: {
        cs: [],
        ss: [],
        sh: [],
      },
    },
    startTimeMs: now - 86400000 * 7, // 7 days ago
    endTimeMs: now + 86400000 * 365, // 1 year from now
  }
}

export function isValidEntityView(entityView: EntityView): boolean {
  return (
    entityView.name.trim().length > 0 &&
    entityView.type.trim().length > 0 &&
    entityView.entityId.id.length > 0 &&
    entityView.startTimeMs < entityView.endTimeMs
  )
}

export function hasAnyKeys(keys: TelemetryEntityView): boolean {
  const hasTimeseries = keys.timeseries && keys.timeseries.length > 0
  const hasClientAttrs = keys.attributes?.cs && keys.attributes.cs.length > 0
  const hasServerAttrs = keys.attributes?.ss && keys.attributes.ss.length > 0
  const hasSharedAttrs = keys.attributes?.sh && keys.attributes.sh.length > 0

  return !!(hasTimeseries || hasClientAttrs || hasServerAttrs || hasSharedAttrs)
}

export function getEntityViewKeyCount(keys: TelemetryEntityView): number {
  let count = 0

  if (keys.timeseries) count += keys.timeseries.length
  if (keys.attributes?.cs) count += keys.attributes.cs.length
  if (keys.attributes?.ss) count += keys.attributes.ss.length
  if (keys.attributes?.sh) count += keys.attributes.sh.length

  return count
}

export function formatTimeRange(startMs: number, endMs: number): string {
  const start = new Date(startMs)
  const end = new Date(endMs)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return `${formatDate(start)} - ${formatDate(end)}`
}

export function isTimeRangeActive(startMs: number, endMs: number): boolean {
  const now = Date.now()
  return now >= startMs && now <= endMs
}

export function getEntityViewDisplayName(entityView: EntityView | EntityViewInfo): string {
  return entityView.name || 'Unnamed Entity View'
}
