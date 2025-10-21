/**
 * Nepal-specific utility functions
 */

// Nepali month names in Devanagari and English
export const NEPALI_MONTHS = [
  { ne: 'बैशाख', en: 'Baisakh', days: 31 },
  { ne: 'जेठ', en: 'Jestha', days: 31 },
  { ne: 'असार', en: 'Ashar', days: 32 },
  { ne: 'श्रावण', en: 'Shrawan', days: 32 },
  { ne: 'भाद्र', en: 'Bhadra', days: 31 },
  { ne: 'आश्विन', en: 'Ashwin', days: 30 },
  { ne: 'कार्तिक', en: 'Kartik', days: 30 },
  { ne: 'मंसिर', en: 'Mangsir', days: 30 },
  { ne: 'पौष', en: 'Poush', days: 30 },
  { ne: 'माघ', en: 'Magh', days: 30 },
  { ne: 'फाल्गुन', en: 'Falgun', days: 30 },
  { ne: 'चैत्र', en: 'Chaitra', days: 30 },
]

// BS to AD conversion data (simplified mapping for common years)
const BS_AD_MAPPING: Record<number, { startDate: Date; isLeapYear: boolean }> = {
  2081: { startDate: new Date(2024, 3, 13), isLeapYear: false }, // BS 2081 starts April 13, 2024
  2082: { startDate: new Date(2025, 3, 13), isLeapYear: false },
  2083: { startDate: new Date(2026, 3, 14), isLeapYear: false },
  2084: { startDate: new Date(2027, 3, 14), isLeapYear: false },
  2085: { startDate: new Date(2028, 3, 13), isLeapYear: true },
}

export interface NepaliDate {
  year: number
  month: number // 1-12
  day: number
  monthName: string
  monthNameNe: string
}

// Format NPR currency with proper comma placement (Nepali style)
export function formatNPR(amount: number, options?: {
  showSymbol?: boolean
  showDecimals?: boolean
  useShortForm?: boolean
}): string {
  const { showSymbol = true, showDecimals = true, useShortForm = false } = options || {}
  
  if (useShortForm) {
    const shortForm = formatNepalNumber(amount)
    return showSymbol ? `Rs. ${shortForm}` : shortForm
  }

  // Format with Nepali comma placement (Indian numbering system)
  const formatted = formatNepalCurrency(amount, showDecimals)
  return showSymbol ? `Rs. ${formatted}` : formatted
}

// Format currency with proper Nepali comma placement
export function formatNepalCurrency(amount: number, showDecimals: boolean = true): string {
  const isNegative = amount < 0
  const absAmount = Math.abs(amount)
  
  // Split into integer and decimal parts
  const parts = absAmount.toFixed(showDecimals ? 2 : 0).split('.')
  let integerPart = parts[0]
  const decimalPart = parts[1]
  
  // Apply Nepali comma placement (Indian numbering system)
  integerPart = addNepalCommas(integerPart)
  
  let result = integerPart
  if (showDecimals && decimalPart) {
    result += '.' + decimalPart
  }
  
  return isNegative ? '-' + result : result
}

// Add commas in Nepali style (Indian numbering system)
export function addNepalCommas(numStr: string): string {
  // Remove any existing commas
  const cleanNum = numStr.replace(/,/g, '')
  
  if (cleanNum.length <= 3) {
    return cleanNum
  }
  
  // For Indian numbering system:
  // First comma after 3 digits from right
  // Then every 2 digits
  let result = ''
  let count = 0
  
  for (let i = cleanNum.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      result = ',' + result
    }
    result = cleanNum[i] + result
    count++
  }
  
  return result
}

