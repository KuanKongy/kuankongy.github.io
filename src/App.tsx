import ThreeCanvas from "./components/ThreeCanvas";
import PortfolioOverlay from "./components/PortfolioOverlay";
import NavBar from "./components/NavBar";
import LobbyOverlay from "./components/LobbyOverlay";
import GameHUD from "./components/GameHUD";
import GameOverCard from "./components/GameOverCard";
import TouchControls from "./components/TouchControls";
import { useGameStore } from "./store/gameStore";

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const showNav = phase === "PORTFOLIO";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <ThreeCanvas />
      {showNav && <NavBar />}
      {/* Continues the scene's corner vignette OVER the navbar (the nav's
          light glass otherwise hides the top corners' charm). Portfolio
          only — game HUD elements live in those corners. */}
      {showNav && <div aria-hidden className="nav-vignette" />}
      <PortfolioOverlay />
      <LobbyOverlay />
      <GameHUD />
      <GameOverCard />
      <TouchControls />
    </div>
  );
}
