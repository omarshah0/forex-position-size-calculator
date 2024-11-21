import { fetchForexRates } from './forexApi'

const isJpy = pair => pair.includes('JPY')

const calculateLotSize = async ({
  pair,
  entryPrice,
  stopLoss,
  accountSize,
  riskPercentage,
}) => {
  try {
    // 1. Calculate risk amount in dollars
    const riskAmount = accountSize * (riskPercentage / 100)

    // 2. Calculate pip difference
    const priceDifference = Math.abs(entryPrice - stopLoss)
    const pipDistance = isJpy(pair)
      ? priceDifference * 100
      : priceDifference * 10000

    // 3. Calculate lot size based on pair type
    let lotSize
    let conversionInfo = {}
    const [baseCurrency, quoteCurrency] = pair.split('/')

    // Fetch rates for conversion if needed
    const rates = await fetchForexRates()
    if (!rates) {
      throw new Error('Failed to fetch currency rates')
    }

    if (quoteCurrency === 'USD') {
      // For pairs like EUR/USD, GBP/USD
      lotSize = riskAmount / (pipDistance * 10)
    } else if (baseCurrency === 'USD') {
      // For pairs like USD/JPY
      lotSize = riskAmount / (pipDistance * 10)
      conversionInfo.rate = `USD/${quoteCurrency}: ${rates[quoteCurrency].toFixed(3)}`
    } else {
      // For cross pairs like GBP/JPY
      const baseToUsd = 1 / rates[baseCurrency] // USD/GBP rate
      const usdToQuote = rates[quoteCurrency]   // USD/JPY rate

      lotSize = riskAmount / (pipDistance * 10 * baseToUsd)
      
      // Store conversion rates for display
      conversionInfo = {
        baseRate: `USD/${baseCurrency}: ${(1 / baseToUsd).toFixed(3)}`,
        quoteRate: `USD/${quoteCurrency}: ${usdToQuote.toFixed(3)}`
      }
    }

    return {
      success: true,
      lotSize: parseFloat(lotSize.toFixed(2)),
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      pips: parseFloat(pipDistance.toFixed(1)),
      conversionInfo
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

export { calculateLotSize }
