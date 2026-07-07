# 🏗️ Hire Equipment Demand & Return Forecasting System

> **Capstone Project** | Data Science Portfolio | SGB Group / Brand Safway Case Study

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python)](https://python.org)
[![XGBoost](https://img.shields.io/badge/Model-XGBoost-orange)](https://xgboost.readthedocs.io)
[![Prophet](https://img.shields.io/badge/Model-Prophet-blue)](https://facebook.github.io/prophet)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

---

## 📋 Project Overview

This project is a **full-stack data science capstone** built around a real-world hire equipment business case. The system analyses historical hire invoice data from SGB Group (Brand Safway) to:

- 📈 **Forecast equipment demand** for the next 30, 60, and 90 days
- 📅 **Predict planned return dates** to prevent equipment shortages
- 🗺️ **Identify seasonality and market trends** by equipment category and region
- 📊 **Serve forecasts** through an interactive B2B dashboard deployed on Vercel

---

## 🧠 Skills Demonstrated

| Domain | Technologies |
|---|---|
| Data Engineering | pandas, numpy, datetime parsing, feature engineering |
| EDA & Visualisation | matplotlib, seaborn, plotly, statsmodels |
| Time-Series ML | Facebook Prophet, XGBoost, lag features, rolling windows |
| Model Evaluation | MAE, RMSE across multiple forecast horizons |
| Backend | Python, joblib model serialization |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| DevOps | Vercel deployment, environment variables, static asset pipeline |

---

## 📁 Repository Structure

```
Hire_project/
├── capstone_eda_and_forecasting.ipynb  # Full ML notebook (the heart of the project)
├── generate_forecast_data.py           # Script: generates forecast JSON from trained model
├── models/
│   ├── xgboost_demand_model.joblib     # Trained XGBoost model
│   └── preprocessing_pipeline.joblib   # Fitted sklearn pipeline
├── hire-dashboard/                     # Next.js portfolio dashboard
│   ├── app/                            # Next.js App Router pages
│   ├── components/                     # React chart & UI components
│   ├── public/data/
│   │   └── forecast_results.json       # Pre-computed forecast data (safe to deploy)
│   ├── package.json
│   └── vercel.json
├── requirements.txt                    # Python dependencies
└── README.md
```

> ⚠️ **Security Note**: The raw `BrandDummy_Data.csv` is listed in `.gitignore` and is **never pushed to GitHub**. Only aggregated, anonymised forecast numbers are exposed via the dashboard.

---

## 🚀 Getting Started

### 1. Run the Data Science Notebook

```bash
# Install Python dependencies
pip install -r requirements.txt

# Launch Jupyter
jupyter notebook capstone_eda_and_forecasting.ipynb
```

> **Prophet on Windows**: If `prophet` installation fails, use: `conda install -c conda-forge prophet`

Run all cells top-to-bottom. The notebook will:
1. Clean and engineer features from `BrandDummy_Data.csv`
2. Perform full EDA with visualisations
3. Train and compare Prophet vs XGBoost
4. Save model files to `models/`

### 2. Generate Forecast Data

```bash
python generate_forecast_data.py
```

This reads the trained model and outputs `hire-dashboard/public/data/forecast_results.json`.

### 3. Run the Dashboard Locally

```bash
cd hire-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
cd hire-dashboard
npx vercel --prod
```

---

## 📊 Key Findings (from EDA)

- **Peak demand** occurs in Q3 (Jul–Sep) driven by large-scale construction projects
- **Concrete Formwork** items (MANTO panels, PROTECTO clamps) dominate hire volume
- **Average hire duration** is 150–330 days, meaning equipment ties up capital for months
- **XGBoost outperforms Prophet** on RMSE across all three forecast horizons due to rich lag features

---

## 🎨 Dashboard Preview

The dashboard features:
- Dark-mode B2B theme with SGB Safway brand colours (navy, steel blue, safety orange)
- Interactive 30/60/90-day demand forecast charts with confidence bands
- Equipment category filter
- Market breakdown donut chart
- EDA insight cards

---

## 👤 Author

**[Your Name]** — Data Science Student  
📧 your.email@example.com  
🔗 [LinkedIn](https://linkedin.com) | [Portfolio](https://your-portfolio.com)

---

## 📄 Disclaimer

This project uses **dummy/synthetic data** modelled after a real construction hire business. No proprietary or confidential data is included. The project is for educational and portfolio purposes only.
