/**
 * Legacy backup adapter contract. The production application uses Prisma/PostgreSQL;
 * this interface keeps the optional backup module type-safe without introducing a
 * second database runtime into the web app.
 */
export interface DatabaseInterface {
  exportData(): Promise<Buffer>;
  importData(data: Buffer): Promise<void>;
}
