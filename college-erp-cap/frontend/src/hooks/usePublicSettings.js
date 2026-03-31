import { useContext } from "react";
import { PublicSettingsContext } from "../context/PublicSettingsContext";

export const usePublicSettings = () => {
  return useContext(PublicSettingsContext);
};
