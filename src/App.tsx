import ThreeCanvas from "./components/ThreeCanvas";
import PortfolioOverlay from "./components/PortfolioOverlay";
import NavBar from "./components/NavBar";
import LobbyOverlay from "./components/LobbyOverlay";
import GameHUD from "./components/GameHUD";
import GameOverCard from "./components/GameOverCard";
import { useGameStore } from "./store/gameStore";

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const showNav = phase === "PORTFOLIO";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white">
      <ThreeCanvas />
      {showNav && <NavBar />}
      <PortfolioOverlay />
      <LobbyOverlay />
      <GameHUD />
      <GameOverCard />
    </div>
  );
}
