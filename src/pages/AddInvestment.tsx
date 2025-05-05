import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useInvestmentStore from '../store/investmentStore'

const AddInvestment = () => {
  const navigate = useNavigate()
  const addInvestment = useInvestmentStore((state) => state.addInvestment)
  const [formData, setFormData] = useState({
    stockName: '',
    stockCode: '',
    purchasePrice: '',
    quantity: '',
    purchaseDate: '',
    currentPrice: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addInvestment({
        stockName: formData.stockName,
        stockCode: formData.stockCode,
        purchasePrice: Number(formData.purchasePrice),
        quantity: Number(formData.quantity),
        purchaseDate: formData.purchaseDate,
        currentPrice: Number(formData.currentPrice),
      })
      navigate('/')
    } catch (error) {
      console.error('Failed to add investment:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">添加新投资</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="stockName" className="block text-sm font-medium text-gray-700">
              股票名称
            </label>
            <input
              type="text"
              id="stockName"
              name="stockName"
              value={formData.stockName}
              onChange={handleChange}
              className="input mt-1"
              required
            />
          </div>

          <div>
            <label htmlFor="stockCode" className="block text-sm font-medium text-gray-700">
              股票代码
            </label>
            <input
              type="text"
              id="stockCode"
              name="stockCode"
              value={formData.stockCode}
              onChange={handleChange}
              className="input mt-1"
              required
            />
          </div>

          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">
              购买价格
            </label>
            <input
              type="number"
              id="purchasePrice"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              className="input mt-1"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              数量
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="input mt-1"
              required
              min="1"
            />
          </div>

          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">
              购买日期
            </label>
            <input
              type="date"
              id="purchaseDate"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="input mt-1"
              required
            />
          </div>

          <div>
            <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-700">
              当前价格
            </label>
            <input
              type="number"
              id="currentPrice"
              name="currentPrice"
              value={formData.currentPrice}
              onChange={handleChange}
              className="input mt-1"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddInvestment 