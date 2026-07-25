import urllib.request
import json
import re

def get_usd_krw_rate():
    try:
        url = "https://open.er-api.com/v6/latest/USD"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode())
            return data['rates']['KRW']
    except Exception as e:
        print(f"Exchange rate fetch error: {e}")
        return 1385.0

def get_stock_price(ticker):
    # 한국 주식 (6자리 숫자)
    if re.match(r'^\d{6}$', ticker):
        try:
            url = f"https://m.stock.naver.com/api/stock/{ticker}/basic"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as res:
                data = json.loads(res.read().decode())
                price_str = data['closePrice'].replace(',', '')
                return float(price_str)
        except Exception as e:
            print(f"Naver fetch error for {ticker}: {e}")
            ticker = f"{ticker}.KS"

    # 미국 주식 또는 해외 주식 (Yahoo Finance API)
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1d"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode())
            result = data['chart']['result'][0]
            price = result['meta']['regularMarketPrice']
            return float(price)
    except Exception as e:
        print(f"Yahoo fetch error for {ticker}: {e}")
        return None

if __name__ == "__main__":
    rate = get_usd_krw_rate()
    print(f"USD/KRW Exchange Rate: 1 USD = {rate:,.2f} KRW")
    
    tickers = ["TQQQ", "005930"]
    for t in tickers:
        p = get_stock_price(t)
        print(f"[{t}] Realtime Price: {p}")
