import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext, HandleErrorFunction } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import commonEn from '~/../public/locales/en/common.json';
import commonFr from '~/../public/locales/fr/common.json';
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { getLanguage } from "@gc-fwcs/i18n";
import i18nRoutes from "./routes";

// Server-side i18n initialization
export async function initServerI18n(locale = 'en') {
  const i18n = createInstance();
  
  await i18n
    .use(initReactI18next)
    .init({
      lng: locale,
      fallbackLng: 'en',
      supportedLngs: ['en', 'fr'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      resources: {
        en: {
          common: commonEn,
        },
        fr: {
          common: commonFr,
        },
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
}

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

  const locale = getLanguage(request, i18nRoutes);
  const i18n = await initServerI18n(locale);

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
