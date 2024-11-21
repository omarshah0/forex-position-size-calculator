import { useState, useEffect } from 'react'
import { fetchForexRates, calculateCrossRate } from '../utils/forexApi'

const FOREX_PAIRS = [
  'GBP/JPY',
  'XAUUSD',
  'USD/JPY',
  'EUR/USD',
  'GBP/USD',
  'USD/CAD',
]

const ForexCalculator = () => {
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [entryPrice, setEntryPrice] = useState(0)
  const [stopLoss, setStopLoss] = useState(0)
  const [accountCapital, setAccountCapital] = useState(1000)
  const [riskPercentage, setRiskPercentage] = useState(1)
  const [tradeType, setTradeType] = useState('buy')
  const [forexRates, setForexRates] = useState(null)

  const isGold = pair => pair === 'XAUUSD'
  const isJpy = pair => pair.includes('JPY')

  const formatPrice = (price, pair) => {
    if (isGold(pair)) return price.toFixed(2)
    if (isJpy(pair)) return price.toFixed(3)
    return price.toFixed(5)
  }

  const getStepSize = pair => {
    if (isGold(pair)) return '0.01'
    if (isJpy(pair)) return '0.001'
    return '0.00001'
  }

  const getPipSize = pair => {
    if (isGold(pair)) return 1
    if (isJpy(pair)) return 0.01
    return 0.0001
  }

  useEffect(() => {
    fetchForexRates().then(setForexRates)
  }, [])

  useEffect(() => {
    if (!forexRates) return

    let rate = isGold(selectedPair)
      ? forexRates['XAU']
      : calculateCrossRate(forexRates, ...selectedPair.split('/'))

    if (rate) {
      const formattedRate = parseFloat(formatPrice(rate, selectedPair))
      setEntryPrice(formattedRate)

      const pipSize = getPipSize(selectedPair)
      setStopLoss(
        tradeType === 'buy'
          ? parseFloat(formatPrice(formattedRate - 10 * pipSize, selectedPair))
          : parseFloat(formatPrice(formattedRate + 10 * pipSize, selectedPair))
      )
    }
  }, [selectedPair, tradeType, forexRates])

  const handleEntryPriceChange = value => {
    const newEntryPrice = parseFloat(value)
    setEntryPrice(newEntryPrice)

    // Adjust stop loss if needed based on trade type
    if (tradeType === 'buy' && stopLoss >= newEntryPrice) {
      const newStopLoss = parseFloat(
        formatPrice(newEntryPrice - 10 * getPipSize(selectedPair), selectedPair)
      )
      setStopLoss(newStopLoss)
    } else if (tradeType === 'sell' && stopLoss <= newEntryPrice) {
      const newStopLoss = parseFloat(
        formatPrice(newEntryPrice + 10 * getPipSize(selectedPair), selectedPair)
      )
      setStopLoss(newStopLoss)
    }
  }

  const calculatePipDistance = () => {
    const diff = Math.abs(entryPrice - stopLoss)
    return isGold(selectedPair)
      ? diff * 100
      : isJpy(selectedPair)
      ? diff * 100
      : diff * 10000
  }

  const calculatePositionSize = () => {
    if (!forexRates) return '0.00'
    const riskAmount = accountCapital * (riskPercentage / 100)
    const pipDistance = calculatePipDistance()
    const pipValue = isGold(selectedPair) ? 1 : 10
    return (riskAmount / (pipDistance * pipValue)).toFixed(2)
  }

  return (
    <div className='w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-lg'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='col-span-2 flex gap-2 items-center'>
          <select
            className='flex-1 p-2 border rounded'
            value={selectedPair}
            onChange={e => setSelectedPair(e.target.value)}
          >
            {FOREX_PAIRS.map(pair => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
          <div className='flex gap-2 bg-gray-100 p-1 rounded'>
            <label className='flex items-center'>
              <input
                type='radio'
                value='buy'
                checked={tradeType === 'buy'}
                onChange={e => setTradeType(e.target.value)}
                className='mr-1'
              />
              Buy
            </label>
            <label className='flex items-center'>
              <input
                type='radio'
                value='sell'
                checked={tradeType === 'sell'}
                onChange={e => setTradeType(e.target.value)}
                className='mr-1'
              />
              Sell
            </label>
          </div>
        </div>

        <div className='space-y-4'>
          <div>
            <label className='text-sm text-gray-600'>Entry</label>
            <input
              type='number'
              value={entryPrice}
              onChange={e => handleEntryPriceChange(e.target.value)}
              className='w-full p-2 border rounded'
              step={getStepSize(selectedPair)}
            />
          </div>
          <div>
            <label className='text-sm text-gray-600'>Account Size ($)</label>
            <input
              type='number'
              value={accountCapital}
              onChange={e => setAccountCapital(parseFloat(e.target.value))}
              className='w-full p-2 border rounded'
            />
          </div>
        </div>

        <div className='space-y-4'>
          <div>
            <label className='text-sm text-gray-600'>Stop Loss</label>
            <input
              type='number'
              value={stopLoss}
              onChange={e => setStopLoss(parseFloat(e.target.value))}
              className='w-full p-2 border rounded'
              step={getStepSize(selectedPair)}
            />
          </div>
          <div>
            <label className='text-sm text-gray-600'>Risk %</label>
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
        </div>

        <div className='col-span-2 bg-gray-100 p-3 rounded flex justify-between items-center'>
          <div>
            <div className='text-sm text-gray-600'>Risk Amount</div>
            <div className='font-bold'>
              ${(accountCapital * (riskPercentage / 100)).toFixed(2)}
            </div>
          </div>
          <div>
            <div className='text-sm text-gray-600'>Position Size</div>
            <div className='font-bold'>{calculatePositionSize()} Lots</div>
          </div>
          <div>
            <div className='text-sm text-gray-600'>Pips</div>
            <div className='font-bold'>{calculatePipDistance().toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForexCalculator
