import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userSurveyService } from '../services/userSurveyService'

const investingYearsOptions = ['< 1 year', '1-3 years', '4-6 years', '7-10 years', '> 10 years']
const knowledgeOptions = ['Beginner', 'Intermediate', 'Experienced', 'Professional']
const fundOptions = ['Below $1,000', '$1,000-$10,000', '$10,000-$50,000', '$50,000-$100,000', '$100,000-$500,000', 'Above $500,000']
const strategyOptions = ['Long-term holding', 'Short-term trading', 'Swing trading', 'Day trading', 'Passive investing (e.g., index funds and ETFs)']
const aiNeedsOptions = ['Stock/ETF Analysis', 'Crypto Analysis', 'Stock/ETF Ideas', 'Crypto Ideas', 'News Insights', 'Data Research']
const goalOptions = ['Retirement Planning', 'Wealth Building', "Children's Education", 'Home Purchase']
const incomeOptions = ['<$10,000', '$10,000-$50,000', '$50,000-$100,000', '$100,000-$200,000', '>$200,000']
const riskOptions = ['Conservative', 'Moderately Conservative', 'Moderate', 'Moderately Aggressive', 'Aggressive']

const Survey = () => {
  const [age, setAge] = useState('')
  const [annualIncome, setAnnualIncome] = useState('')
  const [monthlyExpenses, setMonthlyExpenses] = useState('')
  const [investingYears, setInvestingYears] = useState('')
  const [investmentKnowledge, setInvestmentKnowledge] = useState('')
  const [availableFund, setAvailableFund] = useState('')
  const [investmentGoals, setInvestmentGoals] = useState<string[]>([])
  const [investmentStrategies, setInvestmentStrategies] = useState<string[]>([])
  const [riskTolerance, setRiskTolerance] = useState('Moderate')
  const [aiNeeds, setAiNeeds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userId = user.email || user.username

  const handleCheckbox = (value: string, arr: string[], setArr: (v: string[]) => void) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value))
    } else {
      setArr([...arr, value])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = {
        userId,
        age,
        annual_income: annualIncome,
        monthly_expenses: monthlyExpenses,
        investing_years: investingYears,
        investment_knowledge: investmentKnowledge,
        available_fund: availableFund,
        investment_goals: investmentGoals,
        investment_strategies: investmentStrategies,
        risk_tolerance: riskTolerance,
        ai_needs: aiNeeds,
        created_at: new Date().toISOString(),
      }
      await userSurveyService.submitUserSurvey(data)
      navigate('/')
    } catch (err) {
      setError('Failed to submit survey. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-extrabold mb-2 text-gray-900 text-center">Welcome to the Investment Planner</h2>
        <p className="text-gray-500 text-center mb-6">Please fill out this short survey to help us personalize your experience.</p>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 font-medium text-gray-700">What is your age?</label>
            <input type="number" className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white text-gray-900" value={age} onChange={e => setAge(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">What is your annual income?</label>
            <select className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white text-gray-900" value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} required>
              <option value="">Select income range</option>
              {incomeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">What are your monthly expenses?</label>
            <input type="number" className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white text-gray-900" value={monthlyExpenses} onChange={e => setMonthlyExpenses(e.target.value)} required />
          </div>
          <hr className="my-4" />
          <div>
            <label className="block mb-1 font-medium text-gray-700">1. How long have you been investing?</label>
            <div className="flex flex-wrap gap-2">
              {investingYearsOptions.map(opt => (
                <button type="button" key={opt} className={`px-4 py-2 rounded-lg border transition-all duration-150 ${investingYears === opt ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400'}`} onClick={() => setInvestingYears(opt)}>{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">2. How would you rate your investment knowledge?</label>
            <div className="flex flex-wrap gap-2">
              {knowledgeOptions.map(opt => (
                <button type="button" key={opt} className={`px-4 py-2 rounded-lg border transition-all duration-150 ${investmentKnowledge === opt ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400'}`} onClick={() => setInvestmentKnowledge(opt)}>{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">3. What is your available investment fund?</label>
            <div className="flex flex-wrap gap-2">
              {fundOptions.map(opt => (
                <button type="button" key={opt} className={`px-4 py-2 rounded-lg border transition-all duration-150 ${availableFund === opt ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400'}`} onClick={() => setAvailableFund(opt)}>{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">4. Which investment strategy do you prefer?</label>
            <div className="flex flex-wrap gap-2">
              {strategyOptions.map(opt => (
                <button type="button" key={opt} className={`px-4 py-2 rounded-lg border transition-all duration-150 ${investmentStrategies.includes(opt) ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400'}`} onClick={() => handleCheckbox(opt, investmentStrategies, setInvestmentStrategies)}>{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">5. How can Intellectia best help you? (Select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {aiNeedsOptions.map(opt => (
                <button type="button" key={opt} className={`px-4 py-2 rounded-lg border transition-all duration-150 ${aiNeeds.includes(opt) ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400'}`} onClick={() => handleCheckbox(opt, aiNeeds, setAiNeeds)}>{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">What are your investment goals?</label>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map(opt => (
                <label key={opt} className="flex items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-150 cursor-pointer select-none bg-gray-50 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400">
                  <input type="checkbox" checked={investmentGoals.includes(opt)} onChange={() => handleCheckbox(opt, investmentGoals, setInvestmentGoals)} />
                  <span className="ml-1 text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">What is your risk tolerance?</label>
            <div className="flex gap-2 items-center">
              {riskOptions.map(opt => (
                <label key={opt} className="flex flex-col items-center px-2">
                  <input type="radio" name="risk" value={opt} checked={riskTolerance === opt} onChange={() => setRiskTolerance(opt)} />
                  <span className="text-xs text-gray-700 mt-1">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold mt-4 shadow-lg transition-all duration-150">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Survey 