export interface IMessage<T> {
  command: "update";
  payload: T;
}