// Format numbers in Lakhs/Crores system with proper Nepali formatting
export function formatNepalNumber(num: number, options?: {
  precision?: number
  showFullForm?: boolean
}): string {
  const { precision = 2, showFullForm = false } = options || {}
  const absNum = Math.abs(num)
  const isNegative = num < 0
  
  let result = ''
  
  if (absNum >= 10000000) { // 1 Crore
    const crores = absNum / 10000000
    result = `${crores.toFixed(precision)} ${showFullForm ? 'Crore' : 'Cr'}`
  } else if (absNum >= 100000) { // 1 Lakh
    const lakhs = absNum / 100000
    result = `${lakhs.toFixed(precision)} ${showFullForm ? 'Lakh' : 'L'}`
  } else if (absNum >= 1000) { // 1 Thousand
    const thousands = absNum / 1000
    result = `${thousands.toFixed(1)}${showFullForm ? ' Thousand' : 'K'}`
  } else {
    result = absNum.toString()
  }
  
  return isNegative ? '-' + result : result
}

// Format number with Nepali words (for checks/invoices)
export function formatNepalNumberInWords(num: number): string {
  if (num === 0) return 'Zero'
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  function convertHundreds(n: number): string {
    let result = ''
    
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' '
      n %= 10
    } else if (n >= 10) {
      result += teens[n - 10] + ' '
      return result
    }
    
    if (n > 0) {
      result += ones[n] + ' '
    }
    
    return result
  }
  
  const isNegative = num < 0
  num = Math.abs(Math.floor(num))
  
  if (num === 0) return 'Zero'
  
  let result = ''
  
  // Handle crores
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + 'Crore '
    num %= 10000000
  }
  
  // Handle lakhs
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + 'Lakh '
    num %= 100000
  }
  
  // Handle thousands
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + 'Thousand '
    num %= 1000
  }
  
  // Handle remaining hundreds, tens, and ones
  if (num > 0) {
    result += convertHundreds(num)
  }
  
  result = result.trim()
  return isNegative ? 'Minus ' + result : result
}

// Parse Nepali formatted number string back to number
export function parseNepalNumber(numStr: string): number {
  if (!numStr || typeof numStr !== 'string') return 0
  
  // Remove currency symbols and spaces
  let cleanStr = numStr.replace(/Rs\.?|NPR|,|\s/g, '')
  
  // Handle negative numbers
  const isNegative = cleanStr.startsWith('-')
  if (isNegative) {
    cleanStr = cleanStr.substring(1)
  }
  
  // Handle short forms
  if (cleanStr.includes('Cr') || cleanStr.includes('Crore')) {
    const value = parseFloat(cleanStr.replace(/Cr|Crore/g, ''))
    return isNegative ? -value * 10000000 : value * 10000000
  }
  
  if (cleanStr.includes('L') || cleanStr.includes('Lakh')) {
    const value = parseFloat(cleanStr.replace(/L|Lakh/g, ''))
    return isNegative ? -value * 100000 : value * 100000
  }
  
  if (cleanStr.includes('K') || cleanStr.includes('Thousand')) {
    const value = parseFloat(cleanStr.replace(/K|Thousand/g, ''))
    return isNegative ? -value * 1000 : value * 1000
  }
  
  const value = parseFloat(cleanStr)
  return isNegative ? -value : value
}

// Validate Nepali number format
export function isValidNepalNumber(numStr: string): boolean {
  if (!numStr || typeof numStr !== 'string') return false
  
  // Remove currency symbols and spaces for validation
  const cleanStr = numStr.replace(/Rs\.?|NPR|\s/g, '')
  
  // Check for valid Nepali number patterns
  const patterns = [
    /^-?\d{1,3}(,\d{2})*(\.\d{1,2})?$/, // Standard Nepali comma format
    /^-?\d+(\.\d{1,2})?$/, // Simple decimal format
    /^-?\d+(\.\d{1,2})?\s?(Cr|Crore|L|Lakh|K|Thousand)$/, // Short form format
  ]
  
  return patterns.some(pattern => pattern.test(cleanStr))
}

// Format percentage in Nepali style
export function formatNepalPercentage(value: number, precision: number = 1): string {
  return `${value.toFixed(precision)}%`
}

// Currency input validation and formatting
export interface CurrencyInputOptions {
  allowNegative?: boolean
  maxValue?: number
  minValue?: number
  precision?: number
}

