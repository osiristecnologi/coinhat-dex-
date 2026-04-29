// server/dexscreener.ts

export async function searchDexScreener(query: string) {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
  const data = await res.json();

  if (!data?.pairs) return [];

  return data.pairs.map((pair: any) => ({
    name: pair.baseToken?.name || "",
    symbol: pair.baseToken?.symbol || "",
    address: pair.baseToken?.address || "",
    chainId: pair.chainId,
    priceUsd: pair.priceUsd,
    liquidity: pair.liquidity?.usd,
    volume24h: pair.volume?.h24,
    // ❌ REMOVE ISSO:
    // url: pair.url
  }));
}

export async function getTrendingTokens() {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens`);
  const data = await res.json();

  if (!data?.pairs) return [];

  return data.pairs.map((pair: any) => ({
    name: pair.baseToken?.name || "",
    symbol: pair.baseToken?.symbol || "",
    address: pair.baseToken?.address || "",
    chainId: pair.chainId,
    priceUsd: pair.priceUsd,
  }));
}

export async function getLatestTokens() {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs`);
  const data = await res.json();

  if (!data?.pairs) return [];

  return data.pairs.map((pair: any) => ({
    name: pair.baseToken?.name || "",
    symbol: pair.baseToken?.symbol || "",
    address: pair.baseToken?.address || "",
    chainId: pair.chainId,
  }));
}

