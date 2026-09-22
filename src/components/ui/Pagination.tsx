import type { Page } from "@/types/api";
import { Button } from "./Button";
import styles from "./Pagination.module.css";

type Props = { page: Page<unknown>; onPage: (page: number) => void };

/** Contrato uniforme { count, page, pages, items } de todos los listados. */
export const Pagination = ({ page, onPage }: Props) => {
  if (page.pages <= 1) return null;
  return (
    <div className={styles.bar}>
      <span>
        {page.count} registros · página {page.page} de {page.pages}
      </span>
      <div className={styles.buttons}>
        <Button variant="secondary" size="sm" disabled={page.page <= 1} onClick={() => onPage(page.page - 1)}>
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={page.page >= page.pages} onClick={() => onPage(page.page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
};
