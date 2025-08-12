import { I18nLink, I18nRoutesProvider, LanguageSwitchLink } from '@gc-fwcs/i18n/routing';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

import i18nRoutes from '~/routes';

export default function I18nDemoLayout() {
   const { t } = useTranslation('layout');

   return (
      <I18nRoutesProvider routes={i18nRoutes}>
         <div className="min-h-screen">
            <header className="bg-gray-800 p-4">
               <div className="container mx-auto flex items-center justify-between">
                  <h1 className="text-xl font-semibold text-white">{t('i18n Demo')}</h1>
                  <div className="flex space-x-4">
                     <I18nLink to="/i18n-demo" className="text-white hover:text-gray-400">
                        Home
                     </I18nLink>
                     <LanguageSwitchLink className="text-white hover:text-gray-400" frText="FR" enText="EN" />
                  </div>
               </div>
            </header>
            <main className="container mx-auto p-4">
               <Outlet />
            </main>
         </div>
      </I18nRoutesProvider>
   );
}
