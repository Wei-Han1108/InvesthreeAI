import { useAuth } from '../contexts/AuthContext'
import useInvestmentStore from '../store/investmentStore'
import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { userService } from '../services/userService'

const FEEDBACK_TYPES = [
  { value: '', label: 'Select the type of issue' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'account', label: 'Account Issue' },
  { value: 'other', label: 'Other' },
]

const TABS = [
  { key: 'account', label: 'Account' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'support', label: 'Support' },
]

const MyAccount = () => {
  const { user, signOut } = useAuth()
  const { investments, loadInvestments } = useInvestmentStore()
  const [selectedTab, setSelectedTab] = useState('account')
  const [feedbackType, setFeedbackType] = useState('')
  const [feedbackDetail, setFeedbackDetail] = useState('')
  const [feedbackImages, setFeedbackImages] = useState<File[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState('')
  const [feedbackError, setFeedbackError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [newUserName, setNewUserName] = useState(user?.username || '')
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositLoading, setDepositLoading] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState('')
  const [depositError, setDepositError] = useState('')

  useEffect(() => {
    loadInvestments()
  }, [loadInvestments])

  useEffect(() => {
    async function fetchBalance() {
      if (!user?.username) return
      try {
        const userInfo = await userService.getUser(user.username)
        setBalance(userInfo?.balance ?? 0)
      } catch (e) {
        setBalance(0)
      }
    }
    fetchBalance()
  }, [user?.username])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 6)
      setFeedbackImages(files)
    }
  }

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackLoading(true)
    setFeedbackSuccess('')
    setFeedbackError('')
    setTimeout(() => {
      setFeedbackLoading(false)
      setFeedbackSuccess('Feedback submitted successfully!')
      setFeedbackType('')
      setFeedbackDetail('')
      setFeedbackImages([])
    }, 1200)
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDepositLoading(true)
    setDepositSuccess('')
    setDepositError('')
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Please enter a valid amount')
      setDepositLoading(false)
      return
    }
    try {
      await userService.deposit(user.username, amount)
      setDepositSuccess('Deposit successful!')
      setDepositAmount('')
      // 重新获取余额
      const userInfo = await userService.getUser(user.username)
      setBalance(userInfo?.balance ?? 0)
    } catch (e) {
      setDepositError('Deposit failed')
    }
    setDepositLoading(false)
  }

  // Account Info Section
  const AccountSection = (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Account Info</h3>
      <div className="divide-y divide-gray-200">
        <div className="flex items-center justify-between py-4">
          <div className="text-gray-600">User Name</div>
          <div className="flex items-center gap-2">
            {editingName ? (
              <>
                <input
                  className="border px-2 py-1 rounded text-gray-900"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                />
                <button
                  className="text-teal-600 font-medium px-2"
                  onClick={() => {
                    // TODO: 保存用户名到后端
                    setEditingName(false)
                  }}
                >Save</button>
                <button
                  className="text-gray-400 px-2"
                  onClick={() => {
                    setEditingName(false)
                    setNewUserName(user?.username || '')
                  }}
                >Cancel</button>
              </>
            ) : (
              <>
                <span className="text-gray-900">{user?.username || 'N/A'}</span>
                <button className="text-gray-400 hover:text-gray-700" title="Edit User Name" type="button" onClick={() => setEditingName(true)}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M16.475 5.408a2.357 2.357 0 1 1 3.336 3.336L7.5 21H3v-4.5l13.475-13.092Z"/></svg>
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between py-4">
          <div className="text-gray-600">Email</div>
          <div className="text-gray-900">{user?.email || 'N/A'}</div>
        </div>
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-600">Password</div>
            <button 
              className="px-4 py-1.5 bg-teal-50 hover:bg-teal-100 rounded text-teal-600 font-medium text-sm transition-colors duration-200 flex items-center gap-2" 
              onClick={() => setShowPasswordFields(v => !v)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                <path d="M1.323 11.447A2 2 0 0 0 1 12c0 1.691-.7 3.368 1.323 4.553a19.777 19.777 0 0 0 3.767 3.129c.73.385 1.493.74 2.286 1.054C9.561 21.29 10.78 21.5 12 21.5c1.22 0 2.44-.21 3.625-.764a19.798 19.798 0 0 0 2.286-1.054 19.777 19.777 0 0 0 3.767-3.129C23.3 15.368 23.5 13.691 23.5 12c0-1.691-.2-3.368-1.823-4.553a19.777 19.777 0 0 0-3.767-3.129 19.798 19.798 0 0 0-2.286-1.054C14.44 2.71 13.22 2.5 12 2.5c-1.22 0-2.44.21-3.625.764a19.798 19.798 0 0 0-2.286 1.054A19.777 19.777 0 0 0 2.323 7.447 13.298 13.298 0 0 0 1 12c0 .553.323 1.447 1.323 2.447Z"/>
              </svg>
              Change Password
            </button>
          </div>
          {showPasswordFields && (
            <form 
              className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200" 
              onSubmit={e => {
                e.preventDefault()
                setPasswordError('')
                setPasswordSuccess('')
                
                // Enhanced validation
                if (newPassword.length < 8) {
                  setPasswordError('Password must be at least 8 characters long')
                  return
                }
                if (!/[A-Z]/.test(newPassword)) {
                  setPasswordError('Password must contain at least one uppercase letter')
                  return
                }
                if (!/[a-z]/.test(newPassword)) {
                  setPasswordError('Password must contain at least one lowercase letter')
                  return
                }
                if (!/[0-9]/.test(newPassword)) {
                  setPasswordError('Password must contain at least one number')
                  return
                }
                if (!/[!@#$%^&*]/.test(newPassword)) {
                  setPasswordError('Password must contain at least one special character (!@#$%^&*)')
                  return
                }
                if (newPassword !== confirmPassword) {
                  setPasswordError('Passwords do not match')
                  return
                }
                
                // TODO: 调用后端API修改密码
                setPasswordSuccess('Password updated successfully!')
                setTimeout(() => {
                  setShowPasswordFields(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }, 2000)
              }}
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M12 8v4"/>
                    <path d="M12 16h.01"/>
                  </svg>
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <path d="m9 11 3 3L22 4"/>
                  </svg>
                  {passwordSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordFields(false)
                    setNewPassword('')
                    setConfirmPassword('')
                    setPasswordError('')
                    setPasswordSuccess('')
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newPassword || !confirmPassword}
                >
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="py-4 border-t border-gray-200">
          <button
            onClick={() => {
              signOut()
            }}
            className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  )

  // Deposit Section
  const DepositSection = (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Deposit</h3>
      <div className="mb-4">
        <span className="text-gray-600">Account Balance: </span>
        <span className="text-lg font-bold text-green-600">${balance?.toLocaleString() ?? '0'}</span>
      </div>
      <form className="flex items-center gap-2 mb-6" onSubmit={handleDeposit}>
        <input
          type="number"
          min="1"
          step="any"
          className="border px-3 py-2 rounded text-gray-900 w-40"
          placeholder="Deposit Amount"
          value={depositAmount}
          onChange={e => setDepositAmount(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded text-white font-medium"
          disabled={depositLoading}
        >
          {depositLoading ? 'Depositing...' : 'Deposit'}
        </button>
      </form>
      {depositSuccess && <div className="text-green-500 mb-2">{depositSuccess}</div>}
      {depositError && <div className="text-red-500 mb-2">{depositError}</div>}
    </div>
  )

  // Portfolio Section
  const PortfolioSection = (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Portfolio</h3>
      {investments.length === 0 ? (
        <div className="text-gray-400">You have no investments.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 font-medium text-gray-600 border-b">Stock</th>
                <th className="py-2 px-4 font-medium text-gray-600 border-b">Quantity</th>
                <th className="py-2 px-4 font-medium text-gray-600 border-b">Purchase Price</th>
                <th className="py-2 px-4 font-medium text-gray-600 border-b">Current Price</th>
                <th className="py-2 px-4 font-medium text-gray-600 border-b">Purchase Date</th>
              </tr>
            </thead>
            <tbody>
              {investments.map(inv => (
                <tr key={inv.stockCode + inv.purchaseDate} className="border-b last:border-b-0">
                  <td className="py-2 px-4">{inv.stockName} ({inv.stockCode})</td>
                  <td className="py-2 px-4">{inv.quantity}</td>
                  <td className="py-2 px-4">${inv.purchasePrice}</td>
                  <td className="py-2 px-4">${inv.currentPrice}</td>
                  <td className="py-2 px-4">{new Date(inv.purchaseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  // Support Section
  const SupportSection = (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Feedback</h3>
      <form onSubmit={handleFeedbackSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 rounded bg-gray-100 border border-gray-300 text-gray-900"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Type</label>
          <select
            value={feedbackType}
            onChange={e => setFeedbackType(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-100 border border-gray-300 text-gray-900"
            required
          >
            {FEEDBACK_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Detail</label>
          <textarea
            value={feedbackDetail}
            onChange={e => setFeedbackDetail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-100 border border-gray-300 text-gray-900"
            rows={4}
            placeholder="Please describe the issue in detail so we can get back to you with the solutions as soon as possible"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Attach screenshots/images (up to 6)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="block text-gray-900"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {feedbackImages.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                alt="screenshot"
                className="w-16 h-16 object-cover rounded border border-gray-300"
              />
            ))}
          </div>
        </div>
        {feedbackSuccess && <div className="text-green-500">{feedbackSuccess}</div>}
        {feedbackError && <div className="text-red-500">{feedbackError}</div>}
        <button
          type="submit"
          className="px-6 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-semibold"
          disabled={feedbackLoading}
        >
          {feedbackLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-xl font-bold text-white">
          {user?.email?.[0]?.toUpperCase() || 'A'}
        </div>
        My Account
      </h2>
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-6 py-2 font-medium focus:outline-none transition-colors duration-150 ${selectedTab === tab.key ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-400 hover:text-gray-700'}`}
            onClick={() => setSelectedTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {selectedTab === 'account' && AccountSection}
      {selectedTab === 'deposit' && DepositSection}
      {selectedTab === 'portfolio' && PortfolioSection}
      {selectedTab === 'support' && SupportSection}
    </div>
  )
}

export default MyAccount 