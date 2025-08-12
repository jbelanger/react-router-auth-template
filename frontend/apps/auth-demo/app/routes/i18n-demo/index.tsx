import { I18nLink, getRouteLanguage } from '@gc-fwcs/i18n/routing';
import { getFixedT } from '@gc-fwcs/i18n/server';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';

import i18nRoutes from '~/routes';

export async function loader({ request }: LoaderFunctionArgs) {
   const lang = getRouteLanguage(request, i18nRoutes);
   const t = await getFixedT(lang, 'layout');
   const serverTranslation = t('This is server-side translated');
   return { serverTranslation };
}

export default function I18nDemoHome() {
   const { t, i18n } = useTranslation('layout');
   const { serverTranslation } = useLoaderData() as { serverTranslation: string };

   return (
      <div className="rounded-lg border border-blue-400 bg-blue-50 p-6 shadow dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
         <h1 className="mb-6 text-3xl font-bold text-blue-800 dark:text-blue-300">{t('i18n Demo Home')}</h1>
         <p className="mb-4">
            Current language: <strong>{i18n.language}</strong>
         </p>
         <p className="mb-4">{t('This is a demonstration of internationalization features.')}</p>
         <p className="mb-4">{t('Switch languages using the buttons in the header.')}</p>
         <p className="mt-6 rounded border border-dashed border-gray-400 p-4 text-sm">
            Server-side translation: <strong>{serverTranslation}</strong>
         </p>
         <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">Demo: I18nLink with route parameter</h2>
            <p className="mb-2">Click the link below to navigate to an item page with ID 123:</p>
            <I18nLink
               to="/i18n-demo/item/:id"
               params={{ id: '123' }}
               className="inline-block rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
               Go to Item 123
            </I18nLink>
         </div>
      </div>
   );
}
