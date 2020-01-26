import React from "react";

const SEARCH_HISTORY_KEY: string = "SEARCH_HISTORY";
const MAX_HISTORY = 10;

interface UseSearchHistoryReturn {
  searchHistory: string[];
  addSearchHistory: Function;
  removeSearchHistory: Function;
}

const getSearchHistory = (): Array<string> => {
  let searchHistory;
  try {
    searchHistory = JSON.parse(
      window.localStorage.getItem(SEARCH_HISTORY_KEY) || ""
    );
  } catch (_e) {}

  return searchHistory || [];
};

const useSearchHistory = (): UseSearchHistoryReturn => {
  const [searchHistory, setSearchHistory] = React.useState<Array<string>>(
    getSearchHistory()
  );

  const addSearchHistory = React.useCallback(
    (value: string) => {
      if (searchHistory.includes(value)) return;

      // @TODO: check for nano/xrb prefix
      const newSearchHistory = [value]
        .concat(searchHistory)
        .slice(0, MAX_HISTORY);

      localStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(newSearchHistory)
      );

      setSearchHistory(newSearchHistory);
    },
    [searchHistory]
  );

  const removeSearchHistory = React.useCallback(
    (value: string) => {
      console.log("~~~searchHistory", searchHistory);
      const newSearchHistory = searchHistory.filter(h => h !== value);
      console.log("~~~newSearchHistory", newSearchHistory);
      localStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(newSearchHistory)
      );

      setSearchHistory(newSearchHistory);
    },
    [searchHistory]
  );

  return { searchHistory, addSearchHistory, removeSearchHistory };
};

export default useSearchHistory;