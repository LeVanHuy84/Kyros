import viJson from './vi.json';
import enJson from './en.json';

/**
 * Type-safe translation schema inferred directly from the master vi.json file.
 */
export type TranslationSchema = typeof viJson;

export const translations: Record<'vi' | 'en', TranslationSchema> = {
  vi: viJson,
  en: enJson,
};
