/**
 * Entity Views Page
 * Manage entity views - virtual views of devices/assets with data access control
 */

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Divider,
  Grid,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Search,
  AccessTime,
  Key as KeyIcon,
  Visibility,
} from '@mui/icons-material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { entityViewService } from '../services/entityViewService'
import {
  EntityView,
  createDefaultEntityView,
  formatTimeRange,
  isTimeRangeActive,
  getEntityViewKeyCount,
} from '../types/entityview.types'

interface TabPanelProps {
  children?: React.ReactNode
  value: number
  index: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

export default function EntityViewsPage() {
  const [entityViews, setEntityViews] = useState<EntityView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedView, setSelectedView] = useState<EntityView | null>(null)
  const [formData, setFormData] = useState<EntityView>(createDefaultEntityView())
  const [tabValue, setTabValue] = useState(0)

  // Key management
  const [newTimeseriesKey, setNewTimeseriesKey] = useState('')
  const [newClientAttrKey, setNewClientAttrKey] = useState('')
  const [newServerAttrKey, setNewServerAttrKey] = useState('')
  const [newSharedAttrKey, setNewSharedAttrKey] = useState('')

  useEffect(() => {
    loadEntityViews()
  }, [])

  const loadEntityViews = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await entityViewService.getEntityViews()
      setEntityViews(data)
    } catch (err) {
      setError('Failed to load entity views')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData(createDefaultEntityView())
    setSelectedView(null)
    setEditDialog(true)
    setTabValue(0)
  }

  const handleEdit = (view: EntityView) => {
    setFormData({ ...view })
    setSelectedView(view)
    setEditDialog(true)
    setTabValue(0)
  }

  const handleSave = async () => {
    try {
      setError(null)
      if (selectedView) {
        await entityViewService.updateEntityView(formData)
      } else {
        await entityViewService.createEntityView(formData)
      }
      setEditDialog(false)
      loadEntityViews()
    } catch (err) {
      setError('Failed to save entity view')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!selectedView?.id) return

    try {
      setError(null)
      await entityViewService.deleteEntityView(selectedView.id.id)
      setDeleteDialog(false)
      setSelectedView(null)
      loadEntityViews()
    } catch (err) {
      setError('Failed to delete entity view')
      console.error(err)
    }
  }

  // Key management functions
  const addTimeseriesKey = () => {
    if (!newTimeseriesKey.trim()) return
    const keys = formData.keys.timeseries || []
    if (!keys.includes(newTimeseriesKey)) {
      setFormData({
        ...formData,
        keys: {
          ...formData.keys,
          timeseries: [...keys, newTimeseriesKey],
        },
      })
    }
    setNewTimeseriesKey('')
  }

  const removeTimeseriesKey = (key: string) => {
    setFormData({
      ...formData,
      keys: {
        ...formData.keys,
        timeseries: (formData.keys.timeseries || []).filter((k) => k !== key),
      },
    })
  }

  const addAttributeKey = (scope: 'cs' | 'ss' | 'sh', key: string) => {
    if (!key.trim()) return
    const attrs = formData.keys.attributes || { cs: [], ss: [], sh: [] }
    const scopeKeys = attrs[scope] || []
    if (!scopeKeys.includes(key)) {
      setFormData({
        ...formData,
        keys: {
          ...formData.keys,
          attributes: {
            ...attrs,
            [scope]: [...scopeKeys, key],
          },
        },
      })
    }
  }

  const removeAttributeKey = (scope: 'cs' | 'ss' | 'sh', key: string) => {
    const attrs = formData.keys.attributes || { cs: [], ss: [], sh: [] }
    setFormData({
      ...formData,
      keys: {
        ...formData.keys,
        attributes: {
          ...attrs,
          [scope]: (attrs[scope] || []).filter((k) => k !== key),
        },
      },
    })
  }

  const filteredViews = entityViews.filter((view) =>
    view.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Entity Views</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
            Create Entity View
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search entity views..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Box>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Keys</TableCell>
                <TableCell>Time Range</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredViews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No entity views found
                  </TableCell>
                </TableRow>
              ) : (
                filteredViews.map((view) => (
                  <TableRow key={view.id?.id || view.name} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Visibility fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {view.name}
                          </Typography>
                          {view.additionalInfo?.description && (
                            <Typography variant="caption" color="text.secondary">
                              {view.additionalInfo.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={view.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{view.entityId.entityType}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          icon={<KeyIcon />}
                          label={getEntityViewKeyCount(view.keys)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isTimeRangeActive(view.startTimeMs, view.endTimeMs) ? (
                          <Chip
                            icon={<AccessTime />}
                            label="Active"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip icon={<AccessTime />} label="Inactive" size="small" />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeRange(view.startTimeMs, view.endTimeMs)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {view.customerId ? 'Assigned' : 'Unassigned'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(view)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedView(view)
                            setDeleteDialog(true)
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedView ? 'Edit Entity View' : 'Create Entity View'}
          </DialogTitle>
          <DialogContent>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
              <Tab label="Basic Info" />
              <Tab label="Keys" />
              <Tab label="Time Range" />
            </Tabs>

            {/* Basic Info Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  fullWidth
                  placeholder="e.g., Temperature Sensor View"
                />
                <TextField
                  label="Entity ID"
                  value={formData.entityId.id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      entityId: { ...formData.entityId, id: e.target.value },
                    })
                  }
                  required
                  fullWidth
                  helperText="ID of the device or asset to create a view for"
                />
                <FormControl fullWidth>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={formData.entityId.entityType}
                    label="Entity Type"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        entityId: { ...formData.entityId, entityType: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="DEVICE">Device</MenuItem>
                    <MenuItem value="ASSET">Asset</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Description"
                  value={formData.additionalInfo?.description || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalInfo: { ...formData.additionalInfo, description: e.target.value },
                    })
                  }
                  multiline
                  rows={2}
                  fullWidth
                />
              </Box>
            </TabPanel>

            {/* Keys Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Timeseries Keys */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Timeseries Keys
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add timeseries key"
                      value={newTimeseriesKey}
                      onChange={(e) => setNewTimeseriesKey(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTimeseriesKey()}
                      fullWidth
                    />
                    <Button onClick={addTimeseriesKey} variant="outlined">
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(formData.keys.timeseries || []).map((key) => (
                      <Chip
                        key={key}
                        label={key}
                        size="small"
                        onDelete={() => removeTimeseriesKey(key)}
                      />
                    ))}
                  </Box>
                </Box>

                <Divider />

                {/* Attribute Keys */}
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Client Attributes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add key"
                        value={newClientAttrKey}
                        onChange={(e) => setNewClientAttrKey(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addAttributeKey('cs', newClientAttrKey)
                            setNewClientAttrKey('')
                          }
                        }}
                        fullWidth
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {(formData.keys.attributes?.cs || []).map((key) => (
                        <Chip
                          key={key}
                          label={key}
                          size="small"
                          onDelete={() => removeAttributeKey('cs', key)}
                        />
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Server Attributes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add key"
                        value={newServerAttrKey}
                        onChange={(e) => setNewServerAttrKey(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addAttributeKey('ss', newServerAttrKey)
                            setNewServerAttrKey('')
                          }
                        }}
                        fullWidth
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {(formData.keys.attributes?.ss || []).map((key) => (
                        <Chip
                          key={key}
                          label={key}
                          size="small"
                          onDelete={() => removeAttributeKey('ss', key)}
                        />
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Shared Attributes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add key"
                        value={newSharedAttrKey}
                        onChange={(e) => setNewSharedAttrKey(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addAttributeKey('sh', newSharedAttrKey)
                            setNewSharedAttrKey('')
                          }
                        }}
                        fullWidth
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {(formData.keys.attributes?.sh || []).map((key) => (
                        <Chip
                          key={key}
                          label={key}
                          size="small"
                          onDelete={() => removeAttributeKey('sh', key)}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Time Range Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Alert severity="info">
                  Entity View will only expose data within this time range. Customers will not be
                  able to see telemetry outside the specified interval.
                </Alert>
                <DateTimePicker
                  label="Start Time"
                  value={new Date(formData.startTimeMs)}
                  onChange={(date: Date | null) =>
                    setFormData({ ...formData, startTimeMs: date?.getTime() || Date.now() })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DateTimePicker
                  label="End Time"
                  value={new Date(formData.endTimeMs)}
                  onChange={(date: Date | null) =>
                    setFormData({ ...formData, endTimeMs: date?.getTime() || Date.now() })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
                {formData.startTimeMs >= formData.endTimeMs && (
                  <Alert severity="error">End time must be after start time</Alert>
                )}
              </Box>
            </TabPanel>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={
                !formData.name ||
                !formData.type ||
                !formData.entityId.id ||
                formData.startTimeMs >= formData.endTimeMs
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Delete Entity View</DialogTitle>
          <DialogContent>
            Are you sure you want to delete "{selectedView?.name}"? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}
