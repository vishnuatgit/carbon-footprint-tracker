# EcoMetrics

A simple carbon footprint tracker I built to learn more about web development and sustainability. It helps you estimate your annual carbon emissions based on your lifestyle and lets you log daily eco-friendly actions to see how much you're saving over time.

## How it works
When you first open the app, it asks you 5 quick lifestyle questions — stuff like how you commute, what you eat, how often you fly, etc. Based on your answers, it calculates a rough annual carbon footprint and compares it to the global average (~4,000 kg) and the 1.5°C climate target (2,500 kg).

After that, you land on a dashboard where you can log actions like taking the bus, eating a plant-based meal, or buying something second-hand. Each action shows how much CO₂ you avoided, and the dashboard keeps a running total. Everything gets saved in your browser's localStorage, so your data sticks around even if you close the tab.

## Tech stack
Kept it simple — no frameworks, no build tools:
- HTML
- CSS
- JavaScript

Just open the file and it works.

## Running it locally

1. Clone the repo
   ```bash
   git clone https://github.com/vishnuatgit/carbon-footprint-tracker.git
   ```
2. Open `index.html` in your browser. That's it.

   If you want live reload while editing, use the Live Server extension in VS Code.

## Notes
- The emission numbers are rough estimates for learning purposes, not scientifically precise
- Data is stored in localStorage so there's no backend — refresh the page and your stuff is still there
- Hit "Reset Data" in the sidebar if you want to start fresh