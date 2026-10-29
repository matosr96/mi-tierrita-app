import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { executeAiAction } from "@/services/ai";
import { toApiError } from "@/lib/errors";
import type { ActionState } from "@/stores/ai";
import type { AiActionStatus, AiProposal, TitaActionInput } from "@/types/api";
import { ActionCard, ReportCard, reportHref } from "./TitaConversation";
import styles from "./TitaProposalCards.module.css";

type Props = {
  proposals: AiProposal[];
  /** Cómo quedó cada tarjeta (lo guarda la API para que todos lo vean). */
  actions: Record<string, { status: AiActionStatus; note?: string }> | null;
  /** Solo quien invocó a Tita puede confirmar o descartar. */
  canAct: boolean;
  /** Nombre de quien invocó, para explicarle al resto a quién le toca decidir. */
  ownerName: string;
  /** Guarda el estado final de una tarjeta en el servidor. */
  persist: (input: TitaActionInput) => Promise<void>;
};

const STATUS_TEXT: Record<AiActionStatus, string> = { idle: "pendiente de que confirme", running: "registrándose", done: "confirmada", failed: "falló", dismissed: "descartada" };

/** Resumen corto de lo que devolvió la API al ejecutar una tarjeta. */
const outcome = (data: unknown): string => {
  if (!data || typeof data !== "object") return "listo";
  const d = data as Record<string, unknown>;
  if (typeof d["invoiceNumber"] === "string") return `factura ${d["invoiceNumber"]}`;
  if (typeof d["id"] === "number") return `id ${d["id"]}`;
  return "listo";
};

/**
 * Tarjetas de una respuesta de Tita fuera de su conversación (mensaje del chat o comentario de un registro). Quien la
 * mencionó ve Confirmar / Descartar y ejecuta contra la API real (misma lista cerrada y auditoría que en Tita); los
 * demás ven qué propuso y cómo quedó.
 */
export const TitaProposalCards = ({ proposals, actions, canAct, ownerName, persist }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<Record<number, ActionState>>({});
  if (proposals.length === 0) return null;
  const stateOf = (i: number): ActionState | undefined => local[i] ?? (actions?.[String(i)] as ActionState | undefined);

  const run = async (i: number, p: Extract<AiProposal, { type: "action" }>) => {
    setLocal((s) => ({ ...s, [i]: { status: "running" } }));
    try {
      const note = outcome(await executeAiAction(p.request));
      setLocal((s) => ({ ...s, [i]: { status: "done", note } }));
      await persist({ index: i, status: "done", note });
      await queryClient.invalidateQueries();
    } catch (err) {
      const note = err instanceof Error && err.message === "Acción no permitida" ? err.message : toApiError(err).message;
      setLocal((s) => ({ ...s, [i]: { status: "failed", note } }));
      await persist({ index: i, status: "failed", note }).catch(() => undefined);
    }
  };
  const dismiss = async (i: number) => {
    setLocal((s) => ({ ...s, [i]: { status: "dismissed" } }));
    await persist({ index: i, status: "dismissed" }).catch(() => undefined);
  };

  return (
    <div className={styles.cards}>
      {proposals.map((p, i) =>
        p.type === "report" ? (
          <ReportCard key={i} r={p} onOpen={() => navigate(reportHref(p))} />
        ) : canAct ? (
          <ActionCard key={i} a={p} state={stateOf(i)} onRun={() => void run(i, p)} onDismiss={() => void dismiss(i)} />
        ) : (
          <p key={i} className={styles.other}>
            Tarjeta para {ownerName}: <strong>{p.title}</strong> · {STATUS_TEXT[stateOf(i)?.status ?? "idle"]}
          </p>
        ),
      )}
    </div>
  );
};
