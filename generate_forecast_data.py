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
FORECAST_WEEKS = 13 


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
df = df[df['QUANTITY'] > 0].copy()

    # Outlier handling via IQR clipping
Q3 = df['QUANTITY'].quantile(0.75)
IQR = Q3 - df['QUANTITY'].quantile(0.25)
df['QUANTITY'] = df['QUANTITY'].clip(upper=Q3 + 3.0 * IQR)

# ============================================================
# Category Rules (must match notebook)
# ============================================================
CATEGORY_RULES = {
    'Formwork Panels': [
        'panel', 'manto', 'rasto', 'topmax', 'topec', 'bearing', 'head support', 
        'pouring platform', 'corner', 'formwork', 'wall form', 'slab form', 'plywood', 'timber'
    ],
    'Accessories & Connectors': [
        'clamp', 'connector', 'tie rod', 'tie', 'bolt', 'nut', 'pin', 'wedge', 
        'hook', 'fastener', 'coupler', 'bracket', 'adapter', 'anchor', 'clip', 'plate'
    ],
    'Scaffolding Components': [
        'scaffold', 'ledger', 'transom', 'standard', 'tube', 'pipe', 'prop', 
        'europlus', 'tripod', 'tripod galv', 'retainer', 'base jack', 'support shoe', 
        'center tube', 'cuplok', 'ringlock', 'plank', 'board', 'base plate', 'jack'
    ],
    'Walers & Beams': [
        'waler', 'beam', 'girder', 'h20', 'rsj', 'channel'
    ],
    'Safety & Railings': [
        'railing', 'geländer', 'guard', 'toe board', 'safety', 'handrail', 'mesh', 'barrier', 'post'
    ],
    'Transport & Storage': [
        'box', 'container', 'pallet', 'storage', 'transport', 'erection rod', 'frame', 'rack', 'bin', 'stillage'
    ],
    'Alignment & Struts': [
        'strut', 'alignment', 'push pull', 'brace', 'shoring'
    ]
}


def classify_equipment(desc):
    if not isinstance(desc, str):
        return 'Other'
    d = desc.lower().replace("-", " ").replace("/", " ")
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


    # Create equipment category
df['EQUIPMENT_CATEGORY'] = (
        df['DESCRIPTION']
        .astype(str)
        .apply(classify_equipment)
    )

    # Create weekly date tracking
df['trx_week'] = (
        df['TRX_DATE']
        .dt.to_period('W')
        .dt.start_time
    )

    # Create hire dataframe
hire_df = (
        df[df['ORDER_TYPE'].astype(str).str.upper().str.contains("HIRE")]
        .copy()
    )

    # RECTIFIED: Align timeline to max data date to eliminate the gap
    # --------------------------------------------------------
max_data_date = hire_df['trx_week'].max()
forecast_ref = max_data_date if pd.notnull(max_data_date) else pd.Timestamp.now().normalize()
print(f"  Timeline Aligned. History ends at {forecast_ref.strftime('%Y-%m-%d')}. Forecasting forward...")

    # --------------------------------------------------------
    # 2. Load trained model
    # --------------------------------------------------------
if not os.path.exists(XGB_MODEL_PATH):
        raise FileNotFoundError(f'Model not found: {XGB_MODEL_PATH}')
xgb_model = joblib.load(XGB_MODEL_PATH)
with open(META_PATH) as f:
        meta = json.load(f)
FEATURE_COLS = meta['features']

    # --------------------------------------------------------
    # 3. Build weekly aggregate time series
    # --------------------------------------------------------
ts = (
        hire_df.groupby('trx_week')['QUANTITY']
        .sum()
        .reset_index()
        .rename(columns={'trx_week': 'week', 'QUANTITY': 'total_qty'})
        .sort_values('week')
        .reset_index(drop=True)

    )
# --------------------------------------------------------
    # 4. Recursive 90-day forecast with confidence intervals
    # --------------------------------------------------------
print('  Generating dynamic aggregate forecasts...')
ts_ext = ts.copy()
future_preds = []

