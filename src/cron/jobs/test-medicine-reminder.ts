//@ts-nocheck
import { sendMedicineReminder } from "./medicine-reminder";

console.log("Testing medicine reminder...");

sendMedicineReminder()
  .then(() => {
    console.log("✅ Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
