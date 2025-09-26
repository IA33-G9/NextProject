export class UserIdGenerator {
  private epoch: number;
  private instanceId: number;
  private sequence: number = 0;

  constructor(epoch: Date, instanceId: number) {
    this.epoch = epoch.getTime();
    this.instanceId = instanceId;
  }

  public generate(): string {
    const timestamp = BigInt(Date.now() - this.epoch);
    const instance = BigInt(this.instanceId);
    this.sequence = (this.sequence + 1) & 4095;

    const id = (timestamp << BigInt(22)) | (instance << BigInt(12)) | BigInt(this.sequence);
    return id.toString(); // BigIntをstringに変換して返す
  }
}