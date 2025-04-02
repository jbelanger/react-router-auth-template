import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext, HandleErrorFunction } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import commonEn from '~/../public/locales/en/common.json';
import commonFr from '~/../public/locales/fr/common.json';
import layoutEn from '~/../public/locales/en/layout.json';
import layoutFr from '~/../public/locales/fr/layout.json';
import { I18nextProvider } from "react-i18next";
import { createI18nServer } from "@gc-fwcs/i18n/server";
import i18nRoutes from "./routes";
import { getLanguage } from "@gc-fwcs/i18n";

export const streamTimeout = 5_000;

export const handleError: HandleErrorFunction = (
  error,
  request
) => {
  // React Router may abort some interrupted requests, don't log those
  if (!request.request.signal.aborted) {
    //myReportError(error);

    // make sure to still log the error so you can see it
    console.error(error);
  }
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
  // If you have middleware enabled:
  // loadContext: unstable_RouterContextProvider
) {

  const i18n = await createI18nServer(
    request,
    routerContext,
    i18nRoutes,
    {
      resources: {
        en: {
          common: commonEn,
          layout: layoutEn
        },
        fr: {
          common: commonFr,
          layout: layoutFr
        },
      }
    }
  );

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    let readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18n}>
      <ServerRouter context={routerContext} url={request.url} />
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    setTimeout(abort, streamTimeout + 1000);
  });
}