export function validateCurrencyInput(
  value: string, 
  options: CurrencyInputOptions = {}
): { isValid: boolean; error?: string; formattedValue?: string } {
  const { allowNegative = false, maxValue, minValue = 0, precision = 2 } = options
  
  if (!value || value.trim() === '') {
    return { isValid: false, error: 'Amount is required' }
  }
  
  const numValue = parseNepalNumber(value)
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Invalid number format' }
  }
  
  if (!allowNegative && numValue < 0) {
    return { isValid: false, error: 'Negative amounts are not allowed' }
  }
  
  if (numValue < minValue) {
    return { isValid: false, error: `Amount must be at least Rs. ${formatNPR(minValue)}` }
  }
  
  if (maxValue && numValue > maxValue) {
    return { isValid: false, error: `Amount cannot exceed Rs. ${formatNPR(maxValue)}` }
  }
  
  // Check precision
  const decimalPlaces = (numValue.toString().split('.')[1] || '').length
  if (decimalPlaces > precision) {
    return { isValid: false, error: `Amount can have maximum ${precision} decimal places` }
  }
  
  return { 
    isValid: true, 
    formattedValue: formatNPR(numValue, { showDecimals: precision > 0 })
  }
}

// Convert AD to BS date with proper calculation
export function adToBs(adDate: Date): NepaliDate {
  const year = adDate.getFullYear()
  let bsYear = year + 57 // Base conversion
  
  // Adjust for fiscal year (BS year starts around April)
  if (adDate.getMonth() < 3 || (adDate.getMonth() === 3 && adDate.getDate() < 14)) {
    bsYear -= 1
  }

  // Simplified month/day calculation (in production, use proper BS calendar library)
  const monthIndex = Math.floor((adDate.getMonth() + 9) % 12)
  const month = monthIndex + 1
  const day = Math.min(adDate.getDate(), NEPALI_MONTHS[monthIndex].days)

  return {
    year: bsYear,
    month,
    day,
    monthName: NEPALI_MONTHS[monthIndex].en,
    monthNameNe: NEPALI_MONTHS[monthIndex].ne,
  }
}

// Convert BS to AD date
export function bsToAd(bsDate: NepaliDate): Date {
  const mapping = BS_AD_MAPPING[bsDate.year]
  if (!mapping) {
    // Fallback calculation for years not in mapping
    const adYear = bsDate.year - 57
    return new Date(adYear, bsDate.month - 1, bsDate.day)
  }

  // Calculate days from start of BS year
  let totalDays = 0
  for (let i = 0; i < bsDate.month - 1; i++) {
    totalDays += NEPALI_MONTHS[i].days
  }
  totalDays += bsDate.day - 1

  const resultDate = new Date(mapping.startDate)
  resultDate.setDate(resultDate.getDate() + totalDays)
  return resultDate
}

// Format Nepali date as string
export function formatNepaliDate(nepaliDate: NepaliDate, format: 'short' | 'long' = 'short'): string {
  if (format === 'long') {
    return `${nepaliDate.day} ${nepaliDate.monthName}, ${nepaliDate.year}`
  }
  return `${nepaliDate.year}/${String(nepaliDate.month).padStart(2, '0')}/${String(nepaliDate.day).padStart(2, '0')}`
}

// Fiscal year utilities
export interface FiscalYear {
  year: string // Format: "2081/82"
  startDate: Date
  endDate: Date
  startDateBS: NepaliDate
  endDateBS: NepaliDate
}

// Get current Nepali fiscal year
export function getCurrentFiscalYear(): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed

  // Nepali fiscal year starts from Shrawan (mid-July)
  if (currentMonth >= 7) {
    return `${currentYear}/${String(currentYear + 1).slice(-2)}`
  } else {
    return `${currentYear - 1}/${String(currentYear).slice(-2)}`
  }
}

