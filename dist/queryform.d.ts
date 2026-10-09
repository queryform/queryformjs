export interface ParameterMapping {
  param: string;
  class_name: string;
}
export interface StoredParameter {
  class_name: string;
  value: string;
}
export interface QueryFormOptions {
  local?: boolean;
  debug?: boolean;
}
export default class QueryForm {
  constructor(websiteId?: string | null, apiRoute?: string);
  init(config?: QueryFormOptions, parameters?: ParameterMapping[]): Promise<boolean>;
  refresh(): void;
  clear(): void;
  getStoredParams(): ParameterMapping[];
  getStoredParamValues(): Record<string, StoredParameter>;
  getSavedQueryformData(): {
    params: ParameterMapping[];
    values: Record<string, StoredParameter>;
    cacheUntil: null;
  };
  getCacheUntil(): null;
}
