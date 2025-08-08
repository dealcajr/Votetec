import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

export const ai = genkit({
  plugins: [
    googleAI({
      // Specify the model information, such as the temperature.
      // gemini-pro-vision is required for image processing.
      //generationConfig: { temperature: 0.2 },
    }),
  ],
  // Log all telemetry to the console.
  logLevel: "debug",
  // Perform all flow operations locally.
  flowStateStore: "firebase",
  traceStore: "firebase",
});
