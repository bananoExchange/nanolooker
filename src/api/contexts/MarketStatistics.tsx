import * as React from "react";
import qs from "qs";
import { PreferencesContext } from "./Preferences";

export const TOTAL_CONFIRMATIONS_24H = "TOTAL_CONFIRMATIONS_24H";
export const TOTAL_VOLUME_24H = "TOTAL_VOLUME_24H";
export const TOTAL_CONFIRMATIONS_48H = "TOTAL_CONFIRMATIONS_48H";
export const TOTAL_VOLUME_48H = "TOTAL_VOLUME_48H";

export interface Response {
  [TOTAL_CONFIRMATIONS_24H]: number;
  [TOTAL_VOLUME_24H]: number;
  [TOTAL_CONFIRMATIONS_48H]: number;
  [TOTAL_VOLUME_48H]: number;
  marketCapRank: number;
  marketCapRank24h: number;
  marketCap: number;
  marketCapChangePercentage24h: number;
  volume24h: number;
  currentPrice: number;
  change24h: number;
  totalSupply: number;
  circulatingSupply: number;
  priceStats: any;
  dogeMarketStats: any;
}

export interface Context {
  marketStatistics: Response;
  getMarketStatistics: Function;
  isInitialLoading: boolean;
  setIsInitialLoading: Function;
  isLoading: boolean;
  isError: boolean;
}

let pollMarketStatisticsTimeout: number | undefined;

export const MarketStatisticsContext = React.createContext<Context>({
  marketStatistics: {
    [TOTAL_CONFIRMATIONS_24H]: 0,
    [TOTAL_VOLUME_24H]: 0,
    [TOTAL_CONFIRMATIONS_48H]: 0,
    [TOTAL_VOLUME_48H]: 0,
    marketCapRank: 0,
    marketCapRank24h: 0,
    marketCap: 0,
    marketCapChangePercentage24h: 0,
    volume24h: 0,
    currentPrice: 0,
    change24h: 0,
    totalSupply: 0,
    circulatingSupply: 0,
    priceStats: {},
    dogeMarketStats: {}
  },
  getMarketStatistics: () => {},
  setIsInitialLoading: () => {},
  isInitialLoading: false,
  isLoading: false,
  isError: false,
});

const Provider: React.FC = ({ children }) => {
  const [marketStatistics, setMarketStatistics] = React.useState(
    {} as Response,
  );
  const [isInitialLoading, setIsInitialLoading] = React.useState<boolean>(true);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isError, setIsError] = React.useState<boolean>(false);
  const { fiat, cryptocurrency } = React.useContext(PreferencesContext);

  const getMarketStatistics = async (fiat: string) => {
    clearTimeout(pollMarketStatisticsTimeout);
    let isError = false;

    setIsLoading(true);
    try {
      const query = qs.stringify(
        { fiat, cryptocurrency: !!cryptocurrency?.length },
        {
          addQueryPrefix: true,
        },
      );
      const res = await fetch(`/api/market-statistics${query}`);
      const json = await res.json();

      if (!json || json.error) {
        isError = true;
      } else {
        setMarketStatistics(json);
      }
    } catch (e) {
      isError = true;
    }
    setIsInitialLoading(false);
    setIsLoading(false);
    setIsError(isError);

    pollMarketStatisticsTimeout = window.setTimeout(
      () => {
        getMarketStatistics(fiat);
      },
      isError ? 5000 : 25000,
    );
  };

  React.useEffect(() => {
    getMarketStatistics(fiat);

    return () => {
      clearTimeout(pollMarketStatisticsTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptocurrency]);

  React.useEffect(() => {
    function visibilityChange() {
      if (document.visibilityState === "visible") {
        getMarketStatistics(fiat);
      } else {
        clearTimeout(pollMarketStatisticsTimeout);
      }
    }

    window.addEventListener("visibilitychange", visibilityChange);

    return () => {
      window.removeEventListener("visibilitychange", visibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MarketStatisticsContext.Provider
      value={{
        marketStatistics,
        getMarketStatistics,
        isInitialLoading,
        setIsInitialLoading,
        isLoading,
        isError,
      }}
    >
      {children}
    </MarketStatisticsContext.Provider>
  );
};

export default Provider;
