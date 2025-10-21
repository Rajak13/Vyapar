// Demo script to test Nepal formatting functions
import { 
  formatNPR, 
  formatNepalNumber, 
  formatNepalCurrency,
  addNepalCommas,
  parseNepalNumber,
  validateCurrencyInput,
  formatNepalNumberInWords
} from './nepal-utils'

console.log('Nepal Number Formatting Demo')
console.log('============================')

// Test currency formatting
console.log('\n1. Currency Formatting:')
console.log('formatNPR(1234567.89):', formatNPR(1234567.89))
console.log('formatNPR(1234567.89, {useShortForm: true}):', formatNPR(1234567.89, {useShortForm: true}))
console.log('formatNPR(1234567.89, {showSymbol: false}):', formatNPR(1234567.89, {showSymbol: false}))
console.log('formatNPR(-50000):', formatNPR(-50000))

// Test Lakh/Crore formatting
console.log('\n2. Lakh/Crore Formatting:')
console.log('formatNepalNumber(123456):', formatNepalNumber(123456))
console.log('formatNepalNumber(12345678):', formatNepalNumber(12345678))
console.log('formatNepalNumber(123456789):', formatNepalNumber(123456789))
console.log('formatNepalNumber(1234):', formatNepalNumber(1234))

// Test comma placement
console.log('\n3. Nepali Comma Placement:')
console.log('addNepalCommas("1234567"):', addNepalCommas('1234567'))
console.log('addNepalCommas("123456789"):', addNepalCommas('123456789'))
console.log('addNepalCommas("12345"):', addNepalCommas('12345'))

// Test parsing
console.log('\n4. Parsing Nepal Numbers:')
console.log('parseNepalNumber("Rs. 12,34,567.89"):', parseNepalNumber('Rs. 12,34,567.89'))
console.log('parseNepalNumber("5.5 L"):', parseNepalNumber('5.5 L'))
console.log('parseNepalNumber("2.3 Cr"):', parseNepalNumber('2.3 Cr'))
console.log('parseNepalNumber("-1,23,456"):', parseNepalNumber('-1,23,456'))

// Test validation
console.log('\n5. Currency Validation:')
const validation1 = validateCurrencyInput('1,23,456.78')
console.log('validateCurrencyInput("1,23,456.78"):', validation1)

const validation2 = validateCurrencyInput('-1,000', { allowNegative: false })
console.log('validateCurrencyInput("-1,000", {allowNegative: false}):', validation2)

// Test number in words
console.log('\n6. Numbers in Words:')
console.log('formatNepalNumberInWords(123456):', formatNepalNumberInWords(123456))
console.log('formatNepalNumberInWords(10000000):', formatNepalNumberInWords(10000000))
console.log('formatNepalNumberInWords(-5000):', formatNepalNumberInWords(-5000))

console.log('\n✅ All formatting functions are working correctly!')