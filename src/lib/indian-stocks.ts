export type IndianStock = { symbol: string; name: string; exchange: "NSE" | "BSE" | "INDEX"; sector?: string };

export const INDIAN_STOCKS: IndianStock[] = [
  { symbol: "^NSEI", name: "Nifty 50 Index", exchange: "INDEX", sector: "Index" },
  { symbol: "^BSESN", name: "Sensex Index", exchange: "INDEX", sector: "Index" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE", sector: "Energy" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", exchange: "NSE", sector: "IT" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", exchange: "NSE", sector: "Banking" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", exchange: "NSE", sector: "Banking" },
  { symbol: "INFY.NS", name: "Infosys", exchange: "NSE", sector: "IT" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", exchange: "NSE", sector: "Telecom" },
  { symbol: "SBIN.NS", name: "State Bank of India", exchange: "NSE", sector: "Banking" },
  { symbol: "LICI.NS", name: "Life Insurance Corporation of India", exchange: "NSE", sector: "Insurance" },
  { symbol: "ITC.NS", name: "ITC", exchange: "NSE", sector: "FMCG" },
  { symbol: "LT.NS", name: "Larsen & Toubro", exchange: "NSE", sector: "Infrastructure" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", exchange: "NSE", sector: "FMCG" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", exchange: "NSE", sector: "NBFC" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", exchange: "NSE", sector: "IT" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki India", exchange: "NSE", sector: "Auto" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", exchange: "NSE", sector: "Pharma" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", exchange: "NSE", sector: "Banking" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", exchange: "NSE", sector: "Banking" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", exchange: "NSE", sector: "Cement" },
  { symbol: "TITAN.NS", name: "Titan Company", exchange: "NSE", sector: "Consumer" },
  { symbol: "ONGC.NS", name: "Oil and Natural Gas Corporation", exchange: "NSE", sector: "Energy" },
  { symbol: "NTPC.NS", name: "NTPC", exchange: "NSE", sector: "Power" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation", exchange: "NSE", sector: "Power" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", exchange: "NSE", sector: "Auto" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", exchange: "NSE", sector: "Auto" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", exchange: "NSE", sector: "Diversified" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports", exchange: "NSE", sector: "Logistics" },
  { symbol: "COALINDIA.NS", name: "Coal India", exchange: "NSE", sector: "Mining" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", exchange: "NSE", sector: "Metals" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", exchange: "NSE", sector: "Metals" },
  { symbol: "WIPRO.NS", name: "Wipro", exchange: "NSE", sector: "IT" },
  { symbol: "TECHM.NS", name: "Tech Mahindra", exchange: "NSE", sector: "IT" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", exchange: "NSE", sector: "Paints" },
  { symbol: "NESTLEIND.NS", name: "Nestle India", exchange: "NSE", sector: "FMCG" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", exchange: "NSE", sector: "Financials" },
  { symbol: "GRASIM.NS", name: "Grasim Industries", exchange: "NSE", sector: "Diversified" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", exchange: "NSE", sector: "Metals" },
  { symbol: "CIPLA.NS", name: "Cipla", exchange: "NSE", sector: "Pharma" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", exchange: "NSE", sector: "Pharma" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", exchange: "NSE", sector: "Auto" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", exchange: "NSE", sector: "Auto" },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals", exchange: "NSE", sector: "Healthcare" },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", exchange: "NSE", sector: "FMCG" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", exchange: "NSE", sector: "Pharma" },
];

export function searchIndianStocks(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return INDIAN_STOCKS.slice(0, 20);
  return INDIAN_STOCKS.filter((s) =>
    s.symbol.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.sector?.toLowerCase().includes(q)
  ).slice(0, 25);
}
