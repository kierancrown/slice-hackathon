declare module "qrcode" {
  type ToDataUrlOptions = {
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  };

  const QRCode: {
    toDataURL: (text: string, options?: ToDataUrlOptions) => Promise<string>;
  };

  export default QRCode;
}
