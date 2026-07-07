"""
generate_forecast_data.py
=========================
Run this script AFTER completing the Jupyter notebook to regenerate
the forecast_results.json file used by the Next.js dashboard.

Usage:
    python generate_forecast_data.py

Requirements:
    - The notebook must have been run top-to-bottom first (models/ directory must exist)
    - BrandDummy_Data.csv must be present
    - pip install -r requirements.txt
"""

import os
import json
import warnings
import numpy as np
import pandas as pd
import joblib
import pickle
from datetime import datetime

warnings.filterwarnings('ignore')

# ============================================================
# Configuration
# ============================================================
DATA_PATH      = 'BrandDummy_Data.csv'
XGB_MODEL_PATH = 'models/xgboost_demand_model.joblib'
META_PATH      = 'models/feature_metadata.json'
OUTPUT_PATH    = 'hire-dashboard/public/data/forecast_results.json'
FORECAST_WEEKS = 14  # 90 days ≈ 13 weeks, +1 buffer

# ============================================================
# Category Rules (must match notebook)
# ============================================================
CATEGORY_RULES = {
    'Formwork Panels': ['panel', 'manto-panel', 'manto panel', 'rasto-panel', 'rasto panel',
                        'takko-panel', 'takko panel', 'giant panel', 'inner corner', 'outer corner'],
    'Accessories & Connectors': ['clamp', 'tie nut', 'bolt', 'connector', 'wedge', 'pin', 'hook',
                                 'fastener', 'nut', 'screw', 'element connector', 'fork head'],
    'Alignment & Struts': ['aligning strut', 'alignment strut', 'strut', 'm-aligning',
                           'strut head', 'strut connector', 'adaptor for alignment'],
    'Safety & Railings': ['railing', 'toe board', 'safety', 'protecto railing', 'guard'],
    'Transport & Storage': ['lattice box', 'stacking frame', 'transport hook', 'loading adapter',
                            'crane adaptor', 'euro lattice', 'euro stacking'],
    'Scaffolding Components': ['scaffold', 'ledger', 'transom', 'standard', 'coupler'],
    'Walers & Beams': ['waler', 'waling', 'beam', 'wailer', 'multi purpose waler'],
}

def classify_equipment(desc):
    if not isinstance(desc, str):
        return 'Other'
    d = desc.lower()
    for cat, kws in CATEGORY_RULES.items():
        if any(k in d for k in kws):
            return cat
    return 'Other'

def create_lag_features(df_ts, target_col='total_qty'):
    df_feat = df_ts.copy()
    for lag in [1, 2, 3, 4, 8, 13, 26, 52]:
        df_feat[f'lag_{lag}'] = df_feat[target_col].shift(lag)
    df_feat['rolling_mean_4']  = df_feat[target_col].shift(1).rolling(4).mean()
    df_feat['rolling_mean_13'] = df_feat[target_col].shift(1).rolling(13).mean()
    df_feat['rolling_std_4']   = df_feat[target_col].shift(1).rolling(4).std()
    df_feat['rolling_min_4']   = df_feat[target_col].shift(1).rolling(4).min()
    df_feat['rolling_max_4']   = df_feat[target_col].shift(1).rolling(4).max()
    df_feat['diff_1']  = df_feat[target_col].diff(1)
    df_feat['diff_4']  = df_feat[target_col].diff(4)
    df_feat['diff_52'] = df_feat[target_col].diff(52)
    df_feat['month']        = pd.DatetimeIndex(df_feat['week']).month
    df_feat['quarter']      = pd.DatetimeIndex(df_feat['week']).quarter
    df_feat['week_of_year'] = pd.DatetimeIndex(df_feat['week']).isocalendar().week.astype(int)
    df_feat['year']         = pd.DatetimeIndex(df_feat['week']).year
    df_feat['is_q_end']     = pd.DatetimeIndex(df_feat['week']).is_quarter_end.astype(int)
    df_feat['month_sin']    = np.sin(2 * np.pi * df_feat['month'] / 12)
    df_feat['month_cos']    = np.cos(2 * np.pi * df_feat['month'] / 12)
    df_feat['week_sin']     = np.sin(2 * np.pi * df_feat['week_of_year'] / 52)
    df_feat['week_cos']     = np.cos(2 * np.pi * df_feat['week_of_year'] / 52)
    return df_feat

