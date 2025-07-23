import { atom } from "recoil";
import { channel } from "../components/User";

export const userSubscriptionsAtom = atom<channel[]>({
  key: "userSubscriptions",
  default: [],
});

export const userChannelsAtom = atom<channel[]>({
  key: "userChannels",
  default: [],
});
