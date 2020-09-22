export interface IMessage<T> {
  command: Command;
  payload: T;
}

type Command = "update" | "openFile";
