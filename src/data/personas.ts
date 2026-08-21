import type { Persona } from '../types'

/**
 * The four demo households. Each one exists because it exercises a different
 * part of the product: Rohit stresses leak detection, Priya stresses the RED
 * floor and fee cycles, Arjun stresses variable-income forecasting, Sneha
 * stresses the low-balance starter case.
 */
export const PERSONAS: Persona[] = [
  {
    key: 'rohit', name: 'Rohit Sharma', label: 'The leaky earner',
    age: 27, city: 'Bengaluru', role: 'Software engineer',
    monthlyIncome: 92000, dependants: 0, openingBalance: 48000,
    blurb: 'Good salary, forty small transactions a week, and nothing left at the end of the month.',
    worry: 'I finish every month at zero and I cannot say where it went.',
  },
  {
    key: 'priya', name: 'Priya Menon', label: 'The household CFO',
    age: 34, city: 'Kochi', role: 'School teacher, two children',
    monthlyIncome: 61000, dependants: 3, openingBalance: 34000,
    blurb: 'Every rupee already committed. One unplanned expense derails the month.',
    worry: 'A fee instalment surprising me a week before it is due.',
  },
  {
    key: 'arjun', name: 'Arjun Verma', label: 'The irregular earner',
    age: 42, city: 'Delhi', role: 'Printing business owner',
    monthlyIncome: 118000, variableIncome: true, dependants: 2, openingBalance: 96000,
    blurb: 'Income is lumpy and quarterly. Every budgeting app assumes a salary date he does not have.',
    worry: 'Whether rent and school fees will clear in a thin month.',
  },
  {
    key: 'sneha', name: 'Sneha Iyer', label: 'The first salary',
    age: 23, city: 'Pune', role: 'Marketing associate',
    monthlyIncome: 38000, dependants: 0, openingBalance: 11000,
    blurb: 'First job, shared rent, no savings, and no model of what healthy looks like.',
    worry: 'I do not know what a normal split even is for someone earning what I earn.',
  },
]

export const PERSONA_BY_KEY = Object.fromEntries(PERSONAS.map((p) => [p.key, p])) as Record<
  Persona['key'],
  Persona
>

/** Starter goals seeded per persona, so a new session has something to assess. */
export const SEED_GOALS: Record<Persona['key'], { name: string; target: number; saved: number; months: number; templateKey: string }[]> = {
  rohit: [
    { name: 'MBA fund', target: 1800000, saved: 210000, months: 36, templateKey: 'higher-study' },
    { name: 'Emergency fund', target: 550000, saved: 62000, months: 18, templateKey: 'emergency' },
  ],
  priya: [
    { name: "Children's education corpus", target: 2500000, saved: 480000, months: 96, templateKey: 'child-education' },
    { name: 'Emergency fund', target: 370000, saved: 145000, months: 24, templateKey: 'emergency' },
  ],
  arjun: [
    { name: 'Nine months of runway', target: 900000, saved: 310000, months: 24, templateKey: 'emergency' },
    { name: 'Machine replacement', target: 650000, saved: 90000, months: 30, templateKey: 'big-purchase' },
  ],
  sneha: [
    { name: 'First emergency fund', target: 150000, saved: 9000, months: 18, templateKey: 'emergency' },
  ],
}

export const GOAL_TEMPLATES = [
  { key: 'emergency',       name: 'Emergency fund',    months: 18, note: 'Six months of your RED floor. The assumption is 6× essentials — edit it if your situation differs.' },
  { key: 'child-education', name: "Child's education", months: 96, note: 'Indicative corpus for an undergraduate degree. Replace with your own school or college estimate.' },
  { key: 'home',            name: 'Home down payment', months: 60, note: 'Assumes a 20% down payment. Change the target to match the property you have in mind.' },
  { key: 'higher-study',    name: 'Higher study / MBA', months: 36, note: 'Programme fee plus living costs. Verify against the specific programme.' },
  { key: 'retirement',      name: 'Retirement top-up',  months: 240, note: 'Beyond EPF and NPS. Long horizons make small monthly changes matter most.' },
  { key: 'big-purchase',    name: 'Big purchase',       months: 24, note: 'Anything lumpy you would otherwise put on an EMI.' },
]
