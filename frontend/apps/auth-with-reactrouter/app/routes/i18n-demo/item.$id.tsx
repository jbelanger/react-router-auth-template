import { useParams } from 'react-router';

export default function I18nDemoItem() {
   const { id } = useParams();

   return (
      <div className="rounded-lg border border-green-400 bg-green-50 p-6 shadow dark:border-green-600 dark:bg-green-800 dark:text-gray-100">
         <h1 className="mb-4 text-2xl font-bold">i18n Demo Item Page</h1>
         <p className="mb-4">This page demonstrates using I18nLink with a route parameter.</p>
         <p className="mb-4">
            Item ID: <strong>{id}</strong>
         </p>
      </div>
   );
}
