import { createContext, useContext, useState } from "react";
import { Team } from "./types";

export interface TeamSetup {
  players: string[];
  spymaster: string;
}

export interface TeamContextValue {
  startingTeam: Team;
  red: TeamSetup;
  blue: TeamSetup;
  setStartingTeam: (t: Team) => void;
  setRed: (t: TeamSetup) => void;
  setBlue: (t: TeamSetup) => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [startingTeam, setStartingTeam] = useState<Team>("red");
  const [red, setRed] = useState<TeamSetup>({ players: [], spymaster: "" });
  const [blue, setBlue] = useState<TeamSetup>({ players: [], spymaster: "" });

  return (
    <TeamContext.Provider value={{ startingTeam, red, blue, setStartingTeam, setRed, setBlue }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam must be used inside TeamProvider");
  return ctx;
}
