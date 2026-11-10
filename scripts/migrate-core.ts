import "dotenv/config";
import { migrarCore } from "./db-utils";

migrarCore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[db] error al migrar core:", error);
    process.exit(1);
  });
