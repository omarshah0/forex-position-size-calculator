import { useState, useEffect } from 'react'
import { fetchForexRates, calculateCrossRate } from '../utils/forexApi'

const FOREX_PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'GBP/JPY',
  'USD/CAD',
  'XAUUSD',
]

const ForexCalculator = () => {
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [currentPrice, setCurrentPrice] = useState(0)
  const [entryPrice, setEntryPrice] = useState(0)
  const [stopLoss, setStopLoss] = useState(0)
  const [accountCurrency, setAccountCurrency] = useState('USD')
  const [accountCapital, setAccountCapital] = useState(1000)
  const [riskPercentage, setRiskPercentage] = useState(1)
  const [tradeType, setTradeType] = useState('buy')
  const [forexRates, setForexRates] = useState(null)

  useEffect(() => {
    const loadForexRates = async () => {
      const rates = await fetchForexRates()
      setForexRates(rates)
    }
    loadForexRates()
  }, [])

  useEffect(() => {
    const fetchPrice = async () => {
      if (!forexRates) return

      const [baseCurrency, quoteCurrency] = selectedPair.split('/')
      const rate = calculateCrossRate(forexRates, baseCurrency, quoteCurrency)

      if (rate) {
        setCurrentPrice(rate)
        setEntryPrice(rate)

        // Set default stop loss (10 pips)
        const pipValue = quoteCurrency === 'JPY' ? 0.01 : 0.0001
        const defaultStop =
          tradeType === 'buy' ? rate - 10 * pipValue : rate + 10 * pipValue
        setStopLoss(defaultStop)
      }
    }

    fetchPrice()
  }, [selectedPair, tradeType, forexRates])

  const calculatePipDistance = () => {
    const priceDifference = Math.abs(entryPrice - stopLoss)
    const [, quoteCurrency] = selectedPair.split('/')

    // Convert price difference to pips
    return quoteCurrency === 'JPY'
      ? priceDifference * 100 // JPY pairs have 2 decimal places
      : priceDifference * 10000 // Other pairs have 4 decimal places
  }

  const handleStopLossChange = value => {
    const newStopLoss = parseFloat(value)
    if (tradeType === 'buy' && newStopLoss >= entryPrice) {
      return // Invalid stop loss for buy - must be below entry
    }
    if (tradeType === 'sell' && newStopLoss <= entryPrice) {
      return // Invalid stop loss for sell - must be above entry
    }
    setStopLoss(newStopLoss)
  }

  const calculateRiskAmount = () => {
    return accountCapital * (riskPercentage / 100)
  }

  const calculatePipValue = () => {
    if (!forexRates) return 10

    const [baseCurrency, quoteCurrency] = selectedPair.split('/')
    let pipValue = 10 // Default pip value for standard lot

    // For JPY pairs
    if (quoteCurrency === 'JPY') {
      // Get USDJPY rate for conversion
      const usdJpyRate = forexRates['JPY']

      if (baseCurrency === 'USD') {
        pipValue = 1000 / usdJpyRate
      } else {
        // For cross JPY pairs (e.g., GBP/JPY)
        const baseUsdRate = 1 / forexRates[baseCurrency]
        pipValue = (1000 / usdJpyRate) * baseUsdRate
      }
    }
    // For USD base pairs
    else if (baseCurrency === 'USD') {
      pipValue = 10
    }
    // For USD quote pairs
    else if (quoteCurrency === 'USD') {
      pipValue = 10 * currentPrice
    }
    // For other cross pairs
    else {
      const baseUsdRate = 1 / forexRates[baseCurrency]
      pipValue = 10 * baseUsdRate
    }

    return pipValue
  }

  const calculatePositionSize = () => {
    if (!forexRates) return '0.00'

    const riskAmount = calculateRiskAmount()
    const pipDistance = calculatePipDistance()
    const pipValuePerLot = calculatePipValue()
    const positionSize = riskAmount / (pipDistance * pipValuePerLot)

    return positionSize.toFixed(2)
  }

  return (
    <div className='max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg'>
      <h2 className='text-2xl font-bold mb-6'>
        Forex Position Size Calculator
      </h2>

      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>Forex Pair</label>
          <select
            className='w-full p-2 border rounded'
            value={selectedPair}
            onChange={e => setSelectedPair(e.target.value)}
          >
            {FOREX_PAIRS.map(pair => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Trade Type</label>
          <div className='flex gap-4'>
            <label className='flex items-center'>
              <input
                type='radio'
                value='buy'
                checked={tradeType === 'buy'}
                onChange={e => setTradeType(e.target.value)}
                className='mr-2'
              />
              Buy
            </label>
            <label className='flex items-center'>
              <input
                type='radio'
                value='sell'
                checked={tradeType === 'sell'}
                onChange={e => setTradeType(e.target.value)}
                className='mr-2'
              />
              Sell
            </label>
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Current Price
          </label>
          <input
            type='number'
            value={currentPrice}
            disabled
            className='w-full p-2 border rounded bg-gray-100'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Entry Price</label>
          <input
            type='number'
            value={entryPrice}
            onChange={e => setEntryPrice(parseFloat(e.target.value))}
            className='w-full p-2 border rounded'
            step='0.00001'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Stop Loss Price
          </label>
          <input
            type='number'
            value={stopLoss}
            onChange={e => handleStopLossChange(e.target.value)}
            className='w-full p-2 border rounded'
            step='0.00001'
            placeholder={`Enter price (e.g. ${
              selectedPair.includes('JPY') ? '155.60' : '1.2340'
            })`}
          />
          <p className='text-sm text-gray-600 mt-1'>
            Distance: {calculatePipDistance().toFixed(1)} pips
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Account Currency
          </label>
          <select
            className='w-full p-2 border rounded'
            value={accountCurrency}
            onChange={e => setAccountCurrency(e.target.value)}
          >
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
            <option value='GBP'>GBP</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Account Capital
          </label>
          <input
            type='number'
            value={accountCapital}
            onChange={e => setAccountCapital(parseFloat(e.target.value))}
            className='w-full p-2 border rounded'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Risk Percentage
          </label>
          <input
            type='number'
            value={riskPercentage}
            onChange={e => setRiskPercentage(parseFloat(e.target.value))}
            className='w-full p-2 border rounded'
            min='0'
            max='100'
            step='0.1'
          />
        </div>

        <div className='mt-6 p-4 bg-gray-100 rounded space-y-2'>
          <div>
            <h3 className='font-bold mb-1'>Risk Amount</h3>
            <p className='text-xl'>
              {accountCurrency} {calculateRiskAmount().toFixed(2)}
            </p>
          </div>
          <div>
            <h3 className='font-bold mb-1'>Position Size</h3>
            <p className='text-xl'>{calculatePositionSize()} Standard Lots</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForexCalculator
