import * as fs from "fs";
import Ajv, { ValidateFunction } from "ajv";
import { globSync } from "glob";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";

function createAjvInstance(): { ajv: Ajv; validate: ValidateFunction } {
  const ajv = new Ajv({
    // strict: true,
    allowUnionTypes: true,
  });
  addFormats(ajv);
  const schema = JSON.parse(readFileSync("schema/schema.json", "utf8"));
  const validate = ajv.compile(schema);

  return { ajv, validate };
}

function validateJsonBlocks(
  validate: ValidateFunction,
  filePath: string,
): void {
  const content = fs.readFileSync(filePath, "utf8");
  const jsonBlocks = content.match(/```json\s*\n([\s\S]*?)\n\s*```/g);

  if (!jsonBlocks) {
    console.log("No JSON blocks found in the file.");
    return;
  }

  jsonBlocks.forEach((block, index) => {
    try {
      const jsonContent = block.replace(/```json\s*\n|\n\s*```/g, "");
      const parsedJson = JSON.parse(jsonContent);
      const valid = validate(parsedJson);

      if (valid) {
        console.log(`JSON block ${index + 1} is valid.`);
      } else {
        console.log(`JSON block ${index + 1} is invalid:`);
        console.log(parsedJson);
        console.log(validate.errors);
      }
    } catch (error) {
      console.error(
        `Error parsing JSON block ${index + 1}:`,
        (error as Error).message,
      );
    }
  });
}

const { validate } = createAjvInstance();

// Usage
const mdFiles = globSync("examples/**/*.md", {});

mdFiles.forEach((filePath) => {
  console.log(`Validating JSON blocks in ${filePath}:`);
  validateJsonBlocks(validate, filePath);
  console.log("\n"); // Add a newline for separation between files
});
