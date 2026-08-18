declare module "ali-oss" {
  type OSSConfig = { region?: string; accessKeyId?: string; accessKeySecret?: string; bucket?: string };
  type OSSResult = { url: string; content: Buffer };
  export default class OSS {
    constructor(config: OSSConfig);
    put(name: string, data: Buffer): Promise<OSSResult>;
    get(name: string): Promise<OSSResult>;
    delete(name: string): Promise<void>;
  }
}