// Get fiscal year details for a given BS year
export function getFiscalYearDetails(bsYear: number): FiscalYear {
  // Fiscal year starts from 1st Shrawan and ends on 31st Ashar
  const startDateBS: NepaliDate = {
    year: bsYear,
    month: 4, // Shrawan is 4th month
    day: 1,
    monthName: 'Shrawan',
    monthNameNe: 'श्रावण',
  }

  const endDateBS: NepaliDate = {
    year: bsYear + 1,
    month: 3, // Ashar is 3rd month
    day: 32, // Last day of Ashar
    monthName: 'Ashar',
    monthNameNe: 'असार',
  }

  return {
    year: `${bsYear}/${String(bsYear + 1).slice(-2)}`,
    startDate: bsToAd(startDateBS),
    endDate: bsToAd(endDateBS),
    startDateBS,
    endDateBS,
  }
}

// Get all fiscal years in a range
export function getFiscalYearRange(startYear: number, endYear: number): FiscalYear[] {
  const fiscalYears: FiscalYear[] = []
  for (let year = startYear; year <= endYear; year++) {
    fiscalYears.push(getFiscalYearDetails(year))
  }
  return fiscalYears
}

// Check if a date falls within a fiscal year
export function isDateInFiscalYear(date: Date, fiscalYear: FiscalYear): boolean {
  return date >= fiscalYear.startDate && date <= fiscalYear.endDate
}

// Get fiscal year for a given date
export function getFiscalYearForDate(date: Date): FiscalYear {
  const nepaliDate = adToBs(date)
  let fiscalYear = nepaliDate.year

  // If date is before Shrawan (month 4), it belongs to previous fiscal year
  if (nepaliDate.month < 4) {
    fiscalYear -= 1
  }

  return getFiscalYearDetails(fiscalYear)
}

// Festival and seasonal data
export interface NepaliFestival {
  name: string
  nameNe: string
  description: string
  month: number // BS month (1-12)
  day?: number // Specific day if fixed
  duration: number // Duration in days
  type: 'major' | 'minor' | 'regional'
  businessImpact: 'high' | 'medium' | 'low'
  category: 'religious' | 'cultural' | 'seasonal' | 'national'
  recommendations: string[]
}

export const NEPALI_FESTIVALS: NepaliFestival[] = [
  {
    name: 'Dashain',
    nameNe: 'दशैं',
    description: 'The biggest festival of Nepal, celebrating victory of good over evil',
    month: 7, // Ashwin
    duration: 15,
    type: 'major',
    businessImpact: 'high',
    category: 'religious',
    recommendations: [
      'Stock up on traditional clothing and accessories',
      'Prepare gift items and decorative materials',
      'Extend business hours during shopping days',
      'Offer festival discounts and promotions',
      'Arrange for extra staff during peak days'
    ]
  },
  {
    name: 'Tihar',
    nameNe: 'तिहार',
    description: 'Festival of lights, honoring different animals and relationships',
    month: 8, // Kartik
    duration: 5,
    type: 'major',
    businessImpact: 'high',
    category: 'religious',
    recommendations: [
      'Stock diyas, candles, and decorative lights',
      'Prepare flower garlands and rangoli materials',
      'Offer sweets and traditional food items',
      'Create special gift packages for families',
      'Promote home decoration items'
    ]
  },
  {
    name: 'Holi',
    nameNe: 'होली',
    description: 'Festival of colors celebrating spring and love',
    month: 12, // Falgun
    duration: 2,
    type: 'major',
    businessImpact: 'medium',
    category: 'religious',
    recommendations: [
      'Stock colored powders and water guns',
      'Prepare white clothes for color play',
      'Offer protective clothing and accessories',
      'Create Holi celebration packages',
      'Promote cleaning supplies for post-festival cleanup'
    ]
  },
  {
    name: 'Teej',
    nameNe: 'तीज',
    description: 'Festival for women, celebrating marital bliss and family',
    month: 5, // Bhadra
    duration: 3,
    type: 'major',
    businessImpact: 'high',
    category: 'religious',
    recommendations: [
      'Focus on women\'s traditional clothing',
      'Stock red bangles, sindoor, and jewelry',
      'Offer mehendi and beauty services',
      'Create special Teej gift sets',
      'Promote traditional food items'
    ]
  },
  {
    name: 'Buddha Jayanti',
    nameNe: 'बुद्ध जयन्ती',
    description: 'Celebration of Buddha\'s birth, enlightenment, and death',
    month: 2, // Jestha
    day: 15,
    duration: 1,
    type: 'major',
    businessImpact: 'low',
    category: 'religious',
    recommendations: [
      'Promote peaceful and spiritual items',
      'Offer books and meditation accessories',
      'Create serene shopping environment',
      'Support local Buddhist community events'
    ]
  },
  {
    name: 'Maghe Sankranti',
    nameNe: 'माघे संक्रान्ति',
    description: 'Festival marking the end of winter and beginning of longer days',
    month: 10, // Magh
    day: 1,
    duration: 1,
    type: 'minor',
    businessImpact: 'medium',
    category: 'seasonal',
    recommendations: [
      'Promote sesame seeds and jaggery products',
      'Stock warm clothing and blankets',
      'Offer traditional winter foods',
      'Create health and wellness packages'
    ]
  },
  {
    name: 'Janai Purnima',
    nameNe: 'जनै पूर्णिमा',
    description: 'Sacred thread festival for Hindu men',
    month: 4, // Shrawan
    day: 15,
    duration: 1,
    type: 'minor',
    businessImpact: 'low',
    category: 'religious',
    recommendations: [
      'Stock sacred threads and religious items',
      'Promote traditional clothing for men',
      'Offer religious books and accessories'
    ]
  },
  {
    name: 'Indra Jatra',
    nameNe: 'इन्द्र जात्रा',
    description: 'Festival honoring Indra, the king of gods',
    month: 6, // Ashwin
    duration: 8,
    type: 'minor',
    businessImpact: 'medium',
    category: 'cultural',
    recommendations: [
      'Focus on traditional Newari items',
      'Stock cultural performance accessories',
      'Promote local handicrafts',
      'Support cultural events and parades'
    ]
  }
]