def main():
    print('Generating forecast data for dashboard...')

    # --------------------------------------------------------
    # 1. Load & clean data
    # --------------------------------------------------------
    print('  Loading data...')
    df = pd.read_csv(DATA_PATH, low_memory=False)
    for col in ['BOOKED_DATE', 'ORDERED_DATE', 'TRX_DATE']:
        df[col] = pd.to_datetime(df[col], format='%d/%b/%Y', errors='coerce')
    df['PLANNED_RETURN_DATE'] = pd.to_datetime(
        df['PLANNED_RETURN_DATE'], format='%m/%d/%Y %I:%M:%S %p', errors='coerce'
    )
    df = df.dropna(subset=['TRX_DATE'])
    df = df[df['QUANTITY'] > 0]
    df = df[df['ORDER_TYPE'] == 'HIRE'].copy()
    Q3 = df['QUANTITY'].quantile(0.75)
    IQR = Q3 - df['QUANTITY'].quantile(0.25)
    df['QUANTITY'] = df['QUANTITY'].clip(upper=Q3 + 3.0 * IQR)
    df['EQUIPMENT_CATEGORY'] = df['DESCRIPTION'].apply(classify_equipment)

    # --------------------------------------------------------
    # 2. Load trained model
    # --------------------------------------------------------
    print('  Loading XGBoost model...')
    if not os.path.exists(XGB_MODEL_PATH):
        raise FileNotFoundError(
            f'Model not found: {XGB_MODEL_PATH}\n'
            'Please run the Jupyter notebook first to train and save the model.'
        )
    xgb_model = joblib.load(XGB_MODEL_PATH)
    with open(META_PATH) as f:
        meta = json.load(f)
    FEATURE_COLS = meta['feature_columns']

    # --------------------------------------------------------
    # 3. Build weekly time series
    # --------------------------------------------------------
    df['trx_week'] = df['TRX_DATE'].dt.to_period('W').dt.start_time
    ts = (
        df.groupby('trx_week')['QUANTITY']
        .sum()
        .reset_index()
        .rename(columns={'trx_week': 'week', 'QUANTITY': 'total_qty'})
        .sort_values('week')
        .reset_index(drop=True)
    )

    # --------------------------------------------------------
    # 4. Recursive 90-day forecast
    # --------------------------------------------------------
    print('  Generating forecasts...')
    forecast_ref = pd.Timestamp.now()
    ts_ext = ts.copy()
    future_preds = []

    for i in range(FORECAST_WEEKS):
        future_week = forecast_ref + pd.Timedelta(weeks=i+1)
        feat = create_lag_features(ts_ext).dropna()
        last_row = feat.tail(1)[FEATURE_COLS]
        pred = float(xgb_model.predict(last_row).clip(min=0)[0])
        ts_ext = pd.concat(
            [ts_ext, pd.DataFrame({'week': [future_week], 'total_qty': [pred]})],
            ignore_index=True
        )
        future_preds.append({'week': future_week.strftime('%Y-%m-%d'), 'forecast': round(pred)})

    # --------------------------------------------------------
    # 5. Compile supporting metrics
    # --------------------------------------------------------
    monthly_hist = (
        df.groupby(df['TRX_DATE'].dt.to_period('M'))['QUANTITY']
        .sum().reset_index()
    )
    monthly_hist.columns = ['month', 'total_qty']
    monthly_hist['month'] = monthly_hist['month'].astype(str)

    market_data = (
        df.groupby('OM_MARKET_TYPE')['QUANTITY']
        .sum().sort_values(ascending=False).reset_index()
    )
    total_qty = market_data['QUANTITY'].sum()
    market_data['pct'] = (market_data['QUANTITY'] / total_qty * 100).round(1)

    cat_data = (
        df.groupby('EQUIPMENT_CATEGORY')['QUANTITY']
        .sum().sort_values(ascending=False).reset_index()
    )
    cat_data['pct'] = (cat_data['QUANTITY'] / total_qty * 100).round(1)

    df_ret = df.dropna(subset=['PLANNED_RETURN_DATE']).copy()
    df_ret['return_week'] = df_ret['PLANNED_RETURN_DATE'].dt.to_period('W').dt.start_time
    
    weekly_return_forecast = {}
    
    # All Categories
    returns_all = (
        df_ret.groupby('return_week')['QUANTITY']
        .sum().reset_index()
        .rename(columns={'return_week': 'week', 'QUANTITY': 'expected_returns'})
        .sort_values('week').reset_index(drop=True)
    )
    returns_all = returns_all[returns_all['week'] >= forecast_ref].head(FORECAST_WEEKS)
    returns_all['cumulative'] = returns_all['expected_returns'].cumsum()
    
    weekly_return_forecast['all_categories'] = [
        {
            'week': str(row.week.date()),
            'expected_returns': int(row.expected_returns),
            'cumulative': int(row.cumulative)
        }
        for _, row in returns_all.iterrows()
    ]
    
    # By Category
    for cat in df_ret['EQUIPMENT_CATEGORY'].unique():
        returns_cat = (
            df_ret[df_ret['EQUIPMENT_CATEGORY'] == cat].groupby('return_week')['QUANTITY']
            .sum().reset_index()
            .rename(columns={'return_week': 'week', 'QUANTITY': 'expected_returns'})
            .sort_values('week').reset_index(drop=True)
        )
        returns_cat = returns_cat[returns_cat['week'] >= forecast_ref].head(FORECAST_WEEKS)
        returns_cat['cumulative'] = returns_cat['expected_returns'].cumsum()
        
        weekly_return_forecast[cat] = [
            {
                'week': str(row.week.date()),
                'expected_returns': int(row.expected_returns),
                'cumulative': int(row.cumulative)
            }
            for _, row in returns_cat.iterrows()
        ]

    # --------------------------------------------------------
    # 6. Assemble and save JSON
    # --------------------------------------------------------
    output = {
        'generated_at':            datetime.now().strftime('%Y-%m-%d'),
        'model_used':              'XGBoost',
        'total_records':           int(len(df)),
        'forecast_reference_date': forecast_ref.strftime('%Y-%m-%d'),
        'kpi_summary': {
            'total_orders':               int(len(df)),
            'unique_equipment_types':     int(df['DESCRIPTION'].nunique()),
            'avg_hire_duration_days':     int(df['HIRE_DURATION'].median()),
            'total_qty_forecast_30d':     int(sum(fp['forecast'] for fp in future_preds[:4])),
            'total_qty_forecast_60d':     int(sum(fp['forecast'] for fp in future_preds[:8])),
            'total_qty_forecast_90d':     int(sum(fp['forecast'] for fp in future_preds[:13])),
            'most_demanded_category':     cat_data.iloc[0]['EQUIPMENT_CATEGORY'],
        },
        'equipment_categories': list(cat_data['EQUIPMENT_CATEGORY']),
        'weekly_demand_forecast': {
            'all_categories': [
                {
                    'week':     fp['week'],
                    'actual':   None,
                    'forecast': fp['forecast'],
                    'lower':    round(fp['forecast'] * 0.87),
                    'upper':    round(fp['forecast'] * 1.13),
                }
                for fp in future_preds
            ]
        },
        'weekly_return_forecast': weekly_return_forecast,
        'market_breakdown': [
            {
                'market':    row['OM_MARKET_TYPE'],
                'total_qty': int(row['QUANTITY']),
                'pct':       row['pct']
            }
            for _, row in market_data.iterrows()
        ],
        'category_volume': [
            {
                'category':    row['EQUIPMENT_CATEGORY'],
                'total_qty':   int(row['QUANTITY']),
                'pct_of_total': row['pct']
            }
            for _, row in cat_data.iterrows()
        ],
        'monthly_demand_history': monthly_hist.to_dict(orient='records'),
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f, indent=2, default=str)

    print(f'\nDashboard data generated: {OUTPUT_PATH}')
    print(f'   Total records:   {output["kpi_summary"]["total_orders"]:,}')
    print(f'   30-day forecast: {output["kpi_summary"]["total_qty_forecast_30d"]:,} units')
    print(f'   60-day forecast: {output["kpi_summary"]["total_qty_forecast_60d"]:,} units')
    print(f'   90-day forecast: {output["kpi_summary"]["total_qty_forecast_90d"]:,} units')

if __name__ == '__main__':
    main()
