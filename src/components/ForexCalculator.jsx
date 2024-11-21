import { useState, useEffect } from 'react'
import { calculateLotSize } from '../utils/lotSizeCalculator'

const FOREX_PAIRS = [
  'GBP/JPY',
  'XAUUSD',
  'USD/JPY',
  'EUR/USD',
  'GBP/USD',
  'USD/CAD',
  'CAD/CHF'
]

const loadInitialState = () => {
  const savedState = localStorage.getItem('forexCalculator')
  if (savedState) {
    return JSON.parse(savedState)
  }
  return {
    selectedPair: 'EUR/USD',
    entryPrice: 0,
    stopLoss: 0,
    accountCapital: 1000,
    riskPercentage: 1,
    tradeType: 'buy',
  }
}

const ForexCalculator = () => {
  const initialState = loadInitialState()
  const [selectedPair, setSelectedPair] = useState(initialState.selectedPair)
  const [entryPrice, setEntryPrice] = useState(initialState.entryPrice)
  const [stopLoss, setStopLoss] = useState(initialState.stopLoss)
  const [accountCapital, setAccountCapital] = useState(initialState.accountCapital)
  const [riskPercentage, setRiskPercentage] = useState(initialState.riskPercentage)
  const [tradeType, setTradeType] = useState(initialState.tradeType)
  const [calculationResult, setCalculationResult] = useState(null)
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    const stateToSave = {
      selectedPair,
      entryPrice,
      stopLoss,
      accountCapital,
      riskPercentage,
      tradeType,
    }
    localStorage.setItem('forexCalculator', JSON.stringify(stateToSave))
  }, [selectedPair, entryPrice, stopLoss, accountCapital, riskPercentage, tradeType])

  const isGold = pair => pair === 'XAUUSD'
  const isJpy = pair => pair.includes('JPY')

  const getStepSize = pair => {
    if (isGold(pair)) return '0.01'
    if (isJpy(pair)) return '0.001'
    return '0.00001'
  }

  const handleCalculate = async () => {
    setIsCalculating(true)
    setCalculationResult(null)

    const result = await calculateLotSize({
      pair: selectedPair,
      entryPrice,
      stopLoss,
      accountSize: accountCapital,
      riskPercentage,
    })

    setCalculationResult(result)
    setIsCalculating(false)
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
              <option key={pair} value={pair}>{pair}</option>
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
              onChange={e => setEntryPrice(parseFloat(e.target.value))}
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

        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className='col-span-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300'
        >
          {isCalculating ? 'Calculating...' : 'Calculate'}
        </button>

        {calculationResult && (
          <div className='col-span-2 bg-gray-100 p-3 rounded'>
            {calculationResult.success ? (
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <div>
                    <div className='text-sm text-gray-600'>Risk Amount</div>
                    <div className='font-bold'>${calculationResult.riskAmount}</div>
                  </div>
                  <div>
                    <div className='text-sm text-gray-600'>Position Size</div>
                    <div className='font-bold'>{calculationResult.lotSize} Lots</div>
                  </div>
                  <div>
                    <div className='text-sm text-gray-600'>Pips</div>
                    <div className='font-bold'>{calculationResult.pips}</div>
                  </div>
                </div>
                
                {(calculationResult.conversionInfo.baseRate || calculationResult.conversionInfo.rate) && (
                  <div className='text-sm text-gray-600 border-t pt-2 mt-2'>
                    <div className='font-medium mb-1'>Conversion Rates Used:</div>
                    {calculationResult.conversionInfo.rate && (
                      <div>{calculationResult.conversionInfo.rate}</div>
                    )}
                    {calculationResult.conversionInfo.baseRate && (
                      <div>{calculationResult.conversionInfo.baseRate}</div>
                    )}
                    {calculationResult.conversionInfo.quoteRate && (
                      <div>{calculationResult.conversionInfo.quoteRate}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className='text-red-500'>{calculationResult.error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ForexCalculator
