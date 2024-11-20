const API_KEY = 'f9c19c85b94a8ca50b289136' // Get from https://www.exchangerate-api.com/
const BASE_URL = 'https://v6.exchangerate-api.com/v6'

export const fetchForexRates = async (baseCurrency = 'USD') => {
  try {
    const response = await fetch(`${BASE_URL}/${API_KEY}/latest/${baseCurrency}`)
    const data = await response.json()
    
    data.conversion_rates['XAU'] = 1950.25 // Example fixed price
    
    return data.conversion_rates
  } catch (error) {
    console.error('Error fetching forex rates:', error)
    return null
  }
}

export const calculateCrossRate = (rates, fromCurrency, toCurrency) => {
  if (!rates) return null

  if (fromCurrency === 'XAU' && toCurrency === 'USD') {
    return rates['XAU']
  }

  if (fromCurrency === 'USD') return rates[toCurrency]
  if (toCurrency === 'USD') return 1 / rates[fromCurrency]

  const fromUsdRate = rates[fromCurrency]
  const toUsdRate = rates[toCurrency]
  
  return toUsdRate / fromUsdRate
} 