for i in range(FORECAST_WEEKS):
        future_week = forecast_ref + pd.Timedelta(weeks=i+1)
        feat = create_lag_features(ts_ext)
        feat_clean = feat.dropna()

        if len(feat_clean) == 0:
            pred = float(ts_ext['total_qty'].iloc[-1]) if len(ts_ext) > 0 else 0
        else:
            last_row = feat_clean.tail(1)[FEATURE_COLS]
            prediction = xgb_model.predict(last_row)
            pred = float(max(0, prediction[0]))

        # Append recursive row step back into extension dataframe for future lags
        ts_ext = pd.concat([
            ts_ext,
            pd.DataFrame({'week': [future_week], 'total_qty': [pred]})
        ], ignore_index=True)

        # RECTIFIED: Inject 'lower' and 'upper' ranges expected by Recharts
        future_preds.append({
            'week': future_week.strftime("%Y-%m-%d"),
            'forecast': round(pred),
            'lower': round(pred * 0.88),
            'upper': round(pred * 1.12)
        })

    # --------------------------------------------------------
    # 5. Dynamic Category Allocation
    # --------------------------------------------------------
cat_hire_summary = hire_df.groupby('EQUIPMENT_CATEGORY')['QUANTITY'].sum().reset_index()
total_hire_volume = cat_hire_summary['QUANTITY'].sum()
cat_hire_summary['pct'] = cat_hire_summary['QUANTITY'] / total_hire_volume if total_hire_volume > 0 else 0

category_forecast = {}
for cat in hire_df['EQUIPMENT_CATEGORY'].unique():
        pct_row = cat_hire_summary[cat_hire_summary['EQUIPMENT_CATEGORY'] == cat]
        pct_share = pct_row['pct'].values[0] if len(pct_row) > 0 else 0.0
        
        category_forecast[cat] = [
            {
                "week": p["week"],
                "forecast": round(p["forecast"] * pct_share),
                "lower": round(p["lower"] * pct_share),
                "upper": round(p["upper"] * pct_share)
            }
            for p in future_preds
        ]

    # RECTIFIED: Compute most demanded category for frontend KPI matching
most_demanded = "Other"
if len(cat_hire_summary) > 0:
        most_demanded = cat_hire_summary.sort_values(by='QUANTITY', ascending=False).iloc[0]['EQUIPMENT_CATEGORY']

    # --------------------------------------------------------
    # 6. Compile supporting metrics & Returns
    # --------------------------------------------------------
monthly_hist = df.groupby(df['TRX_DATE'].dt.to_period('M'))['QUANTITY'].sum().reset_index()
monthly_hist.columns = ['month', 'total_qty']
monthly_hist['month'] = monthly_hist['month'].astype(str)

market_data = df.groupby('OM_MARKET_TYPE')['QUANTITY'].sum().sort_values(ascending=False).reset_index()
total_qty = market_data['QUANTITY'].sum()
market_data['pct'] = (market_data['QUANTITY'] / total_qty * 100).round(1)

cat_data = df.groupby('EQUIPMENT_CATEGORY')['QUANTITY'].sum().sort_values(ascending=False).reset_index()
cat_data['pct'] = (cat_data['QUANTITY'] / total_qty * 100).round(1)

df_ret = df.dropna(subset=['PLANNED_RETURN_DATE']).copy()
df_ret = df_ret[df_ret['ORDER_TYPE'].astype(str).str.upper().str.contains("HIRE")]
df_ret['return_week'] = df_ret['PLANNED_RETURN_DATE'].dt.to_period('W').dt.start_time
    
weekly_return_forecast = {}
returns_all = df_ret.groupby('return_week')['QUANTITY'].sum().reset_index().rename(columns={'return_week': 'week', 'QUANTITY': 'expected_returns'}).sort_values('week').reset_index(drop=True)
returns_all = returns_all[returns_all['week'] >= forecast_ref].head(FORECAST_WEEKS)
    
    # Fill up missing weeks in returns if empty to avoid dashboard crashes
if len(returns_all) < FORECAST_WEEKS:
        extra_weeks = []
        existing_weeks = set(returns_all['week']) if len(returns_all) > 0 else set()
        for i in range(FORECAST_WEEKS):
            w = forecast_ref + pd.Timedelta(weeks=i+1)
            if w not in existing_weeks:
                extra_weeks.append({'week': w, 'expected_returns': 0})
        if extra_weeks:
            returns_all = pd.concat([returns_all, pd.DataFrame(extra_weeks)], ignore_index=True).sort_values('week')

