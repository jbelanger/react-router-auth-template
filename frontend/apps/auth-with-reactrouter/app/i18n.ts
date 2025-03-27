import { createInstance, type LanguageDetectorModule } from "i18next";
import I18NextHttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { getServerEnv } from '~/utils/env.utils';
import commonEn from '~/../public/locales/en/common.json';
import commonFr from '~/../public/locales/fr/common.json';


    const i18n = createInstance();
    const { NODE_ENV } = getServerEnv(process.env);
    const I18NEXT_DEBUG = true;//NODE_ENV !== 'production';
    // const languageDetector = {
    //   type: 'languageDetector',
    //   detect: () => document?.documentElement?.lang ?? "en",
    // } satisfies LanguageDetectorModule;
  
    await i18n
      .use(initReactI18next)
      //.use(languageDetector)
      .use(I18NextHttpBackend)
      .init({
        appendNamespaceToMissingKey: true,
        debug: I18NEXT_DEBUG,
        defaultNS: "common",
        fallbackLng: "en",
        interpolation: {
          escapeValue: false,
        },
        // ns: namespaces,
        preload: ['en', 'fr'],
        supportedLngs: ["en", "fr"],
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
  
export default i18n;