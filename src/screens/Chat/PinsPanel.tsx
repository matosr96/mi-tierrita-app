import type { UseQueryResult } from "@tanstack/react-query";
import type { ChatMessage } from "@/types/api";
import { PinsList } from "./PinsList";
import { SidePanel } from "./SidePanel";

/** Panel lateral con los mensajes fijados de la conversación. */
export const PinsPanel = ({
  pins,
  where,
  canUnpin,
  onOpen,
  onUnpin,
  onClose,
}: {
  pins: UseQueryResult<{ items: ChatMessage[] }>;
  where: string;
  canUnpin: boolean;
  onOpen: (m: ChatMessage) => void;
  onUnpin: (m: ChatMessage) => void;
  onClose: () => void;
}) => (
  <SidePanel title="Mensajes fijados" subtitle={where} onClose={onClose}>
    <PinsList pins={pins} canUnpin={canUnpin} onOpen={onOpen} onUnpin={onUnpin} />
  </SidePanel>
);
