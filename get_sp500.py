import urllib.request
import csv
import io

url = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req).read().decode('utf-8')
    reader = csv.reader(io.StringIO(response))
    next(reader) # skip header
    tickers = [row[0] for row in reader]
    
    # Just grab top 500
    tickers = tickers[:500]
    
    out_file = 'src/content/data/tickers.txt'
    with open(out_file, 'w') as f:
        f.write('\n'.join(tickers))
    print(f"Success! Wrote {len(tickers)} tickers to {out_file}")
except Exception as e:
    print(f"Error: {e}")
