# EcoMetrics

Hey there! Welcome to EcoMetrics. This is my submission for the carbon footprint tracker challenge.

I originally thought about building an AI-coach chatbot, but I realized a clean, straightforward dashboard would be much more practical and usable. So, I built a lightweight, interactive web app to help people understand their baseline carbon footprint and track their daily eco-friendly actions.

## How it works
When you first open the app, it asks you 5 quick lifestyle questions. Based on your answers, it estimates your annual carbon footprint and compares it to the global average (around 4,000 kg) and the 1.5°C climate target (2,500 kg). 

From there, you can log daily actions—like taking the bus or buying something second-hand. The dashboard tracks the carbon you've saved and gives you personalized tips based on your biggest emission areas. Everything is saved locally in your browser using `localStorage`, so you can close the tab and come back tomorrow without losing any of your progress.

## Tech Stack
To keep things as fast and lightweight as possible (and well under the 10 MB repo limit), I stuck to the basics:
- Vanilla HTML
- Vanilla CSS 
- Vanilla JavaScript

There's no build step, no Webpack, and absolutely no `node_modules` folder to worry about. 

## Setup Instructions
Getting this running is incredibly simple since there are no dependencies to install.

1. **Clone the repo**
   ```bash
   git clone https://github.com/vishnuatgit/carbon-footprint-tracker.git
   ```
2. **Open the app**
   You can literally just double-click the `index.html` file to open it directly in your browser. It works right out of the box. 
   
   *(If you're making edits and prefer using a local server, just open the folder in VS Code and use the Live Server extension).*

3. **Host it live (Optional)**
   Because it's a pure static site, you can host it for free on GitHub Pages. Just go to your repository settings on GitHub, click "Pages" on the left sidebar, set the source to deploy from the `main` branch, and hit save.

## A quick note on the math
The carbon emission numbers used in the onboarding survey and the action logger are rough estimates meant for educational purposes. While they aren't exact scientific measurements, they're scaled correctly to give you a solid idea of which behavioral changes have the biggest real-world impact.