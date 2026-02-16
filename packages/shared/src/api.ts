export interface IApiResponse<T> {
  data: T;
  error?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}
