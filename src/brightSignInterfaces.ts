
export interface BsDeviceInfo {
  model : string;
  version : string;
  deviceUptime : number;
  deviceLifetime : number;
  deviceBootCount : number;
  bootVersion : string;
  deviceUniqueId : string;
  family : string;
};

export interface BSNetworkInterfaceConfig {
  metric : number;
  dhcpServerConfig : any;
  dnsServerList : string[];
  ipAddressList : any[];
  inboundShaperRate : number;
  mut: number;
  vlanIdList : number[];
  clientIdentifier : string;
  domain : string;
}

export interface BsLog {
  name : string;
  pass : boolean;
  result : string;
  info? : string[];
}

export interface BSInterfaceTestResult {
  ok : boolean;
  diagnosis : string;
  log : BsLog[];
}

export interface BsRegistry {
  read(sectionName : string, key? : string) : Promise<string>;
  write(sectionName : string, key : string, value : string) : Promise<any>;
}

export interface BsScreenshotParams {
  fileName : string;
  fileType? : string;
  description? : string;
  width? : number;
  height? : number;
  quality? : number;
  rotation? : number;
}

export interface BsScreenshot {
  asyncCapture(params : BsScreenshotParams) : Promise<any>;
}

export interface BsSize {
  width : number;
  height : number;
};

export interface AssetFetcherFileEvent {
  fileName : string;
  index : number;
  responseCode : number;
  error : string;
}

export interface AssetFetcherProgressEvent {
  fileName : string;
  index : number;
  total : number;
  currentFileTransferred : number;
  currentFileTotal : number;
}