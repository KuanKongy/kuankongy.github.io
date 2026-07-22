import type { CharacterId } from "../../../store/gameStore";
import type { CharacterHandle } from "./types";
import { createOwl } from "./Owl";
import { createWizard } from "./Wizard";
import { createOctopus } from "./Octopus";

export type { CharacterHandle } from "./types";

export function createCharacter(id: CharacterId): CharacterHandle {
  switch (id) {
    case "WIZARD":
      return createWizard();
    case "OCTOPUS":
      return createOctopus();
    case "OWL":
    default:
      return createOwl();
  }
}
