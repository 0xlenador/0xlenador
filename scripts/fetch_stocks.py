import yfinance as yf
import json
import os
import concurrent.futures
from urllib.parse import urlparse

# Rutas de archivos relativas a la raíz del proyecto (ya que el script se corre desde allí)
TICKERS_FILE = 'src/content/data/tickers.txt'
OUTPUT_FILE = 'src/content/data/stocks_data.json'

def clean_domain(url):
    """Limpia la URL para obtener solo el dominio base para Clearbit (ej: apple.com)"""
    if not url:
        return ""
    if not url.startswith('http'):
        url = 'http://' + url
    try:
        domain = urlparse(url).netloc
        # Quitar 'www.' si existe
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except:
        return ""

def fetch_stock_data(ticker_symbol):
    """Extrae la información financiera de un solo ticker."""
    ticker_symbol = ticker_symbol.strip().upper()
    if not ticker_symbol:
        return None
        
    try:
        stock = yf.Ticker(ticker_symbol)
        info = stock.info
        
        # Yahoo finance a veces devuelve diccionarios vacíos si el ticker es inválido o hay rate limit
        if not info or 'symbol' not in info:
            print(f"[!] No se encontró información para {ticker_symbol}")
            return None
            
        # Extraer campos necesarios (usando .get() para evitar KeyErrors si falta un dato)
        price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
        fcf = info.get('freeCashflow')
        shares = info.get('sharesOutstanding') or info.get('impliedSharesOutstanding') or info.get('circulatingSupply')
        market_cap = info.get('marketCap')
        website = clean_domain(info.get('website', ''))
        name = info.get('shortName') or info.get('longName') or ticker_symbol

        # Ignoramos si faltan datos cruciales para la calculadora DCF (Precio o Shares)
        if price is None or shares is None or shares == 0:
            print(f"[!] Faltan datos financieros críticos (Precio o Acciones) para {ticker_symbol}")
            return None
            
        if market_cap is None:
            market_cap = price * shares
            
        # Si no hay FCF, usamos 0 (muchas empresas de crecimiento o en pérdida no tienen FCF positivo)
        if fcf is None:
            fcf = 0

        print(f"[OK] Descargado: {ticker_symbol} - Precio: ${price} - FCF: {fcf}")

        return {
            ticker_symbol: {
                "name": name,
                "price": price,
                "marketCap": market_cap,
                "fcf": fcf,
                "shares": shares,
                "website": website
            }
        }
    except Exception as e:
        print(f"[ERROR] Error descargando {ticker_symbol}: {e}")
        return None

def main():
    print(f"Iniciando descarga de acciones...")
    
    # Asegurarnos de que el directorio de destino exista
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    # Leer la lista de tickers
    if not os.path.exists(TICKERS_FILE):
        print(f"[ERROR] No se encontró el archivo {TICKERS_FILE}")
        return
        
    with open(TICKERS_FILE, 'r') as f:
        # Filtrar líneas vacías o comentarios
        tickers = [line.strip().upper() for line in f if line.strip() and not line.startswith('#')]
        
    print(f"Se encontraron {len(tickers)} tickers. Descargando en paralelo...")
    
    results = {}
    
    # Descargar en paralelo con un máximo de 10 trabajadores para no saturar la API
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        # submit() encola las tareas
        future_to_ticker = {executor.submit(fetch_stock_data, t): t for t in tickers}
        
        # as_completed() produce resultados a medida que van terminando
        for future in concurrent.futures.as_completed(future_to_ticker):
            data = future.result()
            if data:
                # Add type='stock' to each item
                for k in data:
                    data[k]['type'] = 'stock'
                results.update(data)
                
    # Descargar Cryptos
    cryptos_file = 'src/content/data/cryptos.json'
    if os.path.exists(cryptos_file):
        print(f"Iniciando descarga de criptomonedas...")
        with open(cryptos_file, 'r', encoding='utf-8') as f:
            cryptos_data = json.load(f)
            
        crypto_tickers = list(cryptos_data.keys())
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_crypto = {executor.submit(fetch_stock_data, t): t for t in crypto_tickers}
            for future in concurrent.futures.as_completed(future_to_crypto):
                data = future.result()
                if data:
                    for k in data:
                        data[k]['type'] = 'crypto'
                        # Use the FCF from cryptos.json instead of Yahoo
                        data[k]['fcf'] = cryptos_data[k].get('fcf', 0)
                        # Override name if provided
                        data[k]['name'] = cryptos_data[k].get('name', data[k]['name'])
                    results.update(data)
                
    # Ordenar los resultados alfabéticamente por Ticker
    results = dict(sorted(results.items()))
    
    # Guardar en JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"[COMPLETADO] Proceso completado. Se guardaron {len(results)} empresas en {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