returns_all['cumulative'] = returns_all['expected_returns'].cumsum()
weekly_return_forecast['all_categories'] = [
        {'week': str(row.week.date()), 'expected_returns': int(row.expected_returns), 'cumulative': int(row.cumulative)}
        for _, row in returns_all.iterrows()
    ]
    
    # Category returns
for cat in df_ret['EQUIPMENT_CATEGORY'].unique():
        returns_cat = df_ret[df_ret['EQUIPMENT_CATEGORY'] == cat].groupby('return_week')['QUANTITY'].sum().reset_index().rename(columns={'return_week': 'week', 'QUANTITY': 'expected_returns'}).sort_values('week').reset_index(drop=True)
        returns_cat = returns_cat[returns_cat['week'] >= forecast_ref].head(FORECAST_WEEKS)
        
        # Populate empty lists with matching dates if empty
        if len(returns_cat) == 0:
            weekly_return_forecast[cat] = [{'week': p['week'], 'expected_returns': 0, 'cumulative': 0} for p in future_preds]
            continue
            
        returns_cat['cumulative'] = returns_cat['expected_returns'].cumsum()
        weekly_return_forecast[cat] = [
            {"week": str(row.week.date()), "expected_returns": int(row.expected_returns), "cumulative": int(row.cumulative)}
            for _, row in returns_cat.iterrows()
        ]

    # Compute explicit summary numbers
qty_f_30d = int(sum(x["forecast"] for x in future_preds[:4]))
qty_f_60d = int(sum(x["forecast"] for x in future_preds[:8]))
qty_f_90d = int(sum(x["forecast"] for x in future_preds[:13]))
ret_30d = int(sum(x["expected_returns"] for x in weekly_return_forecast["all_categories"][:4]))
ret_60d = int(sum(x["expected_returns"] for x in weekly_return_forecast["all_categories"][:8]))
ret_90d = int(sum(x["expected_returns"] for x in weekly_return_forecast["all_categories"][:13]))

orderTypes = {
        "hire": int(df[df['ORDER_TYPE'].astype(str).str.upper().str.contains("HIRE")]['QUANTITY'].sum()),
        "sale": int(df[df['ORDER_TYPE'].astype(str).str.upper().str.contains("SALE")]['QUANTITY'].sum()),
        "oea": int(df[df['ORDER_TYPE'].astype(str).str.upper().str.contains("OEA|SCRAP|LOST")]['QUANTITY'].sum())
    }
attrition_breakdown = []
for cat in df['EQUIPMENT_CATEGORY'].unique():
        cat_df = df[df['EQUIPMENT_CATEGORY'] == cat]
        s_qty = int(cat_df[cat_df['ORDER_TYPE'].astype(str).str.upper().str.contains("SALE")]['QUANTITY'].sum())
        o_qty = int(cat_df[cat_df['ORDER_TYPE'].astype(str).str.upper().str.contains("OEA|SCRAP|LOST")]['QUANTITY'].sum())
        if s_qty + o_qty > 0:
            attrition_breakdown.append({"name": cat, "sale": s_qty, "oea": o_qty})
attrition_breakdown = sorted(attrition_breakdown, key=lambda x: x["sale"] + x["oea"], reverse=True)

    # --------------------------------------------------------
    # 7. Assemble final dashboard JSON configuration
    # --------------------------------------------------------
    # RECTIFIED: Included 'most_demanded_category' and all 'net_stock_XXd' keys 
    # to avoid empty widget spaces or calculation errors in Next.js UI cards.
