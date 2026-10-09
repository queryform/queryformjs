export interface ParameterMapping { param: string; class_name: string; }
export interface StoredParameter { class_name: string; value: string; }
export interface QueryFormData {
  params?: ParameterMapping[];
  values?: Record<string, StoredParameter>;
  cacheUntil?: string | null;
}
export interface QueryFormOptions {
  local?: boolean;
  debug?: boolean;
  /** Use isolated storage; starts a separate attribution history. */
  scopedStorage?: boolean;
  emitEvents?: boolean;
  clearEmptyValues?: boolean;
  expandedFields?: boolean;
}
export default class QueryForm {
  constructor(websiteId?: string | null, apiRoute?: string);
  websiteId: string | null;
  apiRoute: string;
  domainUTMs: ParameterMapping[];
  debug: boolean;
  local: boolean;
  cacheUntil: string | null;
  ready: boolean;
  storageKey: string;
  init(config?: QueryFormOptions, parameters?: ParameterMapping[]): Promise<void>;
  fetchDomainParams(): Promise<void>;
  fetchLocalParams(parameters: ParameterMapping[]): void;
  configureQueryform(): void;
  logMessage(message: unknown): void;
  isLocalStorageAvailable(): boolean;
  parseURLParams(): Record<string, string> | null;
  storeParams(parameters: Record<string, string> | null): void;
  populateFormInputs(values: Record<string, StoredParameter> | undefined, mappings: ParameterMapping[]): void;
  saveQueryformData(params: ParameterMapping[], values: Record<string, StoredParameter>, cacheUntil?: string | null): QueryFormData;
  refresh(): void;
  capture(): void;
  populate(): void;
  clear(): void;
  getStoredParams(): ParameterMapping[] | undefined;
  getStoredParamValues(): Record<string, StoredParameter> | undefined;
  getSavedQueryformData(): QueryFormData;
  getCacheUntil(): string | null | undefined;
}
