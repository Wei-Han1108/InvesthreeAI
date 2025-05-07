import { useAuth } from '../contexts/AuthContext'
import useInvestmentStore from '../store/investmentStore'
import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'

const FEEDBACK_TYPES = [
  { value: '', label: 'Select the type of issue' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'account', label: 'Account Issue' },
  { value: 'other', label: 'Other' },
]

const TABS = [
  { key: 'account', label: 'Account' },
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

  useEffect(() => {
    loadInvestments()
  }, [loadInvestments])

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

  // Account Info Section
  const AccountSection = (
    <div className="bg-white rounded-lg shadow p-6">
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
            <button className="px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium text-sm" onClick={() => setShowPasswordFields(v => !v)}>
              Set Password
            </button>
          </div>
          {showPasswordFields && (
            <form className="mt-4 space-y-2" onSubmit={e => {
              e.preventDefault()
              setPasswordError('')
              setPasswordSuccess('')
              if (newPassword !== confirmPassword) {
                setPasswordError('Passwords do not match')
                return
              }
              if (newPassword.length < 6) {
                setPasswordError('Password must be at least 6 characters')
                return
              }
              // TODO: 调用后端API修改密码
              setPasswordSuccess('Password updated successfully!')
              setTimeout(() => {
                setShowPasswordFields(false)
                setNewPassword('')
                setConfirmPassword('')
              }, 1200)
            }}>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-900"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-900"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              {passwordError && <div className="text-red-500">{passwordError}</div>}
              {passwordSuccess && <div className="text-green-500">{passwordSuccess}</div>}
              <div className="flex gap-2 mt-2">
                <button type="button" className="px-4 py-1 bg-gray-200 rounded text-gray-700" onClick={() => {
                  setShowPasswordFields(false)
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordError('')
                  setPasswordSuccess('')
                }}>Cancel</button>
                <button type="submit" className="px-4 py-1 bg-teal-500 hover:bg-teal-600 rounded text-white font-medium">Save</button>
              </div>
            </form>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <button
          onClick={signOut}
          className="px-6 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-white font-semibold"
        >
          Log Out
        </button>
      </div>
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
      {selectedTab === 'portfolio' && PortfolioSection}
      {selectedTab === 'support' && SupportSection}
    </div>
  )
}

export default MyAccount 