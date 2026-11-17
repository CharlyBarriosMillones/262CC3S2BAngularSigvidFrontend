export interface ObjectResponse<T> {
  success: boolean;
  message: string;
  object: T;
}