// Seasonal business periods
export interface SeasonalPeriod {
  name: string
  nameNe: string
  startMonth: number // BS month
  endMonth: number
  characteristics: string[]
  businessOpportunities: string[]
  challenges: string[]
  recommendedActions: string[]
}

export const SEASONAL_PERIODS: SeasonalPeriod[] = [
  {
    name: 'Spring Season',
    nameNe: 'बसन्त ऋतु',
    startMonth: 11, // Falgun
    endMonth: 2, // Jestha
    characteristics: [
      'Pleasant weather',
      'Festival season (Holi, New Year)',
      'Wedding season begins',
      'Agricultural activities increase'
    ],
    businessOpportunities: [
      'Wedding and celebration items',
      'Spring clothing collection',
      'Outdoor activity gear',
      'Festival-specific products'
    ],
    challenges: [
      'Increased competition during festivals',
      'Supply chain pressure',
      'Higher customer expectations'
    ],
    recommendedActions: [
      'Plan inventory 2 months ahead',
      'Negotiate better supplier terms',
      'Hire seasonal staff',
      'Launch spring marketing campaigns'
    ]
  },
  {
    name: 'Summer Season',
    nameNe: 'ग्रीष्म ऋतु',
    startMonth: 3, // Ashar
    endMonth: 5, // Bhadra
    characteristics: [
      'Hot and humid weather',
      'Monsoon season',
      'School holidays',
      'Reduced outdoor activities'
    ],
    businessOpportunities: [
      'Summer clothing and accessories',
      'Rain protection items',
      'Indoor entertainment products',
      'School supplies for new session'
    ],
    challenges: [
      'Reduced foot traffic',
      'Inventory damage from humidity',
      'Transportation difficulties'
    ],
    recommendedActions: [
      'Focus on online sales',
      'Improve store ventilation',
      'Offer delivery services',
      'Plan monsoon-proof storage'
    ]
  },
  {
    name: 'Autumn Season',
    nameNe: 'शरद ऋतु',
    startMonth: 6, // Ashwin
    endMonth: 8, // Kartik
    characteristics: [
      'Clear skies and pleasant weather',
      'Major festival season (Dashain, Tihar)',
      'Peak business period',
      'High consumer spending'
    ],
    businessOpportunities: [
      'Festival clothing and accessories',
      'Gift items and decorations',
      'Traditional food items',
      'Travel and tourism products'
    ],
    challenges: [
      'Intense competition',
      'Supply shortages',
      'Price fluctuations',
      'Staff management during festivals'
    ],
    recommendedActions: [
      'Stock up 3 months in advance',
      'Implement dynamic pricing',
      'Extend business hours',
      'Create festival marketing campaigns'
    ]
  },
  {
    name: 'Winter Season',
    nameNe: 'शीत ऋतु',
    startMonth: 9, // Mangsir
    endMonth: 1, // Chaitra
    characteristics: [
      'Cold and dry weather',
      'Wedding season peak',
      'Tourist season',
      'Year-end celebrations'
    ],
    businessOpportunities: [
      'Winter clothing and accessories',
      'Wedding-related items',
      'Tourist souvenirs',
      'New Year celebration products'
    ],
    challenges: [
      'Seasonal demand fluctuations',
      'Higher heating costs',
      'Reduced daylight hours'
    ],
    recommendedActions: [
      'Optimize heating and lighting',
      'Focus on wedding market',
      'Develop tourist packages',
      'Plan year-end inventory clearance'
    ]
  }
]