output = {
        "orderTypes": {
            "summary": {"hire": orderTypes["hire"], "sale": orderTypes["sale"], "oea": orderTypes["oea"]},
            "attritionBreakdown": attrition_breakdown
        },
        "generated_at": datetime.now().strftime("%Y-%m-%d"),
        "model_used": "XGBoost (Recursive Lags)",
        "total_records": int(len(df)),
        "forecast_reference_date": forecast_ref.strftime("%Y-%m-%d"),
        "kpi_summary": {
            "total_orders": int(len(df)),
            "unique_equipment_types": int(df["DESCRIPTION"].nunique()),
            "avg_hire_duration_days": int(df["HIRE_DURATION"].median()),
            "most_demanded_category": most_demanded,
            "total_qty_forecast_30d": qty_f_30d,
            "total_qty_forecast_60d": qty_f_60d,
            "total_qty_forecast_90d": qty_f_90d,
            "expected_back_30d": ret_30d,
            "expected_back_60d": ret_60d,
            "expected_back_90d": ret_90d,
            "net_stock_30d": ret_30d - qty_f_30d,
            "net_stock_60d": ret_60d - qty_f_60d,
            "net_stock_90d": ret_90d - qty_f_90d
        },
        "weekly_demand_forecast": {
            "all_categories": future_preds,
            **category_forecast
        },
        "weekly_return_forecast": weekly_return_forecast,
        "market_breakdown": [
            {"market": row["OM_MARKET_TYPE"], "total_qty": int(row["QUANTITY"]), "pct": row["pct"]}
            for _, row in market_data.iterrows()
        ],
        "category_volume": [
            {"category": row["EQUIPMENT_CATEGORY"], "total_qty": int(row["QUANTITY"]), "pct_of_total": row["pct"]}
            for _, row in cat_data.iterrows()
        ],
        "monthly_demand_history": monthly_hist.to_dict(orient="records")
    }

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f, indent=2, default=str)

print(f'Dashboard JSON successfully generated at: {OUTPUT_PATH}')


# ============================================================
# Category Rules (must match notebook)
# ============================================================
CATEGORY_RULES = {
    'Formwork Panels': [
        'panel', 'manto', 'rasto', 'topmax', 'topec', 'bearing', 'head support', 
        'pouring platform', 'corner', 'formwork', 'wall form', 'slab form', 'plywood', 'timber'
    ],
    'Accessories & Connectors': [
        'clamp', 'connector', 'tie rod', 'tie', 'bolt', 'nut', 'pin', 'wedge', 
        'hook', 'fastener', 'coupler', 'bracket', 'adapter', 'anchor', 'clip', 'plate'
    ],
    'Scaffolding Components': [
        'scaffold', 'ledger', 'transom', 'standard', 'tube', 'pipe', 'prop', 
        'europlus', 'tripod', 'tripod galv', 'retainer', 'base jack', 'support shoe', 
        'center tube', 'cuplok', 'ringlock', 'plank', 'board', 'base plate', 'jack'
    ],
    'Walers & Beams': [
        'waler', 'beam', 'girder', 'h20', 'rsj', 'channel'
    ],
    'Safety & Railings': [
        'railing', 'geländer', 'guard', 'toe board', 'safety', 'handrail', 'mesh', 'barrier', 'post'
    ],
    'Transport & Storage': [
        'box', 'container', 'pallet', 'storage', 'transport', 'erection rod', 'frame', 'rack', 'bin', 'stillage'
    ],
    'Alignment & Struts': [
        'strut', 'alignment', 'push pull', 'brace', 'shoring'
    ]
}


def classify_equipment(desc):
    if not isinstance(desc, str):
        return 'Other'
    d = desc.lower().replace("-", " ").replace("/", " ")
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

orderTypes = {

    "hire": int(
        df[
            df['ORDER_TYPE']
            .astype(str)
            .str.upper()
            .str.contains("HIRE")
        ]['QUANTITY'].sum()
    ),


    "sale": int(
        df[
            df['ORDER_TYPE']
            .astype(str)
            .str.upper()
            .str.contains("SALE")
        ]['QUANTITY'].sum()
    ),


    "oea": int(
        df[
            df['ORDER_TYPE']
            .astype(str)
            .str.upper()
            .str.contains(
                "OEA|SCRAP|LOST"
            )
        ]['QUANTITY'].sum()
    )

}

# ============================================================
# Attrition Breakdown
# ============================================================

attrition_df = (
    df[
        df['ORDER_TYPE'].isin(
            ['SALE','OEA','SCRAP','LOST']
        )
    ]
    .groupby(
        ['EQUIPMENT_CATEGORY','ORDER_TYPE']
    )['QUANTITY']
    .sum()
    .reset_index()
)

    
 