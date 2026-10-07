declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    HVS_OWNER_USER_ID?: string;
    HVS_OWNER_USERNAME?: string;

    BUCKET?: R2Bucket;
  }
}
