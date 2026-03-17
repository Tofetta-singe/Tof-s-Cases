import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useDashboard(refreshKey) {
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null
  });

  useEffect(() => {
    let ignore = false;

    setState((current) => ({ ...current, loading: true, error: "" }));

    api("/dashboard")
      .then((data) => {
        if (!ignore) {
          setState({ loading: false, error: "", data });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({ loading: false, error: error.message, data: null });
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  return state;
}
