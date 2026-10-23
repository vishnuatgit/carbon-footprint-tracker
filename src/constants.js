// Emission factors and benchmarks used by EcoMetrics.
//
// The two benchmarks come from published sources (links below).
// Every per-answer and per-action number is a rough estimate I picked for
// learning purposes. They are not scientifically precise.

export const BENCHMARKS = Object.freeze({
  // The Nature Conservancy, carbon footprint calculator page:
  // "Globally, the average carbon footprint is closer to 4 tons."
  // https://www.nature.org/en-us/get-involved/how-to-help/carbon-footprint-calculator/
  globalAverageKg: 4000,
  // Hot or Cool Institute, 1.5-Degree Lifestyles: lifestyle footprints need to
  // drop to 2.5 tCO2e per person by 2030 to line up with the 1.5 °C goal.
  // https://hotorcool.org/1-5-degree-lifestyles/
  targetKg: 2500,
});

// Onboarding questions. Each option's value is a rough annual estimate in
// kg CO2e for that part of a lifestyle.
export const QUESTIONS = Object.freeze([
  {
    id: 'transport',
    text: 'How do you usually commute?',
    options: [
      { text: 'Mostly drive alone', value: 2500 },
      { text: 'Carpool / Public Transit', value: 1200 },
      { text: 'Bike / Walk / Remote', value: 300 },
    ],
  },
  {
    id: 'diet',
    text: 'What is your typical diet profile?',
    options: [
      { text: 'High meat consumption', value: 2500 },
      { text: 'Balanced omnivore', value: 1900 },
      { text: 'Vegetarian / Plant-based', value: 1000 },
    ],
  },
  {
    id: 'energy',
    text: 'What is your primary home energy source?',
    options: [
      { text: 'Standard grid mix', value: 2000 },
      { text: 'Energy efficient / Mixed', value: 1200 },
      { text: '100% Renewable / Solar', value: 300 },
    ],
  },
  {
    id: 'flights',
    text: 'How often do you fly each year?',
    options: [
      { text: '3+ flights', value: 3000 },
      { text: '1-2 short haul', value: 1000 },
      { text: 'None / Rarely', value: 0 },
    ],
  },
  {
    id: 'shopping',
    text: 'What are your general consumption habits?',
    options: [
      { text: 'Frequent new purchases', value: 1500 },
      { text: 'Average consumer', value: 900 },
      { text: 'Minimalist / Second-hand', value: 400 },
    ],
  },
]);

// Loggable actions. `saving` is a rough kg CO2e avoided per occurrence.
export const ACTIONS = Object.freeze([
  { id: 'transit', label: 'Took public transit', saving: 4.5, tip: 'High impact: replaces a single-occupancy car trip.' },
  { id: 'plant_meal', label: 'Plant-based meal', saving: 2.1, tip: 'Diet shift: cuts the footprint of a meat-based meal.' },
  { id: 'second_hand', label: 'Second-hand purchase', saving: 15.0, tip: 'Circular economy: skips making a new product.' },
  { id: 'line_dry', label: 'Line-dried laundry', saving: 1.2, tip: 'Energy: avoids running a tumble dryer.' },
  { id: 'bike', label: 'Bicycle commute', saving: 2.5, tip: 'Zero-emission transport.' },
  { id: 'unplug', label: 'Cut standby power', saving: 0.5, tip: 'Efficiency: lowers always-on electricity use.' },
]);

// Most times one action can be logged in a single entry.
export const MAX_COUNT = 20;
