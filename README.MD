# Weather Email Reporter

A Node.js service that fetches weather forecasts using the [Open-Meteo API](https://open-meteo.com/) and sends styled email reports via [Resend](https://resend.com/).

## Features
- 📩 Sends an email with the next **6-hour weather forecast**
- 🎨 Modern, responsive email design
- 🌍 Auto-detects timezone for forecast location
- 🕑 Runs automatically at **08:00** and **14:00** every day (via cron)

## Requirements
- Node.js (>= 18)
- Resend account with a verified sending domain

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