// Festival and seasonal utilities
export function getUpcomingFestivals(fromDate: Date, days: number = 30): NepaliFestival[] {
  const nepaliFromDate = adToBs(fromDate)
  const upcomingFestivals: NepaliFestival[] = []

  // Simple implementation - in production, calculate exact dates
  NEPALI_FESTIVALS.forEach(festival => {
    // Check if festival month is within the next period
    const monthDiff = festival.month - nepaliFromDate.month
    if (monthDiff >= 0 && monthDiff <= 2) {
      upcomingFestivals.push(festival)
    }
  })

  return upcomingFestivals.sort((a, b) => a.month - b.month)
}

export function getCurrentSeason(date: Date = new Date()): SeasonalPeriod {
  const nepaliDate = adToBs(date)
  const month = nepaliDate.month

  return SEASONAL_PERIODS.find(season => {
    if (season.startMonth <= season.endMonth) {
      return month >= season.startMonth && month <= season.endMonth
    } else {
      // Season spans across year boundary
      return month >= season.startMonth || month <= season.endMonth
    }
  }) || SEASONAL_PERIODS[0]
}

export function getFestivalsByMonth(month: number): NepaliFestival[] {
  return NEPALI_FESTIVALS.filter(festival => festival.month === month)
}

export function getFestivalsByImpact(impact: 'high' | 'medium' | 'low'): NepaliFestival[] {
  return NEPALI_FESTIVALS.filter(festival => festival.businessImpact === impact)
}

export function getSeasonalRecommendations(date: Date = new Date()): string[] {
  const currentSeason = getCurrentSeason(date)
  const upcomingFestivals = getUpcomingFestivals(date)
  
  const recommendations = [...currentSeason.recommendedActions]
  
  upcomingFestivals.forEach(festival => {
    recommendations.push(...festival.recommendations)
  })
  
  return [...new Set(recommendations)] // Remove duplicates
}

// Check if date falls in major Nepali festivals
export function isNepaliFestival(date: Date): {
  isFestival: boolean
  festival?: NepaliFestival
} {
  const nepaliDate = adToBs(date)
  
  const festival = NEPALI_FESTIVALS.find(f => {
    if (f.day) {
      return f.month === nepaliDate.month && f.day === nepaliDate.day
    }
    // For festivals without specific day, check if in the month
    return f.month === nepaliDate.month
  })

  return {
    isFestival: !!festival,
    festival,
  }
}

// Validate Nepali phone number
export function isValidNepaliPhone(phone: string): boolean {
  // Nepali mobile numbers: 98XXXXXXXX or 97XXXXXXXX
  const mobileRegex = /^(98|97)\d{8}$/
  // Landline: 01-XXXXXXX (Kathmandu) or similar patterns
  const landlineRegex = /^0\d{1,2}-?\d{6,7}$/

  const cleanPhone = phone.replace(/[\s-]/g, '')
  return mobileRegex.test(cleanPhone) || landlineRegex.test(cleanPhone)
}
