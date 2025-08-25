import React, { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import { demoSubscriptionService, type AdminCycleManagement, type UserSubscription } from '../services/demoSubscriptionService'

import Card from './Card'
import Button from './Button'
import Input from './Input'
import Badge from './Badge'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'

interface AdminCycleManagerProps {
  className?: string
}

const AdminCycleManager: React.FC<AdminCycleManagerProps> = ({ className = '' }) => {
  const { isAdmin, isConnected } = useAgent()
  const [adminData, setAdminData] = useState<AdminCycleManagement | null>(null)
  const [allUsers, setAllUsers] = useState<UserSubscription[]>([])
  const [loading, setLoading] = useState(false)
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null)
  const [allocateForm, setAllocateForm] = useState({
    amount: 1000000,
    note: ''
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load admin data
  useEffect(() => {
    if (isAdmin && isConnected) {
      loadAdminData()
    }
  }, [isAdmin, isConnected])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get admin cycle management data
      const cycleData = demoSubscriptionService.getAdminCycleManagement()
      setAdminData(cycleData)

      // Get all user subscriptions
      const users = demoSubscriptionService.getAllUserSubscriptions()
      setAllUsers(users)

      console.log('✅ Admin data loaded:', {
        totalCycles: cycleData.totalCyclesAllocated,
        activeUsers: cycleData.activeUsers,
        userCount: users.length
      })
    } catch (err: any) {
      console.error('❌ Failed to load admin data:', err)
      setError(err.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleAllocateCycles = async () => {
    if (!allocateForm.amount || allocateForm.amount <= 0) {
      setError('Please enter a valid cycle amount')
      return
    }

    try {
      setLoading(true)
      setError(null)

      demoSubscriptionService.allocateAdminCycles(
        allocateForm.amount,
        allocateForm.note || `Manual allocation of ${allocateForm.amount.toLocaleString()} cycles`
      )

      setMessage(`Successfully allocated ${allocateForm.amount.toLocaleString()} cycles`)
      setShowAllocateModal(false)
      setAllocateForm({ amount: 1000000, note: '' })
      
      // Refresh data
      await loadAdminData()
    } catch (err: any) {
      console.error('❌ Failed to allocate cycles:', err)
      setError(err.message || 'Failed to allocate cycles')
    } finally {
      setLoading(false)
    }
  }

  const handleViewUserDetails = (user: UserSubscription) => {
    setSelectedUser(user)
    setShowUserDetailsModal(true)
  }

  const formatCycles = (cycles: number) => `${(cycles / 1_000_000).toFixed(1)}M`
  const formatDate = (date: Date) => date.toLocaleDateString() + ' ' + date.toLocaleTimeString()

  // Don't show for non-admin users
  if (!isAdmin || !isConnected) {
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Admin Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-accentGold">🔧 Demo Admin - Cycle Management</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAdminData}
              loading={loading}
            >
              🔄 Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAllocateModal(true)}
            >
              💰 Allocate Cycles
            </Button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {adminData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-textOnDark/60 text-sm mb-1">Total Allocated</p>
              <p className="text-2xl font-bold text-accentGold">{formatCycles(adminData.totalCyclesAllocated)}</p>
            </div>
            <div className="text-center">
              <p className="text-textOnDark/60 text-sm mb-1">Used Today</p>
              <p className="text-xl font-bold text-orange-400">{formatCycles(adminData.cyclesUsedToday)}</p>
            </div>
            <div className="text-center">
              <p className="text-textOnDark/60 text-sm mb-1">Used This Month</p>
              <p className="text-xl font-bold text-red-400">{formatCycles(adminData.cyclesUsedThisMonth)}</p>
            </div>
            <div className="text-center">
              <p className="text-textOnDark/60 text-sm mb-1">Active Users</p>
              <p className="text-xl font-bold text-green-400">{adminData.activeUsers}</p>
            </div>
          </div>
        )}
      </Card>

      {/* User Management */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-accentGold">👥 User Subscriptions</h3>
          <div className="text-sm text-textOnDark/60">
            {allUsers.length} total users
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="md" />
            <p className="text-textOnDark/60 mt-2">Loading user data...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 bg-primary/40 rounded border border-accentGold/20 hover:border-accentGold/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.googleAccount.picture}
                    alt={user.googleAccount.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-textOnDark">{user.googleAccount.name}</p>
                    <p className="text-sm text-textOnDark/60">{user.googleAccount.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={user.subscription.plan === 'basic' ? 'success' : 'info'}
                    size="sm"
                  >
                    {user.subscription.plan.toUpperCase()}
                  </Badge>
                  <div className="text-right text-sm">
                    <p className="text-textOnDark/60">Models: {user.usage.modelsUsedThisMonth}/{user.subscription.rateLimits.modelsPerMonth}</p>
                    <p className="text-textOnDark/60">Compute: {user.usage.computeHoursUsed}h/{user.subscription.rateLimits.computeHours}h</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewUserDetails(user)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}

            {allUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-textOnDark/60">No users with subscriptions yet</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Allocate Cycles Modal */}
      <Modal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        title="Allocate Admin Cycles"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-textOnDark/80">
            Allocate additional cycles to support user operations. These cycles are provided by the admin for demo purposes.
          </p>

          <Input
            label="Cycle Amount"
            type="number"
            value={allocateForm.amount}
            onChange={(e) => setAllocateForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
            placeholder="1000000"
            helperText="Number of cycles to allocate (1M = 1,000,000)"
          />

          <Input
            label="Admin Note (Optional)"
            value={allocateForm.note}
            onChange={(e) => setAllocateForm(prev => ({ ...prev, note: e.target.value }))}
            placeholder="Reason for allocation..."
            helperText="Optional note for tracking purposes"
          />

          <div className="bg-primary/40 rounded border border-accentGold/20 p-4">
            <h4 className="text-accentGold font-medium mb-2">Allocation Preview</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-textOnDark/60">Current Total:</span>
                <span className="text-textOnDark">{adminData ? formatCycles(adminData.totalCyclesAllocated) : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textOnDark/60">Adding:</span>
                <span className="text-accentGold">+{formatCycles(allocateForm.amount)}</span>
              </div>
              <div className="border-t border-accentGold/20 pt-1 mt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-accentGold">New Total:</span>
                  <span className="text-accentGold">
                    {adminData ? formatCycles(adminData.totalCyclesAllocated + allocateForm.amount) : formatCycles(allocateForm.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowAllocateModal(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleAllocateCycles}
              loading={loading}
              disabled={!allocateForm.amount || allocateForm.amount <= 0}
            >
              Allocate Cycles
            </Button>
          </div>
        </div>
      </Modal>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={showUserDetailsModal}
          onClose={() => setShowUserDetailsModal(false)}
          title="User Subscription Details"
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-4 bg-primary/40 rounded border border-accentGold/20">
              <img
                src={selectedUser.googleAccount.picture}
                alt={selectedUser.googleAccount.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h4 className="text-accentGold font-medium">{selectedUser.googleAccount.name}</h4>
                <p className="text-textOnDark/60">{selectedUser.googleAccount.email}</p>
                <p className="text-textOnDark/60 text-sm">Principal: {selectedUser.userId.slice(0, 20)}...</p>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-accentGold font-medium mb-2">Subscription Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Plan:</span>
                    <Badge variant={selectedUser.subscription.plan === 'basic' ? 'success' : 'info'} size="sm">
                      {selectedUser.subscription.plan.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Status:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Created:</span>
                    <span className="text-textOnDark">{formatDate(selectedUser.subscription.createdAt)}</span>
                  </div>
                  {selectedUser.subscription.lastUsed && (
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Last Used:</span>
                      <span className="text-textOnDark">{formatDate(selectedUser.subscription.lastUsed)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-accentGold font-medium mb-2">Usage Statistics</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Models Used:</span>
                    <span className="text-textOnDark">{selectedUser.usage.modelsUsedThisMonth}/{selectedUser.subscription.rateLimits.modelsPerMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Compute Hours:</span>
                    <span className="text-textOnDark">{selectedUser.usage.computeHoursUsed}/{selectedUser.subscription.rateLimits.computeHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">API Calls Today:</span>
                    <span className="text-textOnDark">{selectedUser.usage.apiCallsToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Last Reset:</span>
                    <span className="text-textOnDark">{formatDate(selectedUser.usage.lastResetDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Limits */}
            <div>
              <h5 className="text-accentGold font-medium mb-2">Rate Limits</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-primary/20 rounded border border-accentGold/10">
                  <p className="text-textOnDark/60 text-sm">Models per Month</p>
                  <p className="text-textOnDark font-medium">{selectedUser.subscription.rateLimits.modelsPerMonth}</p>
                </div>
                <div className="p-3 bg-primary/20 rounded border border-accentGold/10">
                  <p className="text-textOnDark/60 text-sm">Compute Hours</p>
                  <p className="text-textOnDark font-medium">{selectedUser.subscription.rateLimits.computeHours}</p>
                </div>
                <div className="p-3 bg-primary/20 rounded border border-accentGold/10">
                  <p className="text-textOnDark/60 text-sm">API Calls/Min</p>
                  <p className="text-textOnDark font-medium">{selectedUser.subscription.rateLimits.apiCallsPerMinute}</p>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            {selectedUser.adminNotes && (
              <div>
                <h5 className="text-accentGold font-medium mb-2">Admin Notes</h5>
                <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                  <p className="text-yellow-200 text-sm">{selectedUser.adminNotes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowUserDetailsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminCycleManager