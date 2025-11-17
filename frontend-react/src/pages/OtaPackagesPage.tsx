/**
 * OTA Packages Page
 * Manage over-the-air update packages (Firmware & Software)
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
  LinearProgress,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Search,
  CloudUpload,
  CloudDownload,
  Memory,
  Computer,
} from '@mui/icons-material'
import { otaPackageService } from '../services/otaPackageService'
import { deviceProfileService } from '../services/deviceProfileService'
import {
  OtaPackage,
  OtaPackageInfo,
  OtaPackageType,
  ChecksumAlgorithm,
  createDefaultOtaPackage,
  formatFileSize,
  otaPackageTypeNames,
  checksumAlgorithmNames,
} from '../types/otapackage.types'
import { DeviceProfile } from '../types/device.types'

export default function OtaPackagesPage() {
  const [packages, setPackages] = useState<OtaPackageInfo[]>([])
  const [deviceProfiles, setDeviceProfiles] = useState<DeviceProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState<OtaPackageType | 'ALL'>('ALL')
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<OtaPackageInfo | null>(null)
  const [formData, setFormData] = useState<OtaPackage>(createDefaultOtaPackage())
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadPackages()
    loadDeviceProfiles()
  }, [])

  const loadPackages = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await otaPackageService.getOtaPackageInfos()
      setPackages(data)
    } catch (err) {
      setError('Failed to load OTA packages')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadDeviceProfiles = async () => {
    try {
      const data = await deviceProfileService.getDeviceProfiles()
      setDeviceProfiles(data)
    } catch (err) {
      console.error('Failed to load device profiles:', err)
    }
  }

  const handleCreate = () => {
    setFormData(createDefaultOtaPackage())
    setSelectedPackage(null)
    setUploadFile(null)
    setEditDialog(true)
  }

  const handleEdit = async (pkg: OtaPackageInfo) => {
    try {
      // Load full package data
      const fullPkg = await otaPackageService.getOtaPackage(pkg.id.id)
      setFormData({ ...fullPkg })
      setSelectedPackage(pkg)
      setUploadFile(null)
      setEditDialog(true)
    } catch (err) {
      setError('Failed to load package details')
      console.error(err)
    }
  }

  const handleSave = async () => {
    try {
      setError(null)
      setUploading(true)

      if (uploadFile) {
        // Upload with file
        await otaPackageService.uploadOtaPackageFile(uploadFile, formData)
      } else if (selectedPackage) {
        // Update existing without file
        await otaPackageService.updateOtaPackage(formData)
      } else {
        // Create with URL
        await otaPackageService.createOtaPackage(formData)
      }

      setEditDialog(false)
      loadPackages()
    } catch (err) {
      setError('Failed to save OTA package')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPackage?.id) return

    try {
      setError(null)
      await otaPackageService.deleteOtaPackage(selectedPackage.id.id)
      setDeleteDialog(false)
      setSelectedPackage(null)
      loadPackages()
    } catch (err) {
      setError('Failed to delete OTA package')
      console.error(err)
    }
  }

  const handleDownload = async (pkg: OtaPackageInfo) => {
    try {
      const blob = await otaPackageService.downloadOtaPackage(pkg.id.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = pkg.fileName || `${pkg.title}_v${pkg.version}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Failed to download package')
      console.error(err)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadFile(file)
      setFormData({
        ...formData,
        fileName: file.name,
        contentType: file.type,
        dataSize: file.size,
      })
    }
  }

  const filteredPackages = packages
    .filter((pkg) => {
      if (selectedType !== 'ALL' && pkg.type !== selectedType) return false
      if (searchText) {
        const search = searchText.toLowerCase()
        return (
          pkg.title.toLowerCase().includes(search) ||
          pkg.version.toLowerCase().includes(search) ||
          pkg.tag?.toLowerCase().includes(search)
        )
      }
      return true
    })

  const getDeviceProfileName = (deviceProfileId?: { id: string }) => {
    if (!deviceProfileId) return 'All'
    const profile = deviceProfiles.find((p) => p.id?.id === deviceProfileId.id)
    return profile?.name || 'Unknown'
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">OTA Packages</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
          Upload Package
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Search packages..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={selectedType}
            label="Type"
            onChange={(e) => setSelectedType(e.target.value as OtaPackageType | 'ALL')}
          >
            <MenuItem value="ALL">All Types</MenuItem>
            <MenuItem value={OtaPackageType.FIRMWARE}>Firmware</MenuItem>
            <MenuItem value={OtaPackageType.SOFTWARE}>Software</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Device Profile</TableCell>
              <TableCell>Tag</TableCell>
              <TableCell>File Size</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredPackages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No OTA packages found
                </TableCell>
              </TableRow>
            ) : (
              filteredPackages.map((pkg) => (
                <TableRow key={pkg.id.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {pkg.type === OtaPackageType.FIRMWARE ? (
                        <Memory fontSize="small" color="primary" />
                      ) : (
                        <Computer fontSize="small" color="secondary" />
                      )}
                      <Typography variant="body2" fontWeight={600}>
                        {pkg.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={`v${pkg.version}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={otaPackageTypeNames[pkg.type]}
                      size="small"
                      color={pkg.type === OtaPackageType.FIRMWARE ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {getDeviceProfileName(pkg.deviceProfileId)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {pkg.tag && <Chip label={pkg.tag} size="small" variant="outlined" />}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatFileSize(pkg.dataSize)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {pkg.createdTime
                        ? new Date(pkg.createdTime).toLocaleDateString()
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {pkg.hasData && (
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleDownload(pkg)}>
                          <CloudDownload fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(pkg)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedPackage(pkg)
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

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPackage ? 'Edit OTA Package' : 'Upload OTA Package'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Basic Info */}
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Tag"
                value={formData.tag || ''}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                fullWidth
                placeholder="Optional"
              />
            </Box>

            {/* Type & Device Profile */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as OtaPackageType })
                  }
                >
                  <MenuItem value={OtaPackageType.FIRMWARE}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Memory fontSize="small" />
                      Firmware
                    </Box>
                  </MenuItem>
                  <MenuItem value={OtaPackageType.SOFTWARE}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Computer fontSize="small" />
                      Software
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Device Profile</InputLabel>
                <Select
                  value={formData.deviceProfileId?.id || ''}
                  label="Device Profile"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deviceProfileId: e.target.value
                        ? { id: e.target.value, entityType: 'DEVICE_PROFILE' }
                        : undefined,
                    })
                  }
                >
                  <MenuItem value="">All Profiles</MenuItem>
                  {deviceProfiles.map((profile) => (
                    <MenuItem key={profile.id?.id} value={profile.id?.id}>
                      {profile.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* File Upload */}
            {!selectedPackage && (
              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  {uploadFile ? uploadFile.name : 'Choose File'}
                  <input type="file" hidden onChange={handleFileChange} />
                </Button>
                {uploadFile && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    File size: {formatFileSize(uploadFile.size)}
                  </Typography>
                )}
              </Box>
            )}

            {/* URL (alternative to file) */}
            {!uploadFile && (
              <TextField
                label="Package URL"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                fullWidth
                placeholder="https://example.com/firmware.bin"
                helperText="Provide URL if not uploading file"
              />
            )}

            {/* Checksum */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Checksum Algorithm</InputLabel>
                <Select
                  value={formData.checksumAlgorithm || ChecksumAlgorithm.SHA256}
                  label="Checksum Algorithm"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checksumAlgorithm: e.target.value as ChecksumAlgorithm,
                    })
                  }
                >
                  {Object.entries(checksumAlgorithmNames).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Checksum"
                value={formData.checksum || ''}
                onChange={(e) => setFormData({ ...formData, checksum: e.target.value })}
                fullWidth
                placeholder="Optional"
              />
            </Box>

            {/* Description */}
            <TextField
              label="Description"
              value={formData.additionalInfo?.description || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  additionalInfo: { description: e.target.value },
                })
              }
              multiline
              rows={3}
              fullWidth
              placeholder="Release notes, changelog, etc."
            />

            {uploading && (
              <Box>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Uploading package...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !formData.title ||
              !formData.version ||
              uploading ||
              (!uploadFile && !formData.url && !selectedPackage)
            }
          >
            {uploading ? 'Uploading...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete OTA Package</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{selectedPackage?.title} v{selectedPackage?.version}"?
          This action cannot be undone and may affect devices using this package.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
