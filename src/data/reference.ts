/**
 * Shared reference data and the seeded RNG factory.
 *
 * Both the org chart (orgData) and the transaction records (mockInsuranceData)
 * build on this, so branches, regions and the demo calendar stay in sync.
 */

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const PRODUCTS = [
  'SecureLife Term Plus',
  'WealthBuilder ULIP',
  'Guaranteed Income Plan',
  'Retirement Advantage',
  'Smart Savings Plus',
  'Child Future Secure',
] as const

export const CHANNELS = ['Agency', 'Bancassurance', 'Direct', 'Broker', 'Digital'] as const

export const REGIONS = ['North', 'South', 'East', 'West', 'Central'] as const

export const BRANCHES: Record<string, string[]> = {
  North: ['Delhi NCR', 'Chandigarh', 'Jaipur'],
  South: ['Bengaluru', 'Chennai', 'Hyderabad', 'Kochi'],
  East: ['Kolkata', 'Bhubaneswar', 'Guwahati'],
  West: ['Mumbai Central', 'Pune', 'Ahmedabad', 'Surat'],
  Central: ['Indore', 'Nagpur', 'Lucknow'],
}

export const BRANCH_LIST = Object.values(BRANCHES).flat()

/** Two senior zones sit between the national head and the regional managers. */
export const ZONES: Record<string, string[]> = {
  'Zone A': ['West', 'South'],
  'Zone B': ['North', 'East', 'Central'],
}

/** "Today" for the mock dataset. Fixed so the demo is reproducible. */
export const TODAY = new Date('2026-09-09T00:00:00Z')

/** Books of business start here — used by the ITD period. */
export const INCEPTION = new Date('2024-04-01T00:00:00Z')

export const FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Ishaan', 'Kabir', 'Rohan', 'Aditya', 'Nikhil', 'Rahul', 'Siddharth', 'Manish',
  'Ananya', 'Diya', 'Meera', 'Kavya', 'Sneha', 'Priya', 'Nandini', 'Ritika', 'Shruti', 'Pooja',
  'Suresh', 'Ramesh', 'Vikram', 'Arjun', 'Deepak', 'Harsha', 'Lakshmi', 'Divya', 'Farhan', 'Zoya',
  'Neha', 'Karan', 'Anil', 'Tara', 'Varun', 'Ishita', 'Gaurav', 'Rekha', 'Yash', 'Sanjana',
]

export const LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Patil', 'Deshpande', 'Bose', 'Chatterjee', 'Ghosh',
  'Kulkarni', 'Menon', 'Rao', 'Joshi', 'Malhotra', 'Kapoor', 'Bhatia', 'Sinha', 'Pillai', 'Shetty',
  'Trivedi', 'Chauhan', 'Mehta', 'Agarwal', 'Banerjee', 'Fernandes', 'Qureshi', 'Sethi',
]
