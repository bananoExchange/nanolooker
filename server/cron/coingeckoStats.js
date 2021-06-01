const fetch = require("node-fetch");
const cron = require("node-cron");
const { Sentry } = require("../sentry");
const { nodeCache } = require("../cache");
const {
  COINGECKO_MARKET_STATS,
  COINGECKO_DOGE_MARKET_STATS,
  COINGECKO_ALL_PRICE_STATS,
  COINGECKO_PRICE_STATS,
  SUPPORTED_CRYPTOCURRENCY,
} = require("../constants");

const defaultFiats = ["usd"];
const secondaryFiats = ["cad", "eur", "gbp", "cny", "jpy"];

const getPriceStats = async fiats => {
  let res;
  try {
    const ids = SUPPORTED_CRYPTOCURRENCY.map(({ id }) => id).join(",");

    for (let i = 0; i < fiats.length; i++) {
      const fiat = fiats[i];
      const resPrices = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${fiat}&include_24hr_change=true`,
      );
      const json = await resPrices.json();

      nodeCache.set(`${COINGECKO_ALL_PRICE_STATS}-${fiat}`, json);
      nodeCache.set(`${COINGECKO_PRICE_STATS}-${fiat}`, {
        bitcoin: json.bitcoin,
        banano: json.banano,
      });
    }
  } catch (err) {
    console.log("Error", err);
    Sentry.captureException(err, { extra: { res } });
  }
};

const getMarketStats = async fiats => {
  let res;
  try {
    for (let i = 0; i < fiats.length; i++) {
      const fiat = fiats[i];
      res = await fetch(
        "https://api.coingecko.com/api/v3/coins/banano?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=true",
      );

      const {
        market_cap_rank: marketCapRank,
        market_data: {
          market_cap_change_percentage_24h: marketCapChangePercentage24h,
          market_cap: { [fiat]: marketCap },
          total_volume: { [fiat]: volume24h },
          current_price: { [fiat]: currentPrice },
          price_change_percentage_24h: change24h,
          total_supply: totalSupply,
          circulating_supply: circulatingSupply,
        },
      } = await res.json();

      const marketStats = {
        marketCapRank,
        marketCap,
        marketCapChangePercentage24h,
        volume24h,
        totalSupply,
        circulatingSupply,
        currentPrice,
        change24h,
      };

      nodeCache.set(`${COINGECKO_MARKET_STATS}-${fiat}`, marketStats);
    }
  } catch (err) {
    console.log("Error", err);
    Sentry.captureException(err, { extra: { res } });
  }
};

const getDogeMarketStats = async fiats => {
  let res;
  try {
    for (let i = 0; i < fiats.length; i++) {
      const fiat = fiats[i];
      res = await fetch(
        "https://api.coingecko.com/api/v3/coins/dogecoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false",
      );

      const {
        market_cap_rank: marketCapRank,
        market_data: {
          market_cap: { [fiat]: marketCap },
          current_price: { [fiat]: currentPrice },
          circulating_supply: circulatingSupply,
        },
      } = await res.json();

      const marketStats = {
        marketCapRank,
        marketCap,
        circulatingSupply,
        currentPrice,
      };

      nodeCache.set(`${COINGECKO_DOGE_MARKET_STATS}-${fiat}`, marketStats);
    }
  } catch (err) {
    console.log("Error", err);
    Sentry.captureException(err, { extra: { res } });
  }
};

// Every 50 seconds
cron.schedule("*/50 * * * * *", async () => {
  getPriceStats(defaultFiats);
  getMarketStats(defaultFiats);
});

// https://crontab.guru/#*/3_*_*_*_*
// At every 3nd minute.
cron.schedule("*/3 * * * *", async () => {
  getPriceStats(secondaryFiats);
  getMarketStats(secondaryFiats);
});

getPriceStats(defaultFiats);
getMarketStats(defaultFiats);
getDogeMarketStats(defaultFiats);

if (process.env.NODE_ENV === "production") {
  getPriceStats(secondaryFiats);
  getMarketStats(secondaryFiats);
  getDogeMarketStats(secondaryFiats);
}
