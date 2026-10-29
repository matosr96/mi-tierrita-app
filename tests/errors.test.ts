import { test } from "node:test";
import assert from "node:assert/strict";
import { AxiosError, AxiosHeaders } from "axios";
import { classifyError, toApiError } from "../src/lib/errors";

const axiosError = (opts: { status?: number; code?: string; message?: string; body?: unknown }) => {
  const err = new AxiosError(opts.message ?? "fallo", opts.code, { headers: new AxiosHeaders() }, undefined, opts.status === undefined ? undefined : { status: opts.status, statusText: "", headers: {}, config: { headers: new AxiosHeaders() }, data: opts.body });
  return err;
};

test("Tita: un timeout se distingue de una caída de red y ninguno de los dos trae código", () => {
  const timeout = classifyError(axiosError({ code: "ECONNABORTED", message: "timeout of 20000ms exceeded" }));
  assert.equal(timeout.kind, "timeout");
  assert.equal(timeout.retryable, false);
  const offline = classifyError(axiosError({ code: "ERR_NETWORK", message: "Network Error" }));
  assert.equal(offline.kind, "offline");
  assert.equal(offline.retryable, true);
});

test("Tita: un error con código nunca se reintenta solo y conserva el código reportable", () => {
  const forbidden = classifyError(axiosError({ status: 403, body: { message: "613" } }));
  assert.equal(forbidden.kind, "code");
  assert.equal(forbidden.code, "613");
  assert.equal(forbidden.retryable, false);
  assert.match(forbidden.message, /permiso/);
  assert.equal(toApiError(axiosError({ status: 404, body: { message: "662" } })).message, "La respuesta de Tita ya no está disponible. Pregunte de nuevo.");
});
